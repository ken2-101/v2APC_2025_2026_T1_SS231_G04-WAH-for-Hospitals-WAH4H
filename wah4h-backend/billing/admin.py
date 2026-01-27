from django.contrib import admin
from .models import (
    Account, Claim, Invoice, PaymentReconciliation, PaymentNotice,
    Coverage, ClaimResponse, ClaimItem, InvoiceLineItem, PaymentReconciliationDetail
)

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

@admin.register(Coverage)
class CoverageAdmin(admin.ModelAdmin):
    list_display = ('coverage_id', 'beneficiary', 'payor', 'relationship', 'status')
    search_fields = ('beneficiary__last_name', 'class_value')
    list_filter = ('status', 'relationship')

@admin.register(ClaimResponse)
class ClaimResponseAdmin(admin.ModelAdmin):
    list_display = ('claim_response_id', 'claim', 'patient', 'outcome', 'payment_amount', 'status')
    search_fields = ('claim__claim_id', 'patient__last_name')
    list_filter = ('status', 'outcome')

@admin.register(ClaimItem)
class ClaimItemAdmin(admin.ModelAdmin):
    list_display = ('claim_item_id', 'claim', 'sequence', 'product_or_service', 'quantity', 'net')
    search_fields = ('claim__claim_id', 'product_or_service')

@admin.register(InvoiceLineItem)
class InvoiceLineItemAdmin(admin.ModelAdmin):
    list_display = ('line_item_id', 'invoice', 'sequence', 'price_component_type', 'price_component_amount')
    search_fields = ('invoice__invoice_id', 'price_component_code')

@admin.register(PaymentReconciliationDetail)
class PaymentReconciliationDetailAdmin(admin.ModelAdmin):
    list_display = ('detail_id', 'payment_reconciliation', 'type', 'amount', 'date')
    search_fields = ('payment_reconciliation__payment_reconciliation_id', 'identifier')