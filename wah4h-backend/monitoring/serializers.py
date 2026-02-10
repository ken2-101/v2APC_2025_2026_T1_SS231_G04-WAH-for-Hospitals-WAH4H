"""
Monitoring Serializers
======================
Trinity Architecture: Direct Model Access with Fat Serializers

Direct ORM queries - NO service layers.
"""

from rest_framework import serializers
from monitoring.models import Observation, ChargeItem, ChargeItemDefinition
from patients.models import Patient
from admission.models import Encounter
from accounts.models import Practitioner, Organization


class ObservationSerializer(serializers.ModelSerializer):
    """
    Serializer for Observation model with resolved foreign key references.
    
    Manual Integer FKs (writable): subject_id, encounter_id, performer_id
    Resolved Fields (read-only): subject, encounter, performer
    """
    # Resolved read-only fields
    subject = serializers.SerializerMethodField(read_only=True)
    encounter = serializers.SerializerMethodField(read_only=True)
    performer = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Observation
        fields = [
            'observation_id',
            # Foreign Key IDs (writable)
            'subject_id',
            'encounter_id',
            'performer_id',
            'specimen_id',
            'device_id',
            'derived_from_id',
            'focus_id',
            'has_member_id',
            # Resolved foreign keys (read-only)
            'subject',
            'encounter',
            'performer',
            # Core fields
            'code',
            'category',
            'body_site',
            'method',
            'interpretation',
            'data_absent_reason',
            'based_on',
            'part_of',
            'note',
            # Value fields
            'value_string',
            'value_boolean',
            'value_integer',
            'value_quantity',
            'value_codeableconcept',
            'value_datetime',
            'value_time',
            'value_period_start',
            'value_period_end',
            'value_ratio',
            'value_sampled_data',
            'value_range_low',
            'value_range_high',
            # Component fields
            'component_code',
            'component_value_quantity',
            'component_value_codeableconcept',
            'component_value_string',
            'component_value_boolean',
            'component_value_integer',
            'component_value_range_low',
            'component_value_range_high',
            'component_value_ratio',
            'component_value_sampled_data',
            'component_value_time',
            'component_value_datetime',
            'component_value_period_start',
            'component_value_period_end',
            'component_data_absent_reason',
            'component_interpretation',
            # Component reference range fields
            'component_reference_range_type',
            'component_reference_range_text',
            'component_reference_range_low',
            'component_reference_range_high',
            'component_reference_range_age_low',
            'component_reference_range_age_high',
            'component_reference_range_applies_to',
            # Reference range fields
            'reference_range_low',
            'reference_range_high',
            'reference_range_type',
            'reference_range_applies_to',
            'reference_range_age_low',
            'reference_range_age_high',
            'reference_range_text',
            # Effective fields
            'effective_datetime',
            'effective_period_start',
            'effective_period_end',
            'effective_timing',
            'effective_instant',
            'issued',
        ]
    
    def get_subject(self, obj):
        """Resolve patient reference using direct ORM."""
        if not obj.subject_id:
            return None
        try:
            patient = Patient.objects.get(id=obj.subject_id)
            return {
                "id": patient.id,
                "patient_id": patient.patient_id,
                "name": f"{patient.first_name} {patient.last_name}"
            }
        except Patient.DoesNotExist:
            return None
    
    def get_encounter(self, obj):
        """Resolve encounter reference using direct ORM."""
        if not obj.encounter_id:
            return None
        try:
            encounter = Encounter.objects.get(encounter_id=obj.encounter_id)
            return {
                "encounter_id": encounter.encounter_id,
                "identifier": encounter.identifier,
                "status": encounter.status
            }
        except Encounter.DoesNotExist:
            return None
    
    def get_performer(self, obj):
        """Resolve practitioner reference using direct ORM."""
        if not obj.performer_id:
            return None
        try:
            practitioner = Practitioner.objects.get(practitioner_id=obj.performer_id)
            return {
                "practitioner_id": practitioner.practitioner_id,
                "name": f"{practitioner.first_name} {practitioner.last_name}"
            }
        except Practitioner.DoesNotExist:
            return None


