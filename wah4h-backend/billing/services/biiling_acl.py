from decimal import Decimal
from typing import Dict, List, Optional
from django.db.models import Sum, Q
from billing.models import (
    Invoice,
    InvoiceLineItem,
    InvoiceLineItemPriceComponent,
    InvoiceTotalPriceComponent,
    Account,
    Claim,
    ClaimItem,
    ClaimDiagnosis,
    ClaimProcedure,
    ClaimCareTeam,
    ClaimSupportingInfo,
    PaymentReconciliation,
    PaymentReconciliationDetail,
)

# Fortress Pattern: Import Patient ACL for enrichment
from patients.services.patient_acl import get_patient_summary


class BillingACL:
    """
    Fortress Pattern: Read-Only Access Control Layer for Billing Data
    
    Provides gatekeeper interface for external apps (Discharge, Patient Portal, Dashboard)
    to access financial data without direct model coupling.
    """
    
    @staticmethod
    def is_encounter_cleared(encounter_id: int) -> bool:
        """
        Check if encounter has cleared invoice (ready for discharge).
        
        Args:
            encounter_id: The encounter ID to check
            
        Returns:
            True if invoice exists and status indicates clearance ('balanced' or 'issued'),
            False otherwise (including 'draft' status)
        """
        try:
            invoice = Invoice.objects.get(encounter_id=encounter_id)
            # Draft invoices are NOT cleared
            return invoice.status in ['balanced', 'issued']
        except Invoice.DoesNotExist:
            return False
    
    @staticmethod
    def get_invoice_summary(encounter_id: int) -> Optional[Dict]:
        """
        Fetch invoice summary with line items for an encounter.
        
        Args:
            encounter_id: The encounter ID
            
        Returns:
            Dictionary with invoice header and line_items list, or None if not found
        """
        try:
            invoice = Invoice.objects.prefetch_related('line_items__price_components').get(
                encounter_id=encounter_id
            )
            
            line_items = []
            for item in invoice.line_items.all():
                # Calculate total amount from price components
                item_amount = Decimal('0.00')
                for component in item.price_components.all():
                    if component.amount:
                        item_amount += component.amount
                
                line_items.append({
                    'sequence': item.sequence,
                    'chargeitem_code': item.chargeitem_code,
                    'chargeitem_reference_id': item.chargeitem_reference_id,
                    'amount': item_amount,
                })
            
            return {
                'invoice_id': invoice.invoice_id,
                'status': invoice.status,
                'total_net_value': invoice.total_net_value,
                'total_net_currency': invoice.total_net_currency,
                'total_gross_value': invoice.total_gross_value,
                'total_gross_currency': invoice.total_gross_currency,
                'invoice_datetime': invoice.invoice_datetime,
                'subject_id': invoice.subject_id,
                'line_items': line_items,
            }
        except Invoice.DoesNotExist:
            return None
    
    @staticmethod
    def get_patient_balance(patient_id: int) -> Dict:
        """
        Calculate total outstanding balance for a patient.
        
        Args:
            patient_id: The patient ID
            
        Returns:
            Dictionary with total_outstanding, currency, and invoice_count
        """
        # Query all non-cleared invoices for patient
        outstanding_invoices = Invoice.objects.filter(
            subject_id=patient_id
        ).exclude(
            status__in=['balanced', 'cancelled']
        )
        
        invoice_count = outstanding_invoices.count()
        
        # Calculate total outstanding (sum of gross amounts)
        total = outstanding_invoices.aggregate(
            total=Sum('total_gross_value')
        )['total'] or Decimal('0.00')
        
        # Get currency from first invoice, default to 'PHP'
        currency = 'PHP'
        if outstanding_invoices.exists():
            first_invoice = outstanding_invoices.first()
            currency = first_invoice.total_gross_currency or 'PHP'
        
        return {
            'total_outstanding': total,
            'currency': currency,
            'invoice_count': invoice_count,
        }


