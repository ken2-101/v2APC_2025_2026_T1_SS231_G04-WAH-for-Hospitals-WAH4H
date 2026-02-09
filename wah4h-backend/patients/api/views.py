"""
Patient API Views
=================
CQRS-Lite Pattern: Service-Driven ViewSets with zero direct database access.

Writes (POST/PUT): Validate -> Delegate to PatientRegistrationService
Reads (GET): Delegate to PatientACL -> Format with OutputSerializer
"""

import os

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

import requests as http_requests

from patients.wah4pc import request_patient, fhir_to_dict, push_patient, patient_to_fhir, get_providers
from patients.models import Patient, WAH4PCTransaction

from patients.api.serializers import (
    PatientInputSerializer,
    PatientOutputSerializer,
    ConditionSerializer,
    ConditionCreateSerializer,
    AllergySerializer,
    AllergyCreateSerializer,
    ImmunizationSerializer,
    ImmunizationCreateSerializer,
)
from patients.models import Condition, AllergyIntolerance, Immunization
from patients.services import patient_acl
from patients.services.patients_services import (
    PatientRegistrationService,
    PatientUpdateService,
    ClinicalDataService,
)


# ============================================================================
# PATIENT VIEWSET (CQRS-Lite)
# ============================================================================

class PatientViewSet(viewsets.ViewSet):
    """
    Patient ViewSet (Service-Driven)
    
    CQRS-Lite Architecture:
    - NO direct database access (no queryset)
    - Reads: patient_acl functions -> PatientOutputSerializer
    - Writes: PatientInputSerializer -> PatientRegistrationService/PatientUpdateService
    
    Endpoints:
        GET /patients/ - List patients
        GET /patients/{id}/ - Retrieve patient details
        POST /patients/ - Create new patient
        PUT /patients/{id}/ - Full update patient
        PATCH /patients/{id}/ - Partial update patient
        GET /patients/search/?q=term - Search patients
        GET /patients/{id}/conditions/ - Get patient conditions
        GET /patients/{id}/allergies/ - Get patient allergies
    """
    
    def list(self, request):
        """
        List all patients.
        
        Delegates to: PatientACL.search_patients('', limit)
        Returns: List of patient summaries
        """
        limit = int(request.query_params.get('limit', 100))
        
        # Delegate to ACL (empty query returns all)
        patients = patient_acl.search_patients('', limit)
        
        # Serialize using Output serializer
        serializer = PatientOutputSerializer(patients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """
        Retrieve a single patient by ID.
        
        Delegates to: PatientACL.get_patient_details(id)
        Returns: Full patient details or 404
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL
        patient = patient_acl.get_patient_details(patient_id)
        
        if not patient:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize using Output serializer
        serializer = PatientOutputSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def create(self, request):
        """
        Create a new patient.
        
        Flow:
        1. Validate input with PatientInputSerializer
        2. Delegate to PatientRegistrationService.register_patient()
        3. Return 201 with new patient details
        """
        # Validate input
        input_serializer = PatientInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(
                input_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to Registration Service
        try:
            patient = PatientRegistrationService.register_patient(
                input_serializer.validated_data
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to register patient: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Fetch full details via ACL
        patient_details = patient_acl.get_patient_details(patient.id)
        
        # Serialize output
        output_serializer = PatientOutputSerializer(patient_details)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, pk=None):
        """
        Full update of a patient.
        
        Flow:
        1. Validate input with PatientInputSerializer
        2. Delegate to PatientUpdateService.update_patient()
        3. Return 200 with updated patient details
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        input_serializer = PatientInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(
                input_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to Update Service
        try:
            patient = PatientUpdateService.update_patient(
                patient_id,
                input_serializer.validated_data
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update patient: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Fetch full details via ACL
        patient_details = patient_acl.get_patient_details(patient.id)
        
        # Serialize output
        output_serializer = PatientOutputSerializer(patient_details)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )
    
    def partial_update(self, request, pk=None):
        """
        Partial update of a patient.
        
        Flow:
        1. Validate input with PatientInputSerializer (partial=True)
        2. Delegate to PatientUpdateService.update_patient()
        3. Return 200 with updated patient details
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input (partial)
        input_serializer = PatientInputSerializer(
            data=request.data,
            partial=True
        )
        if not input_serializer.is_valid():
            return Response(
                input_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to Update Service
        try:
            patient = PatientUpdateService.update_patient(
                patient_id,
                input_serializer.validated_data
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update patient: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Fetch full details via ACL
        patient_details = patient_acl.get_patient_details(patient.id)
        
        # Serialize output
        output_serializer = PatientOutputSerializer(patient_details)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search patients by query.
        
        Query params:
            q: Search term (required)
            limit: Max results (optional, default: 50)
        
        Example: GET /patients/search/?q=Juan&limit=10
        
        Delegates to: PatientACL.search_patients(query, limit)
        """
        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', 50))
        
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL
        results = patient_acl.search_patients(query, limit)
        
        # Serialize output
        serializer = PatientOutputSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def conditions(self, request, pk=None):
        """
        Get all conditions for a patient.
        
        Example: GET /patients/{id}/conditions/
        
        Delegates to: PatientACL.get_patient_conditions(id)
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL
        conditions = patient_acl.get_patient_conditions(patient_id)
        return Response(conditions, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def allergies(self, request, pk=None):
        """
        Get all allergies for a patient.
        
        Example: GET /patients/{id}/allergies/
        
        Delegates to: PatientACL.get_patient_allergies(id)
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL
        allergies = patient_acl.get_patient_allergies(patient_id)
        return Response(allergies, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def immunizations(self, request, pk=None):
        """
        Get all immunizations for a patient.

        Example: GET /patients/{id}/immunizations/

        Delegates to: PatientACL.get_patient_immunizations(id)
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delegate to ACL
        immunizations = patient_acl.get_patient_immunizations(patient_id)
        return Response(immunizations, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        """
        Soft delete a patient (set status to inactive).

        Example: DELETE /patients/{id}/
        """
        try:
            patient_id = int(pk)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid patient ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from patients.models import Patient
            patient = Patient.objects.get(id=patient_id)
            patient.status = 'inactive'
            patient.active = False
            patient.save()

            return Response(
                {'message': f'Patient {patient.patient_id} deactivated successfully'},
                status=status.HTTP_200_OK
            )
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ============================================================================
# CONDITION VIEWSET (FORTRESS PATTERN)
# ============================================================================

class ConditionViewSet(viewsets.ModelViewSet):
    """
    Condition ViewSet (Fortress Pattern)
    
    Reads: Standard ModelViewSet behavior (direct DB query)
    Writes: Delegated to ClinicalDataService.record_condition()
    
    Endpoints:
        GET /conditions/ - List conditions (with filter)
        GET /conditions/{id}/ - Retrieve condition details
        POST /conditions/ - Create new condition (via ClinicalDataService)
        PUT /conditions/{id}/ - Update condition
        PATCH /conditions/{id}/ - Partial update condition
        DELETE /conditions/{id}/ - Delete condition
    """
    
    queryset = Condition.objects.all().select_related('patient').order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['patient', 'clinical_status', 'category', 'severity']
    search_fields = ['code', 'identifier']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'create':
            return ConditionCreateSerializer
        return ConditionSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new condition via ClinicalDataService.
        
        Flow:
        1. Validate input with ConditionCreateSerializer
        2. Extract patient_id from validated data
        3. Delegate to ClinicalDataService.record_condition()
        4. Return created condition with ConditionSerializer
        """
        # Validate input
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract patient_id (the patient field contains the Patient instance)
        validated_data = serializer.validated_data.copy()
        patient = validated_data.pop('patient')
        patient_id = patient.id
        
        # Delegate to ClinicalDataService
        try:
            condition = ClinicalDataService.record_condition(
                patient_id=patient_id,
                data=validated_data
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to record condition: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize output with read serializer
        output_serializer = ConditionSerializer(condition)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )


# ============================================================================
# ALLERGY VIEWSET (FORTRESS PATTERN)
# ============================================================================

class AllergyViewSet(viewsets.ModelViewSet):
    """
    Allergy Intolerance ViewSet (Fortress Pattern)
    
    Reads: Standard ModelViewSet behavior (direct DB query)
    Writes: Delegated to ClinicalDataService.record_allergy()
    
    Endpoints:
        GET /allergies/ - List allergies (with filter)
        GET /allergies/{id}/ - Retrieve allergy details
        POST /allergies/ - Create new allergy (via ClinicalDataService)
        PUT /allergies/{id}/ - Update allergy
        PATCH /allergies/{id}/ - Partial update allergy
        DELETE /allergies/{id}/ - Delete allergy
    """
    
    queryset = AllergyIntolerance.objects.all().select_related('patient').order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['patient', 'clinical_status', 'category', 'criticality']
    search_fields = ['code', 'identifier']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'create':
            return AllergyCreateSerializer
        return AllergySerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new allergy via ClinicalDataService.
        
        Flow:
        1. Validate input with AllergyCreateSerializer
        2. Extract patient_id from validated data
        3. Delegate to ClinicalDataService.record_allergy()
        4. Return created allergy with AllergySerializer
        """
        # Validate input
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract patient_id (the patient field contains the Patient instance)
        validated_data = serializer.validated_data.copy()
        patient = validated_data.pop('patient')
        patient_id = patient.id
        
        # Delegate to ClinicalDataService
        try:
            allergy = ClinicalDataService.record_allergy(
                patient_id=patient_id,
                data=validated_data
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to record allergy: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize output with read serializer
        output_serializer = AllergySerializer(allergy)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )


# ============================================================================
# IMMUNIZATION VIEWSET (FORTRESS PATTERN)
# ============================================================================

class ImmunizationViewSet(viewsets.ModelViewSet):
    """
    Immunization ViewSet (Fortress Pattern)
    
    Reads: Standard ModelViewSet behavior (direct DB query)
    Writes: Delegated to ClinicalDataService.record_immunization()
    
    Endpoints:
        GET /immunizations/ - List immunizations (with filter)
        GET /immunizations/{id}/ - Retrieve immunization details
        POST /immunizations/ - Create new immunization (via ClinicalDataService)
        PUT /immunizations/{id}/ - Update immunization
        PATCH /immunizations/{id}/ - Partial update immunization
        DELETE /immunizations/{id}/ - Delete immunization
    """
    
    queryset = Immunization.objects.all().select_related('patient').order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['patient', 'status', 'vaccine_code']
    search_fields = ['identifier', 'vaccine_display', 'lot_number']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'create':
            return ImmunizationCreateSerializer
        return ImmunizationSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new immunization via ClinicalDataService.
        
        Flow:
        1. Validate input with ImmunizationCreateSerializer
        2. Extract patient_id from validated data
        3. Delegate to ClinicalDataService.record_immunization()
        4. Return created immunization with ImmunizationSerializer
        """
        # Validate input
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract patient_id (the patient field contains the Patient instance)
        validated_data = serializer.validated_data.copy()
        patient = validated_data.pop('patient')
        patient_id = patient.id
        
        # Delegate to ClinicalDataService
        try:
            immunization = ClinicalDataService.record_immunization(
                patient_id=patient_id,
                data=validated_data
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to record immunization: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Serialize output with read serializer
        output_serializer = ImmunizationSerializer(immunization)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )


# ============================================================================
# WAH4PC INTEGRATION
# ============================================================================

@api_view(['POST'])
def fetch_wah4pc(request):
    """Fetch patient data from WAH4PC gateway."""
    target_id = request.data.get('targetProviderId')
    philhealth_id = request.data.get('philHealthId')
    if not target_id or not philhealth_id:
        return Response(
            {'error': 'targetProviderId and philHealthId are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    result = request_patient(target_id, philhealth_id)

    # Handle error responses
    if 'error' in result:
        return Response(
            {'error': result['error']},
            status=result.get('status_code', 500)
        )

    txn_id = result.get('data', {}).get('id') if 'data' in result else result.get('id')
    idempotency_key = result.get('idempotency_key')

    if txn_id:
        WAH4PCTransaction.objects.create(
            transaction_id=txn_id,
            type='fetch',
            status='PENDING',
            target_provider_id=target_id,
            idempotency_key=idempotency_key,
        )

    return Response(result, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def webhook_receive(request):
    """Receive webhook from WAH4PC gateway."""
    gateway_key = os.getenv('GATEWAY_AUTH_KEY')
    auth_header = request.headers.get('X-Gateway-Auth')
    if not gateway_key or not auth_header or auth_header != gateway_key:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    txn_id = request.data.get('transactionId')
    txn = WAH4PCTransaction.objects.filter(transaction_id=txn_id).first() if txn_id else None

    if request.data.get('status') == 'SUCCESS':
        patient_data = fhir_to_dict(request.data['data'])
        request.session[f"wah4pc_{txn_id}"] = patient_data
        if txn:
            txn.status = 'COMPLETED'
            txn.save()
    else:
        if txn:
            txn.status = 'FAILED'
            txn.error_message = request.data.get('data', {}).get('error', 'Unknown')
            txn.save()

    return Response({'message': 'Received'})


@api_view(['POST'])
def send_to_wah4pc(request):
    """Send local patient data to another provider via WAH4PC gateway."""
    patient_id = request.data.get('patientId')
    target_id = request.data.get('targetProviderId')
    if not patient_id or not target_id:
        return Response(
            {'error': 'patientId and targetProviderId are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    result = push_patient(target_id, patient)

    # Handle error responses
    if 'error' in result:
        return Response(
            {'error': result['error']},
            status=result.get('status_code', 500)
        )

    txn_id = result.get('id')
    idempotency_key = result.get('idempotency_key')

    if txn_id:
        WAH4PCTransaction.objects.create(
            transaction_id=txn_id,
            type='send',
            status=result.get('status', 'PENDING'),
            patient_id=patient.id,
            target_provider_id=target_id,
            idempotency_key=idempotency_key,
        )

    return Response(result, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def webhook_receive_push(request):
    """Receive pushed patient data from another provider via WAH4PC gateway."""
    gateway_key = os.getenv('GATEWAY_AUTH_KEY')
    auth_header = request.headers.get('X-Gateway-Auth')
    if not gateway_key or not auth_header or auth_header != gateway_key:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    txn_id = request.data.get('transactionId')
    sender_id = request.data.get('senderId')
    resource_type = request.data.get('resourceType')
    data = request.data.get('data')

    if not txn_id or not sender_id or not resource_type or not data:
        return Response(
            {'error': 'transactionId, senderId, resourceType, and data are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Only handle Patient resources for now
    if resource_type != 'Patient':
        return Response(
            {'error': f'Unsupported resource type: {resource_type}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Convert FHIR to dict
        patient_data = fhir_to_dict(data)

        # Check if patient already exists by PhilHealth ID
        philhealth_id = patient_data.get('philhealth_id')
        if philhealth_id:
            existing_patient = Patient.objects.filter(philhealth_id=philhealth_id).first()
            if existing_patient:
                # Update existing patient
                for key, value in patient_data.items():
                    if value is not None:
                        setattr(existing_patient, key, value)
                existing_patient.save()
                patient = existing_patient
                action = 'updated'
            else:
                # Create new patient
                patient = Patient.objects.create(**patient_data)
                action = 'created'
        else:
            # No PhilHealth ID, create new patient
            patient = Patient.objects.create(**patient_data)
            action = 'created'

        # Record transaction
        WAH4PCTransaction.objects.create(
            transaction_id=txn_id,
            type='receive_push',
            status='COMPLETED',
            patient_id=patient.id,
            target_provider_id=sender_id,
        )

        return Response({
            'message': f'Patient {action} successfully',
            'patientId': patient.id,
            'action': action
        }, status=status.HTTP_200_OK)

    except Exception as e:
        # Record failed transaction
        WAH4PCTransaction.objects.create(
            transaction_id=txn_id,
            type='receive_push',
            status='FAILED',
            target_provider_id=sender_id,
            error_message=str(e),
        )

        return Response(
            {'error': f'Failed to process pushed patient: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
def webhook_process_query(request):
    """Process incoming query from another provider via WAH4PC gateway."""
    import uuid

    gateway_key = os.getenv('GATEWAY_AUTH_KEY')
    auth_header = request.headers.get('X-Gateway-Auth')
    if not gateway_key or not auth_header or auth_header != gateway_key:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    txn_id = request.data.get('transactionId')
    identifiers = request.data.get('identifiers', [])
    return_url = request.data.get('gatewayReturnUrl')

    if not txn_id or not return_url:
        return Response(
            {'error': 'transactionId and gatewayReturnUrl are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Enhanced identifier matching - supports multiple identifier systems
    patient = None
    for ident in identifiers:
        system = ident.get('system', '').lower()
        value = ident.get('value')

        if not value:
            continue

        # PhilHealth ID
        if 'philhealth' in system:
            patient = Patient.objects.filter(philhealth_id=value).first()

        # Medical Record Number (MRN) - matches patient_id field
        elif 'mrn' in system or 'medical-record' in system:
            patient = Patient.objects.filter(patient_id=value).first()

        # Mobile number (for additional matching)
        elif 'phone' in system or 'mobile' in system:
            patient = Patient.objects.filter(mobile_number=value).first()

        # If patient found, stop searching
        if patient:
            break

    # Generate idempotency key for the response
    idempotency_key = str(uuid.uuid4())

    try:
        http_requests.post(
            return_url,
            headers={
                "X-API-Key": os.getenv('WAH4PC_API_KEY'),
                "X-Provider-ID": os.getenv('WAH4PC_PROVIDER_ID'),
                "Idempotency-Key": idempotency_key,
            },
            json={
                "transactionId": txn_id,
                "status": "SUCCESS" if patient else "REJECTED",
                "data": patient_to_fhir(patient) if patient else {"error": "Not found"},
            },
        )
    except http_requests.RequestException:
        return Response(
            {'error': 'Failed to send response to gateway'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({'message': 'Processing'})


@api_view(['GET'])
def list_providers(request):
    """List all active WAH4PC providers.

    This endpoint fetches the list of registered providers from the WAH4PC gateway.
    No authentication required as the gateway endpoint is public.

    Returns:
        Response: List of active providers with id, name, type, and isActive fields
    """
    providers = get_providers()
    return Response(providers, status=status.HTTP_200_OK)


@api_view(['GET'])
def list_transactions(request):
    """List WAH4PC transactions with optional filters.

    Query params:
        patient_id: Filter by patient ID
        status: Filter by transaction status (PENDING, COMPLETED, FAILED, etc.)
        type: Filter by transaction type (fetch, send)
    """
    txns = WAH4PCTransaction.objects.all().order_by('-created_at')

    # Apply filters
    patient_id = request.query_params.get('patient_id')
    if patient_id:
        txns = txns.filter(patient_id=patient_id)

    status_filter = request.query_params.get('status')
    if status_filter:
        txns = txns.filter(status=status_filter)

    type_filter = request.query_params.get('type')
    if type_filter:
        txns = txns.filter(type=type_filter)

    return Response([
        {
            'id': t.transaction_id,
            'type': t.type,
            'status': t.status,
            'patientId': t.patient_id,
            'targetProviderId': t.target_provider_id,
            'error': t.error_message,
            'createdAt': t.created_at,
            'updatedAt': t.updated_at,
        }
        for t in txns
    ])


@api_view(['GET'])
def get_transaction(request, transaction_id):
    """Get detailed information about a specific WAH4PC transaction.

    Args:
        transaction_id: The transaction ID to retrieve

    Returns:
        Transaction details including idempotency key
    """
    try:
        txn = WAH4PCTransaction.objects.get(transaction_id=transaction_id)
    except WAH4PCTransaction.DoesNotExist:
        return Response(
            {'error': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        'id': txn.transaction_id,
        'type': txn.type,
        'status': txn.status,
        'patientId': txn.patient_id,
        'targetProviderId': txn.target_provider_id,
        'error': txn.error_message,
        'idempotencyKey': txn.idempotency_key,
        'createdAt': txn.created_at,
        'updatedAt': txn.updated_at,
    })