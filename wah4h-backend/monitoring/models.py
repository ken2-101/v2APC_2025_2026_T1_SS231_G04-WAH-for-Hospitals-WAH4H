from django.db import models
from core.models import FHIRResourceModel, TimeStampedModel

class Observation(TimeStampedModel):
    observation_id = models.AutoField(primary_key=True)
    status = models.CharField(max_length=100)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id')
    performer = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='performer_id', null=True, blank=True)
    specimen_id = models.IntegerField(null=True, blank=True)
    device_id = models.IntegerField(null=True, blank=True)
    derived_from_id = models.IntegerField(null=True, blank=True)
    focus_id = models.IntegerField(null=True, blank=True)
    has_member_id = models.IntegerField(null=True, blank=True)
    code = models.CharField(max_length=100)
    category = models.CharField(max_length=255, null=True, blank=True)
    body_site = models.CharField(max_length=255, null=True, blank=True)
    method = models.CharField(max_length=255, null=True, blank=True)
    interpretation = models.CharField(max_length=255, null=True, blank=True)
    data_absent_reason = models.CharField(max_length=255, null=True, blank=True)
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
    component_reference_range_type = models.CharField(max_length=100, null=True, blank=True)
    component_reference_range_text = models.TextField(null=True, blank=True)
    component_reference_range_low = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_high = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_age_low = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_age_high = models.CharField(max_length=255, null=True, blank=True)
    component_reference_range_applies_to = models.CharField(max_length=255, null=True, blank=True)
    reference_range_low = models.CharField(max_length=255, null=True, blank=True)
    reference_range_high = models.CharField(max_length=255, null=True, blank=True)
    reference_range_type = models.CharField(max_length=100, null=True, blank=True)
    reference_range_applies_to = models.CharField(max_length=255, null=True, blank=True)
    reference_range_age_low = models.CharField(max_length=255, null=True, blank=True)
    reference_range_age_high = models.CharField(max_length=255, null=True, blank=True)
    reference_range_text = models.TextField(null=True, blank=True)
    effective_datetime = models.DateTimeField(null=True, blank=True)
    effective_period_start = models.DateField(null=True, blank=True)
    effective_period_end = models.DateField(null=True, blank=True)
    effective_timing = models.CharField(max_length=255, null=True, blank=True)
    effective_instant = models.CharField(max_length=255, null=True, blank=True)
    issued = models.DateTimeField(null=True, blank=True)
    part_of = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    class Meta:
        db_table = 'observation'

class ChargeItem(FHIRResourceModel):
    chargeitem_id = models.AutoField(primary_key=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    account = models.ForeignKey('billing.Account', on_delete=models.PROTECT, db_column='account_id', null=True, blank=True)
    context_id = models.IntegerField(null=True, blank=True)
    partof_id = models.IntegerField(null=True, blank=True)
    performing_organization = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='performing_organization_id', 
        null=True, 
        blank=True,
        related_name='charge_items_performed'
    )
    requesting_organization = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='requesting_organization_id', 
        null=True, 
        blank=True,
        related_name='charge_items_requested'
    )
    performer_actor = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='performer_actor_id', null=True, blank=True)
    enterer_id = models.IntegerField(null=True, blank=True)
    cost_center_id = models.IntegerField(null=True, blank=True)
    code = models.CharField(max_length=100)
    definition_uri = models.CharField(max_length=255, null=True, blank=True)
    definition_canonical = models.CharField(max_length=255, null=True, blank=True)
    occurrence_datetime = models.DateTimeField(null=True, blank=True)
    occurrence_period_start = models.DateField(null=True, blank=True)
    occurrence_period_end = models.DateField(null=True, blank=True)
    entered_date = models.DateTimeField(null=True, blank=True)
    performer_function = models.CharField(max_length=255, null=True, blank=True)
    bodysite_code = models.CharField(max_length=100, null=True, blank=True)
    bodysite_system = models.CharField(max_length=100, null=True, blank=True)
    factor_override = models.CharField(max_length=255, null=True, blank=True)
    price_override_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_override_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    override_reason = models.CharField(max_length=255, null=True, blank=True)
    reason_code = models.CharField(max_length=100, null=True, blank=True)
    reason_system = models.CharField(max_length=100, null=True, blank=True)
    service_reference = models.CharField(max_length=255, null=True, blank=True)
    product_reference = models.CharField(max_length=255, null=True, blank=True)
    product_codeableconcept = models.CharField(max_length=100, null=True, blank=True)
    quantity_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    supporting_information = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    class Meta:
        db_table = 'charge_item'

class ChargeItemDefinition(FHIRResourceModel):
    chargeitemdefinition_id = models.AutoField(primary_key=True)
    url = models.URLField(max_length=255, null=True, blank=True)
    version = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    derivedFromUri = models.CharField(max_length=255, null=True, blank=True)
    partOf_id = models.IntegerField(null=True, blank=True)
    replaces_id = models.IntegerField(null=True, blank=True)
    experimental = models.CharField(max_length=255, null=True, blank=True)
    date = models.CharField(max_length=255, null=True, blank=True)
    publisher = models.CharField(max_length=255, null=True, blank=True)
    contact_name = models.CharField(max_length=50, null=True, blank=True)
    contact_telecom = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    usecontext_code = models.TextField(null=True, blank=True)
    usecontext_value = models.TextField(null=True, blank=True)
    jurisdiction_code = models.CharField(max_length=100, null=True, blank=True)
    jurisdiction_system = models.CharField(max_length=100, null=True, blank=True)
    copyright = models.CharField(max_length=255, null=True, blank=True)
    approvalDate = models.CharField(max_length=255, null=True, blank=True)
    lastReviewDate = models.CharField(max_length=255, null=True, blank=True)
    effectivePeriod_start = models.DateField(null=True, blank=True)
    effectivePeriod_end = models.DateField(null=True, blank=True)
    code = models.CharField(max_length=100)
    instance_reference = models.CharField(max_length=255, null=True, blank=True)
    applicability_description = models.TextField(null=True, blank=True)
    applicability_language = models.CharField(max_length=255, null=True, blank=True)
    applicability_expression = models.CharField(max_length=255, null=True, blank=True)
    propertyGroup_priceComponent_type = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_code = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_priceComponent_amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    propertyGroup_applicability_description = models.TextField(null=True, blank=True)
    propertyGroup_applicability_language = models.CharField(max_length=255, null=True, blank=True)
    propertyGroup_applicability_expression = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        db_table = 'charge_item_definition'

# ADDED MISSING MODEL
class NutritionOrder(FHIRResourceModel):
    nutrition_order_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='patient_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id', null=True, blank=True)
    orderer = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='orderer_id', null=True, blank=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
    datetime = models.DateTimeField(auto_now_add=True)
    
    # Diet Details
    oral_diet_type = models.CharField(max_length=255, null=True, blank=True)  # e.g., "Low Sodium", "Vegan"
    oral_diet_schedule = models.CharField(max_length=255, null=True, blank=True)
    texture_modifier = models.CharField(max_length=255, null=True, blank=True) # e.g., "Pureed"
    fluid_consistency_type = models.CharField(max_length=255, null=True, blank=True)
    
    # Exclusions/Preferences
    exclude_food_modifier = models.TextField(null=True, blank=True)
    food_preference_modifier = models.TextField(null=True, blank=True)
    
    # Supplements (if needed)
    supplement_type = models.CharField(max_length=255, null=True, blank=True)
    supplement_product_name = models.CharField(max_length=255, null=True, blank=True)
    
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'nutrition_order'