"""
discharge/api/serializers.py

CQRS-Lite Serializers for the Discharge Module.

Separation of Concerns:
- Input Serializers: Command validation (Write operations)
- Output Serializers: Query DTOs (Read operations)

Architecture Pattern: Fortress Pattern - API Layer
- Input serializers enforce strict validation
- Output serializers convert service layer DTOs to JSON
- No direct model exposure to external consumers

Context: Philippine LGU Hospital System
"""

from rest_framework import serializers
from datetime import datetime


# ============================================================================
# PROCEDURE SERIALIZERS (CQRS-Lite)
# ============================================================================

class ProcedurePerformerInputSerializer(serializers.Serializer):
    """Input serializer for nested procedure performers (Write)"""
    performer_actor_id = serializers.IntegerField(required=True, help_text="Practitioner ID")
    performer_on_behalf_of_id = serializers.IntegerField(required=False, allow_null=True, help_text="Organization ID")
    performer_function_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    performer_function_display = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ProcedureInputSerializer(serializers.Serializer):
    """Input serializer for recording procedures (Write)"""
    # Required fields
    subject_id = serializers.IntegerField(required=True, help_text="Patient ID")
    encounter_id = serializers.IntegerField(required=True, help_text="Encounter ID")
    status = serializers.ChoiceField(
        choices=['preparation', 'in-progress', 'not-done', 'on-hold', 'stopped', 'completed', 'entered-in-error', 'unknown'],
        required=True
    )
    code_code = serializers.CharField(max_length=100, required=True, help_text="Procedure code (e.g., ICD-10-PCS)")
    code_display = serializers.CharField(max_length=255, required=True, help_text="Procedure name")
    
    # Optional fields
    identifier = serializers.CharField(max_length=255, required=False, allow_blank=True)
    category_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    category_display = serializers.CharField(max_length=100, required=False, allow_blank=True)
    body_site_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    body_site_display = serializers.CharField(max_length=100, required=False, allow_blank=True)
    performed_datetime = serializers.DateTimeField(required=False, allow_null=True)
    performed_period_start = serializers.DateField(required=False, allow_null=True)
    performed_period_end = serializers.DateField(required=False, allow_null=True)
    outcome_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    outcome_display = serializers.CharField(max_length=100, required=False, allow_blank=True)
    reason_code_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    reason_code_display = serializers.CharField(max_length=100, required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    asserter_id = serializers.IntegerField(required=False, allow_null=True, help_text="Practitioner who asserted")
    performer_actor_id = serializers.IntegerField(required=False, allow_null=True, help_text="Primary performer ID")
    performer_function_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    performer_function_display = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Nested performers
    performers = ProcedurePerformerInputSerializer(many=True, required=False, allow_null=True)
    
    def validate(self, data):
        """Custom validation logic"""
        # Ensure at least one timing field is provided
        timing_fields = ['performed_datetime', 'performed_period_start', 'performed_period_end']
        if not any(data.get(field) for field in timing_fields):
            # Auto-set to current datetime if not provided
            data['performed_datetime'] = datetime.now()
        
        return data


class ProcedurePerformerOutputSerializer(serializers.Serializer):
    """Output serializer for procedure performers (Read)"""
    procedure_performer_id = serializers.IntegerField()
    performer_actor_id = serializers.IntegerField(allow_null=True)
    performer_on_behalf_of_id = serializers.IntegerField(allow_null=True)
    performer_function_code = serializers.CharField()
    performer_function_display = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class ProcedureOutputSerializer(serializers.Serializer):
    """Output serializer for procedure details (Read) - Deep DTO"""
    procedure_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    encounter_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    code_code = serializers.CharField()
    code_display = serializers.CharField()
    category_code = serializers.CharField()
    category_display = serializers.CharField()
    body_site_code = serializers.CharField()
    body_site_display = serializers.CharField()
    outcome_code = serializers.CharField()
    outcome_display = serializers.CharField()
    reason_code_code = serializers.CharField()
    reason_code_display = serializers.CharField()
    performed_datetime = serializers.CharField(allow_null=True)
    performed_period_start = serializers.CharField(allow_null=True)
    performed_period_end = serializers.CharField(allow_null=True)
    note = serializers.CharField()
    performers = ProcedurePerformerOutputSerializer(many=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class ProcedureSummaryOutputSerializer(serializers.Serializer):
    """Lightweight output serializer for procedure lists (Read)"""
    procedure_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    code_code = serializers.CharField()
    code_display = serializers.CharField()
    performed_datetime = serializers.CharField(allow_null=True)
    outcome_code = serializers.CharField()
    outcome_display = serializers.CharField()


# ============================================================================
# DISCHARGE SERIALIZERS (CQRS-Lite)
# ============================================================================

class DischargeInputSerializer(serializers.Serializer):
    """Input serializer for initiating discharge (Write)"""
    # Required fields
    encounter_id = serializers.IntegerField(required=True, help_text="Encounter ID")
    patient_id = serializers.IntegerField(required=True, help_text="Patient ID")
    
    # Optional fields
    physician_id = serializers.IntegerField(required=False, allow_null=True, help_text="Discharging physician ID")
    notice_datetime = serializers.DateTimeField(required=False, allow_null=True)
    summary_of_stay = serializers.CharField(required=False, allow_blank=True)
    discharge_instructions = serializers.CharField(required=False, allow_blank=True)
    follow_up_plan = serializers.CharField(max_length=255, required=False, allow_blank=True)
    pending_items = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate(self, data):
        """Custom validation logic"""
        # Auto-set notice_datetime to current time if not provided
        if not data.get('notice_datetime'):
            data['notice_datetime'] = datetime.now()
        
        return data


class DischargeUpdateSerializer(serializers.Serializer):
    """Input serializer for updating discharge details (Write)"""
    summary_of_stay = serializers.CharField(required=False, allow_blank=True)
    discharge_instructions = serializers.CharField(required=False, allow_blank=True)
    follow_up_plan = serializers.CharField(max_length=255, required=False, allow_blank=True)
    pending_items = serializers.CharField(required=False, allow_blank=True)
    physician_id = serializers.IntegerField(required=False, allow_null=True, help_text="Discharging physician ID")


class DischargeFinalizeSerializer(serializers.Serializer):
    """Input serializer for finalizing discharge (Write)"""
    finalized_by = serializers.CharField(max_length=255, required=False, allow_blank=True)


class DischargeOutputSerializer(serializers.Serializer):
    """Output serializer for full discharge summary (Read)"""
    discharge_id = serializers.IntegerField()
    encounter_id = serializers.IntegerField()
    patient_id = serializers.IntegerField()
    physician_id = serializers.IntegerField(allow_null=True)
    discharge_datetime = serializers.CharField(allow_null=True)
    notice_datetime = serializers.CharField(allow_null=True)
    billing_cleared_datetime = serializers.CharField(allow_null=True)
    workflow_status = serializers.CharField()
    created_by = serializers.CharField()
    summary_of_stay = serializers.CharField()
    discharge_instructions = serializers.CharField()
    pending_items = serializers.CharField()
    follow_up_plan = serializers.CharField()
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class DischargeSummaryOutputSerializer(serializers.Serializer):
    """Lightweight output serializer for discharge lists (Read)"""
    discharge_id = serializers.IntegerField()
    encounter_id = serializers.IntegerField()
    patient_id = serializers.IntegerField()
    discharge_datetime = serializers.CharField(allow_null=True)
    workflow_status = serializers.CharField()
    follow_up_plan = serializers.CharField()
