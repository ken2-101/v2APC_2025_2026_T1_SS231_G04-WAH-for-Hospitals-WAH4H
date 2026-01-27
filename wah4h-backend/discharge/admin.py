from django.contrib import admin
from .models import Discharge, Media

@admin.register(Discharge)
class DischargeAdmin(admin.ModelAdmin):
    # 'discharge_id' is the Primary Key.
    # 'encounter' and 'patient' are Foreign Keys.
    list_display = ('discharge_id', 'encounter', 'patient', 'discharge_datetime', 'workflow_status')
    search_fields = ('discharge_id', 'patient__last_name', 'workflow_status')
    list_filter = ('workflow_status', 'discharge_datetime')

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('media_id', 'content_type', 'status')
    search_fields = ('identifier', 'content_type')
    list_filter = ('status', 'content_type')