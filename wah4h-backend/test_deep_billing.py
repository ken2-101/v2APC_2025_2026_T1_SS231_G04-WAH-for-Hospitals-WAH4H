import os
import django
import sys
from django.utils import timezone
import time

# Redirect stderr to catch cryptic errors
sys.stderr = open('stderr_deep_test.log', 'w')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import DiagnosticReport, LabTestDefinition
from pharmacy.models import MedicationRequest
from billing.models import Invoice
from django.db import transaction

def run_deep_test():
    print("--- STARTING DEEP BILLING SCENARIOS ---", flush=True)
    
    subject_id = 888 # Distinct test subject
    
    # --- CLEANUP ---
    Invoice.objects.filter(subject_id=subject_id).delete()
    DiagnosticReport.objects.filter(subject_id=subject_id).delete()
    MedicationRequest.objects.filter(subject_id=subject_id).delete()
    
    # --- SCENARIO 1: ITERATIVE DRAFTING ---
    print("\n[SCENARIO 1] Iterative Drafting...", flush=True)
    
    # 1. Order Lab (CBC)
    DiagnosticReport.objects.create(
        identifier=f"REP-888-A",
        subject_id=subject_id,
        encounter_id=1,
        code_code='cbc',
        status='final',
        effective_datetime=timezone.now()
    )
    
    # 2. Generate Invoice 1
    inv1 = Invoice.objects.generate_from_pending_orders(subject_id)
    if not inv1 or inv1.total_net_value != 350.00:
        print(f"FAIL: Invoice 1 creation. Expected 350.00, got {inv1.total_net_value if inv1 else 'None'}", flush=True)
        return
    print(f"  > Invoice 1 Generated: {inv1.identifier} (Total: {inv1.total_net_value})", flush=True)
    
    # 3. Order Meds (Amoxicillin) - While Inv 1 is Draft
    MedicationRequest.objects.create(
        identifier=f"REQ-888-B",
        subject_id=subject_id,
        encounter_id=1,
        medication_code='MED-002', # Amoxicillin 15.00
        status='active',
        intent='order',
        dispense_quantity=10, 
        authored_on=timezone.now()
    )
    
    # 4. Generate Invoice 2
    inv2 = Invoice.objects.generate_from_pending_orders(subject_id)
    if not inv2:
        print("FAIL: Invoice 2 generation failed.", flush=True)
        return
        
    expected_med_total = 15.00 * 10
    if inv2.total_net_value != expected_med_total:
         print(f"FAIL: Invoice 2 Total. Expected {expected_med_total}, got {inv2.total_net_value}", flush=True)
         return
         
    print(f"  > Invoice 2 Generated: {inv2.identifier} (Total: {inv2.total_net_value})", flush=True)
    
    # Verify Separation
    if inv1.identifier == inv2.identifier:
        print("FAIL: Merged into same invoice? Should be separate if called sequentially.", flush=True)
        return
        
    print("  > PASS: Iterative Drafting creates separate invoices correctly.", flush=True)

    # --- SCENARIO 2: PARTIAL CANCELLATION & CONSOLIDATION ---
    print("\n[SCENARIO 2] Consolidation after Cancellation...", flush=True)
    
    # Cancel distinct invoices
    inv1.status = 'cancelled'
    inv1.save()
    inv2.status = 'cancelled'
    inv2.save()
    
    print("  > Cancelled Inv 1 and Inv 2.", flush=True)
    
    # Generate Inv 3 - Should pick up BOTH
    inv3 = Invoice.objects.generate_from_pending_orders(subject_id)
    
    if not inv3:
        print("FAIL: Invoice 3 generation failed.", flush=True)
        return
        
    expected_total = 350.00 + (15.00 * 10)
    if inv3.total_net_value == expected_total:
        print(f"  > PASS: Inv 3 consolidated both items. Total: {inv3.total_net_value}", flush=True)
    else:
        print(f"FAIL: Inv 3 Total mismatch. Expected {expected_total}, got {inv3.total_net_value}", flush=True)

    # --- SCENARIO 3: STATUS TRANSITIONS  ---
    print("\n[SCENARIO 3] Status Transitions...", flush=True)
    
    # Simulate Payment/Finalization
    inv3.status = 'issued'
    inv3.save()
    print("  > Inv 3 status set to 'issued'.", flush=True)
    
    # Create new item
    DiagnosticReport.objects.create(
        identifier=f"REP-888-C",
        subject_id=subject_id,
        encounter_id=1,
        code_code='urinalysis', # 150.00
        status='final',
        effective_datetime=timezone.now()
    )
    
    # Generate Inv 4
    inv4 = Invoice.objects.generate_from_pending_orders(subject_id)
    if inv4 and inv4.total_net_value == 150.00:
        print("  > PASS: Inv 4 created for new item only.", flush=True)
    else:
        print(f"FAIL: Inv 4 generation. Expected 150.00, got {inv4.total_net_value if inv4 else 'None'}", flush=True)

    print("\n--- DEEP TEST COMPLETE: SUCCESS ---", flush=True)

if __name__ == "__main__":
    try:
        run_deep_test()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nCRITICAL ERROR: {e}")
