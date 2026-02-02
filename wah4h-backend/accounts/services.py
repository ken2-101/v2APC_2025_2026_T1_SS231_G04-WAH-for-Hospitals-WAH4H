"""
accounts/services.py
Service Layer for Identity & Structure Management

Context: Philippine LGU Hospital System
- Low connectivity environments (TOTP over SMS)
- Shared device scenarios (strict 1:1 User-Practitioner linking)
- Manual data entry (requires deduplication)
- PRC License validation (professional authority)
"""

from typing import Dict, Optional, Any
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from datetime import datetime

from .models import (
    Organization,
    Location,
    Practitioner,
    PractitionerRole,
    User,
)


# =============================================================================
# Organization Service
# =============================================================================

class OrganizationService:
    """
    Manages Organization entities (Hospitals, Clinics, Departments).
    
    Business Rules:
    - Enforce uniqueness on (name + address_city) to prevent duplicate
      entries like "General Hospital" appearing twice in the same city.
    """
    
    @staticmethod
    @transaction.atomic
    def create_organization(data: Dict[str, Any]) -> Organization:
        """
        Create a new Organization with deduplication.
        
        Args:
            data: Dictionary containing organization fields from validated serializer
            
        Returns:
            Organization instance
            
        Raises:
            ValidationError: If organization with same name+city already exists
        """
        name = data.get('name')
        address_city = data.get('address_city')
        
        # Deduplication: Prevent duplicate hospitals in same city
        # Critical for LGU environments where manual entry is common
        if name and address_city:
            existing = Organization.objects.filter(
                name__iexact=name,
                address_city__iexact=address_city
            ).exists()
            
            if existing:
                raise ValidationError(
                    f"Organization '{name}' already exists in {address_city}. "
                    "Please verify if this is a duplicate entry."
                )
        
        organization = Organization.objects.create(**data)
        return organization


# =============================================================================
# Location Service
# =============================================================================

class LocationService:
    """
    Manages Location entities (Wards, Rooms, Buildings).
    
    Business Rules:
    - Identifier must be unique per managing_organization
    - Default status to 'active' if not provided
    """
    
    @staticmethod
    @transaction.atomic
    def create_location(data: Dict[str, Any]) -> Location:
        """
        Create a new Location with organizational scoping.
        
        Args:
            data: Dictionary containing location fields
            
        Returns:
            Location instance
            
        Raises:
            ValidationError: If identifier conflicts within same organization
        """
        # Default status to 'active' if not provided
        if 'status' not in data or not data['status']:
            data['status'] = 'active'
        
        identifier = data.get('identifier')
        managing_organization = data.get('managing_organization')
        
        # Ensure identifier is unique within the managing organization
        # This allows different hospitals to use same room numbers (e.g., "Ward-A")
        if identifier and managing_organization:
            existing = Location.objects.filter(
                identifier=identifier,
                managing_organization=managing_organization
            ).exists()
            
            if existing:
                org_name = managing_organization.name if hasattr(managing_organization, 'name') else 'this organization'
                raise ValidationError(
                    f"Location with identifier '{identifier}' already exists in {org_name}."
                )
        
        location = Location.objects.create(**data)
        return location


# =============================================================================
# Practitioner Service (Core Identity & PRC Validation)
# =============================================================================

