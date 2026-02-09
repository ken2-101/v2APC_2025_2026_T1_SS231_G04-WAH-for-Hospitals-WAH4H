from rest_framework import viewsets
from .models import Inventory, Medication, MedicationRequest, MedicationAdministration
from .serializers import (
    InventorySerializer, 
    MedicationSerializer, 
    MedicationRequestSerializer, 
    MedicationAdministrationSerializer
)

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer

class MedicationRequestViewSet(viewsets.ModelViewSet):
    queryset = MedicationRequest.objects.all()
    serializer_class = MedicationRequestSerializer

class MedicationAdministrationViewSet(viewsets.ModelViewSet):
    queryset = MedicationAdministration.objects.all()
    serializer_class = MedicationAdministrationSerializer