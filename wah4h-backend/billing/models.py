from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel


# FHIR Resources

class Account(FHIRResourceModel):
    """
    FHIR Account Resource - strictly aligned with billing.csv
    """
    account_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=100)
    type = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    subject_id = models.IntegerField()
    servicePeriod_start = models.DateField(null=True, blank=True)
    servicePeriod_end = models.DateField(null=True, blank=True)
    coverage_reference_id = models.IntegerField(null=True, blank=True)
    coverage_priority = models.CharField(max_length=255, null=True, blank=True)
    owner_id = models.IntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    guarantor_party_id = models.IntegerField(null=True, blank=True)
    guarantor_onHold = models.CharField(max_length=255, null=True, blank=True)
    guarantor_period_start = models.DateField(null=True, blank=True)
    guarantor_period_end = models.DateField(null=True, blank=True)
    partOf_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'account'


class Claim(FHIRResourceModel):
    """
    FHIR Claim Resource - strictly aligned with billing.csv
    """
    claim_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=100)
    type = models.CharField(max_length=100, null=True, blank=True)
    subType = models.CharField(max_length=100, null=True, blank=True)
    use = models.CharField(max_length=255, null=True, blank=True)
    patient_id = models.IntegerField()
    billablePeriod_start = models.DateField(null=True, blank=True)
    billablePeriod_end = models.DateField(null=True, blank=True)
    created = models.DateTimeField(null=True, blank=True)
    enterer_id = models.IntegerField(null=True, blank=True)
    insurer_id = models.IntegerField(null=True, blank=True)
    provider_id = models.IntegerField(null=True, blank=True)
    priority = models.CharField(max_length=255, null=True, blank=True)
    fundsReserve = models.CharField(max_length=255, null=True, blank=True)
    related_claim_id = models.IntegerField(null=True, blank=True)
    related_reference = models.CharField(max_length=255, null=True, blank=True)
    related_relationship = models.CharField(max_length=255, null=True, blank=True)
    prescription_id = models.IntegerField(null=True, blank=True)
    originalPrescription_id = models.IntegerField(null=True, blank=True)
    payee_type = models.CharField(max_length=100, null=True, blank=True)
    payee_party_id = models.IntegerField(null=True, blank=True)
    referral_id = models.IntegerField(null=True, blank=True)
    facility_id = models.IntegerField(null=True, blank=True)
    
    # CareTeam fields
    careTeam_sequence = models.CharField(max_length=255, null=True, blank=True)
    careTeam_provider_id = models.IntegerField(null=True, blank=True)
    careTeam_responsible = models.CharField(max_length=255, null=True, blank=True)
    careTeam_role = models.CharField(max_length=255, null=True, blank=True)
    careTeam_qualification = models.CharField(max_length=255, null=True, blank=True)
    
    # SupportingInfo fields
    supportingInfo_sequence = models.CharField(max_length=255, null=True, blank=True)
    supportingInfo_category = models.CharField(max_length=255, null=True, blank=True)
    supportingInfo_code = models.CharField(max_length=100, null=True, blank=True)
    supportingInfo_timing_date = models.DateField(null=True, blank=True)
    supportingInfo_timing_period_start = models.DateField(null=True, blank=True)
    supportingInfo_timing_period_end = models.DateField(null=True, blank=True)
    supportingInfo_value_boolean = models.BooleanField(null=True, blank=True)
    supportingInfo_value_string = models.CharField(max_length=255, null=True, blank=True)
    supportingInfo_value_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    supportingInfo_value_attachment = models.CharField(max_length=255, null=True, blank=True)
    supportingInfo_value_reference = models.CharField(max_length=255, null=True, blank=True)
    supportingInfo_reason = models.CharField(max_length=255, null=True, blank=True)
    
    # Diagnosis fields
    diagnosis_sequence = models.CharField(max_length=255, null=True, blank=True)
    diagnosis_diagnosisCodeableConcept = models.CharField(max_length=100, null=True, blank=True)
    diagnosis_diagnosisReference = models.CharField(max_length=255, null=True, blank=True)
    diagnosis_type = models.CharField(max_length=100, null=True, blank=True)
    diagnosis_onAdmission = models.CharField(max_length=255, null=True, blank=True)
    diagnosis_packageCode = models.CharField(max_length=100, null=True, blank=True)
    
    # Procedure fields
    procedure_sequence = models.CharField(max_length=255, null=True, blank=True)
    procedure_type = models.CharField(max_length=100, null=True, blank=True)
    procedure_procedureCodeableConcept = models.CharField(max_length=100, null=True, blank=True)
    procedure_procedureReference = models.CharField(max_length=255, null=True, blank=True)
    procedure_udi = models.CharField(max_length=255, null=True, blank=True)
    
    # Item fields
    item_sequence = models.CharField(max_length=255, null=True, blank=True)
    item_careTeamSequence = models.CharField(max_length=255, null=True, blank=True)
    item_diagnosisSequence = models.CharField(max_length=255, null=True, blank=True)
    item_procedureSequence = models.CharField(max_length=255, null=True, blank=True)
    item_informationSequence = models.CharField(max_length=255, null=True, blank=True)
    item_revenue = models.CharField(max_length=255, null=True, blank=True)
    item_category = models.CharField(max_length=255, null=True, blank=True)
    item_productOrService = models.CharField(max_length=255, null=True, blank=True)
    item_modifier = models.CharField(max_length=255, null=True, blank=True)
    item_programCode = models.CharField(max_length=100, null=True, blank=True)
    item_servicedDate = models.CharField(max_length=255, null=True, blank=True)
    item_servicedPeriod_start = models.DateField(null=True, blank=True)
    item_servicedPeriod_end = models.DateField(null=True, blank=True)
    item_locationCodeableConcept = models.CharField(max_length=100, null=True, blank=True)
    item_locationAddress = models.CharField(max_length=255, null=True, blank=True)
    item_locationReference = models.CharField(max_length=255, null=True, blank=True)
    item_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_unitPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_factor = models.CharField(max_length=255, null=True, blank=True)
    item_net = models.CharField(max_length=255, null=True, blank=True)
    item_udi = models.CharField(max_length=255, null=True, blank=True)
    item_bodySite = models.CharField(max_length=255, null=True, blank=True)
    item_subSite = models.CharField(max_length=255, null=True, blank=True)
    
    # Item Detail fields
    item_detail_sequence = models.CharField(max_length=255, null=True, blank=True)
    item_detail_revenue = models.CharField(max_length=255, null=True, blank=True)
    item_detail_category = models.CharField(max_length=255, null=True, blank=True)
    item_detail_productOrService = models.CharField(max_length=255, null=True, blank=True)
    item_detail_modifier = models.CharField(max_length=255, null=True, blank=True)
    item_detail_programCode = models.CharField(max_length=100, null=True, blank=True)
    item_detail_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_detail_unitPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_detail_factor = models.CharField(max_length=255, null=True, blank=True)
    item_detail_net = models.CharField(max_length=255, null=True, blank=True)
    item_detail_udi = models.CharField(max_length=255, null=True, blank=True)
    
    # Item Detail SubDetail fields
    item_detail_subDetail_sequence = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_revenue = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_category = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_productOrService = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_modifier = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_programCode = models.CharField(max_length=100, null=True, blank=True)
    item_detail_subDetail_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_detail_subDetail_unitPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_detail_subDetail_factor = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_net = models.CharField(max_length=255, null=True, blank=True)
    item_detail_subDetail_udi = models.CharField(max_length=255, null=True, blank=True)
    
    # Accident fields
    accident_date = models.DateField(null=True, blank=True)
    accident_type = models.CharField(max_length=100, null=True, blank=True)
    accident_location_address = models.CharField(max_length=255, null=True, blank=True)
    accident_location_reference = models.CharField(max_length=255, null=True, blank=True)
    
    total = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'claim'


