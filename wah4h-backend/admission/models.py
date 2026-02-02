from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

# ==================== STUB MODELS (Mirror Models for FK Targets) ====================
# These minimal stub models exist for internal data organization and cross-app references.
# They will be integrated/replaced when the respective apps are fully implemented.
# Note: ForeignKey relationships are implemented as IntegerField to avoid circular dependencies.

class Appointment(FHIRResourceModel):
    """Stub model: Appointment (from scheduling module)"""
    appointment_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'admission_appointment'


class ServiceRequest(FHIRResourceModel):
    """Stub model: ServiceRequest (from clinical module)"""
    service_request_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    intent = models.CharField(max_length=100, null=True, blank=True)
    code = models.CharField(max_length=100, null=True, blank=True)
    subject_id = models.IntegerField(null=True, blank=True)  # FK to Patient (via IntegerField)
    
    class Meta:
        db_table = 'admission_service_request'


class EpisodeOfCare(FHIRResourceModel):
    """Stub model: EpisodeOfCare (from clinical module)"""
    episode_of_care_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    patient_id = models.IntegerField(null=True, blank=True)  # FK to Patient
    
    class Meta:
        db_table = 'admission_episode_of_care'


class Device(FHIRResourceModel):
    """Stub model: Device (from medical devices module)"""
    device_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, null=True, blank=True)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=255, null=True, blank=True)
    version = models.CharField(max_length=100, null=True, blank=True)
    patient_id = models.IntegerField(null=True, blank=True)  # FK to Patient
    owner_id = models.IntegerField(null=True, blank=True)  # FK to Organization
    location_id = models.IntegerField(null=True, blank=True)  # FK to Location
    note = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'admission_device'


# ==================== CORE MODELS ====================

class Encounter(FHIRResourceModel):
    """
    Encounter: Represents a healthcare encounter (appointment, admission, visit).
    Flattened structure directly matching Philippine LGU Data Dictionary (admission.csv).
    """
    encounter_id = models.AutoField(primary_key=True)
    identifier = models.CharField(
        max_length=100,
        null=False,
        blank=False,
        unique=True,
        help_text="Unique identifier for the encounter (NOT NULL, UNIQUE)"
    )
    status = models.CharField(
        max_length=100,
        null=False,
        blank=False,
        help_text="Status of the encounter (NOT NULL)"
    )
    
    # Classification and typing
    class_field = models.CharField(
        max_length=100,
        db_column='class',
        null=True,
        blank=True,
        help_text="Class of encounter (inpatient, outpatient, emergency, etc.)"
    )
    type = models.CharField(max_length=100, null=True, blank=True)
    service_type = models.CharField(max_length=100, null=True, blank=True)
    priority = models.CharField(max_length=255, null=True, blank=True)
    
    # Subject (Patient) - Required FK
    subject_patient_id = models.IntegerField(null=False, blank=False)  # FK to patients.Patient
    
    # Episode of Care and Service Request relationships
    episode_of_care_id = models.IntegerField(null=True, blank=True)  # FK to EpisodeOfCare
    based_on_service_request_id = models.IntegerField(null=True, blank=True)  # FK to ServiceRequest
    
    # Appointment relationship
    appointment_id = models.IntegerField(null=True, blank=True)  # FK to Appointment
    
    # Participant information
    participant_individual_id = models.IntegerField(null=True, blank=True)  # FK to Practitioner
    participant_type = models.CharField(max_length=100, null=True, blank=True)
    
    # Period timing
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    
    # Length of stay
    length = models.CharField(max_length=255, null=True, blank=True)
    
    # Reason for encounter
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    reason_reference_id = models.IntegerField(null=True, blank=True)  # FK to Condition
    
    # Diagnosis
    diagnosis_condition_id = models.IntegerField(null=True, blank=True)  # FK to Condition
    diagnosis_rank = models.CharField(max_length=255, null=True, blank=True)
    diagnosis_use = models.CharField(max_length=255, null=True, blank=True)
    
    # Location information
    location_id = models.IntegerField(null=True, blank=True)  # FK to Location
    location_status = models.CharField(max_length=100, null=True, blank=True)
    location_period_start = models.DateField(null=True, blank=True)
    location_period_end = models.DateField(null=True, blank=True)
    location_physical_type = models.CharField(max_length=100, null=True, blank=True)
    
    # Hospitalization details (flattened)
    admit_source = models.CharField(max_length=255, null=True, blank=True)
    re_admission = models.BooleanField(null=True, blank=True)
    diet_preference = models.CharField(max_length=255, null=True, blank=True)
    special_courtesy = models.CharField(max_length=255, null=True, blank=True)
    special_arrangement = models.CharField(max_length=255, null=True, blank=True)
    discharge_destination_id = models.IntegerField(null=True, blank=True)  # FK to Location
    discharge_disposition = models.TextField(null=True, blank=True)
    
    # Service Provider and Account
    service_provider_id = models.IntegerField(null=True, blank=True)  # FK to Organization
    account_id = models.IntegerField(null=True, blank=True)  # FK to Account (billing)
    
    # Hierarchical relationships
    part_of_encounter_id = models.IntegerField(null=True, blank=True)  # FK to self (Encounter)
    
    # Pre-admission identifier
    pre_admission_identifier = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'encounter'
        verbose_name = 'Encounter'
        verbose_name_plural = 'Encounters'
    
    def __str__(self):
        return f"Encounter {self.identifier} - {self.status}"


