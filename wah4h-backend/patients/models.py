from django.db import models
from django.utils import timezone

class Patient(models.Model):
    id = models.AutoField(primary_key=True)
    patient_id = models.CharField(max_length=10, unique=True, editable=False)

    philhealth_id = models.CharField(max_length=20, blank=True)
    national_id = models.CharField(max_length=20, blank=True)
    last_name = models.CharField(max_length=50)
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    suffix = models.CharField(max_length=10, blank=True)
    sex = models.CharField(max_length=1, choices=[('M','Male'),('F','Female')], default='M')
    date_of_birth = models.DateField(null=True, blank=True)
    civil_status = models.CharField(max_length=20, blank=True)
    nationality = models.CharField(max_length=50, blank=True)
    mobile_number = models.CharField(max_length=15, blank=True)
    telephone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    region = models.CharField(max_length=50, blank=True)
    province = models.CharField(max_length=50, blank=True)
    city_municipality = models.CharField(max_length=50, blank=True)
    barangay = models.CharField(max_length=50, blank=True)
    house_no_street = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, default='Active')
    occupation = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.patient_id:
            last_patient = Patient.objects.order_by('-id').first()
            if last_patient and last_patient.patient_id.startswith('P'):
                last_num = int(last_patient.patient_id[1:])
                next_num = last_num + 1
            else:
                next_num = 1
            self.patient_id = f"P{str(next_num).zfill(4)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient_id} - {self.last_name}, {self.first_name}"
