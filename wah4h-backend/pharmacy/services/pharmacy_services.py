"""
pharmacy/services/pharmacy_services.py

Write-Only Service Layer for the Pharmacy Module.
Architecture Pattern: Fortress Pattern - Write Layer (Transaction Scripts)

Context: Philippine LGU Hospital System
- Manages medication inventory (stock levels, expiry tracking)
- Handles prescription requests (MedicationRequest + Dosage)
- Tracks medication administration (MedicationAdministration + Dosage)
- Deducts inventory upon administration

Critical: All external validations use ACL layers (no direct model imports)
"""

from typing import Dict, Any, List
from decimal import Decimal
from django.db import transaction, DatabaseError
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.utils import timezone

from pharmacy.models import (
    Inventory,
    MedicationRequest,
    MedicationRequestDosage,
    MedicationAdministration,
    MedicationAdministrationDosage
)

# ACL Imports (Fortress Pattern - No direct model access)
from patients.services.patient_acl import validate_patient_exists
from admission.services.admission_acl import EncounterACL
from accounts.services.accounts_acl import PractitionerACL


class InventoryService:
    """
    Service for managing pharmacy inventory.
    Handles stock creation, updates, and tracking.
    """
    
    @staticmethod
    @transaction.atomic
    def create_item(data: Dict[str, Any]) -> Inventory:
        """
        Create a new inventory item.
        
        Args:
            data: Dictionary with inventory fields
                - item_code (str): Unique item identifier
                - item_name (str): Item name
                - category (str): Item category
                - current_stock (int): Initial stock level
                - reorder_level (int): Reorder threshold
                - unit_of_measure (str): Unit (e.g., 'tablets', 'ml')
                - unit_cost (Decimal): Cost per unit
                - status (str): Inventory status
                - expiry_date (date): Expiration date
                - batch_number (str): Batch number
                - created_by (str): User creating the item
                
        Returns:
            Inventory: Created inventory object
            
        Raises:
            ValidationError: If validation fails
        """
        try:
            # Validate required fields
            required_fields = ['item_code', 'item_name', 'status']
            for field in required_fields:
                if field not in data or not data[field]:
                    raise ValidationError(f"Missing required field: {field}")
            
            # Check for duplicate item_code
            if Inventory.objects.filter(item_code=data['item_code']).exists():
                raise ValidationError(f"Item with code '{data['item_code']}' already exists")
            
            # Create inventory item
            inventory = Inventory.objects.create(
                item_code=data['item_code'],
                item_name=data.get('item_name'),
                category=data.get('category'),
                batch_number=data.get('batch_number'),
                current_stock=data.get('current_stock', 0),
                reorder_level=data.get('reorder_level', 0),
                unit_of_measure=data.get('unit_of_measure'),
                unit_cost=data.get('unit_cost'),
                status=data['status'],
                expiry_date=data.get('expiry_date'),
                last_restocked_datetime=data.get('last_restocked_datetime'),
                created_by=data.get('created_by')
            )
            
            return inventory
            
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to create inventory item: {str(e)}")
    
    @staticmethod
    @transaction.atomic
    def update_stock(item_code: str, quantity: int, operation: str = 'subtract') -> Inventory:
        """
        Update inventory stock level.
        
        Args:
            item_code: Unique item identifier
            quantity: Quantity to add or subtract
            operation: 'add' or 'subtract' (default: 'subtract')
            
        Returns:
            Inventory: Updated inventory object
            
        Raises:
            ValidationError: If validation fails or insufficient stock
        """
        try:
            # Validate operation
            if operation not in ['add', 'subtract']:
                raise ValidationError(f"Invalid operation: {operation}. Must be 'add' or 'subtract'")
            
            # Get inventory item with row-level lock
            try:
                inventory = Inventory.objects.select_for_update().get(item_code=item_code)
            except ObjectDoesNotExist:
                raise ValidationError(f"Inventory item '{item_code}' not found")
            
            # Calculate new stock level
            if operation == 'add':
                new_stock = inventory.current_stock + quantity
                inventory.last_restocked_datetime = timezone.now()
            else:  # subtract
                new_stock = inventory.current_stock - quantity
                if new_stock < 0:
                    raise ValidationError(
                        f"Insufficient stock for '{item_code}'. "
                        f"Available: {inventory.current_stock}, Requested: {quantity}"
                    )
            
            # Update stock
            inventory.current_stock = new_stock
            inventory.save(update_fields=['current_stock', 'last_restocked_datetime', 'updated_at'])
            
            return inventory
            
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to update stock: {str(e)}")


