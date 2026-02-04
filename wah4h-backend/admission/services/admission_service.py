"""
admission/services/admission_service.py

Write-Only Service Layer for Admission Module.
Handles state changes (Creates/Updates) for Encounters and Procedures.

Architecture Pattern: Fortress Pattern - Strict Decoupling
- External validation via ACL helpers only (no direct model imports from other apps)
- Atomic transactions for complex operations
- ValidationError for invalid inputs
"""

from typing import Dict, Any, List, Optional
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist

# Internal models (same app - allowed)
from admission.models import Encounter, Procedure, ProcedurePerformer

# External ACL imports (Fortress Pattern - read-only validation)
from patients.services.patient_acl import validate_patient_exists
from accounts.services.accounts_acl import PractitionerACL, OrganizationACL


class EncounterService:
    """
    Write-Only Service for Encounter management.
    Handles creation and status updates of healthcare encounters.
    """
    
    @staticmethod
    def create_encounter(data: Dict[str, Any]) -> Encounter:
        """
        Create a new healthcare encounter.
        
        Args:
            data: Dictionary containing encounter fields
                Required: subject_id (int)
                Optional: service_provider_id, participant_individual_id, etc.
        
        Returns:
            Created Encounter instance
        
        Raises:
            ValidationError: If required fields missing or referenced entities don't exist
        """
        # Validate required fields
        subject_id = data.get('subject_id')
        if not subject_id:
            raise ValidationError("subject_id is required")
        
        # Validate Patient exists (Fortress Pattern - via ACL)
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id {subject_id} does not exist")
        
        # Validate Organization if provided (Fortress Pattern - via ACL)
        service_provider_id = data.get('service_provider_id')
        if service_provider_id:
            if not OrganizationACL.validate_organization_exists(service_provider_id):
                raise ValidationError(f"Organization with id {service_provider_id} does not exist")
        
        # Validate Practitioner if provided (Fortress Pattern - via ACL)
        participant_individual_id = data.get('participant_individual_id')
        if participant_individual_id:
            if not PractitionerACL.validate_practitioner_exists(participant_individual_id):
                raise ValidationError(f"Practitioner with id {participant_individual_id} does not exist")
        
        # Create Encounter
        encounter = Encounter.objects.create(**data)
        return encounter
    
    @staticmethod
    def update_encounter_status(encounter_id: int, status: str) -> Encounter:
        """
        Update the status of an existing encounter.
        
        Args:
            encounter_id: Primary key of the encounter
            status: New status value
        
        Returns:
            Updated Encounter instance
        
        Raises:
            ValidationError: If encounter not found
        """
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
            encounter.status = status
            encounter.save(update_fields=['status', 'updated_at'])
            return encounter
        except ObjectDoesNotExist:
            raise ValidationError(f"Encounter with id {encounter_id} does not exist")


class ProcedureService:
    """
    Write-Only Service for Procedure management.
    Handles recording of medical procedures with performers.
    """
    
    @staticmethod
    @transaction.atomic
    def record_procedure(data: Dict[str, Any], performers: Optional[List[Dict[str, Any]]] = None) -> Procedure:
        """
        Record a new medical procedure with optional performers.
        
        Uses atomic transaction to ensure all-or-nothing creation
        (Procedure + ProcedurePerformer records).
        
        Args:
            data: Dictionary containing procedure fields
                Required: encounter_id, subject_id
            performers: Optional list of performer dictionaries
                Each dict should contain: performer_actor_id, performer_function_code, etc.
        
        Returns:
            Created Procedure instance (with related performers)
        
        Raises:
            ValidationError: If validation fails or data inconsistencies detected
        """
        # Validate required fields
        encounter_id = data.get('encounter_id')
        subject_id = data.get('subject_id')
        
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        if not subject_id:
            raise ValidationError("subject_id is required")
        
        # Validate Encounter exists (internal to admission app)
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Encounter with id {encounter_id} does not exist")
        
        # Validate Patient exists (Fortress Pattern - via ACL)
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id {subject_id} does not exist")
        
        # Verify patient matches encounter's patient (data consistency check)
        if encounter.subject_id != subject_id:
            raise ValidationError(
                f"Patient mismatch: Procedure subject_id {subject_id} does not match "
                f"Encounter subject_id {encounter.subject_id}"
            )
        
        # Extract encounter_id for ForeignKey relationship
        encounter_instance = data.pop('encounter_id', None)
        
        # Create Procedure (atomic transaction ensures rollback on failure)
        procedure = Procedure.objects.create(encounter=encounter, **data)
        
        # Create ProcedurePerformer records if provided
        if performers:
            for performer_data in performers:
                # Validate Practitioner if performer_actor_id provided
                performer_actor_id = performer_data.get('performer_actor_id')
                if performer_actor_id:
                    if not PractitionerACL.validate_practitioner_exists(performer_actor_id):
                        raise ValidationError(f"Practitioner with id {performer_actor_id} does not exist")
                
                # Validate Organization if performer_on_behalf_of_id provided
                performer_on_behalf_of_id = performer_data.get('performer_on_behalf_of_id')
                if performer_on_behalf_of_id:
                    if not OrganizationACL.validate_organization_exists(performer_on_behalf_of_id):
                        raise ValidationError(f"Organization with id {performer_on_behalf_of_id} does not exist")
                
                ProcedurePerformer.objects.create(
                    procedure=procedure,
                    **performer_data
                )
        
        return procedure
