from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.shortcuts import get_object_or_404
from .models import DischargeRecord
from .serializers import (
    DischargeRecordSerializer, 
    DischargeFormSerializer,
    BillingPatientSerializer
)
from billing.models import BillingRecord
from patients.models import Patient
from admissions.models import Admission


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
    
    @action(detail=False, methods=['get', 'post'])
    def from_billing(self, request):
        """
        GET: Get finalized billing records that are eligible for discharge.
        POST: Create discharge records from selected billing records.
        Only finalized billing records can create discharge records.
        """
        if request.method == 'GET':
            # Get finalized billing records that don't have discharge records yet
            finalized_billings = BillingRecord.objects.filter(
                is_finalized=True
            ).select_related('patient', 'admission')
            
            # Filter out those that already have discharge records
            existing_discharge_patient_ids = DischargeRecord.objects.values_list('patient_id', flat=True)
            eligible_billings = finalized_billings.exclude(patient_id__in=existing_discharge_patient_ids)
            
            # Use the serializer
            serializer = BillingPatientSerializer(eligible_billings, many=True)
            
            return Response({
                'count': len(serializer.data),
                'patients': serializer.data
            })
        
        # POST method - Create discharge records from billing
        billing_ids = request.data.get('billing_ids', [])
        
        if not billing_ids:
            return Response(
                {'error': 'No billing IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_records = []
        errors = []
        
        for billing_id in billing_ids:
            try:
                # Validate billing record exists and is finalized
                billing = get_object_or_404(BillingRecord, id=billing_id)
                
                if not billing.is_finalized:
                    errors.append({
                        'billing_id': billing_id,
                        'error': f'Billing record {billing_id} is not finalized. Only finalized bills can proceed to discharge.'
                    })
                    continue
                
                # Check if discharge record already exists
                if DischargeRecord.objects.filter(patient=billing.patient).exists():
                    errors.append({
                        'billing_id': billing_id,
                        'error': f'Discharge record already exists for patient {billing.patient_name}'
                    })
                    continue
                
                # Create discharge record from billing data
                discharge_record = DischargeRecord.objects.create(
                    patient=billing.patient,
                    admission=billing.admission,
                    patient_name=billing.patient_name,
                    room=billing.room_ward,
                    admission_date=billing.admission_date,
                    condition=billing.admission.admitting_diagnosis if billing.admission else 'N/A',
                    status='pending',
                    physician=billing.admission.attending_physician if billing.admission else 'N/A',
                    department=billing.admission.ward if billing.admission else 'N/A',
                    age=self._calculate_age(billing.patient.date_of_birth) if billing.patient.date_of_birth else 0,
                    estimated_discharge=billing.discharge_date,
                    billing_clearance=True,  # Billing is cleared since it's finalized
                    billing_status='cleared'
                )
                
                created_records.append({
                    'discharge_id': discharge_record.id,
                    'patient_name': discharge_record.patient_name,
                    'billing_id': billing_id
                })
                
            except BillingRecord.DoesNotExist:
                errors.append({
                    'billing_id': billing_id,
                    'error': f'Billing record {billing_id} not found'
                })
            except Exception as e:
                errors.append({
                    'billing_id': billing_id,
                    'error': str(e)
                })
        
        response_data = {
            'created': len(created_records),
            'records': created_records
        }
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status.HTTP_201_CREATED if created_records else status.HTTP_400_BAD_REQUEST)
    
    def _calculate_age(self, date_of_birth):
        """Calculate age from date of birth"""
        if not date_of_birth:
            return 0
        today = timezone.now().date()
        age = today.year - date_of_birth.year
        if today.month < date_of_birth.month or (today.month == date_of_birth.month and today.day < date_of_birth.day):
            age -= 1
        return age
    
    def create(self, request, *args, **kwargs):
        """
        Override create to validate that discharge records must come from billing.
        Direct creation without billing validation is not allowed.
        """
        patient_id = request.data.get('patient')
        
        if not patient_id:
            return Response(
                {'error': 'Patient ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate that patient has a finalized billing record
        try:
            patient = Patient.objects.get(id=patient_id)
            billing_record = BillingRecord.objects.filter(
                patient=patient,
                is_finalized=True
            ).first()
            
            if not billing_record:
                return Response(
                    {'error': 'Patient must have a finalized billing record before discharge eligibility. Please finalize billing first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if discharge record already exists
            if DischargeRecord.objects.filter(patient=patient).exists():
                return Response(
                    {'error': 'Discharge record already exists for this patient'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Proceed with standard creation
        return super().create(request, *args, **kwargs)
