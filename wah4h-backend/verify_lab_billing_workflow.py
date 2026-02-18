import os
import django
import sys
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import DiagnosticReport, LabTestDefinition
from billing.models import Invoice, InvoiceLineItem
from admission.models import Encounter
from patients.models import Patient
from django.utils import timezone

def verify_workflow():
    print("--- Verifying Lab to Billing Workflow (Refined v4) ---")
    
    # 0. Cleanup old repro data
    identifier_prefix = "REPRO-"
    Encounter.objects.filter(identifier__startswith=identifier_prefix).delete()
    Patient.objects.filter(patient_id__startswith=identifier_prefix).delete()
    DiagnosticReport.objects.filter(identifier__startswith=identifier_prefix).delete()
    print("Cleaned up old repro data.")

    # 1. Setup Mock Patient/Encounter
    patient = Patient.objects.create(
        patient_id="REPRO-P-001",
        first_name="Repro",
        last_name="Patient",
        gender="male"
    )
    patient_id_int = int(patient.id)
    print(f"Created Patient: {patient.patient_id} (ID: {patient_id_int})")
    
    encounter = Encounter.objects.create(
        identifier="REPRO-ENC-001",
        subject_id=patient_id_int,
        status="in-progress"
    )
    encounter_id_int = int(encounter.encounter_id)
    print(f"Created Encounter: {encounter.identifier} (ID: {encounter_id_int})")

    # 2. Create Diagnostic Reports for 'cbc' and 'blood_typing'
    tests_to_verify = [
        {"code": "cbc", "expected_price": Decimal("180.00")},
        {"code": "blood_typing", "expected_price": Decimal("100.00")},
    ]

    reports = []
    for test in tests_to_verify:
        report = DiagnosticReport.objects.create(
            identifier=f"REPRO-LAB-{test['code'].upper()}",
            subject_id=patient_id_int,
            encounter_id=encounter_id_int,
            code_code=test["code"],
            status="final",
            category_code="LAB"
        )
        reports.append(report)
        print(f"Created DiagnosticReport for {test['code']} (Report ID: {report.diagnostic_report_id})")

    # 3. Generate Invoice
    print(f"Generating invoice for patient ID: {patient_id_int}...")
    # Fix: generate_from_pending_orders expects subject_id, not encounter
    invoice = Invoice.objects.generate_from_pending_orders(patient_id_int)
    
    if not invoice:
        print("Failed to generate invoice. Are there pending reports?")
        # Check if reports are actually in the DB
        pending = DiagnosticReport.objects.filter(subject_id=patient_id_int, status="final", billing_reference__isnull=True)
        print(f"Pending reports found in DB for this patient: {pending.count()}")
        return

    print(f"Invoice Generated: {invoice.identifier}")

    # 4. Verify Line Items
    line_items = InvoiceLineItem.objects.filter(invoice=invoice)
    print(f"Found {line_items.count()} line items.")

    for test in tests_to_verify:
        item = line_items.filter(chargeitem_code=test["code"]).first()
        assert item is not None, f"Line item for {test['code']} missing!"
        assert item.unit_price == test["expected_price"], f"Price mismatch for {test['code']}: expected {test['expected_price']}, got {item.unit_price}"
        print(f"✅ Verified {test['code']}: Price = {item.unit_price}")

    # 5. Verify DiagnosticReport reference update
    for report in reports:
        report.refresh_from_db()
        assert report.billing_reference == str(invoice.identifier), f"Billing reference not updated for {report.code_code}"
    
    print("✅ All billing references updated correctly.")
    print("--- Verification Successful ---")

if __name__ == '__main__':
    try:
        verify_workflow()
    except AssertionError as e:
        print(f"❌ Verification Failed: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
