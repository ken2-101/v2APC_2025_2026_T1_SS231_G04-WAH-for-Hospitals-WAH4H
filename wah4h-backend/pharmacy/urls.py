from django.urls import path
from . import views

urlpatterns = [
    path("inventory/", views.inventory_list, name="inventory-list"),
    path(
        "inventory/<int:item_id>/restock/",
        views.restock_inventory,
        name="restock-inventory"
    ),
    path(
        "medication-requests/",
        views.medication_requests,
        name="medication-requests"
    ),
    path(
        "medication-requests/<int:request_id>/update-status/",
        views.update_request_status,
        name="update-request-status"
    ),
    path(
        "medication-requests/<int:request_id>/dispense/",
        views.dispense_medication,
        name="dispense-medication"
    ),
]
