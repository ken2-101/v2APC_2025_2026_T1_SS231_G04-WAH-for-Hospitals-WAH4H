"""
laboratory/api/views.py

Hybrid ViewSets for Laboratory Module.
Implements CQRS-Lite pattern with service delegation.

Fortress Pattern Rules:
- ViewSets delegate to service layer (no .save() in views)
- Input serializers validate, Output serializers present
- Read operations use ACLs for enriched data
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.core.exceptions import ValidationError, ObjectDoesNotExist

from laboratory.models import LabTestDefinition, DiagnosticReport
from laboratory.api.serializers import (
    LabTestDefinitionInputSerializer,
    LabTestDefinitionOutputSerializer,
    DiagnosticReportInputSerializer,
    DiagnosticReportOutputSerializer,
    DiagnosticReportListSerializer,
)
from laboratory.services.lab_service import (
    LabCatalogService,
    LabResultService,
)
from laboratory.services.laboratory_acl import (
    LabCatalogACL,
    LabReportACL,
)


class LabTestDefinitionViewSet(viewsets.ModelViewSet):
    """
    Hybrid ViewSet for Laboratory Test Definitions (Catalog/Pricing).
    
    Used by administrators to maintain the test catalog.
    Provides pricing information to billing module via ACL.
    
    Operations:
    - list: Get all test definitions
    - retrieve: Get single test definition
    - create: Create new test definition (delegates to service)
    - update: Update test definition (delegates to service)
    - partial_update: Partial update (delegates to service)
    - destroy: Soft delete (set status to inactive)
    """
    queryset = LabTestDefinition.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'test_id'

    def get_serializer_class(self):
        """Use Input serializer for writes, Output for reads."""
        if self.action in ['create', 'update', 'partial_update']:
            return LabTestDefinitionInputSerializer
        return LabTestDefinitionOutputSerializer

    def get_queryset(self):
        """Filter by status if provided."""
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('code')

    def create(self, request, *args, **kwargs):
        """
        Create new laboratory test definition.
        Delegates to LabCatalogService.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Delegate to service layer
            test = LabCatalogService.create_test_definition(serializer.validated_data)
            
            # Return output DTO
            output_serializer = LabTestDefinitionOutputSerializer(test)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """
        Update laboratory test definition.
        Delegates to LabCatalogService.
        """
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Delegate to service layer
            test = LabCatalogService.update_test_definition(
                instance.code,
                serializer.validated_data
            )
            
            # Return output DTO
            output_serializer = LabTestDefinitionOutputSerializer(test)
            return Response(output_serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        """Partial update - delegates to service layer."""
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            # Delegate to service layer
            test = LabCatalogService.update_test_definition(
                instance.code,
                serializer.validated_data
            )
            
            # Return output DTO
            output_serializer = LabTestDefinitionOutputSerializer(test)
            return Response(output_serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete - set status to inactive.
        Preserves data for billing history.
        """
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save(update_fields=['status', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'])
    def update_price(self, request, test_id=None):
        """
        Update base price of a test definition.
        POST /api/laboratory/tests/{test_id}/update_price/
        Body: { "new_price": "1500.00" }
        """
        instance = self.get_object()
        new_price = request.data.get('new_price')

        if not new_price:
            return Response(
                {'error': 'new_price is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Delegate to service layer
            test = LabCatalogService.update_test_price(instance.code, new_price)
            
            # Return output DTO
            output_serializer = LabTestDefinitionOutputSerializer(test)
            return Response(output_serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DiagnosticReportViewSet(viewsets.ModelViewSet):
    """
    Hybrid ViewSet for Diagnostic Reports (Lab Results).
    
    Operations:
    - list: Get all diagnostic reports (with filters)
    - retrieve: Get single diagnostic report with full details
    - create: Create new diagnostic report (delegates to service)
    - update_status: Update report status (custom action)
    
    Query Parameters:
    - patient_id: Filter by patient
    - encounter_id: Filter by encounter
    - status: Filter by report status
    """
    queryset = DiagnosticReport.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'diagnostic_report_id'

    def get_serializer_class(self):
        """Use Input serializer for writes, Output for reads."""
        if self.action == 'create':
            return DiagnosticReportInputSerializer
        # Use OutputSerializer for list as well to get patient_summary
        elif self.action == 'list':
            return DiagnosticReportOutputSerializer
        return DiagnosticReportOutputSerializer

    def get_queryset(self):
        """
        Filter by patient, encounter, or status.
        Uses ACL for enriched queries when needed.
        """
        queryset = super().get_queryset()

        # Filter by patient
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(subject_id=patient_id)

        # Filter by encounter
        encounter_id = self.request.query_params.get('encounter_id')
        if encounter_id:
            queryset = queryset.filter(encounter_id=encounter_id)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-issued_datetime')

    def create(self, request, *args, **kwargs):
        """
        Create new diagnostic report.
        Delegates to LabResultService for validation and atomic creation.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Delegate to service layer
            report = LabResultService.create_diagnostic_report(serializer.validated_data)
            
            # Return output DTO
            output_serializer = DiagnosticReportOutputSerializer(report)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get dashboard statistics.
        GET /api/laboratory/reports/dashboard_stats/
        """
        from django.db.models import Count
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Aggregate counts by status
        stats = DiagnosticReport.objects.aggregate(
            pending=Count('diagnostic_report_id', filter=models.Q(status='registered')),
            in_progress=Count('diagnostic_report_id', filter=models.Q(status__in=['partial', 'preliminary'])),
            completed_today=Count('diagnostic_report_id', filter=models.Q(status='final', updated_at__date=today))
        )
        
        return Response(stats)


    @action(detail=True, methods=['patch'])
    def update_status(self, request, diagnostic_report_id=None):
        """
        Update status of a diagnostic report.
        PATCH /api/laboratory/reports/{diagnostic_report_id}/update_status/
        Body: { "status": "final" }
        """
        instance = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Delegate to service layer
            report = LabResultService.update_report_status(
                instance.diagnostic_report_id,
                new_status
            )
            
            # Return output DTO
            output_serializer = DiagnosticReportOutputSerializer(report)
            return Response(output_serializer.data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def by_patient(self, request):
        """
        Get all diagnostic reports for a patient.
        Uses ACL for enriched data.
        GET /api/laboratory/reports/by_patient/?patient_id=123
        """
        patient_id = request.query_params.get('patient_id')
        encounter_id = request.query_params.get('encounter_id')

        if not patient_id:
            return Response(
                {'error': 'patient_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            patient_id = int(patient_id)
            encounter_id = int(encounter_id) if encounter_id else None
        except ValueError:
            return Response(
                {'error': 'Invalid ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use ACL for enriched data
        reports = LabReportACL.get_patient_reports(patient_id, encounter_id)
        return Response(reports)

    @action(detail=True, methods=['post'])
    def add_result(self, request, diagnostic_report_id=None):
        """
        Add a result (observation) to an existing diagnostic report.
        POST /api/laboratory/reports/{diagnostic_report_id}/add_result/
        Body: { "observation_id": 456, "item_sequence": 1 }
        """
        instance = self.get_object()
        observation_id = request.data.get('observation_id')
        item_sequence = request.data.get('item_sequence')

        if not observation_id or not item_sequence:
            return Response(
                {'error': 'observation_id and item_sequence are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Delegate to service layer
            result = LabResultService.add_report_result(
                instance.diagnostic_report_id,
                observation_id,
                item_sequence
            )
            
            return Response(
                {
                    'diagnostic_report_result_id': result.diagnostic_report_result_id,
                    'observation_id': result.observation_id,
                    'item_sequence': result.item_sequence,
                },
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
