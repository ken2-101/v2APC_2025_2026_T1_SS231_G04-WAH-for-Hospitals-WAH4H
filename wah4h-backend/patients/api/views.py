"""
Patient API Views
=================
Fortress Pattern: ViewSets provide CRUD operations with ACL-backed serializers.

All patient data retrieval flows through the Service Layer for consistency.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from patients.models import Patient, Condition, AllergyIntolerance, Immunization
from patients.api.serializers import (
    PatientListSerializer,
    PatientDetailSerializer,
    PatientCreateUpdateSerializer,
    ConditionSerializer,
    ConditionCreateSerializer,
    AllergySerializer,
    AllergyCreateSerializer,
    ImmunizationSerializer,
    ImmunizationCreateSerializer,
)
from patients.services import patient_acl


# ============================================================================
# PATIENT VIEWSET
# ============================================================================

class PatientViewSet(viewsets.ModelViewSet):
    """
    Patient ViewSet
    
    Provides CRUD operations for Patient resources.
    
    List/Retrieve: Uses ACL-delegated serializers for consistent DTOs
    Create/Update: Uses standard Django validation
    
    Endpoints:
        GET /patients/ - List patients (with search/filter)
        GET /patients/{id}/ - Retrieve patient details
        POST /patients/ - Create new patient
        PUT /patients/{id}/ - Update patient
        PATCH /patients/{id}/ - Partial update patient
        DELETE /patients/{id}/ - Delete patient
    """
    
    queryset = Patient.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['first_name', 'last_name', 'patient_id', 'middle_name']
    filterset_fields = ['gender', 'civil_status']
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        
        - list: Summary DTO via ACL
        - retrieve: Full details via ACL
        - create/update: Standard validation
        """
        if self.action == 'list':
            return PatientListSerializer
        elif self.action == 'retrieve':
            return PatientDetailSerializer
        else:  # create, update, partial_update
            return PatientCreateUpdateSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Custom search endpoint using ACL search function.
        
        Query params:
            q: Search term (required)
            limit: Max results (optional, default: 50)
        
        Example: GET /patients/search/?q=Juan&limit=10
        """
        query = request.query_params.get('q', '').strip()
        limit = int(request.query_params.get('limit', 50))
        
        if not query:
            return Response(
                {'error': 'Search query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = patient_acl.search_patients(query, limit)
        return Response(results, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def conditions(self, request, pk=None):
        """
        Get all conditions for a patient.
        
        Example: GET /patients/{id}/conditions/
        """
        try:
            pk = int(pk)
            conditions = patient_acl.get_patient_conditions(pk)
            return Response(conditions, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'error': 'Invalid patient ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def allergies(self, request, pk=None):
        """
        Get all allergies for a patient.
        
        Example: GET /patients/{id}/allergies/
        """
        try:
            pk = int(pk)
            allergies = patient_acl.get_patient_allergies(pk)
            return Response(allergies, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'error': 'Invalid patient ID'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================================
# CONDITION VIEWSET
# ============================================================================

class ConditionViewSet(viewsets.ModelViewSet):
    """
    Condition ViewSet
    
    Provides CRUD operations for FHIR Condition resources.
    
    Endpoints:
        GET /conditions/ - List conditions (with filter)
        GET /conditions/{id}/ - Retrieve condition details
        POST /conditions/ - Create new condition
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


# ============================================================================
# ALLERGY VIEWSET
# ============================================================================

class AllergyViewSet(viewsets.ModelViewSet):
    """
    Allergy Intolerance ViewSet
    
    Provides CRUD operations for FHIR AllergyIntolerance resources.
    
    Endpoints:
        GET /allergies/ - List allergies (with filter)
        GET /allergies/{id}/ - Retrieve allergy details
        POST /allergies/ - Create new allergy
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


# ============================================================================
# IMMUNIZATION VIEWSET
# ============================================================================

class ImmunizationViewSet(viewsets.ModelViewSet):
    """
    Immunization ViewSet
    
    Provides CRUD operations for PHCORE Immunization resources.
    
    Endpoints:
        GET /immunizations/ - List immunizations (with filter)
        GET /immunizations/{id}/ - Retrieve immunization details
        POST /immunizations/ - Create new immunization
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
