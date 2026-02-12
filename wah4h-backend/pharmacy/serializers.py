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

from patients.models import Patient
from accounts.models import Practitioner

class MedicationRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    practitioner_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicationRequest
        fields = '__all__'

    def get_patient_name(self, obj):
        if not obj.subject_id:
            return "Unknown"
        patient = Patient.objects.filter(id=obj.subject_id).first()
        if patient:
            return f"{patient.first_name} {patient.last_name}".strip()
        return "Unknown"

    def get_practitioner_name(self, obj):
        if not obj.requester_id:
            return "Unknown"
        practitioner = Practitioner.objects.filter(practitioner_id=obj.requester_id).first()
        if practitioner:
            return f"{practitioner.first_name} {practitioner.last_name}".strip()
        return "Unknown"

class MedicationAdministrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationAdministration
        fields = '__all__'