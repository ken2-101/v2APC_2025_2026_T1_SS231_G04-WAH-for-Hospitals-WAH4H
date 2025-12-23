from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class LabTestType(models.Model):
    """
    Catalog options: CBC, Urinalysis, X-Ray, etc.
    """
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class LabRequest(models.Model):
    """
    Matches 'New Laboratory Request' Modal
    """
    class Priority(models.TextChoices):
        ROUTINE = 'ROUTINE', _('Routine')
        STAT = 'STAT', _('STAT (Emergency)')

    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        IN_PROGRESS = 'IN_PROGRESS', _('In-Progress')
        COMPLETED = 'COMPLETED', _('Completed')

    # Fields matching your 'New Lab Request' Modal
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='lab_requests')
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='requested_labs'
    )
    test_type = models.ForeignKey(LabTestType, on_delete=models.PROTECT)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.ROUTINE)
    clinical_diagnosis = models.TextField(
        blank=True, 
        help_text="Clinical Reason / Diagnosis (e.g. Fever for 3 days)"
    )
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.test_type.code} - {self.patient}"

class LabResult(models.Model):
    """
    Matches 'Encode Lab Results' Modal
    """
    lab_request = models.OneToOneField(LabRequest, on_delete=models.CASCADE, related_name='result')
    
    # Technician Details
    medtech_name = models.CharField(max_length=255, help_text="Name of MedTech")
    prc_license_number = models.CharField(max_length=100, help_text="PRC Number")
    
    # Structured Data: Stores the list of rows (Parameter, Result, Unit, Ref Range)
    # Example: [{"parameter": "Hemoglobin", "result": "14", "unit": "g/dL", ...}]
    result_data = models.JSONField(default=list) 
    
    remarks = models.TextField(blank=True, help_text="Overall clinical interpretation")
    verified_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for {self.lab_request}"