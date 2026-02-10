"""
laboratory/api/serializers.py

CQRS-Lite Serializers for Laboratory Module.
Separates Input (Write) and Output (Read) DTOs.

Fortress Pattern Rules:
- Input serializers for write operations (create/update)
- Output serializers for read operations (list/retrieve)
- Deep DTOs with enriched data for Output serializers
"""

from rest_framework import serializers
from laboratory.models import (
    LabTestDefinition,
    DiagnosticReport,
    DiagnosticReportResult,
)


# ============================================================================
# LAB TEST DEFINITION SERIALIZERS
# ============================================================================

class LabTestDefinitionInputSerializer(serializers.Serializer):
    """
    Input DTO for creating/updating laboratory test definitions.
    """
    code = serializers.CharField(max_length=50, required=True)
    name = serializers.CharField(max_length=255, required=True)
    category = serializers.CharField(max_length=100, required=True)
    base_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    turnaround_time = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    status = serializers.CharField(max_length=20, required=False, default='active')

    def validate_base_price(self, value):
        """Ensure base price is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Base price must be non-negative")
        return value


class LabTestDefinitionOutputSerializer(serializers.ModelSerializer):
    """
    Output DTO for laboratory test definitions.
    Used for list/retrieve operations.
    """
    currency = serializers.SerializerMethodField()

    class Meta:
        model = LabTestDefinition
        fields = [
            'test_id',
            'code',
            'name',
            'category',
            'base_price',
            'currency',
            'turnaround_time',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_currency(self, obj):
        """Always PHP for Philippine LGU hospitals."""
        return 'PHP'


# ============================================================================
# DIAGNOSTIC REPORT RESULT SERIALIZERS
# ============================================================================

class DiagnosticReportResultInputSerializer(serializers.Serializer):
    """
    Input DTO for diagnostic report results (nested in report creation).
    """
    observation_id = serializers.IntegerField(required=True)
    item_sequence = serializers.IntegerField(required=True)

    def validate_item_sequence(self, value):
        """Ensure item sequence is positive."""
        if value < 1:
            raise serializers.ValidationError("Item sequence must be positive")
        return value


class DiagnosticReportResultOutputSerializer(serializers.ModelSerializer):
    """
    Output DTO for diagnostic report results.
    """
    class Meta:
        model = DiagnosticReportResult
        fields = [
            'diagnostic_report_result_id',
            'observation_id',
            'item_sequence',
        ]
        read_only_fields = fields


# ============================================================================
# DIAGNOSTIC REPORT SERIALIZERS
# ============================================================================

class DiagnosticReportInputSerializer(serializers.Serializer):
    """
    Input DTO for creating diagnostic reports.
    Validates required references and delegates to service layer.
    """
    subject_id = serializers.IntegerField(required=True, help_text="Patient ID")
    encounter_id = serializers.IntegerField(required=True, help_text="Encounter ID")
    performer_id = serializers.IntegerField(required=False, allow_null=True, help_text="Practitioner ID")
    results_interpreter_id = serializers.IntegerField(required=False, allow_null=True)
    specimen_id = serializers.IntegerField(required=False, allow_null=True)
    based_on_id = serializers.IntegerField(required=False, allow_null=True, help_text="ServiceRequest ID")
    imaging_study_id = serializers.IntegerField(required=False, allow_null=True)
    
    code_code = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    code_display = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    category_code = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    category_display = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    
    conclusion = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    conclusion_code = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    conclusion_display = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    
    effective_datetime = serializers.DateTimeField(required=False, allow_null=True)
    effective_period_start = serializers.DateField(required=False, allow_null=True)
    effective_period_end = serializers.DateField(required=False, allow_null=True)
    issued_datetime = serializers.DateTimeField(required=False, allow_null=True)
    
    media_comment = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    presented_form_url = serializers.URLField(max_length=255, required=False, allow_blank=True, allow_null=True)
    
    status = serializers.CharField(max_length=20, required=False, default='preliminary')
    
    # Nested results
    results = DiagnosticReportResultInputSerializer(many=True, required=False)

    def validate_subject_id(self, value):
        """Validate patient exists."""
        from patients.services.patient_acl import validate_patient_exists
        if not validate_patient_exists(value):
            raise serializers.ValidationError(f"Patient with ID {value} does not exist")
        return value

    def validate_encounter_id(self, value):
        """Validate encounter exists."""
        from admission.serializers import EncounterACL
        if not EncounterACL.validate_encounter_exists(value):
            raise serializers.ValidationError(f"Encounter with ID {value} does not exist")
        return value

    def validate(self, data):
        """Cross-field validation."""
        # Ensure encounter belongs to patient
        if 'subject_id' in data and 'encounter_id' in data:
            from admission.serializers import EncounterACL
            encounter_details = EncounterACL.get_encounter_details(data['encounter_id'])
            if encounter_details and encounter_details.get('subject_id') != data['subject_id']:
                raise serializers.ValidationError(
                    f"Encounter {data['encounter_id']} does not belong to patient {data['subject_id']}"
                )
        return data


class DiagnosticReportOutputSerializer(serializers.ModelSerializer):
    """
    Output DTO for diagnostic reports.
    Deep DTO with enriched data and nested results.
    """
    results = DiagnosticReportResultOutputSerializer(many=True, read_only=True)
    patient_summary = serializers.SerializerMethodField()
    encounter_summary = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticReport
        fields = [
            'diagnostic_report_id',
            'subject_id',
            'encounter_id',
            'performer_id',
            'results_interpreter_id',
            'specimen_id',
            'based_on_id',
            'imaging_study_id',
            'code_code',
            'code_display',
            'category_code',
            'category_display',
            'conclusion',
            'conclusion_code',
            'conclusion_display',
            'effective_datetime',
            'effective_period_start',
            'effective_period_end',
            'issued_datetime',
            'media_comment',
            'presented_form_url',
            'status',
            'created_at',
            'updated_at',
            'results',
            'patient_summary',
            'encounter_summary',
        ]
        read_only_fields = fields

    def get_patient_summary(self, obj):
        """Enrich with patient data from PatientACL."""
        from patients.services.patient_acl import get_patient_summary
        if obj.subject_id:
            patient = get_patient_summary(obj.subject_id)
            if patient:
                return {
                    'id': patient.get('id'),
                    'patient_id': patient.get('patient_id'),
                    'full_name': patient.get('full_name'),
                }
        return None

    def get_encounter_summary(self, obj):
        """Enrich with encounter data from AdmissionACL."""
        from admission.serializers import EncounterACL
        if obj.encounter_id:
            encounter = EncounterACL.get_encounter_details(obj.encounter_id)
            if encounter:
                return {
                    'encounter_id': encounter.get('encounter_id'),
                    'status': encounter.get('status'),
                    'class_field': encounter.get('class_field'),
                    'period_start': encounter.get('period_start'),
                }
        return None


# ============================================================================
# LIST SERIALIZERS (Lightweight for list views)
# ============================================================================

class DiagnosticReportListSerializer(serializers.ModelSerializer):
    """
    Lightweight output DTO for diagnostic report lists.
    Excludes heavy nested data for performance.
    """
    class Meta:
        model = DiagnosticReport
        fields = [
            'diagnostic_report_id',
            'subject_id',
            'encounter_id',
            'code_code',
            'code_display',
            'conclusion',
            'issued_datetime',
            'status',
        ]
        read_only_fields = fields
