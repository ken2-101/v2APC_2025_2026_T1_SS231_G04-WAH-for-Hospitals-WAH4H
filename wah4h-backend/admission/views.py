"""
Admission Views
===============
Trinity Architecture: Standard ModelViewSets with Direct ORM Access

Thin Views - business logic is in serializers.
All database queries use direct ORM - no service layers.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import transaction

# Direct Model Imports - Trinity Pattern
from admission.models import Encounter, Procedure
from patients.models import Patient

# Serializer Imports
from admission.serializers import (
    EncounterSerializer,
    EncounterDischargeSerializer,
    ProcedureSerializer
)

class EncounterViewSet(viewsets.ModelViewSet):
    """
    Standard ModelViewSet for Encounter (Admission) operations.
    Trinity Pattern: Thin view, fat serializer, direct ORM.
    
    Endpoints:
        GET /api/admission/encounters/ - List all encounters
        POST /api/admission/encounters/ - Create new encounter
        GET /api/admission/encounters/{identifier}/ - Retrieve encounter
        PUT /api/admission/encounters/{identifier}/ - Update encounter
        PATCH /api/admission/encounters/{identifier}/ - Partial update
        DELETE /api/admission/encounters/{identifier}/ - Delete encounter
        POST /api/admission/encounters/{identifier}/discharge/ - Discharge patient
        GET /api/admission/encounters/locations/ - Get location hierarchy
        GET /api/admission/encounters/search_patients/?q=term - Search patients
    """
    queryset = Encounter.objects.all().select_related().order_by('-period_start')
    serializer_class = EncounterSerializer
    lookup_field = 'identifier'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject_id', 'status', 'class_field', 'location_id', 'participant_individual_id']
    search_fields = ['identifier', 'patient__first_name', 'patient__last_name']
    ordering_fields = ['period_start', 'period_end', 'created_at']
    ordering = ['-period_start']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'discharge':
            return EncounterDischargeSerializer
        return EncounterSerializer

    @action(detail=True, methods=['post'])
    def discharge(self, request, identifier=None):
        """
        Discharge a patient from encounter.
        Updates status to 'finished' and sets discharge details.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return full encounter details after discharge
        return Response(
            EncounterSerializer(instance).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def locations(self, request):
        """
        Get location hierarchy with dynamic occupancy calculation.
        Uses direct ORM query to count active encounters per location.
        """
        # Direct ORM query for occupancy calculation
        active_encounters = Encounter.objects.filter(status='in-progress')
        occupancy = {}
        
        for enc in active_encounters:
            if enc.location_ids:
                for code in enc.location_ids:
                    if code:
                        occupancy[code] = occupancy.get(code, 0) + 1

        # Static location hierarchy (can be moved to database later)
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
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def search_patients(self, request):
        """
        Search for patients by name or patient ID.
        Uses direct ORM query with Q objects for flexible search.
        """
        query = request.query_params.get('q', '').strip()

        # Direct ORM query - no service layer
        if not query:
            patients = Patient.objects.all().order_by('-id')[:10]
        else:
            patients = Patient.objects.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(patient_id__icontains=query)
            ).order_by('-id')[:10]
        
        # Build response with patient summaries
        results = []
        for p in patients:
            results.append({
                'id': p.id,
                'patientId': p.patient_id,
                'name': f"{p.first_name} {p.last_name}",
                'firstName': p.first_name,
                'lastName': p.last_name,
                'dob': p.birthdate.isoformat() if p.birthdate else None,
                'age': 0,  # Can calculate if needed
                'gender': p.gender,
                'contact': p.mobile_number,
                'philhealth': p.philhealth_id
            })
            
        return Response(results, status=status.HTTP_200_OK)


class ProcedureViewSet(viewsets.ModelViewSet):
    """
    Standard ModelViewSet for Procedure operations.
    Trinity Pattern: Thin view, fat serializer, direct ORM.
    
    Endpoints:
        GET /api/admission/procedures/ - List all procedures
        POST /api/admission/procedures/ - Create new procedure
        GET /api/admission/procedures/{identifier}/ - Retrieve procedure
        PUT /api/admission/procedures/{identifier}/ - Update procedure
        PATCH /api/admission/procedures/{identifier}/ - Partial update
        DELETE /api/admission/procedures/{identifier}/ - Delete procedure
    """
    queryset = Procedure.objects.all().select_related('encounter').order_by('-performed_datetime')
    serializer_class = ProcedureSerializer
    lookup_field = 'identifier'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['encounter', 'subject_id', 'status', 'code_code', 'category_code']
    search_fields = ['identifier', 'code_display', 'note']
    ordering_fields = ['performed_datetime', 'performed_period_start', 'created_at']
    ordering = ['-performed_datetime']

    def get_queryset(self):
        """
        Optionally filter by encounter_id query parameter.
        Allows frontend to fetch all procedures for a specific encounter.
        """
        queryset = super().get_queryset()
        encounter_id = self.request.query_params.get('encounter_id', None)
        
        if encounter_id:
            queryset = queryset.filter(encounter__encounter_id=encounter_id)
        
        return queryset

    def perform_create(self, serializer):
        """
        Override to pass request context for recorder_id assignment.
        """
        serializer.save()

    def perform_update(self, serializer):
        """
        Override to ensure atomic updates.
        """
        with transaction.atomic():
            serializer.save()
