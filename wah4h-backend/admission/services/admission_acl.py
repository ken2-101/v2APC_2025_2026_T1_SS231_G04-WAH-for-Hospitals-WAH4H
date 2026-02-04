"""
Anti-Corruption Layer (ACL) for Admission Module
=================================================

Fortress Boundary: ALL external app communication flows through this ACL.

Phase 2 Refactoring: PatientACL now acts as a pure proxy to patients.services.patient_acl.
NO direct model imports from patients app - full decoupling achieved.

External Dependencies:
- patients.services.patient_acl: Patient data operations (Source of Truth)
- accounts app: Practitioner (future)
- core app: Organization, Location (future)
"""

from typing import Optional, Dict, Any, List
from django.db import transaction
from django.core.exceptions import ValidationError
from admission.models import Encounter, Procedure, ProcedurePerformer

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


class EncounterService:
    
    @staticmethod
    def validate_encounter_exists(encounter_id: int) -> bool:
        return Encounter.objects.filter(encounter_id=encounter_id).exists()
    
    @staticmethod
    @transaction.atomic
    def create_encounter(data: Dict[str, Any]) -> Encounter:
        subject_id = data.get('subject_id')
        if not subject_id:
            raise ValidationError("subject_id (patient ID) is required")
        
        if not PatientACL.validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id={subject_id} does not exist")
        
        encounter = Encounter.objects.create(**data)
        return encounter
    
    @staticmethod
    def get_encounter_with_patient(encounter_id: int) -> Optional[Dict[str, Any]]:
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


class ProcedureService:
    
    @staticmethod
    @transaction.atomic
    def create_procedure(data: Dict[str, Any]) -> Procedure:
        subject_id = data.get('subject_id')
        encounter_id = data.get('encounter_id')
        
        if not subject_id:
            raise ValidationError("subject_id (patient ID) is required")
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        
        if not PatientACL.validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id={subject_id} does not exist")
        
        if not Encounter.objects.filter(encounter_id=encounter_id).exists():
            raise ValidationError(f"Encounter with id={encounter_id} does not exist")
        
        encounter = Encounter.objects.get(encounter_id=encounter_id)
        if encounter.subject_id != subject_id:
            raise ValidationError(
                f"Patient mismatch: Encounter {encounter_id} belongs to patient {encounter.subject_id}, "
                f"not patient {subject_id}"
            )
        
        procedure = Procedure.objects.create(**data)
        return procedure
    
    @staticmethod
    def get_encounter_procedures(encounter_id: int) -> List[Dict[str, Any]]:
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
    'EncounterService',
    'ProcedureService',
    'PractitionerACL',
    'LocationACL',
    'OrganizationACL',
]