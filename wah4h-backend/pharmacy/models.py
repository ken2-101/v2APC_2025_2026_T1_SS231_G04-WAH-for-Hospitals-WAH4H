from django.db import models
from monitoring.models import Admission
from django.utils import timezone

class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    batch_number = models.CharField(max_length=100)
    quantity = models.IntegerField()
    expiry_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.batch_number})"


class Prescription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partially-dispensed', 'Partially Dispensed'),
        ('completed', 'Completed'),
    ]
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='prescriptions')
    medication = models.CharField(max_length=255)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    quantity_ordered = models.IntegerField()
    quantity_dispensed = models.IntegerField(default=0)
    ordered_by = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medication} - {self.admission_id}"


class DispenseLog(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='dispenses')
    quantity = models.IntegerField()
    dispensed_by = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    dispensed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dispensed {self.quantity} - {self.prescription.medication}"


class MedicationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='medication_requests')
    medicine_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medicine_name} - {self.admission_id}"
