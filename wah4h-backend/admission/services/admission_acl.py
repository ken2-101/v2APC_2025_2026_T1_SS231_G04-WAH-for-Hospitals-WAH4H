"""
admission/services/admission_acl.py

Read-Only Service Layer (ACL - Anti-Corruption Layer) for the Admission Module.
ACL-Driven Architecture (Read Operations Only).

Architecture Pattern: Fortress Pattern - Read Layer
- External apps consume admission data through this ACL
- All data returned as dictionaries (DTOs)
- NO Django model objects exposed
- Enriches data with external references via Patient/Accounts ACLs

Context: Philippine LGU Hospital System
"""

from typing import Dict, Any, Optional, List
from django.core.exceptions import ObjectDoesNotExist

from admission.models import Encounter, Procedure, ProcedurePerformer
from patients.services.patient_acl import get_patient_summary
from accounts.models import Practitioner, Location


# Helper functions to replace ACL methods
def get_practitioner_summary(practitioner_id: int) -> Optional[Dict[str, Any]]:
    """Get practitioner summary data."""
    try:
        practitioner = Practitioner.objects.get(practitioner_id=practitioner_id)
        return {
            'practitioner_id': practitioner.practitioner_id,
            'identifier': practitioner.identifier,
            'first_name': practitioner.first_name,
            'middle_name': practitioner.middle_name,
            'last_name': practitioner.last_name,
            'full_name': f"{practitioner.first_name} {practitioner.last_name}",
            'active': practitioner.active,
        }
    except ObjectDoesNotExist:
        return None


def get_location_summary(location_id: int) -> Optional[Dict[str, Any]]:
    """Get location summary data."""
    try:
        location = Location.objects.get(location_id=location_id)
        return {
            'location_id': location.location_id,
            'identifier': location.identifier,
            'name': location.name,
            'status': location.status,
            'type_code': location.type_code,
        }
    except ObjectDoesNotExist:
        return None


