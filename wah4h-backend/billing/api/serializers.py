"""
Billing API Serializers - CQRS-Lite Pattern
============================================

Architecture:
- Input Serializers: Accept nested data for write operations (POST/PUT)
- Output Serializers: Return flattened DTOs for read operations (GET)
- Strict Separation: No .save() methods - delegates to services

Context: Philippine LGU Hospital System - Billing Module
"""

from rest_framework import serializers


# ============================================================================
# ACCOUNT SERIALIZERS
# ============================================================================

class AccountInputSerializer(serializers.Serializer):
    """
    Input serializer for Account creation.
    Accepts flat structure with validation.
    """
    subject_id = serializers.IntegerField(required=True, help_text="Patient ID")
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    status = serializers.CharField(required=False, default='active', max_length=50)
    identifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    servicePeriod_start = serializers.DateField(required=False, allow_null=True)
    servicePeriod_end = serializers.DateField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
    owner_id = serializers.IntegerField(required=False, allow_null=True, help_text="Organization or Practitioner ID")
    guarantor_party_id = serializers.IntegerField(required=False, allow_null=True)
    guarantor_onHold = serializers.CharField(required=False, allow_blank=True, max_length=255)
    guarantor_period_start = serializers.DateField(required=False, allow_null=True)
    guarantor_period_end = serializers.DateField(required=False, allow_null=True)


class AccountOutputSerializer(serializers.Serializer):
    """
    Output serializer for Account details.
    Flattened DTO for easy consumption.
    """
    account_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    name = serializers.CharField()
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(required=False)
    servicePeriod_start = serializers.CharField(allow_null=True)
    servicePeriod_end = serializers.CharField(allow_null=True)
    owner_id = serializers.IntegerField(allow_null=True)
    description = serializers.CharField()
    guarantor_party_id = serializers.IntegerField(allow_null=True)
    guarantor_onHold = serializers.CharField()
    guarantor_period_start = serializers.CharField(allow_null=True)
    guarantor_period_end = serializers.CharField(allow_null=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


# ============================================================================
# INVOICE SERIALIZERS
# ============================================================================

class InvoiceLineItemPriceComponentInputSerializer(serializers.Serializer):
    """
    Input serializer for InvoiceLineItemPriceComponent (nested).
    """
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    code = serializers.CharField(required=False, allow_blank=True, max_length=100)
    factor = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    amount_value = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2, help_text="Amount value")
    amount_currency = serializers.CharField(required=False, default='PHP', max_length=3, help_text="ISO 4217 currency code")


class InvoiceLineItemInputSerializer(serializers.Serializer):
    """
    Input serializer for InvoiceLineItem (nested).
    """
    sequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    chargeitem_code = serializers.CharField(required=False, allow_blank=True, max_length=100)
    chargeitem_reference_id = serializers.IntegerField(required=False, allow_null=True)
    priceComponents = InvoiceLineItemPriceComponentInputSerializer(many=True, required=False)


class InvoiceTotalPriceComponentInputSerializer(serializers.Serializer):
    """
    Input serializer for InvoiceTotalPriceComponent (nested).
    """
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    code = serializers.CharField(required=False, allow_blank=True, max_length=100)
    factor = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    amount_value = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2, help_text="Amount value")
    amount_currency = serializers.CharField(required=False, default='PHP', max_length=3, help_text="ISO 4217 currency code")


class InvoiceInputSerializer(serializers.Serializer):
    """
    Input serializer for Invoice creation.
    Accepts nested line_items and total_price_components.
    """
    subject_id = serializers.IntegerField(required=True, help_text="Patient ID")
    identifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    status = serializers.CharField(required=False, default='draft', max_length=50)
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    account_id = serializers.IntegerField(required=False, allow_null=True, help_text="Account ID")
    invoice_datetime = serializers.DateTimeField(required=False, allow_null=True)
    recipient_id = serializers.IntegerField(required=False, allow_null=True)
    participant_role = serializers.CharField(required=False, allow_blank=True, max_length=255)
    participant_actor_id = serializers.IntegerField(required=False, allow_null=True)
    issuer_id = serializers.IntegerField(required=False, allow_null=True, help_text="Organization ID")
    total_net_value = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    total_net_currency = serializers.CharField(required=False, default='PHP', max_length=3)
    total_gross_value = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    total_gross_currency = serializers.CharField(required=False, default='PHP', max_length=3)
    payment_terms = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    line_items = InvoiceLineItemInputSerializer(many=True, required=False)
    total_price_components = InvoiceTotalPriceComponentInputSerializer(many=True, required=False)


