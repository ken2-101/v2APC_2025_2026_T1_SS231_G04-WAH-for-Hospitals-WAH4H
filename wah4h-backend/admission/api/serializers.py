"""
admission/api/serializers.py

CQRS-Lite Serializers for the Admission Module.
Strict separation between Input (Validation) and Output (DTO) serializers.

Architecture Pattern: Fortress Pattern - API Layer
- InputSerializers: Validation only, NO save() logic
- OutputSerializers: DTO serialization, read-only
- Write operations delegated to Service Layer (admission_services.py)

Context: Philippine LGU Hospital System
"""

from rest_framework import serializers
from admission.models import Encounter, Procedure


# ============================================================================
# ENCOUNTER SERIALIZERS
# ============================================================================

class EncounterInputSerializer(serializers.Serializer):
    """
    Input Serializer for Encounter creation/updates.
    Validation only - NO model binding or save() logic.
    """
    subject_id = serializers.IntegerField(required=True, help_text="Patient ID")
    class_field = serializers.CharField(
        max_length=100, 
        required=False, 
        default='inpatient',
        help_text="Encounter class: inpatient, outpatient, emergency"
    )
    type = serializers.CharField(max_length=100, required=False, allow_null=True)
    service_type = serializers.CharField(max_length=100, required=False, allow_null=True)
    priority = serializers.CharField(max_length=255, required=False, allow_null=True)
    reason_code = serializers.CharField(max_length=100, required=False, allow_null=True)
    period_start = serializers.DateField(required=False, allow_null=True)
    location_id = serializers.IntegerField(required=False, allow_null=True)
    participant_individual_id = serializers.IntegerField(required=False, allow_null=True, help_text="Admitting practitioner ID")
    participant_type = serializers.CharField(max_length=100, required=False, allow_null=True)
    admit_source = serializers.CharField(max_length=255, required=False, allow_null=True)
    account_id = serializers.IntegerField(required=False, allow_null=True)
    pre_admission_identifier = serializers.CharField(max_length=100, required=False, allow_null=True)
    location_status = serializers.CharField(max_length=100, required=False, allow_null=True, help_text="Text description of location (Ward/Room/Bed)")


class EncounterDischargeInputSerializer(serializers.Serializer):
    """
    Input Serializer for Encounter discharge.
    Validation only - NO model binding or save() logic.
    """
    period_end = serializers.DateField(required=False, allow_null=True, help_text="Discharge date")
    discharge_disposition = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    discharge_destination_id = serializers.IntegerField(required=False, allow_null=True, help_text="Discharge destination location ID")


