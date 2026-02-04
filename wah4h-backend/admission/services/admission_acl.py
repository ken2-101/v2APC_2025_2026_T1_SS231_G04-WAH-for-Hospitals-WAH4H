"""
Anti-Corruption Layer (ACL) for Admission Module
=================================================

This module serves as the FORTRESS BOUNDARY for the admission app.
It encapsulates ALL external communication with other apps in the system.

Architecture Principles:
1. NO direct model imports from other apps in views/serializers
2. ALL cross-app communication goes through this ACL
3. External references are validated before persistence
4. Returns DTOs/dicts, not model instances from other apps
5. Fails fast with clear error messages

External Dependencies:
- patients app: Patient, Condition, AllergyIntolerance, Immunization
- accounts app: Practitioner (future)
- core app: Organization, Location (future)
"""

from typing import Optional, Dict, Any, List
from django.db import transaction
from django.core.exceptions import ValidationError
from admission.models import Encounter, Procedure, ProcedurePerformer


class PatientACL:
    
    @staticmethod
    def validate_patient_exists(patient_id: int) -> bool:
        from patients.models import Patient
        return Patient.objects.filter(id=patient_id).exists()
    
    @staticmethod
    def get_patient_summary(patient_id: int) -> Optional[Dict[str, Any]]:
        from patients.models import Patient
        
        try:
            patient = Patient.objects.get(id=patient_id)
            return {
                'id': patient.id,
                'patient_id': patient.patient_id,
                'full_name': f"{patient.first_name} {patient.middle_name or ''} {patient.last_name} {patient.suffix_name or ''}".strip(),
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'middle_name': patient.middle_name,
                'suffix_name': patient.suffix_name,
                'gender': patient.gender,
                'birthdate': patient.birthdate,
                'mobile_number': patient.mobile_number,
                'philhealth_id': patient.philhealth_id,
                'blood_type': patient.blood_type,
                'address_line': patient.address_line,
                'address_city': patient.address_city,
            }
        except Patient.DoesNotExist:
            return None
    
    @staticmethod
    def get_patient_conditions(patient_id: int, encounter_id: Optional[int] = None) -> List[Dict[str, Any]]:
        from patients.models import Condition
        
        queryset = Condition.objects.filter(patient_id=patient_id)
        if encounter_id:
            queryset = queryset.filter(encounter_id=encounter_id)
        
        return [
            {
                'condition_id': c.condition_id,
                'identifier': c.identifier,
                'code': c.code,
                'clinical_status': c.clinical_status,
                'verification_status': c.verification_status,
                'category': c.category,
                'severity': c.severity,
                'onset_datetime': c.onset_datetime,
                'recorded_date': c.recorded_date,
            }
            for c in queryset
        ]
    
    @staticmethod
    def get_patient_allergies(patient_id: int) -> List[Dict[str, Any]]:
        from patients.models import AllergyIntolerance
        
        allergies = AllergyIntolerance.objects.filter(patient_id=patient_id)
        
        return [
            {
                'allergy_id': a.allergy_id,
                'identifier': a.identifier,
                'code': a.code,
                'clinical_status': a.clinical_status,
                'verification_status': a.verification_status,
                'type': a.type,
                'category': a.category,
                'criticality': a.criticality,
                'reaction_severity': a.reaction_severity,
                'last_occurrence': a.last_occurrence,
            }
            for a in allergies
        ]
    
    @staticmethod
    def search_patients(query: str, limit: int = 10) -> List[Dict[str, Any]]:
        from patients.models import Patient
        from django.db.models import Q
        
        patients = Patient.objects.filter(
            Q(patient_id__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )[:limit]
        
        return [
            {
                'id': p.id,
                'patient_id': p.patient_id,
                'full_name': f"{p.first_name} {p.middle_name or ''} {p.last_name} {p.suffix_name or ''}".strip(),
                'gender': p.gender,
                'birthdate': p.birthdate,
                'mobile_number': p.mobile_number,
            }
            for p in patients
        ]


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
    
    @staticmethod
    def validate_practitioner_exists(practitioner_id: int) -> bool:
        return True
    
    @staticmethod
    def get_practitioner_summary(practitioner_id: int) -> Optional[Dict[str, Any]]:
        return {
            'id': practitioner_id,
            'full_name': 'Dr. [Placeholder]',
            'specialty': 'General Practice',
        }


class LocationACL:
    
    @staticmethod
    def validate_location_exists(location_id: int) -> bool:
        return True
    
    @staticmethod
    def get_location_summary(location_id: int) -> Optional[Dict[str, Any]]:
        return {
            'id': location_id,
            'name': 'Ward [Placeholder]',
            'type': 'Inpatient Ward',
        }


class OrganizationACL:
    
    @staticmethod
    def validate_organization_exists(organization_id: int) -> bool:
        return True
    
    @staticmethod
    def get_organization_summary(organization_id: int) -> Optional[Dict[str, Any]]:
        return {
            'id': organization_id,
            'name': 'Hospital [Placeholder]',
        }


__all__ = [
    'PatientACL',
    'EncounterService',
    'ProcedureService',
    'PractitionerACL',
    'LocationACL',
    'OrganizationACL',
]