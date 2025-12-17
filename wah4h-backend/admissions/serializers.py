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

        # 🔒 IMMUTABLE AFTER CREATION
        read_only_fields = [
            "id",
            "admission_id",
            "patient",
            "admission_date",
            "encounter_type",
            "created_at",
            "updated_at",
            "patient_details",
        ]

    # ✅ BLOCK MULTIPLE ACTIVE ADMISSIONS (CREATE ONLY / EXCLUDE SELF ON UPDATE)
    def validate_patient(self, patient):
        qs = Admission.objects.filter(
            patient=patient,
            status="Active"
        )

        # 🚑 IMPORTANT: exclude self during update
        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                "This patient already has an active admission."
            )

        return patient

    # ✅ FORCE DEFAULTS ON CREATE ONLY
    def create(self, validated_data):
        validated_data.setdefault("status", "Active")
        validated_data.setdefault("encounter_type", "Inpatient")
        return super().create(validated_data)