class AccountACL:
    """
    Fortress Pattern: Read-Only Access Control Layer for Account Data
    
    Provides external access to patient account information.
    """
    
    @staticmethod
    def get_patient_account(patient_id: int) -> Optional[Dict]:
        """
        Fetch active account for a patient.
        
        Args:
            patient_id: The patient ID
            
        Returns:
            Dictionary with account details, or None if not found
        """
        try:
            account = Account.objects.get(
                subject_id=patient_id,
                status='active'
            )
            
            return {
                'account_id': account.account_id,
                'status': account.status,
                'type': account.type,
                'name': account.name,
                'subject_id': account.subject_id,
                'description': account.description,
                'servicePeriod_start': account.servicePeriod_start,
                'servicePeriod_end': account.servicePeriod_end,
                'owner_id': account.owner_id,
            }
        except Account.DoesNotExist:
            return None
    
    @staticmethod
    def get_account_details(account_id: int) -> Optional[Dict]:
        """
        Get detailed account information with enriched patient data.
        
        Args:
            account_id: Primary key of the account
            
        Returns:
            Dictionary with account details and patient_summary, or None if not found
        """
        try:
            account = Account.objects.get(account_id=account_id)
            
            # Enrich with patient summary via ACL
            patient_summary = get_patient_summary(account.subject_id)
            
            return {
                'account_id': account.account_id,
                'identifier': account.identifier,
                'status': account.status,
                'type': account.type,
                'name': account.name,
                'subject_id': account.subject_id,
                'patient_summary': patient_summary,
                'servicePeriod_start': account.servicePeriod_start.isoformat() if account.servicePeriod_start else None,
                'servicePeriod_end': account.servicePeriod_end.isoformat() if account.servicePeriod_end else None,
                'owner_id': account.owner_id,
                'description': account.description,
                'guarantor_party_id': account.guarantor_party_id,
                'guarantor_onHold': account.guarantor_onHold,
                'guarantor_period_start': account.guarantor_period_start.isoformat() if account.guarantor_period_start else None,
                'guarantor_period_end': account.guarantor_period_end.isoformat() if account.guarantor_period_end else None,
                'created_at': account.created_at.isoformat() if hasattr(account, 'created_at') else None,
                'updated_at': account.updated_at.isoformat() if hasattr(account, 'updated_at') else None,
            }
        except Account.DoesNotExist:
            return None


class InvoiceACL:
    """
    Fortress Pattern: Read-Only Access Control Layer for Invoice Data
    
    Provides external access to invoice information with deep DTOs.
    """
    
    @staticmethod
    def get_invoice_details(invoice_id: int) -> Optional[Dict]:
        """
        Get detailed invoice information with line items and price components.
        Returns deep DTO with enriched patient data.
        
        Args:
            invoice_id: Primary key of the invoice
            
        Returns:
            Dictionary with invoice details (Invoice -> Line Items -> Components), or None if not found
        """
        try:
            invoice = Invoice.objects.prefetch_related(
                'line_items__price_components',
                'total_price_components'
            ).get(invoice_id=invoice_id)
            
            # Enrich with patient summary via ACL
            patient_summary = get_patient_summary(invoice.subject_id)
            
            # Build line items with nested price components
            line_items = []
            for line_item in invoice.line_items.all():
                price_components = []
                for pc in line_item.price_components.all():
                    price_components.append({
                        'id': pc.id,
                        'type': pc.type,
                        'code': pc.code,
                        'factor': float(pc.factor) if pc.factor else None,
                        'amount_value': float(pc.amount_value) if pc.amount_value else None,
                        'amount_currency': pc.amount_currency,
                    })
                
                line_items.append({
                    'id': line_item.id,
                    'sequence': line_item.sequence,
                    'chargeitem_code': line_item.chargeitem_code,
                    'chargeitem_reference_id': line_item.chargeitem_reference_id,
                    'priceComponents': price_components,
                })
            
            # Build total price components
            total_price_components = []
            for tpc in invoice.total_price_components.all():
                total_price_components.append({
                    'id': tpc.id,
                    'type': tpc.type,
                    'code': tpc.code,
                    'factor': float(tpc.factor) if tpc.factor else None,
                    'amount_value': float(tpc.amount_value) if tpc.amount_value else None,
                    'amount_currency': tpc.amount_currency,
                })
            
            return {
                'invoice_id': invoice.invoice_id,
                'identifier': invoice.identifier,
                'status': invoice.status,
                'type': invoice.type,
                'subject_id': invoice.subject_id,
                'patient_summary': patient_summary,
                'recipient_id': invoice.recipient_id,
                'invoice_datetime': invoice.invoice_datetime.isoformat() if invoice.invoice_datetime else None,
                'participant_role': invoice.participant_role,
                'participant_actor_id': invoice.participant_actor_id,
                'issuer_id': invoice.issuer_id,
                'account_id': invoice.account_id,
                'total_net_value': float(invoice.total_net_value) if invoice.total_net_value else None,
                'total_net_currency': invoice.total_net_currency,
                'total_gross_value': float(invoice.total_gross_value) if invoice.total_gross_value else None,
                'total_gross_currency': invoice.total_gross_currency,
                'payment_terms': invoice.payment_terms,
                'note': invoice.note,
                'line_items': line_items,
                'total_price_components': total_price_components,
                'created_at': invoice.created_at.isoformat() if hasattr(invoice, 'created_at') else None,
                'updated_at': invoice.updated_at.isoformat() if hasattr(invoice, 'updated_at') else None,
            }
        except Invoice.DoesNotExist:
            return None
    
    @staticmethod
    def get_patient_invoices(patient_id: int) -> List[Dict]:
        """
        Get all invoices for a specific patient (summary list).
        
        Args:
            patient_id: Primary key of the patient
            
        Returns:
            List of invoice summary dictionaries
        """
        invoices = Invoice.objects.filter(
            subject_id=patient_id
        ).order_by('-created_at')
        
        invoice_list = []
        for invoice in invoices:
            invoice_list.append({
                'invoice_id': invoice.invoice_id,
                'identifier': invoice.identifier,
                'status': invoice.status,
                'type': invoice.type,
                'invoice_datetime': invoice.invoice_datetime.isoformat() if invoice.invoice_datetime else None,
                'total_gross_value': float(invoice.total_gross_value) if invoice.total_gross_value else None,
                'total_gross_currency': invoice.total_gross_currency,
                'total_net_value': float(invoice.total_net_value) if invoice.total_net_value else None,
                'total_net_currency': invoice.total_net_currency,
                'account_id': invoice.account_id,
                'created_at': invoice.created_at.isoformat() if hasattr(invoice, 'created_at') else None,
            })
        
        return invoice_list


