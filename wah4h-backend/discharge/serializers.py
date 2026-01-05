from rest_framework import serializers
from .models import DischargeRecord
from patients.models import Patient
from admissions.models import Admission


class DischargeRequirementsSerializer(serializers.Serializer):
    finalDiagnosis = serializers.BooleanField(source='final_diagnosis')
    physicianSignature = serializers.BooleanField(source='physician_signature')
    medicationReconciliation = serializers.BooleanField(source='medication_reconciliation')
    dischargeSummary = serializers.BooleanField(source='discharge_summary')
    billingClearance = serializers.BooleanField(source='billing_clearance')
    nursingNotes = serializers.BooleanField(source='nursing_notes')
    followUpScheduled = serializers.BooleanField(source='follow_up_scheduled')


class DischargeRecordSerializer(serializers.ModelSerializer):
    requirements = DischargeRequirementsSerializer(source='*', read_only=True)
    patientName = serializers.CharField(source='patient_name')
    admissionDate = serializers.DateField(source='admission_date')
    estimatedDischarge = serializers.DateField(source='estimated_discharge', allow_null=True, required=False)
    dischargeDate = serializers.DateTimeField(source='discharge_date', allow_null=True, required=False)
    finalDiagnosis = serializers.CharField(source='final_diagnosis_text', allow_blank=True, required=False)
    dischargeSummary = serializers.CharField(source='discharge_summary_text', allow_blank=True, required=False)
    followUpRequired = serializers.BooleanField(source='follow_up_required', required=False)
    followUpPlan = serializers.CharField(source='follow_up_plan', allow_blank=True, required=False)
    
    class Meta:
        model = DischargeRecord
        fields = [
            'id', 'patient', 'admission', 'patientName', 'room', 'admissionDate',
            'condition', 'status', 'physician', 'department', 'age',
            'estimatedDischarge', 'requirements', 'dischargeDate', 'finalDiagnosis',
            'dischargeSummary', 'followUpRequired', 'followUpPlan', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'requirements']


class DischargeFormSerializer(serializers.Serializer):
    patientId = serializers.IntegerField(required=False)
    finalDiagnosis = serializers.CharField(required=False)
    hospitalStaySummary = serializers.CharField(required=False)
    dischargeMedications = serializers.CharField(required=False)
    dischargeInstructions = serializers.CharField(required=False)
    followUpPlan = serializers.CharField(allow_blank=True, required=False)
    billingStatus = serializers.CharField(required=False)
    pendingItems = serializers.CharField(allow_blank=True, required=False)