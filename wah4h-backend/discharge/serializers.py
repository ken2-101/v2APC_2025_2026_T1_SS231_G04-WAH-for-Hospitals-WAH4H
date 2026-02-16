from rest_framework import serializers
from .models import Discharge
from datetime import date, datetime

class DischargeSerializer(serializers.ModelSerializer):
    # Field Aliases for Frontend Compatibility
    patient = serializers.IntegerField(source='patient_id', read_only=True)
    admission = serializers.IntegerField(source='encounter_id', read_only=True)
    
    # Enriched Fields
    patientName = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    admissionDate = serializers.SerializerMethodField()
    physician = serializers.SerializerMethodField()
    status = serializers.CharField(source='workflow_status', read_only=True)
    estimatedDischarge = serializers.SerializerMethodField()
    
    # Discharged Patient fields
    finalDiagnosis = serializers.SerializerMethodField()
    dischargeSummary = serializers.CharField(source='summary_of_stay', read_only=True)
    followUpRequired = serializers.SerializerMethodField()
    followUpPlan = serializers.CharField(source='follow_up_plan', read_only=True)
    dischargeDate = serializers.SerializerMethodField()

    requirements = serializers.SerializerMethodField()
    
    class Meta:
        model = Discharge
        fields = '__all__'
        extra_kwargs = {
            'discharge_datetime': {'required': False},
            'workflow_status': {'required': False},
        }

    def get_patientName(self, obj):
        if hasattr(obj, 'patient_obj') and obj.patient_obj:
            return f"{obj.patient_obj.first_name} {obj.patient_obj.last_name}"
        return "Unknown Patient"

    def get_room(self, obj):
        if hasattr(obj, 'encounter_obj') and obj.encounter_obj:
             if hasattr(obj.encounter_obj, 'location_obj') and obj.encounter_obj.location_obj:
                 return obj.encounter_obj.location_obj.name
             return "Unassigned"
        return "Unassigned"

    def get_age(self, obj):
        if hasattr(obj, 'patient_obj') and obj.patient_obj and obj.patient_obj.birthdate:
            today = date.today()
            born = obj.patient_obj.birthdate
            return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        return 0

    def get_condition(self, obj):
        if hasattr(obj, 'encounter_obj') and obj.encounter_obj:
             return obj.encounter_obj.reason_code or "Under Observation"
        return "Stable"

    def get_department(self, obj):
        if hasattr(obj, 'encounter_obj') and obj.encounter_obj:
             return obj.encounter_obj.service_type or "General"
        return "General"

    def get_admissionDate(self, obj):
        if hasattr(obj, 'encounter_obj') and obj.encounter_obj and obj.encounter_obj.period_start:
             return obj.encounter_obj.period_start.isoformat()
        return datetime.now().date().isoformat()

    def get_physician(self, obj):
        if hasattr(obj, 'encounter_obj') and obj.encounter_obj:
            if hasattr(obj.encounter_obj, 'practitioner_obj') and obj.encounter_obj.practitioner_obj:
                p = obj.encounter_obj.practitioner_obj
                return f"Dr. {p.first_name} {p.last_name}"
        return "Dr. On-Duty" 

    def get_estimatedDischarge(self, obj):
        if obj.notice_datetime:
            return obj.notice_datetime.isoformat()
        if hasattr(obj, 'encounter_obj') and obj.encounter_obj and obj.encounter_obj.period_end:
            return obj.encounter_obj.period_end.isoformat()
        return (datetime.now().date()).isoformat()

    def get_requirements(self, obj):
        return {
            "finalDiagnosis": bool(obj.summary_of_stay),
            "physicianSignature": True, 
            "medicationReconciliation": bool(obj.discharge_instructions),
            "dischargeSummary": bool(obj.summary_of_stay),
            "billingClearance": bool(obj.billing_cleared_datetime),
            "nursingNotes": True, 
            "followUpScheduled": bool(obj.follow_up_plan),
        }

    def get_finalDiagnosis(self, obj):
        if obj.summary_of_stay and "Diagnosis:" in obj.summary_of_stay:
            try:
                return obj.summary_of_stay.split("Diagnosis:")[1].split("\n")[0].strip()
            except:
                pass
        return "Pending Diagnosis"

    def get_dischargeDate(self, obj):
        if obj.discharge_datetime:
            return obj.discharge_datetime.isoformat()
        return None

    def get_followUpRequired(self, obj):
        return bool(obj.follow_up_plan)