from django.contrib import admin
from .models import InventoryItem, MedicationRequest, DispenseLog

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('generic_name', 'brand_name', 'quantity', 'expiry_date', 'batch_number')
    search_fields = ('generic_name', 'brand_name', 'batch_number')


@admin.register(MedicationRequest)
class MedicationRequestAdmin(admin.ModelAdmin):
    list_display = ('inventory_item', 'quantity', 'status', 'requested_at')
    list_filter = ('status',)
    search_fields = ('inventory_item__generic_name',)


@admin.register(DispenseLog)
class DispenseLogAdmin(admin.ModelAdmin):
    list_display = ('medication_request', 'dispensed_at')
    search_fields = ('medication_request__inventory_item__generic_name',)
