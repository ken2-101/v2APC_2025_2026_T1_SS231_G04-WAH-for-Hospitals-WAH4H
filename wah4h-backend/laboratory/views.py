from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # ✅ Changed from IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import LabRequest, LabResult, TestParameter
from .serializers import (
    LabRequestListSerializer,
    LabRequestDetailSerializer,
    LabRequestCreateSerializer,
    LabRequestUpdateSerializer,
    LabResultSerializer,
    LabResultCreateSerializer,
    TestParameterSerializer,
    AddParameterSerializer
)


class LabRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lab Requests
    Handles CRUD operations and status updates
    """
    
    queryset = LabRequest.objects.select_related(
        'admission',
        'admission__patient',  # ✅ Access patient through admission
        'requesting_doctor'
    ).prefetch_related('result__parameters')
    permission_classes = [AllowAny]  # ✅ Changed to AllowAny for MVP
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'test_type', 'requesting_doctor']
    search_fields = [
        'request_id', 
        'admission__admission_id',
        'admission__patient__patient_id', 
        'admission__patient__first_name', 
        'admission__patient__last_name'
    ]
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return LabRequestListSerializer
        elif self.action == 'create':
            return LabRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return LabRequestUpdateSerializer
        return LabRequestDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new lab request"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return full details of created request
        instance = serializer.instance
        detail_serializer = LabRequestDetailSerializer(instance)
        headers = self.get_success_headers(detail_serializer.data)
        
        return Response(
            detail_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Get dashboard statistics
        GET /api/laboratory/requests/dashboard_stats/
        """
        today = timezone.now().date()
        
        pending_count = self.queryset.filter(status='pending').count()
        in_progress_count = self.queryset.filter(status='in_progress').count()
        completed_today_count = self.queryset.filter(
            status='completed',
            updated_at__date=today
        ).count()
        
        return Response({
            'pending': pending_count,
            'in_progress': in_progress_count,
            'completed_today': completed_today_count
        })
    
    @action(detail=True, methods=['post'])
    def start_processing(self, request, pk=None):
        """
        Start processing a pending request
        POST /api/laboratory/requests/{id}/start_processing/
        """
        lab_request = self.get_object()
        
        if lab_request.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lab_request.status = 'in_progress'
        lab_request.save()
        
        serializer = LabRequestDetailSerializer(lab_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def by_status(self, request, pk=None):
        """
        Get requests filtered by status
        GET /api/laboratory/requests/by_status/?status=pending
        """
        status_filter = request.query_params.get('status', None)
        
        if status_filter:
            queryset = self.queryset.filter(status=status_filter)
        else:
            queryset = self.queryset
        
        serializer = LabRequestListSerializer(queryset, many=True)
        return Response(serializer.data)


class LabResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lab Results
    Handles encoding and updating test results
    """
    
    queryset = LabResult.objects.select_related(
        'lab_request',
        'lab_request__admission',
        'lab_request__admission__patient',  # ✅ Access patient through admission
        'lab_request__requesting_doctor',
        'performed_by'
    ).prefetch_related('parameters')
    permission_classes = [AllowAny]  # ✅ Changed to AllowAny for MVP
    serializer_class = LabResultSerializer
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return LabResultCreateSerializer
        return LabResultSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create new lab result (encode results)
        Automatically updates request status to completed
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set finalized_at timestamp
        lab_result = serializer.save(finalized_at=timezone.now())
        
        # Return full result details
        detail_serializer = LabResultSerializer(lab_result)
        headers = self.get_success_headers(detail_serializer.data)
        
        return Response(
            detail_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=True, methods=['post'])
    def add_parameter(self, request, pk=None):
        """
        Add a test parameter to existing result
        POST /api/laboratory/results/{id}/add_parameter/
        Body: {
            "parameter_name": "Hemoglobin",
            "result_value": "14.5",
            "unit": "g/dL",
            "reference_range": "12-16",
            "interpretation": "normal"
        }
        """
        lab_result = self.get_object()
        serializer = AddParameterSerializer(data=request.data)
        
        if serializer.is_valid():
            # Create new test parameter
            parameter = TestParameter.objects.create(
                lab_result=lab_result,
                **serializer.validated_data
            )
            
            param_serializer = TestParameterSerializer(parameter)
            return Response(param_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_parameter(self, request, pk=None):
        """
        Update a specific test parameter
        PATCH /api/laboratory/results/{id}/update_parameter/
        Body: {
            "parameter_id": 1,
            "result_value": "15.0",
            "interpretation": "normal"
        }
        """
        lab_result = self.get_object()
        parameter_id = request.data.get('parameter_id')
        
        if not parameter_id:
            return Response(
                {'error': 'parameter_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            parameter = TestParameter.objects.get(
                id=parameter_id,
                lab_result=lab_result
            )
        except TestParameter.DoesNotExist:
            return Response(
                {'error': 'Parameter not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TestParameterSerializer(
            parameter,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def delete_parameter(self, request, pk=None):
        """
        Delete a specific test parameter
        DELETE /api/laboratory/results/{id}/delete_parameter/?parameter_id=1
        """
        lab_result = self.get_object()
        parameter_id = request.query_params.get('parameter_id')
        
        if not parameter_id:
            return Response(
                {'error': 'parameter_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            parameter = TestParameter.objects.get(
                id=parameter_id,
                lab_result=lab_result
            )
            parameter.delete()
            return Response(
                {'message': 'Parameter deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except TestParameter.DoesNotExist:
            return Response(
                {'error': 'Parameter not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """
        Finalize lab result (set finalized_at timestamp)
        POST /api/laboratory/results/{id}/finalize/
        """
        lab_result = self.get_object()
        
        if lab_result.finalized_at:
            return Response(
                {'error': 'Result already finalized'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lab_result.finalized_at = timezone.now()
        lab_result.lab_request.status = 'completed'
        lab_result.lab_request.save()
        lab_result.save()
        
        serializer = LabResultSerializer(lab_result)
        return Response(serializer.data)


class TestParameterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Test Parameters
    Handles individual parameter CRUD operations
    """
    
    queryset = TestParameter.objects.select_related('lab_result')
    permission_classes = [AllowAny]  # ✅ Changed to AllowAny for MVP
    serializer_class = TestParameterSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['lab_result', 'interpretation']
    
    def get_queryset(self):
        """Filter by lab_result if provided"""
        queryset = super().get_queryset()
        lab_result_id = self.request.query_params.get('lab_result_id', None)
        
        if lab_result_id:
            queryset = queryset.filter(lab_result_id=lab_result_id)
        
        return queryset