from rest_framework import viewsets, filters
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'middle_name', 'patient_id', 'mobile_number', 'philhealth_id', 'email']
    ordering_fields = ['last_name', 'first_name', 'created_at']
    ordering = ['-created_at']
