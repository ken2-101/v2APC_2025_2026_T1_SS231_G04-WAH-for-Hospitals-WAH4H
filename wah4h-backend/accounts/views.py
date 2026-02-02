"""
accounts/views.py
API Views for Identity & Structure Management

Service Layer Pattern Implementation:
- Views are thin controllers
- Validation is handled by Serializers
- Business logic is delegated to Service Layer (accounts/services.py)
- Views only orchestrate: validate → call service → return response
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PractitionerRegistrationSerializer,
    OrganizationSerializer,
    LocationSerializer,
    PractitionerRoleSerializer,
)
from .services import (
    PractitionerService,
    OrganizationService,
    LocationService,
    PractitionerRoleService,
)

User = get_user_model()


# =============================================================================
# Helper: Generate JWT tokens
# =============================================================================

def get_tokens_for_user(user):
    """
    Generate JWT access and refresh tokens for a user.
    
    Args:
        user: User instance
        
    Returns:
        dict: Contains 'refresh' and 'access' token strings
    """
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# =============================================================================
# Practitioner Registration API (Service Layer Pattern)
# =============================================================================

class PractitionerRegistrationAPIView(generics.GenericAPIView):
    """
    Register a new Practitioner with optional User account creation.
    
    Architecture:
    1. Serializer validates data structure
    2. Service Layer handles business logic (deduplication, PRC validation)
    3. View orchestrates and returns response
    
    Payload Structure:
    {
        "practitioner": {
            "first_name": "Juan",
            "last_name": "Dela Cruz",
            "birth_date": "1980-01-15",
            "identifier": "PRAC-001",
            "qualification_identifier": "PRC-123456",
            ...
        },
        "user": {  // Optional
            "username": "jdelacruz",
            "email": "juan@hospital.ph",
            "password": "SecurePass123",
            "confirm_password": "SecurePass123",
            "role": "doctor"
        }
    }
    """
    
    serializer_class = PractitionerRegistrationSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        # Step 1: Validate request data structure
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Step 2: Extract validated data
        practitioner_data = serializer.validated_data['practitioner']
        user_data = serializer.validated_data.get('user')
        
        # Remove confirm_password from user_data if present
        if user_data and 'confirm_password' in user_data:
            user_data.pop('confirm_password')
        
        try:
            # Step 3: Delegate to Service Layer
            # This is where deduplication, PRC validation, and atomic creation happen
            practitioner = PractitionerService.register_practitioner(
                practitioner_data=practitioner_data,
                user_data=user_data
            )
            
            # Step 4: Prepare response
            response_data = {
                "success": True,
                "message": "Practitioner registered successfully",
                "practitioner": {
                    "practitioner_id": practitioner.practitioner_id,
                    "identifier": practitioner.identifier,
                    "first_name": practitioner.first_name,
                    "last_name": practitioner.last_name,
                    "qualification_identifier": practitioner.qualification_identifier,
                }
            }
            
            # If user account was created, add tokens and user info
            if user_data and hasattr(practitioner, 'user'):
                user = practitioner.user
                tokens = get_tokens_for_user(user)
                response_data["tokens"] = tokens
                response_data["user"] = {
                    "practitioner_id": practitioner.practitioner_id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except DjangoValidationError as e:
            # Service Layer validation errors (deduplication, PRC conflicts, etc.)
            # Convert Django ValidationError to DRF format
            error_message = e.message if hasattr(e, 'message') else str(e)
            return Response(
                {
                    "success": False,
                    "error": error_message,
                    "details": e.message_dict if hasattr(e, 'message_dict') else {}
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# Legacy Registration API (Deprecated)
# =============================================================================

class RegisterAPIView(generics.CreateAPIView):
    """
    DEPRECATED: Legacy registration endpoint.
    
    Use PractitionerRegistrationAPIView instead for proper Service Layer integration.
    This endpoint bypasses deduplication and PRC validation checks.
    
    Kept for backward compatibility only.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = get_tokens_for_user(user)

        return Response(
            {
                "success": True,
                "message": "User registered successfully",
                "tokens": tokens,
                "user": {
                    "id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


# =============================================================================
# Login API
# =============================================================================

class LoginAPIView(generics.GenericAPIView):
    """
    User authentication endpoint with Email-based Two-Factor Authentication.
    
    Two-step process:
    1. POST with email + password → Generates and sends OTP via email
    2. POST with email + password + otp → Validates OTP and returns JWT tokens
    
    Returns JWT tokens and user information including practitioner_id
    which is required for most subsequent API calls.
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from .services import AuthService
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        otp_code = request.data.get('otp', '').strip()
        
        # State 1: Request OTP (Password only - no OTP provided)
        if not otp_code:
            # Generate and send OTP via email
            AuthService.generate_login_otp(user)
            
            return Response(
                {
                    "success": True,
                    "message": "OTP sent to email",
                    "step": "otp_verification"
                },
                status=status.HTTP_200_OK,
            )
        
        # State 2: Verify OTP (Password + OTP provided)
        is_valid = AuthService.verify_login_otp(user, otp_code)
        
        if not is_valid:
            return Response(
                {
                    "success": False,
                    "message": "Invalid or expired OTP code"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # OTP verified successfully - generate JWT tokens
        tokens = get_tokens_for_user(user)

        # Build user response with practitioner_id
        user_data = {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
        }
        
        # Include practitioner_id (critical for frontend operations)
        # Since User.practitioner is the PK, user.practitioner is the Practitioner instance
        if hasattr(user, 'practitioner') and user.practitioner:
            user_data["practitioner_id"] = user.practitioner.practitioner_id
        
        return Response(
            {
                "success": True,
                "message": "Login successful",
                "tokens": tokens,
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# Organization Management APIs
# =============================================================================

class OrganizationCreateAPIView(generics.CreateAPIView):
    """
    Create a new Organization with deduplication checks.
    
    Service Layer ensures no duplicate (name + city) combinations.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [AllowAny]  # TODO: Add proper permissions
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            organization = OrganizationService.create_organization(
                data=serializer.validated_data
            )
            
            return Response(
                {
                    "success": True,
                    "message": "Organization created successfully",
                    "organization": OrganizationSerializer(organization).data
                },
                status=status.HTTP_201_CREATED
            )
            
        except DjangoValidationError as e:
            error_message = e.message if hasattr(e, 'message') else str(e)
            return Response(
                {
                    "success": False,
                    "error": error_message
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# Location Management APIs
# =============================================================================

class LocationCreateAPIView(generics.CreateAPIView):
    """
    Create a new Location with organizational scoping.
    
    Service Layer ensures identifier uniqueness within managing_organization.
    """
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]  # TODO: Add proper permissions
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            location = LocationService.create_location(
                data=serializer.validated_data
            )
            
            return Response(
                {
                    "success": True,
                    "message": "Location created successfully",
                    "location": LocationSerializer(location).data
                },
                status=status.HTTP_201_CREATED
            )
            
        except DjangoValidationError as e:
            error_message = e.message if hasattr(e, 'message') else str(e)
            return Response(
                {
                    "success": False,
                    "error": error_message
                },
                status=status.HTTP_400_BAD_REQUEST
            )
