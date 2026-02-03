from django.db import models
from core.models import FHIRResourceModel


class Observation(FHIRResourceModel):
    """
    Observation model aligned strictly with monitoring.csv (PHCORE standard).
    All foreign keys are manual IntegerFields for decoupling.
    """
    observation_id = models.AutoField(primary_key=True)
    
    # Manual Foreign Keys (INT fields from CSV)
    subject_id = models.IntegerField()
    encounter_id = models.IntegerField()
    performer_id = models.IntegerField(null=True, blank=True)
    specimen_id = models.IntegerField(null=True, blank=True)
    device_id = models.IntegerField(null=True, blank=True)
    derived_from_id = models.IntegerField(null=True, blank=True)
    focus_id = models.IntegerField(null=True, blank=True)
    has_member_id = models.IntegerField(null=True, blank=True)
    
    # Core Fields
    code = models.CharField(max_length=100)
    category = models.CharField(max_length=255, null=True, blank=True)
    body_site = models.CharField(max_length=255, null=True, blank=True)
    method = models.CharField(max_length=255, null=True, blank=True)
    interpretation = models.CharField(max_length=255, null=True, blank=True)
    data_absent_reason = models.CharField(max_length=255, null=True, blank=True)
    based_on = models.CharField(max_length=255, null=True, blank=True)
    part_of = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    # Value Fields
    value_string = models.CharField(max_length=255, null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_integer = models.CharField(max_length=255, null=True, blank=True)
    value_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    value_codeableconcept = models.CharField(max_length=100, null=True, blank=True)
    value_datetime = models.DateTimeField(null=True, blank=True)
    value_time = models.CharField(max_length=255, null=True, blank=True)
    value_period_start = models.DateField(null=True, blank=True)
    value_period_end = models.DateField(null=True, blank=True)
    value_ratio = models.CharField(max_length=255, null=True, blank=True)
    value_sampled_data = models.CharField(max_length=255, null=True, blank=True)
    value_range_low = models.CharField(max_length=255, null=True, blank=True)
    value_range_high = models.CharField(max_length=255, null=True, blank=True)
    
    # Component Fields
    component_code = models.CharField(max_length=100, null=True, blank=True)
    component_value_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    component_value_codeableconcept = models.CharField(max_length=100, null=True, blank=True)
    component_value_string = models.CharField(max_length=255, null=True, blank=True)
    component_value_boolean = models.BooleanField(null=True, blank=True)
    component_value_integer = models.CharField(max_length=255, null=True, blank=True)
    component_value_range_low = models.CharField(max_length=255, null=True, blank=True)
    component_value_range_high = models.CharField(max_length=255, null=True, blank=True)
    component_value_ratio = models.CharField(max_length=255, null=True, blank=True)
    component_value_sampled_data = models.CharField(max_length=255, null=True, blank=True)
    component_value_time = models.CharField(max_length=255, null=True, blank=True)
    component_value_datetime = models.DateTimeField(null=True, blank=True)
    component_value_period_start = models.DateField(null=True, blank=True)
    component_value_period_end = models.DateField(null=True, blank=True)
    component_data_absent_reason = models.CharField(max_length=255, null=True, blank=True)
    component_interpretation = models.CharField(max_length=255, null=True, blank=True)
    
    # Component Reference Range Fields
    component_reference_range_type = models.CharField(max_length=100, null=True, blank=True)
    component_reference_range_text = models.TextField(null=True, blank=True)
    component_reference_range_low = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_high = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_age_low = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_age_high = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_applies_to = models.CharField(max_length=255, null=True, blank=True)
    
    # Reference Range Fields
    reference_range_low = models.CharField(max_length=255, null=True, blank=True)
    reference_range_high = models.CharField(max_length=255, null=True, blank=True)
    reference_range_type = models.CharField(max_length=100, null=True, blank=True)
    reference_range_applies_to = models.CharField(max_length=255, null=True, blank=True)
    reference_range_age_low = models.CharField(max_length=255, null=True, blank=True)
    reference_range_age_high = models.CharField(max_length=255, null=True, blank=True)
    reference_range_text = models.TextField(null=True, blank=True)
    
    # Effective Fields
    effective_datetime = models.DateTimeField(null=True, blank=True)
    effective_period_start = models.DateField(null=True, blank=True)
    effective_period_end = models.DateField(null=True, blank=True)
    effective_timing = models.CharField(max_length=255, null=True, blank=True)
    effective_instant = models.CharField(max_length=255, null=True, blank=True)
    
    issued = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'observation'


class ChargeItem(FHIRResourceModel):
    """
    ChargeItem model aligned strictly with monitoring.csv (FHIR standard).
    All foreign keys are manual IntegerFields for decoupling.
    """
    chargeitem_id = models.AutoField(primary_key=True)
    
    # Manual Foreign Keys (INT fields from CSV)
    subject_id = models.IntegerField()
    account_id = models.IntegerField(null=True, blank=True)
    context_id = models.IntegerField(null=True, blank=True)
    partof_id = models.IntegerField(null=True, blank=True)
    performing_organization_id = models.IntegerField(null=True, blank=True)
    requesting_organization_id = models.IntegerField(null=True, blank=True)
    performer_actor_id = models.IntegerField(null=True, blank=True)
    enterer_id = models.IntegerField(null=True, blank=True)
    cost_center_id = models.IntegerField(null=True, blank=True)
    
    # Core Fields
    code = models.CharField(max_length=100)
    definition_uri = models.CharField(max_length=255, null=True, blank=True)
    definition_canonical = models.CharField(max_length=255, null=True, blank=True)
    
    # Occurrence Fields
    occurrence_datetime = models.DateTimeField(null=True, blank=True)
    occurrence_period_start = models.DateField(null=True, blank=True)
    occurrence_period_end = models.DateField(null=True, blank=True)
    
    entered_date = models.DateTimeField(null=True, blank=True)
    performer_function = models.CharField(max_length=255, null=True, blank=True)
    
    # Bodysite Fields
    bodysite_code = models.CharField(max_length=100, null=True, blank=True)
    bodysite_system = models.CharField(max_length=100, null=True, blank=True)
    
    # Price Override Fields
    factor_override = models.CharField(max_length=255, null=True, blank=True)
    price_override_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_override_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    override_reason = models.CharField(max_length=255, null=True, blank=True)
    
    # Reason Fields
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    reason_system = models.CharField(max_length=100, null=True, blank=True)
    
    # Reference Fields
    service_reference = models.CharField(max_length=255, null=True, blank=True)
    product_reference = models.CharField(max_length=255, null=True, blank=True)
    product_codeableconcept = models.CharField(max_length=100, null=True, blank=True)
    
    # Quantity Fields
    quantity_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    supporting_information = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'charge_item'


class ChargeItemDefinition(FHIRResourceModel):
    """
    ChargeItemDefinition model aligned strictly with monitoring.csv (FHIR standard).
    All foreign keys are manual IntegerFields for decoupling.
    """
    chargeitemdefinition_id = models.AutoField(primary_key=True)
    
    # Manual Foreign Keys (INT fields from CSV)
    partOf_id = models.IntegerField(null=True, blank=True)
    replaces_id = models.IntegerField(null=True, blank=True)
    
    # Metadata Fields
    url = models.URLField(max_length=255, null=True, blank=True)
    version = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    derivedFromUri = models.CharField(max_length=255, null=True, blank=True)
    experimental = models.CharField(max_length=255, null=True, blank=True)
    date = models.CharField(max_length=255, null=True, blank=True)
    publisher = models.CharField(max_length=255, null=True, blank=True)
    
    # Contact Fields
    contact_name = models.CharField(max_length=50, null=True, blank=True)
    contact_telecom = models.CharField(max_length=50, null=True, blank=True)
    
    description = models.TextField(null=True, blank=True)
    
    # Use Context Fields
    usecontext_code = models.TextField(null=True, blank=True)
    usecontext_value = models.TextField(null=True, blank=True)
    
    # Jurisdiction Fields
    jurisdiction_code = models.CharField(max_length=100, null=True, blank=True)
    jurisdiction_system = models.CharField(max_length=100, null=True, blank=True)
    
    copyright = models.CharField(max_length=255, null=True, blank=True)
    approvalDate = models.CharField(max_length=255, null=True, blank=True)
    lastReviewDate = models.CharField(max_length=255, null=True, blank=True)
    
    # Effective Period Fields
    effectivePeriod_start = models.DateField(null=True, blank=True)
    effectivePeriod_end = models.DateField(null=True, blank=True)
    
    code = models.CharField(max_length=100)
    instance_reference = models.CharField(max_length=255, null=True, blank=True)
    
    # Applicability Fields
    applicability_description = models.TextField(null=True, blank=True)
    applicability_language = models.CharField(max_length=255, null=True, blank=True)
    applicability_expression = models.CharField(max_length=255, null=True, blank=True)
    
    # Property Group Price Component Fields (Note: CSV defines some as DECIMAL)
    propertyGroup_priceComponent_type = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_code = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Property Group Applicability Fields
    propertyGroup_applicability_description = models.TextField(null=True, blank=True)
    propertyGroup_applicability_language = models.CharField(max_length=255, null=True, blank=True)
    propertyGroup_applicability_expression = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'charge_item_definition'