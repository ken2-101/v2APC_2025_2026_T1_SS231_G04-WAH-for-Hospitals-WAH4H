from rest_framework import serializers
from .models import Admission
from patients.serializers import PatientSerializer

class AdmissionSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = Admission
        fields = '__all__'