class EncounterOutputSerializer(serializers.Serializer):
    """
    Output Serializer for Encounter DTOs.
    Read-only, DTO-based serialization.
    """
    encounter_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    class_field = serializers.CharField()
    type = serializers.CharField(allow_null=True)
    service_type = serializers.CharField(allow_null=True)
    priority = serializers.CharField(allow_null=True)
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(allow_null=True)
    period_start = serializers.CharField(allow_null=True)
    period_end = serializers.CharField(allow_null=True)
    reason_code = serializers.CharField(allow_null=True)
    location_id = serializers.IntegerField(allow_null=True)
    location_summary = serializers.DictField(allow_null=True)
    participant_individual_id = serializers.IntegerField(allow_null=True)
    practitioner_summary = serializers.DictField(allow_null=True)
    admit_source = serializers.CharField(allow_null=True)
    discharge_disposition = serializers.CharField(allow_null=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class EncounterListOutputSerializer(serializers.Serializer):
    """
    Output Serializer for Encounter list/summary DTOs.
    Lightweight DTO for list views.
    """
    encounter_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    class_field = serializers.CharField()
    service_type = serializers.CharField(allow_null=True)
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(allow_null=True)
    period_start = serializers.CharField(allow_null=True)
    period_end = serializers.CharField(allow_null=True)
    location_id = serializers.IntegerField(allow_null=True)


# ============================================================================
# PROCEDURE SERIALIZERS
# ============================================================================

class ProcedurePerformerInputSerializer(serializers.Serializer):
    """
    Input Serializer for ProcedurePerformer (nested in ProcedureInputSerializer).
    Validation only.
    """
    performer_actor_id = serializers.IntegerField(required=False, allow_null=True, help_text="Practitioner ID")
    performer_function_code = serializers.CharField(max_length=100, required=False, allow_null=True)
    performer_function_display = serializers.CharField(max_length=100, required=False, allow_null=True)
    performer_on_behalf_of_id = serializers.IntegerField(required=False, allow_null=True, help_text="Organization ID")


class ProcedureInputSerializer(serializers.Serializer):
    """
    Input Serializer for Procedure creation.
    Validation only - NO model binding or save() logic.
    """
    encounter_id = serializers.IntegerField(required=True, help_text="Encounter ID (internal FK)")
    subject_id = serializers.IntegerField(required=True, help_text="Patient ID")
    code_code = serializers.CharField(max_length=100, required=True, help_text="Procedure code")
    code_display = serializers.CharField(max_length=100, required=False, allow_null=True)
    status = serializers.CharField(max_length=50, required=False, default='completed')
    performed_datetime = serializers.DateTimeField(required=False, allow_null=True)
    performed_period_start = serializers.DateField(required=False, allow_null=True)
    performed_period_end = serializers.DateField(required=False, allow_null=True)
    category_code = serializers.CharField(max_length=100, required=False, allow_null=True)
    category_display = serializers.CharField(max_length=100, required=False, allow_null=True)
    body_site_code = serializers.CharField(max_length=100, required=False, allow_null=True)
    body_site_display = serializers.CharField(max_length=100, required=False, allow_null=True)
    outcome_code = serializers.CharField(max_length=100, required=False, allow_null=True)
    outcome_display = serializers.CharField(max_length=100, required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    location_id = serializers.IntegerField(required=False, allow_null=True)
    recorder_id = serializers.IntegerField(required=False, allow_null=True)
    asserter_id = serializers.IntegerField(required=False, allow_null=True)
    performers = serializers.ListField(
        child=ProcedurePerformerInputSerializer(),
        required=False,
        default=list,
        help_text="List of performers"
    )


class ProcedureOutputSerializer(serializers.Serializer):
    """
    Output Serializer for Procedure DTOs.
    Read-only, DTO-based serialization.
    """
    procedure_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    code_code = serializers.CharField()
    code_display = serializers.CharField(allow_null=True)
    category_code = serializers.CharField(allow_null=True)
    category_display = serializers.CharField(allow_null=True)
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(allow_null=True)
    encounter_id = serializers.IntegerField(allow_null=True)
    performed_datetime = serializers.CharField(allow_null=True)
    performed_period_start = serializers.CharField(allow_null=True)
    performed_period_end = serializers.CharField(allow_null=True)
    body_site_code = serializers.CharField(allow_null=True)
    body_site_display = serializers.CharField(allow_null=True)
    outcome_code = serializers.CharField(allow_null=True)
    outcome_display = serializers.CharField(allow_null=True)
    note = serializers.CharField(allow_null=True)
    performers = serializers.ListField(allow_null=True)
    location_id = serializers.IntegerField(allow_null=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class ProcedureListOutputSerializer(serializers.Serializer):
    """
    Output Serializer for Procedure list/summary DTOs.
    Lightweight DTO for list views.
    """
    procedure_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    code_code = serializers.CharField()
    code_display = serializers.CharField(allow_null=True)
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(allow_null=True)
    encounter_id = serializers.IntegerField(allow_null=True)
    performed_datetime = serializers.CharField(allow_null=True)
    outcome_code = serializers.CharField(allow_null=True)
class ProcedureOutputSerializer(serializers.Serializer):
    """
    Output Serializer for Procedure DTOs.
    Read-only, DTO-based serialization.
    """
    procedure_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    code_code = serializers.CharField()
    code_display = serializers.CharField(allow_null=True)
    category_code = serializers.CharField(allow_null=True)
    category_display = serializers.CharField(allow_null=True)
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(allow_null=True)
    encounter_id = serializers.IntegerField(allow_null=True)
    performed_datetime = serializers.CharField(allow_null=True)
    performed_period_start = serializers.CharField(allow_null=True)
    performed_period_end = serializers.CharField(allow_null=True)
    body_site_code = serializers.CharField(allow_null=True)
    body_site_display = serializers.CharField(allow_null=True)
    outcome_code = serializers.CharField(allow_null=True)
    outcome_display = serializers.CharField(allow_null=True)
    note = serializers.CharField(allow_null=True)
    performers = serializers.ListField(allow_null=True)
    location_id = serializers.IntegerField(allow_null=True)
    created_at = serializers.CharField(allow_null=True)
    updated_at = serializers.CharField(allow_null=True)


class ProcedureListOutputSerializer(serializers.Serializer):
    """
    Output Serializer for Procedure list/summary DTOs.
    Lightweight DTO for list views.
    """
    procedure_id = serializers.IntegerField()
    identifier = serializers.CharField()
    status = serializers.CharField()
    code_code = serializers.CharField()
    code_display = serializers.CharField(allow_null=True)
    subject_id = serializers.IntegerField()
    patient_summary = serializers.DictField(allow_null=True)
    encounter_id = serializers.IntegerField(allow_null=True)
    performed_datetime = serializers.CharField(allow_null=True)
    outcome_code = serializers.CharField(allow_null=True)
