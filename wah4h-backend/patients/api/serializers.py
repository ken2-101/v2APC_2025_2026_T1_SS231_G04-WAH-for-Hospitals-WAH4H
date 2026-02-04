"""
Patient API Serializers
=======================
Fortress Pattern: All data transformation delegated to Service Layer (ACL).

These serializers use patient_acl functions to ensure consistent DTOs
across the entire WAH ecosystem.
"""

from rest_framework import serializers
from patients.models import Patient, Condition, AllergyIntolerance, Immunization
from patients.services import patient_acl


# ============================================================================
# PATIENT SERIALIZERS
# ============================================================================

class PatientListSerializer(serializers.ModelSerializer):
    """
    Patient List Serializer
    
    Returns standardized patient summary via ACL.
    Used for list views, search results, and quick lookups.
    """
    
    class Meta:
        model = Patient
        fields = ['id', 'patient_id', 'first_name', 'last_name', 'gender', 'birthdate']
    
    def to_representation(self, instance):
        """
        Override to use ACL summary DTO for consistent output.
        Delegates to patient_acl.get_patient_summary().
        """
        summary = patient_acl.get_patient_summary(instance.id)
        return summary if summary else {}


class PatientDetailSerializer(serializers.ModelSerializer):
    """
    Patient Detail Serializer
    
    Returns complete patient details via ACL.
    Used for detail views and full patient profiles.
    """
    
    class Meta:
        model = Patient
        fields = '__all__'
    
    def to_representation(self, instance):
        """
        Override to use ACL detail DTO for consistent output.
        Delegates to patient_acl.get_patient_details().
        """
        details = patient_acl.get_patient_details(instance.id)
        return details if details else {}


class PatientCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Patient Create/Update Serializer
    
    Handles patient creation and updates.
    Uses standard Django validation without ACL delegation.
    """
    
    class Meta:
        model = Patient
        fields = [
            'patient_id', 'first_name', 'last_name', 'middle_name', 'suffix_name',
            'gender', 'birthdate', 'civil_status', 'nationality', 'religion',
            'philhealth_id', 'blood_type', 'pwd_type',
            'occupation', 'education', 'mobile_number',
            'address_line', 'address_city', 'address_district', 
            'address_state', 'address_postal_code', 'address_country',
            'contact_first_name', 'contact_last_name', 
            'contact_mobile_number', 'contact_relationship',
            'indigenous_flag', 'indigenous_group',
            'consent_flag', 'image_url'
        ]
        extra_kwargs = {
            'patient_id': {'required': False},
        }


# ============================================================================
# CONDITION SERIALIZERS
# ============================================================================

class ConditionSerializer(serializers.ModelSerializer):
    """
    Condition Serializer
    
    Standard FHIR Condition resource serialization.
    """
    
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    patient_identifier = serializers.CharField(source='patient.patient_id', read_only=True)
    
    class Meta:
        model = Condition
        fields = [
            'condition_id', 'identifier',
            'clinical_status', 'verification_status',
            'category', 'severity', 'code',
            'patient_id', 'patient_identifier', 'encounter_id',
            'body_site',
            'onset_datetime', 'onset_age', 'onset_period_start', 'onset_period_end',
            'abatement_datetime', 'abatement_age', 'abatement_period_start', 'abatement_period_end',
            'recorded_date', 'recorder_id', 'asserter_id',
            'stage_summary', 'stage_type', 'stage_assessment_id',
            'evidence_code', 'evidence_detail_id',
            'note',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['condition_id', 'created_at', 'updated_at']


class ConditionCreateSerializer(serializers.ModelSerializer):
    """
    Condition Create Serializer
    
    Handles condition creation with required field validation.
    """
    
    class Meta:
        model = Condition
        fields = [
            'identifier', 'clinical_status', 'verification_status',
            'category', 'severity', 'code',
            'patient', 'encounter_id', 'body_site',
            'onset_datetime', 'recorded_date', 'note'
        ]
        extra_kwargs = {
            'identifier': {'required': True},
            'code': {'required': True},
            'patient': {'required': True},
            'encounter_id': {'required': True},
        }


# ============================================================================
# ALLERGY SERIALIZERS
# ============================================================================

class AllergySerializer(serializers.ModelSerializer):
    """
    Allergy Intolerance Serializer
    
    Standard FHIR AllergyIntolerance resource serialization.
    """
    
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    patient_identifier = serializers.CharField(source='patient.patient_id', read_only=True)
    
    class Meta:
        model = AllergyIntolerance
        fields = [
            'allergy_id', 'identifier',
            'clinical_status', 'verification_status',
            'type', 'category', 'criticality', 'code',
            'patient_id', 'patient_identifier', 'encounter_id',
            'onset_datetime', 'onset_age', 'onset_period_start', 'onset_period_end',
            'onset_range_low', 'onset_range_high',
            'recorded_date', 'recorder_id', 'asserter_id',
            'last_occurrence',
            'reaction_description', 'reaction_onset', 'reaction_severity',
            'reaction_exposure_route', 'reaction_note', 'reaction_manifestation',
            'reaction_substance',
            'note',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['allergy_id', 'created_at', 'updated_at']


class AllergyCreateSerializer(serializers.ModelSerializer):
    """
    Allergy Create Serializer
    
    Handles allergy creation with required field validation.
    """
    
    class Meta:
        model = AllergyIntolerance
        fields = [
            'identifier', 'clinical_status', 'verification_status',
            'type', 'category', 'criticality', 'code',
            'patient', 'encounter_id',
            'onset_datetime', 'recorded_date',
            'reaction_description', 'reaction_severity', 'note'
        ]
        extra_kwargs = {
            'identifier': {'required': True},
            'code': {'required': True},
            'patient': {'required': True},
            'encounter_id': {'required': True},
        }


# ============================================================================
# IMMUNIZATION SERIALIZERS
# ============================================================================

class ImmunizationSerializer(serializers.ModelSerializer):
    """
    Immunization Serializer
    
    Standard PHCORE Immunization resource serialization.
    """
    
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    patient_identifier = serializers.CharField(source='patient.patient_id', read_only=True)
    
    class Meta:
        model = Immunization
        fields = [
            'immunization_id', 'identifier', 'status',
            'status_reason_code', 'status_reason_display',
            'vaccine_code', 'vaccine_display',
            'patient_id', 'patient_identifier', 'encounter_id',
            'occurrence_datetime', 'occurrence_string',
            'recorded_datetime', 'primary_source',
            'report_origin_code', 'report_origin_display',
            'location_id', 'manufacturer_id',
            'lot_number', 'expiration_date',
            'site_code', 'site_display',
            'route_code', 'route_display',
            'dose_quantity_value', 'dose_quantity_unit',
            'performer_id', 'performer_function_code', 'performer_function_display',
            'actor_id', 'note',
            'reason_code', 'reason_display', 'reason_reference_id',
            'is_subpotent', 'subpotent_reason_code', 'subpotent_reason_display',
            'dose_number_value', 'series_doses_value',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['immunization_id', 'created_at', 'updated_at']


class ImmunizationCreateSerializer(serializers.ModelSerializer):
    """
    Immunization Create Serializer
    
    Handles immunization creation with required field validation.
    """
    
    class Meta:
        model = Immunization
        fields = [
            'identifier', 'status', 'vaccine_code', 'vaccine_display',
            'patient', 'encounter_id',
            'occurrence_datetime', 'recorded_datetime',
            'lot_number', 'dose_quantity_value', 'dose_quantity_unit',
            'note'
        ]
        extra_kwargs = {
            'identifier': {'required': True},
            'status': {'required': True},
            'patient': {'required': True},
            'encounter_id': {'required': True},
        }
