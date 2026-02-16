import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import LabTestDefinition, DiagnosticReport

with open('inspect_models_output.txt', 'w') as f:
    f.write("--- LabTestDefinition Fields ---\n")
    for field in LabTestDefinition._meta.get_fields():
        f.write(f"{field.name}\n")

    f.write("\n--- DiagnosticReport Fields ---\n")
    for field in DiagnosticReport._meta.get_fields():
        f.write(f"{field.name}\n")
