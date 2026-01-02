from rest_framework import viewsets, status
from rest_framework.response import Response
from django.utils import timezone
from .models import Prescription, DispenseLog, InventoryItem, MedicationRequest
from .serializers import PrescriptionSerializer, DispenseLogSerializer, InventoryItemSerializer, MedicationRequestSerializer
from monitoring.models import HistoryEvent

# Prescription
class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        admission_id = self.request.query_params.get("admission_id")
        if admission_id:
            qs = qs.filter(admission_id=admission_id)
        return qs.order_by('-created_at')


# Dispense
class DispenseViewSet(viewsets.ViewSet):
    def create(self, request):
        data = request.data
        try:
            prescription = Prescription.objects.get(id=data['prescription_id'])
            inventory_item = InventoryItem.objects.get(id=data['inventory_id'])
        except (Prescription.DoesNotExist, InventoryItem.DoesNotExist):
            return Response({"error": "Prescription or inventory not found"}, status=status.HTTP_404_NOT_FOUND)

        qty = int(data['quantityDispensed'])

        if prescription.quantity_dispensed + qty > prescription.quantity_ordered:
            return Response({"error": "Over-dispensing not allowed"}, status=status.HTTP_400_BAD_REQUEST)
        if qty > inventory_item.quantity:
            return Response({"error": "Not enough stock in batch"}, status=status.HTTP_400_BAD_REQUEST)
        if inventory_item.expiry_date < timezone.now().date():
            return Response({"error": "Cannot dispense expired batch"}, status=status.HTTP_400_BAD_REQUEST)

        DispenseLog.objects.create(
            prescription=prescription,
            quantity=qty,
            dispensed_by=data['pharmacistName'],
            notes=data.get('notes', '')
        )

        prescription.quantity_dispensed += qty
        prescription.status = 'completed' if prescription.quantity_dispensed >= prescription.quantity_ordered else 'partially-dispensed'
        prescription.save()

        inventory_item.quantity -= qty
        inventory_item.save()

        HistoryEvent.objects.create(
            admission=prescription.admission,
            category='Medication',
            description=f'{prescription.medication} dispensed',
            details=f'{qty} units from batch {inventory_item.batch_number} by {data["pharmacistName"]}'
        )

        return Response({"success": True})


# Inventory
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    def create(self, request, *args, **kwargs):
        item_id = request.data.get("id")
        name = request.data.get("name")
        batch = request.data.get("batchNumber") or request.data.get("batch_number")
        qty = int(request.data.get("quantity", 0))
        expiry = request.data.get("expiryDate") or request.data.get("expiry_date")

        if not all([name, batch, qty, expiry]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        if item_id:
            try:
                item = InventoryItem.objects.get(id=item_id)
                item.quantity += qty
                item.save()
            except InventoryItem.DoesNotExist:
                return Response({"error": "Inventory item not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            item = InventoryItem.objects.create(
                name=name,
                batch_number=batch,
                quantity=qty,
                expiry_date=expiry
            )

        serializer = InventoryItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Medication Requests
class MedicationRequestViewSet(viewsets.ViewSet):
    def list(self, request):
        admission_id = request.query_params.get("admission")
        if not admission_id:
            return Response({"error": "admission param required"}, status=status.HTTP_400_BAD_REQUEST)

        requests = MedicationRequest.objects.filter(admission_id=admission_id).order_by('-requested_at')
        serializer = MedicationRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def create(self, request):
        data = request.data
        admission_id = data.get("admission")
        medicine_name = data.get("medicine_name")
        quantity = int(data.get("quantity", 0))

        if not all([admission_id, medicine_name, quantity]):
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        inventory_item = InventoryItem.objects.filter(
            name=medicine_name,
            quantity__gte=quantity,
            expiry_date__gte=timezone.now().date()
        ).first()

        if not inventory_item:
            return Response({"error": "Insufficient stock or medicine not found"}, status=status.HTTP_400_BAD_REQUEST)

        inventory_item.quantity -= quantity
        inventory_item.save()

        med_request = MedicationRequest.objects.create(
            admission_id=admission_id,
            medicine_name=medicine_name,
            quantity=quantity,
            status='completed'
        )

        serializer = MedicationRequestSerializer(med_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
