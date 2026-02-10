"""
Billing Serializers
===================
Trinity Architecture: Direct Model Access with Fat Serializers

Direct ORM queries - NO service layers.
"""

from rest_framework import serializers
from billing.models import Account, Invoice, Claim, PaymentReconciliation, PaymentNotice


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'


class ClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = '__all__'


class PaymentReconciliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReconciliation
        fields = '__all__'


class PaymentNoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentNotice
        fields = '__all__'
