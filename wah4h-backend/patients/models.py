from django.db import models

class Patient(models.Model):
    # Identification
    patient_id = models.CharField(max_length=20, unique=True)  # Facility Patient ID
    philhealth_id = models.CharField(max_length=20, blank=True, null=True)
    national_id = models.CharField(max_length=20, blank=True, null=True)

    # Personal Info
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=20, blank=True, null=True)
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    date_of_birth = models.DateField()
    civil_status = models.CharField(max_length=20)
    nationality = models.CharField(max_length=50)

    # Contact Info
    mobile_number = models.CharField(max_length=20)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    # Address (PSGC)
    house_no_street = models.CharField(max_length=255, blank=True, null=True)
    barangay = models.CharField(max_length=100)
    city_municipality = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    region = models.CharField(max_length=100)

    # Hospital / Admission Info
    status = models.CharField(max_length=10, choices=[('Active', 'Active'), ('Inactive', 'Inactive')])
    admission_date = models.DateField(blank=True, null=True)
    department = models.CharField(max_length=50, blank=True, null=True)
    room = models.CharField(max_length=50, blank=True, null=True)
    physician = models.CharField(max_length=100, blank=True, null=True)
    condition = models.CharField(max_length=255, blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.patient_id})"
