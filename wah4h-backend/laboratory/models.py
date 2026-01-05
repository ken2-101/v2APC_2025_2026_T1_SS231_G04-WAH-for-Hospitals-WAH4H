from django.db import models
from django.utils import timezone
from admissions.models import Admission  # ✅ Changed from patients
from accounts.models import User


class LabRequest(models.Model):
    """
    Laboratory Request Model
    Tracks lab test requests from doctors for admitted patients
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In-Progress'),
        ('completed', 'Completed'),
    ]
    
    PRIORITY_CHOICES = [
        ('routine', 'Routine'),
        ('stat', 'STAT'),
    ]
    
    TEST_TYPE_CHOICES = [
        ('cbc', 'Complete Blood Count (CBC)'),
        ('urinalysis', 'Urinalysis'),
        ('fecalysis', 'Fecalysis'),
        ('xray', 'X-Ray'),
        ('ultrasound', 'Ultrasound'),
        ('ecg', 'ECG'),
        ('blood_chemistry', 'Blood Chemistry'),
    ]
    
    id = models.AutoField(primary_key=True)
    request_id = models.CharField(max_length=20, unique=True, editable=False)
    
    # ✅ Changed from patient to admission
    admission = models.ForeignKey(
        Admission, 
        on_delete=models.CASCADE, 
        related_name='lab_requests'
    )
    
    requesting_doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_lab_tests',
        limit_choices_to={'role': 'doctor'}
    )
    test_type = models.CharField(max_length=50, choices=TEST_TYPE_CHOICES)
    priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_CHOICES, 
        default='routine'
    )
    clinical_reason = models.TextField(
        blank=True,
        help_text="Clinical reason or diagnosis for the test"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lab Request'
        verbose_name_plural = 'Lab Requests'
    
    def save(self, *args, **kwargs):
        if not self.request_id:
            # Auto-generate request_id as LR-1001, LR-1002, etc.
            last_request = LabRequest.objects.order_by('-id').first()
            if last_request and last_request.request_id.startswith('LR-'):
                last_num = int(last_request.request_id.split('-')[1])
                next_num = last_num + 1
            else:
                next_num = 1001
            self.request_id = f"LR-{next_num}"
        super().save(*args, **kwargs)
    
    # ✅ Helper property to access patient through admission
    @property
    def patient(self):
        """Access patient through admission"""
        return self.admission.patient
    
    def __str__(self):
        return f"{self.request_id} - {self.admission.admission_id} - {self.get_test_type_display()}"


class LabResult(models.Model):
    """
    Laboratory Result Model
    Stores the encoded results for a lab request
    One-to-one relationship with LabRequest
    """
    
    id = models.AutoField(primary_key=True)
    lab_request = models.OneToOneField(
        LabRequest,
        on_delete=models.CASCADE,
        related_name='result'
    )
    medical_technologist = models.CharField(
        max_length=100,
        help_text="Name of the Medical Technologist"
    )
    prc_number = models.CharField(
        max_length=50,
        help_text="PRC License Number"
    )
    remarks = models.TextField(
        blank=True,
        help_text="Overall clinical interpretation or remarks"
    )
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='performed_lab_tests',
        limit_choices_to={'role': 'lab_technician'}
    )
    finalized_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lab Result'
        verbose_name_plural = 'Lab Results'
    
    def __str__(self):
        return f"Result for {self.lab_request.request_id}"


class TestParameter(models.Model):
    """
    Test Parameter Model
    Stores individual test parameters/results for a lab result
    Multiple parameters can exist for one lab result
    """
    
    INTERPRETATION_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('low', 'Low'),
    ]
    
    id = models.AutoField(primary_key=True)
    lab_result = models.ForeignKey(
        LabResult,
        on_delete=models.CASCADE,
        related_name='parameters'
    )
    parameter_name = models.CharField(
        max_length=100,
        help_text="e.g., Hemoglobin, WBC, RBC"
    )
    result_value = models.CharField(
        max_length=50,
        help_text="The actual result value"
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g., g/dL, cells/μL"
    )
    reference_range = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g., 12-16 for Min-Max"
    )
    interpretation = models.CharField(
        max_length=20,
        choices=INTERPRETATION_CHOICES,
        blank=True
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    
    class Meta:
        ordering = ['id']
        verbose_name = 'Test Parameter'
        verbose_name_plural = 'Test Parameters'
    
    def __str__(self):
        return f"{self.parameter_name}: {self.result_value} {self.unit}"