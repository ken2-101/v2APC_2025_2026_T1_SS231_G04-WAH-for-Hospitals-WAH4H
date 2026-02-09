"""
Monitoring Service Layer (Write Operations)
============================================
Fortress Pattern: State-changing operations for Monitoring Module.

This service handles CREATE/UPDATE operations for:
- Observations (with Components)
- ChargeItems

Read operations are delegated to monitoring_acl.py.

External Dependencies (ACLs):
- patients.services.patient_acl: Patient validation
- admission.services.admission_acl: Encounter validation
"""

from typing import Dict, List, Optional, Any
from django.db import transaction
from django.core.exceptions import ValidationError

# Local Model Imports (Allowed within module boundary)
from monitoring.models import Observation, ObservationComponent, ChargeItem

# ACL Imports (Fortress Boundary Enforcement)
from patients.services import patient_acl
from admission.services import admission_acl


class ObservationService:
    """
    Service for recording patient observations (vital signs, lab results, etc.).
    Supports multi-component observations (e.g., Blood Pressure: Systolic/Diastolic).
    """
    
    @staticmethod
    @transaction.atomic
    def record_observation(data: Dict[str, Any], components: Optional[List[Dict[str, Any]]] = None) -> Observation:
        """
        Record a new observation with optional components.
        
        Args:
            data: Observation header data (must include subject_id, encounter_id)
            components: Optional list of component data dictionaries
        
        Returns:
            Created Observation instance
        
        Raises:
            ValidationError: If validation fails (patient/encounter not found, mismatch, etc.)
        """
        # Extract required fields
        subject_id = data.get('subject_id')
        encounter_id = data.get('encounter_id')
        
        # Validate required fields
        if not subject_id:
            raise ValidationError("subject_id (patient ID) is required")
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        
        # Validate patient exists
        if not patient_acl.validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id={subject_id} does not exist")
        
        # Validate encounter exists
        if not admission_acl.EncounterService.validate_encounter_exists(encounter_id):
            raise ValidationError(f"Encounter with id={encounter_id} does not exist")
        
        # Verify patient-encounter relationship (prevent data corruption)
        encounter_data = admission_acl.EncounterService.get_encounter_with_patient(encounter_id)
        if not encounter_data:
            raise ValidationError(f"Unable to retrieve encounter {encounter_id}")
        
        if encounter_data['subject_id'] != subject_id:
            raise ValidationError(
                f"Patient mismatch: Encounter {encounter_id} belongs to patient {encounter_data['subject_id']}, "
                f"not patient {subject_id}"
            )
        
        # Create parent Observation
        observation = Observation.objects.create(**data)
        
        # Create child ObservationComponents if provided
        if components:
            for component_data in components:
                ObservationComponent.objects.create(
                    observation=observation,
                    **component_data
                )
        
        return observation


class ChargeItemService:
    """
    Service for recording billable charge items linked to encounters.
    """
    
    @staticmethod
    @transaction.atomic
    def record_charge_item(data: Dict[str, Any]) -> ChargeItem:
        """
        Record a new charge item.
        
        Args:
            data: ChargeItem data (must include subject_id, context_id as encounter_id)
        
        Returns:
            Created ChargeItem instance
        
        Raises:
            ValidationError: If validation fails (patient/encounter not found, mismatch, etc.)
        """
        # Extract required fields
        subject_id = data.get('subject_id')
        context_id = data.get('context_id')  # Encounter ID
        
        # Validate required fields
        if not subject_id:
            raise ValidationError("subject_id (patient ID) is required")
        if not context_id:
            raise ValidationError("context_id (encounter ID) is required")
        
        # Validate patient exists
        if not patient_acl.validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id={subject_id} does not exist")
        
        # Validate encounter exists
        if not admission_acl.EncounterService.validate_encounter_exists(context_id):
            raise ValidationError(f"Encounter with id={context_id} does not exist")
        
        # Verify patient-encounter relationship (prevent data corruption)
        encounter_data = admission_acl.EncounterService.get_encounter_with_patient(context_id)
        if not encounter_data:
            raise ValidationError(f"Unable to retrieve encounter {context_id}")
        
        if encounter_data['subject_id'] != subject_id:
            raise ValidationError(
                f"Patient mismatch: Encounter {context_id} belongs to patient {encounter_data['subject_id']}, "
                f"not patient {subject_id}"
            )
        
        # Create ChargeItem
        charge_item = ChargeItem.objects.create(**data)
        
        return charge_item


__all__ = [
    'ObservationService',
    'ChargeItemService',
]
