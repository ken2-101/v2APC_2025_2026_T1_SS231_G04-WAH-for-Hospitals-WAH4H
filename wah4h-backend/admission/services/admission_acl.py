"""
Anti-Corruption Layer (ACL) for Admission Module
=================================================

Fortress Boundary: Read-Only Interface for External App Communication.

Phase 3 Refactoring (2026-02-04):
- Read-Only Focus: Removed all write operations (moved to admission_service.py)
- Renamed EncounterService -> EncounterACL
- Renamed ProcedureService -> ProcedureACL
- All methods return DTOs (dictionaries), not model instances

External Dependencies:
- patients.services.patient_acl: Patient data operations (Source of Truth)
- accounts.services.accounts_acl: Practitioner, Location, Organization operations
"""

from typing import Optional, Dict, Any, List
from admission.models import Encounter, Procedure

# FORTRESS INTEGRATION: Proxy to Patient Service Layer
from patients.services import patient_acl
# FORTRESS INTEGRATION: Proxy to Accounts Service Layer
from accounts.services import accounts_acl


class PatientACL:
    """
    Patient ACL Proxy - Delegates all operations to patients.services.patient_acl.
    Maintains admission app's interface while decoupling from patient models.
    """
    
    @staticmethod
    def validate_patient_exists(patient_id: int) -> bool:
        return patient_acl.validate_patient_exists(patient_id)
    
    @staticmethod
    def get_patient_summary(patient_id: int) -> Optional[Dict[str, Any]]:
        return patient_acl.get_patient_summary(patient_id)
    
    @staticmethod
    def get_patient_conditions(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return patient_acl.get_patient_conditions(patient_id, encounter_id)
    
    @staticmethod
    def get_patient_allergies(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return patient_acl.get_patient_allergies(patient_id, encounter_id)
    
    @staticmethod
    def search_patients(query: str, limit: int = 10) -> List[Dict[str, Any]]:
        return patient_acl.search_patients(query, limit)


class EncounterACL:
    """
    Read-Only Service for Encounter queries and validation.
    All write operations moved to admission_service.EncounterService.
    """
    
    @staticmethod
    def validate_encounter_exists(encounter_id: int) -> bool:
        """
        Check if an encounter exists in the system.
        
        Args:
            encounter_id: Primary key of the encounter
            
        Returns:
            bool: True if encounter exists, False otherwise
        """
        return Encounter.objects.filter(encounter_id=encounter_id).exists()
    
    @staticmethod
    def get_encounter_with_patient(encounter_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve encounter details with embedded patient summary.
        
        Args:
            encounter_id: Primary key of the encounter
            
        Returns:
            Dictionary with encounter data and patient summary, or None if not found.
            
            DTO Fields:
                - encounter_id (int)
                - identifier (str)
                - status (str)
                - class (str)
                - type (str)
                - subject_id (int): Critical for patient mismatch validation
                - patient (Dict): Embedded patient summary from PatientACL
                - period_start (date)
                - period_end (date)
                - location_id (int|None)
                - service_provider_id (int|None)
                - admit_source (str|None)
                - discharge_disposition (str|None)
                - created_at (datetime)
                - updated_at (datetime)
        """
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
        except Encounter.DoesNotExist:
            return None
        
        patient_data = PatientACL.get_patient_summary(encounter.subject_id)
        
        return {
            'encounter_id': encounter.encounter_id,
            'identifier': encounter.identifier,
            'status': encounter.status,
            'class': encounter.class_field,
            'type': encounter.type,
            'subject_id': encounter.subject_id,
            'patient': patient_data,
            'period_start': encounter.period_start,
            'period_end': encounter.period_end,
            'location_id': encounter.location_id,
            'service_provider_id': encounter.service_provider_id,
            'admit_source': encounter.admit_source,
            'discharge_disposition': encounter.discharge_disposition,
            'created_at': encounter.created_at,
            'updated_at': encounter.updated_at,
        }
    
    @staticmethod
    def get_patient_encounters(patient_id: int) -> List[Dict[str, Any]]:
        """
        Retrieve all encounters for a specific patient.
        
        Args:
            patient_id: Primary key of the patient
            
        Returns:
            List of encounter summary dictionaries, ordered by period_start (descending).
            
            DTO Fields (per encounter):
                - encounter_id (int)
                - identifier (str)
                - status (str)
                - class (str)
                - type (str)
                - period_start (date)
                - period_end (date)
                - admit_source (str|None)
        """
        encounters = Encounter.objects.filter(subject_id=patient_id).order_by('-period_start')
        
        return [
            {
                'encounter_id': e.encounter_id,
                'identifier': e.identifier,
                'status': e.status,
                'class': e.class_field,
                'type': e.type,
                'period_start': e.period_start,
                'period_end': e.period_end,
                'admit_source': e.admit_source,
            }
            for e in encounters
        ]


class ProcedureACL:
    """
    Read-Only Service for Procedure queries.
    All write operations moved to admission_service.ProcedureService.
    """
    
    @staticmethod
    def get_encounter_procedures(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Retrieve all procedures for a specific encounter.
        
        Args:
            encounter_id: Primary key of the encounter
            
        Returns:
            List of procedure dictionaries, ordered by performed_datetime (descending).
            
            DTO Fields (per procedure):
                - procedure_id (int)
                - identifier (str)
                - status (str)
                - code_code (str)
                - code_display (str)
                - performed_datetime (datetime)
                - performed_period_start (date)
                - performed_period_end (date)
                - category_code (str)
                - category_display (str)
                - outcome_code (str)
                - outcome_display (str)
                - note (str)
        """
        procedures = Procedure.objects.filter(encounter_id=encounter_id).order_by('-performed_datetime')
        
        return [
            {
                'procedure_id': p.procedure_id,
                'identifier': p.identifier,
                'status': p.status,
                'code_code': p.code_code,
                'code_display': p.code_display,
                'performed_datetime': p.performed_datetime,
                'performed_period_start': p.performed_period_start,
                'performed_period_end': p.performed_period_end,
                'category_code': p.category_code,
                'category_display': p.category_display,
                'outcome_code': p.outcome_code,
                'outcome_display': p.outcome_display,
                'note': p.note,
            }
            for p in procedures
        ]


class PractitionerACL:
    """
    Practitioner ACL Proxy - Delegates all operations to accounts.services.accounts_acl.
    Maintains admission app's interface while decoupling from accounts models.
    """
    
    @staticmethod
    def validate_practitioner_exists(practitioner_id: int) -> bool:
        return accounts_acl.PractitionerACL.validate_practitioner_exists(practitioner_id)
    
    @staticmethod
    def get_practitioner_summary(practitioner_id: int) -> Optional[Dict[str, Any]]:
        return accounts_acl.PractitionerACL.get_practitioner_summary(practitioner_id)


class LocationACL:
    """
    Location ACL Proxy - Delegates all operations to accounts.services.accounts_acl.
    Maintains admission app's interface while decoupling from accounts models.
    """
    
    @staticmethod
    def validate_location_exists(location_id: int) -> bool:
        return accounts_acl.LocationACL.validate_location_exists(location_id)
    
    @staticmethod
    def get_location_summary(location_id: int) -> Optional[Dict[str, Any]]:
        return accounts_acl.LocationACL.get_location_summary(location_id)


class OrganizationACL:
    """
    Organization ACL Proxy - Delegates all operations to accounts.services.accounts_acl.
    Maintains admission app's interface while decoupling from accounts models.
    """
    
    @staticmethod
    def validate_organization_exists(organization_id: int) -> bool:
        return accounts_acl.OrganizationACL.validate_organization_exists(organization_id)
    
    @staticmethod
    def get_organization_summary(organization_id: int) -> Optional[Dict[str, Any]]:
        return accounts_acl.OrganizationACL.get_organization_summary(organization_id)


__all__ = [
    'PatientACL',
    'EncounterACL',
    'ProcedureACL',
    'PractitionerACL',
    'LocationACL',
    'OrganizationACL',
]