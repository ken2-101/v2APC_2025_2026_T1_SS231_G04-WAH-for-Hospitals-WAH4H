from django.db import models
from django.utils import timezone
from patients.models import Patient
from admissions.models import Admission


class DischargeRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ready', 'Ready'),
        ('discharged', 'Discharged'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='discharge_records')
    admission = models.ForeignKey(Admission, on_delete=models.CASCADE, related_name='discharge_records', null=True, blank=True)
    
    # Basic Info
    patient_name = models.CharField(max_length=255)
    room = models.CharField(max_length=50)
    admission_date = models.DateField()
    condition = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    physician = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    age = models.IntegerField()
    estimated_discharge = models.DateField(null=True, blank=True)
    
    # Discharge Requirements
    final_diagnosis = models.BooleanField(default=False)
    physician_signature = models.BooleanField(default=False)
    medication_reconciliation = models.BooleanField(default=False)
    discharge_summary = models.BooleanField(default=False)
    billing_clearance = models.BooleanField(default=False)
    nursing_notes = models.BooleanField(default=False)
    follow_up_scheduled = models.BooleanField(default=False)
    
    # Discharge Details (populated when status becomes 'discharged')
    discharge_date = models.DateTimeField(null=True, blank=True)
    final_diagnosis_text = models.TextField(blank=True)
    discharge_summary_text = models.TextField(blank=True)
    follow_up_required = models.BooleanField(default=False)
    follow_up_plan = models.TextField(blank=True)
    
    # Discharge Form Fields
    hospital_stay_summary = models.TextField(blank=True)
    discharge_medications = models.TextField(blank=True)
    discharge_instructions = models.TextField(blank=True)
    billing_status = models.CharField(max_length=100, blank=True)
    pending_items = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.patient_name} - {self.status}"
