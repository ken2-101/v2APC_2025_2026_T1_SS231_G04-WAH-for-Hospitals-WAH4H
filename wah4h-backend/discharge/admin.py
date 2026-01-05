from django.contrib import admin
from .models import DischargeRecord, DischargeRequirements


@admin.register(DischargeRequirements)
class DischargeRequirementsAdmin(admin.ModelAdmin):
    list_display = (
        'admission',
        'final_diagnosis',
        'physician_signature',
        'medication_reconciliation',
        'discharge_summary',
        'billing_clearance',
        'is_ready_for_discharge',
    )
    list_filter = (
        'final_diagnosis',
        'physician_signature',
        'medication_reconciliation',
        'discharge_summary',
        'billing_clearance',
    )
    search_fields = ('admission__admission_id', 'admission__patient__first_name', 'admission__patient__last_name')
    ordering = ('-updated_at',)
    
    def is_ready_for_discharge(self, obj):
        return obj.is_ready_for_discharge()
    is_ready_for_discharge.boolean = True
    is_ready_for_discharge.short_description = 'Ready for Discharge'


@admin.register(DischargeRecord)
class DischargeRecordAdmin(admin.ModelAdmin):
    list_display = (
        'patient_name',
        'admission',
        'room',
        'physician',
        'department',
        'status',
        'discharge_date',
        'follow_up_required',
    )
    list_filter = (
        'status',
        'department',
        'follow_up_required',
        'discharge_date',
    )
    search_fields = (
        'patient_name',
        'room',
        'physician',
        'department',
        'admission__admission_id',
    )
    ordering = ('-discharge_date', '-created_at')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient', 'admission', 'patient_name', 'age', 'room')
        }),
        ('Discharge Details', {
            'fields': ('admission_date', 'discharge_date', 'status', 'condition', 'physician', 'department')
        }),
        ('Medical Information', {
            'fields': ('final_diagnosis', 'discharge_summary')
        }),
        ('Follow-up', {
            'fields': ('follow_up_required', 'follow_up_plan')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
