from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import DischargeRecord
from .serializers import DischargeRecordSerializer, DischargeFormSerializer


class DischargeRecordViewSet(viewsets.ModelViewSet):
    queryset = DischargeRecord.objects.all()
    serializer_class = DischargeRecordSerializer
    
    def get_queryset(self):
        queryset = DischargeRecord.objects.all()
        status_filter = self.request.query_params.get('status', None)
        department = self.request.query_params.get('department', None)
        condition = self.request.query_params.get('condition', None)
        search = self.request.query_params.get('search', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if department:
            queryset = queryset.filter(department=department)
        if condition:
            queryset = queryset.filter(condition__icontains=condition)
        if search:
            queryset = queryset.filter(
                models.Q(patient_name__icontains=search) |
                models.Q(room__icontains=search) |
                models.Q(condition__icontains=search) |
                models.Q(physician__icontains=search) |
                models.Q(department__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_discharges = self.queryset.filter(status__in=['pending', 'ready'])
        serializer = self.get_serializer(pending_discharges, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def discharged(self, request):
        discharged_patients = self.queryset.filter(status='discharged')
        serializer = self.get_serializer(discharged_patients, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def process_discharge(self, request, pk=None):
        discharge_record = self.get_object()
        form_serializer = DischargeFormSerializer(data=request.data)
        
        if form_serializer.is_valid():
            # Update discharge record with form data
            discharge_record.final_diagnosis_text = form_serializer.validated_data.get('finalDiagnosis', '')
            discharge_record.hospital_stay_summary = form_serializer.validated_data.get('hospitalStaySummary', '')
            discharge_record.discharge_medications = form_serializer.validated_data.get('dischargeMedications', '')
            discharge_record.discharge_instructions = form_serializer.validated_data.get('dischargeInstructions', '')
            discharge_record.follow_up_plan = form_serializer.validated_data.get('followUpPlan', '')
            discharge_record.billing_status = form_serializer.validated_data.get('billingStatus', '')
            discharge_record.pending_items = form_serializer.validated_data.get('pendingItems', '')
            discharge_record.discharge_summary_text = form_serializer.validated_data.get('hospitalStaySummary', '')
            discharge_record.status = 'discharged'
            discharge_record.discharge_date = timezone.now()
            discharge_record.save()
            
            serializer = self.get_serializer(discharge_record)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(form_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_requirements(self, request, pk=None):
        discharge_record = self.get_object()
        requirements = request.data.get('requirements', {})
        
        discharge_record.final_diagnosis = requirements.get('finalDiagnosis', discharge_record.final_diagnosis)
        discharge_record.physician_signature = requirements.get('physicianSignature', discharge_record.physician_signature)
        discharge_record.medication_reconciliation = requirements.get('medicationReconciliation', discharge_record.medication_reconciliation)
        discharge_record.discharge_summary = requirements.get('dischargeSummary', discharge_record.discharge_summary)
        discharge_record.billing_clearance = requirements.get('billingClearance', discharge_record.billing_clearance)
        discharge_record.nursing_notes = requirements.get('nursingNotes', discharge_record.nursing_notes)
        discharge_record.follow_up_scheduled = requirements.get('followUpScheduled', discharge_record.follow_up_scheduled)
        
        # Check if all required items are completed
        if (discharge_record.final_diagnosis and 
            discharge_record.physician_signature and 
            discharge_record.medication_reconciliation and 
            discharge_record.discharge_summary and 
            discharge_record.billing_clearance):
            discharge_record.status = 'ready'
        
        discharge_record.save()
        serializer = self.get_serializer(discharge_record)
        return Response(serializer.data)
