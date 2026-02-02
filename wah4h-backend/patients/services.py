"""
Service Layer for Patients App
Enforces business rules and encapsulates all database write operations
"""
import uuid
import secrets
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Dict, Any, Optional

from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import Q

from patients.models import Patient, Condition, AllergyIntolerance, Immunization
from accounts.models import Practitioner, Organization, Location


# ============================================================================
# Custom Exceptions
# ============================================================================

class DuplicatePatientError(Exception):
    """Raised when attempting to register a patient that already exists"""
    pass


# ============================================================================
# Patient Service
# ============================================================================

class PatientService:
    """
    Business logic for Patient registration and management
    """
    
    @staticmethod
    def _generate_patient_id() -> str:
        """
        Generate unique external patient ID in format: P-{YYYY}{MM}-{RandomHex}
        Example: P-202602-A1B2C3
        """
        now = datetime.now()
        date_prefix = now.strftime("%Y%m")
        random_hex = secrets.token_hex(3).upper()  # 6 characters
        return f"P-{date_prefix}-{random_hex}"
    
    @staticmethod
    def _validate_philhealth_id(philhealth_id: str) -> None:
        """
        Validate PhilHealth ID format: XX-XXXXXXXXX-X
        Example: 12-345678901-2
        """
        import re
        pattern = r'^\d{2}-\d{9}-\d{1}$'
        if not re.match(pattern, philhealth_id):
            raise ValidationError(
                "Invalid PhilHealth ID format. Expected format: XX-XXXXXXXXX-X (e.g., 12-345678901-2)"
            )
    
    @staticmethod
    def _check_duplicate_patient(last_name: str, first_name: str, birthdate) -> bool:
        """
        Check if a patient with matching last_name, first_name, and birthdate exists
        Returns True if duplicate found
        """
        if not all([last_name, first_name, birthdate]):
            return False
        
        return Patient.objects.filter(
            last_name__iexact=last_name,
            first_name__iexact=first_name,
            birthdate=birthdate
        ).exists()
    
    @staticmethod
    @transaction.atomic
    def register_patient(data: Dict[str, Any]) -> Patient:
        """
        Register a new patient with strict validation and deduplication
        
        Args:
            data: Dictionary containing patient information
            
        Returns:
            Patient instance
            
        Raises:
            DuplicatePatientError: If patient already exists
            ValidationError: If validation fails
        """
        # Step A: Strict Deduplication Check
        last_name = data.get('last_name', '').strip()
        first_name = data.get('first_name', '').strip()
        birthdate = data.get('birthdate')
        
        if PatientService._check_duplicate_patient(last_name, first_name, birthdate):
            raise DuplicatePatientError(
                f"Patient with name '{first_name} {last_name}' and birthdate '{birthdate}' already exists."
            )
        
        # Step B: External ID Generation
        if not data.get('patient_id'):
            # Generate unique patient_id
            while True:
                generated_id = PatientService._generate_patient_id()
                if not Patient.objects.filter(patient_id=generated_id).exists():
                    data['patient_id'] = generated_id
                    break
        else:
            # Validate uniqueness if provided
            if Patient.objects.filter(patient_id=data['patient_id']).exists():
                raise ValidationError(f"Patient ID '{data['patient_id']}' already exists.")
        
        # Step C: Consent Validation
        consent_flag = data.get('consent_flag')
        if consent_flag is not True:
            raise ValidationError("General Consent to Treat is required for registration.")
        
        # Step D: PhilHealth Validation
        philhealth_id = data.get('philhealth_id')
        if philhealth_id:
            philhealth_id = philhealth_id.strip()
            if philhealth_id:  # Only validate if not empty after strip
                PatientService._validate_philhealth_id(philhealth_id)
                data['philhealth_id'] = philhealth_id
        
        # Step E: Creation
        patient = Patient.objects.create(**data)
        return patient
    
    @staticmethod
    @transaction.atomic
    def update_patient_demographics(patient: Patient, data: Dict[str, Any]) -> Patient:
        """
        Update patient demographic information
        
        Args:
            patient: Patient instance to update
            data: Dictionary containing fields to update
            
        Returns:
            Updated Patient instance
            
        Raises:
            ValidationError: If attempting to update protected fields
        """
        # Constraint: Forbid updating patient_id or birthdate
        protected_fields = ['patient_id', 'birthdate', 'id']
        attempted_protected = [field for field in protected_fields if field in data]
        
        if attempted_protected:
            raise ValidationError(
                f"Cannot update protected fields: {', '.join(attempted_protected)}. "
                "These fields require administrative override."
            )
        
        # Validate PhilHealth ID if being updated
        if 'philhealth_id' in data and data['philhealth_id']:
            philhealth_id = data['philhealth_id'].strip()
            if philhealth_id:
                PatientService._validate_philhealth_id(philhealth_id)
        
        # Update allowed fields
        for field, value in data.items():
            if hasattr(patient, field):
                setattr(patient, field, value)
        
        patient.save()
        return patient
    
    @staticmethod
    def get_patient_by_id(patient_id: str) -> Optional[Patient]:
        """
        Retrieve patient by external patient_id
        
        Args:
            patient_id: External patient identifier
            
        Returns:
            Patient instance or None
        """
        try:
            return Patient.objects.get(patient_id=patient_id)
        except Patient.DoesNotExist:
            return None
    
    @staticmethod
    def search_patients(
        query: Optional[str] = None,
        philhealth_id: Optional[str] = None,
        **filters
    ) -> 'QuerySet[Patient]':
        """
        Search patients with flexible criteria
        
        Args:
            query: Search term for name matching
            philhealth_id: PhilHealth ID exact match
            **filters: Additional field filters
            
        Returns:
            QuerySet of matching patients
        """
        queryset = Patient.objects.all()
        
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(patient_id__icontains=query)
            )
        
        if philhealth_id:
            queryset = queryset.filter(philhealth_id=philhealth_id)
        
        if filters:
            queryset = queryset.filter(**filters)
        
        return queryset.select_related(
            'general_practitioner',
            'managing_organization'
        ).order_by('-created_at')


