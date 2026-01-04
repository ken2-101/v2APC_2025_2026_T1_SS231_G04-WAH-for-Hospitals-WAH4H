from django.db import models
from admissions.models import Admission


class InventoryItem(models.Model):
    generic_name = models.CharField(max_length=100)
    brand_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    expiry_date = models.DateField()
    batch_number = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.generic_name} ({self.brand_name})"


class MedicationRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("denied", "Denied"),
        ("dispensed", "Dispensed"),
    ]

    admission = models.ForeignKey(
        Admission,
        on_delete=models.CASCADE,
        related_name="medication_requests"
    )

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE
    )

    quantity = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )
    notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class DispenseLog(models.Model):
    medication_request = models.OneToOneField(
        MedicationRequest,
        on_delete=models.CASCADE
    )
    dispensed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispensed {self.medication_request.inventory_item.generic_name}"
