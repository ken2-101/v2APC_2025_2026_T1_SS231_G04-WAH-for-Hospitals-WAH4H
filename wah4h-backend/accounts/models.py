from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.conf import settings
from django.utils import timezone


# ============================================================================
# ABSTRACT BASE MODELS & MIXINS
# ============================================================================

class TimestampedModel(models.Model):
    """
    Abstract utility model providing timestamp fields for creation and updates.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_column='%(class)s_created_at')
    updated_at = models.DateTimeField(auto_now=True, db_column='%(class)s_updated_at')

    class Meta:
        abstract = True


class AuditedModel(TimestampedModel):
    """
    Abstract utility model extending TimestampedModel to include creator tracking.
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='%(class)s_created_by',
        related_name='created_%(class)ss'
    )

    class Meta:
        abstract = True


class StatusMixin(models.Model):
    """
    Mixin providing standard active/inactive status management.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='active',
        db_column='%(class)s_status'
    )

    class Meta:
        abstract = True


class GenderMixin(models.Model):
    """
    Mixin providing FHIR R4 compliant administrative gender fields.
    Note: Stores lowercase codes to ensure strict FHIR ValueSet compliance.
    """
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('unknown', 'Unknown'),
    ]
    
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        null=True,
        blank=True,
        db_column='%(class)s_gender'
    )

    class Meta:
        abstract = True


# ============================================================================
# SHARED CHOICE DEFINITIONS
# ============================================================================

class QualificationChoices:
    """
    Enumeration of practitioner qualification codes.
    Maps to FHIR Practitioner.qualification.
    """
    DOCTOR = 'Doctor'
    NURSE = 'Nurse'
    PHARMACIST = 'Pharmacist'
    ADMIN = 'Admin'
    BILLING_STAFF = 'Billing Staff'
    LAB_TECHNICIAN = 'Lab Technician'
    
    CHOICES = [
        (DOCTOR, 'Doctor'),
        (NURSE, 'Nurse'),
        (PHARMACIST, 'Pharmacist'),
        (ADMIN, 'Admin'),
        (BILLING_STAFF, 'Billing Staff'),
        (LAB_TECHNICIAN, 'Lab Technician'),
    ]


# ============================================================================
# USER MANAGER
# ============================================================================

class UserManager(BaseUserManager):
    """
    Custom manager for the User model.
    """
    
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_active', True)
        return self.create_user(username, password, **extra_fields)


# ============================================================================
# CORE MODELS
# ============================================================================

class User(AbstractBaseUser, TimestampedModel):
    """
    Authentication identity model.
    
    Handles system credentials and account status. Demographic data is delegated 
    to the associated Practitioner model via a OneToOne relationship.
    """
    user_id = models.AutoField(primary_key=True, db_column='USER_user_id')
    username = models.CharField(max_length=50, unique=True, db_column='USER_username')
    
    is_active = models.BooleanField(default=True, db_column='USER_is_active')
    last_login = models.DateTimeField(null=True, blank=True, db_column='USER_last_login')

    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'USER'
        verbose_name = 'User Account'
        verbose_name_plural = 'User Accounts'

    def __str__(self):
        return self.username
    
    @property
    def practitioner_roles(self):
        """
        Retrieves active roles from the associated Practitioner profile.
        Used for Context-Based Access Control (CBAC).
        """
        if hasattr(self, 'practitioner'):
            return self.practitioner.roles.filter(status='active')
        return []
    
    @property
    def has_practitioner(self):
        """Boolean check for existence of linked practitioner profile."""
        return hasattr(self, 'practitioner')


class Practitioner(AuditedModel, GenderMixin):
    """
    Represents a healthcare professional (FHIR Practitioner Resource).
    
    Acts as the single source of truth for demographic and professional data.
    Linked 1:1 with the User authentication model.
    """
    practitioner_id = models.AutoField(primary_key=True, db_column='PRAC_practitioner_id')
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='PRAC_user_id',
        related_name='practitioner',
        help_text='One-to-one link to authentication account'
    )
    
    # Professional Identifiers
    identifier_license = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PRAC_identifier_license',
        help_text='Medical license number'
    )
    identifier_prc = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PRAC_identifier_prc',
        help_text='Professional Regulation Commission ID'
    )
    identifier_ptr = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PRAC_identifier_ptr',
        help_text='Professional Tax Receipt'
    )
    identifier_s2 = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PRAC_identifier_s2',
        help_text='S2 License (for controlled substances)'
    )
    identifier_employee = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PRAC_identifier_employee',
        help_text='Employee/Staff ID'
    )
    
    # Demographics
    first_name = models.CharField(max_length=50, db_column='PRAC_first_name')
    middle_name = models.CharField(max_length=50, null=True, blank=True, db_column='PRAC_middle_name')
    last_name = models.CharField(max_length=50, db_column='PRAC_last_name')
    suffix = models.CharField(max_length=10, null=True, blank=True, db_column='PRAC_suffix')
    
    contact_number = models.CharField(max_length=15, null=True, blank=True, db_column='PRAC_contact_number')
    email = models.EmailField(
        max_length=100, 
        null=True, 
        blank=True, 
        db_column='PRAC_email',
        help_text='Professional email (Single Source of Truth)'
    )
    
    active = models.BooleanField(default=True, db_column='PRAC_active')
    birthdate = models.DateField(null=True, blank=True, db_column='PRAC_birthdate')
    
    # Qualifications
    qualification_code = models.CharField(
        max_length=20,
        choices=QualificationChoices.CHOICES,
        null=True,
        blank=True,
        db_column='PRAC_qualification_code',
        help_text='Primary qualification type'
    )
    qualification_issuer = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        db_column='PRAC_qualification_issuer',
        help_text='Issuing authority (e.g., PRC, DOH)'
    )
    qualification_valid_from = models.DateField(null=True, blank=True, db_column='PRAC_qualification_valid_from')
    qualification_valid_to = models.DateField(null=True, blank=True, db_column='PRAC_qualification_valid_to')

    class Meta:
        db_table = 'PRACTITIONER'
        verbose_name = 'Practitioner'
        verbose_name_plural = 'Practitioners'

    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        """Returns full name with proper formatting."""
        parts = [self.first_name, self.middle_name, self.last_name, self.suffix]
        return ' '.join(filter(None, parts))


class Organization(AuditedModel, StatusMixin):
    """
    Represents a healthcare organization (FHIR Organization Resource).
    Includes PH-specific facility identifiers.
    """
    TYPE_CHOICES = [
        ('Hospital', 'Hospital'),
        ('Clinic', 'Clinic'),
        ('Laboratory', 'Laboratory'),
        ('Pharmacy', 'Pharmacy'),
        ('Other', 'Other'),
    ]
    
    OWNERSHIP_CHOICES = [
        ('government', 'Government'),
        ('private', 'Private'),
        ('mixed', 'Mixed'),
    ]

    organization_id = models.AutoField(primary_key=True, db_column='ORG_organization_id')
    
    # Facility Identifiers
    identifier_doh = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='ORG_identifier_doh',
        help_text='Department of Health facility code'
    )
    identifier_bir = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='ORG_identifier_bir',
        help_text='Bureau of Internal Revenue TIN'
    )
    identifier_nhfr = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='ORG_identifier_nhfr',
        help_text='National Health Facility Registry code'
    )
    identifier_phic = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='ORG_identifier_phic',
        help_text='PhilHealth accreditation number'
    )
    
    name = models.CharField(max_length=100, db_column='ORG_name')
    alias = models.CharField(max_length=100, null=True, blank=True, db_column='ORG_alias')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, null=True, blank=True, db_column='ORG_type')
    
    contact_number = models.CharField(max_length=15, null=True, blank=True, db_column='ORG_contact_number')
    email = models.EmailField(max_length=100, null=True, blank=True, db_column='ORG_email')
    
    # Address Components
    street_address = models.CharField(max_length=100, null=True, blank=True, db_column='ORG_street_address')
    barangay = models.CharField(max_length=50, null=True, blank=True, db_column='ORG_barangay')
    city_municipality = models.CharField(max_length=50, null=True, blank=True, db_column='ORG_city_municipality')
    province = models.CharField(max_length=50, null=True, blank=True, db_column='ORG_province')
    region = models.CharField(max_length=50, null=True, blank=True, db_column='ORG_region')
    postal_code = models.CharField(max_length=10, null=True, blank=True, db_column='ORG_postal_code')
    country = models.CharField(max_length=50, null=True, blank=True, db_column='ORG_country')
    
    # PHCore Extensions
    extension_ownership_type = models.CharField(
        max_length=15,
        choices=OWNERSHIP_CHOICES,
        null=True,
        blank=True,
        db_column='ORG_extension_ownership_type'
    )
    extension_service_category = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        db_column='ORG_extension_service_category',
        help_text='Services offered (e.g., Primary Care, Tertiary)'
    )

    class Meta:
        db_table = 'ORGANIZATION'
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'

    def __str__(self):
        return self.name


class PractitionerRole(TimestampedModel, StatusMixin):
    """
    Represents the specific role/affiliation of a Practitioner at an Organization 
    (FHIR PractitionerRole Resource).
    
    Defines what a Practitioner is authorized to do at a specific location 
    and during a specific time period.
    """
    role_id = models.AutoField(primary_key=True, db_column='PR_role_id')
    
    practitioner = models.ForeignKey(
        'accounts.Practitioner',
        on_delete=models.CASCADE,
        db_column='PR_practitioner_id',
        related_name='roles'
    )
    
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='PR_organization_id',
        related_name='practitioner_roles'
    )
    
    code = models.CharField(
        max_length=20, 
        choices=QualificationChoices.CHOICES, 
        db_column='PR_code',
        help_text='Role type for authorization (CBAC)'
    )
    
    specialty = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        db_column='PR_specialty',
        help_text='Medical specialty (e.g., Cardiology, Pediatrics)'
    )
    
    period_start = models.DateField(
        null=True, 
        blank=True, 
        db_column='PR_period_start',
        help_text='Role effective start date'
    )
    period_end = models.DateField(
        null=True, 
        blank=True, 
        db_column='PR_period_end',
        help_text='Role expiration date (null = indefinite)'
    )

    class Meta:
        db_table = 'PRACTITIONER_ROLE'
        verbose_name = 'Practitioner Role'
        verbose_name_plural = 'Practitioner Roles'
        indexes = [
            models.Index(fields=['practitioner', 'status']),
            models.Index(fields=['organization', 'code']),
        ]

    def __str__(self):
        return f"{self.practitioner} - {self.code} @ {self.organization or 'Unassigned'}"
    
    def is_currently_active(self):
        """
        Determines if the role is currently valid based on status and date range.
        """
        from datetime import date
        
        if self.status != 'active':
            return False
        
        today = date.today()
        
        if self.period_start and today < self.period_start:
            return False
        
        if self.period_end and today > self.period_end:
            return False
        
        return True