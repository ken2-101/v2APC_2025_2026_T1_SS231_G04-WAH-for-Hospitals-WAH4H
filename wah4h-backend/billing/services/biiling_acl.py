from decimal import Decimal
from typing import Dict, List, Optional
from django.db.models import Sum, Q
from billing.models import Invoice, InvoiceLineItem, Account


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
