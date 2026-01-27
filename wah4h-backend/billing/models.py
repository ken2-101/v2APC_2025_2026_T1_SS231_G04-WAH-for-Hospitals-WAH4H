from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

class Account(FHIRResourceModel):
    account_id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    servicePeriod_start = models.DateField(null=True, blank=True)
    servicePeriod_end = models.DateField(null=True, blank=True)
    coverage = models.ForeignKey('billing.Coverage', on_delete=models.PROTECT, db_column='coverage_id', null=True, blank=True, related_name='accounts')
    owner_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='owner_organization_id', null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    guarantor = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='guarantor_id', null=True, blank=True, related_name='guaranteed_accounts')
    part_of = models.ForeignKey('self', on_delete=models.PROTECT, db_column='part_of_id', null=True, blank=True, related_name='sub_accounts')
    class Meta:
        db_table = 'account'

class Claim(FHIRResourceModel):
    claim_id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    sub_type = models.CharField(max_length=100, null=True, blank=True)
    use = models.CharField(max_length=100, null=True, blank=True)
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='patient_id')
    billable_period_start = models.DateField(null=True, blank=True)
    billable_period_end = models.DateField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    enterer = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='enterer_id', null=True, blank=True)
    insurer_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='insurer_organization_id', null=True, blank=True)
    provider_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='provider_organization_id', null=True, blank=True, related_name='claims_provided')
    priority = models.CharField(max_length=100, null=True, blank=True)
    funds_reserve = models.CharField(max_length=100, null=True, blank=True)
    related = models.ForeignKey('billing.Claim', on_delete=models.PROTECT, db_column='related_id', null=True, blank=True, related_name='related_claims')
    prescription = models.ForeignKey('pharmacy.MedicationRequest', on_delete=models.PROTECT, db_column='prescription_id', null=True, blank=True, related_name='claims')
    original_prescription = models.ForeignKey('pharmacy.MedicationRequest', on_delete=models.PROTECT, db_column='original_prescription_id', null=True, blank=True, related_name='original_claims')
    payee_type = models.CharField(max_length=100, null=True, blank=True)
    payee_party = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='payee_party_id', null=True, blank=True, related_name='payee_claims')
    referral = models.ForeignKey('admission.ServiceRequest', on_delete=models.PROTECT, db_column='referral_id', null=True, blank=True, related_name='referral_claims')
    facility_location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='facility_location_id', null=True, blank=True)
    diagnosis = models.ForeignKey('patients.Condition', on_delete=models.PROTECT, db_column='diagnosis_id', null=True, blank=True, related_name='claim_diagnoses')
    procedure = models.ForeignKey('admission.Procedure', on_delete=models.PROTECT, db_column='procedure_id', null=True, blank=True, related_name='claim_procedures')
    insurance = models.ForeignKey('billing.Coverage', on_delete=models.PROTECT, db_column='insurance_id', null=True, blank=True, related_name='claim_insurances')
    accident_date = models.DateField(null=True, blank=True)
    accident_type = models.CharField(max_length=100, null=True, blank=True)
    accident_location_address = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='accident_location_address_id', null=True, blank=True, related_name='accident_claims')
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    class Meta:
        db_table = 'claim'

class Invoice(FHIRResourceModel):
    invoice_id = models.AutoField(primary_key=True)
    cancelled_reason = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    recipient = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='recipient_id', 
        null=True, 
        blank=True,
        related_name='received_invoices'
    )
    date = models.DateField(null=True, blank=True)
    participant = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='participant_id', null=True, blank=True, related_name='invoice_participants')
    issuer = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='issuer_id', 
        null=True, 
        blank=True,
        related_name='issued_invoices'
    )
    account = models.ForeignKey('billing.Account', on_delete=models.PROTECT, db_column='account_id', null=True, blank=True)
    total_price_component = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_net_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_gross_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_terms = models.TextField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    invoice_datetime = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = 'invoice'

class PaymentReconciliation(FHIRResourceModel):
    payment_reconciliation_id = models.AutoField(primary_key=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    payment_issuer = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='payment_issuer_id', 
        null=True, 
        blank=True,
        related_name='reconciliations_issued'
    )
    requestor = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='requestor_id', 
        null=True, 
        blank=True,
        related_name='reconciliations_requested'
    )
    outcome = models.CharField(max_length=100, null=True, blank=True)
    disposition = models.CharField(max_length=255, null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payment_amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    payment_amount_currency = models.CharField(max_length=10, null=True, blank=True)
    payment_identifier = models.CharField(max_length=100, null=True, blank=True)
    form_code = models.CharField(max_length=100, null=True, blank=True)
    class Meta:
        db_table = 'payment_reconciliation'

class PaymentNotice(FHIRResourceModel):
    payment_notice_id = models.AutoField(primary_key=True)
    request = models.ForeignKey('billing.Claim', on_delete=models.PROTECT, db_column='request_id', null=True, blank=True, related_name='payment_notices')
    response = models.ForeignKey('billing.ClaimResponse', on_delete=models.PROTECT, db_column='response_id', null=True, blank=True, related_name='payment_notices')
    created = models.DateTimeField(auto_now_add=True)
    provider_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='provider_organization_id', null=True, blank=True, related_name='payment_notices_provided')
    payment_status = models.ForeignKey('billing.PaymentReconciliation', on_delete=models.PROTECT, db_column='payment_status_id', null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payee = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='payee_id', null=True, blank=True, related_name='payee_notices')
    recipient = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='recipient_id', null=True, blank=True, related_name='payment_notices_received')
    amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amount_currency = models.CharField(max_length=10, null=True, blank=True)
    class Meta:
        db_table = 'payment_notice'

