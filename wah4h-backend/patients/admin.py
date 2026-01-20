from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'last_name', 'first_name', 'status')
    search_fields = ('patient_id', 'last_name', 'first_name', 'contact_number', 'identifier_philhealth')
    list_filter = ('status', 'sex', 'civil_status')