class ChargeItemSerializer(serializers.ModelSerializer):
    """
    Serializer for ChargeItem model with resolved foreign key references.
    
    Manual Integer FKs (writable): subject_id, account_id, performing_organization_id, 
                                    requesting_organization_id, performer_actor_id, enterer_id
    Resolved Fields (read-only): subject, account, performing_organization, 
                                  requesting_organization, performer_actor, enterer
    """
    # Resolved read-only fields
    subject = serializers.SerializerMethodField(read_only=True)
    account = serializers.SerializerMethodField(read_only=True)
    performing_organization = serializers.SerializerMethodField(read_only=True)
    requesting_organization = serializers.SerializerMethodField(read_only=True)
    performer_actor = serializers.SerializerMethodField(read_only=True)
    enterer = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ChargeItem
        fields = [
            'chargeitem_id',
            # Foreign Key IDs (writable)
            'subject_id',
            'account_id',
            'context_id',
            'partof_id',
            'performing_organization_id',
            'requesting_organization_id',
            'performer_actor_id',
            'enterer_id',
            'cost_center_id',
            # Resolved foreign keys (read-only)
            'subject',
            'account',
            'performing_organization',
            'requesting_organization',
            'performer_actor',
            'enterer',
            # Core fields
            'code',
            'definition_uri',
            'definition_canonical',
            # Occurrence fields
            'occurrence_datetime',
            'occurrence_period_start',
            'occurrence_period_end',
            'entered_date',
            'performer_function',
            # Bodysite fields
            'bodysite_code',
            'bodysite_system',
            # Price override fields
            'factor_override',
            'price_override_value',
            'price_override_currency',
            'override_reason',
            # Reason fields
            'reason_code',
            'reason_system',
            # Reference fields
            'service_reference',
            'product_reference',
            'product_codeableconcept',
            # Quantity fields
            'quantity_value',
            'quantity_unit',
            'supporting_information',
            'note',
        ]
    
    def get_subject(self, obj):
        """Resolve patient reference using direct ORM."""
        if not obj.subject_id:
            return None
        try:
            patient = Patient.objects.get(id=obj.subject_id)
            return {
                "id": patient.id,
                "patient_id": patient.patient_id,
                "name": f"{patient.first_name} {patient.last_name}"
            }
        except Patient.DoesNotExist:
            return None
    
    def get_account(self, obj):
        """Return account ID - no ACL available yet."""
        return {"account_id": obj.account_id} if obj.account_id else None
    
    def get_performing_organization(self, obj):
        """Resolve organization using direct ORM."""
        if not obj.performing_organization_id:
            return None
        try:
            org = Organization.objects.get(organization_id=obj.performing_organization_id)
            return {
                "organization_id": org.organization_id,
                "name": org.name
            }
        except Organization.DoesNotExist:
            return None
    
    def get_requesting_organization(self, obj):
        """Resolve organization using direct ORM."""
        if not obj.requesting_organization_id:
            return None
        try:
            org = Organization.objects.get(organization_id=obj.requesting_organization_id)
            return {
                "organization_id": org.organization_id,
                "name": org.name
            }
        except Organization.DoesNotExist:
            return None
    
    def get_performer_actor(self, obj):
        """Resolve practitioner using direct ORM."""
        if not obj.performer_actor_id:
            return None
        try:
            practitioner = Practitioner.objects.get(practitioner_id=obj.performer_actor_id)
            return {
                "practitioner_id": practitioner.practitioner_id,
                "name": f"{practitioner.first_name} {practitioner.last_name}"
            }
        except Practitioner.DoesNotExist:
            return None
    
    def get_enterer(self, obj):
        """Resolve enterer using direct ORM."""
        if not obj.enterer_id:
            return None
        try:
            practitioner = Practitioner.objects.get(practitioner_id=obj.enterer_id)
            return {
                "practitioner_id": practitioner.practitioner_id,
                "name": f"{practitioner.first_name} {practitioner.last_name}"
            }
        except Practitioner.DoesNotExist:
            return None


class ChargeItemDefinitionSerializer(serializers.ModelSerializer):
    """
    Serializer for ChargeItemDefinition model.
    
    Note: Self-referential IDs (partOf_id, replaces_id) are left as integers 
    for now as they reference the same model type.
    """
    class Meta:
        model = ChargeItemDefinition
        fields = [
            'chargeitemdefinition_id',
            # Foreign Key IDs (self-referential)
            'partOf_id',
            'replaces_id',
            # Metadata fields
            'url',
            'version',
            'title',
            'derivedFromUri',
            'experimental',
            'date',
            'publisher',
            # Contact fields
            'contact_name',
            'contact_telecom',
            'description',
            # Use context fields
            'usecontext_code',
            'usecontext_value',
            # Jurisdiction fields
            'jurisdiction_code',
            'jurisdiction_system',
            'copyright',
            'approvalDate',
            'lastReviewDate',
            # Effective period fields
            'effectivePeriod_start',
            'effectivePeriod_end',
            'code',
            'instance_reference',
            # Applicability fields
            'applicability_description',
            'applicability_language',
            'applicability_expression',
            # Property group price component fields
            'propertyGroup_priceComponent_type',
            'propertyGroup_priceComponent_code',
            'propertyGroup_priceComponent_factor',
            'propertyGroup_priceComponent_amount_value',
            'propertyGroup_priceComponent_amount_currency',
            # Property group applicability fields
            'propertyGroup_applicability_description',
            'propertyGroup_applicability_language',
            'propertyGroup_applicability_expression',
        ]