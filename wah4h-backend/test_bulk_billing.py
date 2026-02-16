import os
import django
import sys
from django.utils import timezone
import time

# Redirect stderr to catch cryptic errors
sys.stderr = open('stderr_deep_test_bulk.log', 'w')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import DiagnosticReport, LabTestDefinition
from pharmacy.models import MedicationRequest
from billing.models import Invoice
from django.db import transaction

def run_deep_test():
    print("--- STARTING BULK OPTIMIZATION VERIFICATION ---", flush=True)
    
    subject_id = 777 # Distinct test subject
    
    # --- CLEANUP ---
    Invoice.objects.filter(subject_id=subject_id).delete()
    DiagnosticReport.objects.filter(subject_id=subject_id).delete()
    MedicationRequest.objects.filter(subject_id=subject_id).delete()
    
    # 1. Order Multiple Lab Items
    print("\n[STEP 1] Creating 5 Lab Reports...", flush=True)
    for i in range(5):
        DiagnosticReport.objects.create(
            identifier=f"REP-777-{i}",
            subject_id=subject_id,
            encounter_id=1,
            code_code='cbc',
            status='final',
            effective_datetime=timezone.now()
        )

    # 2. Order Multiple Meds
    print("\n[STEP 2] Creating 5 Med Requests...", flush=True)
    for i in range(5):
        MedicationRequest.objects.create(
            identifier=f"REQ-777-{i}",
            subject_id=subject_id,
            encounter_id=1,
            medication_code='MED-001', # 5.00
            status='active',
            intent='order',
            dispense_quantity=10, 
            authored_on=timezone.now()
        )
        
    # 3. Generate Invoice
    print("\n[STEP 3] Generating Invoice (Should use BULK operations)...", flush=True)
    start_time = time.time()
    invoice = Invoice.objects.generate_from_pending_orders(subject_id)
    end_time = time.time()
    
    if not invoice:
        print("FAIL: Invoice generation failed.", flush=True)
        return
        
    print(f"  > Invoice Generated: {invoice.identifier}", flush=True)
    print(f"  > Time Taken: {end_time - start_time:.4f}s", flush=True)
    
    # Verify Totals
    # 5 Labs * 350.00 = 1750.00
    # 5 Meds * (5.00 * 10) = 250.00
    # Total = 2000.00
    expected_total = 1750.00 + 250.00
    
    if invoice.total_net_value == expected_total:
         print(f"  > PASS: Total Value Correct ({invoice.total_net_value})", flush=True)
    else:
         print(f"FAIL: Total Value Mismatch. Expected {expected_total}, got {invoice.total_net_value}", flush=True)
         return
         
    # Verify Line Items Count
    line_count = invoice.line_items.count()
    if line_count == 10:
        print(f"  > PASS: Line Item Count Correct ({line_count})", flush=True)
    else:
        print(f"FAIL: Line Item Count Mismatch. Expected 10, got {line_count}", flush=True)

    print("\n--- BULK VERIFICATION COMPLETE: SUCCESS ---", flush=True)

if __name__ == "__main__":
    try:
        run_deep_test()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nCRITICAL ERROR: {e}")
