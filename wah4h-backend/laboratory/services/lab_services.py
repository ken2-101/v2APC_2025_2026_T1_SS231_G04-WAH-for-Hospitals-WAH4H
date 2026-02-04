"""
Laboratory Service Layer (Write Operations)
===========================================
Handles all state changes for laboratory catalog and results management.

Critical Features:
- Test catalog management for billing integration
- Transactional diagnostic report creation with results
- Price management for charge master

Author: Backend Architecture Team
Date: February 4, 2026
"""

from decimal import Decimal
from typing import Dict, List
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from laboratory.models import (
    LabTestDefinition,
    DiagnosticReport,
    DiagnosticReportResult
)


class LabCatalogService:
    """
    Service for managing laboratory test catalog (Admin operations).
    Handles test definitions and pricing for billing integration.
    """
    
    @staticmethod
    def define_test(
        code: str,
        name: str,
        base_price: Decimal,
        category: str,
        turnaround_time: str = None
    ) -> LabTestDefinition:
        """
        Define a new laboratory test in the catalog.
        
        Args:
            code: Unique test code (SKU)
            name: Test name/description
            base_price: Base price for billing
            category: Test category (e.g., 'Hematology', 'Chemistry')
            turnaround_time: Optional expected completion time
            
        Returns:
            Created LabTestDefinition instance
            
        Raises:
            ValidationError: If test code already exists
        """
        # Check if code already exists
        if LabTestDefinition.objects.filter(code=code).exists():
            raise ValidationError(f"Test code '{code}' already exists in catalog")
        
        # Create new test definition
        test = LabTestDefinition.objects.create(
            code=code,
            name=name,
            base_price=base_price,
            category=category,
            turnaround_time=turnaround_time,
            status='active'
        )
        
        return test
    
    @staticmethod
    def update_test_price(code: str, new_price: Decimal) -> LabTestDefinition:
        """
        Update the base price of an existing test.
        
        Args:
            code: Unique test code
            new_price: New base price
            
        Returns:
            Updated LabTestDefinition instance
            
        Raises:
            ObjectDoesNotExist: If test code not found
        """
        try:
            test = LabTestDefinition.objects.get(code=code)
            test.base_price = new_price
            test.save()
            return test
        except LabTestDefinition.DoesNotExist:
            raise ObjectDoesNotExist(f"Test code '{code}' not found in catalog")


class LabResultService:
    """
    Service for recording laboratory results (MedTech operations).
    Handles diagnostic report creation with transactional integrity.
    """
    
    @staticmethod
    @transaction.atomic
    def create_diagnostic_report(
        header_data: Dict,
        results_data: List[Dict]
    ) -> DiagnosticReport:
        """
        Create a diagnostic report with results atomically.
        
        Args:
            header_data: Dictionary containing report header fields
                Required: subject_id, encounter_id
                Optional: status, code_code, code_display, category_code,
                         category_display, conclusion, effective_datetime,
                         issued_datetime, performer_id, etc.
            results_data: List of result dictionaries, each containing:
                - observation_id (int): Reference to observation
                - item_sequence (int): Order of result
                
        Returns:
            Created DiagnosticReport instance with related results
            
        Raises:
            ValidationError: If required fields are missing
            
        Example:
            header_data = {
                'subject_id': 12345,
                'encounter_id': 67890,
                'status': 'final',
                'code_code': 'CBC',
                'issued_datetime': timezone.now()
            }
            results_data = [
                {'observation_id': 101, 'item_sequence': 1},
                {'observation_id': 102, 'item_sequence': 2}
            ]
        """
        # Validate required fields
        required_fields = ['subject_id', 'encounter_id']
        for field in required_fields:
            if field not in header_data:
                raise ValidationError(f"Missing required field: {field}")
        
        # Create diagnostic report
        report = DiagnosticReport.objects.create(**header_data)
        
        # Create associated results
        for result_data in results_data:
            if 'observation_id' not in result_data or 'item_sequence' not in result_data:
                raise ValidationError(
                    "Each result must contain 'observation_id' and 'item_sequence'"
                )
            
            DiagnosticReportResult.objects.create(
                diagnostic_report=report,
                observation_id=result_data['observation_id'],
                item_sequence=result_data['item_sequence']
            )
        
        return report
