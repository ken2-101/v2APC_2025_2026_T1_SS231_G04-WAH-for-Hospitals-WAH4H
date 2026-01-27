from django.contrib import admin
from .models import DiagnosticReport, Specimen, ImagingStudy

@admin.register(DiagnosticReport)
class DiagnosticReportAdmin(admin.ModelAdmin):
    list_display = ('diagnostic_report_id', 'subject', 'code_display', 'effective_datetime', 'status')
    search_fields = ('subject__last_name', 'code_display')
    list_filter = ('status', 'category_display')

@admin.register(Specimen)
class SpecimenAdmin(admin.ModelAdmin):
    list_display = ('specimen_id', 'subject', 'type', 'collection_datetime', 'collector', 'status')
    search_fields = ('subject__last_name', 'type')
    list_filter = ('status', 'type')

@admin.register(ImagingStudy)
class ImagingStudyAdmin(admin.ModelAdmin):
    list_display = ('imaging_study_id', 'subject', 'modality', 'started', 'number_of_series', 'status')
    search_fields = ('subject__last_name', 'modality')
    list_filter = ('status', 'modality')