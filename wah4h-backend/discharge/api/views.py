"""
discharge/api/views.py

Hybrid ViewSets for the Discharge Module.

Architecture Pattern: CQRS-Lite with Fortress Pattern
- Write operations (create, update) use service layer (discharge_services.py)
- Read operations (list, retrieve) use ACL (discharge_acl.py)
- Clean separation between commands and queries

Context: Philippine LGU Hospital System
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError, ObjectDoesNotExist

# Service Layer (Write Operations)
from discharge.services.discharge_services import ProcedureService, DischargeWorkflowService

# ACL Layer (Read Operations)
from discharge.services.discharge_acl import DischargeACL, ProcedureACL

# Serializers (CQRS-Lite)
from discharge.api.serializers import (
    ProcedureInputSerializer,
    ProcedureOutputSerializer,
    ProcedureSummaryOutputSerializer,
    DischargeInputSerializer,
    DischargeUpdateSerializer,
    DischargeFinalizeSerializer,
    DischargeOutputSerializer,
    DischargeSummaryOutputSerializer,
)


class ProcedureViewSet(viewsets.ViewSet):
    """
    ViewSet for clinical procedures.
    
    CQRS Pattern:
    - create: Uses ProcedureService (Write Layer)
    - list/retrieve: Uses ProcedureACL (Read Layer)
    
    Endpoints:
    - POST /api/discharge/procedures/ - Record a new procedure
    - GET /api/discharge/procedures/ - List procedures (filtered by encounter or patient)
    - GET /api/discharge/procedures/{id}/ - Retrieve procedure details
    """
    
    def create(self, request):
        """
        Record a new clinical procedure.
        
        Request Body (ProcedureInputSerializer):
            - subject_id (int, required): Patient ID
            - encounter_id (int, required): Encounter ID
            - status (str, required): Procedure status
            - code_code (str, required): Procedure code
            - code_display (str, required): Procedure name
            - performed_datetime (datetime, optional)
            - performers (list, optional): List of performer objects
            - ... (other optional fields)
        
        Returns:
            201: Procedure created successfully
            400: Validation error
        """
        serializer = ProcedureInputSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use service layer for write operation
            procedure = ProcedureService.record_procedure(serializer.validated_data)
            
            # Use ACL to fetch enriched DTO for response
            procedure_dto = ProcedureACL.get_procedure_details(procedure.procedure_id)
            
            output_serializer = ProcedureOutputSerializer(procedure_dto)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to record procedure: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request):
        """
        List procedures filtered by encounter_id or patient_id.
        
        Query Parameters:
            - encounter_id (int, optional): Filter by encounter
            - patient_id (int, optional): Filter by patient
        
        Returns:
            200: List of procedures
        """
        encounter_id = request.query_params.get('encounter_id')
        patient_id = request.query_params.get('patient_id')
        
        if encounter_id:
            try:
                encounter_id = int(encounter_id)
                procedures = ProcedureACL.get_encounter_procedures(encounter_id)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid encounter_id parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif patient_id:
            try:
                patient_id = int(patient_id)
                procedures = ProcedureACL.get_patient_procedures(patient_id)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid patient_id parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'error': 'Either encounter_id or patient_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use lightweight serializer for lists
        serializer = ProcedureOutputSerializer(procedures, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """
        Retrieve detailed information for a specific procedure.
        
        URL Parameters:
            - pk (int): Procedure ID
        
        Returns:
            200: Procedure details
            404: Procedure not found
        """
        try:
            procedure_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid procedure ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use ACL for read operation
        procedure_dto = ProcedureACL.get_procedure_details(procedure_id)
        
        if not procedure_dto:
            return Response(
                {'error': f'Procedure with id {procedure_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProcedureOutputSerializer(procedure_dto)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DischargeViewSet(viewsets.ViewSet):
    """
    ViewSet for discharge workflow management.
    
    CQRS Pattern:
    - create: Uses DischargeWorkflowService.initiate_discharge (Write Layer)
    - finalize: Uses DischargeWorkflowService.finalize_discharge (Write Layer)
    - retrieve: Uses DischargeACL (Read Layer)
    
    Endpoints:
    - POST /api/discharge/discharges/ - Initiate discharge
    - PATCH /api/discharge/discharges/{id}/ - Update discharge details
    - POST /api/discharge/discharges/{id}/finalize/ - Finalize discharge (Gatekeeper)
    - GET /api/discharge/discharges/{id}/ - Retrieve discharge summary
    - GET /api/discharge/discharges/by-encounter/{encounter_id}/ - Get discharge by encounter
    """
    
    def create(self, request):
        """
        Initiate the discharge process for a patient.
        
        Request Body (DischargeInputSerializer):
            - encounter_id (int, required): Encounter ID
            - patient_id (int, required): Patient ID
            - physician_id (int, optional): Discharging physician ID
            - notice_datetime (datetime, optional)
            - summary_of_stay (str, optional)
            - discharge_instructions (str, optional)
            - follow_up_plan (str, optional)
            - created_by (str, optional)
        
        Returns:
            201: Discharge initiated successfully
            400: Validation error
        """
        serializer = DischargeInputSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use service layer for write operation
            discharge = DischargeWorkflowService.initiate_discharge(serializer.validated_data)
            
            # Use ACL to fetch enriched DTO for response
            discharge_dto = DischargeACL.get_discharge_by_id(discharge.discharge_id)
            
            output_serializer = DischargeOutputSerializer(discharge_dto)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to initiate discharge: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def partial_update(self, request, pk=None):
        """
        Update discharge clinical documentation.
        
        URL Parameters:
            - pk (int): Discharge ID
        
        Request Body (DischargeUpdateSerializer):
            - summary_of_stay (str, optional)
            - discharge_instructions (str, optional)
            - follow_up_plan (str, optional)
            - pending_items (str, optional)
            - physician_id (int, optional)
        
        Returns:
            200: Discharge updated successfully
            400: Validation error
            404: Discharge not found
        """
        try:
            discharge_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid discharge ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DischargeUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use service layer for write operation
            discharge = DischargeWorkflowService.update_discharge_details(
                discharge_id,
                serializer.validated_data
            )
            
            # Use ACL to fetch enriched DTO for response
            discharge_dto = DischargeACL.get_discharge_by_id(discharge.discharge_id)
            
            output_serializer = DischargeOutputSerializer(discharge_dto)
            
            return Response(
                output_serializer.data,
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update discharge: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """
        Finalize the discharge process with financial clearance gatekeeper.
        
        CRITICAL GATEKEEPER LOGIC:
        - Checks if patient has cleared all financial obligations
        - If balance > 0, raises error and blocks discharge
        - If cleared, updates discharge status to 'completed'
        
        URL Parameters:
            - pk (int): Discharge ID
        
        Request Body (DischargeFinalizeSerializer):
            - finalized_by (str, optional): User who finalized
        
        Returns:
            200: Discharge finalized successfully
            400: Validation error or financial clearance not met
            404: Discharge not found
        """
        try:
            discharge_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid discharge ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = DischargeFinalizeSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use service layer for write operation with gatekeeper logic
            discharge = DischargeWorkflowService.finalize_discharge(
                discharge_id,
                finalized_by=serializer.validated_data.get('finalized_by')
            )
            
            # Use ACL to fetch enriched DTO for response
            discharge_dto = DischargeACL.get_discharge_by_id(discharge.discharge_id)
            
            output_serializer = DischargeOutputSerializer(discharge_dto)
            
            return Response(
                {
                    'message': 'Discharge finalized successfully',
                    'discharge': output_serializer.data
                },
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to finalize discharge: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve discharge summary by discharge ID.
        
        URL Parameters:
            - pk (int): Discharge ID
        
        Returns:
            200: Discharge summary
            404: Discharge not found
        """
        try:
            discharge_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid discharge ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use ACL for read operation
        discharge_dto = DischargeACL.get_discharge_by_id(discharge_id)
        
        if not discharge_dto:
            return Response(
                {'error': f'Discharge with id {discharge_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DischargeOutputSerializer(discharge_dto)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='by-encounter/(?P<encounter_id>[^/.]+)')
    def by_encounter(self, request, encounter_id=None):
        """
        Retrieve discharge summary by encounter ID.
        
        URL Parameters:
            - encounter_id (int): Encounter ID
        
        Returns:
            200: Discharge summary
            404: Discharge not found for this encounter
        """
        try:
            encounter_id = int(encounter_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid encounter ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use ACL for read operation
        discharge_dto = DischargeACL.get_discharge_summary(encounter_id)
        
        if not discharge_dto:
            return Response(
                {'error': f'Discharge not found for encounter {encounter_id}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DischargeOutputSerializer(discharge_dto)
        return Response(serializer.data, status=status.HTTP_200_OK)
