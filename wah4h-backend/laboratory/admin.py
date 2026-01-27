from django.contrib import admin
from .models import DiagnosticReport

@admin.register(DiagnosticReport)
class DiagnosticReportAdmin(admin.ModelAdmin):
    list_display = ('diagnostic_report_id', 'subject', 'code_display', 'effective_datetime', 'status')
    search_fields = ('subject__last_name', 'code_display')
    list_filter = ('status', 'category_display')