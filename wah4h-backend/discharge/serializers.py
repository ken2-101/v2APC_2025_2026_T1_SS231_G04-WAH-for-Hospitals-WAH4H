from rest_framework import serializers
from .models import Discharge

class DischargeSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for Discharge records.
    Uses context-based data map for O(1) lookup of external identifiers (Fortress Pattern).
    """
    # Enrichment fields (Read-Only)
    patient_name = serializers.SerializerMethodField()
    physician_name = serializers.SerializerMethodField()
    encounter_identifier = serializers.SerializerMethodField()

    class Meta:
        model = Discharge
        fields = [
            'discharge_id', 'encounter_id', 'patient_id', 'physician_id',
            'discharge_datetime', 'notice_datetime', 'billing_cleared_datetime',
            'workflow_status', 'created_by', 'summary_of_stay',
            'discharge_instructions', 'pending_items', 'follow_up_plan',
            'patient_name', 'physician_name', 'encounter_identifier',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['discharge_id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        data_map = self.context.get('data_map', {})
        return data_map.get('patients', {}).get(obj.patient_id, f"Patient {obj.patient_id}")

    def get_physician_name(self, obj):
        if not obj.physician_id:
            return None
        data_map = self.context.get('data_map', {})
        return data_map.get('practitioners', {}).get(obj.physician_id, f"Physician {obj.physician_id}")

    def get_encounter_identifier(self, obj):
        data_map = self.context.get('data_map', {})
        return data_map.get('encounters', {}).get(obj.encounter_id, f"ENC-{obj.encounter_id}")