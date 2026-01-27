from rest_framework import serializers
from .models import Account, Claim, Invoice, PaymentReconciliation, PaymentNotice

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'

class ClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

class PaymentReconciliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReconciliation
        fields = '__all__'

class PaymentNoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentNotice
        fields = '__all__'