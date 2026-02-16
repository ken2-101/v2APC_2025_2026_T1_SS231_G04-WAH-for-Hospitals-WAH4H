from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection, transaction
from django.utils import timezone
from .models import Discharge
from .serializers import DischargeSerializer, PendingDischargeSerializer, DischargedPatientSerializer


class DischargeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for discharge management with custom endpoints for workflow
    """
    queryset = Discharge.objects.all()
    serializer_class = DischargeSerializer
    
    def _check_requirements_met(self, requirements):
        """
        Check if all external module requirements are met
        Returns (is_ready, missing_requirements)
        
        Requirements from other modules:
        - billing_cleared: Payment/billing must be complete
        - medication_reconciliation: Medications reconciled
        - nursing_notes: Nursing notes completed
        """
        if not requirements:
            return False, ['billing_cleared', 'medication_reconciliation', 'nursing_notes']
        
        # Current requirements from external modules
        required_fields = [
            'billing_cleared',
            'medication_reconciliation',
            'nursing_notes'
        ]
        
        missing = []
        for field in required_fields:
            if not requirements.get(field, False):
                missing.append(field)
        
        return len(missing) == 0, missing
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Get all admitted patients (inpatient encounters) as pending discharges
        Auto-creates discharge records if they don't exist
        """
        try:
            # Import Encounter model dynamically to avoid circular imports
            from django.apps import apps
            Encounter = apps.get_model('admission', 'Encounter')
            
            # Get all active encounters (not finished) - removed class_field filter
            # to show all admitted patients regardless of inpatient/outpatient classification
            encounters = Encounter.objects.exclude(
                status='finished'
            ).values('encounter_id', 'subject_id', 'class_field', 'status')
            
            discharge_ids = []
            
            for encounter in encounters:
                encounter_id = encounter['encounter_id']
                patient_id = encounter['subject_id']
                
                # Check if discharge record exists
                discharge = Discharge.objects.filter(encounter_id=encounter_id).first()
                
                if not discharge:
                    # Auto-create discharge record with default requirements
                    # Only track requirements from OTHER modules, not discharge form fields
                    default_requirements = {
                        'billing_cleared': False,           # From billing module
                        'medication_reconciliation': False, # From pharmacy module
                        'nursing_notes': False              # From nursing/monitoring module
                    }
                    
                    discharge = Discharge.objects.create(
                        encounter_id=encounter_id,
                        patient_id=patient_id,
                        workflow_status='pending',
                        requirements=default_requirements,
                        created_by='system'
                    )
                
                # Only include if NOT discharged
                if discharge.workflow_status != 'discharged':
                    discharge_ids.append(discharge.discharge_id)
            
            # Now fetch and serialize all discharge records
            discharges = Discharge.objects.filter(
                discharge_id__in=discharge_ids
            ).order_by('-created_at')
            
            serializer = PendingDischargeSerializer(discharges, many=True)
            return Response(serializer.data)
                
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'trace': traceback.format_exc(),
                'pending': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def debug_admissions(self, request):
        """Debug endpoint to check admission data"""
        try:
            from django.apps import apps
            Encounter = apps.get_model('admission', 'Encounter')
            
            total = Encounter.objects.count()
            inpatients = Encounter.objects.filter(class_field='inpatient')
            inpatient_count = inpatients.count()
            
            sample_data = []
            for enc in inpatients[:5]:
                sample_data.append({
                    'encounter_id': enc.encounter_id,
                    'patient_id': enc.subject_id,
                    'class': enc.class_field,
                    'status': enc.status
                })
            
            return Response({
                'total_encounters': total,
                'inpatient_encounters': inpatient_count,
                'sample_inpatients': sample_data,
                'message': 'If inpatient_encounters is 0, you need to add admitted patients in the Admission module first'
            })
        except Exception as e:
            import traceback
            return Response({
                'error': str(e),
                'trace': traceback.format_exc()
            })
    
    @action(detail=False, methods=['get'])
    def ready(self, request):
        """
        Get discharge records where all requirements are met (status='ready')
        """
        discharges = Discharge.objects.filter(
            workflow_status='ready'
        ).order_by('-created_at')
        
        serializer = PendingDischargeSerializer(discharges, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def discharged(self, request):
        """
        Get all completed discharges (workflow_status='discharged')
        """
        discharges = Discharge.objects.filter(
            workflow_status='discharged',
            discharge_datetime__isnull=False
        ).order_by('-discharge_datetime')
        
        serializer = DischargedPatientSerializer(discharges, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def update_requirements(self, request, pk=None):
        """
        Update discharge requirements checklist
        Automatically updates workflow_status to 'ready' if all requirements met
        """
        discharge = self.get_object()
        requirements = request.data.get('requirements')
        
        # If 'requirements' key not found, use the whole request data (for simple updates)
        if requirements is None:
            requirements = request.data
            
        # Merge with existing requirements
        current_reqs = discharge.requirements or {}
        if isinstance(requirements, dict):
            current_reqs.update(requirements)
        discharge.requirements = current_reqs
        
        # Check if all requirements are met
        is_ready, missing = self._check_requirements_met(current_reqs)
        
        if is_ready and discharge.workflow_status == 'pending':
            discharge.workflow_status = 'ready'
        elif not is_ready and discharge.workflow_status == 'ready':
            discharge.workflow_status = 'pending'
        
        discharge.save()
        
        serializer = self.get_serializer(discharge)
        return Response({
            'discharge': serializer.data,
            'is_ready': is_ready,
            'missing_requirements': missing
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete the discharge process
        Validates requirements and marks as discharged
        """
        discharge = self.get_object()
        
        # Check requirements
        is_ready, missing = self._check_requirements_met(discharge.requirements)
        if not is_ready:
            return Response({
                'error': 'Cannot complete discharge - requirements not met',
                'missing_requirements': missing
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update discharge record with final data
        discharge.final_diagnosis = request.data.get('finalDiagnosis', '')
        discharge.summary_of_stay = request.data.get('hospitalStaySummary', '')
        discharge.discharge_instructions = request.data.get('dischargeInstructions', '')
        discharge.follow_up_plan = request.data.get('followUpPlan', '')
        discharge.discharge_datetime = timezone.now()
        discharge.workflow_status = 'discharged'
        
        discharge.save()
        
        serializer = self.get_serializer(discharge)
        return Response({
            'message': 'Discharge completed successfully',
            'discharge': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def from_billing(self, request):
        """
        Get patients from billing records that are eligible for discharge
        Returns billing records that don't have discharge records yet
        """
        try:
            with connection.cursor() as cursor:
                # Query billing records that are paid and don't have discharge records
                cursor.execute("""
                    SELECT DISTINCT
                        b.billing_id,
                        b.patient_id,
                        b.encounter_id,
                        p.first_name,
                        p.last_name,
                        p.birthDate,
                        e.location_id,
                        e.service_type,
                        e.period_start,
                        e.reason_code,
                        e.participant_individual_id
                    FROM billing_bill b
                    INNER JOIN patient p ON b.patient_id = p.patient_id
                    INNER JOIN encounter e ON b.encounter_id = e.encounter_id
                    WHERE b.status = 'issued'
                    AND b.total_amount_paid >= b.total_amount
                    AND NOT EXISTS (
                        SELECT 1 FROM discharge_summary ds
                        WHERE ds.encounter_id = b.encounter_id
                    )
                    ORDER BY e.period_start DESC
                    LIMIT 50
                """)
                
                rows = cursor.fetchall()
                patients = []
                for row in rows:
                    # Calculate age
                    from datetime import date
                    age = 0
                    if row[5]:  # birthDate
                        today = date.today()
                        birth_date = row[5]
                        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                    
                    patients.append({
                        'billing_id': row[0],
                        'patient_id': row[1],
                        'encounter_id': row[2],
                        'patient_name': f"{row[3]} {row[4]}",
                        'hospital_id': row[1],
                        'age': age,
                        'room': f"Room {row[6]}" if row[6] else "N/A",
                        'department': row[7] or "General",
                        'admission_date': str(row[8]) if row[8] else "",
                        'condition': row[9] or "Stable",
                        'attending_physician': f"Dr. {row[10]}" if row[10] else "Unknown"
                    })
                
                return Response({
                    'count': len(patients),
                    'patients': patients
                })
        except Exception as e:
            return Response({
                'error': str(e),
                'count': 0,
                'patients': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_from_billing(self, request):
        """
        Create discharge records from billing records
        Expects: { "billing_ids": [1, 2, 3] }
        """
        billing_ids = request.data.get('billing_ids', [])
        
        if not billing_ids:
            return Response({
                'error': 'No billing IDs provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        errors = []
        
        try:
            with connection.cursor() as cursor:
                for billing_id in billing_ids:
                    # Get billing record details
                    cursor.execute("""
                        SELECT patient_id, encounter_id
                        FROM billing_bill
                        WHERE billing_id = %s
                    """, [billing_id])
                    
                    row = cursor.fetchone()
                    if not row:
                        errors.append({
                            'billing_id': billing_id,
                            'error': 'Billing record not found'
                        })
                        continue
                    
                    patient_id, encounter_id = row
                    
                    # Check if discharge record already exists
                    if Discharge.objects.filter(encounter_id=encounter_id).exists():
                        errors.append({
                            'billing_id': billing_id,
                            'error': 'Discharge record already exists for this encounter'
                        })
                        continue
                    
                    # Create discharge record with default requirements (3 items)
                    # Only track requirements from OTHER modules
                    default_requirements = {
                        'billing_cleared': True,            # Set to true since we're importing from paid billing
                        'medication_reconciliation': False, # From pharmacy module
                        'nursing_notes': False              # From nursing/monitoring module
                    }
                    
                    discharge = Discharge.objects.create(
                        patient_id=patient_id,
                        encounter_id=encounter_id,
                        workflow_status='pending',
                        requirements=default_requirements,
                        created_by=request.user.username if request.user.is_authenticated else 'system'
                    )
                    created_count += 1
            
            return Response({
                'created': created_count,
                'errors': errors
            })
            
        except Exception as e:
            return Response({
                'error': str(e),
                'created': created_count,
                'errors': errors
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)