from django.contrib import admin
from .models import Encounter, Procedure, ProcedurePerformer, Appointment, ServiceRequest, EpisodeOfCare, Device

@admin.register(Encounter)
class EncounterAdmin(admin.ModelAdmin):
    list_display = ('encounter_id', 'subject_patient', 'type', 'period_start', 'status')
    search_fields = ('encounter_id', 'subject_patient__last_name', 'type')
    list_filter = ('status', 'class_field', 'type')

@admin.register(Procedure)
class ProcedureAdmin(admin.ModelAdmin):
    list_display = ('procedure_id', 'subject', 'encounter', 'status', 'performed_datetime')
    search_fields = ('procedure_id', 'subject__last_name', 'code_display')

@admin.register(ProcedurePerformer)
class ProcedurePerformerAdmin(admin.ModelAdmin):
    list_display = ('procedure_id', 'performer_actor')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('appointment_id', 'identifier', 'status')
    search_fields = ('identifier',)
    list_filter = ('status',)

@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('service_request_id', 'intent', 'code', 'subject', 'status')
    search_fields = ('identifier', 'code')
    list_filter = ('status', 'intent')

@admin.register(EpisodeOfCare)
class EpisodeOfCareAdmin(admin.ModelAdmin):
    list_display = ('episode_of_care_id', 'patient', 'type', 'status')
    search_fields = ('identifier', 'patient__last_name')
    list_filter = ('status', 'type')

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'device_name', 'type', 'model', 'patient', 'status')
    search_fields = ('device_name', 'model', 'type', 'identifier')
    list_filter = ('status', 'type')