from django.db import models
from core.models import FHIRResourceModel


class DiagnosticReport(FHIRResourceModel):
    diagnostic_report_id = models.AutoField(primary_key=True)
    subject_id = models.BigIntegerField(db_index=True)
    encounter_id = models.BigIntegerField(db_index=True)
    performer_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    results_interpreter_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    specimen_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    based_on_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    imaging_study_id = models.BigIntegerField(db_index=True, null=True, blank=True)
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
        db_table = 'laboratory_diagnostic_report'


class DiagnosticReportResult(models.Model):
    diagnostic_report_result_id = models.AutoField(primary_key=True)
    diagnostic_report = models.ForeignKey(
        DiagnosticReport,
        on_delete=models.CASCADE,
        related_name='results',
        db_column='diagnostic_report_id'
    )
    observation_id = models.BigIntegerField(db_index=True)
    item_sequence = models.IntegerField()

    class Meta:
        db_table = 'laboratory_diagnostic_report_result'
        ordering = ['item_sequence']


class Specimen(FHIRResourceModel):
    specimen_id = models.AutoField(primary_key=True)
    subject_id = models.BigIntegerField(db_index=True)
    type = models.CharField(max_length=100, null=True, blank=True)
    collection_datetime = models.DateTimeField(null=True, blank=True)
    collection_method = models.CharField(max_length=255, null=True, blank=True)
    collection_body_site = models.CharField(max_length=255, null=True, blank=True)
    collector_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    received_time = models.DateTimeField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'laboratory_specimen'


class ImagingStudy(FHIRResourceModel):
    imaging_study_id = models.AutoField(primary_key=True)
    subject_id = models.BigIntegerField(db_index=True)
    encounter_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    started = models.DateTimeField(null=True, blank=True)
    modality = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    number_of_series = models.IntegerField(null=True, blank=True)
    number_of_instances = models.IntegerField(null=True, blank=True)
    interpreter_id = models.BigIntegerField(db_index=True, null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'laboratory_imaging_study'