class InvoiceLineItemPriceComponentOutputSerializer(serializers.Serializer):
    """
    Output serializer for InvoiceLineItemPriceComponent (nested).
    """
    id = serializers.IntegerField()
    type = serializers.CharField()
    code = serializers.CharField()
    factor = serializers.FloatField(allow_null=True)
    amount_value = serializers.FloatField(allow_null=True)
    amount_currency = serializers.CharField()


class InvoiceLineItemOutputSerializer(serializers.Serializer):
    """
    Output serializer for InvoiceLineItem (nested).
    """
    id = serializers.IntegerField()
    sequence = serializers.CharField()
    chargeitem_code = serializers.CharField()
    chargeitem_reference_id = serializers.IntegerField(allow_null=True)
    priceComponents = InvoiceLineItemPriceComponentOutputSerializer(many=True)


class InvoiceTotalPriceComponentOutputSerializer(serializers.Serializer):
    """
    Output serializer for InvoiceTotalPriceComponent (nested).
    """
    id = serializers.IntegerField()
    type = serializers.CharField()
    code = serializers.CharField()
    factor = serializers.FloatField(allow_null=True)
    amount_value = serializers.FloatField(allow_null=True)
    amount_currency = serializers.CharField()


class InvoiceOutputSerializer(serializers.Serializer):
    """
    Output serializer for Invoice details.
    Returns deep DTO with nested line items and components.
    """
    invoice_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(required=False)
    recipient_id = serializers.IntegerField(allow_null=True)
    invoice_datetime = serializers.CharField(allow_null=True)
    participant_role = serializers.CharField()
    participant_actor_id = serializers.IntegerField(allow_null=True)
    issuer_id = serializers.IntegerField(allow_null=True)
    account_id = serializers.IntegerField(allow_null=True)
    total_net_value = serializers.FloatField(allow_null=True)
    total_net_currency = serializers.CharField()
    total_gross_value = serializers.FloatField(allow_null=True)
    total_gross_currency = serializers.CharField()
    payment_terms = serializers.CharField()
    note = serializers.CharField()
    line_items = InvoiceLineItemOutputSerializer(many=True)
    total_price_components = InvoiceTotalPriceComponentOutputSerializer(many=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class InvoiceListOutputSerializer(serializers.Serializer):
    """
    Output serializer for Invoice list (summary).
    Simplified DTO for list views.
    """
    invoice_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    invoice_datetime = serializers.CharField(allow_null=True)
    total_gross_value = serializers.FloatField(allow_null=True)
    total_gross_currency = serializers.CharField()
    total_net_value = serializers.FloatField(allow_null=True)
    total_net_currency = serializers.CharField()
    account_id = serializers.IntegerField(allow_null=True)
    created_at = serializers.CharField(allow_null=True)


# ============================================================================
# CLAIM SERIALIZERS (Insurance Claims)
# ============================================================================

class ClaimItemInputSerializer(serializers.Serializer):
    """
    Input serializer for ClaimItem (nested).
    """
    sequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    careTeamSequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    diagnosisSequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    procedureSequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    productOrService = serializers.CharField(required=False, allow_blank=True, max_length=255)
    modifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    quantity = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    unitPrice = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    net = serializers.CharField(required=False, allow_blank=True, max_length=255)
    servicedDate = serializers.CharField(required=False, allow_blank=True, max_length=255)
    servicedPeriod_start = serializers.DateField(required=False, allow_null=True)
    servicedPeriod_end = serializers.DateField(required=False, allow_null=True)
    locationCodeableConcept = serializers.CharField(required=False, allow_blank=True, max_length=100)


class ClaimDiagnosisInputSerializer(serializers.Serializer):
    """
    Input serializer for ClaimDiagnosis (nested).
    """
    sequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    diagnosisCodeableConcept = serializers.CharField(required=False, allow_blank=True, max_length=100)
    diagnosisReference = serializers.CharField(required=False, allow_blank=True, max_length=255)
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    onAdmission = serializers.CharField(required=False, allow_blank=True, max_length=255)


class ClaimProcedureInputSerializer(serializers.Serializer):
    """
    Input serializer for ClaimProcedure (nested).
    """
    sequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    procedureCodeableConcept = serializers.CharField(required=False, allow_blank=True, max_length=100)
    procedureReference = serializers.CharField(required=False, allow_blank=True, max_length=255)


class ClaimCareTeamInputSerializer(serializers.Serializer):
    """
    Input serializer for ClaimCareTeam (nested).
    """
    sequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    provider_id = serializers.IntegerField(required=False, allow_null=True)
    responsible = serializers.CharField(required=False, allow_blank=True, max_length=255)
    role = serializers.CharField(required=False, allow_blank=True, max_length=255)
    qualification = serializers.CharField(required=False, allow_blank=True, max_length=255)


class ClaimSupportingInfoInputSerializer(serializers.Serializer):
    """
    Input serializer for ClaimSupportingInfo (nested).
    """
    sequence = serializers.CharField(required=False, allow_blank=True, max_length=255)
    category = serializers.CharField(required=False, allow_blank=True, max_length=255)
    code = serializers.CharField(required=False, allow_blank=True, max_length=100)
    timing_date = serializers.DateField(required=False, allow_null=True)
    value_string = serializers.CharField(required=False, allow_blank=True, max_length=255)
    value_quantity = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)


