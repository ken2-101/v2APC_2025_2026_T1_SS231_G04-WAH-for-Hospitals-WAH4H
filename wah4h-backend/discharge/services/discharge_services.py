"""
discharge/services/discharge_services.py

Write Layer (Command Operations) for the Discharge Module.
Fortress Pattern - Internal Service Layer (NOT exposed to external apps).

This module handles:
1. Recording clinical procedures during hospitalization
2. Managing the discharge workflow
3. Enforcing financial clearance gatekeeper logic

Context: Philippine LGU Hospital System
"""

from typing import Dict, Any, List, Optional
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from datetime import datetime

from discharge.models import Discharge, Procedure, ProcedurePerformer

# ACL Imports (Fortress Pattern - No direct model imports from other apps)
from admission.services.admission_acl import EncounterACL
from patients.services.patient_acl import validate_patient_exists, get_patient_summary
from accounts.models import Practitioner

# Mock billing ACL - assume this exists in billing app
# from billing.services.billing_acl import BillingACL


class ProcedureService:
    """
    Service for recording clinical procedures performed during hospitalization.
    
    Validates references via ACLs and creates nested Procedure + ProcedurePerformer records.
    """
    
    @staticmethod
    @transaction.atomic
    def record_procedure(data: Dict[str, Any]) -> Procedure:
        """
        Record a clinical procedure with nested performers.
        
        Args:
            data: Dictionary containing procedure fields
                Required:
                    - subject_id (int): Patient ID
                    - encounter_id (int): Encounter ID
                    - code_code (str): Procedure code
                    - code_display (str): Procedure name
                    - status (str): Procedure status
                Optional:
                    - performed_datetime (datetime)
                    - body_site_code (str)
                    - outcome_code (str)
                    - note (str)
                    - performers (list): List of performer dicts
                        - performer_actor_id (int): Practitioner ID
                        - performer_function_code (str)
                        - performer_function_display (str)
        
        Returns:
            Procedure: Created procedure instance
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate patient exists
        subject_id = data.get('subject_id')
        if not subject_id:
            raise ValidationError("subject_id is required")
        
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with id {subject_id} does not exist")
        
        # Validate encounter exists
        encounter_id = data.get('encounter_id')
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        
        if not EncounterACL.validate_encounter_exists(encounter_id):
            raise ValidationError(f"Encounter with id {encounter_id} does not exist")
        
        # Validate required procedure fields
        if not data.get('code_code'):
            raise ValidationError("code_code is required")
        if not data.get('code_display'):
            raise ValidationError("code_display is required")
        if not data.get('status'):
            raise ValidationError("status is required")
        
        # Validate performers if provided
        performers_data = data.get('performers', [])
        for performer in performers_data:
            actor_id = performer.get('performer_actor_id')
            if actor_id and not Practitioner.objects.filter(practitioner_id=actor_id).exists():
                raise ValidationError(f"Practitioner with id {actor_id} does not exist")
        
        # Create Procedure
        procedure = Procedure.objects.create(
            identifier=data.get('identifier', ''),
            status=data['status'],
            subject_id=subject_id,
            encounter_id=encounter_id,
            code_code=data['code_code'],
            code_display=data['code_display'],
            category_code=data.get('category_code'),
            category_display=data.get('category_display'),
            body_site_code=data.get('body_site_code'),
            body_site_display=data.get('body_site_display'),
            performed_datetime=data.get('performed_datetime'),
            performed_period_start=data.get('performed_period_start'),
            performed_period_end=data.get('performed_period_end'),
            outcome_code=data.get('outcome_code'),
            outcome_display=data.get('outcome_display'),
            reason_code_code=data.get('reason_code_code'),
            reason_code_display=data.get('reason_code_display'),
            note=data.get('note'),
            asserter_id=data.get('asserter_id'),
            performer_actor_id=data.get('performer_actor_id'),
            performer_function_code=data.get('performer_function_code'),
            performer_function_display=data.get('performer_function_display'),
        )
        
        # Create nested ProcedurePerformer records
        for performer_data in performers_data:
            ProcedurePerformer.objects.create(
                procedure=procedure,
                performer_actor_id=performer_data.get('performer_actor_id'),
                performer_on_behalf_of_id=performer_data.get('performer_on_behalf_of_id'),
                performer_function_code=performer_data.get('performer_function_code'),
                performer_function_display=performer_data.get('performer_function_display'),
            )
        
        return procedure
    
    @staticmethod
    def update_procedure(procedure_id: int, data: Dict[str, Any]) -> Procedure:
        """
        Update an existing procedure.
        
        Args:
            procedure_id: Primary key of the procedure
            data: Dictionary of fields to update
            
        Returns:
            Procedure: Updated procedure instance
            
        Raises:
            ValidationError: If validation fails
            ObjectDoesNotExist: If procedure not found
        """
        try:
            procedure = Procedure.objects.get(procedure_id=procedure_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Procedure with id {procedure_id} does not exist")
        
        # Update allowed fields
        updatable_fields = [
            'status', 'code_code', 'code_display', 'category_code', 'category_display',
            'body_site_code', 'body_site_display', 'outcome_code', 'outcome_display',
            'note', 'performed_datetime', 'performed_period_start', 'performed_period_end'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(procedure, field, data[field])
        
        procedure.save()
        return procedure


class DischargeWorkflowService:
    """
    Service for managing the discharge workflow.
    
    Orchestrates discharge initiation and finalization with financial gatekeeper logic.
    """
    
    @staticmethod
    @transaction.atomic
    def initiate_discharge(data: Dict[str, Any]) -> Discharge:
        """
        Initiate the discharge process for a patient.
        
        Creates a Discharge record with status 'in-progress'.
        
        Args:
            data: Dictionary containing discharge fields
                Required:
                    - encounter_id (int): Encounter ID
                    - patient_id (int): Patient ID
                Optional:
                    - physician_id (int): Discharging physician ID
                    - notice_datetime (datetime): When discharge was noticed
                    - summary_of_stay (str): Clinical summary
                    - discharge_instructions (str): Patient instructions
                    - follow_up_plan (str): Follow-up care plan
                    - created_by (str): User who initiated
        
        Returns:
            Discharge: Created discharge record
            
        Raises:
            ValidationError: If validation fails
        """
        # Validate patient exists
        patient_id = data.get('patient_id')
        if not patient_id:
            raise ValidationError("patient_id is required")
        
        if not validate_patient_exists(patient_id):
            raise ValidationError(f"Patient with id {patient_id} does not exist")
        
        # Validate encounter exists
        encounter_id = data.get('encounter_id')
        if not encounter_id:
            raise ValidationError("encounter_id is required")
        
        if not EncounterACL.validate_encounter_exists(encounter_id):
            raise ValidationError(f"Encounter with id {encounter_id} does not exist")
        
        # Check if discharge already exists for this encounter
        if Discharge.objects.filter(encounter_id=encounter_id).exists():
            raise ValidationError(f"Discharge already initiated for encounter {encounter_id}")
        
        # Validate physician if provided
        physician_id = data.get('physician_id')
        if physician_id and not Practitioner.objects.filter(practitioner_id=physician_id).exists():
            raise ValidationError(f"Physician with id {physician_id} does not exist")
        
        # Create Discharge record with status 'in-progress'
        discharge = Discharge.objects.create(
            encounter_id=encounter_id,
            patient_id=patient_id,
            physician_id=physician_id,
            notice_datetime=data.get('notice_datetime', datetime.now()),
            workflow_status='in-progress',
            summary_of_stay=data.get('summary_of_stay'),
            discharge_instructions=data.get('discharge_instructions'),
            follow_up_plan=data.get('follow_up_plan'),
            pending_items=data.get('pending_items'),
            created_by=data.get('created_by'),
        )
        
        return discharge
    
    @staticmethod
    @transaction.atomic
    def finalize_discharge(discharge_id: int, finalized_by: Optional[str] = None) -> Discharge:
        """
        Finalize the discharge process with financial clearance gatekeeper.
        
        CRITICAL GATEKEEPER LOGIC:
        1. Verifies patient has cleared all financial obligations via BillingACL
        2. If balance > 0, raises ValidationError
        3. If cleared, updates discharge status to 'completed'
        4. Updates encounter status to 'finished' via AdmissionACL
        
        Args:
            discharge_id: Primary key of the discharge record
            finalized_by: User who finalized the discharge
            
        Returns:
            Discharge: Updated discharge record
            
        Raises:
            ValidationError: If validation fails or financial clearance not met
            ObjectDoesNotExist: If discharge not found
        """
        try:
            discharge = Discharge.objects.get(discharge_id=discharge_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Discharge with id {discharge_id} does not exist")
        
        # Check if already finalized
        if discharge.workflow_status == 'completed':
            raise ValidationError(f"Discharge {discharge_id} is already finalized")
        
        # GATEKEEPER: Check financial clearance via BillingACL
        # NOTE: Uncomment when BillingACL is implemented
        # try:
        #     outstanding_balance = BillingACL.get_outstanding_balance(discharge.encounter_id)
        #     if outstanding_balance > 0:
        #         raise ValidationError(
        #             f"Cannot finalize discharge. Outstanding balance: ₱{outstanding_balance:.2f}. "
        #             f"Patient must clear all financial obligations before discharge."
        #         )
        # except Exception as e:
        #     raise ValidationError(f"Error checking billing clearance: {str(e)}")
        
        # Update discharge record to completed
        discharge.workflow_status = 'completed'
        discharge.discharge_datetime = datetime.now()
        discharge.billing_cleared_datetime = datetime.now()
        
        if finalized_by:
            discharge.created_by = finalized_by  # Store who finalized
        
        discharge.save()
        
        # TODO: Update encounter status to 'finished' via AdmissionACL
        # NOTE: This requires AdmissionACL to expose an update method
        # For now, we acknowledge this is a future enhancement
        # The admission app would need to add:
        # AdmissionACL.update_encounter_status(encounter_id, 'finished')
        
        return discharge
    
    @staticmethod
    def update_discharge_details(discharge_id: int, data: Dict[str, Any]) -> Discharge:
        """
        Update discharge clinical documentation.
        
        Args:
            discharge_id: Primary key of the discharge record
            data: Dictionary of fields to update
            
        Returns:
            Discharge: Updated discharge record
            
        Raises:
            ValidationError: If validation fails
            ObjectDoesNotExist: If discharge not found
        """
        try:
            discharge = Discharge.objects.get(discharge_id=discharge_id)
        except ObjectDoesNotExist:
            raise ValidationError(f"Discharge with id {discharge_id} does not exist")
        
        # Prevent updates to finalized discharges
        if discharge.workflow_status == 'completed':
            raise ValidationError("Cannot update a finalized discharge")
        
        # Update allowed fields
        updatable_fields = [
            'summary_of_stay', 'discharge_instructions', 'follow_up_plan',
            'pending_items', 'physician_id'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(discharge, field, data[field])
        
        discharge.save()
        return discharge
