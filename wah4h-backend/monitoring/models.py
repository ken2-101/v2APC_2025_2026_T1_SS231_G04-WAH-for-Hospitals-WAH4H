# monitoring/models.py
from django.db import models

class Patient(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    room = models.CharField(max_length=50, blank=True, null=True)
    admitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class VitalSign(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="vitals")
    blood_pressure = models.CharField(max_length=20)  # "120/80"
    heart_rate = models.IntegerField()
    respiratory_rate = models.IntegerField()
    temperature = models.FloatField()
    oxygen_saturation = models.FloatField()
    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    staff_name = models.CharField(max_length=100)
    date_time = models.DateTimeField(auto_now_add=True)

class ClinicalNote(models.Model):
    NOTE_TYPE_CHOICES = [
        ("SOAP", "SOAP"),
        ("Progress", "Progress"),
        ("Rounds", "Rounds")
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="notes")
    type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES)
    content = models.TextField()
    staff_name = models.CharField(max_length=100)
    date_time = models.DateTimeField(auto_now_add=True)

class DietaryOrder(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="dietary_orders")
    meal_plan = models.CharField(max_length=255)
    activity_level = models.CharField(max_length=50, blank=True, null=True)
    npo = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

class HistoryEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ("Vitals", "Vitals"),
        ("Note", "Note"),
        ("Medication", "Medication"),
        ("Lab", "Lab"),
        ("Procedure", "Procedure"),
        ("Admission", "Admission")
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="history")
    type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    description = models.TextField()
    date_time = models.DateTimeField(auto_now_add=True)
