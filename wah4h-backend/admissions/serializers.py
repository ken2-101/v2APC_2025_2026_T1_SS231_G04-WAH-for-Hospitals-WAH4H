from rest_framework import serializers
from .models import Admission
from patients.serializers import PatientSerializer


class AdmissionSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source="patient", read_only=True)

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

        read_only_fields = [
            "id",
            "admission_id",
            "status",
            "created_at",
            "updated_at",
            "patient_details",
        ]

    # ✅ BLOCK MULTIPLE ACTIVE ADMISSIONS
    def validate_patient(self, patient):
        if Admission.objects.filter(
            patient=patient,
            status="Active"
        ).exists():
            raise serializers.ValidationError(
                "This patient already has an active admission."
            )
        return patient

    # ✅ FORCE DEFAULTS ON CREATE
    def create(self, validated_data):
        validated_data.setdefault("status", "Active")
        validated_data.setdefault("encounter_type", "Inpatient")
        return super().create(validated_data)
