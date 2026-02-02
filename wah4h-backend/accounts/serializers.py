"""
accounts/serializers.py
Serializers for Identity & Structure Management

Service Layer Pattern Implementation:
- Serializers are for VALIDATION ONLY
- Business logic is delegated to accounts/services.py
- No .save() or .create() methods in composite serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from .models import Practitioner, Organization, Location, PractitionerRole

User = get_user_model()


# =============================================================================
# Practitioner Registration (Composite Serializer)
# =============================================================================

class PractitionerSerializer(serializers.ModelSerializer):
    """
    ModelSerializer for Practitioner validation.
    Used as a nested serializer in PractitionerRegistrationSerializer.
    
    Fields validated:
    - first_name, last_name (required)
    - birth_date (required for deduplication)
    - qualification_identifier (PRC License)
    """
    
    class Meta:
        model = Practitioner
        fields = [
            'identifier',
            'first_name',
            'middle_name',
            'last_name',
            'suffix_name',
            'gender',
            'birth_date',
            'qualification_identifier',
            'qualification_code',
            'qualification_period_start',
            'qualification_period_end',
            'telecom',
            'address_line',
            'address_city',
            'address_district',
            'address_state',
            'address_country',
            'address_postal_code',
            'communication_language',
            'photo_url',
        ]
        extra_kwargs = {
            'birth_date': {'required': True},  # Required for deduplication
            'first_name': {'required': True},
            'last_name': {'required': True},
        }


class UserRegistrationSerializer(serializers.Serializer):
    """
    Validation-only serializer for User account creation.
    Used as a nested serializer in PractitionerRegistrationSerializer.
    """
    
    username = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(max_length=255, required=False, default='staff')
    status = serializers.CharField(max_length=100, required=False, default='active')
    
    def validate(self, attrs):
        """Ensure passwords match."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "password": "Passwords must match."
            })
        return attrs


class PractitionerRegistrationSerializer(serializers.Serializer):
    """
    Composite serializer for Practitioner + User registration.
    
    Architecture:
    - This is a VALIDATION-ONLY serializer (uses serializers.Serializer base)
    - Does NOT implement .save() or .create()
    - Business logic is delegated to PractitionerService.register_practitioner()
    
    Structure:
    - practitioner: Required nested object (validated by PractitionerSerializer)
    - user: Optional nested object (validated by UserRegistrationSerializer)
    
    Usage in View:
        serializer = PractitionerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        practitioner = PractitionerService.register_practitioner(
            practitioner_data=serializer.validated_data['practitioner'],
            user_data=serializer.validated_data.get('user')
        )
    """
    
    practitioner = PractitionerSerializer(required=True)
    user = UserRegistrationSerializer(required=False, allow_null=True)
    
    def validate(self, attrs):
        """
        Additional cross-field validation if needed.
        
        Note: Deduplication and PRC license validation happens in the Service Layer,
        not here. This keeps serializers focused on data structure validation.
        """
        return attrs


# =============================================================================
# Legacy/Simple Registration (Deprecated - Use PractitionerRegistrationSerializer)
# =============================================================================

class RegisterSerializer(serializers.ModelSerializer):
    """
    DEPRECATED: This serializer bypasses Service Layer validation.
    Use PractitionerRegistrationSerializer instead.
    
    Kept for backward compatibility only.
    """
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "role",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"password": "Passwords must match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=validated_data.get("role", "admin"),
        )

        return user


# =============================================================================
# Authentication Serializers
# =============================================================================

class LoginSerializer(serializers.Serializer):
    """
    Serializer for user authentication with Email 2FA.
    
    Two-step authentication:
    1. email + password → Triggers OTP generation
    2. email + password + otp → Validates OTP and returns JWT tokens
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    otp = serializers.CharField(max_length=6, required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        # IMPORTANT: Our database stores usernames, not emails as login identifiers.
        # Users log in with email, but we must authenticate with username.
        # Step 1: Look up the user by email
        try:
            user_obj = User.objects.get(email=email)
            username = user_obj.username
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")
        
        # Step 2: Authenticate using the username
        user = authenticate(
            username=username,
            password=password
        )

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")

        attrs["user"] = user
        return attrs


# =============================================================================
# Organization & Location Serializers
# =============================================================================

class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization CRUD operations."""
    
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ('organization_id', 'created_at', 'updated_at')


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for Location CRUD operations."""
    
    class Meta:
        model = Location
        fields = '__all__'
        read_only_fields = ('location_id', 'created_at', 'updated_at')


class PractitionerRoleSerializer(serializers.ModelSerializer):
    """Serializer for PractitionerRole CRUD operations."""
    
    class Meta:
        model = PractitionerRole
        fields = '__all__'
        read_only_fields = ('practitioner_role_id', 'created_at', 'updated_at')
