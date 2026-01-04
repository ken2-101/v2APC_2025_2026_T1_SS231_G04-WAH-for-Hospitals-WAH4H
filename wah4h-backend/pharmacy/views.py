from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import InventoryItem, MedicationRequest, DispenseLog
from .serializers import (
    InventoryItemSerializer,
    MedicationRequestSerializer
)

# -------- Inventory List / Create --------
@api_view(["GET", "POST"])
def inventory_list(request):
    if request.method == "GET":
        items = InventoryItem.objects.all()
        serializer = InventoryItemSerializer(items, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------- Restock Inventory --------
@api_view(["POST"])
def restock_inventory(request, item_id):
    try:
        item = InventoryItem.objects.get(id=item_id)
    except InventoryItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

    quantity = request.data.get("quantity")
    try:
        quantity = int(quantity)
        if quantity <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return Response({"error": "Invalid quantity"}, status=status.HTTP_400_BAD_REQUEST)

    item.quantity += quantity
    item.save()

    return Response({
        "message": f"{item.generic_name} restocked successfully",
        "quantity": item.quantity
    })


# -------- Medication Requests --------
@api_view(["GET", "POST"])
def medication_requests(request):
    if request.method == "GET":
        admission_id = request.GET.get("admission")
        status_filter = request.GET.get("status")

        qs = MedicationRequest.objects.all()
        if admission_id:
            qs = qs.filter(admission_id=admission_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = MedicationRequestSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = MedicationRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------- Approve / Deny Request --------
@api_view(["POST"])
def update_request_status(request, request_id):
    try:
        med_request = MedicationRequest.objects.get(id=request_id)
    except MedicationRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    if new_status not in ["approved", "denied"]:
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

    med_request.status = new_status
    med_request.save()

    return Response({"message": f"Request {new_status} successfully"})


# -------- Dispense Medication --------
@api_view(["POST"])
def dispense_medication(request, request_id):
    try:
        med_request = MedicationRequest.objects.get(
            id=request_id,
            status="approved"
        )
    except MedicationRequest.DoesNotExist:
        return Response(
            {"error": "Approved request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if med_request.inventory_item.quantity < med_request.quantity:
        return Response(
            {"error": "Not enough stock"},
            status=status.HTTP_400_BAD_REQUEST
        )

    med_request.inventory_item.quantity -= med_request.quantity
    med_request.inventory_item.save()

    DispenseLog.objects.create(medication_request=med_request)

    med_request.status = "dispensed"
    med_request.save()

    return Response({
        "message": f"{med_request.inventory_item.generic_name} dispensed successfully"
    })
