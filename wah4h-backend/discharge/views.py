from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import DischargeRecord, DischargeRequirements
from .serializers import DischargeRecordSerializer, DischargeRequirementsSerializer


class DischargeRequirementsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing discharge requirements checklist.
    """
    queryset = DischargeRequirements.objects.all()
    serializer_class = DischargeRequirementsSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        admission_id = self.request.query_params.get('admission')
        
        if admission_id:
            queryset = queryset.filter(admission_id=admission_id)
        
        return queryset


class DischargeRecordViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing discharge records.
    Supports filtering by status, patient name, physician, and department.
    """
    queryset = DischargeRecord.objects.all()
    serializer_class = DischargeRecordSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status (pending, ready, discharged)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search by patient name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(patient_name__icontains=search) |
                Q(room__icontains=search) |
                Q(condition__icontains=search) |
                Q(physician__icontains=search) |
                Q(department__icontains=search)
            )
        
        # Filter by physician
        physician = self.request.query_params.get('physician')
        if physician:
            queryset = queryset.filter(physician__icontains=physician)
        
        # Filter by department
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department__icontains=department)
        
        # Filter by discharge date
        discharge_date = self.request.query_params.get('discharge_date')
        if discharge_date:
            queryset = queryset.filter(discharge_date=discharge_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def discharged_patients(self, request):
        """
        Get all discharged patients.
        Based on frontend DischargedPatientsReport component.
        """
        discharged = self.get_queryset().filter(status='discharged')
        serializer = self.get_serializer(discharged, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_discharges(self, request):
        """
        Get all patients pending discharge clearance.
        """
        pending = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ready_for_discharge(self, request):
        """
        Get all patients ready for discharge.
        """
        ready = self.get_queryset().filter(status='ready')
        serializer = self.get_serializer(ready, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_discharged(self, request, pk=None):
        """
        Mark a discharge record as discharged.
        Updates status to 'discharged' and sets discharge_date.
        """
        discharge_record = self.get_object()
        discharge_date = request.data.get('discharge_date')
        
        discharge_record.status = 'discharged'
        if discharge_date:
            discharge_record.discharge_date = discharge_date
        discharge_record.save()
        
        serializer = self.get_serializer(discharge_record)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        """
        Mark a discharge record as ready for discharge.
        """
        discharge_record = self.get_object()
        discharge_record.status = 'ready'
        discharge_record.save()
        
        serializer = self.get_serializer(discharge_record)
        return Response(serializer.data)
