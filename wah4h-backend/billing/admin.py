from django.contrib import admin
from .models import BillingRecord, MedicineItem, DiagnosticItem, Payment


class MedicineItemInline(admin.TabularInline):
    model = MedicineItem
    extra = 1
    fields = ['name', 'dosage', 'quantity', 'unit_price']


class DiagnosticItemInline(admin.TabularInline):
    model = DiagnosticItem
    extra = 1
    fields = ['name', 'cost']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['or_number', 'amount', 'payment_method', 'cashier', 'payment_date', 'created_at']
    can_delete = False
    fields = ['or_number', 'amount', 'payment_method', 'cashier', 'payment_date', 'created_at']


@admin.register(BillingRecord)
class BillingRecordAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'patient_name', 'hospital_id', 'admission_date',
        'discharge_date', 'total_amount', 'running_balance',
        'payment_status', 'is_finalized'
    ]
    list_filter = ['is_finalized', 'is_senior', 'is_pwd', 'is_philhealth_member', 'admission_date']
    search_fields = ['patient_name', 'hospital_id']
    readonly_fields = ['created_at', 'updated_at', 'total_room_charge', 'total_professional_fees', 
                       'total_dietary_charge', 'subtotal', 'total_amount', 'running_balance', 'payment_status']
    
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient', 'admission', 'patient_name', 'hospital_id', 
                      'admission_date', 'discharge_date', 'room_ward')
        }),
        ('Room Charges', {
            'fields': ('room_type', 'number_of_days', 'rate_per_day', 'total_room_charge')
        }),
        ('Professional Fees', {
            'fields': ('attending_physician_fee', 'specialist_fee', 'surgeon_fee', 
                      'other_professional_fees', 'total_professional_fees')
        }),
        ('Dietary Charges', {
            'fields': ('diet_type', 'meals_per_day', 'diet_duration', 'cost_per_meal', 'total_dietary_charge')
        }),
        ('Other Charges', {
            'fields': ('supplies_charge', 'procedure_charge', 'nursing_charge', 'miscellaneous_charge')
        }),
        ('Discounts & Coverage', {
            'fields': ('is_senior', 'is_pwd', 'is_philhealth_member', 'discount', 'philhealth_coverage')
        }),
        ('Status', {
            'fields': ('is_finalized', 'finalized_date')
        }),
        ('Summary', {
            'fields': ('subtotal', 'total_amount', 'running_balance', 'payment_status')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [MedicineItemInline, DiagnosticItemInline, PaymentInline]


@admin.register(MedicineItem)
class MedicineItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'billing_record', 'name', 'dosage', 'quantity', 'unit_price', 'total_cost']
    list_filter = ['billing_record']
    search_fields = ['name', 'dosage']


@admin.register(DiagnosticItem)
class DiagnosticItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'billing_record', 'name', 'cost']
    list_filter = ['billing_record']
    search_fields = ['name']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'or_number', 'billing_record', 'amount', 'payment_method', 
                   'cashier', 'payment_date', 'created_at']
    list_filter = ['payment_method', 'payment_date']
    search_fields = ['or_number', 'cashier']
    readonly_fields = ['created_at']
    date_hierarchy = 'payment_date'
