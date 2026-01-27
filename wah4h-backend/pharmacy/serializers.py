from rest_framework import serializers
from .models import Inventory, Medication, MedicationRequest, MedicationAdministration

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'

class MedicationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationRequest
        fields = '__all__'

class MedicationAdministrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationAdministration
        fields = '__all__'