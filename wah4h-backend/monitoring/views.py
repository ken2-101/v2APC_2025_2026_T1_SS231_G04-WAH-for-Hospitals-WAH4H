from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import Observation, ChargeItem, ChargeItemDefinition
from .serializers import (
    ObservationSerializer,
    ObservationListSerializer,
    ChargeItemSerializer,
    ChargeItemDefinitionSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination configuration for monitoring resources.
    Critical for high-volume models like Observation (vital signs).
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class ObservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Observation (vital signs, lab results, measurements).
    
    Filtering Strategy:
        - Filter directly on Integer FK fields (subject_id, encounter_id), NOT resolved names.
        - Allows frontend to query by IDs without database joins.
    
    Filters:
        - subject_id: Patient ID (integer)
        - encounter_id: Encounter ID (integer)
        - code: Observation code (e.g., vital sign type)
        - category: Observation category
        - priority: Observation priority (routine, urgent, stat)
    
    Ordering:
        - Default: Most recent first (-effective_datetime)
        - Available: effective_datetime, issued, created_at
    
    Search:
        - code, category, interpretation
    """
    queryset = Observation.objects.all()
    serializer_class = ObservationSerializer
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
        'code': ['exact', 'icontains'],
        'category': ['exact', 'icontains'],
        'priority': ['exact'],
    }
    
    ordering_fields = [
        'effective_datetime',
        'issued',
        'created_at',
        'observation_id'
    ]
    ordering = ['-effective_datetime']  # Default: Most recent first
    
    search_fields = [
        'code',
        'category',
        'interpretation',
        'note'
    ]
    
    def get_serializer_class(self):
        """Use lightweight serializer for list views."""
        if self.action == 'list':
            return ObservationListSerializer
        return ObservationSerializer
    
    def list(self, request, *args, **kwargs):
        """Optimized list view with prefetch to avoid N+1 queries."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            # Bulk fetch related entities
            context = self._get_prefetch_context(page)
            serializer = self.get_serializer(page, many=True, context=context)
            return self.get_paginated_response(serializer.data)
        
        context = self._get_prefetch_context(queryset)
        serializer = self.get_serializer(queryset, many=True, context=context)
        return Response(serializer.data)
    
    def _get_prefetch_context(self, queryset):
        """Bulk fetch related entities to prevent N+1 queries."""
        from patients.models import Patient
        
        subject_ids = set(obj.subject_id for obj in queryset if obj.subject_id)
        
        # Fetch all patients in one query
        patients = Patient.objects.filter(id__in=subject_ids)
        patients_map = {p.id: p for p in patients}
        
        return {
            'patients_map': patients_map,
        }


class ChargeItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ChargeItem (billable items, procedures, services).
    
    Filtering Strategy:
        - Filter directly on Integer FK fields (subject_id, account_id), NOT resolved names.
        - Allows frontend to query by IDs without database joins.
    
    Filters:
        - subject_id: Patient ID (integer)
        - account_id: Billing Account ID (integer)
        - code: Charge item code
        - performing_organization_id: Organization ID (integer)
    
    Ordering:
        - Default: Most recent first (-entered_date)
        - Available: entered_date, occurrence_datetime, created_at
    
    Search:
        - code, note, reason_code
    """
    queryset = ChargeItem.objects.all()
    serializer_class = ChargeItemSerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter
    ]
    
    # Filter on Integer FK fields directly (e.g., subject_id, NOT subject)
    filterset_fields = {
        'subject_id': ['exact'],
        'account_id': ['exact'],
        'context_id': ['exact'],
        'performing_organization_id': ['exact'],
        'requesting_organization_id': ['exact'],
        'performer_actor_id': ['exact'],
        'code': ['exact', 'icontains'],
    }
    
    ordering_fields = [
        'entered_date',
        'occurrence_datetime',
        'created_at',
        'chargeitem_id'
    ]
    ordering = ['-entered_date']  # Default: Most recent first
    
    search_fields = [
        'code',
        'note',
        'reason_code',
        'definition_uri'
    ]


class ChargeItemDefinitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ChargeItemDefinition (pricing definitions, billing rules).
    
    Filters:
        - code: Definition code
        - title: Definition title
        - version: Version identifier
    
    Ordering:
        - Default: Most recent first (-date)
        - Available: date, approvalDate, lastReviewDate
    
    Search:
        - code, title, description, publisher
    """
    queryset = ChargeItemDefinition.objects.all()
    serializer_class = ChargeItemDefinitionSerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter
    ]
    
    filterset_fields = {
        'code': ['exact', 'icontains'],
        'title': ['exact', 'icontains'],
        'version': ['exact'],
        'publisher': ['exact', 'icontains'],
    }
    
    ordering_fields = [
        'date',
        'approvalDate',
        'lastReviewDate',
        'chargeitemdefinition_id'
    ]
    ordering = ['-date']  # Default: Most recent first
    
    search_fields = [
        'code',
        'title',
        'description',
        'publisher',
        'copyright'
    ]