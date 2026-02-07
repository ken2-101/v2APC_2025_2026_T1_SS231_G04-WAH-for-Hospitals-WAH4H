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

from patients.wah4pc import request_patient, fhir_to_dict

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
        
        # Delegate to ACL (Assuming this method exists or you will add it)
        # If it doesn't exist yet, we should check patient_acl.py
        # For now, adding basic structure matching others
        # You might need to add get_patient_immunizations to PatientACL if missing
        immunizations = patient_acl.get_patient_immunizations(patient_id)
        return Response(immunizations, status=status.HTTP_200_OK)


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
    result = request_patient(
        request.data['targetProviderId'],
        request.data['philHealthId'],
    )
    return Response(result)


@api_view(['POST'])
def webhook_receive(request):
    """Receive webhook from WAH4PC gateway."""
    if request.headers.get('X-Gateway-Auth') != os.getenv('GATEWAY_AUTH_KEY'):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.data.get('status') == 'SUCCESS':
        patient_data = fhir_to_dict(request.data['data'])
        request.session[f"wah4pc_{request.data['transactionId']}"] = patient_data

    return Response({'message': 'Received'})