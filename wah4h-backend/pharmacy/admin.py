from django.contrib import admin
from .models import Inventory, Medication, MedicationRequest, MedicationAdministration

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('inventory_id', 'item_name', 'current_stock', 'expiry_date', 'status')
    search_fields = ('item_name', 'item_code', 'batch_number')
    list_filter = ('status', 'category')

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('medication_id', 'code_display', 'status')
    search_fields = ('code_display', 'code_code')

@admin.register(MedicationRequest)
class MedicationRequestAdmin(admin.ModelAdmin):
    list_display = ('medication_request_id', 'subject', 'medication_display', 'authored_on', 'status')
    search_fields = ('subject__last_name', 'medication_display')
    list_filter = ('status', 'priority', 'intent')

@admin.register(MedicationAdministration)
class MedicationAdministrationAdmin(admin.ModelAdmin):
    list_display = ('medication_administration_id', 'subject', 'status_reason', 'effective_datetime')
    search_fields = ('subject__last_name', 'medication_display')