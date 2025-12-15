from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Add extra fields here if needed
    is_patient = models.BooleanField(default=False)
    is_staff_member = models.BooleanField(default=False)
    is_doctor = models.BooleanField(default=False)

    def __str__(self):
        return self.username
