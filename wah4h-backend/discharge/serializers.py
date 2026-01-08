from rest_framework import serializers
from .models import DischargeRecord
from patients.models import Patient
from admissions.models import Admission
from billing.models import BillingRecord


class DischargeRequirementsSerializer(serializers.Serializer):
    finalDiagnosis = serializers.BooleanField(source='final_diagnosis')
    physicianSignature = serializers.BooleanField(source='physician_signature')
    medicationReconciliation = serializers.BooleanField(source='medication_reconciliation')
    dischargeSummary = serializers.BooleanField(source='discharge_summary')
    billingClearance = serializers.BooleanField(source='billing_clearance')
    nursingNotes = serializers.BooleanField(source='nursing_notes')
    followUpScheduled = serializers.BooleanField(source='follow_up_scheduled')


class BillingPatientSerializer(serializers.ModelSerializer):
    """Serializer for billing records eligible for discharge"""
    billing_id = serializers.IntegerField(source='id', read_only=True)
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    admission_id = serializers.IntegerField(source='admission.id', read_only=True, allow_null=True)
    patient_name = serializers.CharField(read_only=True)
    hospital_id = serializers.CharField(read_only=True)
    room = serializers.CharField(source='room_ward', read_only=True)
    admission_date = serializers.DateField(read_only=True)
    discharge_date = serializers.DateField(read_only=True, allow_null=True)
    attending_physician = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_finalized = serializers.BooleanField(read_only=True)
    finalized_date = serializers.DateTimeField(read_only=True, allow_null=True)
    
    class Meta:
        model = BillingRecord
        fields = [
            'billing_id', 'patient_id', 'admission_id', 'patient_name',
            'hospital_id', 'room', 'admission_date', 'discharge_date',
            'attending_physician', 'department', 'age', 'condition',
            'total_amount', 'is_finalized', 'finalized_date'
        ]
    
    def get_attending_physician(self, obj):
        return obj.admission.attending_physician if obj.admission else 'N/A'
    
    def get_department(self, obj):
        return obj.admission.ward if obj.admission else 'N/A'
    
    def get_age(self, obj):
        if obj.patient and obj.patient.date_of_birth:
            from django.utils import timezone
            today = timezone.now().date()
            dob = obj.patient.date_of_birth
            age = today.year - dob.year
            if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
                age -= 1
            return age
        return 0
    
    def get_condition(self, obj):
        return obj.admission.admitting_diagnosis if obj.admission else 'N/A'


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