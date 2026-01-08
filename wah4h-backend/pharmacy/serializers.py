from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import InventoryItem, MedicationRequest, DispenseLog


class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for inventory items with computed status fields."""
    
    is_expired = serializers.ReadOnlyField()
    is_expiring_soon = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    status_indicators = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "generic_name",
            "brand_name",
            "description",
            "quantity",
            "minimum_stock_level",
            "unit_price",
            "expiry_date",
            "batch_number",
            "manufacturer",
            "is_active",
            "is_expired",
            "is_expiring_soon",
            "is_low_stock",
            "is_out_of_stock",
            "status_indicators",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_status_indicators(self, obj):
        """Get all status indicators for the UI."""
        indicators = []
        if obj.is_expired:
            indicators.append({"type": "expired", "message": "Expired", "severity": "critical"})
        elif obj.is_expiring_soon:
            days_until_expiry = (obj.expiry_date - timezone.now().date()).days
            indicators.append({
                "type": "expiring_soon",
                "message": f"Expires in {days_until_expiry} days",
                "severity": "warning"
            })
        
        if obj.is_out_of_stock:
            indicators.append({"type": "out_of_stock", "message": "Out of stock", "severity": "critical"})
        elif obj.is_low_stock:
            indicators.append({
                "type": "low_stock",
                "message": f"Low stock ({obj.quantity} remaining)",
                "severity": "warning"
            })
        
        return indicators

    def validate_expiry_date(self, value):
        """Ensure expiry date is not in the past."""
        if value < timezone.now().date():
            raise serializers.ValidationError("Expiry date cannot be in the past")
        return value

    def validate_quantity(self, value):
        """Ensure quantity is not negative."""
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        return value

    def validate_unit_price(self, value):
        """Ensure unit price is not negative."""
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative")
        return value

class MedicationRequestSerializer(serializers.ModelSerializer):
    """Serializer for medication requests with nested inventory details."""
    
    inventory_item_detail = InventoryItemSerializer(
        source="inventory_item",
        read_only=True
    )
    admission_info = serializers.SerializerMethodField()

    class Meta:
        model = MedicationRequest
        fields = [
            "id",
            "admission",
            "admission_info",
            "inventory_item",
            "inventory_item_detail",
            "quantity",
            "status",
            "notes",
            "requested_by",
            "approved_by",
            "requested_at",
            "updated_at",
        ]
        read_only_fields = ["requested_at", "updated_at"]

    def get_admission_info(self, obj):
        """Get basic admission information."""
        return {
            "id": obj.admission.id,
            "patient_name": f"{obj.admission.patient.first_name} {obj.admission.patient.last_name}",
            "admission_date": obj.admission.admission_date,
        }

    def validate_quantity(self, value):
        """Ensure quantity is positive."""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero")
        return value

    def validate(self, data):
        """Validate that sufficient stock is available."""
        if 'inventory_item' in data and 'quantity' in data:
            inventory_item = data['inventory_item']
            if inventory_item.quantity < data['quantity']:
                raise serializers.ValidationError({
                    'quantity': f'Insufficient stock. Only {inventory_item.quantity} units available.'
                })
            if inventory_item.is_expired:
                raise serializers.ValidationError({
                    'inventory_item': 'Cannot request expired medication.'
                })
            if not inventory_item.is_active:
                raise serializers.ValidationError({
                    'inventory_item': 'This medication is currently inactive.'
                })
        return data


class DispenseLogSerializer(serializers.ModelSerializer):
    """Serializer for dispense logs."""
    
    medication_request_detail = MedicationRequestSerializer(
        source="medication_request",
        read_only=True
    )

    class Meta:
        model = DispenseLog
        fields = [
            "id",
            "medication_request",
            "medication_request_detail",
            "dispensed_by",
            "dispensed_at",
            "notes",
        ]
        read_only_fields = ["dispensed_at"]
