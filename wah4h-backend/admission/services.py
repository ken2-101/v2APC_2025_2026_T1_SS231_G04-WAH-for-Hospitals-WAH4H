"""
Admission Service Layer
=======================
Business logic for Encounter and Procedure management.

Architectural Patterns:
- Service Layer Pattern: All business logic is encapsulated in service classes
- Late Imports: All model imports are done inside methods to prevent circular dependencies
- Manual FK Resolution: External string identifiers are resolved to internal integer PKs

Author: WAH4H Backend Team
Date: February 2, 2026
"""

import secrets
import uuid
from datetime import datetime
from django.utils import timezone
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import transaction


# ==================== ENCOUNTER SERVICE ====================

class EncounterService:
    """
    Service class for Encounter-related business logic.
    Handles encounter creation, state transitions, and discharge processing.
    """
    
    @staticmethod
    def _generate_identifier() -> str:
        """
        Generate a unique encounter identifier.
        
        Format: ENC-{YYYYMMDD}-{HEX6}
        Example: ENC-20260202-A3F2D1
        
        Returns:
            str: Unique encounter identifier
        """
        date_str = datetime.now().strftime('%Y%m%d')
        hex_suffix = secrets.token_hex(3).upper()  # 3 bytes = 6 hex characters
        return f"ENC-{date_str}-{hex_suffix}"
    
    @staticmethod
    @transaction.atomic
    def create_encounter(data: dict):
        """
        Create a new encounter with automatic patient resolution.
        
        Args:
            data (dict): Encounter data containing:
                - patient_id (str): External patient identifier (e.g., "P-2023-001")
                - status (str, optional): Encounter status (defaults to "arrived")
                - type (str, optional): Encounter type
                - priority (str, optional): Priority level
                - service_type (str, optional): Service type
                - class_field (str, optional): Encounter class (inpatient, outpatient, etc.)
                - period_start (date, optional): Start date
                - location_id (int, optional): Location reference
                - service_provider_id (int, optional): Service provider reference
                
        Returns:
            Encounter: The created encounter instance
            
        Raises:
            ValidationError: If patient_id is missing or patient not found
        """
        # Late import to prevent circular dependencies
        from .models import Encounter
        from patients.models import Patient
        
        # Validate required fields
        if 'patient_id' not in data or not data['patient_id']:
            raise ValidationError({
                'patient_id': 'Patient identifier is required'
            })
        
        patient_external_id = data['patient_id']
        
        # Manual FK Resolution: Resolve patient_id string to internal integer PK
        try:
            patient = Patient.objects.get(patient_id=patient_external_id)
            subject_patient_id = patient.id  # Extract internal PK
        except Patient.DoesNotExist:
            raise ValidationError({
                'patient_id': f'Patient with identifier "{patient_external_id}" not found'
            })
        
        # Generate unique identifier
        identifier = EncounterService._generate_identifier()
        
        # Ensure uniqueness (rare collision check)
        while Encounter.objects.filter(identifier=identifier).exists():
            identifier = EncounterService._generate_identifier()
        
        # Build encounter object with defaults
        encounter_data = {
            'identifier': identifier,
            'subject_patient_id': subject_patient_id,  # Resolved internal ID
            'status': data.get('status', 'arrived'),  # Default status
            'type': data.get('type'),
            'priority': data.get('priority'),
            'service_type': data.get('service_type'),
            'class_field': data.get('class_field'),  # Map to class_field in model
            'period_start': data.get('period_start', timezone.now().date()),
            'location_id': data.get('location_id'),
            'service_provider_id': data.get('service_provider_id'),
            'admit_source': data.get('admit_source'),
            're_admission': data.get('re_admission'),
            'participant_individual_id': data.get('participant_individual_id'),
            'participant_type': data.get('participant_type'),
            'episode_of_care_id': data.get('episode_of_care_id'),
            'based_on_service_request_id': data.get('based_on_service_request_id'),
            'appointment_id': data.get('appointment_id'),
        }
        
        # Remove None values to use model defaults
        encounter_data = {k: v for k, v in encounter_data.items() if v is not None}
        
        # Create and save encounter
        encounter = Encounter.objects.create(**encounter_data)
        
        return encounter
    
    @staticmethod
    @transaction.atomic
    def discharge_encounter(encounter, disposition: str, destination_id: int = None):
        """
        Perform discharge state transition for an encounter.
        
        Args:
            encounter (Encounter): The encounter instance to discharge
            disposition (str): Discharge disposition description
            destination_id (int, optional): Discharge destination location ID
            
        Returns:
            Encounter: The updated encounter instance
            
        Raises:
            ValidationError: If encounter is already finished or invalid state
        """
        # Late import to prevent circular dependencies
        from .models import Encounter
        
        # Validate current state
        if encounter.status == 'finished':
            raise ValidationError({
                'status': 'Encounter is already finished'
            })
        
        if encounter.status == 'cancelled':
            raise ValidationError({
                'status': 'Cannot discharge a cancelled encounter'
            })
        
        # Perform state transition
        encounter.status = 'finished'
        encounter.period_end = timezone.now().date()
        encounter.discharge_disposition = disposition
        
        if destination_id is not None:
            encounter.discharge_destination_id = destination_id
        
        encounter.save()
        
        return encounter
    
    @staticmethod
    def get_active_encounters(patient_id: str = None):
        """
        Retrieve active encounters, optionally filtered by patient.
        
        Args:
            patient_id (str, optional): External patient identifier to filter by
            
        Returns:
            QuerySet: Active encounters (not finished or cancelled)
        """
        # Late import to prevent circular dependencies
        from .models import Encounter
        from patients.models import Patient
        
        queryset = Encounter.objects.exclude(
            status__in=['finished', 'cancelled']
        )
        
        if patient_id:
            try:
                patient = Patient.objects.get(patient_id=patient_id)
                queryset = queryset.filter(subject_patient_id=patient.id)
            except Patient.DoesNotExist:
                return Encounter.objects.none()
        
        return queryset.order_by('-period_start')
    
    @staticmethod
    @transaction.atomic
    def update_encounter(encounter, data: dict):
        """
        Update encounter details.
        
        Args:
            encounter (Encounter): The encounter instance to update
            data (dict): Dictionary of fields to update
            
        Returns:
            Encounter: The updated encounter instance
            
        Raises:
            ValidationError: If attempting to update immutable fields
        """
        # Immutable fields
        immutable_fields = ['encounter_id', 'identifier', 'subject_patient_id', 'created_at']
        
        for field in immutable_fields:
            if field in data:
                raise ValidationError({
                    field: f'Field "{field}" is immutable and cannot be updated'
                })
        
        # Update allowed fields
        for field, value in data.items():
            if hasattr(encounter, field):
                setattr(encounter, field, value)
        
        encounter.save()
        
        return encounter


