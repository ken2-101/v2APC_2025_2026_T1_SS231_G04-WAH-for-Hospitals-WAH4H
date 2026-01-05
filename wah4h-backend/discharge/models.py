from django.db import models
from patients.models import Patient
from admissions.models import Admission


class DischargeRequirements(models.Model):
    """
    Tracks the completion status of discharge checklist items.
    Based on frontend PendingItemsSection interface.
    """
    admission = models.OneToOneField(
        Admission,
        on_delete=models.CASCADE,
        related_name="discharge_requirements"
    )
    
    # Required checklist items
    final_diagnosis = models.BooleanField(default=False)
    physician_signature = models.BooleanField(default=False)
    medication_reconciliation = models.BooleanField(default=False)
    discharge_summary = models.BooleanField(default=False)
    billing_clearance = models.BooleanField(default=False)
    
    # Optional checklist items
    nursing_notes = models.BooleanField(default=False)
    follow_up_scheduled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Requirements for {self.admission.admission_id}"
    
    def is_ready_for_discharge(self):
        """Check if all required items are completed"""
        return all([
            self.final_diagnosis,
            self.physician_signature,
            self.medication_reconciliation,
            self.discharge_summary,
            self.billing_clearance
        ])
    
    class Meta:
        verbose_name = "Discharge Requirements"
        verbose_name_plural = "Discharge Requirements"


class DischargeRecord(models.Model):
    """
    Stores discharge information for patients.
    Based on frontend DischargedPatient interface.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Clearance'),
        ('ready', 'Ready for Discharge'),
        ('discharged', 'Discharged'),
    ]
    
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="discharge_records"
    )
    admission = models.OneToOneField(
        Admission,
        on_delete=models.CASCADE,
        related_name="discharge_record"
    )
    
    # From frontend DischargedPatient interface
    patient_name = models.CharField(max_length=200)
    room = models.CharField(max_length=20)
    admission_date = models.DateField()
    discharge_date = models.DateField(null=True, blank=True)
    condition = models.CharField(max_length=100)
    physician = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    age = models.IntegerField()
    final_diagnosis = models.TextField()
    discharge_summary = models.TextField()
    follow_up_required = models.BooleanField(default=False)
    follow_up_plan = models.TextField(blank=True, null=True)
    
    # Discharge status from DischargeStatusBadge
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Discharge - {self.patient_name} ({self.admission.admission_id})"
    
    class Meta:
        verbose_name = "Discharge Record"
        verbose_name_plural = "Discharge Records"
        ordering = ['-discharge_date', '-created_at']
