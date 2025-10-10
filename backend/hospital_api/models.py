from django.db import models

class Patient(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('Admitted', 'Admitted'),
        ('Discharged', 'Discharged'),
        ('Transferred', 'Transferred'),
    ]

    name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    civil_status = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    occupation = models.CharField(max_length=100, blank=True, null=True)
    room = models.CharField(max_length=50)
    department = models.CharField(max_length=100)
    admission_date = models.DateField()
    condition = models.CharField(max_length=255)
    physician = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    philhealth_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.status})"
