from django.contrib import admin
from .models import Admission

@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ('admission_id', 'patient', 'admission_date', 'ward', 'room', 'bed', 'attending_physician', 'status')
    list_filter = ('ward', 'status', 'admission_category', 'mode_of_arrival')
    search_fields = ('admission_id', 'patient__first_name', 'patient__last_name', 'attending_physician')
    ordering = ('-admission_date',)
