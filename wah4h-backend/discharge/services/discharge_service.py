"""
Discharge Service Layer
=======================
Write operations for Discharge module following Fortress Pattern.

All state changes (creates/updates) for Discharge, Procedure records.
Read operations are handled by discharge_acl.py.

External Dependencies (ACLs):
- patients.services.patient_acl: Patient validation
- admission.services.admission_acl: Encounter validation
"""

from typing import Dict, Any, List, Optional
from django.db import transaction
from django.core.exceptions import ValidationError

# Local model imports (within discharge app)
from discharge.models import Discharge, Procedure, ProcedurePerformer

# Fortress Integration: ACL dependencies
from patients.services import patient_acl
from admission.services import admission_acl


class DischargeService:
    """Service for managing discharge records"""
    
    @staticmethod
    @transaction.atomic
    def finalize_discharge(data: Dict[str, Any]) -> Discharge:
        """
        Create a discharge record with validation.
        
        Args:
            data: Dictionary containing discharge data
                Required keys: patient_id, encounter_id
        
        Returns:
            Created Discharge instance
        
        Raises:
            ValidationError: If validation fails
        """
        # Extract required fields
        patient_id = data.get('patient_id')
        encounter_id = data.get('encounter_id')
        
        # Validate required fields
        if not patient_id:
            raise ValidationError("patient_id is required")
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        
        # Validate patient exists
        if not patient_acl.validate_patient_exists(patient_id):
            raise ValidationError(f"Patient with id={patient_id} does not exist")
        
        # Validate encounter exists
        if not admission_acl.EncounterService.validate_encounter_exists(encounter_id):
            raise ValidationError(f"Encounter with id={encounter_id} does not exist")
        
        # Verify patient-encounter match
        encounter_data = admission_acl.EncounterService.get_encounter_with_patient(encounter_id)
        if not encounter_data:
            raise ValidationError(f"Unable to retrieve encounter {encounter_id}")
        
        if encounter_data.get('subject_id') != patient_id:
            raise ValidationError(
                f"Patient mismatch: Encounter {encounter_id} belongs to patient "
                f"{encounter_data.get('subject_id')}, not patient {patient_id}"
            )
        
        # Create discharge record
        discharge = Discharge.objects.create(**data)
        return discharge


class ProcedureService:
    """Service for managing procedure records"""
    
    @staticmethod
    @transaction.atomic
    def record_procedure(data: Dict[str, Any], performers: Optional[List[Dict[str, Any]]] = None) -> Procedure:
        """
        Create a procedure record with optional performers.
        
        Args:
            data: Dictionary containing procedure data
                Required keys: subject_id, encounter_id
            performers: Optional list of performer dictionaries
        
        Returns:
            Created Procedure instance
        
        Raises:
            ValidationError: If validation fails
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
        
        # Verify patient-encounter match
        encounter_data = admission_acl.EncounterService.get_encounter_with_patient(encounter_id)
        if not encounter_data:
            raise ValidationError(f"Unable to retrieve encounter {encounter_id}")
        
        if encounter_data.get('subject_id') != subject_id:
            raise ValidationError(
                f"Patient mismatch: Encounter {encounter_id} belongs to patient "
                f"{encounter_data.get('subject_id')}, not patient {subject_id}"
            )
        
        # Create procedure record
        procedure = Procedure.objects.create(**data)
        
        # Create performer records if provided
        if performers:
            for performer_data in performers:
                ProcedurePerformer.objects.create(
                    procedure=procedure,
                    **performer_data
                )
        
        return procedure
