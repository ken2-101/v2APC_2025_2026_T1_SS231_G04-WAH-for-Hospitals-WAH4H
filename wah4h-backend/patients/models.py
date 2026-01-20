from django.db import models
from django.conf import settings


# ============================================================================
# BASE MODELS & MIXINS
# ============================================================================

class BaseModel(models.Model):
    """
    Abstract base model with common timestamp fields.
    All models should inherit from this to ensure consistent audit trails.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ============================================================================
# CHOICE CONSTANTS - Single Source of Truth
# ============================================================================

class ClinicalStatusChoices(models.TextChoices):
    """
    Standard clinical status choices for conditions and observations.
    Aligned with FHIR clinical-status value set.
    """
    ACTIVE = 'active', 'Active'
    RECURRENCE = 'recurrence', 'Recurrence'
    RELAPSE = 'relapse', 'Relapse'
    INACTIVE = 'inactive', 'Inactive'
    REMISSION = 'remission', 'Remission'
    RESOLVED = 'resolved', 'Resolved'


class VerificationStatusChoices(models.TextChoices):
    """
    Standard verification status choices for clinical resources.
    Aligned with FHIR verification-status value set.
    """
    UNCONFIRMED = 'unconfirmed', 'Unconfirmed'
    PROVISIONAL = 'provisional', 'Provisional'
    DIFFERENTIAL = 'differential', 'Differential'
    CONFIRMED = 'confirmed', 'Confirmed'
    REFUTED = 'refuted', 'Refuted'
    ENTERED_IN_ERROR = 'entered-in-error', 'Entered in Error'


class SeverityChoices(models.TextChoices):
    """
    Standard severity choices for clinical observations.
    """
    MILD = 'mild', 'Mild'
    MODERATE = 'moderate', 'Moderate'
    SEVERE = 'severe', 'Severe'


class CriticalityChoices(models.TextChoices):
    """
    Criticality choices for allergy/intolerance risk assessment.
    Aligned with FHIR allergy-intolerance-criticality value set.
    """
    LOW = 'low', 'Low'
    HIGH = 'high', 'High'
    UNABLE_TO_ASSESS = 'unable-to-assess', 'Unable to Assess'


# ============================================================================
# ABSTRACT MIXINS
# ============================================================================

# Note: ClinicalStatusMixin removed - not needed as models define their own fields


# Note: RecorderAsserterMixin removed - not needed as models define their own fields


# Note: SeverityMixin removed - models use SeverityChoices.choices instead


# ============================================================================
# PATIENT REGISTRATION MODULE
# ============================================================================

class Patient(BaseModel):
    """
    Core patient demographic and administrative data.
    Aligned with FHIR Patient resource and PHCore extensions.
    """
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('unknown', 'Unknown'),
    ]
    
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('unknown', 'Unknown'),
    ]
    
    CIVIL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
        ('separated', 'Separated'),
        ('unknown', 'Unknown'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    # Primary Key
    patient_id = models.AutoField(primary_key=True, db_column='PAT_patient_id')
    
    # Identifiers - FHIR identifier element
    identifier_philhealth = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PAT_identifier_philhealth'
    )
    identifier_pdd = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PAT_identifier_pdd'
    )
    identifier_philsys = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PAT_identifier_philsys'
    )
    identifier_national_id = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True, 
        db_column='PAT_identifier_national_id'
    )
    
    # Name - FHIR HumanName element
    first_name = models.CharField(max_length=50, db_column='PAT_first_name')
    middle_name = models.CharField(max_length=50, null=True, blank=True, db_column='PAT_middle_name')
    last_name = models.CharField(max_length=50, db_column='PAT_last_name')
    suffix = models.CharField(max_length=10, null=True, blank=True, db_column='PAT_suffix')
    
    # Demographics
    birthdate = models.DateField(db_column='PAT_birthdate')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, db_column='PAT_gender')
    sex = models.CharField(
        max_length=10, 
        choices=SEX_CHOICES, 
        null=True, 
        blank=True, 
        db_column='PAT_sex'
    )
    civil_status = models.CharField(
        max_length=10, 
        choices=CIVIL_STATUS_CHOICES, 
        null=True, 
        blank=True, 
        db_column='PAT_civil_status'
    )
    
    # Contact - FHIR ContactPoint element
    contact_number = models.CharField(max_length=15, null=True, blank=True, db_column='PAT_contact_number')
    email = models.EmailField(max_length=100, unique=True, null=True, blank=True, db_column='PAT_email')
    
    # Address - FHIR Address element (PHCore structure)
    street_address = models.CharField(max_length=100, null=True, blank=True, db_column='PAT_street_address')
    barangay = models.CharField(max_length=50, null=True, blank=True, db_column='PAT_barangay')
    city_municipality = models.CharField(max_length=50, null=True, blank=True, db_column='PAT_city_municipality')
    province = models.CharField(max_length=50, null=True, blank=True, db_column='PAT_province')
    region = models.CharField(max_length=50, null=True, blank=True, db_column='PAT_region')
    postal_code = models.CharField(max_length=10, null=True, blank=True, db_column='PAT_postal_code')
    country = models.CharField(max_length=50, null=True, blank=True, db_column='PAT_country')
    
    # PHCore Extensions - Philippine-specific fields
    extension_occupation = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        db_column='PAT_extension_occupation'
    )
    extension_ethnicity = models.CharField(
        max_length=50, 
        null=True, 
        blank=True, 
        db_column='PAT_extension_ethnicity'
    )
    extension_indigenous_group = models.CharField(
        max_length=50, 
        null=True, 
        blank=True, 
        db_column='PAT_extension_indigenous_group'
    )
    extension_religion = models.CharField(
        max_length=50, 
        null=True, 
        blank=True, 
        db_column='PAT_extension_religion'
    )
    extension_educational_attainment = models.CharField(
        max_length=50, 
        null=True, 
        blank=True, 
        db_column='PAT_extension_educational_attainment'
    )
    extension_citizenship = models.CharField(
        max_length=50, 
        null=True, 
        blank=True, 
        db_column='PAT_extension_citizenship'
    )
    extension_disability = models.TextField(
        null=True, 
        blank=True, 
        db_column='PAT_extension_disability'
    )
    
    # Deceased indicator - FHIR Patient.deceased[x]
    deceased = models.BooleanField(default=False, db_column='PAT_deceased')
    deceased_datetime = models.DateTimeField(null=True, blank=True, db_column='PAT_deceased_datetime')
    
    # Administrative
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='active', 
        db_column='PAT_status'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='PAT_created_by',
        related_name='created_patients'
    )

    class Meta:
        db_table = 'PATIENT'
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['identifier_philhealth']),
            models.Index(fields=['contact_number']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        """Returns the full name of the patient."""
        parts = [self.first_name, self.middle_name, self.last_name, self.suffix]
        return ' '.join(filter(None, parts))


class AllergyIntolerance(BaseModel):
    """
    FHIR AllergyIntolerance resource - records risk of harmful reactions.
    """
    TYPE_CHOICES = [
        ('allergy', 'Allergy'),
        ('intolerance', 'Intolerance'),
    ]
    
    CATEGORY_CHOICES = [
        ('food', 'Food'),
        ('medication', 'Medication'),
        ('environment', 'Environment'),
        ('biologic', 'Biologic'),
        ('other', 'Other'),
    ]

    allergy_id = models.AutoField(primary_key=True, db_column='ALG_allergy_id')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, db_column='ALG_patient_id', related_name='allergies')
    clinical_status = models.CharField(max_length=20, choices=ClinicalStatusChoices.choices, null=True, blank=True, db_column='ALG_clinical_status')
    verification_status = models.CharField(max_length=20, choices=VerificationStatusChoices.choices, null=True, blank=True, db_column='ALG_verification_status')
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, null=True, blank=True, db_column='ALG_type')
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, db_column='ALG_category')
    criticality = models.CharField(max_length=20, choices=CriticalityChoices.choices, db_column='ALG_criticality')
    code = models.CharField(max_length=100, db_column='ALG_code')
    code_system = models.CharField(max_length=100, null=True, blank=True, db_column='ALG_code_system')
    code_display = models.CharField(max_length=200, null=True, blank=True, db_column='ALG_code_display')
    onset_datetime = models.DateTimeField(null=True, blank=True, db_column='ALG_onset_datetime')
    recorded_date = models.DateTimeField(db_column='ALG_recorded_date')
    recorder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, db_column='ALG_recorder_id', related_name='recorded_allergies')
    asserter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, db_column='ALG_asserter_id', related_name='asserted_allergies')
    last_occurrence = models.DateTimeField(null=True, blank=True, db_column='ALG_last_occurrence')
    reaction_severity = models.CharField(max_length=10, choices=SeverityChoices.choices, null=True, blank=True, db_column='ALG_reaction_severity')
    reaction_manifestation = models.CharField(max_length=100, null=True, blank=True, db_column='ALG_reaction_manifestation')
    reaction_description = models.TextField(null=True, blank=True, db_column='ALG_reaction_description')
    note = models.TextField(null=True, blank=True, db_column='ALG_note')

    class Meta:
        db_table = 'ALLERGY_INTOLERANCE'
        verbose_name = 'Allergy/Intolerance'
        verbose_name_plural = 'Allergies/Intolerances'

    def __str__(self):
        return f"{self.patient} - {self.code_display or self.code}"


class Condition(BaseModel):
    """
    FHIR Condition resource - clinical conditions, problems, diagnoses.
    """
    CATEGORY_CHOICES = [
        ('problem-list-item', 'Problem List Item'),
        ('encounter-diagnosis', 'Encounter Diagnosis'),
    ]

    condition_id = models.AutoField(primary_key=True, db_column='COND_condition_id')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, db_column='COND_patient_id', related_name='conditions')
    encounter = models.ForeignKey('admissions.Admission', on_delete=models.SET_NULL, null=True, blank=True, db_column='COND_encounter_id', related_name='conditions')
    clinical_status = models.CharField(max_length=15, choices=ClinicalStatusChoices.choices, null=True, blank=True, db_column='COND_clinical_status')
    verification_status = models.CharField(max_length=20, choices=VerificationStatusChoices.choices, null=True, blank=True, db_column='COND_verification_status')
    category = models.CharField(max_length=25, choices=CATEGORY_CHOICES, null=True, blank=True, db_column='COND_category')
    severity = models.CharField(max_length=10, choices=SeverityChoices.choices, null=True, blank=True, db_column='COND_severity')
    code_icd10 = models.CharField(max_length=20, null=True, blank=True, db_column='COND_code_icd10')
    code_icd11 = models.CharField(max_length=20, null=True, blank=True, db_column='COND_code_icd11')
    diagnosis_text = models.TextField(db_column='COND_diagnosis_text')
    body_site = models.CharField(max_length=100, null=True, blank=True, db_column='COND_body_site')
    onset_date = models.DateField(null=True, blank=True, db_column='COND_onset_date')
    abatement_date = models.DateField(null=True, blank=True, db_column='COND_abatement_date')
    recorded_date = models.DateTimeField(db_column='COND_recorded_date')
    recorder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, db_column='COND_recorder_id', related_name='recorded_conditions')
    asserter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, db_column='COND_asserter_id', related_name='asserted_conditions')
    note = models.TextField(null=True, blank=True, db_column='COND_note')

    class Meta:
        db_table = 'CONDITION'
        verbose_name = 'Condition'
        verbose_name_plural = 'Conditions'

    def __str__(self):
        return f"{self.patient} - {self.diagnosis_text[:50]}"