class ClaimResponse(FHIRResourceModel):
    """
    FHIR ClaimResponse Resource (ClaimRequest in CSV) - strictly aligned with billing.csv
    """
    claimResponse_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=100)
    type = models.CharField(max_length=100, null=True, blank=True)
    subType = models.CharField(max_length=100, null=True, blank=True)
    use = models.CharField(max_length=255, null=True, blank=True)
    patient_id = models.IntegerField()
    created = models.DateTimeField(null=True, blank=True)
    insurer_id = models.IntegerField(null=True, blank=True)
    requestor_id = models.IntegerField(null=True, blank=True)
    request_id = models.IntegerField(null=True, blank=True)
    outcome = models.CharField(max_length=255, null=True, blank=True)
    disposition = models.TextField(null=True, blank=True)
    preAuthRef = models.CharField(max_length=255, null=True, blank=True)
    preAuthPeriod_start = models.DateField(null=True, blank=True)
    preAuthPeriod_end = models.DateField(null=True, blank=True)
    payeeType = models.CharField(max_length=100, null=True, blank=True)
    
    # Item adjudication fields
    item_sequence = models.CharField(max_length=255, null=True, blank=True)
    item_noteNumbers = models.TextField(null=True, blank=True)
    item_adjudication_category = models.CharField(max_length=255, null=True, blank=True)
    item_adjudication_reason = models.CharField(max_length=255, null=True, blank=True)
    item_adjudication_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_adjudication_value = models.CharField(max_length=255, null=True, blank=True)
    
    # Item Detail adjudication fields
    item_detail_sequence = models.CharField(max_length=255, null=True, blank=True)
    item_detail_noteNumbers = models.TextField(null=True, blank=True)
    item_detail_adjudication_category = models.CharField(max_length=255, null=True, blank=True)
    item_detail_adjudication_reason = models.CharField(max_length=255, null=True, blank=True)
    item_detail_adjudication_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_detail_adjudication_value = models.CharField(max_length=255, null=True, blank=True)
    
    # Item SubDetail adjudication fields
    item_subDetail_sequence = models.CharField(max_length=255, null=True, blank=True)
    item_subDetail_noteNumbers = models.TextField(null=True, blank=True)
    item_subDetail_adjudication_category = models.CharField(max_length=255, null=True, blank=True)
    item_subDetail_adjudication_reason = models.CharField(max_length=255, null=True, blank=True)
    item_subDetail_adjudication_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    item_subDetail_adjudication_value = models.CharField(max_length=255, null=True, blank=True)
    
    # AddItem fields
    addItem_itemSequence = models.CharField(max_length=255, null=True, blank=True)
    addItem_detailSequence = models.CharField(max_length=255, null=True, blank=True)
    addItem_subDetailSequence = models.CharField(max_length=255, null=True, blank=True)
    addItem_provider = models.CharField(max_length=255, null=True, blank=True)
    addItem_productOrService = models.CharField(max_length=255, null=True, blank=True)
    addItem_modifier = models.CharField(max_length=255, null=True, blank=True)
    addItem_programCode = models.CharField(max_length=100, null=True, blank=True)
    addItem_servicedDate = models.CharField(max_length=255, null=True, blank=True)
    addItem_servicedPeriod_start = models.DateField(null=True, blank=True)
    addItem_servicedPeriod_end = models.DateField(null=True, blank=True)
    addItem_location_codeableConcept = models.CharField(max_length=100, null=True, blank=True)
    addItem_location_address = models.CharField(max_length=255, null=True, blank=True)
    addItem_location_reference = models.CharField(max_length=255, null=True, blank=True)
    addItem_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    addItem_unitPrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    addItem_factor = models.CharField(max_length=255, null=True, blank=True)
    addItem_net = models.CharField(max_length=255, null=True, blank=True)
    addItem_bodySite = models.CharField(max_length=255, null=True, blank=True)
    addItem_subSite = models.CharField(max_length=255, null=True, blank=True)
    addItem_detail_productOrService = models.CharField(max_length=255, null=True, blank=True)
    addItem_detail_modifier = models.CharField(max_length=255, null=True, blank=True)
    addItem_detail_subDetail_productOrService = models.CharField(max_length=255, null=True, blank=True)
    addItem_detail_subDetail_modifier = models.CharField(max_length=255, null=True, blank=True)
    
    # Total fields
    total_category = models.CharField(max_length=255, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Payment fields
    payment_type = models.CharField(max_length=100, null=True, blank=True)
    payment_adjustment = models.CharField(max_length=255, null=True, blank=True)
    payment_adjustmentReason = models.CharField(max_length=255, null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # ProcessNote fields
    processNote_number = models.TextField(null=True, blank=True)
    processNote_type = models.TextField(null=True, blank=True)
    processNote_text = models.TextField(null=True, blank=True)
    processNote_language = models.TextField(null=True, blank=True)
    
    # Error fields
    error_itemSequence = models.CharField(max_length=255, null=True, blank=True)
    error_detailSequence = models.CharField(max_length=255, null=True, blank=True)
    error_subDetailSequence = models.CharField(max_length=255, null=True, blank=True)
    error_code = models.CharField(max_length=100, null=True, blank=True)
    
    fundsReserve = models.CharField(max_length=255, null=True, blank=True)
    formCode = models.CharField(max_length=100, null=True, blank=True)
    form = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        db_table = 'claim_response'


class Invoice(FHIRResourceModel):
    """
    FHIR Invoice Resource - strictly aligned with billing.csv
    """
    invoice_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=100)
    cancelled_reason = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    subject_id = models.IntegerField()
    recipient_id = models.IntegerField(null=True, blank=True)
    invoice_datetime = models.DateTimeField(null=True, blank=True)
    participant_actor_id = models.IntegerField(null=True, blank=True)
    participant_role = models.CharField(max_length=255, null=True, blank=True)
    issuer_id = models.IntegerField(null=True, blank=True)
    account_id = models.IntegerField(null=True, blank=True)
    
    # Line item fields
    line_item_sequence = models.CharField(max_length=255, null=True, blank=True)
    line_item_chargeitem_reference_id = models.IntegerField(null=True, blank=True)
    line_item_chargeitem_code = models.CharField(max_length=100, null=True, blank=True)
    line_item_price_component_type = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    line_item_price_component_code = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    line_item_price_component_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    line_item_price_component_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    line_item_price_component_amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Total price component fields
    total_price_component_type = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_price_component_code = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_price_component_factor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_price_component_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_price_component_amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Total fields
    total_net_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_net_currency = models.CharField(max_length=255, null=True, blank=True)
    total_gross_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_gross_currency = models.CharField(max_length=255, null=True, blank=True)
    
    payment_terms = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'invoice'


class PaymentReconciliation(FHIRResourceModel):
    """
    FHIR PaymentReconciliation Resource - strictly aligned with billing.csv
    """
    payment_reconciliation_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=100)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    created_datetime = models.DateTimeField(null=True, blank=True)
    payment_issuer_id = models.IntegerField(null=True, blank=True)
    request_task_id = models.IntegerField(null=True, blank=True)
    requestor_id = models.IntegerField(null=True, blank=True)
    outcome = models.CharField(max_length=255, null=True, blank=True)
    disposition = models.TextField(null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    payment_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_identifier = models.CharField(max_length=100, null=True, blank=True)
    
    # Detail fields
    detail_identifier = models.CharField(max_length=100, null=True, blank=True)
    detail_predecessor_identifier = models.CharField(max_length=100, null=True, blank=True)
    detail_type = models.CharField(max_length=100, null=True, blank=True)
    detail_request_id = models.IntegerField(null=True, blank=True)
    detail_submitter_id = models.IntegerField(null=True, blank=True)
    detail_response_id = models.IntegerField(null=True, blank=True)
    detail_date = models.DateField(null=True, blank=True)
    detail_responsible_id = models.IntegerField(null=True, blank=True)
    detail_payee_id = models.IntegerField(null=True, blank=True)
    detail_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    detail_amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # ProcessNote fields
    process_note_type = models.TextField(null=True, blank=True)
    process_note_text = models.TextField(null=True, blank=True)
    
    form_code = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_reconciliation'


class PaymentNotice(FHIRResourceModel):
    """
    FHIR PaymentNotice Resource (Payment_Notice in CSV) - strictly aligned with billing.csv
    """
    payment_notice_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=100)
    request_reference_id = models.IntegerField(null=True, blank=True)
    response_reference_id = models.IntegerField(null=True, blank=True)
    created_datetime = models.DateTimeField(null=True, blank=True)
    provider_id = models.IntegerField(null=True, blank=True)
    payment_reconciliation_id = models.IntegerField(null=True, blank=True)
    payment_status = models.CharField(max_length=100, null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    payee_id = models.IntegerField(null=True, blank=True)
    recipient_id = models.IntegerField(null=True, blank=True)
    amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amount_currency = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_notice'