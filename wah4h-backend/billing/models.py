from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

class Account(TimeStampedModel):
    account_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
    type = models.CharField(max_length=100, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    servicePeriod_start = models.DateField(null=True, blank=True)
    servicePeriod_end = models.DateField(null=True, blank=True)
    coverage_id = models.IntegerField(null=True, blank=True)
    owner_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='owner_organization_id', null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    guarantor_id = models.IntegerField(null=True, blank=True)
    part_of_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = 'account'

class Claim(FHIRResourceModel):
    claim_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
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
    related_id = models.IntegerField(null=True, blank=True)
    prescription_id = models.IntegerField(null=True, blank=True)
    original_prescription_id = models.IntegerField(null=True, blank=True)
    payee_type = models.CharField(max_length=100, null=True, blank=True)
    payee_party_id = models.IntegerField(null=True, blank=True)
    referral_id = models.IntegerField(null=True, blank=True)
    facility_location = models.ForeignKey('accounts.Location', on_delete=models.PROTECT, db_column='facility_location_id', null=True, blank=True)
    care_team_id = models.IntegerField(null=True, blank=True)
    supporting_info_id = models.IntegerField(null=True, blank=True)
    diagnosis_id = models.IntegerField(null=True, blank=True)
    procedure_id = models.IntegerField(null=True, blank=True)
    insurance_id = models.IntegerField(null=True, blank=True)
    accident_date = models.DateField(null=True, blank=True)
    accident_type = models.CharField(max_length=100, null=True, blank=True)
    accident_location_address_id = models.IntegerField(null=True, blank=True)
    item_id = models.IntegerField(null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    class Meta:
        db_table = 'claim'

class Invoice(TimeStampedModel):
    invoice_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
    cancelled_reason = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    recipient = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='recipient_id', 
        null=True, 
        blank=True,
        related_name='invoices_received'
    )
    date = models.DateField(null=True, blank=True)
    participant_id = models.IntegerField(null=True, blank=True)
    issuer = models.ForeignKey(
        'accounts.Organization', 
        on_delete=models.PROTECT, 
        db_column='issuer_id', 
        null=True, 
        blank=True,
        related_name='invoices_issued'
    )
    account = models.ForeignKey('billing.Account', on_delete=models.PROTECT, db_column='account_id', null=True, blank=True)
    line_item_id = models.IntegerField(null=True, blank=True)
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
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
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
    detail_id = models.IntegerField(null=True, blank=True)
    form_code = models.CharField(max_length=100, null=True, blank=True)
    process_note_id = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = 'payment_reconciliation'

class PaymentNotice(FHIRResourceModel):
    payment_notice_id = models.AutoField(primary_key=True)
    identifier = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100)
    request_id = models.IntegerField(null=True, blank=True)
    response_id = models.IntegerField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    provider_organization = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='provider_organization_id', null=True, blank=True, related_name='payment_notices_provided')
    payment_status = models.ForeignKey('billing.PaymentReconciliation', on_delete=models.PROTECT, db_column='payment_status_id', null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payee_id = models.IntegerField(null=True, blank=True)
    recipient = models.ForeignKey('accounts.Organization', on_delete=models.PROTECT, db_column='recipient_id', null=True, blank=True, related_name='payment_notices_received')
    amount_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amount_currency = models.CharField(max_length=10, null=True, blank=True)
    class Meta:
        db_table = 'payment_notice'