class ClaimInputSerializer(serializers.Serializer):
    """
    Input serializer for Claim creation (Insurance Claims).
    Accepts nested items, diagnoses, procedures, care_team, and supporting_info.
    """
    patient_id = serializers.IntegerField(required=True, help_text="Patient ID")
    insurer_id = serializers.IntegerField(required=True, help_text="Insurer Organization ID")
    identifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    status = serializers.CharField(required=False, default='active', max_length=50)
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    subType = serializers.CharField(required=False, allow_blank=True, max_length=100)
    use = serializers.CharField(required=False, allow_blank=True, max_length=255)
    provider_id = serializers.IntegerField(required=False, allow_null=True, help_text="Provider Organization ID")
    priority = serializers.CharField(required=False, allow_blank=True, max_length=255)
    billablePeriod_start = serializers.DateField(required=False, allow_null=True)
    billablePeriod_end = serializers.DateField(required=False, allow_null=True)
    created = serializers.DateTimeField(required=False, allow_null=True)
    payee_type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    payee_party_id = serializers.IntegerField(required=False, allow_null=True)
    total = serializers.CharField(required=False, allow_blank=True, max_length=255)
    items = ClaimItemInputSerializer(many=True, required=False)
    diagnoses = ClaimDiagnosisInputSerializer(many=True, required=False)
    procedures = ClaimProcedureInputSerializer(many=True, required=False)
    care_team = ClaimCareTeamInputSerializer(many=True, required=False)
    supporting_info = ClaimSupportingInfoInputSerializer(many=True, required=False)


class ClaimItemOutputSerializer(serializers.Serializer):
    """
    Output serializer for ClaimItem (nested).
    """
    id = serializers.IntegerField()
    sequence = serializers.CharField()
    productOrService = serializers.CharField()
    quantity = serializers.FloatField(allow_null=True)
    unitPrice = serializers.FloatField(allow_null=True)
    net = serializers.CharField()
    servicedDate = serializers.CharField()
    locationCodeableConcept = serializers.CharField()


class ClaimDiagnosisOutputSerializer(serializers.Serializer):
    """
    Output serializer for ClaimDiagnosis (nested).
    """
    id = serializers.IntegerField()
    sequence = serializers.CharField()
    diagnosisCodeableConcept = serializers.CharField()
    diagnosisReference = serializers.CharField()
    type = serializers.CharField()
    onAdmission = serializers.CharField()


class ClaimProcedureOutputSerializer(serializers.Serializer):
    """
    Output serializer for ClaimProcedure (nested).
    """
    id = serializers.IntegerField()
    sequence = serializers.CharField()
    type = serializers.CharField()
    procedureCodeableConcept = serializers.CharField()
    procedureReference = serializers.CharField()


class ClaimCareTeamOutputSerializer(serializers.Serializer):
    """
    Output serializer for ClaimCareTeam (nested).
    """
    id = serializers.IntegerField()
    sequence = serializers.CharField()
    provider_id = serializers.IntegerField(allow_null=True)
    responsible = serializers.CharField()
    role = serializers.CharField()
    qualification = serializers.CharField()


