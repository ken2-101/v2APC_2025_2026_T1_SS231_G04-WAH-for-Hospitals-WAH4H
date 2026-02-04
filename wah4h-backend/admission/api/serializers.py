from rest_framework import serializers
from admission.models import Encounter, Procedure, ProcedurePerformer
from admission.services.admission_acl import EncounterService, ProcedureService, PatientACL


class EncounterSerializer(serializers.ModelSerializer):
    subject_id = serializers.IntegerField(required=True)
    patient_details = serializers.SerializerMethodField(read_only=True)
    
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
            'subject_id',
            'patient_details',
            'episode_of_care_id',
            'based_on_service_request_id',
            'appointment_id',
            'participant_individual_id',
            'participant_type',
            'reason_reference_id',
            'diagnosis_condition_id',
            'location_id',
            'discharge_destination_id',
            'service_provider_id',
            'account_id',
            'period_start',
            'period_end',
            'length',
            'reason_code',
            'diagnosis_rank',
            'diagnosis_use',
            'location_status',
            'location_period_start',
            'location_period_end',
            'location_physical_type',
            'admit_source',
            're_admission',
            'diet_preference',
            'special_courtesy',
            'special_arrangement',
            'discharge_disposition',
            'part_of_encounter_id',
            'pre_admission_identifier',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['encounter_id', 'identifier', 'created_at', 'updated_at']
    
    def get_patient_details(self, obj):
        return PatientACL.get_patient_summary(obj.subject_id)
    
    def create(self, validated_data):
        return EncounterService.create_encounter(validated_data)


class ProcedureSerializer(serializers.ModelSerializer):
    encounter_id = serializers.IntegerField(required=True, source='encounter.encounter_id')
    subject_id = serializers.IntegerField(required=True)
    
    class Meta:
        model = Procedure
        fields = [
            'procedure_id',
            'identifier',
            'status',
            'status_reason_code',
            'status_reason_display',
            'instantiates_canonical',
            'instantiates_uri',
            'based_on_id',
            'part_of_id',
            'subject_id',
            'encounter_id',
            'performer_actor_id',
            'performer_on_behalf_of_id',
            'recorder_id',
            'asserter_id',
            'location_id',
            'reason_reference_id',
            'complication_detail_id',
            'report_id',
            'focal_device_manipulated_id',
            'used_reference_id',
            'category_code',
            'category_display',
            'code_code',
            'code_display',
            'performed_datetime',
            'performed_period_start',
            'performed_period_end',
            'performed_string',
            'performed_age_value',
            'performed_age_unit',
            'performed_range_low',
            'performed_range_high',
            'performer_function_code',
            'performer_function_display',
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
            'focal_device_action_code',
            'focal_device_action_display',
            'used_code_code',
            'used_code_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['procedure_id', 'identifier', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        encounter_id = validated_data.pop('encounter', {}).get('encounter_id')
        validated_data['encounter_id'] = encounter_id
        return ProcedureService.create_procedure(validated_data)


class ProcedurePerformerSerializer(serializers.ModelSerializer):
    procedure_id = serializers.IntegerField(required=True, source='procedure.procedure_id')
    
    class Meta:
        model = ProcedurePerformer
        fields = [
            'procedure_performer_id',
            'procedure_id',
            'performer_actor_id',
            'performer_on_behalf_of_id',
            'performer_function_code',
            'performer_function_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['procedure_performer_id', 'created_at', 'updated_at']
