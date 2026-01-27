from django.db import models
from core.models import TimeStampedModel, FHIRResourceModel

# ==================== STUB MODELS (Mirror Models for FK Targets) ====================

class Media(FHIRResourceModel):
    """Stub model: Media - for diagnostic report media references"""
    media_id = models.AutoField(primary_key=True)
    content_type = models.CharField(max_length=100, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    class Meta:
        db_table = 'media'

# ==================== CORE MODELS ====================

class Discharge(TimeStampedModel):
    discharge_id = models.AutoField(primary_key=True)
    encounter = models.ForeignKey('admission.Encounter', on_delete=models.PROTECT, db_column='encounter_id')
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT, db_column='patient_id')
    physician = models.ForeignKey('accounts.Practitioner', on_delete=models.PROTECT, db_column='physician_id', null=True, blank=True)
    discharge_datetime = models.DateTimeField(null=True, blank=True)
    discharge_instructions = models.TextField(null=True, blank=True)
    summary_of_stay = models.TextField(null=True, blank=True)
    pending_items = models.TextField(null=True, blank=True)
    follow_up_plan = models.CharField(max_length=255, null=True, blank=True)
    created_by = models.CharField(max_length=255, null=True, blank=True)
    workflow_status = models.CharField(max_length=100, null=True, blank=True)
    notice_datetime = models.DateTimeField(null=True, blank=True)
    billing_cleared_datetime = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = 'discharge'