class MedicationService:
    """
    Service for prescribing medications.
    Handles MedicationRequest creation with nested dosage instructions.
    """
    
    @staticmethod
    @transaction.atomic
    def prescribe_medication(data: Dict[str, Any]) -> MedicationRequest:
        """
        Create a medication prescription (MedicationRequest + Dosages).
        
        Args:
            data: Dictionary with prescription fields
                - subject_id (int): Patient ID
                - encounter_id (int): Encounter ID
                - requester_id (int): Prescribing practitioner ID
                - medication_code (str): Medication code
                - medication_display (str): Medication name
                - medication_system (str): Code system
                - intent (str): Prescription intent
                - status (str): Request status
                - priority (str): Priority level
                - authored_on (datetime): Prescription date
                - dosages (list): List of dosage instruction dicts
                    - dosage_text (str): Human-readable dosage
                    - dosage_dose_value (Decimal): Dose amount
                    - dosage_dose_unit (str): Dose unit
                    - dosage_route (str): Route of administration
                    - sequence (int): Dosage sequence
                
        Returns:
            MedicationRequest: Created prescription with nested dosages
            
        Raises:
            ValidationError: If validation fails
        """
        try:
            # Validate required fields
            required_fields = ['subject_id', 'encounter_id', 'requester_id', 'intent', 'status']
            for field in required_fields:
                if field not in data or not data[field]:
                    raise ValidationError(f"Missing required field: {field}")
            
            # Validate Patient exists (ACL)
            if not validate_patient_exists(data['subject_id']):
                raise ValidationError(f"Patient with ID {data['subject_id']} not found")
            
            # Validate Encounter exists (ACL)
            if not EncounterACL.validate_encounter_exists(data['encounter_id']):
                raise ValidationError(f"Encounter with ID {data['encounter_id']} not found")
            
            # Validate Practitioner exists (ACL)
            if not PractitionerACL.validate_practitioner_exists(data['requester_id']):
                raise ValidationError(f"Practitioner with ID {data['requester_id']} not found")
            
            # Validate optional practitioner references
            if data.get('performer_id') and not PractitionerACL.validate_practitioner_exists(data['performer_id']):
                raise ValidationError(f"Performer practitioner with ID {data['performer_id']} not found")
            
            if data.get('recorder_id') and not PractitionerACL.validate_practitioner_exists(data['recorder_id']):
                raise ValidationError(f"Recorder practitioner with ID {data['recorder_id']} not found")
            
            # Create MedicationRequest
            medication_request = MedicationRequest.objects.create(
                identifier=data.get('identifier'),
                status=data['status'],
                subject_id=data['subject_id'],
                encounter_id=data['encounter_id'],
                requester_id=data['requester_id'],
                performer_id=data.get('performer_id'),
                recorder_id=data.get('recorder_id'),
                based_on_id=data.get('based_on_id'),
                insurance_id=data.get('insurance_id'),
                reported_reference_id=data.get('reported_reference_id'),
                reason_reference_id=data.get('reason_reference_id'),
                medication_reference=data.get('medication_reference'),
                medication_code=data.get('medication_code'),
                medication_display=data.get('medication_display'),
                medication_system=data.get('medication_system'),
                intent=data['intent'],
                category=data.get('category'),
                priority=data.get('priority'),
                do_not_perform=data.get('do_not_perform'),
                reported_boolean=data.get('reported_boolean'),
                authored_on=data.get('authored_on'),
                status_reason=data.get('status_reason'),
                reason_code=data.get('reason_code'),
                note=data.get('note'),
                dispense_quantity=data.get('dispense_quantity'),
                dispense_initial_fill_quantity=data.get('dispense_initial_fill_quantity'),
                dispense_initial_fill_duration=data.get('dispense_initial_fill_duration'),
                dispense_interval=data.get('dispense_interval'),
                dispense_validity_period_start=data.get('dispense_validity_period_start'),
                dispense_validity_period_end=data.get('dispense_validity_period_end'),
                dispense_repeats_allowed=data.get('dispense_repeats_allowed'),
                group_identifier=data.get('group_identifier'),
                course_of_therapy_type=data.get('course_of_therapy_type'),
                instantiates_canonical=data.get('instantiates_canonical'),
                instantiates_uri=data.get('instantiates_uri'),
                performer_type=data.get('performer_type')
            )
            
            # Create nested dosages
            dosages_data = data.get('dosages', [])
            for dosage_data in dosages_data:
                MedicationRequestDosage.objects.create(
                    medication_request=medication_request,
                    dosage_text=dosage_data.get('dosage_text'),
                    dosage_site=dosage_data.get('dosage_site'),
                    dosage_route=dosage_data.get('dosage_route'),
                    dosage_method=dosage_data.get('dosage_method'),
                    dosage_dose_value=dosage_data.get('dosage_dose_value'),
                    dosage_dose_unit=dosage_data.get('dosage_dose_unit'),
                    dosage_rate_quantity_value=dosage_data.get('dosage_rate_quantity_value'),
                    dosage_rate_quantity_unit=dosage_data.get('dosage_rate_quantity_unit'),
                    dosage_rate_ratio_numerator=dosage_data.get('dosage_rate_ratio_numerator'),
                    dosage_rate_ratio_denominator=dosage_data.get('dosage_rate_ratio_denominator'),
                    sequence=dosage_data.get('sequence', 1)
                )
            
            return medication_request
            
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to create medication request: {str(e)}")


