from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

class Patient(FHIRResourceModel):
    patient_id = models.AutoField(primary_key=True)
    # FIX: Added 'active' (was missing or named 'status' previously)
    active = models.BooleanField(null=True, blank=True)
    name_use = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    middle_name = models.CharField(max_length=255, null=True, blank=True)
    name_suffix = models.CharField(max_length=50, null=True, blank=True)
    gender = models.CharField(max_length=50, null=True, blank=True)
    # FIX: Added 'birth_date' (was likely missing)
    birth_date = models.DateField(null=True, blank=True)
    deceased_boolean = models.BooleanField(null=True, blank=True)
    deceased_datetime = models.DateTimeField(null=True, blank=True)
    address_use = models.CharField(max_length=50, null=True, blank=True)
    address_line = models.CharField(max_length=255, null=True, blank=True)
    address_city = models.CharField(max_length=255, null=True, blank=True)
    address_district = models.CharField(max_length=255, null=True, blank=True)
    address_state = models.CharField(max_length=255, null=True, blank=True)
    address_postal_code = models.CharField(max_length=50, null=True, blank=True)
    address_country = models.CharField(max_length=50, null=True, blank=True)
    telecom = models.CharField(max_length=100, null=True, blank=True)
    marital_status = models.CharField(max_length=100, null=True, blank=True)
    multiple_birth_boolean = models.BooleanField(null=True, blank=True)
    multiple_birth_integer = models.IntegerField(null=True, blank=True)
    photo_url = models.URLField(max_length=255, null=True, blank=True)
    contact_relationship = models.CharField(max_length=100, null=True, blank=True)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    contact_telecom = models.CharField(max_length=100, null=True, blank=True)
    contact_address = models.CharField(max_length=255, null=True, blank=True)
    contact_gender = models.CharField(max_length=50, null=True, blank=True)
    contact_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='contact_organization_id', null=True, blank=True, related_name='patient_contacts')
    general_practitioner = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='general_practitioner_id', null=True, blank=True)
    managing_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='managing_organization_id', null=True, blank=True, related_name='managed_patients')
    link_other_patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='link_other_patient_id', null=True, blank=True)
    link_type = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        db_table = 'patient'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Condition(FHIRResourceModel):
    condition_id = models.AutoField(primary_key=True)
    clinical_status = models.CharField(max_length=100, null=True, blank=True)
    verification_status = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    severity = models.CharField(max_length=100, null=True, blank=True)
    code_code = models.CharField(max_length=100, null=True, blank=True)
    # FIX: Added 'code_display' (Admin was looking for this)
    code_display = models.CharField(max_length=255, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id', null=True, blank=True)
    onset_datetime = models.DateTimeField(null=True, blank=True)
    onset_age = models.CharField(max_length=50, null=True, blank=True)
    onset_period_start = models.DateTimeField(null=True, blank=True)
    onset_period_end = models.DateTimeField(null=True, blank=True)
    onset_range = models.CharField(max_length=100, null=True, blank=True)
    onset_string = models.CharField(max_length=255, null=True, blank=True)
    abatement_datetime = models.DateTimeField(null=True, blank=True)
    abatement_age = models.CharField(max_length=50, null=True, blank=True)
    abatement_period_start = models.DateTimeField(null=True, blank=True)
    abatement_period_end = models.DateTimeField(null=True, blank=True)
    abatement_range = models.CharField(max_length=100, null=True, blank=True)
    abatement_string = models.CharField(max_length=255, null=True, blank=True)
    recorded_date = models.DateTimeField(null=True, blank=True)
    recorder = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='recorder_id', null=True, blank=True)
    asserter = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='asserter_id', null=True, blank=True, related_name='asserted_conditions')
    stage_summary = models.CharField(max_length=255, null=True, blank=True)
    stage_type = models.CharField(max_length=100, null=True, blank=True)
    evidence_code = models.CharField(max_length=100, null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'condition'