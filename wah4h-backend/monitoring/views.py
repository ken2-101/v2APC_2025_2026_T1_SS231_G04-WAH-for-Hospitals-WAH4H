# monitoring/views.py
from rest_framework import viewsets
from .models import Patient, VitalSign, ClinicalNote, DietaryOrder, HistoryEvent
from .serializers import (
    PatientSerializer, VitalSignSerializer, ClinicalNoteSerializer, DietaryOrderSerializer, HistoryEventSerializer
)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

class VitalSignViewSet(viewsets.ModelViewSet):
    queryset = VitalSign.objects.all()
    serializer_class = VitalSignSerializer

class ClinicalNoteViewSet(viewsets.ModelViewSet):
    queryset = ClinicalNote.objects.all()
    serializer_class = ClinicalNoteSerializer

class DietaryOrderViewSet(viewsets.ModelViewSet):
    queryset = DietaryOrder.objects.all()
    serializer_class = DietaryOrderSerializer

class HistoryEventViewSet(viewsets.ModelViewSet):
    queryset = HistoryEvent.objects.all()
    serializer_class = HistoryEventSerializer
