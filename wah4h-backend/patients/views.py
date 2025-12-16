from rest_framework import viewsets, filters
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-created_at')
    serializer_class = PatientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'patient_id', 'mobile_number', 'philhealth_id']
    ordering_fields = ['last_name', 'admission_date', 'status']
    ordering = ['-admission_date']