class PractitionerService:
    """
    Manages Practitioner (Healthcare Provider) registration and identity.
    
    Critical Business Rules:
    1. Deduplication: Name + Birthdate must be unique (prevents duplicate records)
    2. PRC License: qualification_identifier must be unique across active practitioners
    3. User Linking: Enforces 1:1 relationship to prevent credential sharing
    
    Context: Philippine Professional Regulation Commission (PRC) licenses are
    the legal source of truth for medical authority.
    """
    
    @staticmethod
    @transaction.atomic
    def register_practitioner(
        practitioner_data: Dict[str, Any],
        user_data: Optional[Dict[str, Any]] = None
    ) -> Practitioner:
        """
        Register a new Practitioner with optional User account creation.
        
        Step 1: Deduplication - Prevent duplicate identity records
        Step 2: PRC License Validation - Ensure professional credentials are unique
        Step 3: Atomic Creation - Create Practitioner and optionally User
        
        Args:
            practitioner_data: Dictionary with practitioner fields (first_name, last_name, etc.)
            user_data: Optional dictionary with user account fields (username, password, email, etc.)
            
        Returns:
            Practitioner instance (with linked User if user_data provided)
            
        Raises:
            ValidationError: If deduplication fails or PRC license conflict detected
        """
        first_name = practitioner_data.get('first_name')
        last_name = practitioner_data.get('last_name')
        birth_date = practitioner_data.get('birth_date')
        qualification_identifier = practitioner_data.get('qualification_identifier')
        
        # -------------------------------------------------------------------------
        # STEP 1: Deduplication Check
        # -------------------------------------------------------------------------
        # In LGU hospitals, manual entry often leads to duplicate records.
        # We enforce strict identity matching on Name + Birthdate.
        if first_name and last_name and birth_date:
            existing_practitioner = Practitioner.objects.filter(
                first_name__iexact=first_name,
                last_name__iexact=last_name,
                birth_date=birth_date
            ).first()
            
            if existing_practitioner:
                raise ValidationError(
                    f"Practitioner '{first_name} {last_name}' with birthdate {birth_date} "
                    f"already exists (ID: {existing_practitioner.practitioner_id}). "
                    "Please verify if this is a duplicate entry or use the existing record."
                )
        
        # -------------------------------------------------------------------------
        # STEP 2: PRC License Validation
        # -------------------------------------------------------------------------
        # The qualification_identifier is the PRC License Number in the Philippines.
        # This MUST be unique across all active practitioners as it represents
        # legal authority to practice medicine.
        #
        # CRITICAL: We check for ANY existing practitioner (active=True) with this license.
        # This prevents license reuse and ensures professional credential integrity.
        if qualification_identifier:
            existing_with_license = Practitioner.objects.filter(
                qualification_identifier=qualification_identifier
            ).filter(
                Q(active=True) | Q(active__isnull=True)  # Include NULL as "active" for safety
            )
            
            if existing_with_license.exists():
                existing = existing_with_license.first()
                raise ValidationError(
                    f"PRC License '{qualification_identifier}' is already registered to "
                    f"{existing.first_name} {existing.last_name} (ID: {existing.practitioner_id}). "
                    "Each PRC license must be unique. If this is a transfer, please deactivate "
                    "the previous practitioner record first."
                )
        
        # -------------------------------------------------------------------------
        # STEP 3: Atomic Creation
        # -------------------------------------------------------------------------
        # Create the Practitioner record
        practitioner = Practitioner.objects.create(**practitioner_data)
        
        # If user account data is provided, create the linked User
        if user_data:
            user = PractitionerService._create_user_for_practitioner(
                practitioner=practitioner,
                user_data=user_data
            )
            practitioner.user = user  # Django will handle the OneToOne relationship
        
        return practitioner
    
    @staticmethod
    def _create_user_for_practitioner(
        practitioner: Practitioner,
        user_data: Dict[str, Any]
    ) -> User:
        """
        Internal helper to create a User account linked to a Practitioner.
        
        Enforces:
        - Username uniqueness
        - Email uniqueness
        - Secure password hashing
        - 1:1 Practitioner-User relationship (prevents credential sharing)
        
        Args:
            practitioner: The Practitioner instance to link to
            user_data: Dictionary with user fields (username, password, email, role, status)
            
        Returns:
            User instance
            
        Raises:
            ValidationError: If username/email conflicts or practitioner already has a user
        """
        # Prevent credential sharing: One practitioner = One user account
        if hasattr(practitioner, 'user') and practitioner.user:
            raise ValidationError(
                f"Practitioner {practitioner.first_name} {practitioner.last_name} "
                "already has a user account. Credential sharing is not permitted."
            )
        
        # Check username uniqueness
        username = user_data.get('username')
        if User.objects.filter(username=username).exists():
            raise ValidationError(f"Username '{username}' is already taken.")
        
        # Check email uniqueness if provided
        email = user_data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise ValidationError(f"Email '{email}' is already registered.")
        
        # Hash password securely using Django's built-in method
        raw_password = user_data.pop('password', None)
        if not raw_password:
            raise ValidationError("Password is required for user account creation.")
        
        # Create User with OneToOne link to Practitioner
        # Note: We use create() instead of create_user() because practitioner is the PK
        user = User.objects.create(
            practitioner=practitioner,
            first_name=user_data.get('first_name', practitioner.first_name),
            last_name=user_data.get('last_name', practitioner.last_name),
            password=make_password(raw_password),  # Django expects 'password' field
            **user_data
        )
        
        return user


# =============================================================================
# Practitioner Role Service (RBAC Foundation)
# =============================================================================

