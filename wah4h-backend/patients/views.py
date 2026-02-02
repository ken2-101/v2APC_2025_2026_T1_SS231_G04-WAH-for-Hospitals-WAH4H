# patients/views.py
"""
API Layer for Patients App
Thin ViewSets that delegate all business logic to PatientService and ClinicalService

Architecture:
- No business logic in views
- CQRS: Use get_serializer_class() to switch between Input/Output serializers
- Proper error handling with appropriate HTTP status codes
- Lookup by external patient_id (not internal PK)
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from patients.models import Patient, Condition, AllergyIntolerance, Immunization
from patients.serializers import (
    PatientRegistrationSerializer,
    PatientUpdateSerializer,
    PatientDetailSerializer,
    PatientSummarySerializer,
    ConditionInputSerializer,
    ConditionOutputSerializer,
    AllergyIntoleranceInputSerializer,
    AllergyIntoleranceOutputSerializer,
    ImmunizationInputSerializer,
    ImmunizationOutputSerializer,
    PatientClinicalSummarySerializer
)
from patients.services import (
    PatientService,
    ClinicalService,
    DuplicatePatientError,
    get_patient_clinical_summary
)
from accounts.models import Practitioner


# ============================================================================
# PATIENT VIEWSET
# ============================================================================

class PatientViewSet(viewsets.ModelViewSet):
    """
    API Endpoints for Patient Management
    
    Endpoints:
    - POST /api/patients/ : Register new patient
    - GET /api/patients/ : List/search patients
    - GET /api/patients/{patient_id}/ : Retrieve patient details
    - PATCH /api/patients/{patient_id}/ : Update patient demographics
    - DELETE /api/patients/{patient_id}/ : Soft delete patient
    - GET /api/patients/{patient_id}/clinical-summary/ : Get clinical summary
    """
    
    queryset = Patient.objects.all().order_by('-created_at')
    lookup_field = 'patient_id'  # Use external ID, not internal PK
    lookup_value_regex = r'[^/]+'  # Allow hyphens in patient_id
    
    # Search and filtering
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'middle_name', 'patient_id', 'mobile_number', 'philhealth_id']
    ordering_fields = ['last_name', 'first_name', 'created_at', 'birthdate']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        CQRS: Use different serializers for read vs write operations
        """
        if self.action == 'create':
            return PatientRegistrationSerializer
        elif self.action in ['update', 'partial_update']:
            return PatientUpdateSerializer
        elif self.action == 'list':
            return PatientSummarySerializer
        elif self.action == 'retrieve':
            return PatientDetailSerializer
        return PatientDetailSerializer
    
    def get_queryset(self):
        """
        Optionally filter queryset by query parameters
        """
        queryset = super().get_queryset()
        
        # Handle search via query param 'q'
        query = self.request.query_params.get('q', None)
        philhealth_id = self.request.query_params.get('philhealth_id', None)
        
        if query or philhealth_id:
            # Delegate to service layer for complex search
            return PatientService.search_patients(
                query=query,
                philhealth_id=philhealth_id
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/patients/
        Register a new patient via PatientService
        
        Returns:
        - 201 Created: Patient successfully registered
        - 400 Bad Request: Validation error
        - 409 Conflict: Duplicate patient detected
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            patient = PatientService.register_patient(serializer.validated_data)
            
            # Return full detail representation
            output_serializer = PatientDetailSerializer(patient)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except DuplicatePatientError as e:
            return Response(
                {'error': 'Duplicate patient detected', 'detail': str(e)},
                status=status.HTTP_409_CONFLICT
            )
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/patients/{patient_id}/
        Update patient demographics via PatientService
        
        Returns:
        - 200 OK: Patient successfully updated
        - 400 Bad Request: Validation error or attempting to update protected fields
        - 404 Not Found: Patient not found
        """
        patient = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to service layer
            updated_patient = PatientService.update_patient_demographics(
                patient=patient,
                data=serializer.validated_data
            )
            
            # Return full detail representation
            output_serializer = PatientDetailSerializer(updated_patient)
            return Response(output_serializer.data)
            
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/patients/
        List/search patients with lightweight serializer
        
        Query Parameters:
        - q: Search term for name matching
        - philhealth_id: Exact PhilHealth ID match
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/patients/{patient_id}/
        Retrieve full patient details
        """
        patient = self.get_object()
        serializer = self.get_serializer(patient)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='clinical-summary')
    def clinical_summary(self, request, patient_id=None):
        """
        GET /api/patients/{patient_id}/clinical-summary/
        Get aggregated clinical data summary
        
        Returns:
        - Active/total conditions count
        - Active/total allergies count
        - Total immunizations count
        """
        patient = self.get_object()
        
        try:
            summary_data = get_patient_clinical_summary(patient)
            serializer = PatientClinicalSummarySerializer(summary_data)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Failed to generate clinical summary', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# CLINICAL VIEWSETS
