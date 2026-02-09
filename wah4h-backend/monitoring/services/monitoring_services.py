"""
monitoring/services/monitoring_services.py

Write-Only Service Layer for the Monitoring Module.
Fortress Pattern - Write Operations Only.

Architecture Pattern: Fortress Pattern - Write Layer
- Handles all CREATE/UPDATE/DELETE operations
- Validates using ACLs from external modules
- Uses atomic transactions for data integrity
- NO read operations (use monitoring_acl.py instead)

Context: Philippine LGU Hospital System
"""

from typing import Dict, Any, List, Optional
from django.db import transaction
from django.core.exceptions import ValidationError

from monitoring.models import Observation, ObservationComponent, ChargeItem
from patients.services.patient_acl import validate_patient_exists
from admission.services.admission_acl import EncounterACL
from accounts.models import Practitioner, Organization


class ObservationService:
    """
    Write-Only Service for Observation records.
    
    Handles clinical observations (vital signs, lab results, measurements)
    with nested component support (e.g., Blood Pressure: Systolic/Diastolic).
    """
    
    @staticmethod
    @transaction.atomic
    def record_observation(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new observation record with optional nested components.
        
        Critical: This method supports multi-component observations
        (e.g., Blood Pressure with Systolic/Diastolic components).
        
        Args:
            data: Dictionary containing observation data
                Required fields:
                    - subject_id (int): Patient ID
                    - encounter_id (int): Encounter ID
                    - code (str): Observation code (e.g., 'vital-signs')
                    - status (str): Observation status
                Optional fields:
                    - category (str): Observation category
                    - performer_id (int): Practitioner ID
                    - effective_datetime (datetime): When observed
                    - value_quantity (decimal): Primary value
                    - value_string (str): String value
                    - value_codeableconcept (str): Coded value
                    - interpretation (str): Clinical interpretation
                    - note (str): Additional notes
                    - reference_range_low (str): Lower reference limit
                    - reference_range_high (str): Upper reference limit
                    - components (list): List of component dictionaries
                        Each component contains:
                            - code (str): Component code
                            - value_quantity (decimal): Component value
                            - value_string (str): Component string value
                            - interpretation (str): Component interpretation
                            - reference_range_low (str): Component lower limit
                            - reference_range_high (str): Component upper limit
                
        Returns:
            Dictionary with observation_id and status
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not data.get('subject_id'):
            raise ValidationError("subject_id is required")
        if not data.get('encounter_id'):
            raise ValidationError("encounter_id is required")
        if not data.get('code'):
            raise ValidationError("code is required")
        if not data.get('status'):
            raise ValidationError("status is required")
        
        # Validate external references via ACLs
        if not validate_patient_exists(data['subject_id']):
            raise ValidationError(f"Invalid subject_id: {data['subject_id']}")
        
        if not EncounterACL.validate_encounter_exists(data['encounter_id']):
            raise ValidationError(f"Invalid encounter_id: {data['encounter_id']}")
        
        # Optional: Validate performer if provided
        if data.get('performer_id'):
            if not Practitioner.objects.filter(practitioner_id=data['performer_id']).exists():
                raise ValidationError(f"Invalid performer_id: {data['performer_id']}")
        
        # Create Observation header
        observation = Observation.objects.create(
            identifier=data.get('identifier'),  # Accept identifier from request
            subject_id=data['subject_id'],
            encounter_id=data['encounter_id'],
            performer_id=data.get('performer_id'),
            code=data['code'],
            status=data['status'],
            category=data.get('category'),
            body_site=data.get('body_site'),
            method=data.get('method'),
            interpretation=data.get('interpretation'),
            data_absent_reason=data.get('data_absent_reason'),
            note=data.get('note'),
            # Value fields (polymorphic)
            value_string=data.get('value_string'),
            value_boolean=data.get('value_boolean'),
            value_integer=data.get('value_integer'),
            value_quantity=data.get('value_quantity'),
            value_codeableconcept=data.get('value_codeableconcept'),
            value_datetime=data.get('value_datetime'),
            value_time=data.get('value_time'),
            value_period_start=data.get('value_period_start'),
            value_period_end=data.get('value_period_end'),
            value_ratio=data.get('value_ratio'),
            value_sampled_data=data.get('value_sampled_data'),
            value_range_low=data.get('value_range_low'),
            value_range_high=data.get('value_range_high'),
            # Reference range fields
            reference_range_low=data.get('reference_range_low'),
            reference_range_high=data.get('reference_range_high'),
            reference_range_type=data.get('reference_range_type'),
            reference_range_applies_to=data.get('reference_range_applies_to'),
            reference_range_age_low=data.get('reference_range_age_low'),
            reference_range_age_high=data.get('reference_range_age_high'),
            reference_range_text=data.get('reference_range_text'),
            # Effective fields
            effective_datetime=data.get('effective_datetime'),
            effective_period_start=data.get('effective_period_start'),
            effective_period_end=data.get('effective_period_end'),
            effective_timing=data.get('effective_timing'),
            effective_instant=data.get('effective_instant'),
            issued=data.get('issued'),
            # Additional references
            specimen_id=data.get('specimen_id'),
            device_id=data.get('device_id'),
            derived_from_id=data.get('derived_from_id'),
            focus_id=data.get('focus_id'),
            has_member_id=data.get('has_member_id'),
            based_on=data.get('based_on'),
            part_of=data.get('part_of'),
        )
        
        # Create nested ObservationComponent records (critical for multi-component observations)
        components_created = 0
        if 'components' in data and isinstance(data['components'], list):
            for component_data in data['components']:
                if not component_data.get('code'):
                    continue  # Skip invalid components
                
                ObservationComponent.objects.create(
                    observation=observation,
                    code=component_data['code'],
                    value_quantity=component_data.get('value_quantity'),
                    value_codeableconcept=component_data.get('value_codeableconcept'),
                    value_string=component_data.get('value_string'),
                    value_boolean=component_data.get('value_boolean'),
                    value_integer=component_data.get('value_integer'),
                    value_range_low=component_data.get('value_range_low'),
                    value_range_high=component_data.get('value_range_high'),
                    value_ratio=component_data.get('value_ratio'),
                    value_sampled_data=component_data.get('value_sampled_data'),
                    value_time=component_data.get('value_time'),
                    value_datetime=component_data.get('value_datetime'),
                    value_period_start=component_data.get('value_period_start'),
                    value_period_end=component_data.get('value_period_end'),
                    data_absent_reason=component_data.get('data_absent_reason'),
                    interpretation=component_data.get('interpretation'),
                    reference_range_type=component_data.get('reference_range_type'),
                    reference_range_text=component_data.get('reference_range_text'),
                    reference_range_low=component_data.get('reference_range_low'),
                    reference_range_high=component_data.get('reference_range_high'),
                    reference_range_age_low=component_data.get('reference_range_age_low'),
                    reference_range_age_high=component_data.get('reference_range_age_high'),
                    reference_range_applies_to=component_data.get('reference_range_applies_to'),
                )
                components_created += 1
        
        return {
            'observation_id': observation.observation_id,
            'status': 'success',
            'components_created': components_created,
            'message': f'Observation created successfully with {components_created} components'
        }
    
    @staticmethod
    @transaction.atomic
    def update_observation(observation_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing observation record.
        
        Args:
            observation_id: Primary key of the observation
            data: Dictionary containing fields to update
        
        Returns:
            Dictionary with observation_id and status
            
        Raises:
            ValidationError: If observation not found or validation fails
        """
        try:
            observation = Observation.objects.get(observation_id=observation_id)
        except Observation.DoesNotExist:
            raise ValidationError(f"Observation {observation_id} not found")
        
        # Update allowed fields
        updatable_fields = [
            'status', 'category', 'body_site', 'method', 'interpretation',
            'data_absent_reason', 'note', 'value_string', 'value_boolean',
            'value_integer', 'value_quantity', 'value_codeableconcept',
            'value_datetime', 'value_time', 'reference_range_low',
            'reference_range_high', 'reference_range_text', 'issued'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(observation, field, data[field])
        
        observation.save()
        
        return {
            'observation_id': observation.observation_id,
            'status': 'success',
            'message': 'Observation updated successfully'
        }


class ChargeItemService:
    """
    Write-Only Service for ChargeItem records.
    
    Handles billable services and products charged to patients/encounters.
    """
    
    @staticmethod
    @transaction.atomic
    def record_charge_item(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new charge item record.
        
        Args:
            data: Dictionary containing charge item data
                Required fields:
                    - subject_id (int): Patient ID
                    - code (str): Charge item code (service/product)
                    - status (str): Charge item status
                Optional fields:
                    - account_id (int): Billing account ID
                    - context_id (int): Encounter/Episode ID
                    - performing_organization_id (int): Organization ID
                    - requesting_organization_id (int): Organization ID
                    - performer_actor_id (int): Practitioner ID
                    - enterer_id (int): Practitioner ID who entered the charge
                    - occurrence_datetime (datetime): When service occurred
                    - quantity_value (decimal): Quantity of service/product
                    - quantity_unit (str): Unit of measure
                    - price_override_value (decimal): Override price
                    - price_override_currency (str): Currency code
                    - override_reason (str): Reason for price override
                    - product_codeableconcept (str): Product code
                    - note (str): Additional notes
                
        Returns:
            Dictionary with chargeitem_id and status
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not data.get('subject_id'):
            raise ValidationError("subject_id is required")
        if not data.get('code'):
            raise ValidationError("code is required")
        if not data.get('status'):
            raise ValidationError("status is required")
        
        # Validate external references via ACLs
        if not validate_patient_exists(data['subject_id']):
            raise ValidationError(f"Invalid subject_id: {data['subject_id']}")
        
        # Optional: Validate account_id if provided
        # Note: BillingAccountACL not available yet, skip for now
        
        # Optional: Validate context_id (encounter) if provided
        if data.get('context_id'):
            if not EncounterACL.validate_encounter_exists(data['context_id']):
                raise ValidationError(f"Invalid context_id: {data['context_id']}")
        
        # Optional: Validate organizations if provided
        if data.get('performing_organization_id'):
            if not Organization.objects.filter(organization_id=data['performing_organization_id']).exists():
                raise ValidationError(f"Invalid performing_organization_id: {data['performing_organization_id']}")
        
        if data.get('requesting_organization_id'):
            if not Organization.objects.filter(organization_id=data['requesting_organization_id']).exists():
                raise ValidationError(f"Invalid requesting_organization_id: {data['requesting_organization_id']}")
        
        # Optional: Validate practitioners if provided
        if data.get('performer_actor_id'):
            if not Practitioner.objects.filter(practitioner_id=data['performer_actor_id']).exists():
                raise ValidationError(f"Invalid performer_actor_id: {data['performer_actor_id']}")
        
        if data.get('enterer_id'):
            if not Practitioner.objects.filter(practitioner_id=data['enterer_id']).exists():
                raise ValidationError(f"Invalid enterer_id: {data['enterer_id']}")
        
        # Create ChargeItem
        charge_item = ChargeItem.objects.create(
            subject_id=data['subject_id'],
            account_id=data.get('account_id'),
            context_id=data.get('context_id'),
            partof_id=data.get('partof_id'),
            performing_organization_id=data.get('performing_organization_id'),
            requesting_organization_id=data.get('requesting_organization_id'),
            performer_actor_id=data.get('performer_actor_id'),
            enterer_id=data.get('enterer_id'),
            cost_center_id=data.get('cost_center_id'),
            code=data['code'],
            status=data['status'],
            definition_uri=data.get('definition_uri'),
            definition_canonical=data.get('definition_canonical'),
            occurrence_datetime=data.get('occurrence_datetime'),
            occurrence_period_start=data.get('occurrence_period_start'),
            occurrence_period_end=data.get('occurrence_period_end'),
            entered_date=data.get('entered_date'),
            performer_function=data.get('performer_function'),
            bodysite_code=data.get('bodysite_code'),
            bodysite_system=data.get('bodysite_system'),
            factor_override=data.get('factor_override'),
            price_override_value=data.get('price_override_value'),
            price_override_currency=data.get('price_override_currency'),
            override_reason=data.get('override_reason'),
            reason_code=data.get('reason_code'),
            reason_system=data.get('reason_system'),
            service_reference=data.get('service_reference'),
            product_reference=data.get('product_reference'),
            product_codeableconcept=data.get('product_codeableconcept'),
            quantity_value=data.get('quantity_value'),
            quantity_unit=data.get('quantity_unit'),
            supporting_information=data.get('supporting_information'),
            note=data.get('note'),
        )
        
        return {
            'chargeitem_id': charge_item.chargeitem_id,
            'status': 'success',
            'message': 'ChargeItem created successfully'
        }
    
    @staticmethod
    @transaction.atomic
    def update_charge_item(chargeitem_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update an existing charge item record.
        
        Args:
            chargeitem_id: Primary key of the charge item
            data: Dictionary containing fields to update
        
        Returns:
            Dictionary with chargeitem_id and status
            
        Raises:
            ValidationError: If charge item not found or validation fails
        """
        try:
            charge_item = ChargeItem.objects.get(chargeitem_id=chargeitem_id)
        except ChargeItem.DoesNotExist:
            raise ValidationError(f"ChargeItem {chargeitem_id} not found")
        
        # Update allowed fields
        updatable_fields = [
            'status', 'quantity_value', 'quantity_unit', 'price_override_value',
            'price_override_currency', 'override_reason', 'note', 'entered_date'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(charge_item, field, data[field])
        
        charge_item.save()
        
        return {
            'chargeitem_id': charge_item.chargeitem_id,
            'status': 'success',
            'message': 'ChargeItem updated successfully'
        }


__all__ = [
    'ObservationService',
    'ChargeItemService',
]
