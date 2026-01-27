from django.db import models
from core.models import FHIRResourceModel, TimeStampedModel

class DiagnosticReport(FHIRResourceModel):
    diagnostic_report_id = models.AutoField(primary_key=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id')
    performer = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='performer_id', null=True, blank=True, related_name='diagnostic_reports_performed')
    results_interpreter = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='results_interpreter_id', null=True, blank=True, related_name='diagnostic_reports_interpreted')
    result = models.ForeignKey('monitoring.Observation', on_delete=models.PROTECT, db_column='result_id', null=True, blank=True)
    specimen = models.ForeignKey('laboratory.Specimen', on_delete=models.PROTECT, db_column='specimen_id', null=True, blank=True, related_name='diagnostic_reports')
    based_on = models.ForeignKey('admission.ServiceRequest', on_delete=models.PROTECT, db_column='based_on_id', null=True, blank=True, related_name='diagnostic_reports')
    imaging_study = models.ForeignKey('laboratory.ImagingStudy', on_delete=models.PROTECT, db_column='imaging_study_id', null=True, blank=True, related_name='diagnostic_reports')
    code_code = models.CharField(max_length=100, null=True, blank=True)
    code_display = models.CharField(max_length=100, null=True, blank=True)
    category_code = models.CharField(max_length=100, null=True, blank=True)
    category_display = models.CharField(max_length=100, null=True, blank=True)
    conclusion = models.CharField(max_length=255, null=True, blank=True)
    conclusion_code = models.CharField(max_length=100, null=True, blank=True)
    conclusion_display = models.CharField(max_length=100, null=True, blank=True)
    effective_datetime = models.DateTimeField(null=True, blank=True)
    effective_period_start = models.DateField(null=True, blank=True)
    effective_period_end = models.DateField(null=True, blank=True)
    issued_datetime = models.DateTimeField(null=True, blank=True)
    media_comment = models.CharField(max_length=255, null=True, blank=True)
    presented_form_url = models.URLField(max_length=255, null=True, blank=True)
    class Meta:
        db_table = 'diagnostic_report'

# Supporting Models

class Specimen(FHIRResourceModel):
    specimen_id = models.AutoField(primary_key=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    type = models.CharField(max_length=100, null=True, blank=True)
    collection_datetime = models.DateTimeField(null=True, blank=True)
    collection_method = models.CharField(max_length=255, null=True, blank=True)
    collection_body_site = models.CharField(max_length=255, null=True, blank=True)
    collector = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='collector_id', null=True, blank=True, related_name='collected_specimens')
    received_time = models.DateTimeField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    class Meta:
        db_table = 'specimen'

class ImagingStudy(FHIRResourceModel):
    imaging_study_id = models.AutoField(primary_key=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id', null=True, blank=True)
    started = models.DateTimeField(null=True, blank=True)
    modality = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    number_of_series = models.IntegerField(null=True, blank=True)
    number_of_instances = models.IntegerField(null=True, blank=True)
    interpreter = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='interpreter_id', null=True, blank=True, related_name='interpreted_imaging_studies')
    note = models.TextField(null=True, blank=True)
    class Meta:
        db_table = 'imaging_study'