import os
import django
import sys

# Redirect stderr to catch cryptic errors
sys.stderr = open('stderr_verify_alignment.log', 'w')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import DiagnosticReport, LabTestDefinition
from pharmacy.models import MedicationRequest, Inventory
from billing.models import Invoice, InvoiceLineItem, InvoiceManager
from django.db import transaction

def verify_alignment():
    print("Starting Alignment Verification...", flush=True)
    
    subject_id = 1
    
    # 1. Check Pending Status
    pending_lab = DiagnosticReport.objects.filter(subject_id=subject_id, billing_reference__isnull=True, code_code='cbc').count()
    pending_meds = MedicationRequest.objects.filter(subject_id=subject_id, billing_reference__isnull=True, medication_code='MED-001').count()
    
    print(f"Pending Lab Reports (CBC): {pending_lab}", flush=True)
    print(f"Pending Med Requests (MED-001): {pending_meds}", flush=True)

    if pending_lab == 0 or pending_meds == 0:
        print("FAIL: No pending items to test billing with.", flush=True)
        return

    # 2. Convert Pending to Invoice
    print("Generating Invoice...", flush=True)
    try:
        invoice = Invoice.objects.generate_from_pending_orders(subject_id)
        
        if not invoice:
            print("FAIL: Invoice generation returned None.", flush=True)
            return
            
        print(f"Invoice Generated: {invoice.identifier}", flush=True)
        
        # 3. Verify Line Items
        items = InvoiceLineItem.objects.filter(invoice=invoice)
        print(f"Total Line Items: {items.count()}", flush=True)
        
        cbc_item = items.filter(chargeitem_code='cbc').first()
        med_item = items.filter(chargeitem_code='MED-001').first()
        
        pass_lab = False
        pass_med = False
        
        if cbc_item:
            print(f"LAB ITEM: Code={cbc_item.chargeitem_code}, Price={cbc_item.unit_price}", flush=True)
            if cbc_item.unit_price == 350.00:
                print("PASS: Lab Price correct (350.00)", flush=True)
                pass_lab = True
            else:
                print(f"FAIL: Lab Price mismatch. Expected 350.00, got {cbc_item.unit_price}", flush=True)
        else:
            print("FAIL: Lab item 'cbc' not found in invoice.", flush=True)
            
        if med_item:
            print(f"MED ITEM: Code={med_item.chargeitem_code}, Price={med_item.unit_price}, Qty={med_item.quantity}, Total={med_item.net_value}", flush=True)
            expected_total = 5.00 * 10
            if med_item.unit_price == 5.00 and med_item.net_value == expected_total:
                print(f"PASS: Med Price correct (5.00 * 10 = {expected_total})", flush=True)
                pass_med = True
            else:
                print(f"FAIL: Med Price mismatch. Expected unit 5.00, total {expected_total}", flush=True)
        else:
            print("FAIL: Med item 'MED-001' not found in invoice.", flush=True)

        if pass_lab and pass_med:
            print("SUCCESS: Alignment Verified.", flush=True)
            
            # Cleanup for re-runnability (optional, but good for testing)
            # invoice.delete() # This triggers cleanup signal we tested earlier!
            # print("Cleanup: Invoice deleted.", flush=True)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FAIL: Error generating invoice: {e}", flush=True)

if __name__ == "__main__":
    verify_alignment()
