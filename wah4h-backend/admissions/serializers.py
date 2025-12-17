from rest_framework import serializers
from .models import Admission
from patients.serializers import PatientSerializer  # Nested serializer for patient_details

class AdmissionSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = Admission
        fields = [
            "id",
            "admission_id",
            "patient",
            "patient_details",
            "admission_date",
            "encounter_type",
            "admitting_diagnosis",
            "reason_for_admission",
            "ward",
            "room",
            "bed",
            "attending_physician",
            "assigned_nurse",
            "admission_category",
            "mode_of_arrival",
            "status",
            "created_at",
            "updated_at",
        ]
