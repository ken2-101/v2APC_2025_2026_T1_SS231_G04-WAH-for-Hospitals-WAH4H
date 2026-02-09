"""
admission/services/admission_services.py

Write Service Layer for the Admission Module.
Service-Driven Architecture (Write Operations Only).

Architecture Pattern: Fortress Pattern - Write Layer
- All CREATE/UPDATE/DELETE operations go through this service
- Atomic transactions with proper validation
- External references validated via ACLs (Patient, Practitioner, Location)
- Returns domain model objects (NOT DTOs)

Context: Philippine LGU Hospital System
"""

from typing import Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist

from admission.models import Encounter, Procedure, ProcedurePerformer
from patients.services.patient_acl import validate_patient_exists, get_patient_summary
from accounts.models import Practitioner, Location


class EncounterService:
    """
    Service Layer for Encounter write operations.
    Handles patient admission and discharge workflows.
    """
    
    @staticmethod
    @transaction.atomic
    def admit_patient(data: Dict[str, Any]) -> Encounter:
        """
        Admit a patient and create an encounter.
        
        Args:
            data: Dictionary with encounter data
                Required:
                    - subject_id (int): Patient ID
                Optional:
                    - class_field (str): inpatient, outpatient, emergency
                    - service_type (str)
                    - priority (str)
                    - reason_code (str)
                    - period_start (date)
                    - location_id (int)
                    - participant_individual_id (int): Admitting practitioner
                    - admit_source (str)
                    - account_id (int)
        
        Returns:
            Encounter: Created encounter object
        
        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        subject_id = data.get('subject_id')
        if not subject_id:
            raise ValidationError("subject_id is required")
        
        # Validate patient exists via ACL
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with ID {subject_id} does not exist")
        
        # Validate practitioner if provided
        participant_id = data.get('participant_individual_id')
        if participant_id:
            if not Practitioner.objects.filter(practitioner_id=participant_id).exists():
                raise ValidationError(f"Practitioner with ID {participant_id} does not exist")
        
        # Validate location if provided
        location_id = data.get('location_id')
        if location_id:
            if not Location.objects.filter(location_id=location_id).exists():
                raise ValidationError(f"Location with ID {location_id} does not exist")
        
        if not data.get('identifier'):
            import random
            # Generate 11 random digits
            random_digits = ''.join([str(random.randint(0, 9)) for _ in range(11)])
            data['identifier'] = f"ENC-{random_digits}"

        # Create encounter with status 'in-progress'
        encounter = Encounter.objects.create(
            identifier=data.get('identifier'),
            subject_id=subject_id,
            status='in-progress',
            class_field=data.get('class_field', 'inpatient'),
            type=data.get('type'),
            service_type=data.get('service_type'),
            priority=data.get('priority'),
            period_start=data.get('period_start'),
            reason_code=data.get('reason_code'),
            participant_individual_id=participant_id,
            participant_type=data.get('participant_type'),
            location_id=location_id,
            location_status=data.get('location_status'),
            admit_source=data.get('admit_source'),
            account_id=data.get('account_id'),
            pre_admission_identifier=data.get('pre_admission_identifier')
        )
        
        return encounter
    
    @staticmethod
    @transaction.atomic
    def discharge_patient(encounter_id: int, data: Dict[str, Any]) -> Encounter:
        """
        Discharge a patient and complete the encounter.
        
        Args:
            encounter_id: ID of the encounter to discharge
            data: Dictionary with discharge data
                Optional:
                    - period_end (date): Discharge date
                    - discharge_disposition (str)
                    - discharge_destination_id (int): Location ID
        
        Returns:
            Encounter: Updated encounter object
        
        Raises:
            ValidationError: If validation fails
            ObjectDoesNotExist: If encounter not found
        """
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Encounter with ID {encounter_id} does not exist")
        
        # Validate encounter is not already discharged
        if encounter.status == 'finished':
            raise ValidationError("Encounter is already discharged")
        
        # Validate discharge destination if provided
        discharge_destination_id = data.get('discharge_destination_id')
        if discharge_destination_id:
            if not Location.objects.filter(location_id=discharge_destination_id).exists():
                raise ValidationError(f"Discharge destination with ID {discharge_destination_id} does not exist")
        
        # Update encounter status to finished
        encounter.status = 'finished'
        encounter.period_end = data.get('period_end')
        encounter.discharge_disposition = data.get('discharge_disposition')
        encounter.discharge_destination_id = discharge_destination_id
        encounter.save()
        
        return encounter
    
    @staticmethod
    @transaction.atomic
    def update_encounter(encounter_id: int, data: Dict[str, Any]) -> Encounter:
        """
        Update an existing encounter.
        
        Args:
            encounter_id: ID of the encounter to update
            data: Dictionary with fields to update
        
        Returns:
            Encounter: Updated encounter object
        
        Raises:
            ValidationError: If validation fails
            ObjectDoesNotExist: If encounter not found
        """
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Encounter with ID {encounter_id} does not exist")
        
        # Update allowed fields
        allowed_fields = [
            'class_field', 'type', 'service_type', 'priority', 
            'reason_code', 'location_id', 'participant_individual_id',
            'admit_source', 'diet_preference', 'special_courtesy',
            'special_arrangement'
        ]
        
        for field in allowed_fields:
            if field in data:
                # Validate location if being updated
                if field == 'location_id' and data[field]:
                    if not Location.objects.filter(location_id=data[field]).exists():
                        raise ValidationError(f"Location with ID {data[field]} does not exist")
                
                # Validate practitioner if being updated
                if field == 'participant_individual_id' and data[field]:
                    if not Practitioner.objects.filter(practitioner_id=data[field]).exists():
                        raise ValidationError(f"Practitioner with ID {data[field]} does not exist")
                
                setattr(encounter, field, data[field])
        
        encounter.save()
        return encounter


class ProcedureService:
    """
    Service Layer for Procedure write operations.
    Handles procedure recording during encounters.
    """
    
    @staticmethod
    @transaction.atomic
    def record_procedure(data: Dict[str, Any]) -> Procedure:
        """
        Record a procedure performed during an encounter.
        
        Args:
            data: Dictionary with procedure data
                Required:
                    - encounter_id (int): Encounter FK (internal)
                    - subject_id (int): Patient ID
                    - code_code (str): Procedure code
                Optional:
                    - status (str): Default 'completed'
                    - performed_datetime (datetime)
                    - category_code (str)
                    - code_display (str)
                    - body_site_code (str)
                    - outcome_code (str)
                    - note (str)
                    - performers (List[Dict]): List of performer data
                        - performer_actor_id (int): Practitioner ID
                        - performer_function_code (str)
                        - performer_on_behalf_of_id (int): Organization ID
        
        Returns:
            Procedure: Created procedure object
        
        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        encounter_id = data.get('encounter_id')
        subject_id = data.get('subject_id')
        code_code = data.get('code_code')
        
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        if not subject_id:
            raise ValidationError("subject_id is required")
        if not code_code:
            raise ValidationError("code_code is required")
        
        # Validate encounter exists (internal integrity)
        try:
            encounter = Encounter.objects.get(encounter_id=encounter_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Encounter with ID {encounter_id} does not exist")
        
        # Validate patient exists via ACL
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with ID {subject_id} does not exist")
        
        # Validate patient matches encounter's patient
        if encounter.subject_id != subject_id:
            raise ValidationError("Procedure subject_id must match encounter's subject_id")
        
        # Create procedure
        procedure = Procedure.objects.create(
            encounter=encounter,
            subject_id=subject_id,
            status=data.get('status', 'completed'),
            code_code=code_code,
            code_display=data.get('code_display'),
            category_code=data.get('category_code'),
            category_display=data.get('category_display'),
            performed_datetime=data.get('performed_datetime'),
            performed_period_start=data.get('performed_period_start'),
            performed_period_end=data.get('performed_period_end'),
            body_site_code=data.get('body_site_code'),
            body_site_display=data.get('body_site_display'),
            outcome_code=data.get('outcome_code'),
            outcome_display=data.get('outcome_display'),
            note=data.get('note'),
            location_id=data.get('location_id'),
            recorder_id=data.get('recorder_id'),
            asserter_id=data.get('asserter_id')
        )
        
        # Create linked ProcedurePerformer entries if provided
        performers = data.get('performers', [])
        for performer_data in performers:
            performer_actor_id = performer_data.get('performer_actor_id')
            
            # Validate practitioner if provided
            if performer_actor_id:
                if not Practitioner.objects.filter(practitioner_id=performer_actor_id).exists():
                    raise ValidationError(f"Practitioner with ID {performer_actor_id} does not exist")
            
            ProcedurePerformer.objects.create(
                procedure=procedure,
                performer_actor_id=performer_actor_id,
                performer_function_code=performer_data.get('performer_function_code'),
                performer_function_display=performer_data.get('performer_function_display'),
                performer_on_behalf_of_id=performer_data.get('performer_on_behalf_of_id')
            )
        
        return procedure
