import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from django.contrib.auth import authenticate
from accounts.models import User, Practitioner

def check_users():
    print("--- Checking Users ---")
    users = User.objects.all()
    if not users.exists():
        print("No users found in the database.")
        return

    for user in users:
        print(f"User: {user.username} | Email: {user.email} | Active: {user.is_active} | PK: {user.pk}")
        if hasattr(user, 'practitioner'):
            print(f"  Linked Practitioner: {user.practitioner.first_name} {user.practitioner.last_name}")
        else:
            print("  No linked practitioner (Database Integrity Warning!)")

if __name__ == "__main__":
    check_users()
