from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import InventoryItem, MedicationRequest, DispenseLog
from .serializers import (
    InventoryItemSerializer,
    MedicationRequestSerializer,
    DispenseLogSerializer
)


# ================== INVENTORY MANAGEMENT ==================

@api_view(["GET", "POST"])
def inventory_list(request):
    """
    GET: List all inventory items with optional filtering
    POST: Create a new inventory item
    """
    if request.method == "GET":
        items = InventoryItem.objects.all()
        
        # Apply filters
        search = request.GET.get("search")
        if search:
            items = items.filter(
                Q(generic_name__icontains=search) |
                Q(brand_name__icontains=search) |
                Q(batch_number__icontains=search)
            )
        
        show_inactive = request.GET.get("show_inactive", "false").lower() == "true"
        if not show_inactive:
            items = items.filter(is_active=True)
        
        show_expired = request.GET.get("show_expired", "false").lower() == "true"
        if not show_expired:
            from django.utils import timezone
            items = items.filter(expiry_date__gte=timezone.now().date())
        
        serializer = InventoryItemSerializer(items, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
def inventory_detail(request, item_id):
    """
    GET: Retrieve a specific inventory item
    PUT: Update an inventory item
    DELETE: Delete an inventory item (if no active requests)
    """
    try:
        item = InventoryItem.objects.get(id=item_id)
    except InventoryItem.DoesNotExist:
        return Response(
            {"error": "Inventory item not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = InventoryItemSerializer(item)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = InventoryItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Check if there are any pending or approved medication requests
        active_requests = MedicationRequest.objects.filter(
            inventory_item=item,
            status__in=["pending", "approved"]
        )
        
        if active_requests.exists():
            return Response(
                {
                    "error": "Cannot delete item with active medication requests",
                    "active_requests_count": active_requests.count()
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Soft delete by marking as inactive
        item.is_active = False
        item.save()
        
        return Response(
            {"message": "Inventory item deactivated successfully"},
            status=status.HTTP_200_OK
        )


# -------- Restock Inventory --------
@api_view(["POST"])
def restock_inventory(request, item_id):
    """Add quantity to an existing inventory item."""
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
        return Response(
            {"error": "Invalid quantity"},
            status=status.HTTP_400_BAD_REQUEST
        )

    item.quantity += quantity
    item.save()

    serializer = InventoryItemSerializer(item)
    return Response({
        "message": f"{item.generic_name} restocked successfully",
        "item": serializer.data
    })


# ================== MEDICATION REQUESTS ==================

@api_view(["GET", "POST"])
def medication_requests(request):
    """
    GET: List medication requests with optional filtering
    POST: Create a new medication request
    """
    if request.method == "GET":
        admission_id = request.GET.get("admission")
        status_filter = request.GET.get("status")

        qs = MedicationRequest.objects.select_related(
            'inventory_item',
            'admission',
            'admission__patient'
        )
        
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


@api_view(["POST"])
def update_request_status(request, request_id):
    """Approve or deny a medication request."""
    try:
        med_request = MedicationRequest.objects.get(id=request_id)
    except MedicationRequest.DoesNotExist:
        return Response(
            {"error": "Request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get("status")
    if new_status not in ["approved", "denied"]:
        return Response(
            {"error": "Invalid status. Must be 'approved' or 'denied'"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if inventory is still available for approval
    if new_status == "approved":
        if med_request.inventory_item.quantity < med_request.quantity:
            return Response(
                {"error": "Insufficient stock available"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if med_request.inventory_item.is_expired:
            return Response(
                {"error": "Cannot approve expired medication"},
                status=status.HTTP_400_BAD_REQUEST
            )

    med_request.status = new_status
    med_request.approved_by = request.data.get("approved_by", "")
    med_request.save()

    serializer = MedicationRequestSerializer(med_request)
    return Response({
        "message": f"Request {new_status} successfully",
        "request": serializer.data
    })


@api_view(["POST"])
def dispense_medication(request, request_id):
    """Dispense an approved medication request."""
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

    # Verify sufficient stock
    if med_request.inventory_item.quantity < med_request.quantity:
        return Response(
            {
                "error": "Not enough stock",
                "available": med_request.inventory_item.quantity,
                "requested": med_request.quantity
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify not expired
    if med_request.inventory_item.is_expired:
        return Response(
            {"error": "Cannot dispense expired medication"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Deduct inventory
    med_request.inventory_item.quantity -= med_request.quantity
    med_request.inventory_item.save()

    # Create dispense log
    dispense_log = DispenseLog.objects.create(
        medication_request=med_request,
        dispensed_by=request.data.get("dispensed_by", ""),
        notes=request.data.get("notes", "")
    )

    # Update request status
    med_request.status = "dispensed"
    med_request.save()

    return Response({
        "message": f"{med_request.inventory_item.generic_name} dispensed successfully",
        "dispense_log": DispenseLogSerializer(dispense_log).data
    })
