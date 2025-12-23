from rest_framework import serializers
from .models import LabTestType, LabRequest, LabResult

class LabTestTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestType
        fields = ['id', 'name', 'code', 'price']

class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = ['id', 'medtech_name', 'prc_license_number', 'result_data', 'remarks', 'verified_at']

class LabRequestSerializer(serializers.ModelSerializer):
    # Flatten fields for the table display (Patient Name, Doctor Name, etc.)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_id_display = serializers.CharField(source='patient.custom_id', read_only=True) # e.g. P-2024-001
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    test_name = serializers.CharField(source='test_type.name', read_only=True)
    test_code = serializers.CharField(source='test_type.code', read_only=True)
    
    # Nested result to show completed data
    result = LabResultSerializer(read_only=True)

    class Meta:
        model = LabRequest
        fields = [
            'id', 'patient', 'patient_name', 'patient_id_display', 
            'doctor', 'doctor_name', 
            'test_type', 'test_name', 'test_code',
            'priority', 'clinical_diagnosis', 
            'status', 'requested_at', 'result'
        ]