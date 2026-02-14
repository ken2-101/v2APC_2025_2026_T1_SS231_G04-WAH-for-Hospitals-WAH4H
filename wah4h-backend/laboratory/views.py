"""
Laboratory Views
=================
Enhanced viewsets with filtering, pagination, and search capabilities.
Follows the pattern established in the monitoring module.
"""

#from django_weasyprint import WeasyTemplateResponseMixin
#from django.views.generic import DetailView
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import DiagnosticReport, LabTestDefinition, Specimen, ImagingStudy
from .serializers import (
    DiagnosticReportSerializer,
    LabTestDefinitionSerializer,
    SpecimenSerializer,
    ImagingStudySerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination configuration for laboratory resources.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class DiagnosticReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for DiagnosticReport (lab test requests and results).
    
    Filtering Strategy:
        - Filter directly on Integer FK fields (subject_id, encounter_id), NOT resolved names.
        - Allows frontend to query by IDs without database joins.
    
    Filters:
        - subject_id: Patient ID (integer)
        - encounter_id: Encounter ID (integer)
        - performer_id: Practitioner ID (integer)
        - status: Report status (registered, partial, preliminary, final, amended, corrected, cancelled)
        - code_code: Test code
        - category_code: Category code
    
    Ordering:
        - Default: Most recent first (-issued_datetime)
        - Available: issued_datetime, effective_datetime, created_at, updated_at
    
    Search:
        - code_code, code_display, conclusion
    """
    queryset = DiagnosticReport.objects.all()
    serializer_class = DiagnosticReportSerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter
    ]
    
    # Filter on Integer FK fields directly (e.g., subject_id, NOT subject)
    filterset_fields = {
        'subject_id': ['exact'],
        'encounter_id': ['exact'],
        'performer_id': ['exact'],
        'requester_id': ['exact'],
        'status': ['exact'],
        'code_code': ['exact', 'icontains'],
        'category_code': ['exact'],
        'priority': ['exact'],  # Enable priority filtering
    }
    
    ordering_fields = [
        'issued_datetime',
        'effective_datetime',
        'created_at',
        'updated_at',
        'diagnostic_report_id',
    ]
    ordering = ['-issued_datetime']  # Default: Most recent first
    
    search_fields = [
        'code_code',
        'code_display',
        'conclusion',
        'identifier',
    ]

    def perform_create(self, serializer):
        """
        Custom create behavior to auto-assign requester if not provided.
        """
        user = self.request.user
        # Check if requester_id is present in the validated data or initial data
        # Note: serializer.validated_data might not have it if it wasn't in list of fields or was read_only
        # But here we want to inject it if missing.
        requester_id = serializer.validated_data.get('requester_id')
        
        if not requester_id and user.is_authenticated:
            # Auto-assign to current user (User ID = Practitioner ID in this system)
            serializer.save(requester_id=user.id)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """
        Finalize a diagnostic report (transition to final status).
        This delegates to the serializer's finalize method.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # delegate finalization to serializer (keeps view thin)
        serializer.finalize(instance)
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get dashboard statistics efficiently.
        Returns counts of pending, in-progress, and completed reports.
        """
        from django.db.models import Count, Q
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Efficient aggregation query instead of fetching all objects
        stats = DiagnosticReport.objects.aggregate(
            pending=Count('diagnostic_report_id', filter=Q(status='registered')),
            in_progress=Count('diagnostic_report_id', filter=Q(status__in=['preliminary', 'partial'])),
            completed_today=Count('diagnostic_report_id', filter=Q(
                status='final',
                issued_datetime__date=today
            ))
        )
        
        return Response(stats)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update the status of a diagnostic report.
        Accepts: { "status": "registered|preliminary|partial|final|..." }
        """
        instance = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status value
        valid_statuses = ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.status = new_status
        
        # Auto-set issued_datetime when transitioning to final
        if new_status == 'final' and not instance.issued_datetime:
            from django.utils import timezone
            instance.issued_datetime = timezone.now()
        
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


#class LabResultPDFView(WeasyTemplateResponseMixin, DetailView):
#    """
#    Generate a PDF for a specific diagnostic report.
#    """
#    model = DiagnosticReport
#    template_name = 'laboratory/lab_result_pdf.html'
#    
#    def get_context_data(self, **kwargs):
#        context = super().get_context_data(**kwargs)
#        # Ensure we have the latest data
#        instance = self.object
#        
#        # Serialize the data to get resolved fields (subject name, formatted results)
#        from .serializers import DiagnosticReportSerializer
#        serializer = DiagnosticReportSerializer(instance)
#        
#        # Add serialized data to context
#        context['report'] = serializer.data
#        
#        return context


class LabTestDefinitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LabTestDefinition (test catalog/lookup table).
    
    Filters:
        - code: Test code
        - category: Test category
        - status: Active/inactive
    
    Ordering:
        - Default: code (alphabetical)
        - Available: code, display, category
    
    Search:
        - code, display, category
    """
    
    queryset = LabTestDefinition.objects.all()
    serializer_class = LabTestDefinitionSerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter
    ]
    
    filterset_fields = {
        'code': ['exact', 'icontains'],
        'category': ['exact', 'icontains'],
        'status': ['exact'],
    }
    
    ordering_fields = ['code', 'display', 'category', 'created_at']
    ordering = ['code']
    
    search_fields = ['code', 'display', 'category']


class SpecimenViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Specimen (specimen tracking).
    
    Filters:
        - subject_id: Patient ID
        - type: Specimen type
        - status: Specimen status
    
    Ordering:
        - Default: Most recent first (-collection_datetime)
        - Available: collection_datetime, received_time
    
    Search:
        - type, note
    """
    
    queryset = Specimen.objects.all()
    serializer_class = SpecimenSerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter
    ]
    
    filterset_fields = {
        'subject_id': ['exact'],
        'type': ['exact', 'icontains'],
        'status': ['exact'],
        'collector_id': ['exact'],
    }
    
    ordering_fields = ['collection_datetime', 'received_time', 'created_at']
    ordering = ['-collection_datetime']
    
    search_fields = ['type', 'note', 'collection_body_site']


class ImagingStudyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ImagingStudy (imaging study records).
    
    Filters:
        - subject_id: Patient ID
        - encounter_id: Encounter ID
        - modality: Imaging modality
        - status: Study status
    
    Ordering:
        - Default: Most recent first (-started)
        - Available: started, created_at
    
    Search:
        - modality, description, note
    """
    
    queryset = ImagingStudy.objects.all()
    serializer_class = ImagingStudySerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter
    ]
    
    filterset_fields = {
        'subject_id': ['exact'],
        'encounter_id': ['exact'],
        'modality': ['exact', 'icontains'],
        'status': ['exact'],
        'interpreter_id': ['exact'],
    }
    
    ordering_fields = ['started', 'created_at']
    ordering = ['-started']
    
    search_fields = ['modality', 'description', 'note']