# ==================== PROCEDURE SERVICE ====================

class ProcedureService:
    """
    Service class for Procedure-related business logic.
    Handles procedure recording, status management, and performer tracking.
    """
    
    @staticmethod
    def _generate_identifier() -> str:
        """
        Generate a unique procedure identifier.
        
        Format: PROC-{UUID}
        Example: PROC-550e8400-e29b-41d4-a716-446655440000
        
        Returns:
            str: Unique procedure identifier
        """
        return f"PROC-{uuid.uuid4()}"
    
    @staticmethod
    @transaction.atomic
    def record_procedure(data: dict, user):
        """
        Record a new procedure with automatic encounter and patient linkage.
        
        Args:
            data (dict): Procedure data containing:
                - encounter_identifier (str): External encounter identifier
                - code_code (str): Procedure code (ICD, SNOMED, etc.)
                - code_display (str): Human-readable procedure name
                - status (str, optional): Procedure status (defaults to "completed")
                - category_code (str, optional): Procedure category
                - category_display (str, optional): Category display name
                - performed_datetime (datetime, optional): When performed
                - body_site_code (str, optional): Anatomical site code
                - body_site_display (str, optional): Anatomical site display
                - reason_code_code (str, optional): Reason code
                - reason_code_display (str, optional): Reason display
                - outcome_code (str, optional): Outcome code
                - outcome_display (str, optional): Outcome display
                - note (str, optional): Additional notes
                
            user (User): The user recording the procedure (becomes recorder)
            
        Returns:
            Procedure: The created procedure instance
            
        Raises:
            ValidationError: If encounter_identifier is missing or encounter not found
        """
        # Late import to prevent circular dependencies
        from .models import Procedure, Encounter
        
        # Validate required fields
        if 'encounter_identifier' not in data or not data['encounter_identifier']:
            raise ValidationError({
                'encounter_identifier': 'Encounter identifier is required'
            })
        
        encounter_external_id = data['encounter_identifier']
        
        # Manual FK Resolution: Resolve encounter_identifier to internal integer PK
        try:
            encounter = Encounter.objects.get(identifier=encounter_external_id)
            encounter_id = encounter.encounter_id  # Extract internal PK
        except Encounter.DoesNotExist:
            raise ValidationError({
                'encounter_identifier': f'Encounter with identifier "{encounter_external_id}" not found'
            })
        
        # Crucial: Automatically link patient from encounter
        subject_id = encounter.subject_patient_id
        
        # Generate unique identifier
        identifier = ProcedureService._generate_identifier()
        
        # Ensure uniqueness (rare collision check)
        while Procedure.objects.filter(identifier=identifier).exists():
            identifier = ProcedureService._generate_identifier()
        
        # Build procedure object with defaults
        procedure_data = {
            'identifier': identifier,
            'encounter_id': encounter_id,  # Resolved encounter internal ID
            'subject_id': subject_id,  # Auto-linked from encounter
            'recorder_id': user.id,  # Current user as recorder
            'status': data.get('status', 'completed'),  # Default status
            'code_code': data.get('code_code'),
            'code_display': data.get('code_display'),
            'category_code': data.get('category_code'),
            'category_display': data.get('category_display'),
            'performed_datetime': data.get('performed_datetime', timezone.now()),
            'body_site_code': data.get('body_site_code'),
            'body_site_display': data.get('body_site_display'),
            'reason_code_code': data.get('reason_code_code'),
            'reason_code_display': data.get('reason_code_display'),
            'outcome_code': data.get('outcome_code'),
            'outcome_display': data.get('outcome_display'),
            'note': data.get('note'),
            'location_id': data.get('location_id'),
            'performer_actor_id': data.get('performer_actor_id'),
            'performer_function_code': data.get('performer_function_code'),
            'performer_function_display': data.get('performer_function_display'),
        }
        
        # Remove None values to use model defaults
        procedure_data = {k: v for k, v in procedure_data.items() if v is not None}
        
        # Create and save procedure
        procedure = Procedure.objects.create(**procedure_data)
        
        return procedure
    
    @staticmethod
    @transaction.atomic
    def add_procedure_performer(procedure, performer_actor_id: int, 
                                function_code: str = None, function_display: str = None,
                                on_behalf_of_id: int = None):
        """
        Add a performer to an existing procedure.
        
        Args:
            procedure (Procedure): The procedure instance
            performer_actor_id (int): Practitioner ID performing the procedure
            function_code (str, optional): Function/role code
            function_display (str, optional): Function/role display name
            on_behalf_of_id (int, optional): Organization ID
            
        Returns:
            ProcedurePerformer: The created performer record
        """
        # Late import to prevent circular dependencies
        from .models import ProcedurePerformer
        
        performer = ProcedurePerformer.objects.create(
            procedure_id=procedure.procedure_id,
            performer_actor_id=performer_actor_id,
            performer_function_code=function_code,
            performer_function_display=function_display,
            performer_on_behalf_of_id=on_behalf_of_id
        )
        
        return performer
    
    @staticmethod
    @transaction.atomic
    def update_procedure_status(procedure, new_status: str, status_reason_code: str = None,
                                status_reason_display: str = None):
        """
        Update procedure status with optional reason.
        
        Args:
            procedure (Procedure): The procedure instance to update
            new_status (str): New status value
            status_reason_code (str, optional): Reason code for status change
            status_reason_display (str, optional): Reason display text
            
        Returns:
            Procedure: The updated procedure instance
            
        Raises:
            ValidationError: If status transition is invalid
        """
        # Valid status values (FHIR Procedure status)
        valid_statuses = [
            'preparation', 'in-progress', 'not-done', 'on-hold',
            'stopped', 'completed', 'entered-in-error', 'unknown'
        ]
        
        if new_status not in valid_statuses:
            raise ValidationError({
                'status': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            })
        
        procedure.status = new_status
        
        if status_reason_code:
            procedure.status_reason_code = status_reason_code
        
        if status_reason_display:
            procedure.status_reason_display = status_reason_display
        
        procedure.save()
        
        return procedure
    
    @staticmethod
    def get_procedures_by_encounter(encounter_identifier: str):
        """
        Retrieve all procedures for a specific encounter.
        
        Args:
            encounter_identifier (str): External encounter identifier
            
        Returns:
            QuerySet: Procedures associated with the encounter
        """
        # Late import to prevent circular dependencies
        from .models import Procedure, Encounter
        
        try:
            encounter = Encounter.objects.get(identifier=encounter_identifier)
            return Procedure.objects.filter(
                encounter_id=encounter.encounter_id
            ).order_by('-performed_datetime')
        except Encounter.DoesNotExist:
            return Procedure.objects.none()
    
    @staticmethod
    def get_procedures_by_patient(patient_id: str):
        """
        Retrieve all procedures for a specific patient.
        
        Args:
            patient_id (str): External patient identifier
            
        Returns:
            QuerySet: Procedures associated with the patient
        """
        # Late import to prevent circular dependencies
        from .models import Procedure
        from patients.models import Patient
        
        try:
            patient = Patient.objects.get(patient_id=patient_id)
            return Procedure.objects.filter(
                subject_id=patient.id
            ).order_by('-performed_datetime')
        except Patient.DoesNotExist:
            return Procedure.objects.none()


