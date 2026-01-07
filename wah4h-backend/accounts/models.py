from django.contrib.auth.models import AbstractUser, BaseUserManager, Group, Permission
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None  # REMOVE username
    email = models.EmailField(unique=True)

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
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name="accounts_users_permissions",
        blank=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()  # 🔴 THIS IS THE KEY LINE

    def __str__(self):
        return f"{self.email} ({self.role})"
