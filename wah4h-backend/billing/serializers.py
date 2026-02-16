from rest_framework import serializers
from billing.models import (
    Account, 
    Invoice, 
    InvoiceLineItem, 
    InvoiceLineItemPriceComponent, 
    Claim, 
    PaymentReconciliation, 
    PaymentNotice
)
from django.db import transaction


class InvoiceLineItemPriceComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItemPriceComponent
        fields = '__all__'
        read_only_fields = ['line_item']


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    price_components = InvoiceLineItemPriceComponentSerializer(many=True, required=False)

    class Meta:
        model = InvoiceLineItem
        fields = '__all__'
        read_only_fields = ['invoice']


class InvoiceSerializer(serializers.ModelSerializer):
    line_items = InvoiceLineItemSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = '__all__'
    
    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items', [])
        
        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)
            
            for item_data in line_items_data:
                price_components_data = item_data.pop('price_components', [])
                line_item = InvoiceLineItem.objects.create(invoice=invoice, **item_data)
                
                for component_data in price_components_data:
                    InvoiceLineItemPriceComponent.objects.create(line_item=line_item, **component_data)
            
            # Auto-calculate totals after creation
            invoice.calculate_totals()
            
        return invoice

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)
        
        with transaction.atomic():
            # Update Invoice fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Handle Line Items if provided
            if line_items_data is not None:
                # For simplicity in this iteration, we'll replace existing items
                # In a more complex scenario, we might want to update/add/delete specific items
                instance.line_items.all().delete()
                
                for item_data in line_items_data:
                    price_components_data = item_data.pop('price_components', [])
                    line_item = InvoiceLineItem.objects.create(invoice=instance, **item_data)
                    
                    for component_data in price_components_data:
                        InvoiceLineItemPriceComponent.objects.create(line_item=line_item, **component_data)
            
            # Recalculate totals
            instance.calculate_totals()
            
        return instance


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
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
