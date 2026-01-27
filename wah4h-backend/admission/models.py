from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

class Encounter(TimeStampedModel):
    encounter_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
    class_field = models.CharField(max_length=100, db_column='class', null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    service_type = models.CharField(max_length=100, null=True, blank=True)
    priority = models.CharField(max_length=100, null=True, blank=True)
    subject_patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_patient_id')
    episode_of_care_id = models.IntegerField(null=True, blank=True)
    based_on_id = models.IntegerField(null=True, blank=True)
    participant_id = models.IntegerField(null=True, blank=True)
    appointment_id = models.IntegerField(null=True, blank=True)
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
    account_id = models.IntegerField(null=True, blank=True)
    hospitalization_admit_source = models.CharField(max_length=100, null=True, blank=True)
    hospitalization_re_admission = models.BooleanField(null=True, blank=True)
    hospitalization_diet_preference = models.CharField(max_length=255, null=True, blank=True)
    hospitalization_special_courtesy = models.CharField(max_length=255, null=True, blank=True)
    hospitalization_special_arrangement = models.CharField(max_length=255, null=True, blank=True)
    hospitalization_destination_id = models.IntegerField(null=True, blank=True)
    hospitalization_discharge_disposition = models.CharField(max_length=255, null=True, blank=True)
    location_location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='location_location_id', null=True, blank=True)
    location_status = models.CharField(max_length=100, null=True, blank=True)
    location_period_start = models.DateTimeField(null=True, blank=True)
    location_period_end = models.DateTimeField(null=True, blank=True)
    service_provider_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='service_provider_organization_id', null=True, blank=True)
    part_of_encounter = models.ForeignKey('self', on_delete=models.PROTECT, db_column='part_of_encounter_id', null=True, blank=True)
    class Meta:
        db_table = 'encounter'

class Procedure(TimeStampedModel):
    procedure_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    instantiates_canonical = models.CharField(max_length=255, null=True, blank=True)
    instantiates_uri = models.CharField(max_length=255, null=True, blank=True)
    based_on_id = models.IntegerField(null=True, blank=True)
    part_of_id = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=100)
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
    performer_id = models.IntegerField(null=True, blank=True)
    location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='location_id', null=True, blank=True)
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    reason_reference_id = models.IntegerField(null=True, blank=True)
    body_site = models.CharField(max_length=255, null=True, blank=True)
    outcome = models.CharField(max_length=255, null=True, blank=True)
    report_id = models.IntegerField(null=True, blank=True)
    complication = models.CharField(max_length=255, null=True, blank=True)
    complication_detail_id = models.IntegerField(null=True, blank=True)
    follow_up = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    focal_device_id = models.IntegerField(null=True, blank=True)
    used_reference_id = models.IntegerField(null=True, blank=True)
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