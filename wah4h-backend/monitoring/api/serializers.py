"""
monitoring/api/serializers.py

CQRS-Lite Serializers for the Monitoring Module.
Fortress Pattern - API Layer.

Architecture Pattern: CQRS-Lite (Command Query Responsibility Segregation - Light)
- Input Serializers: Used for CREATE/UPDATE operations (Write)
- Output Serializers: Used for READ operations (Read)
- Separation of concerns between command and query models

Context: Philippine LGU Hospital System
"""

from rest_framework import serializers
from typing import List, Dict, Any


# ============================================================================
# OBSERVATION COMPONENT SERIALIZERS
# ============================================================================

class ObservationComponentInputSerializer(serializers.Serializer):
    """
    Input serializer for nested ObservationComponent records.
    
    Used when creating/updating observations with multiple components
    (e.g., Blood Pressure: Systolic/Diastolic).
    """
    code = serializers.CharField(required=True, max_length=100)
    
    # Component Value Fields (Polymorphic - only one should be provided)
    value_quantity = serializers.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        required=False, 
        allow_null=True
    )
    value_codeableconcept = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    value_string = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    value_boolean = serializers.BooleanField(required=False, allow_null=True)
    value_integer = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    value_datetime = serializers.DateTimeField(required=False, allow_null=True)
    
    # Component Interpretation
    interpretation = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    data_absent_reason = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Component Reference Range
    reference_range_low = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    reference_range_high = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    reference_range_text = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True
    )


class ObservationComponentOutputSerializer(serializers.Serializer):
    """
    Output serializer for ObservationComponent records.
    
    Returns read-only DTOs for components.
    """
    component_id = serializers.IntegerField(read_only=True)
    code = serializers.CharField(read_only=True)
    value_quantity = serializers.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        read_only=True
    )
    value_codeableconcept = serializers.CharField(read_only=True)
    value_string = serializers.CharField(read_only=True)
    value_boolean = serializers.BooleanField(read_only=True)
    value_integer = serializers.CharField(read_only=True)
    value_datetime = serializers.DateTimeField(read_only=True)
    interpretation = serializers.CharField(read_only=True)
    data_absent_reason = serializers.CharField(read_only=True)
    reference_range_low = serializers.CharField(read_only=True)
    reference_range_high = serializers.CharField(read_only=True)
    reference_range_text = serializers.CharField(read_only=True)


# ============================================================================
# OBSERVATION SERIALIZERS
# ============================================================================

class ObservationInputSerializer(serializers.Serializer):
    """
    Input serializer for creating/updating Observation records.
    
    CRITICAL: Supports nested components list for multi-component observations.
    """
    # Required Fields
    identifier = serializers.CharField(required=True, max_length=100)
    subject_id = serializers.IntegerField(required=True)
    encounter_id = serializers.IntegerField(required=True)
    code = serializers.CharField(required=True, max_length=100)
    status = serializers.CharField(required=True, max_length=50)
    
    # Optional Core Fields
    category = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    performer_id = serializers.IntegerField(required=False, allow_null=True)
    body_site = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    method = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    interpretation = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    data_absent_reason = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    note = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Value Fields (Polymorphic)
    value_string = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    value_boolean = serializers.BooleanField(required=False, allow_null=True)
    value_integer = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    value_quantity = serializers.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        required=False, 
        allow_null=True
    )
    value_codeableconcept = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    value_datetime = serializers.DateTimeField(required=False, allow_null=True)
    
    # Reference Range Fields
    reference_range_low = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    reference_range_high = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    reference_range_text = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Effective Fields
    effective_datetime = serializers.DateTimeField(required=False, allow_null=True)
    effective_period_start = serializers.DateField(required=False, allow_null=True)
    effective_period_end = serializers.DateField(required=False, allow_null=True)
    issued = serializers.DateTimeField(required=False, allow_null=True)
    
    # CRITICAL: Nested Components List
    components = ObservationComponentInputSerializer(many=True, required=False)
    
    def validate(self, data):
        """
        Validate observation data.
        
        Ensures at least one value field is provided if no components exist.
        """
        has_value = any([
            data.get('value_string'),
            data.get('value_boolean') is not None,
            data.get('value_integer'),
            data.get('value_quantity'),
            data.get('value_codeableconcept'),
            data.get('value_datetime'),
        ])
        
        has_components = data.get('components') and len(data.get('components', [])) > 0
        
        if not has_value and not has_components and not data.get('data_absent_reason'):
            raise serializers.ValidationError(
                "Observation must have either a value, components, or data_absent_reason"
            )
        
        return data


class ObservationOutputSerializer(serializers.Serializer):
    """
    Output serializer for Observation records with nested components.
    
    Returns read-only DTOs for observations with deep component data.
    """
    observation_id = serializers.IntegerField(read_only=True)
    identifier = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    code = serializers.CharField(read_only=True)
    category = serializers.CharField(read_only=True)
    
    # Foreign Key IDs
    subject_id = serializers.IntegerField(read_only=True)
    encounter_id = serializers.IntegerField(read_only=True)
    performer_id = serializers.IntegerField(read_only=True)
    
    # Timestamps
    effective_datetime = serializers.DateTimeField(read_only=True)
    effective_period_start = serializers.DateField(read_only=True)
    effective_period_end = serializers.DateField(read_only=True)
    issued = serializers.DateTimeField(read_only=True)
    
    # Value Fields
    value_string = serializers.CharField(read_only=True)
    value_boolean = serializers.BooleanField(read_only=True)
    value_integer = serializers.CharField(read_only=True)
    value_quantity = serializers.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        read_only=True
    )
    value_codeableconcept = serializers.CharField(read_only=True)
    value_datetime = serializers.DateTimeField(read_only=True)
    
    # Clinical Fields
    interpretation = serializers.CharField(read_only=True)
    note = serializers.CharField(read_only=True)
    body_site = serializers.CharField(read_only=True)
    method = serializers.CharField(read_only=True)
    data_absent_reason = serializers.CharField(read_only=True)
    
    # Reference Range Fields
    reference_range_low = serializers.CharField(read_only=True)
    reference_range_high = serializers.CharField(read_only=True)
    reference_range_text = serializers.CharField(read_only=True)
    
    # CRITICAL: Nested Components
    components = ObservationComponentOutputSerializer(many=True, read_only=True)
    
    # Metadata
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


