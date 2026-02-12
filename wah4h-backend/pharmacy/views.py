from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Inventory, Medication, MedicationRequest, MedicationAdministration
from .serializers import (
    InventorySerializer, 
    MedicationSerializer, 
    MedicationRequestSerializer, 
    MedicationRequestSerializer, 
    MedicationAdministrationSerializer
)
from django_filters.rest_framework import DjangoFilterBackend

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer

class MedicationRequestViewSet(viewsets.ModelViewSet):
    queryset = MedicationRequest.objects.all()
    serializer_class = MedicationRequestSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'encounter_id']

    @action(detail=False, methods=['get'], url_path='by-encounter')
    def by_encounter(self, request):
        encounter_id = request.query_params.get('encounter_id')
        if not encounter_id:
            return Response({"error": "encounter_id parameter is required"}, status=400)
            
        requests = self.queryset.filter(encounter_id=encounter_id)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post', 'patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        medication_request = self.get_object()
        status = request.data.get('status')
        note = request.data.get('note')
        
        if not status:
            return Response({"error": "status is required"}, status=400)
            
        # Inventory Deduction Logic
        if status == 'completed' and medication_request.status != 'completed':
            try:
                dispense_qty = float(request.data.get('quantity') or medication_request.dispense_quantity or 0)
                
                # Find associated inventory item
                inventory_item = Inventory.objects.filter(item_code=medication_request.medication_code).first()
                if not inventory_item and medication_request.medication_display:
                    inventory_item = Inventory.objects.filter(item_name__iexact=medication_request.medication_display).first()
                
                if inventory_item:
                    if inventory_item.current_stock < dispense_qty:
                        return Response({"error": f"Insufficient stock. Available: {inventory_item.current_stock}"}, status=400)
                    
                    inventory_item.current_stock -= int(dispense_qty)
                    inventory_item.save()
                    
                    # Update dispense quantity in request record if provided
                    if request.data.get('quantity'):
                        medication_request.dispense_quantity = dispense_qty
                else:
                    print(f"Warning: No inventory item found for {medication_request.medication_display}")
            except Exception as e:
                print(f"Error updating inventory: {e}")
                return Response({"error": "Failed to update inventory"}, status=500)

        medication_request.status = status
        if note:
           medication_request.note = note
           
        medication_request.save()
        return Response(self.get_serializer(medication_request).data)

class MedicationAdministrationViewSet(viewsets.ModelViewSet):
    queryset = MedicationAdministration.objects.all()
    serializer_class = MedicationAdministrationSerializer