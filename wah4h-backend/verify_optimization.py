import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import DiagnosticReport, LabTestDefinition
from billing.models import Claim, Invoice
from pharmacy.models import MedicationRequest

def verify_optimization():
    print("Starting Verification...")
    
    # Prerequisite: Ensure a LabTestDefinition exists
    test_def, _ = LabTestDefinition.objects.get_or_create(
        code="TEST-OPT-001",
        defaults={
            "identifier": "TEST-DEF-OPT-001",
            "name": "Optimization Test",
            "category": "Chemistry",
            "base_price": 500.00
        }
    )

    # 1. Verify Laboratory Signal is Disabled
    print("\n[Step 1] Verifying Laboratory Signal is Disabled...")
    initial_claim_count = Claim.objects.count()
    
    try:
        report = DiagnosticReport.objects.create(
            identifier=f"REP-{timezone.now().timestamp()}",
            subject_id=1,
            encounter_id=1,
            code_code="TEST-OPT-001",
            status="final", # This would trigger the signal
            issued_datetime=timezone.now()
        )
    except Exception as e:
        with open('error.log', 'w') as f:
            f.write(f"ERROR: {e}\n")
            import traceback
            traceback.print_exc(file=f)
        print("ERROR LOGGED TO error.log")
        return
    
    # Check if a Claim was created (it shouldn't be)
    final_claim_count = Claim.objects.count()
    
    if final_claim_count == initial_claim_count and not report.billing_reference:
        print("PASS: No Claim created and billing_reference is empty.")
    else:
        print(f"FAIL: Claim count changed ({initial_claim_count} -> {final_claim_count}) or billing_reference set: {report.billing_reference}")
        return

    # 2. Verify Invoice Generation (Sets billing_reference)
    print("\n[Step 2] Verifying Invoice Generation sets billing_reference...")
    invoice = Invoice.objects.generate_from_pending_orders(subject_id=1)
    
    report.refresh_from_db()
    if invoice and report.billing_reference == str(invoice.identifier):
        print(f"PASS: Invoice #{invoice.identifier} generated and report linked.")
    else:
        print(f"FAIL: Invoice generation failed or link missing. Invoice: {invoice}, Ref: {report.billing_reference}")
        return

    # 3. Verify Invoice Deletion (Clears billing_reference)
    print("\n[Step 3] Verifying Invoice Deletion clears billing_reference...")
    invoice_id = invoice.identifier
    invoice.delete()
    
    report.refresh_from_db()
    if report.billing_reference is None:
        print(f"PASS: billing_reference cleared after Invoice #{invoice_id} deletion.")
    else:
        print(f"FAIL: billing_reference NOT cleared: {report.billing_reference}")
        return

    print("\nVerification Complete: SUCCESS")

if __name__ == "__main__":
    verify_optimization()