class PractitionerRoleService:
    """
    Manages PractitionerRole assignments (linking practitioners to organizations/locations).
    
    Business Rules:
    - Prevent overlapping active roles for same practitioner in same location/org
    - Support permission checking for access control
    """
    
    @staticmethod
    @transaction.atomic
    def assign_role(
        practitioner: Practitioner,
        organization: Organization,
        data: Dict[str, Any]
    ) -> PractitionerRole:
        """
        Assign a role to a practitioner within an organization.
        
        Prevents overlapping active roles to avoid scheduling conflicts and
        authorization ambiguity (e.g., cannot be "Doctor" and "Nurse" simultaneously
        in the same ward).
        
        Args:
            practitioner: Practitioner instance
            organization: Organization instance
            data: Dictionary with role fields (role_code, specialty_code, location, etc.)
            
        Returns:
            PractitionerRole instance
            
        Raises:
            ValidationError: If overlapping active role detected
        """
        location = data.get('location')
        role_code = data.get('role_code')
        
        # Check for overlapping active roles
        # Context: In LGU hospitals, a doctor may work multiple shifts, but should
        # not have conflicting active roles in the same location simultaneously
        overlap_query = Q(
            practitioner=practitioner,
            organization=organization,
            active=True
        )
        
        if location:
            overlap_query &= Q(location=location)
        
        if role_code:
            overlap_query &= Q(role_code=role_code)
        
        existing_role = PractitionerRole.objects.filter(overlap_query).first()
        
        if existing_role:
            location_info = f" in {location.name}" if location else ""
            raise ValidationError(
                f"Practitioner {practitioner.first_name} {practitioner.last_name} "
                f"already has an active {role_code or 'role'} assignment "
                f"in {organization.name}{location_info}. "
                "Please deactivate the existing role before creating a new one."
            )
        
        # Create the role assignment
        role_data = {
            'practitioner': practitioner,
            'organization': organization,
            **data
        }
        
        practitioner_role = PractitionerRole.objects.create(**role_data)
        return practitioner_role
    
    @staticmethod
    def check_permission(practitioner: Practitioner, permission_codename: str) -> bool:
        """
        Check if a practitioner has a specific Django permission.
        
        This is a convenience method for RBAC checks in business logic.
        
        Args:
            practitioner: Practitioner instance
            permission_codename: Django permission codename (e.g., 'add_patient', 'view_billing')
            
        Returns:
            bool: True if practitioner's linked user has the permission
        """
        try:
            user = practitioner.user
            if not user or not user.is_active:
                return False
            
            # Check Django permission system
            return user.has_perm(permission_codename)
        except User.DoesNotExist:
            return False


# =============================================================================
# Auth Service (Security Enhancements)
# =============================================================================

class AuthService:
    """
    Manages authentication and security features.
    
    Context: Email-based Two-Factor Authentication for simplicity.
    The OTP is generated upon successful password verification and
    emailed to the user. The code expires after 5 minutes.
    """
    
    @staticmethod
    def generate_login_otp(user: User) -> None:
        """
        Generate a 6-digit OTP and email it to the user.
        
        Args:
            user: User instance with valid email address
            
        Side Effects:
            - Updates user.otp_code with a random 6-digit string
            - Updates user.otp_created_at with current timestamp
            - Sends email with OTP to user.email
        """
        from django.core.mail import send_mail
        from django.utils import timezone
        import random
        
        # Generate random 6-digit OTP
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Save OTP to database
        user.otp_code = otp_code
        user.otp_created_at = timezone.now()
        user.save(update_fields=['otp_code', 'otp_created_at'])
        
        # Send email
        send_mail(
            subject='WAH4H Login Verification Code',
            message=f'Your verification code is: {otp_code}\n\nThis code will expire in 5 minutes.',
            from_email='noreply@wah4h.com',
            recipient_list=[user.email],
            fail_silently=False,
        )
    
    @staticmethod
    def verify_login_otp(user: User, code: str) -> bool:
        """
        Verify an OTP code for login.
        
        Args:
            user: User instance
            code: 6-digit OTP code provided by user
            
        Returns:
            bool: True if code is valid and not expired, False otherwise
            
        Side Effects:
            If valid, clears user.otp_code and user.otp_created_at
        """
        from django.utils import timezone
        from datetime import timedelta
        
        # Check if OTP exists
        if not user.otp_code or not user.otp_created_at:
            return False
        
        # Check if OTP matches
        if user.otp_code != code:
            return False
        
        # Check if OTP is expired (5 minutes)
        expiry_time = user.otp_created_at + timedelta(minutes=5)
        if timezone.now() > expiry_time:
            # Clear expired OTP
            user.otp_code = None
            user.otp_created_at = None
            user.save(update_fields=['otp_code', 'otp_created_at'])
            return False
        
        # OTP is valid - clear it to prevent reuse
        user.otp_code = None
        user.otp_created_at = None
        user.save(update_fields=['otp_code', 'otp_created_at'])
        
        return True


# =============================================================================
# Service Registry (Optional: Dependency Injection Pattern)
# =============================================================================

class ServiceRegistry:
    """
    Centralized registry for service access.
    
    Usage:
        from accounts.services import ServiceRegistry
        
        practitioner = ServiceRegistry.practitioner.register_practitioner(data)
        role = ServiceRegistry.role.assign_role(practitioner, org, role_data)
    """
    
    organization = OrganizationService
    location = LocationService
    practitioner = PractitionerService
    role = PractitionerRoleService
    auth = AuthService
