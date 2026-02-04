"""
accounts/api/views.py
API ViewSets following Fortress Pattern (Hybrid Read/Write Strategy)

Architecture:
- Read Operations: Standard QuerySet + OutputSerializer (fast, no service overhead)
- Write Operations: Delegate to Service Layer (business logic enforcement)
- NEVER call .save() on serializers for write operations

Context: Philippine LGU Hospital System
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.exceptions import ValidationError as DjangoValidationError

from accounts.models import Organization, Location, Practitioner, PractitionerRole
from accounts.services.accounts_services import (
    OrganizationService,
    LocationService,
    PractitionerService,
    PractitionerRoleService,
)
from accounts.api.serializers import (
    OrganizationInputSerializer,
    OrganizationOutputSerializer,
    LocationInputSerializer,
    LocationOutputSerializer,
    PractitionerInputSerializer,
    PractitionerOutputSerializer,
    PractitionerRoleInputSerializer,
    PractitionerRoleOutputSerializer,
)


# =============================================================================
# Organization ViewSet
# =============================================================================

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Organization management.
    
    Architecture:
    - Read (list/retrieve): Direct QuerySet access
    - Write (create): Delegate to OrganizationService
    
    Endpoints:
    - GET    /api/accounts/organizations/       - List all organizations
    - POST   /api/accounts/organizations/       - Create organization
    - GET    /api/accounts/organizations/{id}/  - Retrieve organization
    - PUT    /api/accounts/organizations/{id}/  - Update organization
    - PATCH  /api/accounts/organizations/{id}/  - Partial update
    - DELETE /api/accounts/organizations/{id}/  - Delete organization
    """
    
    queryset = Organization.objects.all()
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        
        Read operations (list, retrieve): OutputSerializer
        Write operations (create, update, partial_update): InputSerializer
        """
        if self.action in ['list', 'retrieve']:
            return OrganizationOutputSerializer
        return OrganizationInputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new Organization via OrganizationService.
        
        Pattern: Fortress Write
        1. Validate input via serializer
        2. Extract validated data
        3. Pass to service for business logic enforcement
        4. Return created instance via OutputSerializer
        """
        # Step 1: Validate input
        input_serializer = OrganizationInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        
        try:
            # Step 2: Delegate to service (handles deduplication, validation)
            organization = OrganizationService.create_organization(
                data=input_serializer.validated_data
            )
            
            # Step 3: Return created instance
            output_serializer = OrganizationOutputSerializer(organization)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# Location ViewSet
# =============================================================================

class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Location management.
    
    Architecture:
    - Read (list/retrieve): Direct QuerySet access
    - Write (create): Delegate to LocationService
    
    Endpoints:
    - GET    /api/accounts/locations/       - List all locations
    - POST   /api/accounts/locations/       - Create location
    - GET    /api/accounts/locations/{id}/  - Retrieve location
    - PUT    /api/accounts/locations/{id}/  - Update location
    - PATCH  /api/accounts/locations/{id}/  - Partial update
    - DELETE /api/accounts/locations/{id}/  - Delete location
    """
    
    queryset = Location.objects.all()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['list', 'retrieve']:
            return LocationOutputSerializer
        return LocationInputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new Location via LocationService.
        
        Pattern: Fortress Write
        Service handles:
        - Default status assignment
        - Organizational scoping validation
        - Identifier uniqueness checks
        """
        # Step 1: Validate input
        input_serializer = LocationInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        
        try:
            # Step 2: Delegate to service
            location = LocationService.create_location(
                data=input_serializer.validated_data
            )
            
            # Step 3: Return created instance
            output_serializer = LocationOutputSerializer(location)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# Practitioner ViewSet (Critical: Nested User Creation)
# =============================================================================

class PractitionerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Practitioner registration and management.
    
    Architecture:
    - Read (list/retrieve): Direct QuerySet access
    - Write (create): Delegate to PractitionerService
    
    Critical Features:
    - Nested User account creation via 'user' field in POST payload
    - PRC License validation
    - Deduplication enforcement (Name + Birthdate)
    - 1:1 User-Practitioner relationship enforcement
    
    Endpoints:
    - GET    /api/accounts/practitioners/       - List all practitioners
    - POST   /api/accounts/practitioners/       - Register practitioner (+ optional user)
    - GET    /api/accounts/practitioners/{id}/  - Retrieve practitioner
    - PUT    /api/accounts/practitioners/{id}/  - Update practitioner
    - PATCH  /api/accounts/practitioners/{id}/  - Partial update
    - DELETE /api/accounts/practitioners/{id}/  - Delete practitioner
    """
    
    queryset = Practitioner.objects.all()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['list', 'retrieve']:
            return PractitionerOutputSerializer
        return PractitionerInputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Register a new Practitioner via PractitionerService.
        
        Pattern: Fortress Write with Nested User Creation
        
        Request Body Example:
        {
            "identifier": "PRAC-001",
            "first_name": "Juan",
            "last_name": "Dela Cruz",
            "birth_date": "1985-03-15",
            "qualification_identifier": "PRC-1234567",
            "telecom": "+639171234567",
            "user": {
                "username": "juan.delacruz",
                "password": "SecurePass123!",
                "email": "juan@hospital.gov.ph",
                "role": "Doctor",
                "status": "active"
            }
        }
        
        Service Handles:
        - Deduplication (Name + Birthdate)
        - PRC License uniqueness validation
        - Atomic Practitioner + User creation
        - Password hashing
        - Username/Email uniqueness checks
        """
        # Step 1: Validate input
        input_serializer = PractitionerInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        
        try:
            # Step 2: Extract practitioner and user data
            validated_data = input_serializer.validated_data
            user_data = validated_data.pop('user', None)  # Extract nested user data
            
            # Step 3: Delegate to service (atomic transaction)
            practitioner = PractitionerService.register_practitioner(
                practitioner_data=validated_data,
                user_data=user_data
            )
            
            # Step 4: Return created instance
            output_serializer = PractitionerOutputSerializer(practitioner)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# PractitionerRole ViewSet
# =============================================================================

class PractitionerRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PractitionerRole assignment and management.
    
    Architecture:
    - Read (list/retrieve): Direct QuerySet access
    - Write (create): Delegate to PractitionerRoleService
    
    Business Rules:
    - Prevents overlapping active roles (same practitioner + organization + location + role_code)
    - Supports role-based access control (RBAC)
    
    Endpoints:
    - GET    /api/accounts/practitioner-roles/       - List all roles
    - POST   /api/accounts/practitioner-roles/       - Assign role
    - GET    /api/accounts/practitioner-roles/{id}/  - Retrieve role
    - PUT    /api/accounts/practitioner-roles/{id}/  - Update role
    - PATCH  /api/accounts/practitioner-roles/{id}/  - Partial update
    - DELETE /api/accounts/practitioner-roles/{id}/  - Delete role
    """
    
    queryset = PractitionerRole.objects.all()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ['list', 'retrieve']:
            return PractitionerRoleOutputSerializer
        return PractitionerRoleInputSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Assign a new PractitionerRole via PractitionerRoleService.
        
        Pattern: Fortress Write
        Service handles:
        - Overlapping role validation
        - Authorization rule enforcement
        """
        # Step 1: Validate input
        input_serializer = PractitionerRoleInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        
        try:
            # Step 2: Extract required data
            validated_data = input_serializer.validated_data
            practitioner = validated_data.pop('practitioner')
            organization = validated_data.pop('organization')
            
            # Step 3: Delegate to service
            practitioner_role = PractitionerRoleService.assign_role(
                practitioner=practitioner,
                organization=organization,
                data=validated_data
            )
            
            # Step 4: Return created instance
            output_serializer = PractitionerRoleOutputSerializer(practitioner_role)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
