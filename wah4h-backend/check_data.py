import os
import django
import sys

sys.stderr = open('stderr_data_check.log', 'w')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from laboratory.models import LabTestDefinition, DiagnosticReport
from pharmacy.models import Inventory, MedicationRequest

def check_data_alignment():
    with open('data_check_results.txt', 'w') as f:
        f.write("--- Laboratory Data Check ---\n")
        f.write(f"Total Lab Definitions: {LabTestDefinition.objects.count()}\n")
        for test in LabTestDefinition.objects.all()[:5]:
            f.write(f"DEF: Code={test.code}, Name={test.name}, Price={test.base_price}\n")
            
        f.write(f"\nTotal Pending Lab Reports: {DiagnosticReport.objects.filter(billing_reference__isnull=True).count()}\n")
        for report in DiagnosticReport.objects.filter(billing_reference__isnull=True)[:5]:
            matching_def = LabTestDefinition.objects.filter(code=report.code_code).first()
            file_status = "FOUND" if matching_def else "MISSING"
            price = matching_def.base_price if matching_def else "N/A"
            f.write(f"REP: Code={report.code_code}, Status={report.status}, Def={file_status}, Price={price}\n")

        f.write("\n\n--- Pharmacy Data Check ---\n")
        f.write(f"Total Inventory Items: {Inventory.objects.count()}\n")
        for item in Inventory.objects.all()[:5]:
            f.write(f"INV: Code={item.item_code}, Name={item.item_name}, Cost={item.unit_cost}, Stock={item.current_stock}\n")

        f.write(f"\nTotal Pending Med Requests: {MedicationRequest.objects.filter(billing_reference__isnull=True).count()}\n")
        for req in MedicationRequest.objects.filter(billing_reference__isnull=True)[:5]:
            matching_inv = Inventory.objects.filter(item_code=req.medication_code).first()
            file_status = "FOUND" if matching_inv else "MISSING"
            cost = matching_inv.unit_cost if matching_inv else "N/A"
            f.write(f"REQ: Code={req.medication_code}, Status={req.status}, Inv={file_status}, Cost={cost}\n")

if __name__ == "__main__":
    check_data_alignment()