# ============================================================================

class ConditionViewSet(viewsets.ModelViewSet):
    """
    API Endpoints for Condition Management
    
    Endpoints:
    - POST /api/conditions/ : Record new condition
    - GET /api/conditions/ : List conditions (filterable by patient_id)
    - GET /api/conditions/{id}/ : Retrieve condition details
    """
    
    queryset = Condition.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        """CQRS: Different serializers for read vs write"""
        if self.action == 'create':
            return ConditionInputSerializer
        return ConditionOutputSerializer
    
    def get_queryset(self):
        """Filter by patient_id if provided"""
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id', None)
        
        if patient_id:
            queryset = queryset.filter(subject_id__patient_id=patient_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/conditions/
        Record a new condition via ClinicalService
        
        Returns:
        - 201 Created: Condition successfully recorded
        - 400 Bad Request: Validation error
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Extract relationships from validated data
            patient = serializer.validated_data.pop('subject_id')
            encounter = serializer.validated_data.pop('encounter_id')
            recorder = serializer.validated_data.pop('recorder_id', None)
            
            # If recorder not provided, use current authenticated user's practitioner
            if not recorder and hasattr(request.user, 'practitioner'):
                recorder = request.user.practitioner
            
            # Delegate to service layer
            condition = ClinicalService.record_condition(
                patient=patient,
                data=serializer.validated_data,
                recorder=recorder,
                encounter=encounter
            )
            
            # Return full detail representation
            output_serializer = ConditionOutputSerializer(condition)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class AllergyIntoleranceViewSet(viewsets.ModelViewSet):
    """
    API Endpoints for Allergy/Intolerance Management
    
    Endpoints:
    - POST /api/allergies/ : Record new allergy/intolerance
    - GET /api/allergies/ : List allergies (filterable by patient_id)
    - GET /api/allergies/{id}/ : Retrieve allergy details
    """
    
    queryset = AllergyIntolerance.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        """CQRS: Different serializers for read vs write"""
        if self.action == 'create':
            return AllergyIntoleranceInputSerializer
        return AllergyIntoleranceOutputSerializer
    
    def get_queryset(self):
        """Filter by patient_id if provided"""
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id', None)
        
        if patient_id:
            queryset = queryset.filter(patient_id__patient_id=patient_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/allergies/
        Record a new allergy/intolerance via ClinicalService
        
        Returns:
        - 201 Created: Allergy successfully recorded
        - 400 Bad Request: Validation error
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Extract relationships from validated data
            patient = serializer.validated_data.pop('patient_id')
            encounter = serializer.validated_data.pop('encounter_id')
            recorder = serializer.validated_data.pop('recorder_id', None)
            
            # If recorder not provided, use current authenticated user's practitioner
            if not recorder and hasattr(request.user, 'practitioner'):
                recorder = request.user.practitioner
            
            # Delegate to service layer
            allergy = ClinicalService.record_allergy(
                patient=patient,
                data=serializer.validated_data,
                recorder=recorder,
                encounter=encounter
            )
            
            # Return full detail representation
            output_serializer = AllergyIntoleranceOutputSerializer(allergy)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ImmunizationViewSet(viewsets.ModelViewSet):
    """
    API Endpoints for Immunization Management
    
    Endpoints:
    - POST /api/immunizations/ : Record new immunization
    - GET /api/immunizations/ : List immunizations (filterable by patient_id)
    - GET /api/immunizations/{id}/ : Retrieve immunization details
    """
    
    queryset = Immunization.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        """CQRS: Different serializers for read vs write"""
        if self.action == 'create':
            return ImmunizationInputSerializer
        return ImmunizationOutputSerializer
    
    def get_queryset(self):
        """Filter by patient_id if provided"""
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get('patient_id', None)
        
        if patient_id:
            queryset = queryset.filter(patient_id__patient_id=patient_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/immunizations/
        Record a new immunization via ClinicalService
        
        Returns:
        - 201 Created: Immunization successfully recorded
        - 400 Bad Request: Validation error
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Extract relationships from validated data
            patient = serializer.validated_data.pop('patient_id')
            encounter = serializer.validated_data.pop('encounter_id')
            performer = serializer.validated_data.pop('performer_id', None)
            location = serializer.validated_data.pop('location_id', None)
            
            # If performer not provided, use current authenticated user's practitioner
            if not performer and hasattr(request.user, 'practitioner'):
                performer = request.user.practitioner
            
            # Delegate to service layer
            immunization = ClinicalService.record_immunization(
                patient=patient,
                data=serializer.validated_data,
                performer=performer,
                encounter=encounter,
                location=location
            )
            
            # Return full detail representation
            output_serializer = ImmunizationOutputSerializer(immunization)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
