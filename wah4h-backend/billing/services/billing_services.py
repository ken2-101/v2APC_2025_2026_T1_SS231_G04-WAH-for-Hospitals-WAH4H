"""
billing/services/billing_services.py

Billing Orchestrator Service - Invoice Generation Engine
=========================================================

Purpose:
    Generates draft invoices by consuming data from independent clinical modules
    (Pharmacy, Laboratory, Admission) via their Read-Only ACLs.
    
    Bridge between Clinical Operations and Finance.

Architecture Pattern: Fortress Pattern (Read-Only ACL Consumer)
    - IMPORTS: Only from billing.models + external ACLs (NOT direct app models)
    - ORCHESTRATION: Calls EncounterService, LabCatalogACL, InventoryACL, MedicationRequestACL
    - TRANSACTIONS: Atomic invoice creation with line items and pricing components
    - RESILIENCE: Gracefully handles missing prices (defaults to 0.00)

External Dependencies (Read-Only ACLs):
    - admission.services.admission_acl (EncounterService, PatientACL)
    - pharmacy.services.pharmacy_acl (MedicationRequestACL, InventoryACL)
    - laboratory.services.laboratory_acl (LabReportACL, LabCatalogACL)
    - accounts.services.accounts_acl (OrganizationACL)

Context: Philippine LGU Hospital System
Author: Senior Python Backend Architect
Date: 2026-02-04
"""

from typing import Optional, Dict, Any, List
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

# FORTRESS PATTERN: Import ONLY from billing.models
from billing.models import (
    Invoice,
    InvoiceLineItem,
    InvoiceLineItemPriceComponent,
    InvoiceTotalPriceComponent,
)

# FORTRESS PATTERN: Import ACLs from external apps (NOT direct models)
from admission.services.admission_acl import EncounterService, PatientACL
from pharmacy.services.pharmacy_acl import MedicationRequestACL, InventoryACL
from laboratory.services.laboratory_acl import LabReportACL, LabCatalogACL
from accounts.services.accounts_acl import OrganizationACL


