import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from pharmacy.models import Inventory, MedicationRequest

with open('inspect_pharmacy_output.txt', 'w') as f:
    f.write("--- Inventory Fields ---\n")
    for field in Inventory._meta.get_fields():
        f.write(f"{field.name}\n")

    f.write("\n--- MedicationRequest Fields ---\n")
    for field in MedicationRequest._meta.get_fields():
        f.write(f"{field.name}\n")
