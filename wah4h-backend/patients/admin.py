from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'last_name', 'first_name', 'status', 'admission_date', 'department', 'room')
    search_fields = ('patient_id', 'last_name', 'first_name', 'mobile_number', 'philhealth_id')
    list_filter = ('status', 'sex', 'civil_status', 'department')