# ==================== UTILITY FUNCTIONS ====================

def validate_encounter_status_transition(current_status: str, new_status: str) -> bool:
    """
    Validate if a status transition is allowed for encounters.
    
    Args:
        current_status (str): Current encounter status
        new_status (str): Desired new status
        
    Returns:
        bool: True if transition is valid
        
    Raises:
        ValidationError: If transition is not allowed
    """
    # FHIR Encounter status state machine
    valid_transitions = {
        'planned': ['arrived', 'triaged', 'cancelled'],
        'arrived': ['triaged', 'in-progress', 'cancelled'],
        'triaged': ['in-progress', 'cancelled'],
        'in-progress': ['onleave', 'finished', 'cancelled'],
        'onleave': ['in-progress', 'finished', 'cancelled'],
        'finished': [],  # Terminal state
        'cancelled': [],  # Terminal state
        'entered-in-error': [],  # Terminal state
        'unknown': ['planned', 'arrived', 'triaged', 'in-progress'],
    }
    
    allowed = valid_transitions.get(current_status, [])
    
    if new_status not in allowed:
        raise ValidationError({
            'status': f'Invalid transition from "{current_status}" to "{new_status}". '
                     f'Allowed transitions: {", ".join(allowed) if allowed else "none (terminal state)"}'
        })
    
    return True


def get_encounter_summary(encounter_identifier: str) -> dict:
    """
    Get a comprehensive summary of an encounter including procedures.
    
    Args:
        encounter_identifier (str): External encounter identifier
        
    Returns:
        dict: Summary containing encounter and related data
        
    Raises:
        ObjectDoesNotExist: If encounter not found
    """
    # Late import to prevent circular dependencies
    from .models import Encounter, Procedure
    
    encounter = Encounter.objects.get(identifier=encounter_identifier)
    procedures = Procedure.objects.filter(encounter_id=encounter.encounter_id)
    
    return {
        'encounter': encounter,
        'patient_id': encounter.subject_patient_id,
        'status': encounter.status,
        'period_start': encounter.period_start,
        'period_end': encounter.period_end,
        'procedures_count': procedures.count(),
        'procedures': list(procedures.values(
            'identifier', 'code_display', 'status', 'performed_datetime'
        ))
    }
