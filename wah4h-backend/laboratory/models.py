from django.db import models
from core.models import FHIRResourceModel, TimeStampedModel

class DiagnosticReport(FHIRResourceModel):
    diagnostic_report_id = models.AutoField(primary_key=True)
    subject = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='subject_id')
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id')
    performer = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='performer_id', null=True, blank=True, related_name='diagnostic_reports_performed')
    results_interpreter = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='results_interpreter_id', null=True, blank=True, related_name='diagnostic_reports_interpreted')
    result = models.ForeignKey('monitoring.Observation', on_delete=models.PROTECT, db_column='result_id', null=True, blank=True)
    specimen_id = models.IntegerField(null=True, blank=True)
    media_link_id = models.IntegerField(null=True, blank=True)
    based_on_id = models.IntegerField(null=True, blank=True)
    imaging_study_id = models.IntegerField(null=True, blank=True)
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