# Supporting Models

class Coverage(FHIRResourceModel):
    coverage_id = models.AutoField(primary_key=True)
    subscriber = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subscriber_id', null=True, blank=True, related_name='coverages')
    beneficiary = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='beneficiary_id', related_name='beneficiary_coverages')
    relationship = models.CharField(max_length=100, null=True, blank=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    payor = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='payor_id', null=True, blank=True, related_name='coverages_paid')
    class_type = models.CharField(max_length=100, db_column='class', null=True, blank=True)
    class_value = models.CharField(max_length=255, null=True, blank=True)
    order = models.IntegerField(null=True, blank=True)
    network = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        db_table = 'coverage'

class ClaimResponse(FHIRResourceModel):
    claim_response_id = models.AutoField(primary_key=True)
    claim = models.ForeignKey('billing.Claim', on_delete=models.PROTECT, db_column='claim_id', related_name='responses')
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='patient_id')
    created = models.DateTimeField(auto_now_add=True)
    insurer = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='insurer_id', null=True, blank=True, related_name='claim_responses')
    requestor = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='requestor_id', null=True, blank=True, related_name='claim_responses')
    outcome = models.CharField(max_length=100, null=True, blank=True)
    disposition = models.CharField(max_length=255, null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    class Meta:
        db_table = 'claim_response'

# Child/Detail Models

class ClaimItem(TimeStampedModel):
    claim_item_id = models.AutoField(primary_key=True)
    claim = models.ForeignKey('billing.Claim', on_delete=models.PROTECT, db_column='claim_id', related_name='items')
    sequence = models.IntegerField()
    care_team_sequence = models.IntegerField(null=True, blank=True)
    diagnosis_sequence = models.IntegerField(null=True, blank=True)
    procedure_sequence = models.IntegerField(null=True, blank=True)
    information_sequence = models.IntegerField(null=True, blank=True)
    revenue = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    product_or_service = models.CharField(max_length=255, null=True, blank=True)
    modifier = models.CharField(max_length=100, null=True, blank=True)
    serviced_date = models.DateField(null=True, blank=True)
    location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='location_id', null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    net = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    class Meta:
        db_table = 'claim_item'

class InvoiceLineItem(TimeStampedModel):
    line_item_id = models.AutoField(primary_key=True)
    invoice = models.ForeignKey('billing.Invoice', on_delete=models.PROTECT, db_column='invoice_id', related_name='line_items')
    sequence = models.IntegerField()
    charge_item_reference = models.ForeignKey('monitoring.ChargeItem', on_delete=models.PROTECT, db_column='charge_item_reference_id', null=True, blank=True, related_name='invoice_lines')
    price_component_type = models.CharField(max_length=100, null=True, blank=True)
    price_component_code = models.CharField(max_length=100, null=True, blank=True)
    price_component_factor = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_component_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    class Meta:
        db_table = 'invoice_line_item'

class PaymentReconciliationDetail(TimeStampedModel):
    detail_id = models.AutoField(primary_key=True)
    payment_reconciliation = models.ForeignKey('billing.PaymentReconciliation', on_delete=models.PROTECT, db_column='payment_reconciliation_id', related_name='details')
    identifier = models.CharField(max_length=100, null=True, blank=True)
    predecessor = models.ForeignKey('self', on_delete=models.PROTECT, db_column='predecessor_id', null=True, blank=True, related_name='successors')
    type = models.CharField(max_length=100, null=True, blank=True)
    request = models.ForeignKey('billing.Claim', on_delete=models.PROTECT, db_column='request_id', null=True, blank=True, related_name='reconciliation_details')
    submitter = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='submitter_id', null=True, blank=True, related_name='reconciliation_submissions')
    response = models.ForeignKey('billing.ClaimResponse', on_delete=models.PROTECT, db_column='response_id', null=True, blank=True, related_name='reconciliation_details')
    date = models.DateField(null=True, blank=True)
    responsible = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='responsible_id', null=True, blank=True, related_name='reconciliation_responsibilities')
    payee = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='payee_id', null=True, blank=True, related_name='reconciliation_payees')
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    class Meta:
        db_table = 'payment_reconciliation_detail'