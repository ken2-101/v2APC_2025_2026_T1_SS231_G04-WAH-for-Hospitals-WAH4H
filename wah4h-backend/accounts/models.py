from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)

    groups = models.ManyToManyField(
        Group,
        related_name="accounts_users",  # add this
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name="accounts_users_permissions",  # add this
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def __str__(self):
        return self.username
