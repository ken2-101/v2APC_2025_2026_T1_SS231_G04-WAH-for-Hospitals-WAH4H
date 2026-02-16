from rest_framework import viewsets, status
from .models import Account, Claim, Invoice, PaymentReconciliation, PaymentNotice
from django.db.models import Sum
from .serializers import (
    AccountSerializer, 
    ClaimSerializer, 
    InvoiceSerializer, 
    PaymentReconciliationSerializer, 
    PaymentNoticeSerializer
)

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer

class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.all()
    serializer_class = ClaimSerializer

from rest_framework.decorators import action
from rest_framework.response import Response

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().prefetch_related(
        'line_items',
        'line_items__price_components'
    )
    serializer_class = InvoiceSerializer

    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        invoice = self.get_object()
        invoice.calculate_totals()
        return Response(self.get_serializer(invoice).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({"error": "subject_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        invoice = Invoice.objects.generate_from_pending_orders(subject_id)
        
        if invoice:
            return Response(self.get_serializer(invoice).data, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "No pending items to bill"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def patient_summary(self, request):
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response({"error": "subject_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Calculate Total Billed (Finalized/Draft Invoices)
        # Assuming we want all invoices regardless of status for now, or filter by 'issued'/'draft'
        billed_agg = Invoice.objects.filter(subject_id=subject_id).exclude(status='cancelled').aggregate(
            total=Sum('total_net_value')
        )
        billed_total = billed_agg['total'] or 0
        
        # 2. Calculate Unbilled (Pending Lab + Pharmacy)
        unbilled_totals = Invoice.objects.get_pending_totals(subject_id)
        
        return Response({
            "subject_id": subject_id,
            "billed_total": billed_total,
            "unbilled_lab_total": unbilled_totals['lab_total'],
            "unbilled_pharmacy_total": unbilled_totals['pharmacy_total'],
            "unbilled_total": unbilled_totals['grand_total'],
            "grand_total": billed_total + unbilled_totals['grand_total']
        })

class PaymentReconciliationViewSet(viewsets.ModelViewSet):
    queryset = PaymentReconciliation.objects.all()
    serializer_class = PaymentReconciliationSerializer

class PaymentNoticeViewSet(viewsets.ModelViewSet):
    queryset = PaymentNotice.objects.all()
    serializer_class = PaymentNoticeSerializer