from rest_framework import serializers
from .models import DischargeRecord, DischargeRequirements
from patients.serializers import PatientSerializer
from admissions.serializers import AdmissionSerializer


class DischargeRequirementsSerializer(serializers.ModelSerializer):
    """
    Serializer for discharge requirements checklist.
    Based on frontend DischargeRequirements interface.
    """
    is_ready = serializers.SerializerMethodField()
    
    class Meta:
        model = DischargeRequirements
        fields = [
            'id',
            'admission',
            'final_diagnosis',
            'physician_signature',
            'medication_reconciliation',
            'discharge_summary',
            'billing_clearance',
            'nursing_notes',
            'follow_up_scheduled',
            'is_ready',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_ready(self, obj):
        return obj.is_ready_for_discharge()


class DischargeRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for discharge records.
    Based on frontend DischargedPatient interface.
    """
    patient_details = PatientSerializer(source='patient', read_only=True)
    admission_details = AdmissionSerializer(source='admission', read_only=True)
    requirements = DischargeRequirementsSerializer(
        source='admission.discharge_requirements',
        read_only=True
    )
    
    class Meta:
        model = DischargeRecord
        fields = [
            'id',
            'patient',
            'patient_details',
            'admission',
            'admission_details',
            'patient_name',
            'room',
            'admission_date',
            'discharge_date',
            'condition',
            'physician',
            'department',
            'age',
            'final_diagnosis',
            'discharge_summary',
            'follow_up_required',
            'follow_up_plan',
            'status',
            'requirements',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
