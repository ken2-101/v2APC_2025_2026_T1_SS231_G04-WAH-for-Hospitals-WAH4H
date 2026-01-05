from django.contrib import admin
from .models import DischargeRecord


@admin.register(DischargeRecord)
class DischargeRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_name', 'room', 'status', 'department', 'admission_date', 'discharge_date']
    list_filter = ['status', 'department', 'admission_date', 'discharge_date']
    search_fields = ['patient_name', 'room', 'condition', 'physician', 'department']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient', 'admission', 'patient_name', 'age', 'room', 'condition')
        }),
        ('Admission Details', {
            'fields': ('admission_date', 'estimated_discharge', 'department', 'physician')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Discharge Requirements', {
            'fields': (
                'final_diagnosis', 'physician_signature', 'medication_reconciliation',
                'discharge_summary', 'billing_clearance', 'nursing_notes', 'follow_up_scheduled'
            )
        }),
        ('Discharge Information', {
            'fields': (
                'discharge_date', 'final_diagnosis_text', 'discharge_summary_text',
                'hospital_stay_summary', 'discharge_medications', 'discharge_instructions',
                'follow_up_required', 'follow_up_plan', 'billing_status', 'pending_items'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
