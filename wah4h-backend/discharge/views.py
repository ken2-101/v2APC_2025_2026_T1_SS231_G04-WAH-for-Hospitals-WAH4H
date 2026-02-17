from rest_framework import viewsets, status, response
from rest_framework.decorators import action
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Discharge
from .serializers import DischargeSerializer
from admission.models import Encounter
from patients.models import Patient
from accounts.models import Practitioner
from django.utils.dateparse import parse_datetime
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DischargeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing the Discharge workflow.
    Simplified for MVP - direct queries in serializer.
    """
    queryset = Discharge.objects.all().order_by('-created_at')
    serializer_class = DischargeSerializer

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Returns patients in the discharge workflow (pending or ready)."""
        pending_discharges = self.queryset.filter(workflow_status__in=['pending', 'ready'])
        serializer = self.get_serializer(pending_discharges, many=True)
        return response.Response(serializer.data)

    @action(detail=False, methods=['get'])
    def discharged(self, request):
        """Returns patients who have completed the discharge workflow."""
        discharged_patients = self.queryset.filter(workflow_status='discharged')
        serializer = self.get_serializer(discharged_patients, many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_discharge(self, request, pk=None):
        """
        Finalizes the discharge process.
        Atomic operation: Updates Discharge status and Encounter status.
        """
        discharge_record = self.get_object()
        
        with transaction.atomic():
            # Update discharge record
            discharge_record.workflow_status = 'discharged'
            discharge_record.discharge_datetime = request.data.get('discharge_datetime') or discharge_record.discharge_datetime
            discharge_record.save()

            # Update associated encounter status to 'finished'
            try:
                encounter = Encounter.objects.get(encounter_id=discharge_record.encounter_id)
                encounter.status = 'finished'
                
                # Handle possible string vs datetime object
                dt = discharge_record.discharge_datetime
                if isinstance(dt, str):
                    dt = parse_datetime(dt)
                
                if dt:
                    encounter.period_end = dt.date()
                encounter.save()
            except Encounter.DoesNotExist:
                logger.warning(f"Encounter {discharge_record.encounter_id} not found for discharge {discharge_record.discharge_id}")

        serializer = self.get_serializer(discharge_record)
        return response.Response(serializer.data)

    @action(detail=False, methods=['post'])
    def sync_from_admissions(self, request):
        """
        Syncs admitted patients from the Admission module.
        Creates discharge records for any admitted patients not yet in the discharge queue.
        """
        try:
            # Query for active inpatient encounters
            active_encounters = Encounter.objects.filter(
                class_field__in=['IMP', 'inpatient'],
                status__in=['in-progress', 'arrived']
            )
            
            created_count = 0
            skipped_count = 0
            
            for encounter in active_encounters:
                # Check if discharge record already exists
                if not Discharge.objects.filter(encounter_id=encounter.encounter_id).exists():
                    try:
                        Discharge.objects.create(
                            encounter_id=encounter.encounter_id,
                            patient_id=encounter.subject_id,
                            physician_id=encounter.participant_individual_id if hasattr(encounter, 'participant_individual_id') else None,
                            workflow_status='pending',
                            created_by='SYSTEM (Sync from Admissions)'
                        )
                        created_count += 1
                    except Exception as e:
                        logger.error(f"Failed to create discharge record for encounter {encounter.encounter_id}: {str(e)}")
                        skipped_count += 1
                else:
                    skipped_count += 1
            
            return response.Response({
                'success': True,
                'created': created_count,
                'skipped': skipped_count,
                'total_active_encounters': active_encounters.count(),
                'message': f'Successfully synced {created_count} patient(s) from admissions'
            })
        
        except Exception as e:
            logger.error(f"Error syncing from admissions: {str(e)}")
            return response.Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'])
    def update_requirements(self, request, pk=None):
        """Updates the discharge requirements checklist."""
        discharge_record = self.get_object()
        requirements = request.data.get('requirements', {})
        
        # Store requirements as JSON in pending_items field
        import json
        discharge_record.pending_items = json.dumps(requirements)
        discharge_record.save()
        
        serializer = self.get_serializer(discharge_record)
        return response.Response(serializer.data)