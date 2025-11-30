from django.db import models

class Patient(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
    ]

    CIVIL_STATUS_CHOICES = [
        ('Single', 'Single'),
        ('Married', 'Married'),
        ('Divorced', 'Divorced'),
        ('Widowed', 'Widowed'),
        ('Separated', 'Separated'),
    ]

    # IDs
    id = models.CharField(max_length=20, primary_key=True) # Facility Patient ID
    philhealth_id = models.CharField(max_length=20, unique=True)
    
    # Name
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    suffix = models.CharField(max_length=10, blank=True, null=True)
    
    # Personal Info
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    date_of_birth = models.DateField()
    civil_status = models.CharField(max_length=20, choices=CIVIL_STATUS_CHOICES)
    nationality = models.CharField(max_length=50, default='Filipino')
    
    # Contact Details
    mobile_number = models.CharField(max_length=20)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    # Address (PSGC)
    region = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    city_municipality = models.CharField(max_length=100)
    barangay = models.CharField(max_length=100)
    house_no_street = models.CharField(max_length=255, blank=True, null=True)
    
    # Optional IDs
    national_id = models.CharField(max_length=50, blank=True, null=True)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    drivers_license = models.CharField(max_length=50, blank=True, null=True)
    senior_citizen_id = models.CharField(max_length=50, blank=True, null=True)
    pwd_id = models.CharField(max_length=50, blank=True, null=True)

    # Hospital Info
    occupation = models.CharField(max_length=100, blank=True, null=True)
    room = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    admission_date = models.DateField(auto_now_add=True)
    condition = models.CharField(max_length=100, blank=True, null=True)
    physician = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')

