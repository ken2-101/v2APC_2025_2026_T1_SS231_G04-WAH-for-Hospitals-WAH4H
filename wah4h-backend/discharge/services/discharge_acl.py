"""
Discharge Anti-Corruption Layer (ACL)
======================================
Read-only interface for Discharge module following Fortress Pattern.

Provides system-wide source of truth for encounter discharge status.
All queries return pure Python primitives (Dict/List), never Django models.
"""

from typing import Optional, List, Dict, Any
from django.core.exceptions import ObjectDoesNotExist

# Local model imports
from discharge.models import Discharge, Procedure, ProcedurePerformer


class DischargeACL:
    """Read-only access layer for discharge summaries"""
    
    @staticmethod
    def is_encounter_discharged(encounter_id: int) -> bool:
        """
        System-wide source of truth for encounter discharge status.
        
        Args:
            encounter_id: Encounter primary key (integer)
        
        Returns:
            bool: True if discharge record exists, False otherwise
        """
        try:
            return Discharge.objects.filter(encounter_id=encounter_id).exists()
        except Exception:
            return False
    
    @staticmethod
    def get_discharge_summary(encounter_id: int) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive discharge summary for an encounter.
        
        Args:
            encounter_id: Encounter primary key (integer)
        
        Returns:
            Dictionary with discharge details or None if not found
        """
        try:
            discharge = Discharge.objects.get(encounter_id=encounter_id)
            return _discharge_to_dict(discharge)
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def get_discharge_summary_by_patient(patient_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent discharge summaries for a patient.
        
        Args:
            patient_id: Patient primary key (integer)
            limit: Maximum number of results (default: 10)
        
        Returns:
            List of discharge summary dictionaries, ordered by most recent
        """
        try:
            discharges = Discharge.objects.filter(
                patient_id=patient_id
            ).order_by('-discharge_datetime', '-created_at')[:limit]
            
            return [_discharge_to_dict(discharge) for discharge in discharges]
        except Exception:
            return []