class Procedure(FHIRResourceModel):
    """
    Procedure: Represents a medical procedure performed during an encounter.
    Flattened structure directly matching Philippine LGU Data Dictionary (admission.csv).
    """
    procedure_id = models.AutoField(primary_key=True)
    identifier = models.CharField(
        max_length=100,
        null=False,
        blank=False,
        unique=True,
        help_text="Unique identifier for the procedure (NOT NULL, UNIQUE)"
    )
    status = models.CharField(
        max_length=100,
        null=False,
        blank=False,
        help_text="Status of the procedure (NOT NULL)"
    )
    status_reason_code = models.CharField(max_length=100, null=True, blank=True)
    status_reason_display = models.CharField(max_length=100, null=True, blank=True)
    
    # Instantiation
    instantiates_canonical = models.CharField(max_length=255, null=True, blank=True)
    instantiates_uri = models.CharField(max_length=255, null=True, blank=True)
    
    # Relationships
    based_on_id = models.IntegerField(null=True, blank=True)  # FK to ServiceRequest
    part_of_id = models.IntegerField(null=True, blank=True)  # FK to self (Procedure)
    
    # Classification and coding
    category_code = models.CharField(max_length=100, null=True, blank=True)
    category_display = models.CharField(max_length=100, null=True, blank=True)
    code_code = models.CharField(max_length=100, null=True, blank=True)
    code_display = models.CharField(max_length=100, null=True, blank=True)
    
    # Subject (Patient) and Encounter - Required
    subject_id = models.IntegerField(null=False, blank=False)  # FK to patients.Patient
    encounter_id = models.IntegerField(null=False, blank=False)  # FK to Encounter
    
    # Timing
    performed_datetime = models.DateTimeField(null=True, blank=True)
    performed_period_start = models.DateField(null=True, blank=True)
    performed_period_end = models.DateField(null=True, blank=True)
    performed_string = models.CharField(max_length=255, null=True, blank=True)
    performed_age_value = models.CharField(max_length=255, null=True, blank=True)
    performed_age_unit = models.CharField(max_length=255, null=True, blank=True)
    performed_range_low = models.CharField(max_length=255, null=True, blank=True)
    performed_range_high = models.CharField(max_length=255, null=True, blank=True)
    
    # Performers
    performer_actor_id = models.IntegerField(null=True, blank=True)  # FK to Practitioner
    performer_function_code = models.CharField(max_length=100, null=True, blank=True)
    performer_function_display = models.CharField(max_length=100, null=True, blank=True)
    performer_on_behalf_of_id = models.IntegerField(null=True, blank=True)  # FK to Organization
    
    # Recording and Assertion
    recorder_id = models.IntegerField(null=True, blank=True)  # FK to Practitioner
    asserter_id = models.IntegerField(null=True, blank=True)  # FK to Practitioner
    
    # Location
    location_id = models.IntegerField(null=True, blank=True)  # FK to Location
    
    # Reason
    reason_code_code = models.CharField(max_length=100, null=True, blank=True)
    reason_code_display = models.CharField(max_length=100, null=True, blank=True)
    reason_reference_id = models.IntegerField(null=True, blank=True)  # FK to Condition
    
    # Body Site
    body_site_code = models.CharField(max_length=100, null=True, blank=True)
    body_site_display = models.CharField(max_length=100, null=True, blank=True)
    
    # Outcome and Complications
    outcome_code = models.CharField(max_length=100, null=True, blank=True)
    outcome_display = models.CharField(max_length=100, null=True, blank=True)
    complication_code = models.CharField(max_length=100, null=True, blank=True)
    complication_display = models.CharField(max_length=100, null=True, blank=True)
    complication_detail_id = models.IntegerField(null=True, blank=True)  # FK to Condition
    
    # Follow-up
    follow_up_code = models.CharField(max_length=100, null=True, blank=True)
    follow_up_display = models.CharField(max_length=100, null=True, blank=True)
    
    # Notes and Reports
    note = models.TextField(null=True, blank=True)
    report_id = models.IntegerField(null=True, blank=True)  # FK to DiagnosticReport
    
    # Focal Device
    focal_device_manipulated_id = models.IntegerField(null=True, blank=True)  # FK to Device
    focal_device_action_code = models.CharField(max_length=100, null=True, blank=True)
    focal_device_action_display = models.CharField(max_length=100, null=True, blank=True)
    
    # Used (Medications, devices, etc.)
    used_reference_id = models.IntegerField(null=True, blank=True)  # FK to Medication
    used_code_code = models.CharField(max_length=100, null=True, blank=True)
    used_code_display = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'procedure'
        verbose_name = 'Procedure'
        verbose_name_plural = 'Procedures'
    
    def __str__(self):
        return f"Procedure {self.identifier} - {self.status}"


class ProcedurePerformer(TimeStampedModel):
    """
    ProcedurePerformer: Detail model for procedure performers.
    Flattened structure directly matching Philippine LGU Data Dictionary (admission.csv).
    """
    procedure_performer_id = models.AutoField(primary_key=True)
    procedure_id = models.IntegerField(null=False, blank=False)  # FK to Procedure
    performer_actor_id = models.IntegerField(null=False, blank=False)  # FK to Practitioner
    performer_function_code = models.CharField(max_length=100, null=True, blank=True)
    performer_function_display = models.CharField(max_length=100, null=True, blank=True)
    performer_on_behalf_of_id = models.IntegerField(null=True, blank=True)  # FK to Organization
    
    class Meta:
        db_table = 'procedure_performer'
        verbose_name = 'Procedure Performer'
        verbose_name_plural = 'Procedure Performers'
    
    def __str__(self):
        return f"ProcedurePerformer {self.procedure_performer_id}"