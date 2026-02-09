from rest_framework import viewsets
from .models import Account, Claim, Invoice, PaymentReconciliation, PaymentNotice
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

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

class PaymentReconciliationViewSet(viewsets.ModelViewSet):
    queryset = PaymentReconciliation.objects.all()
    serializer_class = PaymentReconciliationSerializer

class PaymentNoticeViewSet(viewsets.ModelViewSet):
    queryset = PaymentNotice.objects.all()
    serializer_class = PaymentNoticeSerializer