class ProcedureACL:
    """Read-only access layer for procedure records"""
    
    @staticmethod
    def get_encounter_procedures(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all procedures for an encounter with nested performers.
        
        Args:
            encounter_id: Encounter primary key (integer)
        
        Returns:
            List of procedure dictionaries with nested performers
        """
        try:
            procedures = Procedure.objects.filter(
                encounter_id=encounter_id
            ).prefetch_related('performers').order_by('-performed_datetime', '-created_at')
            
            return [_procedure_to_dict(procedure) for procedure in procedures]
        except Exception:
            return []


# ============================================================================
# INTERNAL HELPER FUNCTIONS (Private - Do not export)
# ============================================================================

def _discharge_to_dict(discharge: Discharge) -> Dict[str, Any]:
    """Convert Discharge model to dictionary (DTO)."""
    return {
        'discharge_id': discharge.discharge_id,
        'encounter_id': discharge.encounter_id,
        'patient_id': discharge.patient_id,
        'physician_id': discharge.physician_id,
        'discharge_datetime': discharge.discharge_datetime.isoformat() if discharge.discharge_datetime else None,
        'notice_datetime': discharge.notice_datetime.isoformat() if discharge.notice_datetime else None,
        'billing_cleared_datetime': discharge.billing_cleared_datetime.isoformat() if discharge.billing_cleared_datetime else None,
        'workflow_status': discharge.workflow_status or "",
        'created_by': discharge.created_by or "",
        'summary_of_stay': discharge.summary_of_stay or "",
        'discharge_instructions': discharge.discharge_instructions or "",
        'pending_items': discharge.pending_items or "",
        'follow_up_plan': discharge.follow_up_plan or "",
        'created_at': discharge.created_at.isoformat() if hasattr(discharge, 'created_at') else None,
        'updated_at': discharge.updated_at.isoformat() if hasattr(discharge, 'updated_at') else None,
    }


def _procedure_to_dict(procedure: Procedure) -> Dict[str, Any]:
    """Convert Procedure model to dictionary (DTO) with nested performers."""
    performers = []
    if hasattr(procedure, 'performers'):
        performers = [_performer_to_dict(performer) for performer in procedure.performers.all()]
    
    return {
        'procedure_id': procedure.procedure_id,
        'identifier': procedure.identifier or "",
        'status': procedure.status or "",
        'encounter_id': procedure.encounter_id,
        'subject_id': procedure.subject_id,
        'asserter_id': procedure.asserter_id,
        'based_on_id': procedure.based_on_id,
        'part_of_id': procedure.part_of_id,
        'location_id': procedure.location_id,
        'recorder_id': procedure.recorder_id,
        'report_id': procedure.report_id,
        'reason_reference_id': procedure.reason_reference_id,
        'complication_detail_id': procedure.complication_detail_id,
        'focal_device_manipulated_id': procedure.focal_device_manipulated_id,
        'used_reference_id': procedure.used_reference_id,
        'instantiates_canonical': procedure.instantiates_canonical or "",
        'instantiates_uri': procedure.instantiates_uri or "",
        'status_reason_code': procedure.status_reason_code or "",
        'status_reason_display': procedure.status_reason_display or "",
        'category_code': procedure.category_code or "",
        'category_display': procedure.category_display or "",
        'code_code': procedure.code_code or "",
        'code_display': procedure.code_display or "",
        'body_site_code': procedure.body_site_code or "",
        'body_site_display': procedure.body_site_display or "",
        'outcome_code': procedure.outcome_code or "",
        'outcome_display': procedure.outcome_display or "",
        'reason_code_code': procedure.reason_code_code or "",
        'reason_code_display': procedure.reason_code_display or "",
        'complication_code': procedure.complication_code or "",
        'complication_display': procedure.complication_display or "",
        'follow_up_code': procedure.follow_up_code or "",
        'follow_up_display': procedure.follow_up_display or "",
        'focal_device_action_code': procedure.focal_device_action_code or "",
        'focal_device_action_display': procedure.focal_device_action_display or "",
        'used_code_code': procedure.used_code_code or "",
        'used_code_display': procedure.used_code_display or "",
        'performer_actor_id': procedure.performer_actor_id,
        'performer_function_code': procedure.performer_function_code or "",
        'performer_function_display': procedure.performer_function_display or "",
        'performer_on_behalf_of_id': procedure.performer_on_behalf_of_id,
        'performed_datetime': procedure.performed_datetime.isoformat() if procedure.performed_datetime else None,
        'performed_period_start': procedure.performed_period_start.isoformat() if procedure.performed_period_start else None,
        'performed_period_end': procedure.performed_period_end.isoformat() if procedure.performed_period_end else None,
        'performed_string': procedure.performed_string or "",
        'performed_age_value': procedure.performed_age_value or "",
        'performed_age_unit': procedure.performed_age_unit or "",
        'performed_range_low': procedure.performed_range_low or "",
        'performed_range_high': procedure.performed_range_high or "",
        'note': procedure.note or "",
        'performers': performers,
        'created_at': procedure.created_at.isoformat() if hasattr(procedure, 'created_at') else None,
        'updated_at': procedure.updated_at.isoformat() if hasattr(procedure, 'updated_at') else None,
    }


def _performer_to_dict(performer: ProcedurePerformer) -> Dict[str, Any]:
    """Convert ProcedurePerformer model to dictionary (DTO)."""
    return {
        'procedure_performer_id': performer.procedure_performer_id,
        'performer_actor_id': performer.performer_actor_id,
        'performer_on_behalf_of_id': performer.performer_on_behalf_of_id,
        'performer_function_code': performer.performer_function_code or "",
        'performer_function_display': performer.performer_function_display or "",
        'created_at': performer.created_at.isoformat() if performer.created_at else None,
        'updated_at': performer.updated_at.isoformat() if performer.updated_at else None,
    }
