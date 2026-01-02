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


# Dispense for Prescription or MedicationRequest
class DispenseViewSet(viewsets.ViewSet):
    """
    POST /api/pharmacy/dispense/
    {
        "request_id": 1,
        "dispensed_by": "John Doe",
        "notes": "Optional"
    }
    """
    def create(self, request):
        data = request.data
        request_id = data.get("request_id")
        dispensed_by = data.get("dispensed_by")
        notes = data.get("notes", "")

        if not all([request_id, dispensed_by]):
            return Response({"error": "request_id and dispensed_by required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            med_request = MedicationRequest.objects.get(id=request_id, status='pending')
        except MedicationRequest.DoesNotExist:
            return Response({"error": "Medication request not found or already completed"}, status=status.HTTP_404_NOT_FOUND)

        # Find inventory
        inventory_item = InventoryItem.objects.filter(
            name=med_request.medicine_name,
            quantity__gte=med_request.quantity,
            expiry_date__gte=timezone.now().date()
        ).first()

        if not inventory_item:
            return Response({"error": "Insufficient stock or medicine not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct stock
        inventory_item.quantity -= med_request.quantity
        inventory_item.save()

        # Update request status
        med_request.status = 'completed'
        med_request.save()

        # Log dispense
        DispenseLog.objects.create(
            request=med_request,
            quantity=med_request.quantity,
            dispensed_by=dispensed_by,
            notes=notes
        )

        # History
        HistoryEvent.objects.create(
            admission=med_request.admission,
            category='Medication',
            description=f'{med_request.medicine_name} dispensed',
            details=f'{med_request.quantity} units by {dispensed_by}'
        )

        return Response({"success": True})


# Inventory
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer


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

        med_request = MedicationRequest.objects.create(
            admission_id=admission_id,
            medicine_name=medicine_name,
            quantity=quantity,
            status='pending'
        )

        serializer = MedicationRequestSerializer(med_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
