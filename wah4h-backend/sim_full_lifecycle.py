import os
import django
import sys
from django.utils import timezone

# Redirect stderr to catch cryptic errors
sys.stderr = open('stderr_sim_full_lifecycle.log', 'w')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import DiagnosticReport, LabTestDefinition
from pharmacy.models import MedicationRequest, Inventory
from billing.models import Invoice, InvoiceLineItem
from django.db import transaction

def run_simulation():
    print("--- STARTING DEEP SYSTEM SIMULATION ---", flush=True)
    
    subject_id = 999 # distinct test subject
    
    # --- STEP 0: CLEANUP ---
    print("\n[STEP 0] Cleaning up past test data for Subject 999...", flush=True)
    Invoice.objects.filter(subject_id=subject_id).delete()
    DiagnosticReport.objects.filter(subject_id=subject_id).delete()
    MedicationRequest.objects.filter(subject_id=subject_id).delete()
    
    # --- STEP 1: CREATE ORDERS ---
    print("\n[STEP 1] Creating Orders...", flush=True)
    
    # Lab Order (CBC)
    lab_def = LabTestDefinition.objects.get(code='cbc')
    lab_report = DiagnosticReport.objects.create(
        identifier=f"REP-SIM-{timezone.now().timestamp()}",
        subject_id=subject_id,
        encounter_id=1,
        code_code='cbc',
        code_display=lab_def.name,
        status='final',
        effective_datetime=timezone.now()
    )
    print(f"  > Created Lab Report: {lab_report.identifier} (Status: final)", flush=True)

    # Med Order (Paracetamol)
    med_req = MedicationRequest.objects.create(
        identifier=f"REQ-SIM-{timezone.now().timestamp()}",
        subject_id=subject_id,
        encounter_id=1,
        medication_code='MED-001',
        medication_display='Paracetamol 500mg',
        status='active',
        intent='order',
        dispense_quantity=20, # 20 tabs
        authored_on=timezone.now()
    )
    print(f"  > Created Med Request: {med_req.identifier} (Status: active, Qty: 20)", flush=True)

    # --- STEP 2: GENERATE INVOICE A ---
    print("\n[STEP 2] Generating Invoice A (First Attempt)...", flush=True)
    invoice_a = Invoice.objects.generate_from_pending_orders(subject_id)
    
    if not invoice_a:
        print("FAIL: Invoice A generation failed.", flush=True)
        return

    print(f"  > Invoice A Generated: {invoice_a.identifier}", flush=True)
    print(f"  > Total Net: {invoice_a.total_net_value}", flush=True)
    
    # Verify Items Linked
    lab_report.refresh_from_db()
    med_req.refresh_from_db()
    
    if lab_report.billing_reference == str(invoice_a.identifier) and med_req.billing_reference == str(invoice_a.identifier):
        print("  > PASS: Items linked to Invoice A.", flush=True)
    else:
        print(f"FAIL: Items NOT linked. Lab Ref: {lab_report.billing_reference}, Med Ref: {med_req.billing_reference}", flush=True)
        return

    # --- STEP 3: CANCEL INVOICE A ---
    print("\n[STEP 3] Cancelling Invoice A...", flush=True)
    invoice_a.status = 'cancelled'
    invoice_a.save() # Should trigger signal
    print(f"  > Invoice A Status: {invoice_a.status}", flush=True)
    
    # Verify Items Unlinked
    lab_report.refresh_from_db()
    med_req.refresh_from_db()
    
    if lab_report.billing_reference is None and med_req.billing_reference is None:
        print("  > PASS: Items successfully UNLINKED after cancellation.", flush=True)
    else:
        print(f"FAIL: Items still linked! Lab Ref: {lab_report.billing_reference}", flush=True)
        return

    # --- STEP 4: GENERATE INVOICE B ---
    print("\n[STEP 4] Generating Invoice B (Re-billing)...", flush=True)
    invoice_b = Invoice.objects.generate_from_pending_orders(subject_id)
    
    if not invoice_b:
        print("FAIL: Invoice B generation failed. Items were not picked up?", flush=True)
        return
        
    if invoice_b.identifier == invoice_a.identifier:
         print("FAIL: Invoice B has same ID as Invoice A!", flush=True)
         return

    print(f"  > Invoice B Generated: {invoice_b.identifier}", flush=True)
    
    # Verify Items Linked to B
    lab_report.refresh_from_db()
    if lab_report.billing_reference == str(invoice_b.identifier):
        print("  > PASS: Items re-linked to Invoice B.", flush=True)
    else:
        print(f"FAIL: Items not linked to Invoice B. Ref: {lab_report.billing_reference}", flush=True)

    # --- STEP 5: ATTEMPT RE-BILL (SHOULD FAIL) ---
    print("\n[STEP 5] Attempting Double Billing...", flush=True)
    invoice_c = Invoice.objects.generate_from_pending_orders(subject_id)
    
    if invoice_c is None:
        print("  > PASS: Correctly returned None (No items to bill).", flush=True)
    else:
        print(f"FAIL: Generated Invoice C ({invoice_c.identifier}) but items should be locked!", flush=True)

    print("\n--- SIMULATION COMPLETE: SUCCESS ---", flush=True)

if __name__ == "__main__":
    try:
        run_simulation()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\nCRITICAL ERROR: {e}")
