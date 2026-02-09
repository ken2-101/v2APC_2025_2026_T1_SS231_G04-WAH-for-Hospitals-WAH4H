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
        if self.action == 'create':
            return EncounterInputSerializer
        elif self.action == 'list':
            return EncounterListOutputSerializer
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

