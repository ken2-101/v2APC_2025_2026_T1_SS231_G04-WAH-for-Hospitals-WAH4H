import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from datetime import date
from django.utils import timezone
from laboratory.models import DiagnosticReport, LabTestDefinition
from pharmacy.models import MedicationRequest, Inventory
from billing.models import Invoice, InvoiceLineItem

def run_test():
    print("--- Starting Billing Workflow Reproduction ---")
    
    subject_id = 88888 # Mock Patient ID
    
    # 1. Setup Master Data
    print("1. Setting up Master Data...")
    
    # Lab Test
    lab_test, _ = LabTestDefinition.objects.get_or_create(
        code="TEST-CBC",
        defaults={
            "identifier": "DEF-CBC",
            "name": "Complete Blood Count",
            "base_price": 550.00,
            "category": "Hematology"
        }
    )
    print(f"   - Lab Test: {lab_test.name} @ {lab_test.base_price}")
    
    # Meds
    med_item, _ = Inventory.objects.get_or_create(
        item_code="MED-PARA",
        defaults={
            "item_name": "Paracetamol 500mg",
            "unit_cost": 5.00,
            "current_stock": 100,
            "status": "active"
        }
    )
    print(f"   - Med: {med_item.item_name} @ {med_item.unit_cost}")
    
    # 2. Create Pending Orders
    print("\n2. Creating Pending Orders...")
    
    # Lab Order
    lab_report = DiagnosticReport.objects.create(
        identifier="REP-001",
        subject_id=subject_id,
        encounter_id=1,
        code_code="TEST-CBC",
        status="final",
        billing_reference=None # Unbilled
    )
    print(f"   - Created Lab Report #{lab_report.diagnostic_report_id}")
    
    # Pharmacy Order
    med_req = MedicationRequest.objects.create(
        identifier="REQ-001",
        subject_id=subject_id,
        encounter_id=1,
        medication_code="MED-PARA",
        dispense_quantity=10,
        status="active",
        billing_reference=None # Unbilled
    )
    print(f"   - Created Med Request #{med_req.medication_request_id} (Qty: 10)")
    
    # 3. Generate Invoice
    print("\n3. Generating Invoice...")
    invoice = Invoice.objects.generate_from_pending_orders(subject_id)
    
    if invoice:
        print(f"   - Invoice Created: {invoice.identifier}")
        print(f"   - Total Net: {invoice.total_net_value}")
        
        print("\n4. Verifying Line Items...")
        for item in invoice.line_items.all():
            print(f"   - Item: {item.description} | Qty: {item.quantity} | Unit: {item.unit_price} | Total: {item.net_value} | Seq: {item.sequence}")
            
        # Verify totals
        expected_total = (550.00 * 1) + (5.00 * 10) # 600.00
        if float(invoice.total_net_value) == expected_total:
            print(f"\nSUCCESS: Total matches expected {expected_total}")
        else:
            print(f"\nFAILURE: Total {invoice.total_net_value} != expected {expected_total}")
            
    else:
        print("FAILURE: No invoice created!")

    # 5. Cleanup
    print("\n5. Cleaning up...")
    if invoice:
        invoice.delete() # Signals should clear references
        print("   - Invoice deleted")
        
        lab_report.refresh_from_db()
        med_req.refresh_from_db()
        
        if lab_report.billing_reference is None and med_req.billing_reference is None:
             print("   - SUCCESS: Billing references cleared on source objects")
        else:
             print(f"   - FAILURE: References not cleared! Lab: {lab_report.billing_reference}, Med: {med_req.billing_reference}")

    # Remove test data
    lab_report.delete()
    med_req.delete()
    
    # 6. Verifying Manual Invoice Creation
    print("\n6. Verifying Manual Invoice Creation...")
    manual_inv = Invoice.objects.create_empty_invoice(subject_id=888)
    print(f"   - Created Manual Invoice: {manual_inv.identifier} | Status: {manual_inv.status}")
    
    if manual_inv.total_net_value == 0:
        print("   - SUCCESS: Manual invoice has 0 totals as expected.")
    else:
        print(f"   - FAILURE: Expected 0, got {manual_inv.total_net_value}")
    
    manual_inv.delete()

if __name__ == "__main__":
    run_test()
