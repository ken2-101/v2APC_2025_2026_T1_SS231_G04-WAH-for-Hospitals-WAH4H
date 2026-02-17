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
    Optimized with prefetching and atomic discharge processing.
    """
    queryset = Discharge.objects.all().order_by('-created_at')
    serializer_class = DischargeSerializer

    def get_serializer_context(self):
        """
        Enrich context with a data map for O(1) lookups in the serializer.
        Prevents N+1 queries during list serialization.
        """
        context = super().get_serializer_context()
        if self.action in ['list', 'retrieve', 'pending', 'discharged']:
            queryset = self.get_queryset()
            if self.action == 'retrieve':
                # Use obj since we might be retrieving a single object
                pass 
            
            # Extract IDs for bulk fetching
            patient_ids = list(queryset.values_list('patient_id', flat=True).distinct())
            practitioner_ids = list(queryset.values_list('physician_id', flat=True).distinct())
            encounter_ids = list(queryset.values_list('encounter_id', flat=True).distinct())

            # Build data map
            data_map = {
                'patients': {
                    p.id: f"{p.first_name} {p.last_name}" 
                    for p in Patient.objects.filter(id__in=patient_ids)
                },
                'practitioners': {
                    pr.practitioner_id: f"{pr.first_name} {pr.last_name}"
                    for pr in Practitioner.objects.filter(practitioner_id__in=practitioner_ids)
                },
                'encounters': {
                    e.encounter_id: e.identifier
                    for e in Encounter.objects.filter(encounter_id__in=encounter_ids)
                }
            }
            context['data_map'] = data_map
        return context

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

    @action(detail=True, methods=['patch'])
    def update_requirements(self, request, pk=None):
        """Updates the discharge requirements checklist."""
        discharge_record = self.get_object()
        # Simple implementation for MVP checklist
        # In a full FHIR implementation, this might be a QuestionaireResponse
        requirements = request.data.get('requirements', {})
        discharge_record.pending_items = str(requirements)
        discharge_record.save()
        
        serializer = self.get_serializer(discharge_record)
        return response.Response(serializer.data)