class ClaimSupportingInfoOutputSerializer(serializers.Serializer):
    """
    Output serializer for ClaimSupportingInfo (nested).
    """
    id = serializers.IntegerField()
    sequence = serializers.CharField()
    category = serializers.CharField()
    code = serializers.CharField()
    value_string = serializers.CharField()


class ClaimOutputSerializer(serializers.Serializer):
    """
    Output serializer for Claim details.
    Returns deep DTO with nested items, diagnoses, and procedures.
    """
    claim_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    subType = serializers.CharField()
    use = serializers.CharField()
    patient_id = serializers.IntegerField()
    patient_summary = serializers.DictField(required=False)
    billablePeriod_start = serializers.CharField(allow_null=True)
    billablePeriod_end = serializers.CharField(allow_null=True)
    created = serializers.CharField(allow_null=True)
    insurer_id = serializers.IntegerField(allow_null=True)
    provider_id = serializers.IntegerField(allow_null=True)
    priority = serializers.CharField()
    payee_type = serializers.CharField()
    payee_party_id = serializers.IntegerField(allow_null=True)
    total = serializers.CharField()
    items = ClaimItemOutputSerializer(many=True)
    diagnoses = ClaimDiagnosisOutputSerializer(many=True)
    procedures = ClaimProcedureOutputSerializer(many=True)
    care_team = ClaimCareTeamOutputSerializer(many=True)
    supporting_info = ClaimSupportingInfoOutputSerializer(many=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


# ============================================================================
# PAYMENT RECONCILIATION SERIALIZERS
# ============================================================================

class PaymentReconciliationDetailInputSerializer(serializers.Serializer):
    """
    Input serializer for PaymentReconciliationDetail (nested).
    """
    identifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    type = serializers.CharField(required=False, allow_blank=True, max_length=100)
    request_id = serializers.IntegerField(required=False, allow_null=True)
    submitter_id = serializers.IntegerField(required=False, allow_null=True)
    response_id = serializers.IntegerField(required=False, allow_null=True)
    date = serializers.DateField(required=False, allow_null=True)
    responsible_id = serializers.IntegerField(required=False, allow_null=True)
    payee_id = serializers.IntegerField(required=False, allow_null=True)
    amount = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)


class PaymentInputSerializer(serializers.Serializer):
    """
    Input serializer for PaymentReconciliation creation.
    Accepts nested details.
    """
    identifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    status = serializers.CharField(required=False, default='active', max_length=50)
    period_start = serializers.DateField(required=False, allow_null=True)
    period_end = serializers.DateField(required=False, allow_null=True)
    created_datetime = serializers.DateTimeField(required=False, allow_null=True)
    paymentIssuer_id = serializers.IntegerField(required=False, allow_null=True, help_text="Payment Issuer Organization ID")
    request_id = serializers.IntegerField(required=False, allow_null=True)
    requestor_id = serializers.IntegerField(required=False, allow_null=True)
    outcome = serializers.CharField(required=False, allow_blank=True, max_length=255)
    disposition = serializers.CharField(required=False, allow_blank=True)
    paymentDate = serializers.DateField(required=False, allow_null=True)
    paymentAmount = serializers.DecimalField(required=False, allow_null=True, max_digits=10, decimal_places=2)
    paymentIdentifier = serializers.CharField(required=False, allow_blank=True, max_length=255)
    details = PaymentReconciliationDetailInputSerializer(many=True, required=False)
    update_invoice_status = serializers.BooleanField(required=False, default=False)
    invoice_id = serializers.IntegerField(required=False, allow_null=True)


class PaymentReconciliationDetailOutputSerializer(serializers.Serializer):
    """
    Output serializer for PaymentReconciliationDetail (nested).
    """
    id = serializers.IntegerField()
    identifier = serializers.CharField()
    type = serializers.CharField()
    request_id = serializers.IntegerField(allow_null=True)
    submitter_id = serializers.IntegerField(allow_null=True)
    response_id = serializers.IntegerField(allow_null=True)
    date = serializers.CharField(allow_null=True)
    responsible_id = serializers.IntegerField(allow_null=True)
    payee_id = serializers.IntegerField(allow_null=True)
    amount = serializers.FloatField(allow_null=True)