class AdministrationService:
    """
    Service for administering medications.
    Handles MedicationAdministration creation with nested dosage and inventory deduction.
    """
    
    @staticmethod
    @transaction.atomic
    def administer_medication(data: Dict[str, Any]) -> MedicationAdministration:
        """
        Record medication administration (MedicationAdministration + Dosage).
        CRITICAL: Deducts quantity from Inventory atomically.
        
        Args:
            data: Dictionary with administration fields
                - subject_id (int): Patient ID
                - context_id (int): Encounter ID (optional)
                - performer_actor_id (int): Administering practitioner ID
                - request_id (int): Linked MedicationRequest ID (optional)
                - medication_code (str): Medication code
                - medication_display (str): Medication name
                - status (str): Administration status
                - effective_datetime (datetime): When administered
                - dosage (dict): Dosage information
                    - dosage_dose_value (Decimal): Administered dose
                    - dosage_dose_unit (str): Dose unit
                    - dosage_route (str): Route
                - inventory_item_code (str): Inventory item code for stock deduction
                - quantity_used (int): Quantity to deduct from inventory
                
        Returns:
            MedicationAdministration: Created administration record
            
        Raises:
            ValidationError: If validation fails or insufficient stock
        """
        try:
            # Validate required fields
            required_fields = ['subject_id', 'status', 'effective_datetime']
            for field in required_fields:
                if field not in data or not data[field]:
                    raise ValidationError(f"Missing required field: {field}")
            
            # Validate Patient exists (ACL)
            if not validate_patient_exists(data['subject_id']):
                raise ValidationError(f"Patient with ID {data['subject_id']} not found")
            
            # Validate optional Encounter (ACL)
            if data.get('context_id') and not EncounterACL.validate_encounter_exists(data['context_id']):
                raise ValidationError(f"Encounter with ID {data['context_id']} not found")
            
            # Validate Practitioner (ACL)
            if data.get('performer_actor_id') and not PractitionerACL.validate_practitioner_exists(data['performer_actor_id']):
                raise ValidationError(f"Practitioner with ID {data['performer_actor_id']} not found")
            
            # Validate MedicationRequest exists if linked
            if data.get('request_id'):
                try:
                    MedicationRequest.objects.get(medication_request_id=data['request_id'])
                except ObjectDoesNotExist:
                    raise ValidationError(f"MedicationRequest with ID {data['request_id']} not found")
            
            # CRITICAL: Deduct inventory BEFORE creating administration record
            if data.get('inventory_item_code') and data.get('quantity_used'):
                InventoryService.update_stock(
                    item_code=data['inventory_item_code'],
                    quantity=data['quantity_used'],
                    operation='subtract'
                )
            
            # Create MedicationAdministration
            medication_admin = MedicationAdministration.objects.create(
                identifier=data.get('identifier'),
                status=data['status'],
                subject_id=data['subject_id'],
                context_id=data.get('context_id'),
                performer_actor_id=data.get('performer_actor_id'),
                request_id=data.get('request_id'),
                part_of_id=data.get('part_of_id'),
                device_id=data.get('device_id'),
                event_history_id=data.get('event_history_id'),
                reason_reference_id=data.get('reason_reference_id'),
                medication_reference=data.get('medication_reference'),
                medication_code=data.get('medication_code'),
                medication_display=data.get('medication_display'),
                medication_system=data.get('medication_system'),
                instantiates_uri=data.get('instantiates_uri'),
                status_reason=data.get('status_reason'),
                category=data.get('category'),
                effective_datetime=data['effective_datetime'],
                effective_period_start=data.get('effective_period_start'),
                effective_period_end=data.get('effective_period_end'),
                performer_function=data.get('performer_function'),
                reason_code=data.get('reason_code'),
                note=data.get('note')
            )
            
            # Create nested dosage
            dosage_data = data.get('dosage', {})
            if dosage_data:
                MedicationAdministrationDosage.objects.create(
                    medication_administration=medication_admin,
                    dosage_text=dosage_data.get('dosage_text'),
                    dosage_site=dosage_data.get('dosage_site'),
                    dosage_route=dosage_data.get('dosage_route'),
                    dosage_method=dosage_data.get('dosage_method'),
                    dosage_dose_value=dosage_data.get('dosage_dose_value'),
                    dosage_dose_unit=dosage_data.get('dosage_dose_unit'),
                    dosage_rate_quantity_value=dosage_data.get('dosage_rate_quantity_value'),
                    dosage_rate_quantity_unit=dosage_data.get('dosage_rate_quantity_unit'),
                    dosage_rate_ratio_numerator=dosage_data.get('dosage_rate_ratio_numerator'),
                    dosage_rate_ratio_denominator=dosage_data.get('dosage_rate_ratio_denominator')
                )
            
            return medication_admin
            
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Failed to record medication administration: {str(e)}")
