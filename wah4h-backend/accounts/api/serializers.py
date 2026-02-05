"""
accounts/api/serializers.py
API Serializers following CQRS-Lite Pattern (Input vs Output)

Architecture:
- Input Serializers: For write operations (create/update) - passed to services
- Output Serializers: For read operations (list/retrieve) - flattened DTOs
- Strict separation prevents leaking internal model structure

Context: Philippine LGU Hospital System
"""

from rest_framework import serializers
from accounts.models import Organization, Location, Practitioner, PractitionerRole


# =============================================================================
# Organization Serializers
# =============================================================================

class OrganizationInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for Organization creation/updates.
    
    Usage: POST/PUT/PATCH requests.
    Passed directly to OrganizationService.create_organization()
    """
    
    class Meta:
        model = Organization
        fields = [
            'active',
            'nhfr_code',
            'type_code',
            'name',
            'alias',
            'telecom',
            'endpoint',
            'part_of_organization',
            'address_line',
            'address_city',
            'address_district',
            'address_state',
            'address_country',
            'address_postal_code',
            'contact_purpose',
            'contact_first_name',
            'contact_last_name',
            'contact_telecom',
            'contact_address_line',
            'contact_address_city',
            'contact_address_state',
            'contact_address_country',
            'contact_postal_code',
        ]
        extra_kwargs = {
            'name': {'required': True},
        }


class OrganizationOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for Organization reads.
    
    Usage: GET requests (list/retrieve).
    Flattened DTO - includes computed/related fields.
    """
    
    part_of_organization_name = serializers.CharField(
        source='part_of_organization.name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = Organization
        fields = [
            'organization_id',
            'active',
            'nhfr_code',
            'type_code',
            'name',
            'alias',
            'telecom',
            'address_line',
            'address_city',
            'address_district',
            'address_state',
            'address_country',
            'part_of_organization',
            'part_of_organization_name',
            'created_at',
            'updated_at',
        ]


# =============================================================================
# Location Serializers
# =============================================================================

class LocationInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for Location creation/updates.
    
    Usage: POST/PUT/PATCH requests.
    Passed directly to LocationService.create_location()
    """
    
    class Meta:
        model = Location
        fields = [
            'identifier',
            'status',
            'physical_type_code',
            'type_code',
            'operational_status',
            'mode',
            'name',
            'alias',
            'description',
            'telecom',
            'longitude',
            'latitude',
            'altitude',
            'managing_organization',
            'part_of_location',
            'endpoint',
            'address_line',
            'address_city',
            'address_district',
            'address_state',
            'address_country',
            'address_postal_code',
            'hours_of_operation_days',
            'hours_of_operation_all_day',
            'opening_time',
            'closing_time',
            'availability_exceptions',
        ]
        extra_kwargs = {
            'status': {'required': False},  # Defaulted by service
        }


class LocationOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for Location reads.
    
    Usage: GET requests (list/retrieve).
    Flattened DTO - includes computed/related fields.
    """
    
    managing_organization_name = serializers.CharField(
        source='managing_organization.name',
        read_only=True,
        allow_null=True
    )
    part_of_location_name = serializers.CharField(
        source='part_of_location.name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = Location
        fields = [
            'location_id',
            'identifier',
            'status',
            'type_code',
            'name',
            'description',
            'managing_organization',
            'managing_organization_name',
            'part_of_location',
            'part_of_location_name',
            'address_line',
            'address_city',
            'address_district',
            'address_state',
            'created_at',
            'updated_at',
        ]


# =============================================================================
# Practitioner Serializers (CQRS with Nested User Write)
# =============================================================================

class UserInputSerializer(serializers.Serializer):
    """
    Nested serializer for User account creation within Practitioner registration.
    
    Critical: This is NOT a ModelSerializer to avoid Django's .save() auto-behavior.
    We manually extract this data and pass it to PractitionerService.register_practitioner()
    """
    
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(
        max_length=255,
        write_only=True,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    role = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    status = serializers.CharField(max_length=100, default='active')
    
    # Optional overrides (default to practitioner's name if not provided)
    first_name = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    last_name = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)


class PractitionerInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for Practitioner registration.
    
    Usage: POST requests.
    Supports nested User account creation via 'user' field.
    
    Critical Architecture:
    - This serializer does NOT call .save()
    - Data is extracted and passed to PractitionerService.register_practitioner()
    - Service handles atomic creation of both Practitioner and User
    """
    
    user = UserInputSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Practitioner
        fields = [
            'identifier',
            'active',
            'first_name',
            'middle_name',
            'last_name',
            'suffix_name',
            'gender',
            'birth_date',
            'photo_url',
            'telecom',
            'communication_language',
            'address_line',
            'address_city',
            'address_district',
            'address_state',
            'address_country',
            'address_postal_code',
            'qualification_code',
            'qualification_identifier',  # PRC License Number
            'qualification_issuer',
            'qualification_period_start',
            'qualification_period_end',
            'user',  # Nested user account creation
        ]
        extra_kwargs = {
            'identifier': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'qualification_identifier': {'required': True},  # PRC License is mandatory
        }


class PractitionerOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for Practitioner reads.
    
    Usage: GET requests (list/retrieve).
    Flattened DTO - includes computed fields and user relationship.
    """
    
    full_name = serializers.SerializerMethodField()
    license_number = serializers.CharField(source='qualification_identifier', read_only=True)
    user_id = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    qualification_issuer_name = serializers.CharField(
        source='qualification_issuer.name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = Practitioner
        fields = [
            'practitioner_id',
            'identifier',
            'active',
            'first_name',
            'middle_name',
            'last_name',
            'suffix_name',
            'full_name',
            'gender',
            'birth_date',
            'photo_url',
            'telecom',
            'license_number',
            'qualification_code',
            'qualification_issuer',
            'qualification_issuer_name',
            'qualification_period_start',
            'qualification_period_end',
            'user_id',
            'user_username',
            'created_at',
            'updated_at',
        ]
    
    def get_full_name(self, obj):
        """Compute full name from first + last"""
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.suffix_name]
        return ' '.join(filter(None, parts))
    
    def get_user_id(self, obj):
        """Return linked user ID if exists"""
        try:
            return obj.user.practitioner.practitioner_id if hasattr(obj, 'user') and obj.user else None
        except Exception:
            return None
    
    def get_user_username(self, obj):
        """Return linked user username if exists"""
        try:
            return obj.user.username if hasattr(obj, 'user') and obj.user else None
        except Exception:
            return None


# =============================================================================
# PractitionerRole Serializers
# =============================================================================

class PractitionerRoleInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for PractitionerRole assignment.
    
    Usage: POST requests.
    Passed to PractitionerRoleService.assign_role()
    """
    
    class Meta:
        model = PractitionerRole
        fields = [
            'identifier',
            'active',
            'practitioner',
            'organization',
            'location',
            'role_code',
            'specialty_code',
            'telecom',
            'period_start',
            'period_end',
            'available_days_of_week',
            'available_all_day_flag',
            'available_start_time',
            'available_end_time',
            'availability_exceptions',
            'not_available_description',
            'not_available_period_start',
            'not_available_period_end',
            'endpoint',
            'healthcare_service',
        ]
        extra_kwargs = {
            'identifier': {'required': True},
            'practitioner': {'required': True},
            'organization': {'required': True},
        }


class PractitionerRoleOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for PractitionerRole reads.
    
    Usage: GET requests (list/retrieve).
    Flattened DTO - includes related names.
    """
    
    practitioner_name = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    location_name = serializers.CharField(
        source='location.name',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = PractitionerRole
        fields = [
            'practitioner_role_id',
            'identifier',
            'active',
            'practitioner',
            'practitioner_name',
            'organization',
            'organization_name',
            'location',
            'location_name',
            'role_code',
            'specialty_code',
            'period_start',
            'period_end',
            'available_days_of_week',
            'available_all_day_flag',
            'available_start_time',
            'available_end_time',
            'created_at',
            'updated_at',
        ]
    
    def get_practitioner_name(self, obj):
        """Compute practitioner full name"""
        p = obj.practitioner
        return f"{p.first_name} {p.last_name}" if p else None


# =============================================================================
# Auth Serializers
# =============================================================================

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Token Serializer to return User details along with tokens.
    
    Structure Matches Frontend Expectation:
    {
        "tokens": {
            "access": "...",
            "refresh": "..."
        },
        "user": {
            "id": 1,
            "email": "...",
            "first_name": "...",
            "last_name": "...",
            "role": "..."
        }
    }
    """
    
    def validate(self, attrs):
        # Support login with email by mapping it to username
        if 'email' in attrs and 'username' not in attrs:
            attrs['username'] = attrs['email']
            
        data = super().validate(attrs)
        
        # Add user details to response
        user_data = {
            "id": self.user.practitioner_id,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "role": self.user.role,
        }
        
        return {
            "tokens": data,
            "user": user_data
        }


class UserRegistrationSerializer(serializers.Serializer):
    """
    Serializer for simplified User Registration from Frontend.
    
    Adapts flat frontend data to Backend's Practitioner + User structure.
    Generates required identifiers for Practitioner if missing.
    """
    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.CharField(max_length=50)
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data
