from django.contrib import admin
from .models import Account, Claim, Invoice, PaymentReconciliation, PaymentNotice

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('account_id', 'subject', 'name', 'servicePeriod_start', 'status')
    search_fields = ('name', 'subject__last_name')
    list_filter = ('status', 'type')

@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('claim_id', 'patient', 'type', 'total', 'created', 'status')
    search_fields = ('claim_id', 'patient__last_name', 'type')
    list_filter = ('status', 'priority', 'use')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_id', 'subject', 'total_gross_value', 'invoice_datetime', 'status')
    search_fields = ('invoice_id', 'subject__last_name')

@admin.register(PaymentReconciliation)
class PaymentReconciliationAdmin(admin.ModelAdmin):
    list_display = ('payment_reconciliation_id', 'payment_identifier', 'payment_amount_value', 'payment_date', 'status')

@admin.register(PaymentNotice)
class PaymentNoticeAdmin(admin.ModelAdmin):
    list_display = ('payment_notice_id', 'payment_status', 'amount_value', 'payment_date', 'status')