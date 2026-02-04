"""
pharmacy/services/pharmacy_acl.py

Read-Only Service Layer (ACL - Anti-Corruption Layer) for the Pharmacy Module.
Architecture Pattern: Fortress Pattern - Read Layer

CRITICAL: This ACL is the bridge to the Billing Module.
- Billing queries medication requests for invoice generation
- Billing queries inventory for pricing information

Context: Philippine LGU Hospital System
"""

from typing import Dict, Any, Optional, List
from django.core.exceptions import ObjectDoesNotExist

from pharmacy.models import (
    Inventory,
    MedicationRequest,
    MedicationRequestDosage,
    MedicationAdministration,
    MedicationAdministrationDosage
)


class InventoryACL:
    """
    Read-Only Service Layer for Inventory data.
    
    CRITICAL FOR BILLING: Provides pricing and stock information
    for invoice generation and charge posting.
    """
    
    @staticmethod
    def validate_item_exists(item_code: str) -> bool:
        """
        Check if an inventory item exists.
        
        Args:
            item_code: Unique item identifier
            
        Returns:
            bool: True if item exists, False otherwise
        """
        try:
            return Inventory.objects.filter(item_code=item_code).exists()
        except Exception:
            return False
    
    @staticmethod
    def get_item_pricing(item_code: str) -> Optional[Dict[str, Any]]:
        """
        Get pricing information for an inventory item.
        
        CRITICAL FOR BILLING: Used to calculate medication charges.
        
        Args:
            item_code: Unique item identifier
            
        Returns:
            Dictionary with pricing data or None if not found.
            
            DTO Fields:
                - item_code (str): Item code
                - item_name (str): Item name
                - unit_cost (Decimal): Cost per unit
                - unit_of_measure (str): Unit (e.g., 'tablets', 'ml')
                - category (str): Item category
                - status (str): Item status
        """
        try:
            item = Inventory.objects.get(item_code=item_code)
            
            return {
                'item_code': item.item_code,
                'item_name': item.item_name or "",
                'unit_cost': item.unit_cost,
                'unit_of_measure': item.unit_of_measure or "",
                'category': item.category or "",
                'status': item.status
            }
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def check_stock_availability(item_code: str, quantity: int) -> bool:
        """
        Check if sufficient stock is available for a given quantity.
        
        Args:
            item_code: Unique item identifier
            quantity: Requested quantity
            
        Returns:
            bool: True if sufficient stock available, False otherwise
        """
        try:
            item = Inventory.objects.get(item_code=item_code)
            return item.current_stock >= quantity
        except ObjectDoesNotExist:
            return False
        except Exception:
            return False
    
    @staticmethod
    def get_inventory_summary(item_code: str) -> Optional[Dict[str, Any]]:
        """
        Get complete inventory item summary.
        
        Args:
            item_code: Unique item identifier
            
        Returns:
            Dictionary with inventory data or None if not found.
        """
        try:
            item = Inventory.objects.get(item_code=item_code)
            
            return {
                'inventory_id': item.inventory_id,
                'item_code': item.item_code,
                'item_name': item.item_name or "",
                'category': item.category or "",
                'batch_number': item.batch_number or "",
                'current_stock': item.current_stock,
                'reorder_level': item.reorder_level,
                'unit_of_measure': item.unit_of_measure or "",
                'unit_cost': float(item.unit_cost) if item.unit_cost else None,
                'status': item.status,
                'expiry_date': item.expiry_date.isoformat() if item.expiry_date else None,
                'last_restocked_datetime': item.last_restocked_datetime.isoformat() if item.last_restocked_datetime else None,
                'created_at': item.created_at.isoformat() if hasattr(item, 'created_at') else None,
                'updated_at': item.updated_at.isoformat() if hasattr(item, 'updated_at') else None
            }
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def get_low_stock_items(threshold: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get list of items with stock below reorder level.
        
        Args:
            threshold: Optional custom threshold (uses reorder_level if None)
            
        Returns:
            List of inventory summary dictionaries
        """
        try:
            if threshold is not None:
                items = Inventory.objects.filter(current_stock__lte=threshold)
            else:
                # Items where current_stock <= reorder_level
                from django.db.models import F
                items = Inventory.objects.filter(current_stock__lte=F('reorder_level'))
            
            items = items.order_by('current_stock')
            
            return [
                {
                    'item_code': item.item_code,
                    'item_name': item.item_name or "",
                    'current_stock': item.current_stock,
                    'reorder_level': item.reorder_level,
                    'unit_of_measure': item.unit_of_measure or "",
                    'status': item.status
                }
                for item in items
            ]
        except Exception:
            return []


class MedicationRequestACL:
    """
    """
    Read-Only Service Layer for MedicationRequest data.
    
    CRITICAL FOR BILLING: Provides medication order data
    for charge posting and invoice generation.
    """
    
    @staticmethod
    def validate_request_exists(medication_request_id: int) -> bool:
        """
        Check if a medication request exists.
        
        Args:
            medication_request_id: Primary key of the medication request
            
        Returns:
            bool: True if request exists, False otherwise
        """
        try:
            return MedicationRequest.objects.filter(
                medication_request_id=medication_request_id
            ).exists()
        except Exception:
            return False
    
    @staticmethod
    def get_request_details(medication_request_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed medication request information.
        
        Args:
            medication_request_id: Primary key of the medication request
            
        Returns:
            Dictionary with medication request data including nested dosages
        """
        try:
            request = MedicationRequest.objects.prefetch_related('dosages').get(
                medication_request_id=medication_request_id
            )
            
            # Get dosages
            dosages = [
                {
                    'dosage_id': dosage.dosage_id,
                    'dosage_text': dosage.dosage_text or "",
                    'dosage_dose_value': float(dosage.dosage_dose_value) if dosage.dosage_dose_value else None,
                    'dosage_dose_unit': dosage.dosage_dose_unit or "",
                    'dosage_route': dosage.dosage_route or "",
                    'sequence': dosage.sequence
                }
                for dosage in request.dosages.all()
            ]
            
            return {
                'medication_request_id': request.medication_request_id,
                'identifier': request.identifier,
                'status': request.status,
                'subject_id': request.subject_id,
                'encounter_id': request.encounter_id,
                'requester_id': request.requester_id,
                'medication_code': request.medication_code or "",
                'medication_display': request.medication_display or "",
                'medication_system': request.medication_system or "",
                'intent': request.intent or "",
                'priority': request.priority or "",
                'authored_on': request.authored_on.isoformat() if request.authored_on else None,
                'dispense_quantity': float(request.dispense_quantity) if request.dispense_quantity else None,
                'note': request.note or "",
                'dosages': dosages,
                'created_at': request.created_at.isoformat() if hasattr(request, 'created_at') else None,
                'updated_at': request.updated_at.isoformat() if hasattr(request, 'updated_at') else None
            }
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def get_encounter_requests(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all medication requests for an encounter.
        
        CRITICAL FOR BILLING: Used to generate medication charges for invoices.
        
        Args:
            encounter_id: Encounter ID
            
        Returns:
            List of medication request summary dictionaries
            
            Each dict contains:
                - medication_request_id (int)
                - medication_code (str)
                - medication_display (str)
                - dispense_quantity (Decimal)
                - status (str)
                - authored_on (str)
        """
        try:
            requests = MedicationRequest.objects.filter(
                encounter_id=encounter_id
            ).order_by('-authored_on')
            
            return [
                {
                    'medication_request_id': req.medication_request_id,
                    'medication_code': req.medication_code or "",
                    'medication_display': req.medication_display or "",
                    'dispense_quantity': float(req.dispense_quantity) if req.dispense_quantity else 0,
                    'status': req.status,
                    'authored_on': req.authored_on.isoformat() if req.authored_on else None,
                    'requester_id': req.requester_id
                }
                for req in requests
            ]
        except Exception:
            return []
    
    @staticmethod
    def get_patient_requests(patient_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all medication requests for a patient.
        
        Args:
            patient_id: Patient ID (subject_id)
            status: Optional status filter ('active', 'completed', etc.)
            
        Returns:
            List of medication request summary dictionaries
        """
        try:
            requests = MedicationRequest.objects.filter(subject_id=patient_id)
            
            if status:
                requests = requests.filter(status=status)
            
            requests = requests.order_by('-authored_on')
            
            return [
                {
                    'medication_request_id': req.medication_request_id,
                    'encounter_id': req.encounter_id,
                    'medication_code': req.medication_code or "",
                    'medication_display': req.medication_display or "",
                    'status': req.status,
                    'authored_on': req.authored_on.isoformat() if req.authored_on else None
                }
                for req in requests
            ]
        except Exception:
            return []


class MedicationAdministrationACL:
    """
    Read-Only Service Layer for MedicationAdministration data.
    
    Provides medication administration history for clinical and billing purposes.
    """
    
    @staticmethod
    def validate_administration_exists(medication_administration_id: int) -> bool:
        """
        Check if a medication administration record exists.
        
        Args:
            medication_administration_id: Primary key of the administration record
            
        Returns:
            bool: True if administration exists, False otherwise
        """
        try:
            return MedicationAdministration.objects.filter(
                medication_administration_id=medication_administration_id
            ).exists()
        except Exception:
            return False
    
    @staticmethod
    def get_administration_details(medication_administration_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed medication administration information.
        
        Args:
            medication_administration_id: Primary key of the administration record
            
        Returns:
            Dictionary with administration data including dosage
        """
        try:
            admin = MedicationAdministration.objects.select_related('dosage').get(
                medication_administration_id=medication_administration_id
            )
            
            # Get dosage if exists
            dosage_data = None
            if hasattr(admin, 'dosage'):
                dosage = admin.dosage
                dosage_data = {
                    'dosage_text': dosage.dosage_text or "",
                    'dosage_dose_value': float(dosage.dosage_dose_value) if dosage.dosage_dose_value else None,
                    'dosage_dose_unit': dosage.dosage_dose_unit or "",
                    'dosage_route': dosage.dosage_route or ""
                }
            
            return {
                'medication_administration_id': admin.medication_administration_id,
                'identifier': admin.identifier,
                'status': admin.status,
                'subject_id': admin.subject_id,
                'context_id': admin.context_id,
                'performer_actor_id': admin.performer_actor_id,
                'request_id': admin.request_id,
                'medication_code': admin.medication_code or "",
                'medication_display': admin.medication_display or "",
                'effective_datetime': admin.effective_datetime.isoformat() if admin.effective_datetime else None,
                'note': admin.note or "",
                'dosage': dosage_data,
                'created_at': admin.created_at.isoformat() if hasattr(admin, 'created_at') else None
            }
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None
    
    @staticmethod
    def get_encounter_administrations(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all medication administrations for an encounter.
        
        Args:
            encounter_id: Encounter ID (context_id)
            
        Returns:
            List of administration summary dictionaries
        """
        try:
            admins = MedicationAdministration.objects.filter(
                context_id=encounter_id
            ).order_by('-effective_datetime')
            
            return [
                {
                    'medication_administration_id': admin.medication_administration_id,
                    'medication_code': admin.medication_code or "",
                    'medication_display': admin.medication_display or "",
                    'status': admin.status,
                    'effective_datetime': admin.effective_datetime.isoformat() if admin.effective_datetime else None,
                    'performer_actor_id': admin.performer_actor_id
                }
                for admin in admins
            ]
        except Exception:
            return []
    
    @staticmethod
    def get_patient_administrations(patient_id: int) -> List[Dict[str, Any]]:
        """
        Get all medication administrations for a patient.
        
        Args:
            patient_id: Patient ID (subject_id)
            
        Returns:
            List of administration summary dictionaries
        """
        try:
            admins = MedicationAdministration.objects.filter(
                subject_id=patient_id
            ).order_by('-effective_datetime')
            
            return [
                {
                    'medication_administration_id': admin.medication_administration_id,
                    'medication_code': admin.medication_code or "",
                    'medication_display': admin.medication_display or "",
                    'status': admin.status,
                    'effective_datetime': admin.effective_datetime.isoformat() if admin.effective_datetime else None,
                    'context_id': admin.context_id
                }
                for admin in admins
            ]
        except Exception:
            return []

        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def get_all_active_medications() -> List[Dict[str, Any]]:
        """
        Retrieve all active medications from the lookup table.
        
        Returns:
            List of medication dictionaries
        """
        medications = Medication.objects.filter(status='active').order_by('code_display')
        
        results = []
        for medication in medications:
            results.append({
                'medication_id': medication.medication_id,
                'code_code': medication.code_code,
                'code_display': medication.code_display,
                'code_system': medication.code_system,
                'status': medication.status,
            })
        
        return results