# ============================================================================
# CLAIM ACL (Insurance Claims - Read Only)
# ============================================================================

class ClaimACL:
    """
    Fortress Pattern: Read-Only Access Control Layer for Claim Data
    
    Provides external access to insurance claim information with deep DTOs.
    """
    
    @staticmethod
    def get_claim_details(claim_id: int) -> Optional[Dict]:
        """
        Get detailed claim information with items, diagnoses, and procedures.
        Returns deep DTO with enriched patient data.
        
        Args:
            claim_id: Primary key of the claim
            
        Returns:
            Dictionary with claim details (Claim -> Items + Diagnoses + Procedures), or None if not found
        """
        try:
            claim = Claim.objects.prefetch_related(
                'items',
                'diagnoses',
                'procedures',
                'care_team',
                'supporting_info'
            ).get(claim_id=claim_id)
            
            # Enrich with patient summary via ACL
            patient_summary = get_patient_summary(claim.patient_id)
            
            # Build claim items
            items = []
            for item in claim.items.all():
                items.append({
                    'id': item.id,
                    'sequence': item.sequence,
                    'productOrService': item.productOrService,
                    'quantity': float(item.quantity) if item.quantity else None,
                    'unitPrice': float(item.unitPrice) if item.unitPrice else None,
                    'net': item.net,
                    'servicedDate': item.servicedDate,
                    'locationCodeableConcept': item.locationCodeableConcept,
                })
            
            # Build diagnoses
            diagnoses = []
            for diag in claim.diagnoses.all():
                diagnoses.append({
                    'id': diag.id,
                    'sequence': diag.sequence,
                    'diagnosisCodeableConcept': diag.diagnosisCodeableConcept,
                    'diagnosisReference': diag.diagnosisReference,
                    'type': diag.type,
                    'onAdmission': diag.onAdmission,
                })
            
            # Build procedures
            procedures = []
            for proc in claim.procedures.all():
                procedures.append({
                    'id': proc.id,
                    'sequence': proc.sequence,
                    'type': proc.type,
                    'procedureCodeableConcept': proc.procedureCodeableConcept,
                    'procedureReference': proc.procedureReference,
                })
            
            # Build care team
            care_team = []
            for ct in claim.care_team.all():
                care_team.append({
                    'id': ct.id,
                    'sequence': ct.sequence,
                    'provider_id': ct.provider_id,
                    'responsible': ct.responsible,
                    'role': ct.role,
                    'qualification': ct.qualification,
                })
            
            # Build supporting info
            supporting_info = []
            for si in claim.supporting_info.all():
                supporting_info.append({
                    'id': si.id,
                    'sequence': si.sequence,
                    'category': si.category,
                    'code': si.code,
                    'value_string': si.value_string,
                })
            
            return {
                'claim_id': claim.claim_id,
                'identifier': claim.identifier,
                'status': claim.status,
                'type': claim.type,
                'subType': claim.subType,
                'use': claim.use,
                'patient_id': claim.patient_id,
                'patient_summary': patient_summary,
                'billablePeriod_start': claim.billablePeriod_start.isoformat() if claim.billablePeriod_start else None,
                'billablePeriod_end': claim.billablePeriod_end.isoformat() if claim.billablePeriod_end else None,
                'created': claim.created.isoformat() if claim.created else None,
                'insurer_id': claim.insurer_id,
                'provider_id': claim.provider_id,
                'priority': claim.priority,
                'payee_type': claim.payee_type,
                'payee_party_id': claim.payee_party_id,
                'total': claim.total,
                'items': items,
                'diagnoses': diagnoses,
                'procedures': procedures,
                'care_team': care_team,
                'supporting_info': supporting_info,
                'created_at': claim.created_at.isoformat() if hasattr(claim, 'created_at') else None,
                'updated_at': claim.updated_at.isoformat() if hasattr(claim, 'updated_at') else None,
            }
        except Claim.DoesNotExist:
            return None
    
    @staticmethod
    def get_patient_claims(patient_id: int) -> List[Dict]:
        """
        Get all claims for a specific patient (summary list).
        
        Args:
            patient_id: Primary key of the patient
            
        Returns:
            List of claim summary dictionaries
        """
        claims = Claim.objects.filter(
            patient_id=patient_id
        ).order_by('-created_at')
        
        claim_list = []
        for claim in claims:
            claim_list.append({
                'claim_id': claim.claim_id,
                'identifier': claim.identifier,
                'status': claim.status,
                'type': claim.type,
                'use': claim.use,
                'insurer_id': claim.insurer_id,
                'provider_id': claim.provider_id,
                'billablePeriod_start': claim.billablePeriod_start.isoformat() if claim.billablePeriod_start else None,
                'billablePeriod_end': claim.billablePeriod_end.isoformat() if claim.billablePeriod_end else None,
                'total': claim.total,
                'created_at': claim.created_at.isoformat() if hasattr(claim, 'created_at') else None,
            })
        
        return claim_list


