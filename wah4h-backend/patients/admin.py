from django.contrib import admin
from .models import Patient, Condition

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'last_name', 'first_name', 'active', 'gender', 'birth_date')
    search_fields = ('last_name', 'first_name', 'identifier')
    list_filter = ('active', 'gender')

@admin.register(Condition)
class ConditionAdmin(admin.ModelAdmin):
    list_display = ('condition_id', 'subject', 'code_display', 'clinical_status', 'onset_datetime')
    search_fields = ('subject__last_name', 'code_display')
    list_filter = ('clinical_status', 'verification_status')