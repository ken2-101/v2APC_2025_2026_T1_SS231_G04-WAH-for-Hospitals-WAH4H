"""
Billing API Views - Hybrid ViewSets with CQRS-Lite
===================================================

Architecture:
- Read Operations: Delegate to ACL (billing_acl.py) - Returns DTOs
- Write Operations: Delegate to Services (billing_services.py) - Never calls .save()
- Serializers: CQRS-Lite pattern (Input/Output separation)
- Error Handling: Returns proper HTTP status codes

Context: Philippine LGU Hospital System - Billing Module
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError

# Import ACL for Read operations
from billing.services.biiling_acl import AccountACL, InvoiceACL, ClaimACL, PaymentACL

# Import Services for Write operations
from billing.services.billing_services import AccountService, InvoiceService, ClaimService, PaymentService

# Import Models for BFF Facade
from billing.models import Invoice, Account, InvoiceLineItem
from django.db.models import Sum, Q
from decimal import Decimal
from django.utils import timezone

# Import Serializers
from billing.api.serializers import (
    AccountInputSerializer,
    AccountOutputSerializer,
    InvoiceInputSerializer,
    InvoiceOutputSerializer,
    InvoiceListOutputSerializer,
    ClaimInputSerializer,
    ClaimOutputSerializer,
    PaymentInputSerializer,
    PaymentOutputSerializer,
    BillingRecordInputSerializer,
    BillingRecordOutputSerializer,
    BillingDashboardItemSerializer,
)


# ============================================================================
# ACCOUNT VIEWSET
# ============================================================================

class AccountViewSet(viewsets.ViewSet):
    """
    Hybrid ViewSet for Account management.
    
    Endpoints:
        - POST /accounts/ - Create new account
        - GET /accounts/{id}/ - Retrieve account details
    """
    
    def create(self, request):
        """
        Create a new billing account.
        
        Write Operation: Delegates to AccountService.create_account()
        """
        # Validate input
        serializer = AccountInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delegate to service (Write Layer)
            account_dto = AccountService.create_account(serializer.validated_data)
            
            # Serialize output
            output_serializer = AccountOutputSerializer(account_dto)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve account details.
        
        Read Operation: Delegates to AccountACL.get_account_details()
        """
        try:
            account_id = int(pk)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid account_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL (Read Layer)
        account_dto = AccountACL.get_account_details(account_id)
        
        if not account_dto:
            return Response(
                {'error': 'Account not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize output
        output_serializer = AccountOutputSerializer(account_dto)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )


# ============================================================================
# INVOICE VIEWSET
# ============================================================================

class InvoiceViewSet(viewsets.ViewSet):
    """
    Hybrid ViewSet for Invoice management.
    
    Endpoints:
        - POST /invoices/ - Create new invoice with line items
        - GET /invoices/{id}/ - Retrieve invoice details
        - GET /invoices/by_patient/{patient_id}/ - List patient invoices
    """
    
    def create(self, request):
        """
        Create a new invoice with line items and price components.
        
        Write Operation: Delegates to InvoiceService.create_invoice()
        """
        # Validate input
        serializer = InvoiceInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delegate to service (Write Layer)
            invoice_dto = InvoiceService.create_invoice(serializer.validated_data)
            
            # Serialize output
            output_serializer = InvoiceOutputSerializer(invoice_dto)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve invoice details with line items and components.
        
        Read Operation: Delegates to InvoiceACL.get_invoice_details()
        """
        try:
            invoice_id = int(pk)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid invoice_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL (Read Layer)
        invoice_dto = InvoiceACL.get_invoice_details(invoice_id)
        
        if not invoice_dto:
            return Response(
                {'error': 'Invoice not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize output
        output_serializer = InvoiceOutputSerializer(invoice_dto)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by_patient/(?P<patient_id>[0-9]+)')
    def by_patient(self, request, patient_id=None):
        """
        List all invoices for a specific patient.
        
        Read Operation: Delegates to InvoiceACL.get_patient_invoices()
        """
        try:
            patient_id = int(patient_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid patient_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL (Read Layer)
        invoices_list = InvoiceACL.get_patient_invoices(patient_id)
        
        # Serialize output
        output_serializer = InvoiceListOutputSerializer(invoices_list, many=True)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )


# ============================================================================
# CLAIM VIEWSET (Insurance Claims)
# ============================================================================

class ClaimViewSet(viewsets.ViewSet):
    """
    Hybrid ViewSet for Claim management (Insurance Claims).
    
    Endpoints:
        - POST /claims/ - Submit new insurance claim
        - GET /claims/{id}/ - Retrieve claim details
        - GET /claims/by_patient/{patient_id}/ - List patient claims
    """
    
    def create(self, request):
        """
        Submit a new insurance claim.
        
        Write Operation: Delegates to ClaimService.submit_claim()
        """
        # Validate input
        serializer = ClaimInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delegate to service (Write Layer)
            claim_dto = ClaimService.submit_claim(serializer.validated_data)
            
            # Serialize output
            output_serializer = ClaimOutputSerializer(claim_dto)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve claim details with items, diagnoses, and procedures.
        
        Read Operation: Delegates to ClaimACL.get_claim_details()
        """
        try:
            claim_id = int(pk)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid claim_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL (Read Layer)
        claim_dto = ClaimACL.get_claim_details(claim_id)
        
        if not claim_dto:
            return Response(
                {'error': 'Claim not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize output
        output_serializer = ClaimOutputSerializer(claim_dto)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='by_patient/(?P<patient_id>[0-9]+)')
    def by_patient(self, request, patient_id=None):
        """
        List all claims for a specific patient.
        
        Read Operation: Delegates to ClaimACL.get_patient_claims()
        """
        try:
            patient_id = int(patient_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid patient_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL (Read Layer)
        claims_list = ClaimACL.get_patient_claims(patient_id)
        
        # Return list directly (already serialized as DTOs)
        return Response(
            claims_list,
            status=status.HTTP_200_OK
        )


# ============================================================================
# PAYMENT RECONCILIATION VIEWSET
# ============================================================================

class PaymentReconciliationViewSet(viewsets.ViewSet):
    """
    Hybrid ViewSet for PaymentReconciliation management.
    
    Endpoints:
        - POST /payments/ - Record new payment reconciliation
        - GET /payments/{id}/ - Retrieve payment details
    """
    
    def create(self, request):
        """
        Record a new payment reconciliation.
        
        Write Operation: Delegates to PaymentService.record_payment()
        """
        # Validate input
        serializer = PaymentInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delegate to service (Write Layer)
            payment_dto = PaymentService.record_payment(serializer.validated_data)
            
            # Serialize output
            output_serializer = PaymentOutputSerializer(payment_dto)
            return Response(
                output_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Retrieve payment reconciliation details with line items.
        
        Read Operation: Delegates to PaymentACL.get_payment_details()
        """
        try:
            payment_reconciliation_id = int(pk)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid payment_reconciliation_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delegate to ACL (Read Layer)
        payment_dto = PaymentACL.get_payment_details(payment_reconciliation_id)
        
        if not payment_dto:
            return Response(
                {'error': 'Payment reconciliation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize output
        output_serializer = PaymentOutputSerializer(payment_dto)
        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK
        )


# ============================================================================
# BILLING RECORD VIEWSET (Frontend Facade / BFF)
# ============================================================================

class BillingRecordViewSet(viewsets.ViewSet):
    """
    Facade ViewSet for Frontend BillingRecord.
    Adapts legacy frontend structure to Invoice domain.
    """
    
    def list(self, request):
        """
        List all billing records (Invoices mapped to BillingRecord).
        """
        invoices = Invoice.objects.all().order_by('-created_at')
        data = []
        
        # Optimize: Prefetch line items
        invoices = invoices.prefetch_related('line_items')
        
        for invoice in invoices:
            # Basic mapping
            record = {
                'id': invoice.invoice_id,
                'patientId': invoice.subject_id,
                'hospitalId': str(invoice.invoice_id), # Mock hospital ID
                'is_finalized': invoice.status != 'draft',
                'finalized_date': invoice.invoice_datetime.isoformat() if invoice.invoice_datetime else None,
                'patientName': f"Patient {invoice.subject_id}", # Ideal: Fetch from PatientACL
                'admissionDate': invoice.created_at.date().isoformat() if invoice.created_at else None,
                'dischargeDate': None, # Not stored in invoice
                'roomWard': 'Generated',
                'roomType': 'Standard',
                'numberOfDays': 1,
                'ratePerDay': 0,
                'attendingPhysicianFee': 0,
                'specialistFee': 0,
                'surgeonFee': 0,
                'otherProfessionalFees': 0,
                'medicines': [],
                'diagnostics': [],
                'payments': [],
                'dietType': 'Regular',
                'mealsPerDay': 3,
                'dietDuration': 1,
                'costPerMeal': 0,
                'suppliesCharge': 0,
                'procedureCharge': 0,
                'nursingCharge': 0,
                'miscellaneousCharge': 0,
                'discount': 0,
                'philhealthCoverage': 0,
                'paymentStatus': 'Pending' if invoice.status == 'draft' else 'Paid' 
            }
            
            # Map line items
            for item in invoice.line_items.all():
                if item.type == 'pharmacy':
                    record['medicines'].append({
                        'id': item.id,
                        'name': item.description or item.code,
                        'quantity': int(item.quantity) if item.quantity else 1,
                        'unitPrice': float(item.unit_price) if item.unit_price else 0,
                        'dosage': ''
                    })
                elif item.type == 'laboratory':
                    record['diagnostics'].append({
                        'id': item.id,
                        'name': item.description or item.code,
                        'cost': float(item.unit_price) if item.unit_price else 0
                    })
                # Add more mappings as needed
                
            data.append(record)
            
        serializer = BillingRecordOutputSerializer(data, many=True)
        return Response(serializer.data)

    def create(self, request):
        """
        Create a new billing record (Invoice).
        """
        serializer = BillingRecordInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        try:
            # Construct Invoice Input DTO
            invoice_data = {
                'subject_id': data['patient'],
                'status': 'issued', # Assume finalized on create based on frontend behavior
                'invoice_datetime': timezone.now(),
                'type': 'invoice',
                'line_items': []
            }
            
            # Medicines
            meds = data.get('medicines', [])
            for i, med in enumerate(meds):
                invoice_data['line_items'].append({
                    'sequence': str(i+1),
                    'chargeitem_code': med.get('name'),
                    'priceComponents': [{
                        'type': 'base_price',
                        'amount_value': med.get('unitPrice'),
                        'amount_currency': 'PHP'
                    }]
                })
                
            # Diagnostics
            diags = data.get('diagnostics', [])
            for i, diag in enumerate(diags):
                 invoice_data['line_items'].append({
                    'sequence': str(len(invoice_data['line_items'])+1),
                    'chargeitem_code': diag.get('name'),
                     'priceComponents': [{
                        'type': 'base_price',
                        'amount_value': diag.get('cost'),
                        'amount_currency': 'PHP'
                    }]
                })
            
            # Delegate to Service
            result = InvoiceService.create_invoice(invoice_data)
            
            # Construct Response (using ID from result)
            response_data = data.copy()
            response_data['id'] = result['invoice_id']
            response_data['is_finalized'] = True
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard stats
        """
        # Mock dashboard data for now to fix 404
        data = []
        invoices = Invoice.objects.all()[:10]
        for inv in invoices:
            data.append({
                'id': inv.invoice_id,
                'patientName': f"Patient {inv.subject_id}",
                'encounterId': str(inv.encounter_id) if hasattr(inv, 'encounter_id') else 'N/A',
                'runningBalance': inv.total_gross_value or 0,
                'paymentStatus': 'Pending',
                'lastORDate': None,
                'room': 'N/A'
            })
        
        serializer = BillingDashboardItemSerializer(data, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put', 'patch'])
    def update_record(self, request, pk=None):
         # Mock update for now
         return Response({'status': 'updated'})
         
    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
         return Response({'status': 'finalized'})

