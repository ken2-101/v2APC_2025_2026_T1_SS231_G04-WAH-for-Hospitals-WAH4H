from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)

    # Define roles
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("doctor", "Doctor"),
        ("nurse", "Nurse"),
        ("lab_technician", "Lab Technician"),
        ("pharmacist", "Pharmacist"),
        ("billing_clerk", "Billing Clerk"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="admin")

    groups = models.ManyToManyField(
        Group,
        related_name="accounts_users",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name="accounts_users_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
