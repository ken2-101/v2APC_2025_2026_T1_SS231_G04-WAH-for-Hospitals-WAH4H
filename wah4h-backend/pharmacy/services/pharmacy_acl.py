"""
Pharmacy Anti-Corruption Layer (ACL) - Read-Only Service Layer
================================================================

Purpose:
    Acts as the "Supply Chain" source of truth for the pharmacy module.
    Exposes Inventory and Medication data to external apps (Billing, Admission)
    while maintaining the Fortress Pattern.

Fortress Pattern Compliance:
    - STRICT IMPORT RULE: Only imports models from pharmacy.models
    - ZERO external dependencies on other apps
    - Returns DTOs (dictionaries) only - NO model instances
    - All external apps consume data through this ACL

Data Consumers:
    - Billing App: Item pricing (unit_cost) and codes for invoice generation
    - Admission App: Medication request history for patient records

Author: Senior Python Backend Architect
Date: 2026-02-04
"""

from typing import Dict, List, Optional, Any
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Prefetch

# FORTRESS PATTERN: Import ONLY from pharmacy.models
from pharmacy.models import (
    Inventory,
    MedicationRequest,
    MedicationRequestDosage,
    Medication
)


class InventoryACL:
    """
    Read-Only Inventory Access Layer for External Apps
    
    Primary Consumer: Billing App (requires pricing data)
    Secondary Consumer: Admission App (stock availability checks)
    """
    
    @staticmethod
    def validate_item_exists(item_code: str) -> bool:
        """
        Validate if an inventory item exists by item_code.
        
        Args:
            item_code: Unique identifier for the inventory item
            
        Returns:
            True if item exists, False otherwise
        """
        return Inventory.objects.filter(item_code=item_code).exists()
    
    @staticmethod
    def get_item_pricing(item_code: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve pricing information for a specific inventory item.
        
        CRITICAL FOR BILLING: This is the authoritative source for item costs.
        
        Args:
            item_code: Unique identifier for the inventory item
            
        Returns:
            Dictionary containing:
                - item_code: str
                - item_name: str
                - unit_cost: Decimal (kept as Decimal for billing precision)
                - currency: str (default 'PHP')
                - unit_of_measure: str
                - status: str
            Returns None if item not found
        """
        try:
            item = Inventory.objects.get(item_code=item_code)
            return {
                'item_code': item.item_code,
                'item_name': item.item_name,
                'unit_cost': item.unit_cost if item.unit_cost else Decimal('0.00'),
                'currency': 'PHP',  # Default currency
                'unit_of_measure': item.unit_of_measure,
                'status': item.status,
            }
        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def check_stock_availability(item_code: str, quantity: int) -> bool:
        """
        Check if sufficient stock is available for dispensing.
        
        Business Logic:
            - Item must exist
            - current_stock >= requested quantity
            - status must be 'active'
        
        Args:
            item_code: Unique identifier for the inventory item
            quantity: Requested quantity to check
            
        Returns:
            True if stock is available and sufficient, False otherwise
        """
        try:
            item = Inventory.objects.get(item_code=item_code)
            return (
                item.status == 'active' and
                item.current_stock >= quantity
            )
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_inventory_details(item_code: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve full inventory details including stock levels.
        
        Args:
            item_code: Unique identifier for the inventory item
            
        Returns:
            Dictionary containing comprehensive inventory information,
            or None if item not found
        """
        try:
            item = Inventory.objects.get(item_code=item_code)
            return {
                'inventory_id': item.inventory_id,
                'item_code': item.item_code,
                'item_name': item.item_name,
                'category': item.category,
                'batch_number': item.batch_number,
                'current_stock': item.current_stock,
                'reorder_level': item.reorder_level,
                'unit_of_measure': item.unit_of_measure,
                'unit_cost': item.unit_cost if item.unit_cost else Decimal('0.00'),
                'currency': 'PHP',
                'status': item.status,
                'expiry_date': item.expiry_date.isoformat() if item.expiry_date else None,
                'last_restocked_datetime': item.last_restocked_datetime.isoformat() if item.last_restocked_datetime else None,
                'created_at': item.created_at.isoformat() if item.created_at else None,
                'updated_at': item.updated_at.isoformat() if item.updated_at else None,
            }
        except ObjectDoesNotExist:
            return None


class MedicationRequestACL:
    """
    Read-Only Medication Request Access Layer for External Apps
    
    Primary Consumer: Admission App (patient medication history)
    Secondary Consumer: Billing App (medication charges)
    """
    
    @staticmethod
    def get_patient_requests(
        patient_id: int,
        encounter_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all medication requests for a specific patient.
        
        Args:
            patient_id: The subject_id (patient ID) to filter by
            encounter_id: Optional encounter_id to filter by specific encounter
            
        Returns:
            List of medication request dictionaries (summary format)
            Returns empty list if no requests found
        """
        queryset = MedicationRequest.objects.filter(subject_id=patient_id)
        
        if encounter_id is not None:
            queryset = queryset.filter(encounter_id=encounter_id)
        
        queryset = queryset.order_by('-authored_on')
        
        results = []
        for request in queryset:
            results.append({
                'medication_request_id': request.medication_request_id,
                'identifier': request.identifier,
                'status': request.status,
                'subject_id': request.subject_id,
                'encounter_id': request.encounter_id,
                'medication_code': request.medication_code,
                'medication_display': request.medication_display,
                'medication_system': request.medication_system,
                'intent': request.intent,
                'priority': request.priority,
                'authored_on': request.authored_on.isoformat() if request.authored_on else None,
                'requester_id': request.requester_id,
                'status_reason': request.status_reason,
                'created_at': request.created_at.isoformat() if request.created_at else None,
            })
        
        return results
    
    @staticmethod
    def get_request_details(request_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve full details of a specific medication request.
        
        INCLUDES NESTED DOSAGES: This method fetches the complete request
        including all associated dosage instructions.
        
        Args:
            request_id: The medication_request_id to retrieve
            
        Returns:
            Dictionary containing:
                - All header fields from MedicationRequest
                - 'dosages': List of dosage instruction dictionaries
            Returns None if request not found
        """
        try:
            request = MedicationRequest.objects.prefetch_related(
                'dosages'
            ).get(medication_request_id=request_id)
            
            # Build dosages list
            dosages = []
            for dosage in request.dosages.all():
                dosages.append({
                    'dosage_id': dosage.dosage_id,
                    'sequence': dosage.sequence,
                    'dosage_text': dosage.dosage_text,
                    'dosage_site': dosage.dosage_site,
                    'dosage_route': dosage.dosage_route,
                    'dosage_method': dosage.dosage_method,
                    'dosage_dose_value': dosage.dosage_dose_value,
                    'dosage_dose_unit': dosage.dosage_dose_unit,
                    'dosage_rate_quantity_value': dosage.dosage_rate_quantity_value,
                    'dosage_rate_quantity_unit': dosage.dosage_rate_quantity_unit,
                    'dosage_rate_ratio_numerator': dosage.dosage_rate_ratio_numerator,
                    'dosage_rate_ratio_denominator': dosage.dosage_rate_ratio_denominator,
                })
            
            # Build complete request dictionary
            return {
                'medication_request_id': request.medication_request_id,
                'identifier': request.identifier,
                'status': request.status,
                'subject_id': request.subject_id,
                'encounter_id': request.encounter_id,
                'requester_id': request.requester_id,
                'performer_id': request.performer_id,
                'recorder_id': request.recorder_id,
                'based_on_id': request.based_on_id,
                'insurance_id': request.insurance_id,
                'reported_reference_id': request.reported_reference_id,
                'reason_reference_id': request.reason_reference_id,
                'medication_reference': request.medication_reference,
                'medication_code': request.medication_code,
                'medication_display': request.medication_display,
                'medication_system': request.medication_system,
                'intent': request.intent,
                'category': request.category,
                'priority': request.priority,
                'do_not_perform': request.do_not_perform,
                'reported_boolean': request.reported_boolean,
                'authored_on': request.authored_on.isoformat() if request.authored_on else None,
                'status_reason': request.status_reason,
                'reason_code': request.reason_code,
                'note': request.note,
                'dispense_quantity': request.dispense_quantity,
                'dispense_initial_fill_quantity': request.dispense_initial_fill_quantity,
                'dispense_initial_fill_duration': request.dispense_initial_fill_duration,
                'dispense_interval': request.dispense_interval,
                'dispense_validity_period_start': request.dispense_validity_period_start,
                'dispense_validity_period_end': request.dispense_validity_period_end,
                'dispense_repeats_allowed': request.dispense_repeats_allowed,
                'group_identifier': request.group_identifier,
                'course_of_therapy_type': request.course_of_therapy_type,
                'instantiates_canonical': request.instantiates_canonical,
                'instantiates_uri': request.instantiates_uri,
                'performer_type': request.performer_type,
                'created_at': request.created_at.isoformat() if request.created_at else None,
                'updated_at': request.updated_at.isoformat() if request.updated_at else None,
                'dosages': dosages,
            }
        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def get_encounter_requests(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Retrieve all medication requests for a specific encounter.
        
        Useful for Admission App when viewing encounter-specific medications.
        
        Args:
            encounter_id: The encounter_id to filter by
            
        Returns:
            List of medication request dictionaries (summary format)
            Returns empty list if no requests found
        """
        queryset = MedicationRequest.objects.filter(
            encounter_id=encounter_id
        ).order_by('-authored_on')
        
        results = []
        for request in queryset:
            results.append({
                'medication_request_id': request.medication_request_id,
                'identifier': request.identifier,
                'status': request.status,
                'subject_id': request.subject_id,
                'encounter_id': request.encounter_id,
                'medication_code': request.medication_code,
                'medication_display': request.medication_display,
                'intent': request.intent,
                'priority': request.priority,
                'authored_on': request.authored_on.isoformat() if request.authored_on else None,
                'requester_id': request.requester_id,
                'created_at': request.created_at.isoformat() if request.created_at else None,
            })
        
        return results


class MedicationACL:
    """
    Read-Only Medication (Lookup Table) Access Layer
    
    Provides medication code and display information for reference.
    """
    
    @staticmethod
    def get_medication_by_code(code: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve medication details by medication code.
        
        Args:
            code: The medication code (code_code field)
            
        Returns:
            Dictionary containing medication information,
            or None if not found
        """
        try:
            medication = Medication.objects.get(code_code=code)
            return {
                'medication_id': medication.medication_id,
                'identifier': medication.identifier,
                'code_code': medication.code_code,
                'code_display': medication.code_display,
                'code_system': medication.code_system,
                'code_version': medication.code_version,
                'status': medication.status,
                'created_at': medication.created_at.isoformat() if medication.created_at else None,
                'updated_at': medication.updated_at.isoformat() if medication.updated_at else None,
            }
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
