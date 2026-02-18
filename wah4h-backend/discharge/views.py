from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Discharge
from .serializers import DischargeSerializer
from admission.models import Encounter
from patients.models import Patient
from accounts.models import Practitioner
from django.utils.dateparse import parse_datetime
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
from patients.models import Patient
from admission.models import Encounter
from billing.models import Invoice
from accounts.models import Practitioner, Location

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

    def _attach_related_objects(self, queryset):
        instances = list(queryset)
        patient_ids = set()
        encounter_ids = set()
        
        for instance in instances:
            if instance.patient_id: patient_ids.add(instance.patient_id)
            if instance.encounter_id: encounter_ids.add(instance.encounter_id)
        
        # Optimize: Fetch only needed fields if possible, but for now fetch all
        patients = {p.id: p for p in Patient.objects.filter(id__in=patient_ids)}
        encounters = {e.encounter_id: e for e in Encounter.objects.filter(encounter_id__in=encounter_ids)}
        
        practitioner_ids = set()
        location_ids = set()
        
        for enc in encounters.values():
            if enc.participant_individual_id: practitioner_ids.add(enc.participant_individual_id)
            if enc.location_id: location_ids.add(enc.location_id)
                
        practitioners = {p.practitioner_id: p for p in Practitioner.objects.filter(practitioner_id__in=practitioner_ids)}
        locations = {l.location_id: l for l in Location.objects.filter(location_id__in=location_ids)}
        
        for instance in instances:
            instance.patient_obj = patients.get(instance.patient_id)
            instance.encounter_obj = encounters.get(instance.encounter_id)
            if instance.encounter_obj:
                instance.encounter_obj.practitioner_obj = practitioners.get(instance.encounter_obj.participant_individual_id)
                instance.encounter_obj.location_obj = locations.get(instance.encounter_obj.location_id)
            
        return instances

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        instances = self._attach_related_objects(queryset)
        serializer = self.get_serializer(instances, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.patient_obj = Patient.objects.get(id=instance.patient_id)
        except Patient.DoesNotExist:
            instance.patient_obj = None
            
        try:
            enc = Encounter.objects.get(encounter_id=instance.encounter_id)
            if enc.participant_individual_id:
                try: enc.practitioner_obj = Practitioner.objects.get(practitioner_id=enc.participant_individual_id)
                except Practitioner.DoesNotExist: enc.practitioner_obj = None
            
            if enc.location_id:
                try: enc.location_obj = Location.objects.get(location_id=enc.location_id)
                except Location.DoesNotExist: enc.location_obj = None
                    
            instance.encounter_obj = enc
        except Encounter.DoesNotExist:
            instance.encounter_obj = None
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        queryset = Discharge.objects.filter(workflow_status__in=['pending', 'ready'])
        instances = self._attach_related_objects(queryset)
        serializer = self.get_serializer(instances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def discharged(self, request):
        queryset = Discharge.objects.filter(workflow_status='discharged')
        instances = self._attach_related_objects(queryset)
        serializer = self.get_serializer(instances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'post'])
    def from_billing(self, request):
        if request.method == 'GET':
            eligible_invoices = Invoice.objects.filter(status__in=['issued', 'balanced']).select_related() 
            active_discharge_patient_ids = Discharge.objects.filter(workflow_status__in=['pending', 'ready', 'discharged']).values_list('patient_id', flat=True)
            eligible_invoices = eligible_invoices.exclude(subject_id__in=active_discharge_patient_ids)
            invoices = list(eligible_invoices[:50])
            patient_ids = [inv.subject_id for inv in invoices]
            patients = {p.id: p for p in Patient.objects.filter(id__in=patient_ids)}
            
            latest_encounters = {}
            if patient_ids:
                for pid in patient_ids:
                    enc = Encounter.objects.filter(subject_id=pid).order_by('-encounter_id').first()
                    if enc: latest_encounters[pid] = enc
            
            loc_ids = {e.location_id for e in latest_encounters.values() if e.location_id}
            locations = {l.location_id: l for l in Location.objects.filter(location_id__in=loc_ids)}
            
            results = []
            for inv in invoices:
                pat = patients.get(inv.subject_id)
                if not pat: continue
                enc = latest_encounters.get(pat.id)
                room_name = "Unassigned"
                if enc and enc.location_id:
                    loc = locations.get(enc.location_id)
                    if loc: room_name = loc.name
                
                results.append({
                    "billing_id": inv.invoice_id,
                    "patient_name": f"{pat.first_name} {pat.last_name}",
                    "hospital_id": pat.patient_id,
                    "room": room_name,
                    "age": pat.age,
                    "department": enc.service_type if enc else "General",
                    "admission_date": inv.invoice_datetime.strftime("%Y-%m-%d") if inv.invoice_datetime else "N/A",
                    "attending_physician": "Dr. On-Duty",
                    "condition": "Stable",
                })
            return Response({"patients": results})
            
        elif request.method == 'POST':
            billing_ids = request.data.get('billing_ids', [])
            created_count = 0
            errors = []
            invoices = Invoice.objects.filter(invoice_id__in=billing_ids)
            for inv in invoices:
                if Discharge.objects.filter(patient_id=inv.subject_id, workflow_status__in=['pending', 'ready']).exists():
                    errors.append({"error": f"Patient {inv.subject_id} already in discharge queue."})
                    continue
                encounter_id = 0
                latest_encounter = Encounter.objects.filter(subject_id=inv.subject_id).order_by('-encounter_id').first()
                if latest_encounter: encounter_id = latest_encounter.encounter_id
                
                Discharge.objects.create(
                    patient_id=inv.subject_id,
                    encounter_id=encounter_id,
                    workflow_status='pending',
                    notice_datetime=timezone.now(),
                    billing_cleared_datetime=timezone.now()
                )
                created_count += 1
            return Response({"created": created_count, "errors": errors})

    @action(detail=True, methods=['post'])
    def process_discharge(self, request, pk=None):
        instance = self.get_object()
        data = request.data
        
        with transaction.atomic():
            diagnosis = data.get('finalDiagnosis', '')
            summary = data.get('hospitalStaySummary', '')
            meds = data.get('dischargeMedications', '')
            instructions = data.get('dischargeInstructions', '')
            
            if diagnosis:
                instance.summary_of_stay = f"Diagnosis: {diagnosis}\n\nSummary: {summary}"
            else:
                instance.summary_of_stay = summary
            
            full_instructions = instructions
            if meds:
                full_instructions = f"{instructions}\n\nMedications: {meds}"
            instance.discharge_instructions = full_instructions
            
            instance.follow_up_plan = data.get('followUpPlan', instance.follow_up_plan)
            instance.pending_items = data.get('pendingItems', instance.pending_items)
            
            instance.workflow_status = 'discharged'
            instance.discharge_datetime = timezone.now()
            instance.save()
            
            if instance.encounter_id:
                try:
                    encounter = Encounter.objects.get(encounter_id=instance.encounter_id)
                    encounter.status = 'finished'
                    encounter.period_end = timezone.now().date()
                    encounter.location_status = 'discharged'
                    encounter.save()
                except Encounter.DoesNotExist:
                    pass
        
        try: instance.patient_obj = Patient.objects.get(id=instance.patient_id)
        except Patient.DoesNotExist: instance.patient_obj = None
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_requirements(self, request, pk=None):
        instance = self.get_object()
        reqs = request.data.get('requirements', {})
        if reqs.get('dischargeSummary'): instance.summary_of_stay = "Completed" 
        if reqs.get('billingClearance'): instance.billing_cleared_datetime = timezone.now()
        instance.save()
        return Response(status=status.HTTP_200_OK)