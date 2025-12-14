from django.db import models
from patients.models import Patient

class Admission(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Discharged', 'Discharged'),
        ('Transferred', 'Transferred'),
    ]

    CATEGORY_CHOICES = [
        ('Emergency', 'Emergency'),
        ('Regular', 'Regular'),
    ]

    ARRIVAL_MODE_CHOICES = [
        ('Walk-in', 'Walk-in'),
        ('Ambulance', 'Ambulance'),
        ('Referral', 'Referral'),
    ]

    id = models.CharField(max_length=50, primary_key=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='admissions')
    admission_date = models.DateTimeField()
    attending_physician = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    room = models.CharField(max_length=50)
    bed = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    encounter_type = models.CharField(max_length=50, default='Inpatient')
    admitting_diagnosis = models.CharField(max_length=255)
    reason_for_admission = models.TextField()
    admission_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    mode_of_arrival = models.CharField(max_length=20, choices=ARRIVAL_MODE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.full_name} - {self.admission_date}"
