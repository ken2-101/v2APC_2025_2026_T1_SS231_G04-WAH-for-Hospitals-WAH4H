from rest_framework import serializers
from .models import LabRequest, LabResult, TestParameter
from admissions.models import Admission
from accounts.models import User


class TestParameterSerializer(serializers.ModelSerializer):
    """
    Serializer for Test Parameters
    Used for encoding individual test results
    """
    
    class Meta:
        model = TestParameter
        fields = [
            'id',
            'parameter_name',
            'result_value',
            'unit',
            'reference_range',
            'interpretation',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LabResultSerializer(serializers.ModelSerializer):
    """
    Serializer for Lab Results
    Includes nested test parameters
    """
    
    parameters = TestParameterSerializer(many=True, read_only=True)
    request_id = serializers.CharField(source='lab_request.request_id', read_only=True)
    patient_name = serializers.SerializerMethodField()
    admission_id = serializers.CharField(source='lab_request.admission.admission_id', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    test_type = serializers.CharField(source='lab_request.get_test_type_display', read_only=True)
    
    class Meta:
        model = LabResult
        fields = [
            'id',
            'request_id',
            'lab_request',
            'admission_id',
            'patient_name',
            'doctor_name',
            'test_type',
            'medical_technologist',
            'prc_number',
            'remarks',
            'performed_by',
            'parameters',
            'finalized_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        patient = obj.lab_request.admission.patient
        return f"{patient.first_name} {patient.last_name}"
    
    def get_doctor_name(self, obj):
        doctor = obj.lab_request.requesting_doctor
        if doctor:
            return f"{doctor.first_name} {doctor.last_name}"
        return None


class LabRequestListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing lab requests
    Used in the main dashboard view
    """
    
    admission_id = serializers.CharField(source='admission.admission_id', read_only=True)
    patient_id = serializers.CharField(source='admission.patient.patient_id', read_only=True)
    patient_name = serializers.SerializerMethodField()
    ward_room_bed = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    test_type_display = serializers.CharField(source='get_test_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_result = serializers.SerializerMethodField()
    
    class Meta:
        model = LabRequest
        fields = [
            'id',
            'request_id',
            'admission_id',
            'patient_id',
            'patient_name',
            'ward_room_bed',
            'doctor_name',
            'test_type',
            'test_type_display',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'clinical_reason',
            'has_result',
            'created_at',
            'updated_at'
        ]
    
    def get_patient_name(self, obj):
        patient = obj.admission.patient
        return f"{patient.first_name} {patient.last_name}"
    
    def get_ward_room_bed(self, obj):
        return f"{obj.admission.ward} - {obj.admission.room} - {obj.admission.bed}"
    
    def get_doctor_name(self, obj):
        if obj.requesting_doctor:
            return f"Dr. {obj.requesting_doctor.first_name} {obj.requesting_doctor.last_name}"
        return None
    
    def get_has_result(self, obj):
        return hasattr(obj, 'result')


class LabRequestDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for individual lab request
    Includes full admission, patient and doctor info, and results if available
    """
    
    admission_id = serializers.CharField(source='admission.admission_id', read_only=True)
    patient_id = serializers.CharField(source='admission.patient.patient_id', read_only=True)
    patient_name = serializers.SerializerMethodField()
    patient_details = serializers.SerializerMethodField()
    admission_details = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    test_type_display = serializers.CharField(source='get_test_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    result = LabResultSerializer(read_only=True)
    
    class Meta:
        model = LabRequest
        fields = [
            'id',
            'request_id',
            'admission',
            'admission_id',
            'admission_details',
            'patient_id',
            'patient_name',
            'patient_details',
            'requesting_doctor',
            'doctor_name',
            'test_type',
            'test_type_display',
            'priority',
            'priority_display',
            'clinical_reason',
            'status',
            'status_display',
            'result',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'request_id', 'created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        patient = obj.admission.patient
        return f"{patient.first_name} {patient.last_name}"
    
    def get_patient_details(self, obj):
        patient = obj.admission.patient
        return {
            'patient_id': patient.patient_id,
            'full_name': f"{patient.first_name} {patient.last_name}",
            'date_of_birth': patient.date_of_birth,
            'sex': patient.sex,
            'mobile_number': patient.mobile_number
        }
    
    def get_admission_details(self, obj):
        admission = obj.admission
        return {
            'admission_id': admission.admission_id,
            'admission_date': admission.admission_date,
            'ward': admission.ward,
            'room': admission.room,
            'bed': admission.bed,
            'attending_physician': admission.attending_physician,
            'admitting_diagnosis': admission.admitting_diagnosis,
            'status': admission.status
        }
    
    def get_doctor_name(self, obj):
        if obj.requesting_doctor:
            return f"Dr. {obj.requesting_doctor.first_name} {obj.requesting_doctor.last_name}"
        return None


class LabRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new lab requests
    Validates admission and doctor existence
    """
    
    class Meta:
        model = LabRequest
        fields = [
            'admission',
            'requesting_doctor',
            'test_type',
            'priority',
            'clinical_reason'
        ]
    
    def validate_admission(self, value):
        """Ensure admission exists and is active"""
        if not Admission.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Admission does not exist")
        
        if value.status != 'Active':
            raise serializers.ValidationError("Lab requests can only be created for active admissions")
        
        return value
    
    def validate_requesting_doctor(self, value):
        """Ensure doctor exists and has correct role"""
        if not User.objects.filter(id=value.id, role='doctor').exists():
            raise serializers.ValidationError("User is not a doctor")
        return value


class LabRequestUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating lab request status
    """
    
    class Meta:
        model = LabRequest
        fields = ['status']
    
    def validate_status(self, value):
        """Ensure valid status transitions"""
        instance = self.instance
        if instance:
            current_status = instance.status
            # Define valid transitions
            valid_transitions = {
                'pending': ['in_progress'],
                'in_progress': ['completed'],
                'completed': []  # Cannot transition from completed
            }
            
            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Cannot transition from {current_status} to {value}"
                )
        return value


class LabResultCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/encoding lab results
    """
    
    parameters = TestParameterSerializer(many=True, required=False)
    
    class Meta:
        model = LabResult
        fields = [
            'lab_request',
            'medical_technologist',
            'prc_number',
            'remarks',
            'performed_by',
            'parameters'
        ]
    
    def validate_lab_request(self, value):
        """Ensure lab request exists and doesn't already have a result"""
        if not LabRequest.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Lab request does not exist")
        
        if hasattr(value, 'result'):
            raise serializers.ValidationError("This lab request already has a result")
        
        return value
    
    def create(self, validated_data):
        parameters_data = validated_data.pop('parameters', [])
        lab_result = LabResult.objects.create(**validated_data)
        
        # Create test parameters
        for param_data in parameters_data:
            TestParameter.objects.create(lab_result=lab_result, **param_data)
        
        # Update lab request status to completed
        lab_result.lab_request.status = 'completed'
        lab_result.lab_request.save()
        
        return lab_result


class AddParameterSerializer(serializers.Serializer):
    """
    Serializer for adding individual test parameters to existing results
    """
    
    parameter_name = serializers.CharField(max_length=100)
    result_value = serializers.CharField(max_length=50)
    unit = serializers.CharField(max_length=50, required=False, allow_blank=True)
    reference_range = serializers.CharField(max_length=100, required=False, allow_blank=True)
    interpretation = serializers.ChoiceField(
        choices=TestParameter.INTERPRETATION_CHOICES,
        required=False,
        allow_blank=True
    )