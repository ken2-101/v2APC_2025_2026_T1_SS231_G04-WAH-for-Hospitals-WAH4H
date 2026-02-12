from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import DiagnosticReport, DiagnosticReportResult


class DiagnosticReportResultSerializer(serializers.Serializer):
    """
    Enhanced serializer that fetches Observation data and formats it for frontend.
    Supports both input (observation_id) and output (full result details).
    """
    # Input fields (for create/update)
    observation_id = serializers.IntegerField(required=False)
    item_sequence = serializers.IntegerField(required=False)
    
    # Output fields (for read operations) - these match frontend expectations
    parameter = serializers.CharField(read_only=True)
    value = serializers.CharField(read_only=True)
    unit = serializers.CharField(read_only=True)
    referenceRange = serializers.CharField(read_only=True)
    flag = serializers.CharField(read_only=True, required=False)
    interpretation = serializers.CharField(read_only=True, required=False)

    def to_representation(self, instance):
        """
        Fetch Observation data and format it to match frontend interface.
        """
        from monitoring.models import Observation, ObservationComponent
        
        # If this is a DiagnosticReportResult instance, fetch the Observation
        if hasattr(instance, 'observation_id'):
            try:
                obs = Observation.objects.get(observation_id=instance.observation_id)
                
                # Extract value from polymorphic value fields
                value = None
                unit = ""
                
                if obs.value_quantity is not None:
                    value = str(obs.value_quantity)
                    # Try to infer unit from code or use empty string
                    unit = ""  # Observation model doesn't have explicit unit field
                elif obs.value_string:
                    value = obs.value_string
                elif obs.value_integer:
                    value = obs.value_integer
                elif obs.value_codeableconcept:
                    value = obs.value_codeableconcept
                elif obs.value_boolean is not None:
                    value = str(obs.value_boolean)
                else:
                    value = "N/A"
                
                # Build reference range
                ref_range = ""
                if obs.reference_range_low and obs.reference_range_high:
                    ref_range = f"{obs.reference_range_low}-{obs.reference_range_high}"
                elif obs.reference_range_text:
                    ref_range = obs.reference_range_text
                
                # Determine flag based on interpretation or value comparison
                flag = None
                if obs.interpretation:
                    interp_lower = obs.interpretation.lower()
                    if 'high' in interp_lower or 'increased' in interp_lower:
                        flag = 'HIGH'
                    elif 'low' in interp_lower or 'decreased' in interp_lower:
                        flag = 'LOW'
                    elif 'critical' in interp_lower:
                        flag = 'CRITICAL'
                    else:
                        flag = 'NORMAL'
                
                return {
                    'parameter': obs.code or 'Unknown',
                    'value': value,
                    'unit': unit,
                    'referenceRange': ref_range,
                    'flag': flag,
                    'interpretation': obs.interpretation
                }
            except Observation.DoesNotExist:
                # Fallback if observation not found
                return {
                    'parameter': 'Unknown',
                    'value': 'N/A',
                    'unit': '',
                    'referenceRange': '',
                    'flag': None,
                    'interpretation': None
                }
        
        # If this is raw dict data (from initial_data), return as-is
        return instance


class DiagnosticReportSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer that fetches Patient data and formats DiagnosticReport
    to match frontend expectations.
    """
    results = DiagnosticReportResultSerializer(many=True, required=False)
    
    # Additional fields for frontend (read-only, computed from linked models)
    subject_display = serializers.SerializerMethodField()
    subject_patient_id = serializers.SerializerMethodField()
    lifecycleStatus = serializers.SerializerMethodField()
    priority = serializers.SerializerMethodField()
    orderedBy = serializers.SerializerMethodField()
    orderedAt = serializers.SerializerMethodField()
    requestedBy = serializers.SerializerMethodField()
    requestedAt = serializers.SerializerMethodField()
    receivedBy = serializers.SerializerMethodField()
    receivedAt = serializers.SerializerMethodField()
    processedBy = serializers.SerializerMethodField()
    processedAt = serializers.SerializerMethodField()
    releasedBy = serializers.SerializerMethodField()
    releasedAt = serializers.SerializerMethodField()
    clinicalReason = serializers.SerializerMethodField()

    class Meta:
        model = DiagnosticReport
        fields = '__all__'

    def get_subject_display(self, obj):
        """Fetch patient name from Patient model."""
        from patients.models import Patient
        try:
            patient = Patient.objects.get(id=obj.subject_id)
            return f"{patient.first_name or ''} {patient.last_name or ''}".strip() or "Unknown Patient"
        except Patient.DoesNotExist:
            return "Unknown Patient"

    def get_subject_patient_id(self, obj):
        """Fetch patient identifier from Patient model."""
        from patients.models import Patient
        try:
            patient = Patient.objects.get(id=obj.subject_id)
            return patient.patient_id or f"P-{patient.id}"
        except Patient.DoesNotExist:
            return f"P-{obj.subject_id}"

    def get_lifecycleStatus(self, obj):
        """
        Map FHIR status to frontend lifecycle status.
        FHIR: registered, partial, preliminary, final, amended, corrected, cancelled
        Frontend: pending, received, in-progress, completed, released
        """
        status_map = {
            'registered': 'pending',
            'partial': 'in-progress',
            'preliminary': 'in-progress',
            'final': 'completed',
            'amended': 'completed',
            'corrected': 'completed',
            'cancelled': 'pending'
        }
        return status_map.get(obj.status, 'pending')

    def get_priority(self, obj):
        """
        Extract priority from conclusion or return default.
        In a real system, this might be a separate field or derived from ServiceRequest.
        """
        # For now, return a default. Could be enhanced to parse from conclusion or other fields
        return 'routine'

    def get_orderedBy(self, obj):
        """
        Get ordering physician name.
        In a real system, this would link to Practitioner via performer_id.
        """
        # Placeholder - could fetch from User/Practitioner model via performer_id
        return "Dr. Ordering Physician"

    def get_orderedAt(self, obj):
        """Use effective_datetime as order time."""
        if obj.effective_datetime:
            return obj.effective_datetime.isoformat()
        return obj.created_at.isoformat() if hasattr(obj, 'created_at') else None

    def get_requestedBy(self, obj):
        """Placeholder for requesting nurse."""
        return None

    def get_requestedAt(self, obj):
        """Placeholder for request time."""
        return None

    def get_receivedBy(self, obj):
        """Placeholder for lab tech who received specimen."""
        return None

    def get_receivedAt(self, obj):
        """Placeholder for specimen received time."""
        return None

    def get_processedBy(self, obj):
        """Placeholder for lab tech who processed results."""
        if obj.status in ['final', 'amended', 'corrected']:
            return "Lab Technician"
        return None

    def get_processedAt(self, obj):
        """Use issued_datetime as processing completion time."""
        if obj.issued_datetime:
            return obj.issued_datetime.isoformat()
        return None

    def get_releasedBy(self, obj):
        """Placeholder for who released the results."""
        return None

    def get_releasedAt(self, obj):
        """Placeholder for release time."""
        return None

    def get_clinicalReason(self, obj):
        """
        Extract clinical reason from conclusion or other fields.
        In a real system, this might come from ServiceRequest.
        """
        # Could parse from conclusion or return None
        return None

    def validate(self, data):
        # Basic required-field checks
        if not data.get('subject_id'):
            raise serializers.ValidationError({'subject_id': 'This field is required.'})

        # Period consistency
        start = data.get('effective_period_start')
        end = data.get('effective_period_end')
        if start and end and start > end:
            raise serializers.ValidationError({'effective_period_start': 'Start cannot be after end.'})

        # Validate nested results from initial_data (preserve input shape)
        incoming_results = self.initial_data.get('results', [])
        sequences = set()
        for idx, r in enumerate(incoming_results):
            seq = r.get('item_sequence')
            obs = r.get('observation_id')
            if seq is None:
                raise serializers.ValidationError({'results': f'Result at index {idx} missing item_sequence.'})
            if seq in sequences:
                raise serializers.ValidationError({'results': 'Duplicate item_sequence values are not allowed.'})
            sequences.add(seq)
            if obs is None or not isinstance(obs, int) or obs < 0:
                raise serializers.ValidationError({'results': f'Invalid observation_id at index {idx}.'})

        return data

    def create(self, validated_data):
        # Pull nested results from initial_data (we validate them in validate())
        results_input = self.initial_data.get('results', [])

        # Remove any key that doesn't belong to the model
        model_data = {k: v for k, v in validated_data.items()}

        with transaction.atomic():
            report = DiagnosticReport.objects.create(**model_data)
            # Create result rows preserving order / sequence
            for r in results_input:
                DiagnosticReportResult.objects.create(
                    diagnostic_report=report,
                    observation_id=r['observation_id'],
                    item_sequence=r['item_sequence']
                )
            return report

    def update(self, instance, validated_data):
        results_input = self.initial_data.get('results', None)

        with transaction.atomic():
            # Update simple fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # If results were provided, replace them (explicit behavior)
            if results_input is not None:
                instance.results.all().delete()
                for r in results_input:
                    DiagnosticReportResult.objects.create(
                        diagnostic_report=instance,
                        observation_id=r['observation_id'],
                        item_sequence=r['item_sequence']
                    )

            return instance

    def finalize(self, instance):
        # Example state transition: mark the report as issued if not already
        if not instance.issued_datetime:
            instance.issued_datetime = timezone.now()
            instance.save()
        return instance