class InvoiceOrchestrator:
    """
    Orchestrator Service for Draft Invoice Generation.
    
    Coordinates data from multiple clinical modules to generate comprehensive
    billing invoices. All external data flows through Read-Only ACLs.
    
    Transaction Safety:
        - All invoice creation operations are wrapped in @transaction.atomic
        - If ANY step fails, entire invoice creation is rolled back
        - Partial price misses (returns None) are handled gracefully without rollback
    
    Pricing Strategy:
        - Pharmacy: Unit Cost (from InventoryACL) × Quantity (from MedicationRequestACL)
        - Laboratory: Test Price (from LabCatalogACL per test code)
        - Missing Prices: Default to Decimal('0.00') but log and continue
    """
    
    @staticmethod
    @transaction.atomic
    def generate_draft_invoice(
        encounter_id: int,
        issuer_id: int
    ) -> Invoice:
        """
        Generate a draft invoice for a specific encounter.
        
        Workflow:
            1. Validate encounter exists and retrieve patient information
            2. Create invoice header (status='draft')
            3. Fetch and process pharmacy items (medication requests)
            4. Fetch and process laboratory items (diagnostic reports)
            5. Calculate gross and net totals
            6. Create total price components
            7. Return complete invoice
        
        Args:
            encounter_id: The encounter ID to bill
            issuer_id: The organization ID issuing the invoice (typically hospital)
        
        Returns:
            Invoice: Created invoice object with status='draft'
        
        Raises:
            ValidationError: If encounter does not exist or other validation fails
        
        Note:
            - Missing line item prices default to 0.00 (graceful failure)
            - All calculations use Decimal for precision
            - Invoice status is 'draft' until explicitly transitioned
        """
        
        # ====================================================================
        # STEP 1: VALIDATE ENCOUNTER & RETRIEVE ENCOUNTER DATA
        # ====================================================================
        
        if not EncounterService.validate_encounter_exists(encounter_id):
            raise ValidationError(
                f"Encounter with id={encounter_id} does not exist"
            )
        
        encounter_data = EncounterService.get_encounter_with_patient(encounter_id)
        if not encounter_data:
            raise ValidationError(
                f"Failed to retrieve encounter data for id={encounter_id}"
            )
        
        patient_id = encounter_data.get('subject_id')
        
        # Validate issuer organization exists
        if not OrganizationACL.validate_organization_exists(issuer_id):
            raise ValidationError(
                f"Organization with id={issuer_id} does not exist"
            )
        
        # ====================================================================
        # STEP 2: CREATE INVOICE HEADER
        # ====================================================================
        
        invoice = Invoice.objects.create(
            status='draft',
            type='invoice',
            subject_id=patient_id,
            encounter_id=encounter_id,
            issuer_id=issuer_id,
            issued_datetime=timezone.now(),
            line_items_count=0,
            total_gross_value=Decimal('0.00'),
            total_net_value=Decimal('0.00'),
            currency='PHP',
        )
        
        # Track totals for final calculation
        total_gross = Decimal('0.00')
        line_item_count = 0
        
        # ====================================================================
        # STEP 3: PHARMACY LOOP - MEDICATION REQUESTS & INVENTORY PRICING
        # ====================================================================
        
        medication_requests = MedicationRequestACL.get_encounter_requests(
            encounter_id
        )
        
        for med_request in medication_requests:
            medication_request_id = med_request.get('medication_request_id')
            item_code = med_request.get('medication_code')
            quantity = med_request.get('quantity', 1)
            
            # Fetch pricing from pharmacy ACL
            pricing_data = InventoryACL.get_item_pricing(item_code)
            
            # Handle missing price gracefully (default to 0.00)
            if pricing_data is None:
                unit_cost = Decimal('0.00')
            else:
                unit_cost = pricing_data.get('unit_cost', Decimal('0.00'))
                # Ensure unit_cost is Decimal
                if not isinstance(unit_cost, Decimal):
                    unit_cost = Decimal(str(unit_cost))
            
            # Calculate line item amount
            line_amount = unit_cost * Decimal(str(quantity))
            total_gross += line_amount
            
            # Create line item for pharmacy
            line_item = InvoiceLineItem.objects.create(
                invoice=invoice,
                sequence=line_item_count + 1,
                type='pharmacy',
                code=item_code,
                description=med_request.get('medication_display', 'Medication'),
                quantity=Decimal(str(quantity)),
                unit_price=unit_cost,
                line_amount=line_amount,
                status='active',
            )
            
            # Create price component for line item
            InvoiceLineItemPriceComponent.objects.create(
                invoice_line_item=line_item,
                type='base_price',
                amount=line_amount,
            )
            
            line_item_count += 1
        
        # ====================================================================
        # STEP 4: LABORATORY LOOP - DIAGNOSTIC REPORTS & TEST PRICING
        # ====================================================================
        
        lab_reports = LabReportACL.get_patient_reports(
            patient_id=patient_id,
            encounter_id=encounter_id
        )
        
        for report in lab_reports:
            diagnostic_report_id = report.get('diagnostic_report_id')
            test_code = report.get('code_code')
            
            # Skip if test_code is missing
            if not test_code:
                continue
            
            # Fetch pricing from laboratory ACL
            test_price_data = LabCatalogACL.get_test_price(test_code)
            
            # Handle missing price gracefully (default to 0.00)
            if test_price_data is None:
                test_price = Decimal('0.00')
            else:
                test_price = test_price_data.get('base_price', Decimal('0.00'))
                # Ensure test_price is Decimal
                if not isinstance(test_price, Decimal):
                    test_price = Decimal(str(test_price))
            
            # Each lab report = 1 unit of the test
            quantity = 1
            line_amount = test_price * Decimal(str(quantity))
            total_gross += line_amount
            
            # Create line item for laboratory
            line_item = InvoiceLineItem.objects.create(
                invoice=invoice,
                sequence=line_item_count + 1,
                type='laboratory',
                code=test_code,
                description=report.get('code_display', 'Laboratory Test'),
                quantity=Decimal(str(quantity)),
                unit_price=test_price,
                line_amount=line_amount,
                status='active',
            )
            
            # Create price component for line item
            InvoiceLineItemPriceComponent.objects.create(
                invoice_line_item=line_item,
                type='base_price',
                amount=line_amount,
            )
            
            line_item_count += 1
        
        # ====================================================================
        # STEP 5: UPDATE INVOICE TOTALS & CREATE TOTAL PRICE COMPONENTS
        # ====================================================================
        
        # For now, net_value = gross_value (no taxes/discounts applied)
        total_net = total_gross
        
        # Update invoice with calculated totals
        invoice.total_gross_value = total_gross
        invoice.total_net_value = total_net
        invoice.line_items_count = line_item_count
        invoice.save()
        
        # Create total price components
        InvoiceTotalPriceComponent.objects.create(
            invoice=invoice,
            type='gross_amount',
            amount=total_gross,
        )
        
        InvoiceTotalPriceComponent.objects.create(
            invoice=invoice,
            type='net_amount',
            amount=total_net,
        )
        
        return invoice


# ============================================================================
# LEGACY NAMESPACE (Optional - for backward compatibility)
# ============================================================================

class BillingService:
    """
    Backward-compatibility alias for InvoiceOrchestrator.
    Use InvoiceOrchestrator directly for new code.
    """
    
    @staticmethod
    @transaction.atomic
    def generate_draft_invoice(
        encounter_id: int,
        issuer_id: int
    ) -> Invoice:
        """Delegates to InvoiceOrchestrator.generate_draft_invoice"""
        return InvoiceOrchestrator.generate_draft_invoice(encounter_id, issuer_id)


__all__ = [
    'InvoiceOrchestrator',
    'BillingService',  # Backward compatibility
]
