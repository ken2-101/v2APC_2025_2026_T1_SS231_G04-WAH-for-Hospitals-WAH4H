from django.db import models
from admissions.models import Admission

class VitalSign(models.Model):
    admission = models.ForeignKey(
        Admission,
        on_delete=models.CASCADE,
        related_name="vitals"
    )

    date_time = models.DateTimeField()
    blood_pressure = models.CharField(max_length=20)
    heart_rate = models.IntegerField()
    respiratory_rate = models.IntegerField()
    temperature = models.FloatField()
    oxygen_saturation = models.IntegerField()
    staff_name = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Vitals @ {self.date_time} ({self.admission.admission_id})"


class ClinicalNote(models.Model):
    NOTE_TYPES = [
        ("Progress", "Progress"),
        ("SOAP", "SOAP"),
    ]

    admission = models.ForeignKey(
        Admission,
        on_delete=models.CASCADE,
        related_name="notes"
    )

    date_time = models.DateTimeField()
    type = models.CharField(max_length=20, choices=NOTE_TYPES)
    subjective = models.TextField(blank=True)
    objective = models.TextField(blank=True)
    assessment = models.TextField()
    plan = models.TextField(blank=True)
    provider_name = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)


class DietaryOrder(models.Model):
    admission = models.OneToOneField(
        Admission,
        on_delete=models.CASCADE,
        related_name="dietary_order"
    )

    diet_type = models.CharField(max_length=50)
    allergies = models.JSONField(default=list, blank=True)
    npo_response = models.BooleanField(default=False)
    activity_level = models.CharField(max_length=50)
    ordered_by = models.CharField(max_length=100)
    last_updated = models.DateTimeField(auto_now=True)


class HistoryEvent(models.Model):
    CATEGORY_CHOICES = [
        ("Admission", "Admission"),
        ("Vitals", "Vitals"),
        ("Note", "Note"),
        ("Procedure", "Procedure"),
    ]

    admission = models.ForeignKey(
        Admission,
        on_delete=models.CASCADE,
        related_name="history"
    )

    date_time = models.DateTimeField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=255)
    details = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
