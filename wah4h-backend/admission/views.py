"""
Admission App Views
===================
RESTful API endpoints for Encounter and Procedure management.

Architecture:
- Views act as Traffic Controllers
- Business logic delegated to Service Layer
- CQRS pattern: Different serializers for read/write operations
- Lookup by string identifiers (not integer PKs)

Author: WAH4H Backend Team
Date: February 2, 2026
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError, ObjectDoesNotExist

from .models import Encounter, Procedure, ProcedurePerformer
from .serializers import (
    EncounterInputSerializer,
    EncounterOutputSerializer,
    ProcedureInputSerializer,
    ProcedureOutputSerializer,
    ProcedurePerformerSerializer,
)
from .services import EncounterService, ProcedureService


# ==================== ENCOUNTER VIEWSET ====================

class EncounterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Encounter management.
    
    Endpoints:
    - GET /api/encounters/ - List all encounters
    - POST /api/encounters/ - Create new encounter
    - GET /api/encounters/{identifier}/ - Retrieve specific encounter
    - PUT /api/encounters/{identifier}/ - Update encounter
    - PATCH /api/encounters/{identifier}/ - Partial update
    - DELETE /api/encounters/{identifier}/ - Delete encounter
    - POST /api/encounters/{identifier}/discharge/ - Discharge encounter
    """
    
    queryset = Encounter.objects.all().order_by('-period_start')
    lookup_field = 'identifier'  # Use string identifier instead of PK
    
    def get_serializer_class(self):
        """
        CQRS: Return appropriate serializer based on action.
        Write operations use InputSerializer, reads use OutputSerializer.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return EncounterInputSerializer
        return EncounterOutputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new encounter.
        Delegates business logic to EncounterService.
        
        Expected Input:
        {
            "patient_id": "P-2023-001",
            "status": "arrived",
            "type": "inpatient",
            "class_field": "IMP",
            ...
        }
        """
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Delegate to service layer
            encounter = EncounterService.create_encounter(serializer.validated_data)
            
            # Serialize response with enriched data
            output_serializer = EncounterOutputSerializer(encounter)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except DRFValidationError as e:
            # DRF serializer validation errors
            return Response(
                {'error': 'Validation failed', 'details': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            # Django core validation errors from service layer
            return Response(
                {'error': str(e), 'details': e.message_dict if hasattr(e, 'message_dict') else {}},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ObjectDoesNotExist as e:
            return Response(
                {'error': 'Referenced object not found', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update an encounter.
        Delegates to EncounterService.update_encounter().
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Delegate to service layer
            updated_encounter = EncounterService.update_encounter(
                instance,
                serializer.validated_data
            )
            
            # Return enriched output
            output_serializer = EncounterOutputSerializer(updated_encounter)
            
            return Response(output_serializer.data)
            
        except DRFValidationError as e:
            return Response(
                {'error': 'Validation failed', 'details': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return Response(
                {'error': str(e), 'details': e.message_dict if hasattr(e, 'message_dict') else {}},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def discharge(self, request, identifier=None):
        """
        Discharge an encounter (state transition to 'finished').
        
        Expected Input:
        {
            "discharge_disposition": "Home care",
            "discharge_destination_id": 123  // Optional
        }
        
        URL: POST /api/encounters/{identifier}/discharge/
        """
        try:
            # Get the encounter instance
            encounter = self.get_object()
            
            # Extract discharge parameters
            disposition = request.data.get('discharge_disposition')
            destination_id = request.data.get('discharge_destination_id')
            
            if not disposition:
                return Response(
                    {'error': 'discharge_disposition is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delegate to service layer
            discharged_encounter = EncounterService.discharge_encounter(
                encounter,
                disposition=disposition,
                destination_id=destination_id
            )
            
            # Return enriched output
            output_serializer = EncounterOutputSerializer(discharged_encounter)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_200_OK
            )
            
        except ValidationError as e:
            return Response(
                {'error': str(e), 'details': e.message_dict if hasattr(e, 'message_dict') else {}},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        List all active encounters (not finished or cancelled).
        
        URL: GET /api/encounters/active/
        Optional query param: ?patient_id=P-2023-001
        """
        patient_id = request.query_params.get('patient_id')
        
        try:
            encounters = EncounterService.get_active_encounters(patient_id=patient_id)
            serializer = EncounterOutputSerializer(encounters, many=True)
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== PROCEDURE VIEWSET ====================

class ProcedureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Procedure management.
    
    Endpoints:
    - GET /api/procedures/ - List all procedures
    - POST /api/procedures/ - Record new procedure
    - GET /api/procedures/{identifier}/ - Retrieve specific procedure
    - PUT /api/procedures/{identifier}/ - Update procedure
    - PATCH /api/procedures/{identifier}/ - Partial update
    - DELETE /api/procedures/{identifier}/ - Delete procedure
    - PATCH /api/procedures/{identifier}/update_status/ - Update status
    """
    
    queryset = Procedure.objects.all().order_by('-performed_datetime')
    lookup_field = 'identifier'  # Use string identifier instead of PK
    permission_classes = [IsAuthenticated]  # Required for request.user
    
    def get_serializer_class(self):
        """
        CQRS: Return appropriate serializer based on action.
        Write operations use InputSerializer, reads use OutputSerializer.
        """
        if self.action in ['create']:
            return ProcedureInputSerializer
        return ProcedureOutputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Record a new procedure.
        Delegates business logic to ProcedureService.
        
        Expected Input:
        {
            "encounter_identifier": "ENC-20260202-A3F2D1",
            "code_code": "80146002",
            "code_display": "Appendectomy",
            "status": "completed",
            ...
        }
        """
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Delegate to service layer (pass current user for recorder_id)
            procedure = ProcedureService.record_procedure(
                serializer.validated_data,
                user=request.user
            )
            
            # Serialize response with enriched data
            output_serializer = ProcedureOutputSerializer(procedure)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except DRFValidationError as e:
            return Response(
                {'error': 'Validation failed', 'details': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return Response(
                {'error': str(e), 'details': e.message_dict if hasattr(e, 'message_dict') else {}},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ObjectDoesNotExist as e:
            return Response(
                {'error': 'Referenced object not found', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, identifier=None):
        """
        Update procedure status with optional reason.
        
        Expected Input:
        {
            "status": "completed",
            "status_reason_code": "123",  // Optional
            "status_reason_display": "Completed successfully"  // Optional
        }
        
        URL: PATCH /api/procedures/{identifier}/update_status/
        """
        try:
            # Get the procedure instance
            procedure = self.get_object()
            
            # Extract status parameters
            new_status = request.data.get('status')
            status_reason_code = request.data.get('status_reason_code')
            status_reason_display = request.data.get('status_reason_display')
            
            if not new_status:
                return Response(
                    {'error': 'status is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Delegate to service layer
            updated_procedure = ProcedureService.update_procedure_status(
                procedure,
                new_status=new_status,
                status_reason_code=status_reason_code,
                status_reason_display=status_reason_display
            )
            
            # Return enriched output
            output_serializer = ProcedureOutputSerializer(updated_procedure)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_200_OK
            )
            
        except ValidationError as e:
            return Response(
                {'error': str(e), 'details': e.message_dict if hasattr(e, 'message_dict') else {}},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_encounter(self, request):
        """
        Get all procedures for a specific encounter.
        
        URL: GET /api/procedures/by_encounter/?encounter_identifier=ENC-20260202-A3F2D1
        """
        encounter_identifier = request.query_params.get('encounter_identifier')
        
        if not encounter_identifier:
            return Response(
                {'error': 'encounter_identifier query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            procedures = ProcedureService.get_procedures_by_encounter(encounter_identifier)
            serializer = ProcedureOutputSerializer(procedures, many=True)
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """
        Get all procedures for a specific patient.
        
        URL: GET /api/procedures/by_patient/?patient_id=P-2023-001
        """
        patient_id = request.query_params.get('patient_id')
        
        if not patient_id:
            return Response(
                {'error': 'patient_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            procedures = ProcedureService.get_procedures_by_patient(patient_id)
            serializer = ProcedureOutputSerializer(procedures, many=True)
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== PROCEDURE PERFORMER VIEWSET ====================

class ProcedurePerformerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ProcedurePerformer management.
    
    Endpoints:
    - GET /api/procedure-performers/ - List all performers
    - POST /api/procedure-performers/ - Add performer to procedure
    - GET /api/procedure-performers/{id}/ - Retrieve specific performer
    - PUT /api/procedure-performers/{id}/ - Update performer
    - DELETE /api/procedure-performers/{id}/ - Remove performer
    """
    
    queryset = ProcedurePerformer.objects.all().order_by('-created_at')
    serializer_class = ProcedurePerformerSerializer
    permission_classes = [IsAuthenticated]