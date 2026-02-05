"""
Patient Service Layer (Anti-Corruption Layer)
==============================================
Fortress Pattern Entry Point for Patient Module

This is the ONLY file allowed to import Patient models.
All other apps (admission, billing, etc.) MUST use this ACL.

Returns: Dictionaries (DTOs) only - NO Django model objects.

CRITICAL: All lookup methods use INTEGER primary key (id), NOT string patient_id.
This aligns with foreign key references from other apps (e.g., Encounter.subject_id).

Refactored: 2026-02-04 to support Admission/Encounter integration
- Enriched summary DTO with granular name fields
- Added encounter_id filtering to conditions and allergies
"""

from typing import Optional, List, Dict, Any
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

# FORTRESS BOUNDARY: Only this file imports patient models
from patients.models import Patient, Condition, AllergyIntolerance, Immunization


# ============================================================================
# PATIENT VALIDATION
# ============================================================================

def validate_patient_exists(patient_id: int) -> bool:
    """
    Lightweight check if patient exists.
    
    Args:
        patient_id: Database primary key (integer)
    
    Returns:
        bool: True if patient exists, False otherwise
    """
    try:
        return Patient.objects.filter(id=patient_id).exists()
    except Exception:
        return False


# ============================================================================
# PATIENT RETRIEVAL
# ============================================================================

def get_patient_summary(patient_id: int) -> Optional[Dict[str, Any]]:
    """
    Get patient summary information.
    
    Args:
        patient_id: Database primary key (integer)
    
    Returns:
        Dictionary with patient summary or None if not found
        Keys: id, patient_id, full_name, gender, birthdate, mobile_number,
              philhealth_id, address_line, address_city
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        return _patient_to_summary_dict(patient)
    except ObjectDoesNotExist:
        return None
    except Exception:
        return None


def get_patient_details(patient_id: int) -> Optional[Dict[str, Any]]:
    """
    Get complete patient details.
    
    Args:
        patient_id: Database primary key (integer)
    
    Returns:
        Dictionary with full patient details or None if not found
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        return _patient_to_full_dict(patient)
    except ObjectDoesNotExist:
        return None
    except Exception:
        return None


# ============================================================================
# PATIENT SEARCH
# ============================================================================

