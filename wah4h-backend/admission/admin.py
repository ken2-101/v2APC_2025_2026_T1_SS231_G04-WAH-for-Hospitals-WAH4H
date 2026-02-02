from django.contrib import admin
from .models import (
    Encounter, 
    Procedure, 
    ProcedurePerformer, 
    Appointment, 
    ServiceRequest, 
    EpisodeOfCare, 
    Device
)


# ==================== ENCOUNTER ADMIN ====================

@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    """
    Production-grade admin interface for Encounter management.
    Organized into logical fieldsets for enhanced usability.
    """
    
    # List Display - Critical tracking information
    list_display = (
        'encounter_id',
        'identifier',
        'status',
        'get_class_display',
        'type',
        'subject_patient_id',
        'period_start',
    )
    
    # List Filters
    list_filter = (
        'status',
        'class_field',
        'type',
        'location_status',
        'period_start',
    )
    
    # Date Hierarchy for temporal navigation
    date_hierarchy = 'period_start'
    
    # Search Fields
    search_fields = (
        'identifier',
        '=subject_patient_id',  # Exact match for patient ID
        'type',
    )
    
    # Ordering
    ordering = ('-period_start', '-encounter_id')
    
    # Read-Only Fields
    readonly_fields = (
        'encounter_id',
        'created_at',
        'updated_at',
    )
    
    # Fieldsets - Logical grouping of fields
    fieldsets = (
        ('Identity & Classification', {
            'fields': (
                'encounter_id',
                'identifier',
                'status',
                'class_field',
                'type',
                'service_type',
                'priority',
            ),
            'description': 'Core identification and classification of the encounter.'
        }),
        
        ('Patient & Participants', {
            'fields': (
                'subject_patient_id',
                'participant_individual_id',
                'participant_type',
                'service_provider_id',
            ),
            'description': 'Patient information and participating healthcare providers. Note: IDs are integer references to respective modules.'
        }),
        
        ('Timing & History', {
            'fields': (
                'period_start',
                'period_end',
                'length',
                'episode_of_care_id',
                'based_on_service_request_id',
                'appointment_id',
                'part_of_encounter_id',
                'pre_admission_identifier',
            ),
            'description': 'Temporal information and historical relationships.'
        }),
        
        ('Hospitalization & Discharge', {
            'fields': (
                'admit_source',
                're_admission',
                'diet_preference',
                'special_courtesy',
                'special_arrangement',
                'discharge_destination_id',
                'discharge_disposition',
            ),
            'description': 'Admission and discharge details for inpatient encounters.',
            'classes': ('collapse',),
        }),
        
        ('Location Details', {
            'fields': (
                'location_id',
                'location_status',
                'location_period_start',
                'location_period_end',
                'location_physical_type',
            ),
            'description': 'Physical location information during the encounter.',
            'classes': ('collapse',),
        }),
        
        ('Clinical & Diagnosis', {
            'fields': (
                'diagnosis_condition_id',
                'diagnosis_rank',
                'diagnosis_use',
                'reason_code',
                'reason_reference_id',
            ),
            'description': 'Clinical reasoning and diagnostic information.',
        }),
        
        ('Billing & Account', {
            'fields': (
                'account_id',
            ),
            'description': 'Financial and billing references.',
            'classes': ('collapse',),
        }),
        
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    def get_class_display(self, obj):
        """Custom display for class_field to avoid confusion with Python 'class' keyword."""
        return obj.class_field if obj.class_field else '-'
    get_class_display.short_description = 'Class'
    get_class_display.admin_order_field = 'class_field'
    
    # List per page
    list_per_page = 25
    
    # Enable actions
    actions_on_top = True
    actions_on_bottom = False


# ==================== PROCEDURE ADMIN ====================

@admin.register(Procedure)
class ProcedureAdmin(admin.ModelAdmin):
    """
    Production-grade admin interface for Procedure management.
    Organized into logical fieldsets for clinical workflow.
    """
    
    # List Display
    list_display = (
        'procedure_id',
        'identifier',
        'status',
        'code_display',
        'subject_id',
        'encounter_id',
        'performed_datetime',
    )
    
    # List Filters
    list_filter = (
        'status',
        'category_code',
        'performed_datetime',
    )
    
    # Date Hierarchy
    date_hierarchy = 'performed_datetime'
    
    # Search Fields
    search_fields = (
        'identifier',
        'code_display',
        '=subject_id',
        '=encounter_id',
    )
    
    # Ordering
    ordering = ('-performed_datetime', '-procedure_id')
    
    # Read-Only Fields
    readonly_fields = (
        'procedure_id',
        'created_at',
        'updated_at',
    )
    
    # Fieldsets
    fieldsets = (
        ('Identity & Status', {
            'fields': (
                'procedure_id',
                'identifier',
                'status',
                'status_reason_code',
                'status_reason_display',
            ),
            'description': 'Procedure identification and current status.'
        }),
        
        ('Procedure Coding', {
            'fields': (
                'code_code',
                'code_display',
                'category_code',
                'category_display',
                'body_site_code',
                'body_site_display',
            ),
            'description': 'Clinical coding information (ICD, SNOMED, etc.).'
        }),
        
        ('Subject & Context', {
            'fields': (
                'subject_id',
                'encounter_id',
                'based_on_id',
                'part_of_id',
                'recorder_id',
                'asserter_id',
                'location_id',
            ),
            'description': 'Patient, encounter, and clinical context. Note: IDs are integer references.'
        }),
        
        ('Performance Timing', {
            'fields': (
                'performed_datetime',
                'performed_period_start',
                'performed_period_end',
                'performed_string',
                'performed_age_value',
                'performed_age_unit',
                'performed_range_low',
                'performed_range_high',
            ),
            'description': 'When the procedure was performed.',
        }),
        
        ('Performers', {
            'fields': (
                'performer_actor_id',
                'performer_function_code',
                'performer_function_display',
                'performer_on_behalf_of_id',
            ),
            'description': 'Healthcare providers who performed the procedure.',
            'classes': ('collapse',),
        }),
        
        ('Clinical Reasoning', {
            'fields': (
                'reason_code_code',
                'reason_code_display',
                'reason_reference_id',
            ),
            'description': 'Why the procedure was performed.',
            'classes': ('collapse',),
        }),
        
        ('Outcome & Complications', {
            'fields': (
                'outcome_code',
                'outcome_display',
                'complication_code',
                'complication_display',
                'complication_detail_id',
                'follow_up_code',
                'follow_up_display',
            ),
            'description': 'Results and any complications from the procedure.'
        }),
        
        ('Devices & Materials', {
            'fields': (
                'focal_device_manipulated_id',
                'focal_device_action_code',
                'focal_device_action_display',
                'used_reference_id',
                'used_code_code',
                'used_code_display',
            ),
            'description': 'Devices and materials used during the procedure.',
            'classes': ('collapse',),
        }),
        
        ('Additional Information', {
            'fields': (
                'instantiates_canonical',
                'instantiates_uri',
                'note',
                'report_id',
            ),
            'description': 'Notes, reports, and protocol references.',
            'classes': ('collapse',),
        }),
        
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    # List per page
    list_per_page = 25
    
    # Enable actions
    actions_on_top = True
    actions_on_bottom = False


# ==================== PROCEDURE PERFORMER ADMIN ====================

@admin.register(ProcedurePerformer)
class ProcedurePerformerAdmin(admin.ModelAdmin):
    """
    Admin interface for managing procedure performers (detail model).
    """
    
    list_display = (
        'procedure_performer_id',
        'procedure_id',
        'performer_actor_id',
        'performer_function_code',
        'performer_function_display',
    )
    
    list_filter = (
        'performer_function_code',
    )
    
    search_fields = (
        '=procedure_id',
        '=performer_actor_id',
        'performer_function_display',
    )
    
    readonly_fields = (
        'procedure_performer_id',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Performer Information', {
            'fields': (
                'procedure_performer_id',
                'procedure_id',
                'performer_actor_id',
                'performer_function_code',
                'performer_function_display',
                'performer_on_behalf_of_id',
            ),
            'description': 'Details of healthcare provider performing the procedure.'
        }),
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    list_per_page = 25


# ==================== STUB MODELS ADMIN ====================

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Basic admin interface for Appointment stub model.
    Will be enhanced when scheduling module is fully implemented.
    """
    
    list_display = (
        'appointment_id',
        'identifier',
        'status',
    )
    
    list_filter = ('status',)
    
    search_fields = (
        'identifier',
        '=appointment_id',
    )
    
    readonly_fields = (
        'appointment_id',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Appointment Information', {
            'fields': (
                'appointment_id',
                'identifier',
                'status',
            ),
        }),
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    list_per_page = 25


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    """
    Basic admin interface for ServiceRequest stub model.
    Will be enhanced when clinical module is fully implemented.
    """
    
    list_display = (
        'service_request_id',
        'identifier',
        'intent',
        'code',
        'subject_id',
        'status',
    )
    
    list_filter = (
        'status',
        'intent',
    )
    
    search_fields = (
        'identifier',
        'code',
        '=service_request_id',
        '=subject_id',
    )
    
    readonly_fields = (
        'service_request_id',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Service Request Information', {
            'fields': (
                'service_request_id',
                'identifier',
                'status',
                'intent',
                'code',
                'subject_id',
            ),
        }),
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    list_per_page = 25


@admin.register(EpisodeOfCare)
class EpisodeOfCareAdmin(admin.ModelAdmin):
    """
    Basic admin interface for EpisodeOfCare stub model.
    Will be enhanced when clinical module is fully implemented.
    """
    
    list_display = (
        'episode_of_care_id',
        'identifier',
        'patient_id',
        'type',
        'status',
    )
    
    list_filter = (
        'status',
        'type',
    )
    
    search_fields = (
        'identifier',
        '=episode_of_care_id',
        '=patient_id',
    )
    
    readonly_fields = (
        'episode_of_care_id',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Episode of Care Information', {
            'fields': (
                'episode_of_care_id',
                'identifier',
                'status',
                'type',
                'patient_id',
            ),
        }),
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    list_per_page = 25


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    """
    Basic admin interface for Device stub model.
    Will be enhanced when medical devices module is fully implemented.
    """
    
    list_display = (
        'device_id',
        'identifier',
        'device_name',
        'type',
        'model',
        'patient_id',
        'status',
    )
    
    list_filter = (
        'status',
        'type',
    )
    
    search_fields = (
        'device_name',
        'model',
        'type',
        'identifier',
        '=device_id',
        '=patient_id',
    )
    
    readonly_fields = (
        'device_id',
        'created_at',
        'updated_at',
    )
    
    fieldsets = (
        ('Device Information', {
            'fields': (
                'device_id',
                'identifier',
                'device_name',
                'type',
                'model',
                'version',
                'status',
            ),
        }),
        ('Associations', {
            'fields': (
                'patient_id',
                'owner_id',
                'location_id',
            ),
            'description': 'Related patient, organization, and location references.',
        }),
        ('Additional Details', {
            'fields': (
                'note',
            ),
            'classes': ('collapse',),
        }),
        ('System Metadata', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    list_per_page = 25