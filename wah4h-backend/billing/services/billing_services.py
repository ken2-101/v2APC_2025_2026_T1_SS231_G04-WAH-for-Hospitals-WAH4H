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

import uuid
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
    Claim,
    ClaimItem,
    ClaimDiagnosis,
    ClaimProcedure,
    ClaimCareTeam,
    ClaimSupportingInfo,
    PaymentReconciliation,
    PaymentReconciliationDetail,
)

# FORTRESS PATTERN: Import ACLs from external apps (NOT direct models)
from admission.services.admission_acl import EncounterACL
from patients.services.patient_acl import get_patient_summary
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
        
        if not EncounterACL.validate_encounter_exists(encounter_id):
            raise ValidationError(
                f"Encounter with id={encounter_id} does not exist"
            )
        
        encounter_data = EncounterACL.get_encounter_details(encounter_id)
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
            identifier=f"INV-{uuid.uuid4().hex[:8].upper()}",
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


# ============================================================================
# ACCOUNT SERVICE (Explicit Creation)
# ============================================================================

class AccountService:
    """
    Service for managing Account resources (Explicit Creation).
    Handles validation and creation of billing accounts for patients.
    """
    
    @staticmethod
    @transaction.atomic
    def create_account(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new billing account.
        
        Args:
            data: Dictionary containing account data
                Required:
                    - subject_id (int): Patient ID
                Optional:
                    - type (str)
                    - name (str)
                    - status (str): Default 'active'
                    - identifier (str)
                    - servicePeriod_start (date)
                    - servicePeriod_end (date)
                    - description (str)
                    - owner_id (int): Practitioner or Organization ID
                    - guarantor_party_id (int)
                    - guarantor_onHold (str)
                    - guarantor_period_start (date)
                    - guarantor_period_end (date)
        
        Returns:
            Dictionary with created account details
            
        Raises:
            ValidationError: If validation fails
        """
        from billing.models import Account
        
        # Validate required fields
        subject_id = data.get('subject_id')
        if not subject_id:
            raise ValidationError("subject_id is required")
        
        # Fortress Pattern: Validate patient exists via ACL
        from patients.services.patient_acl import validate_patient_exists
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id {subject_id} does not exist")
        
        # Validate owner if provided (could be Practitioner or Organization)
        owner_id = data.get('owner_id')
        if owner_id:
            # Check if it's an organization
            if not OrganizationACL.validate_organization_exists(owner_id):
                pass  # Could also be practitioner - graceful validation
        
        # Create account
        account = Account.objects.create(
            identifier=data.get('identifier', ''),
            status=data.get('status', 'active'),
            type=data.get('type', ''),
            name=data.get('name', ''),
            subject_id=subject_id,
            servicePeriod_start=data.get('servicePeriod_start'),
            servicePeriod_end=data.get('servicePeriod_end'),
            coverage_reference_id=data.get('coverage_reference_id'),
            coverage_priority=data.get('coverage_priority', ''),
            owner_id=owner_id,
            description=data.get('description', ''),
            guarantor_party_id=data.get('guarantor_party_id'),
            guarantor_onHold=data.get('guarantor_onHold', ''),
            guarantor_period_start=data.get('guarantor_period_start'),
            guarantor_period_end=data.get('guarantor_period_end'),
            partOf_id=data.get('partOf_id')
        )
        
        # Return DTO
        return {
            'account_id': account.account_id,
            'identifier': account.identifier,
            'status': account.status,
            'type': account.type,
            'name': account.name,
            'subject_id': account.subject_id,
            'servicePeriod_start': account.servicePeriod_start.isoformat() if account.servicePeriod_start else None,
            'servicePeriod_end': account.servicePeriod_end.isoformat() if account.servicePeriod_end else None,
            'owner_id': account.owner_id,
            'description': account.description,
            'created_at': account.created_at.isoformat() if hasattr(account, 'created_at') else None,
        }


# ============================================================================
# INVOICE SERVICE (Explicit Creation - Manual Line Items)
# ============================================================================

class InvoiceService:
    """
    Service for managing Invoice resources with explicit line item creation.
    Handles validation and creation of invoices with manually specified line items.
    """
    
    @staticmethod
    @transaction.atomic
    def create_invoice(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new invoice with line items and price components.
        
        This is for EXPLICIT creation where the user manually specifies all line items,
        not for automated generation from encounters.
        
        Args:
            data: Dictionary containing invoice data
                Required:
                    - subject_id (int): Patient ID
                Optional:
                    - identifier (str)
                    - status (str): Default 'draft'
                    - type (str)
                    - account_id (int): Account ID
                    - date (datetime)
                    - recipient_id (int)
                    - participant_role (str)
                    - participant_actor_id (int)
                    - issuer_id (int)
                    - totalNet (str): JSON string with amount/currency
                    - totalGross (str): JSON string with amount/currency
                    - paymentTerms (str)
                    - note (str)
                    - line_items (list): List of line item dictionaries
                        - sequence (str)
                        - chargeItemCodeableConcept (str)
                        - chargeItemReference (str)
                        - priceComponents (list): List of price component dicts
                            - type (str)
                            - code (str)
                            - factor (str)
                            - amount (str): JSON with amount/currency
                    - total_price_components (list): List of total price component dicts
                        - type (str)
                        - code (str)
                        - factor (str)
                        - amount (str): JSON with amount/currency
        
        Returns:
            Dictionary with created invoice details (deep DTO)
            
        Raises:
            ValidationError: If validation fails
        """
        from billing.models import Account
        
        # Validate required fields
        subject_id = data.get('subject_id')
        if not subject_id:
            raise ValidationError("subject_id is required")
        
        # Fortress Pattern: Validate patient exists via ACL
        from patients.services.patient_acl import validate_patient_exists
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id {subject_id} does not exist")
        
        # Validate account if provided
        account_id = data.get('account_id')
        if account_id:
            try:
                account = Account.objects.get(account_id=account_id)
                # Verify account belongs to same patient
                if account.subject_id != subject_id:
                    raise ValidationError(
                        f"Account {account_id} does not belong to patient {subject_id}"
                    )
            except Account.DoesNotExist:
                raise ValidationError(f"Account with id {account_id} does not exist")
        
        # Validate issuer if provided
        issuer_id = data.get('issuer_id')
        if issuer_id:
            if not OrganizationACL.validate_organization_exists(issuer_id):
                raise ValidationError(f"Organization with id {issuer_id} does not exist")
        
        # Create invoice
        invoice = Invoice.objects.create(
            identifier=data.get('identifier') or f"INV-{uuid.uuid4().hex[:8].upper()}",
            status=data.get('status', 'draft'),
            type=data.get('type', ''),
            subject_id=subject_id,
            recipient_id=data.get('recipient_id'),
            invoice_datetime=data.get('invoice_datetime'),
            participant_role=data.get('participant_role', ''),
            participant_actor_id=data.get('participant_actor_id'),
            issuer_id=issuer_id,
            account_id=account_id,
            total_net_value=data.get('total_net_value'),
            total_net_currency=data.get('total_net_currency', 'PHP'),
            total_gross_value=data.get('total_gross_value'),
            total_gross_currency=data.get('total_gross_currency', 'PHP'),
            payment_terms=data.get('payment_terms', ''),
            note=data.get('note', '')
        )
        
        # Create line items with nested price components
        line_items = data.get('line_items', [])
        created_line_items = []
        
        for line_item_data in line_items:
            line_item = InvoiceLineItem.objects.create(
                invoice=invoice,
                sequence=line_item_data.get('sequence', ''),
                chargeitem_code=line_item_data.get('chargeitem_code', ''),
                chargeitem_reference_id=line_item_data.get('chargeitem_reference_id')
            )
            
            # Create price components for this line item
            price_components_data = line_item_data.get('priceComponents', [])
            created_price_components = []
            
            for pc_data in price_components_data:
                price_component = InvoiceLineItemPriceComponent.objects.create(
                    line_item=line_item,
                    type=pc_data.get('type', ''),
                    code=pc_data.get('code', ''),
                    factor=pc_data.get('factor'),
                    amount_value=pc_data.get('amount_value'),
                    amount_currency=pc_data.get('amount_currency', 'PHP')
                )
                created_price_components.append({
                    'id': price_component.id,
                    'type': price_component.type,
                    'code': price_component.code,
                    'factor': float(price_component.factor) if price_component.factor else None,
                    'amount_value': float(price_component.amount_value) if price_component.amount_value else None,
                    'amount_currency': price_component.amount_currency,
                })
            
            created_line_items.append({
                'id': line_item.id,
                'sequence': line_item.sequence,
                'chargeitem_code': line_item.chargeitem_code,
                'chargeitem_reference_id': line_item.chargeitem_reference_id,
                'priceComponents': created_price_components
            })
        
        # Update line items count on invoice
        invoice.line_items_count = len(created_line_items)
        invoice.save()
        
        # Create total price components
        total_price_components_data = data.get('total_price_components', [])
        created_total_price_components = []
        
        for tpc_data in total_price_components_data:
            total_price_component = InvoiceTotalPriceComponent.objects.create(
                invoice=invoice,
                type=tpc_data.get('type', ''),
                code=tpc_data.get('code', ''),
                factor=tpc_data.get('factor'),
                amount_value=tpc_data.get('amount_value'),
                amount_currency=tpc_data.get('amount_currency', 'PHP')
            )
            created_total_price_components.append({
                'id': total_price_component.id,
                'type': total_price_component.type,
                'code': total_price_component.code,
                'factor': float(total_price_component.factor) if total_price_component.factor else None,
                'amount_value': float(total_price_component.amount_value) if total_price_component.amount_value else None,
                'amount_currency': total_price_component.amount_currency,
            })
        
        # Return deep DTO
        return {
            'invoice_id': invoice.invoice_id,
            'identifier': invoice.identifier,
            'status': invoice.status,
            'type': invoice.type,
            'subject_id': invoice.subject_id,
            'recipient_id': invoice.recipient_id,
            'invoice_datetime': invoice.invoice_datetime.isoformat() if invoice.invoice_datetime else None,
            'issuer_id': invoice.issuer_id,
            'account_id': invoice.account_id,
            'total_net_value': float(invoice.total_net_value) if invoice.total_net_value else None,
            'total_net_currency': invoice.total_net_currency,
            'total_gross_value': float(invoice.total_gross_value) if invoice.total_gross_value else None,
            'total_gross_currency': invoice.total_gross_currency,
            'payment_terms': invoice.payment_terms,
            'note': invoice.note,
            'line_items_count': invoice.line_items_count,
            'line_items': created_line_items,
            'total_price_components': created_total_price_components,
            'created_at': invoice.created_at.isoformat() if hasattr(invoice, 'created_at') else None,
        }


# ============================================================================
# CLAIM SERVICE (Explicit Creation - Insurance Claims)
# ============================================================================

class ClaimService:
    """
    Service for managing Claim resources (Insurance Claims).
    Handles validation and creation of claims with nested items, diagnoses, and procedures.
    """
    
    @staticmethod
    @transaction.atomic
    def submit_claim(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submit a new insurance claim.
        
        Args:
            data: Dictionary containing claim data
                Required:
                    - patient_id (int): Patient ID
                    - insurer_id (int): Insurer Organization ID
                Optional:
                    - identifier (str)
                    - status (str): Default 'active'
                    - type (str)
                    - use (str)
                    - provider_id (int)
                    - priority (str)
                    - billablePeriod_start (date)
                    - billablePeriod_end (date)
                    - created (datetime): FHIR creation datetime
                    - items (list): List of claim item dictionaries
                    - diagnoses (list): List of diagnosis dictionaries
                    - procedures (list): List of procedure dictionaries
                    - care_team (list): List of care team dictionaries
                    - supporting_info (list): List of supporting info dictionaries
        
        Returns:
            Dictionary with created claim details (deep DTO)
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        patient_id = data.get('patient_id')
        if not patient_id:
            raise ValidationError("patient_id is required")
        
        insurer_id = data.get('insurer_id')
        if not insurer_id:
            raise ValidationError("insurer_id is required")
        
        # Fortress Pattern: Validate patient exists via ACL
        from patients.services.patient_acl import validate_patient_exists
        if not validate_patient_exists(patient_id):
            raise ValidationError(f"Patient with id {patient_id} does not exist")
        
        # Fortress Pattern: Validate insurer organization exists via ACL
        if not OrganizationACL.validate_organization_exists(insurer_id):
            raise ValidationError(f"Insurer organization with id {insurer_id} does not exist")
        
        # Validate provider if provided
        provider_id = data.get('provider_id')
        if provider_id:
            if not OrganizationACL.validate_organization_exists(provider_id):
                raise ValidationError(f"Provider organization with id {provider_id} does not exist")
        
        # Create claim header
        claim = Claim.objects.create(
            identifier=data.get('identifier') or f"CLM-{uuid.uuid4().hex[:8].upper()}",
            status=data.get('status', 'active'),
            type=data.get('type', ''),
            subType=data.get('subType', ''),
            use=data.get('use', ''),
            patient_id=patient_id,
            billablePeriod_start=data.get('billablePeriod_start'),
            billablePeriod_end=data.get('billablePeriod_end'),
            created=data.get('created'),
            enterer_id=data.get('enterer_id'),
            insurer_id=insurer_id,
            provider_id=provider_id,
            priority=data.get('priority', ''),
            facility_id=data.get('facility_id'),
            prescription_id=data.get('prescription_id'),
            originalPrescription_id=data.get('originalPrescription_id'),
            payee_type=data.get('payee_type', ''),
            payee_party_id=data.get('payee_party_id'),
            referral_id=data.get('referral_id'),
            total=data.get('total', '')
        )
        
        # Create claim items
        items_data = data.get('items', [])
        created_items = []
        
        for item_data in items_data:
            item = ClaimItem.objects.create(
                claim=claim,
                sequence=item_data.get('sequence', ''),
                careTeamSequence=item_data.get('careTeamSequence', ''),
                diagnosisSequence=item_data.get('diagnosisSequence', ''),
                procedureSequence=item_data.get('procedureSequence', ''),
                informationSequence=item_data.get('informationSequence', ''),
                revenue=item_data.get('revenue', ''),
                category=item_data.get('category', ''),
                productOrService=item_data.get('productOrService', ''),
                modifier=item_data.get('modifier', ''),
                programCode=item_data.get('programCode', ''),
                servicedDate=item_data.get('servicedDate', ''),
                servicedPeriod_start=item_data.get('servicedPeriod_start'),
                servicedPeriod_end=item_data.get('servicedPeriod_end'),
                locationCodeableConcept=item_data.get('locationCodeableConcept', ''),
                locationAddress=item_data.get('locationAddress', ''),
                locationReference=item_data.get('locationReference', ''),
                quantity=item_data.get('quantity'),
                unitPrice=item_data.get('unitPrice'),
                factor=item_data.get('factor', ''),
                net=item_data.get('net', ''),
                bodySite=item_data.get('bodySite', ''),
                subSite=item_data.get('subSite', ''),
                udi=item_data.get('udi', '')
            )
            created_items.append({
                'id': item.id,
                'sequence': item.sequence,
                'productOrService': item.productOrService,
                'quantity': float(item.quantity) if item.quantity else None,
                'unitPrice': float(item.unitPrice) if item.unitPrice else None,
            })
        
        # Create diagnoses
        diagnoses_data = data.get('diagnoses', [])
        created_diagnoses = []
        
        for diag_data in diagnoses_data:
            diagnosis = ClaimDiagnosis.objects.create(
                claim=claim,
                sequence=diag_data.get('sequence', ''),
                diagnosisCodeableConcept=diag_data.get('diagnosisCodeableConcept', ''),
                diagnosisReference=diag_data.get('diagnosisReference', ''),
                type=diag_data.get('type', ''),
                onAdmission=diag_data.get('onAdmission', ''),
                packageCode=diag_data.get('packageCode', '')
            )
            created_diagnoses.append({
                'id': diagnosis.id,
                'sequence': diagnosis.sequence,
                'diagnosisCodeableConcept': diagnosis.diagnosisCodeableConcept,
                'type': diagnosis.type,
            })
        
        # Create procedures
        procedures_data = data.get('procedures', [])
        created_procedures = []
        
        for proc_data in procedures_data:
            procedure = ClaimProcedure.objects.create(
                claim=claim,
                sequence=proc_data.get('sequence', ''),
                type=proc_data.get('type', ''),
                procedureCodeableConcept=proc_data.get('procedureCodeableConcept', ''),
                procedureReference=proc_data.get('procedureReference', ''),
                udi=proc_data.get('udi', '')
            )
            created_procedures.append({
                'id': procedure.id,
                'sequence': procedure.sequence,
                'procedureCodeableConcept': procedure.procedureCodeableConcept,
                'type': procedure.type,
            })
        
        # Create care team (optional)
        care_team_data = data.get('care_team', [])
        created_care_team = []
        
        for ct_data in care_team_data:
            care_team = ClaimCareTeam.objects.create(
                claim=claim,
                sequence=ct_data.get('sequence', ''),
                provider_id=ct_data.get('provider_id'),
                responsible=ct_data.get('responsible', ''),
                role=ct_data.get('role', ''),
                qualification=ct_data.get('qualification', '')
            )
            created_care_team.append({
                'id': care_team.id,
                'sequence': care_team.sequence,
                'provider_id': care_team.provider_id,
                'role': care_team.role,
            })
        
        # Create supporting info (optional)
        supporting_info_data = data.get('supporting_info', [])
        created_supporting_info = []
        
        for si_data in supporting_info_data:
            supporting_info = ClaimSupportingInfo.objects.create(
                claim=claim,
                sequence=si_data.get('sequence', ''),
                category=si_data.get('category', ''),
                code=si_data.get('code', ''),
                timing_date=si_data.get('timing_date'),
                timing_period_start=si_data.get('timing_period_start'),
                timing_period_end=si_data.get('timing_period_end'),
                value_boolean=si_data.get('value_boolean'),
                value_string=si_data.get('value_string', ''),
                value_quantity=si_data.get('value_quantity'),
                value_attachment=si_data.get('value_attachment', ''),
                value_reference=si_data.get('value_reference', ''),
                reason=si_data.get('reason', '')
            )
            created_supporting_info.append({
                'id': supporting_info.id,
                'sequence': supporting_info.sequence,
                'category': supporting_info.category,
            })
        
        # Return deep DTO
        return {
            'claim_id': claim.claim_id,
            'identifier': claim.identifier,
            'status': claim.status,
            'type': claim.type,
            'use': claim.use,
            'patient_id': claim.patient_id,
            'insurer_id': claim.insurer_id,
            'provider_id': claim.provider_id,
            'priority': claim.priority,
            'billablePeriod_start': claim.billablePeriod_start.isoformat() if claim.billablePeriod_start else None,
            'billablePeriod_end': claim.billablePeriod_end.isoformat() if claim.billablePeriod_end else None,
            'created': claim.created.isoformat() if claim.created else None,
            'items': created_items,
            'diagnoses': created_diagnoses,
            'procedures': created_procedures,
            'care_team': created_care_team,
            'supporting_info': created_supporting_info,
            'created_at': claim.created_at.isoformat() if hasattr(claim, 'created_at') else None,
        }


# ============================================================================
# PAYMENT SERVICE (Payment Reconciliation)
# ============================================================================

class PaymentService:
    """
    Service for managing PaymentReconciliation resources.
    Handles validation and creation of payment reconciliations with details.
    """
    
    @staticmethod
    @transaction.atomic
    def record_payment(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Record a payment reconciliation.
        
        Args:
            data: Dictionary containing payment data
                Optional:
                    - identifier (str)
                    - status (str): Default 'active'
                    - period_start (date)
                    - period_end (date)
                    - created_datetime (datetime)
                    - paymentIssuer_id (int): Organization ID
                    - request_id (int)
                    - requestor_id (int)
                    - outcome (str)
                    - disposition (str)
                    - paymentDate (date)
                    - paymentAmount (decimal)
                    - paymentIdentifier (str)
                    - details (list): List of payment detail dictionaries
                    - update_invoice_status (bool): If True, update related invoice status
        
        Returns:
            Dictionary with created payment reconciliation details (deep DTO)
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate payment issuer if provided
        payment_issuer_id = data.get('paymentIssuer_id')
        if payment_issuer_id:
            if not OrganizationACL.validate_organization_exists(payment_issuer_id):
                raise ValidationError(f"Payment issuer organization with id {payment_issuer_id} does not exist")
        
        # Create payment reconciliation header
        payment = PaymentReconciliation.objects.create(
            identifier=data.get('identifier') or f"PAY-{uuid.uuid4().hex[:8].upper()}",
            status=data.get('status', 'active'),
            period_start=data.get('period_start'),
            period_end=data.get('period_end'),
            created_datetime=data.get('created_datetime'),
            payment_issuer_id=payment_issuer_id,
            request_task_id=data.get('request_id'),
            requestor_id=data.get('requestor_id'),
            outcome=data.get('outcome', ''),
            disposition=data.get('disposition', ''),
            payment_date=data.get('paymentDate'), # Keep input key as paymentDate if needed but model is payment_date
            payment_amount_value=data.get('paymentAmount'),
            payment_amount_currency='PHP',
            payment_identifier=data.get('paymentIdentifier', '')
        )
        
        # Create payment details
        details_data = data.get('details', [])
        created_details = []
        total_payment = Decimal('0.00')
        
        for detail_data in details_data:
            detail = PaymentReconciliationDetail.objects.create(
                payment_reconciliation=payment,
                identifier=detail_data.get('identifier', ''),
                predecessor_identifier=detail_data.get('predecessor_identifier', ''),
                type=detail_data.get('type', ''),
                request_id=detail_data.get('request_id'),
                submitter_id=detail_data.get('submitter_id'),
                response_id=detail_data.get('response_id'),
                date=detail_data.get('date'),
                responsible_id=detail_data.get('responsible_id'),
                payee_id=detail_data.get('payee_id'),
                amount_value=detail_data.get('amount'),
                amount_currency='PHP'
            )
            
            if detail.amount_value:
                total_payment += detail.amount_value
            
            created_details.append({
                'id': detail.id,
                'type': detail.type,
                'amount': float(detail.amount_value) if detail.amount_value else None,
                'request_id': detail.request_id,
            })
            
        # If no details provided, use header amount for balancing logic
        if not created_details and payment.payment_amount_value:
             total_payment = payment.payment_amount_value
        
        # Optional: Update invoice status if payment covers total
        update_invoice = data.get('update_invoice_status', False)
        invoice_id = data.get('invoice_id')
        
        if update_invoice and invoice_id:
            try:
                invoice = Invoice.objects.get(invoice_id=invoice_id)
                # Check if payment covers the gross value
                # Use total_payment which is either sum of details OR header amount
                if invoice.total_gross_value is not None and total_payment >= invoice.total_gross_value:
                    invoice.status = 'balanced'
                    invoice.save()
            except Invoice.DoesNotExist:
                pass  # Gracefully handle missing invoice
        
        # Return deep DTO
        return {
            'payment_reconciliation_id': payment.payment_reconciliation_id,
            'identifier': payment.identifier,
            'status': payment.status,
            'period_start': payment.period_start.isoformat() if payment.period_start else None,
            'period_end': payment.period_end.isoformat() if payment.period_end else None,
            'created_datetime': payment.created_datetime.isoformat() if payment.created_datetime else None,
            'paymentIssuer_id': payment.payment_issuer_id,
            'outcome': payment.outcome,
            'disposition': payment.disposition,
            'paymentDate': payment.payment_date.isoformat() if payment.payment_date else None,
            'paymentAmount': float(payment.payment_amount_value) if payment.payment_amount_value else None,
            'paymentIdentifier': payment.payment_identifier,
            'details': created_details,
            'total_payment': float(total_payment),
            'created_at': payment.created_at.isoformat() if hasattr(payment, 'created_at') else None,
        }


__all__ = [
    'InvoiceOrchestrator',
    'BillingService',  # Backward compatibility
    'AccountService',   # Explicit Account creation
    'InvoiceService',   # Explicit Invoice creation
    'ClaimService',     # Insurance Claims
    'PaymentService',   # Payment Reconciliation
]
