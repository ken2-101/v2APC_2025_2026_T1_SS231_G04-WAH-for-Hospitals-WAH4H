from django.contrib import admin
from .models import Discharge

@admin.register(Discharge)
class DischargeAdmin(admin.ModelAdmin):
    # 'discharge_id' is the Primary Key.
    # 'encounter' and 'patient' are Foreign Keys.
    list_display = ('discharge_id', 'encounter', 'patient', 'discharge_datetime', 'workflow_status')
    search_fields = ('discharge_id', 'patient__last_name', 'workflow_status')
    list_filter = ('workflow_status', 'discharge_datetime')