# ============================================================================
# PAYMENT ACL (Payment Reconciliation - Read Only)
# ============================================================================

class PaymentACL:
    """
    Fortress Pattern: Read-Only Access Control Layer for Payment Reconciliation Data
    
    Provides external access to payment reconciliation information with deep DTOs.
    """
    
    @staticmethod
    def get_payment_details(payment_reconciliation_id: int) -> Optional[Dict]:
        """
        Get detailed payment reconciliation information with details.
        Returns deep DTO.
        
        Args:
            payment_reconciliation_id: Primary key of the payment reconciliation
            
        Returns:
            Dictionary with payment details (Payment -> Details), or None if not found
        """
        try:
            payment = PaymentReconciliation.objects.prefetch_related(
                'details'
            ).get(payment_reconciliation_id=payment_reconciliation_id)
            
            # Build payment details
            details = []
            total_amount = Decimal('0.00')
            
            for detail in payment.details.all():
                if detail.amount:
                    total_amount += detail.amount
                
                details.append({
                    'id': detail.id,
                    'identifier': detail.identifier,
                    'type': detail.type,
                    'request_id': detail.request_id,
                    'submitter_id': detail.submitter_id,
                    'response_id': detail.response_id,
                    'date': detail.date.isoformat() if detail.date else None,
                    'responsible_id': detail.responsible_id,
                    'payee_id': detail.payee_id,
                    'amount': float(detail.amount) if detail.amount else None,
                })
            
            return {
                'payment_reconciliation_id': payment.payment_reconciliation_id,
                'identifier': payment.identifier,
                'status': payment.status,
                'period_start': payment.period_start.isoformat() if payment.period_start else None,
                'period_end': payment.period_end.isoformat() if payment.period_end else None,
                'created_datetime': payment.created_datetime.isoformat() if payment.created_datetime else None,
                'paymentIssuer_id': payment.paymentIssuer_id,
                'request_id': payment.request_id,
                'requestor_id': payment.requestor_id,
                'outcome': payment.outcome,
                'disposition': payment.disposition,
                'paymentDate': payment.paymentDate.isoformat() if payment.paymentDate else None,
                'paymentAmount': float(payment.paymentAmount) if payment.paymentAmount else None,
                'paymentIdentifier': payment.paymentIdentifier,
                'details': details,
                'total_amount': float(total_amount),
                'created_at': payment.created_at.isoformat() if hasattr(payment, 'created_at') else None,
                'updated_at': payment.updated_at.isoformat() if hasattr(payment, 'updated_at') else None,
            }
        except PaymentReconciliation.DoesNotExist:
            return None
    
    @staticmethod
    def get_payments_by_period(period_start, period_end) -> List[Dict]:
        """
        Get all payment reconciliations within a period (summary list).
        
        Args:
            period_start: Start date of the period
            period_end: End date of the period
            
        Returns:
            List of payment reconciliation summary dictionaries
        """
        payments = PaymentReconciliation.objects.filter(
            period_start__gte=period_start,
            period_end__lte=period_end
        ).order_by('-created_at')
        
        payment_list = []
        for payment in payments:
            payment_list.append({
                'payment_reconciliation_id': payment.payment_reconciliation_id,
                'identifier': payment.identifier,
                'status': payment.status,
                'paymentDate': payment.paymentDate.isoformat() if payment.paymentDate else None,
                'paymentAmount': float(payment.paymentAmount) if payment.paymentAmount else None,
                'paymentIssuer_id': payment.paymentIssuer_id,
                'outcome': payment.outcome,
                'created_at': payment.created_at.isoformat() if hasattr(payment, 'created_at') else None,
            })
        
        return payment_list

