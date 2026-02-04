"""
Laboratory Anti-Corruption Layer (ACL)
Read-Only Service Layer for Laboratory Module

Exposes laboratory data to:
- Billing App: Test prices and codes (LabCatalogACL)
- Admission/Clinical Apps: Patient lab results (LabReportACL)

Fortress Pattern Rules:
- Return DTOs (dictionaries) only, never model instances
- Import models ONLY from laboratory.models
- Handle exceptions gracefully
"""

from typing import Dict, List, Optional, Any
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist

from laboratory.models import (
    LabTestDefinition,
    DiagnosticReport,
    DiagnosticReportResult,
)


class LabCatalogACL:
    """
    Service Catalog ACL for Billing Integration.
    Provides test pricing and validation for the Billing module.
    """

    @staticmethod
    def validate_test_code(code: str) -> bool:
        """
        Validate if a test code exists in the catalog.

        Args:
            code: Test code (SKU) to validate

        Returns:
            True if code exists and is active, False otherwise
        """
        try:
            return LabTestDefinition.objects.filter(
                code=code,
                status='active'
            ).exists()
        except Exception:
            return False

    @staticmethod
    def get_test_price(code: str) -> Optional[Dict[str, Any]]:
        """
        Get pricing information for a specific test code.

        Args:
            code: Test code (SKU)

        Returns:
            Dict containing:
                - code: str
                - name: str
                - base_price: Decimal
                - currency: str (always 'PHP')
            Returns None if test not found or not active
        """
        try:
            test = LabTestDefinition.objects.get(code=code, status='active')
            return {
                'code': test.code,
                'name': test.name,
                'base_price': Decimal(str(test.base_price)),
                'currency': 'PHP'
            }
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None

    @staticmethod
    def get_active_tests() -> List[Dict[str, Any]]:
        """
        Get all active laboratory tests from the catalog.

        Returns:
            List of dicts, each containing:
                - test_id: int
                - code: str
                - name: str
                - category: str
                - base_price: Decimal
                - currency: str
                - turnaround_time: str or None
        """
        try:
            tests = LabTestDefinition.objects.filter(status='active').order_by('code')
            return [
                {
                    'test_id': test.test_id,
                    'code': test.code,
                    'name': test.name,
                    'category': test.category,
                    'base_price': Decimal(str(test.base_price)),
                    'currency': 'PHP',
                    'turnaround_time': test.turnaround_time
                }
                for test in tests
            ]
        except Exception:
            return []


class LabReportACL:
    """
    Diagnostic Report ACL for Clinical History.
    Provides patient lab results to Admission and other clinical modules.
    """

    @staticmethod
    def get_patient_reports(
        patient_id: int,
        encounter_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all diagnostic reports for a patient.

        Args:
            patient_id: Patient ID (subject_id)
            encounter_id: Optional encounter filter

        Returns:
            List of dicts, each containing:
                - diagnostic_report_id: int
                - subject_id: int
                - encounter_id: int
                - code_code: str or None
                - code_display: str or None
                - conclusion: str or None
                - issued_datetime: datetime or None
                - effective_datetime: datetime or None
                - status: str
        """
        try:
            queryset = DiagnosticReport.objects.filter(subject_id=patient_id)

            if encounter_id is not None:
                queryset = queryset.filter(encounter_id=encounter_id)

            reports = queryset.order_by('-issued_datetime')

            return [
                {
                    'diagnostic_report_id': report.diagnostic_report_id,
                    'subject_id': report.subject_id,
                    'encounter_id': report.encounter_id,
                    'code_code': report.code_code,
                    'code_display': report.code_display,
                    'conclusion': report.conclusion,
                    'issued_datetime': report.issued_datetime,
                    'effective_datetime': report.effective_datetime,
                    'status': report.status
                }
                for report in reports
            ]
        except Exception:
            return []

    @staticmethod
    def get_report_details(report_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific diagnostic report.

        Args:
            report_id: Diagnostic report ID

        Returns:
            Dict containing:
                - diagnostic_report_id: int
                - subject_id: int
                - encounter_id: int
                - performer_id: int or None
                - results_interpreter_id: int or None
                - code_code: str or None
                - code_display: str or None
                - category_code: str or None
                - category_display: str or None
                - conclusion: str or None
                - conclusion_code: str or None
                - conclusion_display: str or None
                - issued_datetime: datetime or None
                - effective_datetime: datetime or None
                - status: str
                - results: List[Dict] containing:
                    - diagnostic_report_result_id: int
                    - observation_id: int
                    - item_sequence: int
            Returns None if report not found
        """
        try:
            report = DiagnosticReport.objects.prefetch_related('results').get(
                diagnostic_report_id=report_id
            )

            # Build results list from related DiagnosticReportResult
            results = [
                {
                    'diagnostic_report_result_id': result.diagnostic_report_result_id,
                    'observation_id': result.observation_id,
                    'item_sequence': result.item_sequence
                }
                for result in report.results.all()
            ]

            return {
                'diagnostic_report_id': report.diagnostic_report_id,
                'subject_id': report.subject_id,
                'encounter_id': report.encounter_id,
                'performer_id': report.performer_id,
                'results_interpreter_id': report.results_interpreter_id,
                'code_code': report.code_code,
                'code_display': report.code_display,
                'category_code': report.category_code,
                'category_display': report.category_display,
                'conclusion': report.conclusion,
                'conclusion_code': report.conclusion_code,
                'conclusion_display': report.conclusion_display,
                'issued_datetime': report.issued_datetime,
                'effective_datetime': report.effective_datetime,
                'status': report.status,
                'results': results
            }
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None
