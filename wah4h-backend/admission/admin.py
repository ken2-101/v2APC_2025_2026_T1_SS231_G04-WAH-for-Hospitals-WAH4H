from django.contrib import admin
from .models import Encounter, Procedure, ProcedurePerformer

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