"""
Admission App Serializers
=========================
CQRS Implementation: Separate serializers for Input (Command) and Output (Query).

Architecture:
- Input Serializers: Validate external string identifiers, do not save directly
- Output Serializers: Enrich data with resolved references for display

Author: WAH4H Backend Team
Date: February 2, 2026
"""

from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from .models import Encounter, Procedure, ProcedurePerformer


# ==================== INPUT SERIALIZERS (Write/Command) ====================

class EncounterInputSerializer(serializers.Serializer):
    """
    Input serializer for creating encounters.
    Accepts external string identifiers and validates their existence.
    Data is passed to EncounterService for processing.
    """
    
    # Required Fields
    patient_id = serializers.CharField(
        required=True,
        max_length=100,
        help_text="External patient identifier (e.g., 'P-2023-001')"
    )
    
    # Optional Classification Fields
    status = serializers.CharField(
        required=False,
        max_length=100,
        help_text="Encounter status (defaults to 'arrived' if not provided)"
    )
    
    type = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Encounter type"
    )
    
    priority = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Priority level"
    )
    
    service_type = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Type of service being provided"
    )
    
    class_field = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Encounter class (inpatient, outpatient, emergency, etc.)"
    )
    
    # Optional Reference Fields
    location_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Internal location ID reference"
    )
    
    service_provider_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Internal service provider/organization ID reference"
    )
    
    # Optional Timing Fields
    period_start = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Encounter start date"
    )
    
    # Optional Admission Fields
    admit_source = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Source of admission"
    )
    
    re_admission = serializers.BooleanField(
        required=False,
        allow_null=True,
        help_text="Is this a re-admission?"
    )
    
    # Optional Participant Fields
    participant_individual_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Practitioner ID participating in encounter"
    )
    
    participant_type = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Type of participant"
    )
    
    # Optional Episode and Appointment References
    episode_of_care_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Episode of care ID reference"
    )
    
    based_on_service_request_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Service request ID this encounter is based on"
    )
    
    appointment_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Appointment ID reference"
    )
    
    def validate_patient_id(self, value):
        """
        Validate that the patient exists in the database.
        Uses late import to avoid circular dependencies.
        """
        # Late import to prevent circular dependency
        from patients.models import Patient
        
        try:
            Patient.objects.get(patient_id=value)
        except Patient.DoesNotExist:
            raise serializers.ValidationError(
                f"Patient with identifier '{value}' does not exist"
            )
        
        return value
    
    def validate_status(self, value):
        """
        Validate encounter status against FHIR allowed values.
        """
        valid_statuses = [
            'planned', 'arrived', 'triaged', 'in-progress',
            'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'
        ]
        
        if value and value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        return value


class ProcedureInputSerializer(serializers.Serializer):
    """
    Input serializer for recording procedures.
    Accepts external encounter identifier and validates existence.
    Data is passed to ProcedureService for processing.
    """
    
    # Required Fields
    encounter_identifier = serializers.CharField(
        required=True,
        max_length=100,
        help_text="External encounter identifier (e.g., 'ENC-20260202-A3F2D1')"
    )
    
    code_code = serializers.CharField(
        required=True,
        max_length=100,
        help_text="Procedure code (ICD-10-PCS, SNOMED CT, etc.)"
    )
    
    code_display = serializers.CharField(
        required=True,
        max_length=255,
        help_text="Human-readable procedure name"
    )
    
    # Optional Fields
    status = serializers.CharField(
        required=False,
        max_length=100,
        help_text="Procedure status (defaults to 'completed')"
    )
    
    category_code = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Procedure category code"
    )
    
    category_display = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Procedure category display name"
    )
    
    performed_datetime = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text="When the procedure was performed (defaults to now)"
    )
    
    body_site_code = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Anatomical site code (SNOMED CT)"
    )
    
    body_site_display = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Anatomical site display name"
    )
    
    reason_code_code = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Reason for procedure code"
    )
    
    reason_code_display = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Reason for procedure display"
    )
    
    outcome_code = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Outcome code"
    )
    
    outcome_display = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Outcome display text"
    )
    
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        help_text="Additional notes about the procedure"
    )
    
    location_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Location where procedure was performed"
    )
    
    performer_actor_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Practitioner ID who performed the procedure"
    )
    
    performer_function_code = serializers.CharField(
        required=False,
        max_length=100,
        allow_blank=True,
        allow_null=True,
        help_text="Performer function/role code"
    )
    
    performer_function_display = serializers.CharField(
        required=False,
        max_length=255,
        allow_blank=True,
        allow_null=True,
        help_text="Performer function/role display"
    )
    
    def validate_encounter_identifier(self, value):
        """
        Validate that the encounter exists in the database.
        Uses late import to avoid circular dependencies.
        """
        try:
            Encounter.objects.get(identifier=value)
        except Encounter.DoesNotExist:
            raise serializers.ValidationError(
                f"Encounter with identifier '{value}' does not exist"
            )
        
        return value
    
    def validate_status(self, value):
        """
        Validate procedure status against FHIR allowed values.
        """
        valid_statuses = [
            'preparation', 'in-progress', 'not-done', 'on-hold',
            'stopped', 'completed', 'entered-in-error', 'unknown'
        ]
        
        if value and value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        return value


# ==================== OUTPUT SERIALIZERS (Read/Query) ====================

class EncounterOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for encounter display.
    Enriches data with resolved foreign key information.
    """
    
    # Enriched Fields
    patient_name = serializers.SerializerMethodField(
        help_text="Resolved patient full name"
    )
    
    patient_identifier = serializers.SerializerMethodField(
        help_text="External patient identifier"
    )
    
    class Meta:
        model = Encounter
        fields = [
            'encounter_id',
            'identifier',
            'status',
            'class_field',
            'type',
            'service_type',
            'priority',
            'subject_patient_id',
            'patient_name',
            'patient_identifier',
            'episode_of_care_id',
            'based_on_service_request_id',
            'appointment_id',
            'participant_individual_id',
            'participant_type',
            'period_start',
            'period_end',
            'length',
            'reason_code',
            'diagnosis_condition_id',
            'diagnosis_rank',
            'diagnosis_use',
            'location_id',
            'location_status',
            'location_period_start',
            'location_period_end',
            'admit_source',
            're_admission',
            'discharge_destination_id',
            'discharge_disposition',
            'service_provider_id',
            'account_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['encounter_id', 'identifier', 'created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        """
        Resolve patient name from subject_patient_id.
        Returns formatted name: "Last, First Middle"
        """
        # Late import to prevent potential circular dependency
        from patients.models import Patient
        
        try:
            patient = Patient.objects.get(id=obj.subject_patient_id)
            
            # Build formatted name
            name_parts = []
            if patient.last_name:
                name_parts.append(patient.last_name)
            
            first_middle = []
            if patient.first_name:
                first_middle.append(patient.first_name)
            if patient.middle_name:
                first_middle.append(patient.middle_name)
            
            if first_middle:
                name_parts.append(' '.join(first_middle))
            
            return ', '.join(name_parts) if name_parts else 'Unknown'
            
        except ObjectDoesNotExist:
            return 'Unknown'
        except AttributeError:
            return 'Unknown'
    
    def get_patient_identifier(self, obj):
        """
        Resolve patient external identifier from subject_patient_id.
        """
        from patients.models import Patient
        
        try:
            patient = Patient.objects.get(id=obj.subject_patient_id)
            return patient.patient_id  # External string identifier
        except ObjectDoesNotExist:
            return None


class ProcedureOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for procedure display.
    Enriches data with resolved references.
    """
    
    # Enriched Fields
    patient_name = serializers.SerializerMethodField(
        help_text="Resolved patient full name"
    )
    
    encounter_identifier = serializers.SerializerMethodField(
        help_text="External encounter identifier"
    )
    
    class Meta:
        model = Procedure
        fields = [
            'procedure_id',
            'identifier',
            'status',
            'status_reason_code',
            'status_reason_display',
            'category_code',
            'category_display',
            'code_code',
            'code_display',
            'subject_id',
            'patient_name',
            'encounter_id',
            'encounter_identifier',
            'performed_datetime',
            'performed_period_start',
            'performed_period_end',
            'performed_string',
            'recorder_id',
            'asserter_id',
            'performer_actor_id',
            'performer_function_code',
            'performer_function_display',
            'location_id',
            'reason_code_code',
            'reason_code_display',
            'body_site_code',
            'body_site_display',
            'outcome_code',
            'outcome_display',
            'complication_code',
            'complication_display',
            'follow_up_code',
            'follow_up_display',
            'note',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['procedure_id', 'identifier', 'created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        """
        Resolve patient name from subject_id.
        Returns formatted name: "Last, First Middle"
        """
        from patients.models import Patient
        
        try:
            patient = Patient.objects.get(id=obj.subject_id)
            
            name_parts = []
            if patient.last_name:
                name_parts.append(patient.last_name)
            
            first_middle = []
            if patient.first_name:
                first_middle.append(patient.first_name)
            if patient.middle_name:
                first_middle.append(patient.middle_name)
            
            if first_middle:
                name_parts.append(' '.join(first_middle))
            
            return ', '.join(name_parts) if name_parts else 'Unknown'
            
        except ObjectDoesNotExist:
            return 'Unknown'
        except AttributeError:
            return 'Unknown'
    
    def get_encounter_identifier(self, obj):
        """
        Resolve encounter external identifier from encounter_id.
        """
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            return encounter.identifier  # External string identifier
        except ObjectDoesNotExist:
            return None


class ProcedurePerformerSerializer(serializers.ModelSerializer):
    """
    Serializer for procedure performer detail records.
    """
    
    class Meta:
        model = ProcedurePerformer
        fields = [
            'procedure_performer_id',
            'procedure_id',
            'performer_actor_id',
            'performer_function_code',
            'performer_function_display',
            'performer_on_behalf_of_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['procedure_performer_id', 'created_at', 'updated_at']


# ==================== LEGACY SERIALIZERS (Deprecated) ====================
# These are kept for backward compatibility but should not be used in new code

class EncounterSerializer(serializers.ModelSerializer):
    """
    DEPRECATED: Use EncounterInputSerializer for writes and EncounterOutputSerializer for reads.
    Legacy serializer kept for backward compatibility.
    """
    class Meta:
        model = Encounter
        fields = '__all__'


class ProcedureSerializer(serializers.ModelSerializer):
    """
    DEPRECATED: Use ProcedureInputSerializer for writes and ProcedureOutputSerializer for reads.
    Legacy serializer kept for backward compatibility.
    """
    class Meta:
        model = Procedure
        fields = '__all__'