from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from admissions.models import Admission


class InventoryItem(models.Model):
    """
    Represents a pharmaceutical product in the hospital inventory.
    Follows best practices for medication tracking and regulatory compliance.
    """
    generic_name = models.CharField(max_length=100, db_index=True)
    brand_name = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    minimum_stock_level = models.PositiveIntegerField(
        default=10,
        help_text="Alert when stock falls below this level"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Price per unit for billing"
    )
    expiry_date = models.DateField()
    batch_number = models.CharField(max_length=50, db_index=True)
    manufacturer = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive items are not available for dispensing"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['generic_name', 'batch_number']),
            models.Index(fields=['expiry_date']),
        ]

    def __str__(self):
        return f"{self.generic_name} ({self.brand_name or 'Generic'}) - Batch: {self.batch_number}"

    def clean(self):
        """Validate the inventory item before saving."""
        if self.expiry_date and self.expiry_date < timezone.now().date():
            raise ValidationError({
                'expiry_date': 'Expiry date cannot be in the past'
            })
        
        if self.quantity < 0:
            raise ValidationError({
                'quantity': 'Quantity cannot be negative'
            })
        
        if self.unit_price < 0:
            raise ValidationError({
                'unit_price': 'Unit price cannot be negative'
            })

    @property
    def is_expired(self):
        """Check if the item has expired."""
        return self.expiry_date < timezone.now().date()

    @property
    def is_expiring_soon(self):
        """Check if item expires within 30 days."""
        return self.expiry_date <= timezone.now().date() + timedelta(days=30)

    @property
    def is_low_stock(self):
        """Check if item is below minimum stock level."""
        return self.quantity <= self.minimum_stock_level

    @property
    def is_out_of_stock(self):
        """Check if item is out of stock."""
        return self.quantity == 0

class MedicationRequest(models.Model):
    """
    Represents a request for medication from a healthcare provider.
    Tracks the approval and dispensing workflow.
    """
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
        on_delete=models.CASCADE,
        related_name="medication_requests"
    )

    quantity = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True
    )
    notes = models.TextField(blank=True)
    requested_by = models.CharField(
        max_length=100,
        blank=True,
        help_text="Healthcare provider who requested the medication"
    )
    approved_by = models.CharField(
        max_length=100,
        blank=True,
        help_text="Pharmacist who approved/denied the request"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status', '-requested_at']),
        ]

    def __str__(self):
        return f"Request #{self.id} - {self.inventory_item.generic_name} x{self.quantity}"

    def clean(self):
        """Validate the medication request."""
        if self.quantity <= 0:
            raise ValidationError({
                'quantity': 'Quantity must be greater than zero'
            })


class DispenseLog(models.Model):
    """
    Audit log for dispensed medications.
    Maintains a permanent record for regulatory compliance.
    """
    medication_request = models.OneToOneField(
        MedicationRequest,
        on_delete=models.CASCADE
    )
    dispensed_by = models.CharField(
        max_length=100,
        blank=True,
        help_text="Pharmacist who dispensed the medication"
    )
    dispensed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-dispensed_at']

    def __str__(self):
        return f"Dispensed {self.medication_request.inventory_item.generic_name} on {self.dispensed_at}"