class EncounterACL:
    """
    Read-Only Service Layer for Encounter data.
    
    Provides validation and data retrieval for encounters without exposing
    the underlying model structure to external apps.
    """
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
    
    @staticmethod
    def validate_encounter_exists(encounter_id: int) -> bool:
        """
        Check if an encounter exists in the system.
        
        Args:
            encounter_id: Primary key of the encounter
            
        Returns:
            bool: True if encounter exists, False otherwise
        """
        try:
            Encounter.objects.get(encounter_id=encounter_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_encounter_details(encounter_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve encounter details as a DTO with enriched patient data.
        
        Args:
            encounter_id: Primary key of the encounter
            
        Returns:
            Dictionary with encounter data or None if not found.
            
            DTO Fields:
                - encounter_id (int): Encounter ID
                - identifier (str): FHIR identifier
                - status (str): Encounter status
                - class_field (str): Encounter class
                - type (str): Encounter type
                - service_type (str): Service type
                - priority (str): Priority level
                - subject_id (int): Patient ID
                - patient_summary (dict): Enriched patient data from PatientACL
                - period_start (date): Start date
                - period_end (date): End date
                - reason_code (str): Reason for encounter
                - location_id (int): Location ID
                - location_summary (dict|None): Enriched location data
                - participant_individual_id (int): Admitting practitioner ID
                - practitioner_summary (dict|None): Enriched practitioner data
                - admit_source (str): Admission source
                - discharge_disposition (str): Discharge disposition
                - created_at (str): Creation timestamp
                - updated_at (str): Update timestamp
        """
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
            
            # Enrich with patient data via ACL
            patient_summary = None
            if encounter.subject_id:
                patient_summary = get_patient_summary(encounter.subject_id)
            
            # Enrich with location data via ACL
            location_summary = None
            if encounter.location_id:
                location_summary = get_location_summary(encounter.location_id)
            
            # Enrich with practitioner data via ACL
            practitioner_summary = None
            if encounter.participant_individual_id:
                practitioner_summary = get_practitioner_summary(
                    encounter.participant_individual_id
                )
            
            return {
                'encounter_id': encounter.encounter_id,
                'identifier': encounter.identifier,
                'status': encounter.status,
                'class_field': encounter.class_field,
                'type': encounter.type,
                'service_type': encounter.service_type,
                'priority': encounter.priority,
                'subject_id': encounter.subject_id,
                'patient_summary': patient_summary,
                'period_start': encounter.period_start.isoformat() if encounter.period_start else None,
                'period_end': encounter.period_end.isoformat() if encounter.period_end else None,
                'length': encounter.length,
                'reason_code': encounter.reason_code,
                'location_id': encounter.location_id,
                'location_summary': location_summary,
                'location_status': encounter.location_status,
                'participant_individual_id': encounter.participant_individual_id,
                'participant_type': encounter.participant_type,
                'practitioner_summary': practitioner_summary,
                'admit_source': encounter.admit_source,
                're_admission': encounter.re_admission,
                'diet_preference': encounter.diet_preference,
                'special_courtesy': encounter.special_courtesy,
                'special_arrangement': encounter.special_arrangement,
                'discharge_disposition': encounter.discharge_disposition,
                'discharge_destination_id': encounter.discharge_destination_id,
                'account_id': encounter.account_id,
                'created_at': encounter.created_at.isoformat() if hasattr(encounter, 'created_at') else None,
                'updated_at': encounter.updated_at.isoformat() if hasattr(encounter, 'updated_at') else None,
            }
        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def get_active_encounters(patient_id: int) -> List[Dict[str, Any]]:
        """
        Get all active encounters for a patient.
        
        Args:
            patient_id: Patient ID (subject_id)
            
        Returns:
            List of encounter summary dictionaries
        """
        try:
            encounters = Encounter.objects.filter(
                subject_id=patient_id,
                status='in-progress'
            ).order_by('-period_start')
            
            return [EncounterACL._encounter_to_summary_dict(enc) for enc in encounters]
        except Exception:
            return []
    
    @staticmethod
    def get_patient_encounters(patient_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all encounters for a patient, optionally filtered by status.
        
        Args:
            patient_id: Patient ID (subject_id)
            status: Optional status filter ('in-progress', 'finished', etc.)
            
        Returns:
            List of encounter summary dictionaries
        """
        try:
            encounters = Encounter.objects.filter(subject_id=patient_id)
            
            if status:
                encounters = encounters.filter(status=status)
            
            encounters = encounters.order_by('-period_start')
            
            return [EncounterACL._encounter_to_summary_dict(enc) for enc in encounters]
        except Exception:
            return []
    
    @staticmethod
    def _encounter_to_summary_dict(encounter: Encounter) -> Dict[str, Any]:
        """
        Convert Encounter model to summary dictionary (DTO).
        Internal helper - not exposed to external apps.
        """
        # Enrich with patient data
        patient_summary = None
        if encounter.subject_id:
            patient_summary = get_patient_summary(encounter.subject_id)

        # Enrich with location data via ACL
        location_summary = None
        if encounter.location_id:
            location_summary = get_location_summary(encounter.location_id)
        
        # Enrich with practitioner data via ACL
        practitioner_summary = None
        if encounter.participant_individual_id:
            practitioner_summary = get_practitioner_summary(
                encounter.participant_individual_id
            )
        
        return {
            'encounter_id': encounter.encounter_id,
            'identifier': encounter.identifier,
            'status': encounter.status,
            'class_field': encounter.class_field,
            'service_type': encounter.service_type,
            'subject_id': encounter.subject_id,
            'patient_summary': patient_summary,
            'period_start': encounter.period_start.isoformat() if encounter.period_start else None,
            'period_end': encounter.period_end.isoformat() if encounter.period_end else None,
            'reason_code': encounter.reason_code,
            'location_id': encounter.location_id,
            'location_summary': location_summary,
            'practitioner_summary': practitioner_summary,
        }


class ProcedureACL:
    """
    Read-Only Service Layer for Procedure data.
    
    Provides validation and data retrieval for procedures without exposing
    the underlying model structure to external apps.
    """
    
    @staticmethod
    def validate_procedure_exists(procedure_id: int) -> bool:
        """
        Check if a procedure exists in the system.
        
        Args:
            procedure_id: Primary key of the procedure
            
        Returns:
            bool: True if procedure exists, False otherwise
        """
        try:
            Procedure.objects.get(procedure_id=procedure_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_procedure_details(procedure_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve procedure details as a DTO with enriched data.
        
        Args:
            procedure_id: Primary key of the procedure
            
        Returns:
            Dictionary with procedure data or None if not found.
            
            DTO Fields:
                - procedure_id (int): Procedure ID
                - identifier (str): FHIR identifier
                - status (str): Procedure status
                - code_code (str): Procedure code
                - code_display (str): Procedure display name
                - category_code (str): Category code
                - subject_id (int): Patient ID
                - patient_summary (dict): Enriched patient data
                - encounter_id (int): Encounter ID
                - performed_datetime (str): When performed
                - body_site_code (str): Body site
                - outcome_code (str): Outcome
                - note (str): Notes
                - performers (list): List of performer DTOs
                - created_at (str): Creation timestamp
                - updated_at (str): Update timestamp
        """
        try:
            procedure = Procedure.objects.select_related('encounter').get(
                procedure_id=procedure_id
            )
            
            # Enrich with patient data via ACL
            patient_summary = None
            if procedure.subject_id:
                patient_summary = get_patient_summary(procedure.subject_id)
            
            # Get performers
            performers = ProcedureACL._get_procedure_performers(procedure_id)
            
            return {
                'procedure_id': procedure.procedure_id,
                'identifier': procedure.identifier,
                'status': procedure.status,
                'code_code': procedure.code_code,
                'code_display': procedure.code_display,
                'category_code': procedure.category_code,
                'category_display': procedure.category_display,
                'subject_id': procedure.subject_id,
                'patient_summary': patient_summary,
                'encounter_id': procedure.encounter.encounter_id if procedure.encounter else None,
                'performed_datetime': procedure.performed_datetime.isoformat() if procedure.performed_datetime else None,
                'performed_period_start': procedure.performed_period_start.isoformat() if procedure.performed_period_start else None,
                'performed_period_end': procedure.performed_period_end.isoformat() if procedure.performed_period_end else None,
                'body_site_code': procedure.body_site_code,
                'body_site_display': procedure.body_site_display,
                'outcome_code': procedure.outcome_code,
                'outcome_display': procedure.outcome_display,
                'note': procedure.note,
                'performers': performers,
                'location_id': procedure.location_id,
                'created_at': procedure.created_at.isoformat() if hasattr(procedure, 'created_at') else None,
                'updated_at': procedure.updated_at.isoformat() if hasattr(procedure, 'updated_at') else None,
            }
        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def get_encounter_procedures(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all procedures for an encounter.
        
        Args:
            encounter_id: Encounter ID
            
        Returns:
            List of procedure summary dictionaries
        """
        try:
            procedures = Procedure.objects.filter(encounter_id=encounter_id).order_by('-created_at')
            return [ProcedureACL._procedure_to_summary_dict(proc) for proc in procedures]
        except Exception:
            return []
    
    @staticmethod
    def _get_procedure_performers(procedure_id: int) -> List[Dict[str, Any]]:
        """
        Get performers for a procedure.
        Internal helper method.
        """
        try:
            performers = ProcedurePerformer.objects.filter(procedure_id=procedure_id)
            performer_list = []
            
            for performer in performers:
                practitioner_summary = None
                if performer.performer_actor_id:
                    practitioner_summary = get_practitioner_summary(
                        performer.performer_actor_id
                    )
                
                performer_list.append({
                    'procedure_performer_id': performer.procedure_performer_id,
                    'performer_actor_id': performer.performer_actor_id,
                    'practitioner_summary': practitioner_summary,
                    'performer_function_code': performer.performer_function_code,
                    'performer_function_display': performer.performer_function_display,
                    'performer_on_behalf_of_id': performer.performer_on_behalf_of_id,
                })
            
            return performer_list
        except Exception:
            return []
    
    @staticmethod
    def _procedure_to_summary_dict(procedure: Procedure) -> Dict[str, Any]:
        """
        Convert Procedure model to summary dictionary (DTO).
        Internal helper - not exposed to external apps.
        """
        # Enrich with patient data
        patient_summary = None
        if procedure.subject_id:
            patient_summary = get_patient_summary(procedure.subject_id)
        
        return {
            'procedure_id': procedure.procedure_id,
            'identifier': procedure.identifier,
            'status': procedure.status,
            'code_code': procedure.code_code,
            'code_display': procedure.code_display,
            'subject_id': procedure.subject_id,
            'patient_summary': patient_summary,
            'encounter_id': procedure.encounter.encounter_id if procedure.encounter else None,
            'performed_datetime': procedure.performed_datetime.isoformat() if procedure.performed_datetime else None,
            'outcome_code': procedure.outcome_code,
        }