def search_patients(query: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Search patients by name or patient ID string.
    
    Args:
        query: Search term (name or patient_id string)
        limit: Maximum number of results (default: 50)
    
    Returns:
        List of patient summary dictionaries
    """
    if not query:
        # Default list behavior: Return recent/all patients if query is empty
        patients = Patient.objects.all().order_by('last_name', 'first_name')[:limit]
        return [_patient_to_summary_dict(patient) for patient in patients]

    if len(query.strip()) < 2:
        return []
    
    try:
        query = query.strip()
        patients = Patient.objects.filter(
            Q(patient_id__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(middle_name__icontains=query)
        ).order_by('last_name', 'first_name')[:limit]
        
        return [_patient_to_summary_dict(patient) for patient in patients]
    except Exception:
        return []


# ============================================================================
# PATIENT CONDITIONS
# ============================================================================

def get_patient_conditions(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get all conditions for a patient.
    
    Args:
        patient_id: Database primary key (integer)
        encounter_id: Optional encounter ID to filter conditions (integer)
    
    Returns:
        List of condition dictionaries
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        conditions = Condition.objects.filter(patient=patient)
        
        # Filter by encounter if provided
        if encounter_id is not None:
            conditions = conditions.filter(encounter_id=encounter_id)
        
        conditions = conditions.order_by('-created_at')
        return [_condition_to_dict(condition) for condition in conditions]
    except ObjectDoesNotExist:
        return []
    except Exception:
        return []


def get_active_patient_conditions(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get active conditions for a patient.
    
    Args:
        patient_id: Database primary key (integer)
        encounter_id: Optional encounter ID to filter conditions (integer)
    
    Returns:
        List of active condition dictionaries
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        conditions = Condition.objects.filter(
            patient=patient,
            clinical_status='active'
        )
        
        # Filter by encounter if provided
        if encounter_id is not None:
            conditions = conditions.filter(encounter_id=encounter_id)
        
        conditions = conditions.order_by('-created_at')
        return [_condition_to_dict(condition) for condition in conditions]
    except ObjectDoesNotExist:
        return []
    except Exception:
        return []


# ============================================================================
# PATIENT ALLERGIES
# ============================================================================

def get_patient_allergies(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get all allergies for a patient.
    
    Args:
        patient_id: Database primary key (integer)
        encounter_id: Optional encounter ID to filter allergies (integer)
    
    Returns:
        List of allergy dictionaries
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        allergies = AllergyIntolerance.objects.filter(patient=patient)
        
        # Filter by encounter if provided
        if encounter_id is not None:
            allergies = allergies.filter(encounter_id=encounter_id)
        
        allergies = allergies.order_by('-created_at')
        return [_allergy_to_dict(allergy) for allergy in allergies]
    except ObjectDoesNotExist:
        return []
    except Exception:
        return []


def get_active_patient_allergies(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get active allergies for a patient.
    
    Args:
        patient_id: Database primary key (integer)
        encounter_id: Optional encounter ID to filter allergies (integer)
    
    Returns:
        List of active allergy dictionaries
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        allergies = AllergyIntolerance.objects.filter(
            patient=patient,
            clinical_status='active'
        )
        
        # Filter by encounter if provided
        if encounter_id is not None:
            allergies = allergies.filter(encounter_id=encounter_id)
        
        allergies = allergies.order_by('-created_at')
        return [_allergy_to_dict(allergy) for allergy in allergies]
    except ObjectDoesNotExist:
        return []
    except Exception:
        return []


# ============================================================================
# INTERNAL HELPER FUNCTIONS (Private - Do not export)
# ============================================================================

def _compute_full_name(patient: Patient) -> str:
    """Compute full name from patient name components."""
    parts = []
    
    if patient.first_name:
        parts.append(patient.first_name)
    if patient.middle_name:
        parts.append(patient.middle_name)
    if patient.last_name:
        parts.append(patient.last_name)
    if patient.suffix_name:
        parts.append(patient.suffix_name)
    
    return " ".join(parts) if parts else "Unknown"


def _patient_to_summary_dict(patient: Patient) -> Dict[str, Any]:
    """
    Convert Patient model to summary dictionary (DTO).
    
    Includes both computed full_name and granular name components
    for flexible display logic in consuming apps.
    """
    return {
        'id': patient.id,
        'patient_id': patient.patient_id or "",
        'full_name': _compute_full_name(patient),
        'first_name': patient.first_name or "",
        'last_name': patient.last_name or "",
        'middle_name': patient.middle_name or "",
        'suffix_name': patient.suffix_name or "",
        'gender': patient.gender or "",
        'birthdate': patient.birthdate.isoformat() if patient.birthdate else None,
        'mobile_number': patient.mobile_number or "",
        'philhealth_id': patient.philhealth_id or "",
        'blood_type': patient.blood_type or "",
        'address_line': patient.address_line or "",
        'address_city': patient.address_city or "",
    }


def _patient_to_full_dict(patient: Patient) -> Dict[str, Any]:
    """Convert Patient model to full detail dictionary (DTO)."""
    return {
        'id': patient.id,
        'patient_id': patient.patient_id or "",
        'first_name': patient.first_name or "",
        'last_name': patient.last_name or "",
        'middle_name': patient.middle_name or "",
        'suffix_name': patient.suffix_name or "",
        'full_name': _compute_full_name(patient),
        'gender': patient.gender or "",
        'birthdate': patient.birthdate.isoformat() if patient.birthdate else None,
        'civil_status': patient.civil_status or "",
        'nationality': patient.nationality or "",
        'religion': patient.religion or "",
        'philhealth_id': patient.philhealth_id or "",
        'blood_type': patient.blood_type or "",
        'pwd_type': patient.pwd_type or "",
        'occupation': patient.occupation or "",
        'education': patient.education or "",
        'mobile_number': patient.mobile_number or "",
        'address_line': patient.address_line or "",
        'address_city': patient.address_city or "",
        'address_district': patient.address_district or "",
        'address_state': patient.address_state or "",
        'address_postal_code': patient.address_postal_code or "",
        'address_country': patient.address_country or "",
        'contact_first_name': patient.contact_first_name or "",
        'contact_last_name': patient.contact_last_name or "",
        'contact_mobile_number': patient.contact_mobile_number or "",
        'contact_relationship': patient.contact_relationship or "",
        'indigenous_flag': patient.indigenous_flag,
        'indigenous_group': patient.indigenous_group or "",
        'consent_flag': patient.consent_flag,
        'image_url': patient.image_url or "",
        'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None,
        'updated_at': patient.updated_at.isoformat() if hasattr(patient, 'updated_at') else None,
    }


def _condition_to_dict(condition: Condition) -> Dict[str, Any]:
    """Convert Condition model to dictionary (DTO)."""
    return {
        'condition_id': condition.condition_id,
        'identifier': condition.identifier,
        'code': condition.code,
        'clinical_status': condition.clinical_status or "",
        'verification_status': condition.verification_status or "",
        'category': condition.category or "",
        'severity': condition.severity or "",
        'body_site': condition.body_site or "",
        'onset_datetime': condition.onset_datetime.isoformat() if condition.onset_datetime else None,
        'recorded_date': condition.recorded_date.isoformat() if condition.recorded_date else None,
        'note': condition.note or "",
        'encounter_id': condition.encounter_id,
        'patient_id': condition.patient.patient_id if condition.patient else None,
    }


def _allergy_to_dict(allergy: AllergyIntolerance) -> Dict[str, Any]:
    """Convert AllergyIntolerance model to dictionary (DTO)."""
    return {
        'allergy_id': allergy.allergy_id,
        'identifier': allergy.identifier,
        'code': allergy.code,
        'clinical_status': allergy.clinical_status or "",
        'verification_status': allergy.verification_status or "",
        'type': allergy.type or "",
        'category': allergy.category or "",
        'criticality': allergy.criticality or "",
        'onset_datetime': allergy.onset_datetime.isoformat() if allergy.onset_datetime else None,
        'recorded_date': allergy.recorded_date.isoformat() if allergy.recorded_date else None,
        'last_occurrence': allergy.last_occurrence or "",
        'reaction_description': allergy.reaction_description or "",
        'reaction_severity': allergy.reaction_severity or "",
        'reaction_manifestation': allergy.reaction_manifestation or "",
        'note': allergy.note or "",
        'encounter_id': allergy.encounter_id,
        'patient_id': allergy.patient.patient_id if allergy.patient else None,
    }


def _immunization_to_dict(immunization: Immunization) -> Dict[str, Any]:
    """Convert Immunization model to dictionary (DTO)."""
    return {
        'immunization_id': immunization.immunization_id,
        'identifier': immunization.identifier,
        'status': immunization.status,
        'vaccine_code': immunization.vaccine_code or "",
        'vaccine_display': immunization.vaccine_display or "",
        'occurrence_datetime': immunization.occurrence_datetime.isoformat() if immunization.occurrence_datetime else None,
        'lot_number': immunization.lot_number or "",
        'dose_quantity_value': immunization.dose_quantity_value or "",
        'dose_quantity_unit': immunization.dose_quantity_unit or "",
        'note': immunization.note or "",
        'encounter_id': immunization.encounter_id,
        'patient_id': immunization.patient.patient_id if immunization.patient else None,
    }


# ============================================================================
# PATIENT IMMUNIZATIONS
# ============================================================================

def get_patient_immunizations(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get all immunizations for a patient.
    
    Args:
        patient_id: Database primary key (integer)
        encounter_id: Optional encounter ID to filter immunizations (integer)
    
    Returns:
        List of immunization dictionaries
    """
    try:
        patient = Patient.objects.get(id=patient_id)
        immunizations = Immunization.objects.filter(patient=patient)
        
        # Filter by encounter if provided
        if encounter_id is not None:
            immunizations = immunizations.filter(encounter_id=encounter_id)
        
        immunizations = immunizations.order_by('-created_at')
        return [_immunization_to_dict(immunization) for immunization in immunizations]
    except ObjectDoesNotExist:
        return []
    except Exception:
        return []