# ============================================================================
# Clinical Service
# ============================================================================

class ClinicalService:
    """
    Business logic for clinical data management (Conditions, Allergies, Immunizations)
    """
    
    @staticmethod
    def _generate_identifier(prefix: str = "") -> str:
        """
        Generate unique identifier using UUID
        
        Args:
            prefix: Optional prefix for the identifier
            
        Returns:
            Unique identifier string
        """
        unique_id = str(uuid.uuid4())
        return f"{prefix}{unique_id}" if prefix else unique_id
    
    @staticmethod
    @transaction.atomic
    def record_condition(
        patient: Patient,
        data: Dict[str, Any],
        recorder: Practitioner,
        encounter: Optional[Any] = None
    ) -> Condition:
        """
        Record a new condition for a patient
        
        Args:
            patient: Patient instance
            data: Condition data
            recorder: Practitioner recording the condition
            encounter: Optional encounter reference
            
        Returns:
            Condition instance
            
        Raises:
            ValidationError: If required fields are missing
        """
        # Validation: Ensure code is present
        if not data.get('code'):
            raise ValidationError("Condition code is required.")
        
        # Auto-Generation: Generate identifier if missing
        if not data.get('identifier'):
            data['identifier'] = ClinicalService._generate_identifier(prefix="COND-")
        
        # Validate identifier uniqueness
        if Condition.objects.filter(identifier=data['identifier']).exists():
            raise ValidationError(f"Condition identifier '{data['identifier']}' already exists.")
        
        # Linking
        data['subject_id'] = patient
        data['recorder_id'] = recorder
        
        if encounter:
            data['encounter_id'] = encounter
        
        # Create condition
        condition = Condition.objects.create(**data)
        return condition
    
    @staticmethod
    @transaction.atomic
    def record_allergy(
        patient: Patient,
        data: Dict[str, Any],
        recorder: Practitioner,
        encounter: Optional[Any] = None
    ) -> AllergyIntolerance:
        """
        Record a new allergy/intolerance for a patient
        
        Args:
            patient: Patient instance
            data: Allergy data
            recorder: Practitioner recording the allergy
            encounter: Optional encounter reference
            
        Returns:
            AllergyIntolerance instance
            
        Raises:
            ValidationError: If required fields are missing
        """
        # Validation: Ensure code is present
        if not data.get('code'):
            raise ValidationError("Allergy code is required.")
        
        # Auto-Generation: Generate identifier if missing
        if not data.get('identifier'):
            data['identifier'] = ClinicalService._generate_identifier(prefix="ALLERGY-")
        
        # Validate identifier uniqueness
        if AllergyIntolerance.objects.filter(identifier=data['identifier']).exists():
            raise ValidationError(f"Allergy identifier '{data['identifier']}' already exists.")
        
        # Linking
        data['patient_id'] = patient
        data['recorder_id'] = recorder
        
        if encounter:
            data['encounter_id'] = encounter
        
        # Create allergy
        allergy = AllergyIntolerance.objects.create(**data)
        return allergy
    
    @staticmethod
    @transaction.atomic
    def record_immunization(
        patient: Patient,
        data: Dict[str, Any],
        performer: Practitioner,
        encounter: Optional[Any] = None,
        location: Optional[Location] = None
    ) -> Immunization:
        """
        Record a new immunization for a patient
        
        Args:
            patient: Patient instance
            data: Immunization data
            performer: Practitioner performing the immunization
            encounter: Optional encounter reference
            location: Optional location reference
            
        Returns:
            Immunization instance
            
        Raises:
            ValidationError: If required fields are missing or invalid
        """
        # Validation: Ensure status is present
        if not data.get('status'):
            raise ValidationError("Immunization status is required.")
        
        # Auto-Generation: Generate identifier if missing
        if not data.get('identifier'):
            data['identifier'] = ClinicalService._generate_identifier(prefix="IMM-")
        
        # Validate identifier uniqueness
        if Immunization.objects.filter(identifier=data['identifier']).exists():
            raise ValidationError(f"Immunization identifier '{data['identifier']}' already exists.")
        
        # Dose Logic: Ensure dose_quantity_value is handled safely
        if 'dose_quantity_value' in data and data['dose_quantity_value'] is not None:
            try:
                if not isinstance(data['dose_quantity_value'], Decimal):
                    data['dose_quantity_value'] = Decimal(str(data['dose_quantity_value']))
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError("Invalid dose quantity value. Must be a valid decimal number.")
        
        # Handle dose_quantity_unit (should also be Decimal per model)
        if 'dose_quantity_unit' in data and data['dose_quantity_unit'] is not None:
            try:
                if not isinstance(data['dose_quantity_unit'], Decimal):
                    data['dose_quantity_unit'] = Decimal(str(data['dose_quantity_unit']))
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError("Invalid dose quantity unit. Must be a valid decimal number.")
        
        # Handle dose_number_value
        if 'dose_number_value' in data and data['dose_number_value'] is not None:
            try:
                if not isinstance(data['dose_number_value'], Decimal):
                    data['dose_number_value'] = Decimal(str(data['dose_number_value']))
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError("Invalid dose number value. Must be a valid decimal number.")
        
        # Handle series_doses_value
        if 'series_doses_value' in data and data['series_doses_value'] is not None:
            try:
                if not isinstance(data['series_doses_value'], Decimal):
                    data['series_doses_value'] = Decimal(str(data['series_doses_value']))
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError("Invalid series doses value. Must be a valid decimal number.")
        
        # Linking
        data['patient_id'] = patient
        data['performer_id'] = performer
        
        if encounter:
            data['encounter_id'] = encounter
        
        if location:
            data['location_id'] = location
        
        # Create immunization
        immunization = Immunization.objects.create(**data)
        return immunization
    
    @staticmethod
    def get_patient_conditions(patient: Patient, active_only: bool = False) -> 'QuerySet[Condition]':
        """
        Retrieve all conditions for a patient
        
        Args:
            patient: Patient instance
            active_only: If True, return only active conditions
            
        Returns:
            QuerySet of Condition instances
        """
        queryset = Condition.objects.filter(subject_id=patient)
        
        if active_only:
            queryset = queryset.filter(clinical_status='active')
        
        return queryset.select_related(
            'recorder_id',
            'asserter_id',
            'encounter_id'
        ).order_by('-created_at')
    
    @staticmethod
    def get_patient_allergies(patient: Patient, active_only: bool = False) -> 'QuerySet[AllergyIntolerance]':
        """
        Retrieve all allergies for a patient
        
        Args:
            patient: Patient instance
            active_only: If True, return only active allergies
            
        Returns:
            QuerySet of AllergyIntolerance instances
        """
        queryset = AllergyIntolerance.objects.filter(patient_id=patient)
        
        if active_only:
            queryset = queryset.filter(clinical_status='active')
        
        return queryset.select_related(
            'recorder_id',
            'asserter_id',
            'encounter_id'
        ).order_by('-created_at')
    
    @staticmethod
    def get_patient_immunizations(patient: Patient) -> 'QuerySet[Immunization]':
        """
        Retrieve all immunizations for a patient
        
        Args:
            patient: Patient instance
            
        Returns:
            QuerySet of Immunization instances
        """
        return Immunization.objects.filter(
            patient_id=patient
        ).select_related(
            'performer_id',
            'location_id',
            'manufacturer_id',
            'encounter_id'
        ).order_by('-occurrence_datetime')


# ============================================================================
# Utility Functions
# ============================================================================

def get_patient_clinical_summary(patient: Patient) -> Dict[str, Any]:
    """
    Get comprehensive clinical summary for a patient
    
    Args:
        patient: Patient instance
        
    Returns:
        Dictionary with clinical summary data
    """
    return {
        'patient_id': patient.patient_id,
        'patient_name': f"{patient.first_name} {patient.last_name}",
        'active_conditions': ClinicalService.get_patient_conditions(patient, active_only=True).count(),
        'total_conditions': ClinicalService.get_patient_conditions(patient).count(),
        'active_allergies': ClinicalService.get_patient_allergies(patient, active_only=True).count(),
        'total_allergies': ClinicalService.get_patient_allergies(patient).count(),
        'total_immunizations': ClinicalService.get_patient_immunizations(patient).count(),
    }
