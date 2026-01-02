from rest_framework import serializers
from .models import Prescription, DispenseLog, InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='admission.patient_name', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'


class DispenseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispenseLog
        fields = '__all__'
