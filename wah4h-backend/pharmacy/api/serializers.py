"""
pharmacy/api/serializers.py

CQRS-Lite Serializers for Pharmacy Module
Architecture Pattern: Input/Output Serializers (Command-Query Separation)

Context: Philippine LGU Hospital System
- Input Serializers: Validate and transform API requests
- Output Serializers: Format responses as DTOs
- Nested Serializers: Handle MedicationRequest/Administration with Dosages
"""

from rest_framework import serializers
from pharmacy.models import (
    Inventory,
    MedicationRequest,
    MedicationRequestDosage,
    MedicationAdministration,
    MedicationAdministrationDosage
)


# ============================================================================
# INVENTORY SERIALIZERS
# ============================================================================

class InventoryInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for creating/updating Inventory items.
    Validates all required fields and business rules.
    """
    
    class Meta:
        model = Inventory
        fields = [
            'item_code',
            'item_name',
            'category',
            'batch_number',
            'current_stock',
            'reorder_level',
            'unit_of_measure',
            'unit_cost',
            'status',
            'expiry_date',
            'last_restocked_datetime',
            'created_by'
        ]
    
    def validate_item_code(self, value):
        """Ensure item_code is unique for new items."""
        if not self.instance:  # Creating new item
            if Inventory.objects.filter(item_code=value).exists():
                raise serializers.ValidationError(
                    f"Item with code '{value}' already exists"
                )
        return value
    
    def validate_current_stock(self, value):
        """Ensure stock is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative")
        return value


class InventoryOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for Inventory items.
    Returns complete inventory data as DTO.
    """
    
    class Meta:
        model = Inventory
        fields = [
            'inventory_id',
            'item_code',
            'item_name',
            'category',
            'batch_number',
            'current_stock',
            'reorder_level',
            'unit_of_measure',
            'unit_cost',
            'status',
            'expiry_date',
            'last_restocked_datetime',
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['inventory_id', 'created_at', 'updated_at']


# ============================================================================
# MEDICATION REQUEST SERIALIZERS (with Nested Dosages)
# ============================================================================

class MedicationRequestDosageInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for MedicationRequest dosage instructions.
    Used within nested MedicationRequestInputSerializer.
    """
    
    class Meta:
        model = MedicationRequestDosage
        fields = [
            'dosage_text',
            'dosage_site',
            'dosage_route',
            'dosage_method',
            'dosage_dose_value',
            'dosage_dose_unit',
            'dosage_rate_quantity_value',
            'dosage_rate_quantity_unit',
            'dosage_rate_ratio_numerator',
            'dosage_rate_ratio_denominator',
            'sequence'
        ]


class MedicationRequestDosageOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for MedicationRequest dosage instructions.
    """
    
    class Meta:
        model = MedicationRequestDosage
        fields = [
            'dosage_id',
            'dosage_text',
            'dosage_site',
            'dosage_route',
            'dosage_method',
            'dosage_dose_value',
            'dosage_dose_unit',
            'dosage_rate_quantity_value',
            'dosage_rate_quantity_unit',
            'dosage_rate_ratio_numerator',
            'dosage_rate_ratio_denominator',
            'sequence',
            'created_at'
        ]
        read_only_fields = ['dosage_id', 'created_at']


class MedicationRequestInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for creating MedicationRequest with nested dosages.
    CRITICAL: Accepts dosages as a nested list.
    """
    dosages = MedicationRequestDosageInputSerializer(many=True, required=False)
    
    class Meta:
        model = MedicationRequest
        fields = [
            'identifier',
            'status',
            'subject_id',
            'encounter_id',
            'requester_id',
            'performer_id',
            'recorder_id',
            'based_on_id',
            'insurance_id',
            'reported_reference_id',
            'reason_reference_id',
            'medication_reference',
            'medication_code',
            'medication_display',
            'medication_system',
            'intent',
            'category',
            'priority',
            'do_not_perform',
            'reported_boolean',
            'authored_on',
            'status_reason',
            'reason_code',
            'note',
            'dispense_quantity',
            'dispense_initial_fill_quantity',
            'dispense_initial_fill_duration',
            'dispense_interval',
            'dispense_validity_period_start',
            'dispense_validity_period_end',
            'dispense_repeats_allowed',
            'group_identifier',
            'course_of_therapy_type',
            'instantiates_canonical',
            'instantiates_uri',
            'performer_type',
            'dosages'
        ]
    
    def validate(self, data):
        """Validate required reference fields."""
        required_fields = ['subject_id', 'encounter_id', 'requester_id', 'intent', 'status']
        for field in required_fields:
            if field not in data or not data[field]:
                raise serializers.ValidationError(f"Field '{field}' is required")
        return data


class MedicationRequestOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for MedicationRequest with nested dosages.
    Returns deep DTO with all related dosage instructions.
    """
    dosages = MedicationRequestDosageOutputSerializer(many=True, read_only=True)
    
    class Meta:
        model = MedicationRequest
        fields = [
            'medication_request_id',
            'identifier',
            'status',
            'subject_id',
            'encounter_id',
            'requester_id',
            'performer_id',
            'recorder_id',
            'based_on_id',
            'insurance_id',
            'reported_reference_id',
            'reason_reference_id',
            'medication_reference',
            'medication_code',
            'medication_display',
            'medication_system',
            'intent',
            'category',
            'priority',
            'do_not_perform',
            'reported_boolean',
            'authored_on',
            'status_reason',
            'reason_code',
            'note',
            'dispense_quantity',
            'dispense_initial_fill_quantity',
            'dispense_initial_fill_duration',
            'dispense_interval',
            'dispense_validity_period_start',
            'dispense_validity_period_end',
            'dispense_repeats_allowed',
            'group_identifier',
            'course_of_therapy_type',
            'instantiates_canonical',
            'instantiates_uri',
            'performer_type',
            'created_at',
            'updated_at',
            'dosages'
        ]
        read_only_fields = ['medication_request_id', 'created_at', 'updated_at']


# ============================================================================
# MEDICATION ADMINISTRATION SERIALIZERS (with Nested Dosage)
# ============================================================================

class MedicationAdministrationDosageInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for MedicationAdministration dosage.
    Used within nested MedicationAdministrationInputSerializer.
    """
    
    class Meta:
        model = MedicationAdministrationDosage
        fields = [
            'dosage_text',
            'dosage_site',
            'dosage_route',
            'dosage_method',
            'dosage_dose_value',
            'dosage_dose_unit',
            'dosage_rate_quantity_value',
            'dosage_rate_quantity_unit',
            'dosage_rate_ratio_numerator',
            'dosage_rate_ratio_denominator'
        ]


class MedicationAdministrationDosageOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for MedicationAdministration dosage.
    """
    
    class Meta:
        model = MedicationAdministrationDosage
        fields = [
            'dosage_id',
            'dosage_text',
            'dosage_site',
            'dosage_route',
            'dosage_method',
            'dosage_dose_value',
            'dosage_dose_unit',
            'dosage_rate_quantity_value',
            'dosage_rate_quantity_unit',
            'dosage_rate_ratio_numerator',
            'dosage_rate_ratio_denominator',
            'created_at'
        ]
        read_only_fields = ['dosage_id', 'created_at']


class MedicationAdministrationInputSerializer(serializers.ModelSerializer):
    """
    Input serializer for creating MedicationAdministration with nested dosage.
    CRITICAL: Accepts dosage as a nested object and inventory deduction fields.
    """
    dosage = MedicationAdministrationDosageInputSerializer(required=False)
    inventory_item_code = serializers.CharField(required=False, write_only=True)
    quantity_used = serializers.IntegerField(required=False, write_only=True)
    
    class Meta:
        model = MedicationAdministration
        fields = [
            'identifier',
            'status',
            'subject_id',
            'context_id',
            'performer_actor_id',
            'request_id',
            'part_of_id',
            'device_id',
            'event_history_id',
            'reason_reference_id',
            'medication_reference',
            'medication_code',
            'medication_display',
            'medication_system',
            'instantiates_uri',
            'status_reason',
            'category',
            'effective_datetime',
            'effective_period_start',
            'effective_period_end',
            'performer_function',
            'reason_code',
            'note',
            'dosage',
            'inventory_item_code',
            'quantity_used'
        ]
    
    def validate(self, data):
        """Validate required fields."""
        required_fields = ['subject_id', 'status', 'effective_datetime']
        for field in required_fields:
            if field not in data or not data[field]:
                raise serializers.ValidationError(f"Field '{field}' is required")
        return data


class MedicationAdministrationOutputSerializer(serializers.ModelSerializer):
    """
    Output serializer for MedicationAdministration with nested dosage.
    Returns deep DTO with dosage information.
    """
    dosage = MedicationAdministrationDosageOutputSerializer(read_only=True)
    
    class Meta:
        model = MedicationAdministration
        fields = [
            'medication_administration_id',
            'identifier',
            'status',
            'subject_id',
            'context_id',
            'performer_actor_id',
            'request_id',
            'part_of_id',
            'device_id',
            'event_history_id',
            'reason_reference_id',
            'medication_reference',
            'medication_code',
            'medication_display',
            'medication_system',
            'instantiates_uri',
            'status_reason',
            'category',
            'effective_datetime',
            'effective_period_start',
            'effective_period_end',
            'performer_function',
            'reason_code',
            'note',
            'created_at',
            'updated_at',
            'dosage'
        ]
        read_only_fields = ['medication_administration_id', 'created_at', 'updated_at']


# ============================================================================
# STOCK UPDATE SERIALIZER
# ============================================================================

class StockUpdateInputSerializer(serializers.Serializer):
    """
    Input serializer for manual stock updates.
    Used for add/subtract operations on inventory.
    """
    item_code = serializers.CharField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)
    operation = serializers.ChoiceField(choices=['add', 'subtract'], required=True)
    
    def validate_quantity(self, value):
        """Ensure quantity is positive."""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero")
        return value
