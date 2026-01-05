from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import BillingRecord, MedicineItem, DiagnosticItem, Payment
from .serializers import (
    BillingRecordSerializer,
    BillingDashboardSerializer,
    MedicineItemSerializer,
    DiagnosticItemSerializer,
    PaymentSerializer
)


class BillingRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing billing records
    """
    queryset = BillingRecord.objects.all().prefetch_related(
        'medicines', 'diagnostics', 'payments'
    ).select_related('patient', 'admission')
    serializer_class = BillingRecordSerializer
    
    def get_serializer_class(self):
        if self.action == 'dashboard':
            return BillingDashboardSerializer
        return BillingRecordSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get billing records for dashboard view
        Returns simplified data for the billing dashboard
        """
        queryset = self.get_queryset()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status', None)
        if status_filter:
            if status_filter.lower() == 'pending':
                queryset = [br for br in queryset if br.payment_status == 'Pending']
            elif status_filter.lower() == 'partial':
                queryset = [br for br in queryset if br.payment_status == 'Partial']
            elif status_filter.lower() == 'paid':
                queryset = [br for br in queryset if br.payment_status == 'Paid']
        
        serializer = BillingDashboardSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """
        Finalize a billing record
        Once finalized, the bill cannot be edited
        """
        billing_record = self.get_object()
        
        if billing_record.is_finalized:
            return Response(
                {'error': 'Billing record is already finalized'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        billing_record.is_finalized = True
        billing_record.finalized_date = timezone.now()
        billing_record.save()
        
        serializer = self.get_serializer(billing_record)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """
        Add a payment to a billing record
        Allows overpayments - change will be calculated by frontend
        """
        billing_record = self.get_object()
        
        serializer = PaymentSerializer(data=request.data)
        if serializer.is_valid():
            amount = serializer.validated_data.get('amount')
            
            # Save payment (allow overpayment)
            serializer.save(billing_record=billing_record)
            
            # Return updated billing record
            billing_serializer = BillingRecordSerializer(billing_record)
            return Response(billing_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """
        Get all payments for a billing record
        """
        billing_record = self.get_object()
        payments = billing_record.payments.all()
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """
        Get billing records by patient ID
        """
        patient_id = request.query_params.get('patient_id', None)
        if not patient_id:
            return Response(
                {'error': 'patient_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(patient_id=patient_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_admission(self, request):
        """
        Get billing record by admission ID
        """
        admission_id = request.query_params.get('admission_id', None)
        if not admission_id:
            return Response(
                {'error': 'admission_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(admission_id=admission_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MedicineItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing medicine items
    """
    queryset = MedicineItem.objects.all()
    serializer_class = MedicineItemSerializer


class DiagnosticItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing diagnostic items
    """
    queryset = DiagnosticItem.objects.all()
    serializer_class = DiagnosticItemSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payments
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    @action(detail=False, methods=['get'])
    def by_billing_record(self, request):
        """
        Get payments by billing record ID
        """
        billing_record_id = request.query_params.get('billing_record_id', None)
        if not billing_record_id:
            return Response(
                {'error': 'billing_record_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(billing_record_id=billing_record_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
