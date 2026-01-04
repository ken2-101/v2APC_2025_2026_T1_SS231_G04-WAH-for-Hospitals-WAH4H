from rest_framework import serializers
from .models import InventoryItem, MedicationRequest, DispenseLog


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"


class MedicationRequestSerializer(serializers.ModelSerializer):
    inventory_item_detail = InventoryItemSerializer(
        source="inventory_item",
        read_only=True
    )

    class Meta:
        model = MedicationRequest
        fields = [
            "id",
            "admission",
            "inventory_item",
            "inventory_item_detail",
            "quantity",
            "status",
            "notes",
            "requested_at",
            "updated_at",
        ]


class DispenseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispenseLog
        fields = "__all__"
