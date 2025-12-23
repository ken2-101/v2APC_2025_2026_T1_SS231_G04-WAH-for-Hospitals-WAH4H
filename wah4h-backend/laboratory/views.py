from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import LabTestType, LabRequest, LabResult
from .serializers import LabTestTypeSerializer, LabRequestSerializer, LabResultSerializer

class LabTestTypeViewSet(viewsets.ModelViewSet):
    queryset = LabTestType.objects.filter(is_active=True)
    serializer_class = LabTestTypeSerializer

class LabRequestViewSet(viewsets.ModelViewSet):
    queryset = LabRequest.objects.all().order_by('-requested_at')
    serializer_class = LabRequestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['patient__last_name', 'test_type__name', 'status']

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """
        Moves status from PENDING -> IN_PROGRESS
        Button: 'Process'
        """
        lab_request = self.get_object()
        lab_request.status = LabRequest.Status.IN_PROGRESS
        lab_request.save()
        return Response({'status': 'IN_PROGRESS'})

    @action(detail=True, methods=['post'])
    def submit_result(self, request, pk=None):
        """
        Moves status from IN_PROGRESS -> COMPLETED and saves results.
        Button: 'Finalize & Submit Results'
        """
        lab_request = self.get_object()
        
        # Validate data
        serializer = LabResultSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                # Save Result
                serializer.save(lab_request=lab_request)
                
                # Update Request Status
                lab_request.status = LabRequest.Status.COMPLETED
                lab_request.save()
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)