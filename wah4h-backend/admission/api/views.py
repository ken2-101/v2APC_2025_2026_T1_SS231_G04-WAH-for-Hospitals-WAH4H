"""
admission/api/views.py

Hybrid ViewSets for the Admission Module.
CQRS-Lite Pattern: Read via QuerySet/ACL, Write via Service override.

Architecture Pattern: Fortress Pattern - API Layer
- Read Operations: Standard queryset with OutputSerializers
- Write Operations: Override create/update, delegate to Service Layer
- NO .save() calls on InputSerializers in ViewSets

Context: Philippine LGU Hospital System
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django_filters.rest_framework import DjangoFilterBackend

from admission.models import Encounter, Procedure
from admission.api.serializers import (
    EncounterInputSerializer,
    EncounterOutputSerializer,
    EncounterListOutputSerializer,
    EncounterDischargeInputSerializer,
    ProcedureInputSerializer,
    ProcedureOutputSerializer,
    ProcedureListOutputSerializer,
)
from admission.services.admission_services import EncounterService, ProcedureService
from admission.services.admission_acl import EncounterACL, ProcedureACL


class EncounterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Encounter (Admission) operations.
    
    CQRS-Lite Pattern:
    - Read: Standard queryset + EncounterOutputSerializer
    - Write: Override create/update, delegate to EncounterService
    
    Endpoints:
    - GET /api/encounters/ - List encounters
    - GET /api/encounters/{id}/ - Retrieve encounter details
    - POST /api/encounters/ - Admit patient (create encounter)
    - PUT /api/encounters/{id}/ - Update encounter
    - POST /api/encounters/{id}/discharge/ - Discharge patient
    """
    queryset = Encounter.objects.all().order_by('-period_start')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject_id', 'status', 'class_field']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return EncounterInputSerializer
        elif self.action == 'list':
            return EncounterListOutputSerializer
        elif self.action == 'retrieve':
            return EncounterOutputSerializer
        elif self.action == 'discharge':
            return EncounterDischargeInputSerializer
        return EncounterOutputSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List encounters with summary DTOs via ACL.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            # Convert to DTOs via ACL
            dto_list = []
            for encounter in page:
                dto = EncounterACL._encounter_to_summary_dict(encounter)
                dto_list.append(dto)
            
            serializer = self.get_serializer(dto_list, many=True)
            return self.get_paginated_response(serializer.data)
        
        # Non-paginated
        dto_list = []
        for encounter in queryset:
            dto = EncounterACL._encounter_to_summary_dict(encounter)
            dto_list.append(dto)
        
        serializer = self.get_serializer(dto_list, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve encounter details with enriched DTO via ACL.
        """
        encounter_id = kwargs.get('pk')
        encounter_dto = EncounterACL.get_encounter_details(encounter_id)
        
        if not encounter_dto:
            return Response(
                {'detail': 'Encounter not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(encounter_dto)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        Admit patient (create encounter).
        Delegates to EncounterService.admit_patient().
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to Service Layer
            encounter = EncounterService.admit_patient(serializer.validated_data)
            
            # Retrieve enriched DTO via ACL
            encounter_dto = EncounterACL.get_encounter_details(encounter.encounter_id)
            
            output_serializer = EncounterOutputSerializer(encounter_dto)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        except DjangoValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update encounter.
        Delegates to EncounterService.update_encounter().
        """
        encounter_id = kwargs.get('pk')
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to Service Layer
            encounter = EncounterService.update_encounter(
                encounter_id,
                serializer.validated_data
            )
            
            # Retrieve enriched DTO via ACL
            encounter_dto = EncounterACL.get_encounter_details(encounter.encounter_id)
            
            output_serializer = EncounterOutputSerializer(encounter_dto)
            return Response(output_serializer.data)
        
        except DjangoValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update encounter (same logic as update).
        """
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def discharge(self, request, pk=None):
        """
        Discharge patient (complete encounter).
        Delegates to EncounterService.discharge_patient().
        
        Endpoint: POST /api/encounters/{id}/discharge/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to Service Layer
            encounter = EncounterService.discharge_patient(
                pk,
                serializer.validated_data
            )
            
            # Retrieve enriched DTO via ACL
            encounter_dto = EncounterACL.get_encounter_details(encounter.encounter_id)
            
            output_serializer = EncounterOutputSerializer(encounter_dto)
            return Response(output_serializer.data)
        
        except DjangoValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def locations(self, request):
        """
        Get Location Hierarchy (Building -> Wing -> Ward -> Room)
        Dynamically calculates occupancy based on active encounters.
        """
        from admission.models import Encounter
        active_encounters = Encounter.objects.filter(status='in-progress')
        
        # Build occupancy map
        # Structure: { ward_code: count, room_code: count }
        occupancy = {}
        for enc in active_encounters:
            if enc.location_ids:
                # ids = [building, ward, room, bed]
                for code in enc.location_ids:
                    if code:
                        occupancy[code] = occupancy.get(code, 0) + 1

        # Mock Data Structure with dynamic occupancy
        data = {
           "buildings": [
             { "code": "MAIN", "name": "Main Building" },
             { "code": "ANNEX", "name": "Annex Building" }
           ],
           "wings": {
             "MAIN": [
               { "code": "MAIN-EAST", "name": "East Wing" },
               { "code": "MAIN-WEST", "name": "West Wing" }
             ],
             "ANNEX": [
               { "code": "ANNEX-NORTH", "name": "North Wing" }
             ]
           },
           "wards": {
             "MAIN-EAST": [
                 { "code": "GEN-WARD", "name": "General Ward", "type": "wa", "capacity": 20, "occupied": occupancy.get("GEN-WARD", 0) },
                 { "code": "ICU", "name": "Intensive Care Unit", "type": "su", "capacity": 10, "occupied": occupancy.get("ICU", 0) }
             ],
             "MAIN-WEST": [
                 { "code": "PEDIA", "name": "Pediatrics Ward", "type": "su", "capacity": 15, "occupied": occupancy.get("PEDIA", 0) }
             ],
             "ANNEX-NORTH": [
                 { "code": "ISO", "name": "Isolation Ward", "type": "su", "capacity": 8, "occupied": occupancy.get("ISO", 0) },
                 { "code": "ID-WARD", "name": "Infectious Disease", "type": "su", "capacity": 10, "occupied": occupancy.get("ID-WARD", 0) }
             ]
           },
           "corridors": {
             "GEN-WARD": [{ "code": "GEN-HALL-A", "name": "Hallway A" }, { "code": "GEN-HALL-B", "name": "Hallway B" }],
             "ICU": [{ "code": "ICU-HALL", "name": "Central Station" }],
             "PEDIA": [{ "code": "PED-HALL", "name": "Play Area Corridor" }],
             "ISO": [{ "code": "ISO-HALL", "name": "Secure Corridor" }],
             "ID-WARD": [{ "code": "ID-HALL", "name": "Bio-Containment Hall" }]
           },
           "rooms": {
             "GEN-HALL-A": [
               { "code": "GEN-101", "name": "Room 101", "beds": 4, "occupied": occupancy.get("GEN-101", 0) },
               { "code": "GEN-102", "name": "Room 102", "beds": 4, "occupied": occupancy.get("GEN-102", 0) },
               { "code": "GEN-103", "name": "Room 103", "beds": 4, "occupied": occupancy.get("GEN-103", 0) }
             ],
             "GEN-HALL-B": [
               { "code": "GEN-104", "name": "Room 104", "beds": 4, "occupied": occupancy.get("GEN-104", 0) },
               { "code": "GEN-105", "name": "Room 105", "beds": 4, "occupied": occupancy.get("GEN-105", 0) }
             ],
             "ICU-HALL": [
               { "code": "ICU-01", "name": "ICU Bay 1", "beds": 1, "occupied": occupancy.get("ICU-01", 0) },
               { "code": "ICU-02", "name": "ICU Bay 2", "beds": 1, "occupied": occupancy.get("ICU-02", 0) },
               { "code": "ICU-03", "name": "ICU Bay 3", "beds": 1, "occupied": occupancy.get("ICU-03", 0) }
             ],
             "PED-HALL": [
               { "code": "PED-201", "name": "Room 201", "beds": 2, "occupied": occupancy.get("PED-201", 0) },
               { "code": "PED-202", "name": "Room 202", "beds": 2, "occupied": occupancy.get("PED-202", 0) }
             ],
             "ISO-HALL": [
               { "code": "ISO-01", "name": "Isolation 1", "beds": 1, "occupied": occupancy.get("ISO-01", 0) },
               { "code": "ISO-02", "name": "Isolation 2", "beds": 1, "occupied": occupancy.get("ISO-02", 0) }
             ],
             "ID-HALL": [
               { "code": "ID-01", "name": "Infect. Disease 01", "beds": 1, "occupied": occupancy.get("ID-01", 0) },
               { "code": "ID-02", "name": "Infect. Disease 02", "beds": 1, "occupied": occupancy.get("ID-02", 0) }
             ]
           }
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def search_patients(self, request):
        """
        Search for patients by name or ID.
        """
        query = request.query_params.get('q', '')
        from patients.models import Patient
        from django.db.models import Q

        if not query:
            # Return latest 10 patients if no query
            patients = Patient.objects.all().order_by('-id')[:10]
        else:
            patients = Patient.objects.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(patient_id__icontains=query)
            )[:10]
        
        results = []
        for p in patients:
            results.append({
                'id': p.id,
                'patientId': p.patient_id,
                'name': f"{p.first_name} {p.last_name}",
                'dob': p.birthdate,
                'age': 0, # Calculate if needed
                'contact': p.mobile_number,
                'philhealth': p.philhealth_id
            })
            
        return Response(results)


class ProcedureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Procedure operations.
    
    CQRS-Lite Pattern:
    - Read: Standard queryset + ProcedureOutputSerializer
    - Write: Override create, delegate to ProcedureService
    
    Endpoints:
    - GET /api/procedures/ - List procedures
    - GET /api/procedures/{id}/ - Retrieve procedure details
    - POST /api/procedures/ - Record procedure
    """
    queryset = Procedure.objects.all().order_by('-performed_datetime')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['encounter_id', 'subject_id', 'status']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'create':
            return ProcedureInputSerializer
        elif self.action == 'list':
            return ProcedureListOutputSerializer
        return ProcedureOutputSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List procedures with summary DTOs via ACL.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            # Convert to DTOs via ACL
            dto_list = []
            for procedure in page:
                dto = ProcedureACL._procedure_to_summary_dict(procedure)
                dto_list.append(dto)
            
            serializer = self.get_serializer(dto_list, many=True)
            return self.get_paginated_response(serializer.data)
        
        # Non-paginated
        dto_list = []
        for procedure in queryset:
            dto = ProcedureACL._procedure_to_summary_dict(procedure)
            dto_list.append(dto)
        
        serializer = self.get_serializer(dto_list, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve procedure details with enriched DTO via ACL.
        """
        procedure_id = kwargs.get('pk')
        procedure_dto = ProcedureACL.get_procedure_details(procedure_id)
        
        if not procedure_dto:
            return Response(
                {'detail': 'Procedure not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(procedure_dto)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """
        Record procedure.
        Delegates to ProcedureService.record_procedure().
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to Service Layer
            procedure = ProcedureService.record_procedure(serializer.validated_data)
            
            # Retrieve enriched DTO via ACL
            procedure_dto = ProcedureACL.get_procedure_details(procedure.procedure_id)
            
            output_serializer = ProcedureOutputSerializer(procedure_dto)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        except DjangoValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

