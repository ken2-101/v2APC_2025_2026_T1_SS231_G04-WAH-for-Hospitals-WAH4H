from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

class Medication(FHIRResourceModel):
    """
    FHIR Medication Resource
    Inherits: identifier, status, created_at, updated_at from FHIRResourceModel
    """
    medication_id = models.AutoField(primary_key=True)
    code_code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    code_display = models.CharField(max_length=100, null=True, blank=True)
    code_system = models.CharField(max_length=100, null=True, blank=True)
    code_version = models.CharField(max_length=100, null=True, blank=True)
    implicit_rules = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'medication'


class MedicationRequest(FHIRResourceModel):
    """
    FHIR MedicationRequest Resource
    Inherits: identifier, status, created_at, updated_at from FHIRResourceModel
    Decoupled: All foreign relationships converted to IntegerField (Fortress Architecture)
    """
    medication_request_id = models.AutoField(primary_key=True)
    
    # Decoupled Reference Fields (Manual Integer Fields - No ForeignKey)
    subject_id = models.IntegerField(db_index=True)  # Reference to patients.Patient
    encounter_id = models.IntegerField(db_index=True)  # Reference to admission.Encounter
    requester_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to accounts.Practitioner
    performer_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to accounts.Practitioner
    recorder_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to accounts.Practitioner
    based_on_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to admission.ServiceRequest
    insurance_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to billing.Coverage (FIXED CRASH)
    reported_reference_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to accounts.Practitioner
    reason_reference_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to patients.Condition
    
    # Medication CodeableConcept or Reference
    medication_reference = models.CharField(max_length=255, null=True, blank=True)
    medication_code = models.CharField(max_length=100, null=True, blank=True)
    medication_display = models.CharField(max_length=100, null=True, blank=True)
    medication_system = models.CharField(max_length=100, null=True, blank=True)
    
    # Request Details
    intent = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    priority = models.CharField(max_length=255, null=True, blank=True)
    do_not_perform = models.BooleanField(null=True, blank=True)
    reported_boolean = models.BooleanField(null=True, blank=True)
    authored_on = models.DateTimeField(null=True, blank=True)
    status_reason = models.CharField(max_length=100, null=True, blank=True)
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    # Dosage Instructions
    dosage_text = models.TextField(null=True, blank=True)
    dosage_site = models.CharField(max_length=255, null=True, blank=True)
    dosage_route = models.CharField(max_length=255, null=True, blank=True)
    dosage_method = models.CharField(max_length=255, null=True, blank=True)
    dosage_dose_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dosage_dose_unit = models.CharField(max_length=255, null=True, blank=True)
    dosage_rate_quantity_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dosage_rate_quantity_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # CSV specifies DECIMAL(10,2)
    dosage_rate_ratio_numerator = models.CharField(max_length=255, null=True, blank=True)
    dosage_rate_ratio_denominator = models.CharField(max_length=255, null=True, blank=True)
    
    # Dispense Request
    dispense_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dispense_initial_fill_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dispense_initial_fill_duration = models.CharField(max_length=255, null=True, blank=True)
    dispense_interval = models.CharField(max_length=255, null=True, blank=True)
    dispense_validity_period_start = models.CharField(max_length=255, null=True, blank=True)
    dispense_validity_period_end = models.CharField(max_length=255, null=True, blank=True)
    dispense_repeats_allowed = models.CharField(max_length=255, null=True, blank=True)
    
    # Additional Fields
    group_identifier = models.CharField(max_length=100, null=True, blank=True)
    course_of_therapy_type = models.CharField(max_length=100, null=True, blank=True)
    instantiates_canonical = models.CharField(max_length=255, null=True, blank=True)
    instantiates_uri = models.CharField(max_length=255, null=True, blank=True)
    performer_type = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        db_table = 'medication_request'


class Inventory(TimeStampedModel):
    """
    Pharmacy Inventory Management
    Inherits: created_at, updated_at from TimeStampedModel
    """
    inventory_id = models.AutoField(primary_key=True)
    item_code = models.CharField(max_length=100, null=True, blank=True)
    item_name = models.CharField(max_length=255, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    batch_number = models.CharField(max_length=255, null=True, blank=True)
    current_stock = models.IntegerField(null=True, blank=True)
    reorder_level = models.IntegerField(null=True, blank=True)
    unit_of_measure = models.CharField(max_length=255, null=True, blank=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=100)
    expiry_date = models.DateField(null=True, blank=True)
    last_restocked_datetime = models.DateTimeField(null=True, blank=True)
    created_by = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'inventory'


class MedicationAdministration(FHIRResourceModel):
    """
    FHIR MedicationAdministration Resource
    Inherits: identifier, status, created_at, updated_at from FHIRResourceModel
    Decoupled: All foreign relationships converted to IntegerField (Fortress Architecture)
    """
    medication_administration_id = models.AutoField(primary_key=True)
    
    # Decoupled Reference Fields (Manual Integer Fields - No ForeignKey)
    subject_id = models.IntegerField(db_index=True)  # Reference to patients.Patient
    context_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to admission.Encounter
    performer_actor_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to accounts.Practitioner
    request_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to pharmacy.MedicationRequest
    part_of_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to admission.Procedure
    device_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to admission.Device
    event_history_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to monitoring.Observation
    reason_reference_id = models.IntegerField(null=True, blank=True, db_index=True)  # Reference to patients.Condition
    
    # Medication CodeableConcept or Reference
    medication_reference = models.CharField(max_length=255, null=True, blank=True)
    medication_code = models.CharField(max_length=100, null=True, blank=True)
    medication_display = models.CharField(max_length=100, null=True, blank=True)
    medication_system = models.CharField(max_length=100, null=True, blank=True)
    
    # Administration Details
    instantiates_uri = models.CharField(max_length=255, null=True, blank=True)
    status_reason = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=255, null=True, blank=True)
    effective_datetime = models.DateTimeField(null=True, blank=True)
    effective_period_start = models.DateField(null=True, blank=True)
    effective_period_end = models.DateField(null=True, blank=True)
    performer_function = models.CharField(max_length=255, null=True, blank=True)
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    # Dosage
    dosage_text = models.TextField(null=True, blank=True)
    dosage_site = models.CharField(max_length=255, null=True, blank=True)
    dosage_route = models.CharField(max_length=255, null=True, blank=True)
    dosage_method = models.CharField(max_length=255, null=True, blank=True)
    dosage_dose_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dosage_dose_unit = models.CharField(max_length=255, null=True, blank=True)
    dosage_rate_quantity_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dosage_rate_quantity_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # CSV specifies DECIMAL(10,2)
    dosage_rate_ratio_numerator = models.CharField(max_length=255, null=True, blank=True)
    dosage_rate_ratio_denominator = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'medication_administration'