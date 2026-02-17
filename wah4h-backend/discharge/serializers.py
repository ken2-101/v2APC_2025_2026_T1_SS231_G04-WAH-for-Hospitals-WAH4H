from rest_framework import serializers
from .models import Discharge
from patients.models import Patient
from admission.models import Encounter
from accounts.models import Practitioner


class DischargeSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for Discharge records.
    Uses direct database queries for enrichment (simple and maintainable for MVP).
    """
    # Map backend fields to frontend expectations
    id = serializers.IntegerField(source='discharge_id', read_only=True)
    patient = serializers.IntegerField(source='patient_id', read_only=True)
    status = serializers.CharField(source='workflow_status')
    
    # Enriched fields
    patient_name = serializers.SerializerMethodField()
    physician_name = serializers.SerializerMethodField()
    encounter_identifier = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    admission_date = serializers.SerializerMethodField()
    requirements = serializers.SerializerMethodField()

    class Meta:
        model = Discharge
        fields = [
            'id', 'discharge_id', 'encounter_id', 'patient', 'patient_id', 'physician_id',
            'discharge_datetime', 'notice_datetime', 'billing_cleared_datetime',
            'status', 'workflow_status', 'created_by', 'summary_of_stay',
            'discharge_instructions', 'pending_items', 'follow_up_plan',
            'patient_name', 'physician_name', 'encounter_identifier',
            'room', 'age', 'department', 'condition', 'admission_date', 'requirements',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['discharge_id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        try:
            patient = Patient.objects.get(id=obj.patient_id)
            return f"{patient.first_name or ''} {patient.last_name or ''}".strip() or "Unknown Patient"
        except Patient.DoesNotExist:
            return "Unknown Patient"

    def get_physician_name(self, obj):
        if not obj.physician_id:
            return "Not Assigned"
        try:
            physician = Practitioner.objects.get(practitioner_id=obj.physician_id)
            return f"{physician.first_name or ''} {physician.last_name or ''}".strip() or "Not Assigned"
        except Practitioner.DoesNotExist:
            return "Not Assigned"

    def get_encounter_identifier(self, obj):
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            return encounter.identifier or f"ENC-{obj.encounter_id}"
        except Encounter.DoesNotExist:
            return f"ENC-{obj.encounter_id}"

    def get_room(self, obj):
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            # Encounter has location_id but not location_display
            # For MVP, return location_id or N/A
            return f"Room {encounter.location_id}" if encounter.location_id else "N/A"
        except Encounter.DoesNotExist:
            return "N/A"

    def get_age(self, obj):
        try:
            patient = Patient.objects.get(id=obj.patient_id)
            if patient.birthdate:
                return patient.age
            return 0
        except (Patient.DoesNotExist, AttributeError):
            return 0

    def get_department(self, obj):
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            # Encounter has service_type but not service_type_display
            return encounter.service_type or "General"
        except Encounter.DoesNotExist:
            return "General"

    def get_condition(self, obj):
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            # Encounter has reason_code but not reason_display
            return encounter.reason_code or "N/A"
        except Encounter.DoesNotExist:
            return "N/A"

    def get_admission_date(self, obj):
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            return str(encounter.period_start) if encounter.period_start else ""
        except Encounter.DoesNotExist:
            return ""

    def get_requirements(self, obj):
        # Try to parse requirements from pending_items (JSON field)
        if obj.pending_items:
            try:
                import json
                stored_requirements = json.loads(obj.pending_items)
                # Merge with defaults to ensure all keys exist
                default_requirements = {
                    'finalDiagnosis': bool(obj.summary_of_stay),
                    'physicianSignature': bool(obj.physician_id),
                    'medicationReconciliation': False,
                    'dischargeSummary': bool(obj.discharge_instructions),
                    'billingClearance': bool(obj.billing_cleared_datetime),
                    'nursingNotes': False,
                    'followUpScheduled': bool(obj.follow_up_plan)
                }
                default_requirements.update(stored_requirements)
                return default_requirements
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Fallback to automatic detection
        return {
            'finalDiagnosis': bool(obj.summary_of_stay),
            'physicianSignature': bool(obj.physician_id),
            'medicationReconciliation': False,
            'dischargeSummary': bool(obj.discharge_instructions),
            'billingClearance': bool(obj.billing_cleared_datetime),
            'nursingNotes': False,
            'followUpScheduled': bool(obj.follow_up_plan)
        }