# ============================================================================
# CHARGE ITEM SERIALIZERS
# ============================================================================

class ChargeItemInputSerializer(serializers.Serializer):
    """
    Input serializer for creating/updating ChargeItem records.
    """
    # Required Fields
    subject_id = serializers.IntegerField(required=True)
    code = serializers.CharField(required=True, max_length=100)
    status = serializers.CharField(required=True, max_length=50)
    
    # Optional Foreign Key Fields
    account_id = serializers.IntegerField(required=False, allow_null=True)
    context_id = serializers.IntegerField(required=False, allow_null=True)
    performing_organization_id = serializers.IntegerField(required=False, allow_null=True)
    requesting_organization_id = serializers.IntegerField(required=False, allow_null=True)
    performer_actor_id = serializers.IntegerField(required=False, allow_null=True)
    enterer_id = serializers.IntegerField(required=False, allow_null=True)
    cost_center_id = serializers.IntegerField(required=False, allow_null=True)
    
    # Optional Core Fields
    definition_uri = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    definition_canonical = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Occurrence Fields
    occurrence_datetime = serializers.DateTimeField(required=False, allow_null=True)
    occurrence_period_start = serializers.DateField(required=False, allow_null=True)
    occurrence_period_end = serializers.DateField(required=False, allow_null=True)
    entered_date = serializers.DateTimeField(required=False, allow_null=True)
    
    performer_function = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Bodysite Fields
    bodysite_code = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    bodysite_system = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Price Fields
    factor_override = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    price_override_value = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        required=False, 
        allow_null=True
    )
    price_override_currency = serializers.CharField(
        max_length=10, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    override_reason = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Reason Fields
    reason_code = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    reason_system = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Product/Service Fields
    service_reference = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    product_reference = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    product_codeableconcept = serializers.CharField(
        max_length=100, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Quantity Fields
    quantity_value = serializers.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        required=False, 
        allow_null=True
    )
    quantity_unit = serializers.CharField(
        max_length=50, 
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    # Additional Fields
    supporting_information = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    note = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True
    )
    
    def validate(self, data):
        """
        Validate charge item data.
        
        Ensures at least one context (account_id or context_id) is provided.
        """
        if not data.get('account_id') and not data.get('context_id'):
            raise serializers.ValidationError(
                "ChargeItem must have either account_id or context_id"
            )
        
        return data


class ChargeItemOutputSerializer(serializers.Serializer):
    """
    Output serializer for ChargeItem records.
    
    Returns read-only DTOs for charge items.
    """
    chargeitem_id = serializers.IntegerField(read_only=True)
    identifier = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    code = serializers.CharField(read_only=True)
    
    # Foreign Key IDs
    subject_id = serializers.IntegerField(read_only=True)
    account_id = serializers.IntegerField(read_only=True)
    context_id = serializers.IntegerField(read_only=True)
    performing_organization_id = serializers.IntegerField(read_only=True)
    requesting_organization_id = serializers.IntegerField(read_only=True)
    performer_actor_id = serializers.IntegerField(read_only=True)
    enterer_id = serializers.IntegerField(read_only=True)
    cost_center_id = serializers.IntegerField(read_only=True)
    
    # Definition Fields
    definition_uri = serializers.CharField(read_only=True)
    definition_canonical = serializers.CharField(read_only=True)
    
    # Timestamps
    occurrence_datetime = serializers.DateTimeField(read_only=True)
    occurrence_period_start = serializers.DateField(read_only=True)
    occurrence_period_end = serializers.DateField(read_only=True)
    entered_date = serializers.DateTimeField(read_only=True)
    
    # Performer Fields
    performer_function = serializers.CharField(read_only=True)
    
    # Bodysite Fields
    bodysite_code = serializers.CharField(read_only=True)
    bodysite_system = serializers.CharField(read_only=True)
    
    # Price Fields
    factor_override = serializers.CharField(read_only=True)
    price_override_value = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    price_override_currency = serializers.CharField(read_only=True)
    override_reason = serializers.CharField(read_only=True)
    
    # Reason Fields
    reason_code = serializers.CharField(read_only=True)
    reason_system = serializers.CharField(read_only=True)
    
    # Product/Service Fields
    service_reference = serializers.CharField(read_only=True)
    product_reference = serializers.CharField(read_only=True)
    product_codeableconcept = serializers.CharField(read_only=True)
    
    # Quantity Fields
    quantity_value = serializers.DecimalField(
        max_digits=12, 
        decimal_places=4, 
        read_only=True
    )
    quantity_unit = serializers.CharField(read_only=True)
    
    # Additional Fields
    supporting_information = serializers.CharField(read_only=True)
    note = serializers.CharField(read_only=True)
    
    # Metadata
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


__all__ = [
    'ObservationComponentInputSerializer',
    'ObservationComponentOutputSerializer',
    'ObservationInputSerializer',
    'ObservationOutputSerializer',
    'ChargeItemInputSerializer',
    'ChargeItemOutputSerializer',
]
