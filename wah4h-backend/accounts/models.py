# accounts/models.py
from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

class Organization(TimeStampedModel):
    organization_id = models.AutoField(primary_key=True)
    active = models.BooleanField(null=True, blank=True)
    nhfr_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    type_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    alias = models.CharField(max_length=255, null=True, blank=True)
    telecom = models.CharField(max_length=50, null=True, blank=True)
    endpoint_id = models.IntegerField(null=True, blank=True)
    part_of_organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='part_of_organization_id',
        related_name='sub_organizations'
    )
    address_line = models.CharField(max_length=255, null=True, blank=True)
    address_city = models.CharField(max_length=255, null=True, blank=True)
    address_district = models.CharField(max_length=255, null=True, blank=True)
    address_state = models.CharField(max_length=255, null=True, blank=True)
    address_country = models.CharField(max_length=255, null=True, blank=True)
    address_postal_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    contact_purpose = models.CharField(max_length=50, null=True, blank=True)
    contact_first_name = models.CharField(max_length=50, null=True, blank=True)
    contact_last_name = models.CharField(max_length=50, null=True, blank=True)
    contact_telecom = models.CharField(max_length=50, null=True, blank=True)
    contact_address_line = models.CharField(max_length=50, null=True, blank=True)
    contact_address_city = models.CharField(max_length=50, null=True, blank=True)
    contact_address_state = models.CharField(max_length=50, null=True, blank=True)
    contact_address_country = models.CharField(max_length=50, null=True, blank=True)
    contact_address_postal_code = models.CharField(max_length=100, unique=True, null=True, blank=True)

    class Meta:
        db_table = 'organization'

    def __str__(self):
        return self.name or f"Organization {self.organization_id}"


class Location(FHIRResourceModel):
    location_id = models.AutoField(primary_key=True)
    physical_type_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    type_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    operational_status = models.CharField(max_length=100, null=True, blank=True)
    mode = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    alias = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    telecom = models.CharField(max_length=50, null=True, blank=True)
    longitude = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.CharField(max_length=255, null=True, blank=True)
    altitude = models.CharField(max_length=255, null=True, blank=True)
    managing_organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='managing_organization_id'
    )
    part_of_location = models.ForeignKey(
        'accounts.Location',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='part_of_location_id'
    )
    endpoint_id = models.IntegerField(null=True, blank=True)
    address_line = models.CharField(max_length=255, null=True, blank=True)
    address_city = models.CharField(max_length=255, null=True, blank=True)
    address_district = models.CharField(max_length=255, null=True, blank=True)
    address_state = models.CharField(max_length=255, null=True, blank=True)
    address_country = models.CharField(max_length=255, null=True, blank=True)
    address_postal_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    hours_of_operation_days = models.CharField(max_length=255, null=True, blank=True)
    hours_of_operation_all_day = models.CharField(max_length=255, null=True, blank=True)
    opening_time = models.CharField(max_length=255, null=True, blank=True)
    closing_time = models.CharField(max_length=255, null=True, blank=True)
    availability_exceptions = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'location'

    def __str__(self):
        return self.name or f"Location {self.location_id}"


class Practitioner(TimeStampedModel):
    practitioner_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    active = models.BooleanField(null=True, blank=True)
    first_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255)
    suffix_name = models.CharField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=100, null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    photo_url = models.URLField(max_length=255, null=True, blank=True)
    telecom = models.CharField(max_length=50, null=True, blank=True)
    communication_language = models.CharField(max_length=255, null=True, blank=True)
    address_line = models.CharField(max_length=255, null=True, blank=True)
    address_city = models.CharField(max_length=255, null=True, blank=True)
    address_district = models.CharField(max_length=255, null=True, blank=True)
    address_state = models.CharField(max_length=255, null=True, blank=True)
    address_country = models.CharField(max_length=255, null=True, blank=True)
    address_postal_code = models.CharField(max_length=100, null=True, blank=True)
    qualification_code = models.CharField(max_length=100, null=True, blank=True)
    qualification_identifier = models.CharField(max_length=100, null=True, blank=True)
    qualification_issuer_id = models.IntegerField(null=True, blank=True)
    qualification_period_start = models.DateField(null=True, blank=True)
    qualification_period_end = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'practitioner'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class PractitionerRole(TimeStampedModel):
    practitioner_role_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    active = models.BooleanField(null=True, blank=True)
    practitioner = models.ForeignKey(
        'accounts.Practitioner',
        on_delete=models.PROTECT,
        db_column='practitioner_id'
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.PROTECT,
        db_column='organization_id'
    )
    location = models.ForeignKey(
        'accounts.Location',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='location_id'
    )
    role_code = models.CharField(max_length=100, null=True, blank=True)
    specialty_code = models.CharField(max_length=100, null=True, blank=True)
    telecom = models.CharField(max_length=50, null=True, blank=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    available_days_of_week = models.CharField(max_length=255, null=True, blank=True)
    available_all_day_flag = models.BooleanField(null=True, blank=True)
    available_start_time = models.CharField(max_length=255, null=True, blank=True)
    available_end_time = models.CharField(max_length=255, null=True, blank=True)
    availability_exceptions = models.CharField(max_length=255, null=True, blank=True)
    not_available_description = models.TextField(null=True, blank=True)
    not_available_period_start = models.DateField(null=True, blank=True)
    not_available_period_end = models.DateField(null=True, blank=True)
    endpoint_id = models.IntegerField(null=True, blank=True)
    healthcare_service_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'practitioner_role'


class User(TimeStampedModel):
    practitioner = models.OneToOneField(
        'accounts.Practitioner',
        on_delete=models.PROTECT,
        primary_key=True,
        db_column='practitioner_id'
    )
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    password_hash = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=100)
    last_login = models.CharField(max_length=255, null=True, blank=True)
    # Kept as Integer to match Excel, though Practitioner is PK
    id = models.IntegerField(null=True, blank=True)

    # ---------------------------------------------------------
    # DJANGO AUTH CONFIGURATION
    # ---------------------------------------------------------
    USERNAME_FIELD = 'username'
    # Fields required when running 'createsuperuser'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'email']

    @property
    def is_anonymous(self):
        """Always return False. Used for permission checks."""
        return False

    @property
    def is_authenticated(self):
        """Always return True. Used for permission checks."""
        return True

    class Meta:
        db_table = 'user'

    def __str__(self):
        return self.username