class PaymentOutputSerializer(serializers.Serializer):
    """
    Output serializer for PaymentReconciliation details.
    Returns deep DTO with nested details.
    """
    payment_reconciliation_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    period_start = serializers.CharField(allow_null=True)
    period_end = serializers.CharField(allow_null=True)
    created_datetime = serializers.CharField(allow_null=True)
    paymentIssuer_id = serializers.IntegerField(allow_null=True)
    request_id = serializers.IntegerField(allow_null=True)
    requestor_id = serializers.IntegerField(allow_null=True)
    outcome = serializers.CharField()
    disposition = serializers.CharField()
    paymentDate = serializers.CharField(allow_null=True)
    paymentAmount = serializers.FloatField(allow_null=True)
    paymentIdentifier = serializers.CharField()
    details = PaymentReconciliationDetailOutputSerializer(many=True)
    total_amount = serializers.FloatField()
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


# ============================================================================
# BILLING RECORD SERIALIZERS (Frontend Facade)
# ============================================================================

class BillingRecordMedicineSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField()
    dosage = serializers.CharField(required=False, allow_blank=True)
    quantity = serializers.IntegerField()
    unitPrice = serializers.DecimalField(max_digits=10, decimal_places=2)

class BillingRecordDiagnosticSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=2)

class BillingRecordPaymentSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    or_number = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class BillingRecordInputSerializer(serializers.Serializer):
    """
    Serializer for the frontend 'BillingRecord' structure.
    Acts as an adapter to the domain Invoice model.
    """
    id = serializers.IntegerField(required=False)
    patient = serializers.IntegerField(source='patientId')
    patient_name = serializers.CharField(source='patientName', required=False)
    hospital_id = serializers.CharField(source='hospitalId', required=False)
    admission_date = serializers.CharField(source='admissionDate', required=False)
    discharge_date = serializers.CharField(source='dischargeDate', required=False)
    room_ward = serializers.CharField(source='roomWard', required=False)
    room_type = serializers.CharField(source='roomType', required=False)
    number_of_days = serializers.IntegerField(source='numberOfDays', required=False)
    rate_per_day = serializers.DecimalField(source='ratePerDay', max_digits=10, decimal_places=2, required=False)
    
    attending_physician_fee = serializers.DecimalField(source='attendingPhysicianFee', max_digits=10, decimal_places=2, required=False)
    specialist_fee = serializers.DecimalField(source='specialistFee', max_digits=10, decimal_places=2, required=False)
    surgeon_fee = serializers.DecimalField(source='surgeonFee', max_digits=10, decimal_places=2, required=False)
    other_professional_fees = serializers.DecimalField(source='otherProfessionalFees', max_digits=10, decimal_places=2, required=False)
    
    diet_type = serializers.CharField(source='dietType', required=False)
    meals_per_day = serializers.IntegerField(source='mealsPerDay', required=False)
    diet_duration = serializers.IntegerField(source='dietDuration', required=False)
    cost_per_meal = serializers.DecimalField(source='costPerMeal', max_digits=10, decimal_places=2, required=False)
    
    supplies_charge = serializers.DecimalField(source='suppliesCharge', max_digits=10, decimal_places=2, required=False)
    procedure_charge = serializers.DecimalField(source='procedureCharge', max_digits=10, decimal_places=2, required=False)
    nursing_charge = serializers.DecimalField(source='nursingCharge', max_digits=10, decimal_places=2, required=False)
    miscellaneous_charge = serializers.DecimalField(source='miscellaneousCharge', max_digits=10, decimal_places=2, required=False)
    
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    philhealth_coverage = serializers.DecimalField(source='philhealthCoverage', max_digits=10, decimal_places=2, required=False)
    
    is_senior = serializers.BooleanField(required=False)
    is_pwd = serializers.BooleanField(required=False)
    is_philhealth_member = serializers.BooleanField(required=False)
    
    medicines = BillingRecordMedicineSerializer(many=True, required=False)
    diagnostics = BillingRecordDiagnosticSerializer(many=True, required=False)
    payments = BillingRecordPaymentSerializer(many=True, required=False)

class BillingRecordOutputSerializer(BillingRecordInputSerializer):
    is_finalized = serializers.BooleanField(required=False)
    finalized_date = serializers.CharField(required=False, allow_null=True)
    payment_status = serializers.CharField(source='paymentStatus', required=False)

class BillingDashboardItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    patientName = serializers.CharField()
    encounterId = serializers.CharField()
    runningBalance = serializers.DecimalField(max_digits=10, decimal_places=2)
    paymentStatus = serializers.CharField()
    lastORDate = serializers.CharField(allow_null=True)
    room = serializers.CharField()
