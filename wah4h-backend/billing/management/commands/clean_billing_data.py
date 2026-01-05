from django.core.management.base import BaseCommand
from billing.models import BillingRecord, MedicineItem, DiagnosticItem, Payment


class Command(BaseCommand):
    help = 'Clean all billing data from the database'

    def handle(self, *args, **options):
        # Delete all payments
        payment_count = Payment.objects.count()
        Payment.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {payment_count} payments'))

        # Delete all medicine items
        medicine_count = MedicineItem.objects.count()
        MedicineItem.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {medicine_count} medicine items'))

        # Delete all diagnostic items
        diagnostic_count = DiagnosticItem.objects.count()
        DiagnosticItem.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {diagnostic_count} diagnostic items'))

        # Delete all billing records
        billing_count = BillingRecord.objects.count()
        BillingRecord.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {billing_count} billing records'))

        self.stdout.write(self.style.SUCCESS('\nAll billing data has been cleaned!'))
