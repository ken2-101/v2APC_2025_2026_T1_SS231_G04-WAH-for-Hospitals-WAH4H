from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from patients.models import Patient
from admissions.models import Admission


class BillingRecord(models.Model):
    """Main billing record for a patient admission"""
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='billing_records'
    )
    admission = models.ForeignKey(
        Admission,
        on_delete=models.CASCADE,
        related_name='billing_records',
        null=True,
        blank=True
    )
    
    # Patient Information
    patient_name = models.CharField(max_length=200)
    hospital_id = models.CharField(max_length=50)
    admission_date = models.DateField()
    discharge_date = models.DateField()
    room_ward = models.CharField(max_length=100)
    
    # Room Charges
    room_type = models.CharField(max_length=50)
    number_of_days = models.IntegerField(default=0)
    rate_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Professional Fees
    attending_physician_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    specialist_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    surgeon_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_professional_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Dietary Charges
    diet_type = models.CharField(max_length=100, blank=True)
    meals_per_day = models.IntegerField(default=0)
    diet_duration = models.IntegerField(default=0)
    cost_per_meal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Other Charges
    supplies_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    procedure_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nursing_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    miscellaneous_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Discounts
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    philhealth_coverage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Discount Flags
    is_senior = models.BooleanField(default=False)
    is_pwd = models.BooleanField(default=False)
    is_philhealth_member = models.BooleanField(default=False)
    
    # Status
    is_finalized = models.BooleanField(default=False)
    finalized_date = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Billing Record {self.id} - {self.patient_name}"
    
    def clean(self):
        """Validate that only one discount flag is set at a time"""
        super().clean()
        discount_flags = [self.is_senior, self.is_pwd, self.is_philhealth_member]
        active_discounts = sum(1 for flag in discount_flags if flag)
        
        if active_discounts > 1:
            raise ValidationError(
                'Only one discount type can be selected at a time. '
                'Please choose either Senior Citizen, PWD, or PhilHealth Member.'
            )
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def total_room_charge(self):
        return self.number_of_days * self.rate_per_day
    
    @property
    def total_professional_fees(self):
        return (
            self.attending_physician_fee +
            self.specialist_fee +
            self.surgeon_fee +
            self.other_professional_fees
        )
    
    @property
    def total_dietary_charge(self):
        return self.meals_per_day * self.diet_duration * self.cost_per_meal
    
    @property
    def subtotal(self):
        medicine_total = sum(m.total_cost for m in self.medicines.all())
        diagnostic_total = sum(d.cost for d in self.diagnostics.all())
        
        return (
            self.total_room_charge +
            self.total_professional_fees +
            medicine_total +
            self.total_dietary_charge +
            diagnostic_total +
            self.supplies_charge +
            self.procedure_charge +
            self.nursing_charge +
            self.miscellaneous_charge
        )
    
    @property
    def total_amount(self):
        return self.subtotal - self.discount - self.philhealth_coverage
    
    @property
    def running_balance(self):
        """Calculate running balance after payments"""
        total_paid = sum(p.amount for p in self.payments.all())
        balance = self.total_amount - total_paid
        # Prevent negative balance (overpayment results in 0 balance)
        return max(0, balance)
    
    @property
    def payment_status(self):
        """Determine payment status based on payments"""
        balance = self.running_balance
        if balance <= 0:
            return 'Paid'
        elif balance < self.total_amount:
            return 'Partial'
        else:
            return 'Pending'


class MedicineItem(models.Model):
    """Medicine items for a billing record"""
    billing_record = models.ForeignKey(
        BillingRecord,
        on_delete=models.CASCADE,
        related_name='medicines'
    )
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.name} - {self.dosage}"
    
    @property
    def total_cost(self):
        return self.quantity * self.unit_price


class DiagnosticItem(models.Model):
    """Diagnostic/Laboratory items for a billing record"""
    billing_record = models.ForeignKey(
        BillingRecord,
        on_delete=models.CASCADE,
        related_name='diagnostics'
    )
    name = models.CharField(max_length=200)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name


class Payment(models.Model):
    """Payment records for billing"""
    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('Credit Card', 'Credit Card'),
        ('Debit Card', 'Debit Card'),
        ('Bank Transfer', 'Bank Transfer'),
        ('Check', 'Check'),
        ('PhilHealth', 'PhilHealth'),
        ('HMO', 'HMO'),
    ]
    
    billing_record = models.ForeignKey(
        BillingRecord,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    or_number = models.CharField(max_length=50, unique=True, editable=False)
    cashier = models.CharField(max_length=100)
    payment_date = models.DateField()
    
    created_at = models.DateTimeField(default=timezone.now)
    
    def save(self, *args, **kwargs):
        if not self.or_number:
            # Auto-generate OR number: OR-YYYYMMDD-XXXX
            from django.db.models import Max
            today = timezone.now().strftime('%Y%m%d')
            prefix = f'OR-{today}-'
            
            # Get the last OR number for today
            last_payment = Payment.objects.filter(
                or_number__startswith=prefix
            ).aggregate(Max('or_number'))
            
            last_or = last_payment['or_number__max']
            if last_or:
                # Extract the sequence number and increment
                last_seq = int(last_or.split('-')[-1])
                next_seq = last_seq + 1
            else:
                # First OR for today
                next_seq = 1
            
            self.or_number = f'{prefix}{str(next_seq).zfill(4)}'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Payment {self.or_number} - {self.amount}"
    
    class Meta:
        ordering = ['-payment_date', '-created_at']
