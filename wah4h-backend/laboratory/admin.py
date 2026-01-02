from django.contrib import admin
from .models import LabRequest, LabResult, TestParameter


@admin.register(LabRequest)
class LabRequestAdmin(admin.ModelAdmin):
    """
    Admin interface for Lab Requests
    """
    list_display = [
        'request_id',
        'patient',
        'requesting_doctor',
        'test_type',
        'priority',
        'status',
        'created_at',
    ]
    list_filter = ['status', 'priority', 'test_type', 'created_at']
    search_fields = [
        'request_id',
        'patient__patient_id',
        'patient__first_name',
        'patient__last_name',
        'requesting_doctor__first_name',
        'requesting_doctor__last_name',
    ]
    readonly_fields = ['request_id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('request_id', 'patient', 'requesting_doctor')
        }),
        ('Test Details', {
            'fields': ('test_type', 'priority', 'clinical_reason')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    """
    Admin interface for Lab Results
    """
    list_display = [
        'id',
        'get_request_id',
        'medical_technologist',
        'prc_number',
        'performed_by',
        'finalized_at',
        'created_at',
    ]
    list_filter = ['finalized_at', 'created_at']
    search_fields = [
        'lab_request__request_id',
        'medical_technologist',
        'prc_number',
    ]
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_request_id(self, obj):
        return obj.lab_request.request_id
    get_request_id.short_description = 'Request ID'
    
    fieldsets = (
        ('Request Link', {
            'fields': ('lab_request',)
        }),
        ('Medical Technologist Info', {
            'fields': ('medical_technologist', 'prc_number', 'performed_by')
        }),
        ('Results', {
            'fields': ('remarks', 'finalized_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TestParameter)
class TestParameterAdmin(admin.ModelAdmin):
    """
    Admin interface for Test Parameters
    """
    list_display = [
        'id',
        'get_request_id',
        'parameter_name',
        'result_value',
        'unit',
        'reference_range',
        'interpretation',
        'created_at',
    ]
    list_filter = ['interpretation', 'created_at']
    search_fields = [
        'lab_result__lab_request__request_id',
        'parameter_name',
    ]
    readonly_fields = ['created_at']
    ordering = ['lab_result', 'id']
    
    def get_request_id(self, obj):
        return obj.lab_result.lab_request.request_id
    get_request_id.short_description = 'Request ID'
    
    fieldsets = (
        ('Link', {
            'fields': ('lab_result',)
        }),
        ('Parameter Details', {
            'fields': (
                'parameter_name',
                'result_value',
                'unit',
                'reference_range',
                'interpretation',
            )
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )