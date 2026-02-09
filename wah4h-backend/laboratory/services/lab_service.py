"""
laboratory/services/lab_service.py

Write Layer (Service Layer) for Laboratory Module.
Handles business logic and data mutations for lab test definitions and diagnostic reports.

Fortress Pattern Rules:
- All write operations go through these services
- ViewSets delegate to these services (no .save() in views)
- Validates external references via ACLs
- Uses atomic transactions for complex operations
"""

from typing import Dict, Any
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError, ObjectDoesNotExist

from laboratory.models import (
    LabTestDefinition,
    DiagnosticReport,
    DiagnosticReportResult,
)

# ACL Imports for validation
from patients.services.patient_acl import validate_patient_exists
from admission.services.admission_acl import EncounterACL


class LabCatalogService:
    """
    Service layer for managing Laboratory Test Definitions (Catalog/Pricing).
    Used by administrators to maintain the test catalog.
    """

    @staticmethod
    def create_test_definition(data: Dict[str, Any]) -> LabTestDefinition:
        """
        Create a new laboratory test definition.

        Args:
            data: Dictionary containing:
                - code: str (unique SKU)
                - name: str
                - category: str
                - base_price: Decimal or str
                - turnaround_time: str (optional)
                - status: str (default: 'active')

        Returns:
            LabTestDefinition instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        required_fields = ['code', 'name', 'category', 'base_price']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ValidationError(f"Field '{field}' is required")

        # Check for duplicate code
        if LabTestDefinition.objects.filter(code=data['code']).exists():
            raise ValidationError(f"Test code '{data['code']}' already exists")

        # Validate price
        try:
            base_price = Decimal(str(data['base_price']))
            if base_price < 0:
                raise ValidationError("Base price must be non-negative")
        except (ValueError, TypeError):
            raise ValidationError("Invalid base price format")

        # Create test definition
        test = LabTestDefinition.objects.create(
            code=data['code'],
            name=data['name'],
            category=data['category'],
            base_price=base_price,
            turnaround_time=data.get('turnaround_time'),
            status=data.get('status', 'active')
        )

        return test

    @staticmethod
    def update_test_price(code: str, new_price: Decimal) -> LabTestDefinition:
        """
        Update the base price of a laboratory test.

        Args:
            code: Test code (SKU)
            new_price: New base price

        Returns:
            Updated LabTestDefinition instance

        Raises:
            ValidationError: If validation fails
            ObjectDoesNotExist: If test not found
        """
        # Validate price
        try:
            price = Decimal(str(new_price))
            if price < 0:
                raise ValidationError("Base price must be non-negative")
        except (ValueError, TypeError):
            raise ValidationError("Invalid price format")

        # Update test
        try:
            test = LabTestDefinition.objects.get(code=code)
            test.base_price = price
            test.save(update_fields=['base_price', 'updated_at'])
            return test
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Test code '{code}' not found")

    @staticmethod
    def update_test_definition(code: str, data: Dict[str, Any]) -> LabTestDefinition:
        """
        Update laboratory test definition details.

        Args:
            code: Test code (SKU)
            data: Dictionary of fields to update

        Returns:
            Updated LabTestDefinition instance

        Raises:
            ValidationError: If validation fails
            ObjectDoesNotExist: If test not found
        """
        try:
            test = LabTestDefinition.objects.get(code=code)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Test code '{code}' not found")

        # Update allowed fields
        if 'name' in data:
            test.name = data['name']
        if 'category' in data:
            test.category = data['category']
        if 'base_price' in data:
            try:
                price = Decimal(str(data['base_price']))
                if price < 0:
                    raise ValidationError("Base price must be non-negative")
                test.base_price = price
            except (ValueError, TypeError):
                raise ValidationError("Invalid price format")
        if 'turnaround_time' in data:
            test.turnaround_time = data['turnaround_time']
        if 'status' in data:
            test.status = data['status']

        test.save()
        return test


class LabResultService:
    """
    Service layer for managing Diagnostic Reports and Results.
    Handles creation and validation of laboratory test results.
    """

    @staticmethod
    @transaction.atomic
    def create_diagnostic_report(data: Dict[str, Any]) -> DiagnosticReport:
        """
        Create a new diagnostic report with atomic transaction.

        Args:
            data: Dictionary containing:
                - subject_id: int (Patient ID) - REQUIRED
                - encounter_id: int (Encounter ID) - REQUIRED
                - performer_id: int (Practitioner ID) - optional
                - results_interpreter_id: int - optional
                - code_code: str - optional
                - code_display: str - optional
                - category_code: str - optional
                - category_display: str - optional
                - conclusion: str - optional
                - conclusion_code: str - optional
                - conclusion_display: str - optional
                - effective_datetime: datetime - optional
                - issued_datetime: datetime - optional
                - status: str (default: 'preliminary')
                - results: List[Dict] - optional, each containing:
                    - observation_id: int
                    - item_sequence: int

        Returns:
            DiagnosticReport instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if 'subject_id' not in data or not data['subject_id']:
            raise ValidationError("subject_id (Patient ID) is required")
        if 'encounter_id' not in data or not data['encounter_id']:
            raise ValidationError("encounter_id (Encounter ID) is required")

        subject_id = data['subject_id']
        encounter_id = data['encounter_id']

        # Validate patient exists (via PatientACL)
        if not validate_patient_exists(subject_id):
            raise ValidationError(f"Patient with ID {subject_id} does not exist")

        # Validate encounter exists (via AdmissionACL)
        if not EncounterACL.validate_encounter_exists(encounter_id):
            raise ValidationError(f"Encounter with ID {encounter_id} does not exist")

        # Validate encounter belongs to patient
        encounter_details = EncounterACL.get_encounter_details(encounter_id)
        if encounter_details and encounter_details.get('subject_id') != subject_id:
            raise ValidationError(
                f"Encounter {encounter_id} does not belong to patient {subject_id}"
            )

        # Create diagnostic report
        report = DiagnosticReport.objects.create(
            subject_id=subject_id,
            encounter_id=encounter_id,
            performer_id=data.get('performer_id'),
            results_interpreter_id=data.get('results_interpreter_id'),
            specimen_id=data.get('specimen_id'),
            based_on_id=data.get('based_on_id'),
            imaging_study_id=data.get('imaging_study_id'),
            code_code=data.get('code_code'),
            code_display=data.get('code_display'),
            category_code=data.get('category_code'),
            category_display=data.get('category_display'),
            conclusion=data.get('conclusion'),
            conclusion_code=data.get('conclusion_code'),
            conclusion_display=data.get('conclusion_display'),
            effective_datetime=data.get('effective_datetime'),
            effective_period_start=data.get('effective_period_start'),
            effective_period_end=data.get('effective_period_end'),
            issued_datetime=data.get('issued_datetime'),
            media_comment=data.get('media_comment'),
            presented_form_url=data.get('presented_form_url'),
            status=data.get('status', 'preliminary')
        )

        # Create related results if provided
        if 'results' in data and isinstance(data['results'], list):
            for result_data in data['results']:
                if 'observation_id' in result_data and 'item_sequence' in result_data:
                    DiagnosticReportResult.objects.create(
                        diagnostic_report=report,
                        observation_id=result_data['observation_id'],
                        item_sequence=result_data['item_sequence']
                    )

        return report

    @staticmethod
    def update_report_status(report_id: int, status: str) -> DiagnosticReport:
        """
        Update the status of a diagnostic report.

        Args:
            report_id: Diagnostic report ID
            status: New status (e.g., 'preliminary', 'final', 'amended')

        Returns:
            Updated DiagnosticReport instance

        Raises:
            ObjectDoesNotExist: If report not found
            ValidationError: If status is invalid
        """
        valid_statuses = ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'cancelled']
        if status not in valid_statuses:
            raise ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

        try:
            report = DiagnosticReport.objects.get(diagnostic_report_id=report_id)
            report.status = status
            report.save(update_fields=['status', 'updated_at'])
            return report
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Diagnostic report with ID {report_id} not found")

    @staticmethod
    def add_report_result(report_id: int, observation_id: int, item_sequence: int) -> DiagnosticReportResult:
        """
        Add a result (observation) to an existing diagnostic report.

        Args:
            report_id: Diagnostic report ID
            observation_id: Observation ID to link
            item_sequence: Sequence number for ordering

        Returns:
            DiagnosticReportResult instance

        Raises:
            ObjectDoesNotExist: If report not found
        """
        try:
            report = DiagnosticReport.objects.get(diagnostic_report_id=report_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Diagnostic report with ID {report_id} not found")

        result = DiagnosticReportResult.objects.create(
            diagnostic_report=report,
            observation_id=observation_id,
            item_sequence=item_sequence
        )

        return result
