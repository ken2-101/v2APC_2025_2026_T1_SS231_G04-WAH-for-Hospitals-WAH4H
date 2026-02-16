import os
import django
import sys

# Redirect stderr to a file to capture errors despite truncation
sys.stderr = open('stderr.log', 'w')

try:
    print("Setting up Django...")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
    django.setup()
    print("Django setup complete.")

    print("Importing models...")
    from laboratory.models import DiagnosticReport
    from billing.models import Claim
    print("Models imported.")

    print("Creating LabTestDefinition...")
    from laboratory.models import LabTestDefinition
    test_def, _ = LabTestDefinition.objects.get_or_create(
        code="TEST-SETUP",
        defaults={
            "name": "Setup Test",
            "category": "Setup",
            "base_price": 100.00
        }
    )
    print("LabTestDefinition created.")

    print("Creating DiagnosticReport...")
    from django.utils import timezone
    report = DiagnosticReport.objects.create(
        identifier=f"TEST-{timezone.now().timestamp()}",
        subject_id=1,
        encounter_id=1,
        code_code="TEST-SETUP",
        status="final", # Trigger signal check
        issued_datetime=timezone.now()
    )
    print(f"Report created: {report.diagnostic_report_id}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

sys.stderr.close()
