from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

# ==================== STUB MODELS (Mirror Models for FK Targets) ====================
# These minimal stub models exist solely to satisfy Foreign Key requirements.

class Appointment(FHIRResourceModel):
    """Stub model: Appointment"""
    appointment_id = models.AutoField(primary_key=True)
    description = models.TextField(null=True, blank=True)
    class Meta:
        db_table = 'appointment'

class ServiceRequest(FHIRResourceModel):
    """Stub model: ServiceRequest"""
    service_request_id = models.AutoField(primary_key=True)
    intent = models.CharField(max_length=100, null=True, blank=True)
    code = models.CharField(max_length=100, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id', null=True, blank=True)
    class Meta:
        db_table = 'service_request'

class EpisodeOfCare(FHIRResourceModel):
    """Stub model: EpisodeOfCare"""
    episode_of_care_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='patient_id', null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    class Meta:
        db_table = 'episode_of_care'

class Device(FHIRResourceModel):
    """Stub model: Device"""
    device_id = models.AutoField(primary_key=True)
    device_name = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=255, null=True, blank=True)
    version = models.CharField(max_length=100, null=True, blank=True)
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='patient_id', null=True, blank=True, related_name='devices')
    owner = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='owner_id', null=True, blank=True, related_name='owned_devices')
    location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='location_id', null=True, blank=True, related_name='location_devices')
    note = models.TextField(null=True, blank=True)
    class Meta:
        db_table = 'device'

# ==================== CORE MODELS ====================

class Encounter(FHIRResourceModel):
    encounter_id = models.AutoField(primary_key=True)
    class_field = models.CharField(max_length=100, db_column='class', null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    service_type = models.CharField(max_length=100, null=True, blank=True)
    priority = models.CharField(max_length=100, null=True, blank=True)
    subject_patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_patient_id')
    episode_of_care = models.ForeignKey('admission.EpisodeOfCare', on_delete=models.PROTECT, db_column='episode_of_care_id', null=True, blank=True, related_name='encounters')
    based_on = models.ForeignKey('admission.ServiceRequest', on_delete=models.PROTECT, db_column='based_on_id', null=True, blank=True, related_name='based_encounters')
    participant = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='participant_id', null=True, blank=True, related_name='participated_encounters')
    appointment = models.ForeignKey('admission.Appointment', on_delete=models.PROTECT, db_column='appointment_id', null=True, blank=True, related_name='encounters')
    period_start = models.DateTimeField(null=True, blank=True)
    period_end = models.DateTimeField(null=True, blank=True)
    length_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    length_unit = models.CharField(max_length=50, null=True, blank=True)
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    diagnosis_condition = models.ForeignKey(
        'patients.Condition', 
        on_delete=models.PROTECT, 
        db_column='diagnosis_condition_id', 
        null=True, 
        blank=True,
        related_name='diagnosis_encounters'
    )
    account = models.ForeignKey('billing.Account', on_delete=models.PROTECT, db_column='account_id', null=True, blank=True, related_name='encounters')
    hospitalization_admit_source = models.CharField(max_length=100, null=True, blank=True)
    hospitalization_re_admission = models.BooleanField(null=True, blank=True)
    hospitalization_diet_preference = models.CharField(max_length=255, null=True, blank=True)
    hospitalization_special_courtesy = models.CharField(max_length=255, null=True, blank=True)
    hospitalization_special_arrangement = models.CharField(max_length=255, null=True, blank=True)
    hospitalization_destination = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='hospitalization_destination_id', null=True, blank=True, related_name='destination_encounters')
    hospitalization_discharge_disposition = models.CharField(max_length=255, null=True, blank=True)
    location_location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='location_location_id', null=True, blank=True)
    location_status = models.CharField(max_length=100, null=True, blank=True)
    location_period_start = models.DateTimeField(null=True, blank=True)
    location_period_end = models.DateTimeField(null=True, blank=True)
    service_provider_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='service_provider_organization_id', null=True, blank=True)
    part_of_encounter = models.ForeignKey('self', on_delete=models.PROTECT, db_column='part_of_encounter_id', null=True, blank=True)
    class Meta:
        db_table = 'encounter'

class Procedure(FHIRResourceModel):
    procedure_id = models.AutoField(primary_key=True)
    instantiates_canonical = models.CharField(max_length=255, null=True, blank=True)
    instantiates_uri = models.CharField(max_length=255, null=True, blank=True)
    based_on = models.ForeignKey('admission.ServiceRequest', on_delete=models.PROTECT, db_column='based_on_id', null=True, blank=True, related_name='based_procedures')
    part_of = models.ForeignKey('admission.Procedure', on_delete=models.PROTECT, db_column='part_of_id', null=True, blank=True, related_name='sub_procedures')
    status_reason = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    code_code = models.CharField(max_length=100, null=True, blank=True)
    code_display = models.CharField(max_length=100, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id')
    performed_datetime = models.DateTimeField(null=True, blank=True)
    performed_period_start = models.DateTimeField(null=True, blank=True)
    performed_period_end = models.DateTimeField(null=True, blank=True)
    performed_string = models.CharField(max_length=255, null=True, blank=True)
    performed_age = models.IntegerField(null=True, blank=True)
    performed_range = models.CharField(max_length=255, null=True, blank=True)
    recorder = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='recorder_id', null=True, blank=True)
    asserter = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='asserter_id', null=True, blank=True, related_name='asserted_procedures')
    location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='location_id', null=True, blank=True)
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    reason_reference = models.ForeignKey('patients.Condition', on_delete=models.PROTECT, db_column='reason_reference_id', null=True, blank=True, related_name='reason_procedures')
    body_site = models.CharField(max_length=255, null=True, blank=True)
    outcome = models.CharField(max_length=255, null=True, blank=True)
    report = models.ForeignKey('laboratory.DiagnosticReport', on_delete=models.PROTECT, db_column='report_id', null=True, blank=True, related_name='procedures')
    complication = models.CharField(max_length=255, null=True, blank=True)
    complication_detail = models.ForeignKey('patients.Condition', on_delete=models.PROTECT, db_column='complication_detail_id', null=True, blank=True, related_name='complication_procedures')
    follow_up = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    focal_device = models.ForeignKey('admission.Device', on_delete=models.PROTECT, db_column='focal_device_id', null=True, blank=True, related_name='focal_procedures')
    used_reference = models.ForeignKey('pharmacy.Medication', on_delete=models.PROTECT, db_column='used_reference_id', null=True, blank=True, related_name='used_procedures')
    used_code = models.CharField(max_length=100, null=True, blank=True)
    class Meta:
        db_table = 'procedure'

class ProcedurePerformer(TimeStampedModel):
    procedure_performer_id = models.AutoField(primary_key=True)
    procedure = models.ForeignKey('admission.Procedure', on_delete=models.PROTECT, db_column='procedure_id')
    function = models.CharField(max_length=100, null=True, blank=True)
    performer_actor = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='performer_actor_id')
    on_behalf_of_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='on_behalf_of_organization_id', null=True, blank=True)
    class Meta:
        db_table = 'procedure_performer'