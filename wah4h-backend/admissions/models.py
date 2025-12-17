from django.db import models
from patients.models import Patient  # Assuming Patient model exists

class Admission(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Discharged", "Discharged"),
        ("Transferred", "Transferred"),
    ]
    CATEGORY_CHOICES = [
        ("Regular", "Regular"),
        ("Emergency", "Emergency"),
    ]
    MODE_CHOICES = [
        ("Walk-in", "Walk-in"),
        ("Ambulance", "Ambulance"),
        ("Referral", "Referral"),
    ]

    admission_id = models.CharField(max_length=20, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="admissions")
    admission_date = models.DateTimeField()
    encounter_type = models.CharField(max_length=50, default="Inpatient")
    admitting_diagnosis = models.CharField(max_length=255)
    reason_for_admission = models.TextField()
    ward = models.CharField(max_length=50)
    room = models.CharField(max_length=20)
    bed = models.CharField(max_length=10)
    attending_physician = models.CharField(max_length=100)
    assigned_nurse = models.CharField(max_length=100, blank=True)
    admission_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="Regular")
    mode_of_arrival = models.CharField(max_length=20, choices=MODE_CHOICES, default="Walk-in")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.admission_id} - {self.patient}"
