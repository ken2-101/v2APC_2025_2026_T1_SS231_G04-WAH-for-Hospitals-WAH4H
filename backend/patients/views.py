from rest_framework import viewsets
from .models import Patient
from .serializers import PatientSerializer

class PatientViewSet(viewsets.ModelViewSet):
    """
    A simple ViewSet for viewing and editing patients.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
