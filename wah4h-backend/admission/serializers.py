from rest_framework import serializers
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.utils import timezone
from datetime import date
from admission.models import Encounter, Procedure, ProcedurePerformer
from patients.services.patient_acl import validate_patient_exists, get_patient_summary
from accounts.models import Practitioner, Location
import random

# ============================================================================
# ENCOUNTER SERIALIZERS
# ============================================================================

class EncounterSerializer(serializers.ModelSerializer):
    """
    Unified Serializer for Encounter (Admission).
    Handles validation, creation, and enriched output.
    """
    patient_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    patient_summary = serializers.SerializerMethodField()
    location_summary = serializers.SerializerMethodField()
    practitioner_summary = serializers.SerializerMethodField()
    
    # Input-only fields for location components
    ward = serializers.CharField(write_only=True, required=False, allow_null=True)
    room = serializers.CharField(write_only=True, required=False, allow_null=True)
    bed = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Encounter
        fields = [
            'encounter_id', 'identifier', 'status', 'class_field', 'type', 
            'service_type', 'priority', 'subject_id', 'patient_id', 'patient_summary', 
            'period_start', 'period_end', 'reason_code', 'location_id', 
            'location_ids', 'location_summary', 'location_status',
            'ward', 'room', 'bed',
            'participant_individual_id', 'participant_type', 'practitioner_summary', 
            'admit_source', 're_admission', 'diet_preference', 
            'special_courtesy', 'special_arrangement', 'discharge_disposition', 
            'discharge_destination_id', 'account_id', 'pre_admission_identifier',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['encounter_id', 'identifier', 'status', 'created_at', 'updated_at']
        extra_kwargs = {
            'subject_id': {'required': False},
        }

    def get_patient_summary(self, obj):
        if obj.subject_id:
            return get_patient_summary(obj.subject_id)
        return None

    def get_location_summary(self, obj):
        if obj.location_id:
            return LocationACL.get_location_summary(obj.location_id)
        return None

    def get_practitioner_summary(self, obj):
        if obj.participant_individual_id:
            return PractitionerACL.get_practitioner_summary(obj.participant_individual_id)
        return None

    def validate(self, data):
        # Resolve patient_id string to subject_id if provided
        patient_id_str = data.get('patient_id')
        if patient_id_str and not data.get('subject_id'):
            from patients.models import Patient
            try:
                patient = Patient.objects.get(patient_id=patient_id_str)
                data['subject_id'] = patient.id
            except Patient.DoesNotExist:
                raise serializers.ValidationError({"patient_id": f"Patient with identifier {patient_id_str} does not exist"})

        # Validate subject_id exists
        subject_id = data.get('subject_id')
        if subject_id and not validate_patient_exists(subject_id):
            raise serializers.ValidationError({"subject_id": f"Patient with ID {subject_id} does not exist"})

        # Validate practitioner if provided
        participant_id = data.get('participant_individual_id')
        if participant_id and not PractitionerACL.validate_practitioner_exists(participant_id):
            raise serializers.ValidationError({"participant_individual_id": f"Practitioner with ID {participant_id} does not exist"})

        # Validate location if provided
        location_id = data.get('location_id')
        if location_id and not LocationACL.validate_location_exists(location_id):
            raise serializers.ValidationError({"location_id": f"Location with ID {location_id} does not exist"})

        return data

    @transaction.atomic
    def create(self, validated_data):
        # Remove patient_id from validated_data before creating model instance
        validated_data.pop('patient_id', None)
        
        # Extract location components
        ward = validated_data.pop('ward', None)
        room = validated_data.pop('room', None)
        bed = validated_data.pop('bed', None)

        if not validated_data.get('identifier'):
            random_digits = ''.join([str(random.randint(0, 9)) for _ in range(11)])
            validated_data['identifier'] = f"ENC-{random_digits}"

        # Prepare location status
        if ward or room or bed:
            validated_data['location_status'] = f"{ward or ''}|{room or ''}|{bed or ''}"

        # Default status for new encounters if not provided
        if not validated_data.get('status'):
            validated_data['status'] = 'in-progress'
        
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        # Sync location_status if components are updated
        ward = validated_data.pop('ward', None)
        room = validated_data.pop('room', None)
        bed = validated_data.pop('bed', None)

        if ward is not None or room is not None or bed is not None:
            current_status = (instance.location_status or "||").split('|')
            while len(current_status) < 3: current_status.append('')
            
            w = ward if ward is not None else current_status[0]
            r = room if room is not None else current_status[1]
            b = bed if bed is not None else current_status[2]
            
            validated_data['location_status'] = f"{w}|{r}|{b}"

        return super().update(instance, validated_data)

class EncounterDischargeSerializer(serializers.ModelSerializer):
    """
    Serializer specifically for discharging a patient.
    """
    class Meta:
        model = Encounter
        fields = ['period_end', 'discharge_disposition', 'discharge_destination_id']

    def validate_discharge_destination_id(self, value):
        if value and not LocationACL.validate_location_exists(value):
            raise serializers.ValidationError(f"Discharge destination with ID {value} does not exist")
        return value

    @transaction.atomic
    def save(self, **kwargs):
        instance = self.instance
        if instance.status == 'finished':
            raise serializers.ValidationError("Encounter is already discharged")
        
        instance.status = 'finished'
        if not instance.period_end:
            instance.period_end = date.today()
        return super().save(**kwargs)

# ============================================================================
# PROCEDURE SERIALIZERS
# ============================================================================

class ProcedurePerformerSerializer(serializers.ModelSerializer):
    practitioner_summary = serializers.SerializerMethodField()

    class Meta:
        model = ProcedurePerformer
        fields = [
            'procedure_performer_id', 'performer_actor_id', 'practitioner_summary',
            'performer_function_code', 'performer_function_display', 'performer_on_behalf_of_id'
        ]

    def get_practitioner_summary(self, obj):
        if obj.performer_actor_id:
            return PractitionerACL.get_practitioner_summary(obj.performer_actor_id)
        return None

class ProcedureSerializer(serializers.ModelSerializer):
    patient_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    patient_summary = serializers.SerializerMethodField()
    performers = ProcedurePerformerSerializer(many=True, required=False)

    class Meta:
        model = Procedure
        fields = [
            'procedure_id', 'identifier', 'status', 'code_code', 'code_display',
            'category_code', 'category_display', 'subject_id', 'patient_id', 'patient_summary',
            'encounter', 'performed_datetime', 'performed_period_start', 
            'performed_period_end', 'body_site_code', 'body_site_display',
            'outcome_code', 'outcome_display', 'note', 'performers', 
            'location_id', 'recorder_id', 'asserter_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['procedure_id', 'identifier', 'status', 'created_at', 'updated_at']
        extra_kwargs = {
            'subject_id': {'required': False},
            'encounter': {'required': False},
        }

    def get_patient_summary(self, obj):
        if obj.subject_id:
            return get_patient_summary(obj.subject_id)
        return None

    def validate(self, data):
        # Resolve patient_id string to subject_id if provided
        patient_id_str = data.get('patient_id')
        if patient_id_str and not data.get('subject_id'):
            from patients.models import Patient
            try:
                patient = Patient.objects.get(patient_id=patient_id_str)
                data['subject_id'] = patient.id
            except Patient.DoesNotExist:
                raise serializers.ValidationError({"patient_id": f"Patient with identifier {patient_id_str} does not exist"})

        encounter = data.get('encounter')
        subject_id = data.get('subject_id')

        # Validate subject_id exists
        if subject_id and not validate_patient_exists(subject_id):
            raise serializers.ValidationError({"subject_id": f"Patient with ID {subject_id} does not exist"})

        # Validate patient matches encounter's patient
        if encounter and encounter.subject_id != subject_id:
            raise serializers.ValidationError("Procedure subject_id must match encounter's subject_id")

        return data

    @transaction.atomic
    def create(self, validated_data):
        # Remove patient_id from validated_data
        validated_data.pop('patient_id', None)
        
        performers_data = validated_data.pop('performers', [])
        
        if not validated_data.get('identifier'):
            random_digits = ''.join([str(random.randint(0, 9)) for _ in range(11)])
            validated_data['identifier'] = f"PROC-{random_digits}"
            
        # Set recorder_id from context if available
        if 'request' in self.context:
            validated_data['recorder_id'] = self.context['request'].user.id

        if not validated_data.get('status'):
            validated_data['status'] = 'completed'

        procedure = Procedure.objects.create(**validated_data)
        
        for performer_data in performers_data:
            ProcedurePerformer.objects.create(procedure=procedure, **performer_data)
            
        return procedure

# ============================================================================
# COMPATIBILITY HELPERS (ACLs)
# ============================================================================

class EncounterACL:
    """
    Compatibility helper for external modules.
    """
    @staticmethod
    def validate_encounter_exists(encounter_id: int) -> bool:
        return Encounter.objects.filter(encounter_id=encounter_id).exists()
    
    @staticmethod
    def get_encounter_details(encounter_id: int):
        try:
            instance = Encounter.objects.get(encounter_id=encounter_id)
            return EncounterSerializer(instance).data
        except ObjectDoesNotExist:
            return None

class ProcedureACL:
    """
    Compatibility helper for external modules.
    """
    @staticmethod
    def validate_procedure_exists(procedure_id: int) -> bool:
        return Procedure.objects.filter(procedure_id=procedure_id).exists()
    
    @staticmethod
    def get_procedure_details(procedure_id: int):
        try:
            instance = Procedure.objects.get(procedure_id=procedure_id)
            return ProcedureSerializer(instance).data
        except ObjectDoesNotExist:
            return None

