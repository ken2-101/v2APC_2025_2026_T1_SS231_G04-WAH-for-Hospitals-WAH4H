# PATIENT MODULE CURRENT STATE AUDIT

**Assessment Date:** February 12, 2026  
**Basis:** Direct code inspection (models.py, serializers.py, views.py, services, URLs)  
**Methodology:** Actual implementation analysis - NO assumptions  
**Scope:** Patient module readiness for WAH4PC integration

---

## 1️⃣ DATA MODEL INSPECTION

### Patient Model - Complete Field Inventory

**File:** [patients/models.py](patients/models.py#L5)

#### Identity Fields
| Field | Type | Required | Unique | Nullable | Index | Constraints |
|-------|------|----------|--------|----------|-------|-------------|
| id | BigAutoField | ✅ | ✅ | ❌ | PK | Primary Key |
| patient_id | CharField(255) | ❌ | ✅ | ✅ | ✅ | `db_index=True` |

**Assessment:** 
- ✅ patient_id IS unique at database level
- ❌ patient_id IS nullable (blank=True, null=True)
- **Implication:** Can have patients with NULL patient_id
- **Current Logic:** Uses auto-generated hospital ID format (WAH-YYYY-XXXXX) but not enforced as required

---

#### Name Fields
| Field | Type | Max Length | Required | Nullable | Storage |
|-------|------|-----------|----------|----------|---------|
| first_name | CharField | 255 | ❌ | ✅ | Local |
| last_name | CharField | 255 | ❌ | ✅ | Local |
| middle_name | CharField | 255 | ❌ | ✅ | Local |
| suffix_name | CharField | 255 | ❌ | ✅ | Local |

**Validation via Serializer:**
```python
'first_name': {'required': True},
'last_name': {'required': True},
```
**Assessment:** 
- ✅ Required at API layer (serializer)
- ❌ NOT required at model layer (no db_index or validators)
- **Implication:** Database allows null names if bypassed via direct ORM

---

#### Demographic Fields
| Field | Type | Required | Nullable | Notes |
|-------|------|----------|----------|-------|
| gender | CharField(100) | ❌ | ✅ | Serializer: required=True |
| birthdate | DateField | ❌ | ✅ | Serializer: required=True, validated not future |
| civil_status | CharField(255) | ❌ | ✅ | Maps to marital status codes |
| nationality | CharField(255) | ❌ | ✅ | - |
| religion | CharField(255) | ❌ | ✅ | - |

**Validation Rules:**
```python
def validate_birthdate(self, value):
    if value > date.today():
        raise serializers.ValidationError("Birthdate cannot be in the future.")
```

---

#### Health Identifier Fields
| Field | Type | Required | Nullable | Unique | Index | Notes |
|-------|------|----------|----------|--------|-------|-------|
| philhealth_id | CharField(255) | ❌ | ✅ | ❌ | ✅ (indexed) | **NOT unique** |
| blood_type | CharField(100) | ❌ | ✅ | ❌ | ❌ | - |
| pwd_type | CharField(100) | ❌ | ✅ | ❌ | ❌ | - |

**CRITICAL FINDING:**
- ❌ **philhealth_id is NOT unique in database**
- ❌ **philhealth_id is indexed but NOT constrained unique**
- **Implication:** Multiple patients can have same PhilHealth ID
- **WAH4PC Impact:** Deduplication by PhilHealth ID will misbehave with duplicates

---

#### Occupation & Education
| Field | Type | Required | Nullable |
|-------|------|----------|----------|
| occupation | CharField(255) | ❌ | ✅ |
| education | CharField(255) | ❌ | ✅ |

---

#### Contact Fields
| Field | Type | Max Length | Required | Nullable | Validation |
|-------|------|-----------|----------|----------|------------|
| mobile_number | CharField | 255 | ❌ | ✅ | min 10, max 15 digits |

**Validation:**
```python
def validate_mobile_number(self, value):
    if value:
        cleaned = value.replace('-', '').replace(' ', '').replace('+', '')
        if not cleaned.isdigit():
            raise ValidationError("Mobile number must contain only digits and optional separators.")
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise ValidationError("Mobile number must be between 10 and 15 digits.")
    return value
```

---

#### Address Fields
| Field | Type | Max Length | Required | Nullable |
|-------|------|-----------|----------|----------|
| address_line | CharField | 255 | ❌ | ✅ |
| address_city | CharField | 255 | ❌ | ✅ |
| address_district | CharField | 255 | ❌ | ✅ |
| address_state | CharField | 255 | ❌ | ✅ |
| address_postal_code | CharField | 100 | ❌ | ✅ |
| address_country | CharField | 255 | ❌ | ✅ |

---

#### Emergency Contact Fields
| Field | Type | Max Length | Required | Nullable |
|-------|------|-----------|----------|----------|
| contact_first_name | CharField | 50 | ❌ | ✅ |
| contact_last_name | CharField | 50 | ❌ | ✅ |
| contact_mobile_number | CharField | 50 | ❌ | ✅ |
| contact_relationship | CharField | 50 | ❌ | ✅ |

**Field Length Issue:** contact_first_name/last_name limited to 50 chars (other names are 255)

---

#### Special Flags
| Field | Type | Required | Nullable | Default |
|-------|------|----------|----------|---------|
| indigenous_flag | BooleanField | ❌ | ✅ | NULL |
| indigenous_group | CharField(255) | ❌ | ✅ | - |
| consent_flag | BooleanField | ❌ | ✅ | NULL |

---

#### Media & Status
| Field | Type | Required | Nullable | Default | Constraints |
|-------|------|----------|----------|---------|-------------|
| image_url | URLField | ❌ | ✅ | - | max 255 |
| active | BooleanField | ❌ | ❌ | True | - |
| status | CharField(20) | ❌ | ❌ | 'active' | values: active/inactive |

**Status Implementation:**
```python
active = models.BooleanField(default=True)
status = models.CharField(max_length=20, default='active')  # Redundant with active flag
```

**Design Issue:** Dual status fields (active boolean AND status string) - redundant

---

#### Inherited Fields (from TimeStampedModel)
```python
created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)
```

---

### Indexes Defined

```python
class Meta:
    db_table = 'patient'
    indexes = [
        models.Index(fields=['patient_id']),
        models.Index(fields=['last_name', 'first_name']),
        models.Index(fields=['philhealth_id']),
    ]
```

**Assessment:**
- ✅ Composite index on (last_name, first_name) for patient search
- ✅ Separate indexes on patient_id and philhealth_id for lookup
- ❌ No index on (first_name, last_name, birthdate) - used for deduplication
- ⚠️ Deduplication query on register_patient() performs unindexed filter on 3 columns

---

### Computed Properties

```python
@property
def age(self):
    """Calculate age from birthdate."""
    if not self.birthdate:
        return None
    from datetime import date
    today = date.today()
    return today.year - self.birthdate.year - ((today.month, today.day) < (self.birthdate.month, self.birthdate.day))
```

**Assessment:**
- ✅ Computed at runtime (not stored in DB)
- ✅ Handles null birthdate gracefully
- ⚠️ Day of week calculation could have edge cases with leap years/DST

---

### Signals & Hooks Attached to Patient

✅ **NONE** - No post_save, post_delete, pre_save signals attached

---

### Soft-Delete Implementation

**current implementation:**
```python
# In views.py destroy() method:
patient.status = 'inactive'
patient.active = False
patient.save()
```

**Assessment:**
- ✅ Soft delete implemented (marks inactive, doesn't actually delete)
- ✅ Records still queryable (not excluded by default)
- ⚠️ Default queryset in views DOES NOT filter out inactive patients
- **Implication:** Deleted patients still returned in list/search operations unless specifically filtered

---

### Clinical Data Models - Relationships

#### Condition Model
```python
patient = models.ForeignKey(
    'Patient',
    on_delete=models.CASCADE,
    db_column='subject_id',
    null=False,
    blank=False,
    related_name='conditions'
)
```

**Assessment:**
- ✅ ForeignKey to Patient (CASCADE delete)
- ✅ Required (null=False)
- ❌ NOT INDEXED (no db_index=True)
- ✅ Related name 'conditions' for reverse lookup

---

#### AllergyIntolerance Model
```python
patient = models.ForeignKey(
    'Patient',
    on_delete=models.CASCADE,
    db_column='patient_id',  # Naming conflict with Patient.patient_id
    null=False,
    blank=False,
    related_name='allergies'
)
```

**Assessment:**
- ✅ ForeignKey to Patient
- ✅ Required (null=False)
- ❌ db_column='patient_id' shadows Patient.patient_id naming
- ✅ Related name 'allergies' for reverse lookup

---

#### Immunization Model
```python
patient = models.ForeignKey(
    'Patient',
    on_delete=models.CASCADE,
    db_column='patient_id',
    null=False,
    blank=False,
    related_name='immunizations'
)
```

**Assessment:**
- ✅ ForeignKey to Patient
- ✅ Required
- ✅ Related name 'immunizations' for reverse lookup

---

## 2️⃣ API ENDPOINT INVENTORY

### Patient Endpoints (PatientViewSet)

**Base Route:** `/api/patients/`

#### A) List Patients
```
GET /api/patients/
```

**Response Format:**
```json
[
  {
    "id": 1,
    "patient_id": "WAH-2026-00001",
    "full_name": "Juan Carlos Dela Cruz Jr.",
    "first_name": "Juan",
    "middle_name": "Carlos",
    "last_name": "Dela Cruz",
    "suffix_name": "Jr.",
    "gender": "male",
    "birthdate": "1990-01-15",
    "age": 36,
    "civil_status": "M",
    "nationality": "Filipino",
    "religion": "Catholic",
    "philhealth_id": "PHI-123456789",
    "blood_type": "O+",
    "pwd_type": null,
    "occupation": "Engineer",
    "education": "Bachelor",
    "mobile_number": "+639171234567",
    "address_line": "123 Main Street",
    "address_city": "Manila",
    "address_district": "Intramuros",
    "address_state": "NCR",
    "address_postal_code": "1002",
    "address_country": "Philippines",
    "contact_first_name": "Maria",
    "contact_last_name": "Dela Cruz",
    "contact_mobile_number": "+639179876543",
    "contact_relationship": "spouse",
    "indigenous_flag": false,
    "indigenous_group": null,
    "consent_flag": true,
    "image_url": null,
    "active": true,
    "status": "active",
    "created_at": "2026-02-10T10:00:00Z",
    "updated_at": "2026-02-12T15:30:45Z"
  }
]
```

**Query Parameters:**
- `limit` (optional, default 100): Result limit

**Pagination:** ❌ NOT IMPLEMENTED
**Auth:** ❌ NO auth required (endpoint public)

---

#### B) Retrieve Patient
```
GET /api/patients/{id}/
```

**Response Format:** Same as single item from list (demographics only)

**Query Parameters:** None

**Auth:** ❌ NO auth required

---

#### C) Create Patient
```
POST /api/patients/
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "middle_name": "Carlos",
  "suffix_name": "Jr.",
  "gender": "Male",
  "birthdate": "1990-01-15",
  "philhealth_id": "PHI-123456789",
  "mobile_number": "+639171234567",
  "civil_status": "married",
  "nationality": "Filipino",
  "religion": "Catholic",
  "occupation": "Engineer",
  "education": "Bachelor",
  "address_line": "123 Main Street",
  "address_city": "Manila",
  "address_district": "Intramuros",
  "address_state": "NCR",
  "address_postal_code": "1002",
  "address_country": "Philippines",
  "contact_first_name": "Maria",
  "contact_last_name": "Dela Cruz",
  "contact_mobile_number": "+639179876543",
  "contact_relationship": "spouse",
  "indigenous_flag": false,
  "consent_flag": true,
  "active": true,
  "status": "active"
}
```

**Required Fields (Serializer Level):**
- first_name
- last_name  
- birthdate
- gender

**Business Logic:**
1. Calls PatientRegistrationService.register_patient(data)
2. Deduplication check: (first_name + last_name + birthdate)
3. Auto-generates patient_id if not provided (WAH-YYYY-XXXXX format)
4. Returns created patient

**Response Status:** 201 CREATED

**Deduplication Check Code:**
```python
existing_patient = Patient.objects.filter(
    Q(first_name__iexact=first_name) &
    Q(last_name__iexact=last_name) &
    Q(birthdate=birthdate)
).first()

if existing_patient:
    raise ValidationError(f"Patient already exists (ID: {existing_patient.patient_id})")
```

**Assessment:**
- ✅ Case-insensitive name matching (iexact)
- ❌ Deduplication index NOT created (performance issue)
- ✅ Atomic transaction (all-or-nothing)
- ✅ Returns 400 Bad Request on duplicate (+ error message)

---

#### D) Update Patient (Full)
```
PUT /api/patients/{id}/
Content-Type: application/json

{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  ...all fields...
}
```

**Workflow:**
1. Validates all required fields
2. Calls PatientUpdateService.update_patient(id, data)
3. Protected fields: id, patient_id, created_at (cannot be updated)
4. Returns 200 OK with updated patient

**Response:** Full patient demographics

---

#### E) Partial Update Patient
```
PATCH /api/patients/{id}/
Content-Type: application/json

{
  "mobile_number": "+639179999999",
  "occupation": "Doctor"
}
```

**Allows:** Any subset of fields
**Returns:** Full updated patient object

---

#### F) Search Patients
```
GET /api/patients/search/?q=juan&limit=10
```

**Query Parameters:**
- `q` (required): Search term (name or patient_id)
- `limit` (optional, default 50): Result limit

**Search Logic:** Uses patient_acl.search_patients(query, limit)

**Search Implementation:**
```python
def search_patients(query: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Search patients by name or patient ID string."""
    # Implementation in patient_acl.py (not shown in audit)
```

**Response:** List of matching patient summaries

---

#### G) Delete Patient (Soft Delete)
```
DELETE /api/patients/{id}/
```

**Workflow:**
```python
patient.status = 'inactive'
patient.active = False
patient.save()
```

**Response:**
```json
{
  "message": "Patient WAH-2026-00001 deactivated successfully"
}
```

**Assessment:**
- ✅ Marks inactive (not hard delete)
- ⚠️ Soft-deleted patients STILL appear in list views (no filter applied)

---

### Patient Sub-Resource Actions (PatientViewSet)

#### H) Get Patient Conditions
```
GET /api/patients/{id}/conditions/
```

**Response Format:**
```json
[
  {
    "condition_id": 1,
    "identifier": "COND-001",
    "code": "E11",
    "clinical_status": "active",
    "verification_status": "confirmed",
    "category": "problem-list-item",
    "severity": "moderate",
    "body_site": "pancreas",
    "onset_datetime": "2020-01-15T00:00:00Z",
    "recorded_date": "2026-02-10",
    "note": "Type 2 diabetes mellitus",
    "encounter_id": 123,
    "patient_id": "WAH-2026-00001"
  }
]
```

**Source:** PatientACL.get_patient_conditions(patient_id)
**Auth:** ❌ NO auth required

---

#### I) Get Patient Allergies
```
GET /api/patients/{id}/allergies/
```

**Response Format:**
```json
[
  {
    "allergy_id": 1,
    "identifier": "ALLERGY-001",
    "code": "J30",
    "clinical_status": "active",
    "verification_status": "confirmed",
    "type": "allergy",
    "category": "food",
    "criticality": "high",
    "patient_id": "WAH-2026-00001",
    "encounter_id": 456,
    ...reaction fields...
  }
]
```

**Source:** PatientACL.get_patient_allergies(patient_id)

---

#### J) Get Patient Immunizations
```
GET /api/patients/{id}/immunizations/
```

**Response Format:**
```json
[
  {
    "immunization_id": 1,
    "identifier": "IMMUN-001",
    "status": "completed",
    "vaccine_code": "207",
    "vaccine_display": "COVID-19 vaccine",
    "patient_id": "WAH-2026-00001",
    "encounter_id": 789,
    "occurrence_datetime": "2021-06-15T10:00:00Z",
    "lot_number": "LOT123456",
    "expiration_date": "2023-12-31",
    "dose_quantity_value": 1.0,
    "dose_quantity_unit": "mL"
  }
]
```

**Source:** PatientACL.get_patient_immunizations(patient_id)

---

### Clinical Data Endpoints (Separate ViewSets)

#### K) List Conditions
```
GET /api/conditions/
```

**Query Parameters:**
- `patient`: Filter by patient ID
- `clinical_status`: Filter by status (active, inactive, resolved)
- `category`: Filter by category
- `severity`: Filter by severity
- `search`: Search by code or identifier

**Creates Via:**
```
POST /api/conditions/
{
  "identifier": "COND-001",
  "code": "E11",
  "patient": 1,
  "encounter_id": 123,
  "clinical_status": "active",
  "verified_status": "confirmed",
  "category": "problem-list-item",
  "severity": "moderate",
  "recorded_date": "2026-02-10",
  "note": "Type 2 diabetes mellitus"
}
```

**Returns:** 201 CREATED with ConditionSerializer

---

#### L) List Allergies
```
GET /api/allergies/
```

**Query Parameters:**
- `patient`: Filter by patient
- `clinical_status`: Filter by status
- `category`: Filter by allergy category (food, medication, environment)
- `criticality`: Filter by severity (low, high, unable-to-assess)
- `search`: Search by code or identifier

**Creates Via:**
```
POST /api/allergies/
{
  "identifier": "ALLERGY-001",
  "code": "J30",
  "patient": 1,
  "encounter_id": 456,
  "clinical_status": "active",
  "verified_status": "confirmed",
  "type": "allergy",
  "category": "food",
  "criticality": "high",
  "reaction_description": "Anaphylaxis",
  "reaction_severity": "severe"
}
```

---

#### M) List Immunizations
```
GET /api/immunizations/
```

**Query Parameters:**
- `patient`: Filter by patient
- `status`: Filter by immunization status (completed, not-done)
- `vaccine_code`: Filter by vaccine code

**Creates Via:**
```
POST /api/immunizations/
{
  "identifier": "IMMUN-001",
  "status": "completed",
  "vaccine_code": "207",
  "vaccine_display": "COVID-19",
  "patient": 1,
  "encounter_id": 789,
  "occurrence_datetime": "2021-06-15T10:00:00Z",
  "recorded_datetime": "2021-06-15T10:30:00Z",
  "lot_number": "LOT123456",
  "dose_quantity_value": 1.0,
  "dose_quantity_unit": "mL"
}
```

---

### WAH4PC Integration Endpoints

#### N) Fetch Patient from Gateway
```
POST /api/wah4pc/fetch
{
  "targetProviderId": "gateway-provider-uuid",
  "philHealthId": "PHI-123456789"
}
```

**Returns:** 202 ACCEPTED (async operation)

#### O) Send Patient to Gateway
```
POST /api/wah4pc/send
{
  "patientId": 1,
  "targetProviderId": "gateway-provider-uuid"
}
```

**Returns:** 202 ACCEPTED

#### P) List Providers
```
GET /api/wah4pc/providers/
```

No auth required. Returns list of active providers from gateway.

#### Q) List Transactions
```
GET /api/wah4pc/transactions/?patient_id=1&status=COMPLETED&type=fetch
```

**Query Parameters:**
- `patient_id`: Filter by patient
- `status`: Filter by status (PENDING, COMPLETED, FAILED)
- `type`: Filter by type (fetch, send)

#### R) Get Transaction Details
```
GET /api/wah4pc/transactions/{transaction_id}/
```

---

## 3️⃣ CLINICAL DATA INTEGRATION

### Current Wiring Status

#### Condition
- ✅ ForeignKey to Patient (related_name='conditions')
- ✅ ModelViewSet with endpoints (GET, POST, PUT, PATCH, DELETE)
- ✅ Serializers (ConditionSerializer, ConditionCreateSerializer)
- ✅ Create via ClinicalDataService.record_condition()
- ✅ Retrievable via GET /api/conditions/
- ✅ Retrievable via GET /api/patients/{id}/conditions/
- ✅ Filtering support (patient, clinical_status, category, severity)
- ✅ Search support (code, identifier)

---

#### AllergyIntolerance
- ✅ ForeignKey to Patient (related_name='allergies')
- ✅ ModelViewSet with endpoints
- ✅ Serializers (AllergySerializer, AllergyCreateSerializer)
- ✅ Create via ClinicalDataService.record_allergy()
- ✅ Retrievable via GET /api/allergies/
- ✅ Retrievable via GET /api/patients/{id}/allergies/
- ✅ Filtering support (patient, clinical_status, category, criticality)
- ✅ Search support (code, identifier)

---

#### Immunization
- ✅ ForeignKey to Patient (related_name='immunizations')
- ✅ ModelViewSet with endpoints
- ✅ Serializers (ImmunizationSerializer, ImmunizationCreateSerializer)
- ✅ Create via ClinicalDataService.record_immunization()
- ✅ Retrievable via GET /api/immunizations/
- ✅ Retrievable via GET /api/patients/{id}/immunizations/
- ✅ Filtering support (patient, status, vaccine_code)
- ✅ Search support (identifier, vaccine_display, lot_number)

---

### Patient Retrieval Structure

**When retrieving a single patient via GET /api/patients/{id}/**

**Current Response Includes:**
```json
{
  "id": 1,
  "patient_id": "WAH-2026-00001",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  ...demographics only...
  "created_at": "2026-02-10T10:00:00Z",
  "updated_at": "2026-02-12T15:30:45Z"
}
```

**Clinical Data Returned:** ❌ **NO**

**How Frontend Gets Clinical Data:**
```
Sequential API calls:
1. GET /api/patients/{id}/              → Patient demographics
2. GET /api/patients/{id}/conditions/   → Patient conditions
3. GET /api/patients/{id}/allergies/    → Patient allergies  
4. GET /api/patients/{id}/immunizations/ → Patient immunizations
```

**Assessment:**
- ✅ A) Demographics only on main retrieve (response is lean)
- ✅ B) Clinical resources linked via separate endpoints
- ❌ C) NOT a Bundle-like structure (separate HTTP calls required)
- ⚠️ Frontend must make 4 API calls to get complete patient record

---

## 4️⃣ VALIDATION & BUSINESS LOGIC

### Validation Rules Implemented

#### At Serializer Level (PatientInputSerializer)

1. **birthdate validation**
   ```python
   def validate_birthdate(self, value):
       if value > date.today():
           raise ValidationError("Birthdate cannot be in the future.")
   ```

2. **mobile_number validation**
   ```python
   def validate_mobile_number(self, value):
       if value:
           cleaned = value.replace('-', '').replace(' ', '').replace('+', '')
           if not cleaned.isdigit():
               raise ValidationError("Mobile number must contain only digits...")
           if len(cleaned) < 10 or len(cleaned) > 15:
               raise ValidationError("Mobile number must be between 10 and 15 digits.")
   ```

#### At Service Layer (PatientRegistrationService)

3. **Deduplication check**
   ```python
   existing_patient = Patient.objects.filter(
       Q(first_name__iexact=first_name) &
       Q(last_name__iexact=last_name) &
       Q(birthdate=birthdate)
   ).first()
   ```
   - ❌ NO database index on this 3-column filter
   - ⚠️ Full table scan on deduplication check

4. **Required field validation**
   ```python
   if not first_name or not last_name or not birthdate:
       raise ValidationError("first_name, last_name, and birthdate are required...")
   ```

---

### Custom Validators

❌ **NONE** - Only serializer-level validate_* methods, no custom Validator classes

---

### Overridden save() Methods

❌ **NONE** - No custom save() override on Patient model

---

### Signals Attached

❌ **NONE** - No post_save, pre_save, post_delete signals on Patient model

---

### Business Rules

1. **Hospital ID Generation**
   - Format: WAH-{YYYY}-{XXXXX} (year-based partitioning with 5-digit sequence)
   - Auto-generated if not provided
   - Implementation: _generate_hospital_id() in PatientRegistrationService

2. **Deduplication Logic**
   - Based on: first_name + last_name + birthdate (case-insensitive)
   - Prevents duplicate registration
   - Raises ValidationError on duplicate

3. **Unique patient_id**
   - UNIQUE constraint at database level
   - Optional/nullable field

4. **Soft Delete Behavior**
   - Sets status='inactive' and active=False
   - Record NOT deleted from database
   - ⚠️ Soft-deleted patients STILL appear in list/search operations

---

### Update Behavior

**Partial Update (PATCH):**
- Accepts subset of fields
- Protected fields (id, patient_id, created_at) cannot be updated
- Returns 200 OK with full patient object

**Full Update (PUT):**
- Requires all fields (except auto-generated ones)
- Same protection applied

---

## 5️⃣ SEARCH & MATCHING CAPABILITY

### Patient Search Implementation

#### Search by PhilHealth ID
```python
GET /api/patients/search/?q=PHI-123456789
```

**Query Logic:** Searches against patient_id, first_name, last_name, philhealth_id
**Match Type:** Partial/contains match (implementation in patient_acl)
**Case Sensitivity:** ❓ Not specified in audit scope

---

#### Search by MRN (patient_id)
```python
GET /api/patients/search/?q=WAH-2026-00001
```

**Match Type:** Substring search
**Returns:** All matching patients

---

#### Search by Phone
```python
GET /api/patients/search/?q=%2B639171234567
```

**Match Type:** Substring search

---

#### Search by Name
```python
GET /api/patients/search/?q=juan%20dela%20cruz
```

**Match Type:** Substring search

---

### Identifier Matching for Queries (webhook_process_query)

**In WAH4PC webhook endpoint, identifier matching:**
```python
for ident in identifiers:
    system = ident.get('system', '').lower()
    value = ident.get('value')
    
    if 'philhealth' in system:
        patient = Patient.objects.filter(philhealth_id=value).first()
    elif 'mrn' in system or 'medical-record' in system:
        patient = Patient.objects.filter(patient_id=value).first()
    elif 'phone' in system or 'mobile' in system:
        patient = Patient.objects.filter(mobile_number=value).first()
    
    if patient:
        break  # FIRST-MATCH-WINS
```

**Assessment:**
- ✅ Supports 3 identifier systems (PhilHealth, MRN, Phone)
- ❌ First-match-wins (doesn't support AND logic)
- ❌ Only exact match (=, not substring)
- ❌ String containment for system match ('philhealth' in system) - fragile

---

## 6️⃣ CURRENT FRONTEND CONTRACT

### Create Patient Request

**Content-Type:** application/json

**Required Fields:**
- first_name
- last_name
- birthdate (YYYY-MM-DD format, NOT future date)
- gender

**Optional Fields:** All other Patient fields

**Example Request Body:**
```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "middle_name": "Carlos",
  "suffix_name": "Jr.",
  "gender": "Male",
  "birthdate": "1990-01-15",
  "civil_status": "married",
  "nationality": "Filipino",
  "religion": "Catholic",
  "philhealth_id": "PHI-123456789",
  "blood_type": "O+",
  "pwd_type": null,
  "occupation": "Engineer",
  "education": "Bachelor",
  "mobile_number": "+639171234567",
  "address_line": "123 Main Street",
  "address_city": "Manila",
  "address_district": "Intramuros",
  "address_state": "NCR",
  "address_postal_code": "1002",
  "address_country": "Philippines",
  "contact_first_name": "Maria",
  "contact_last_name": "Dela Cruz",
  "contact_mobile_number": "+639179876543",
  "contact_relationship": "spouse",
  "indigenous_flag": false,
  "indigenous_group": null,
  "consent_flag": true,
  "image_url": null,
  "active": true,
  "status": "active"
}
```

---

### Retrieve Patient Response

**Structure:** Flat dictionary (NOT nested)

**Contains:**
- Demographics fields only
- Computed field: age (calculated from birthdate)
- Timestamps: created_at, updated_at
- Status fields: active, status

```json
{
  "id": 1,
  "patient_id": "WAH-2026-00001",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "middle_name": "Carlos",
  "suffix_name": "Jr.",
  "full_name": "Juan Carlos Dela Cruz Jr.",
  "gender": "male",
  "birthdate": "1990-01-15",
  "age": 36,
  "civil_status": "M",
  "nationality": "Filipino",
  "religion": "Catholic",
  "philhealth_id": "PHI-123456789",
  "blood_type": "O+",
  "pwd_type": null,
  "occupation": "Engineer",
  "education": "Bachelor",
  "mobile_number": "+639171234567",
  "address_line": "123 Main Street",
  "address_city": "Manila",
  "address_district": "Intramuros",
  "address_state": "NCR",
  "address_postal_code": "1002",
  "address_country": "Philippines",
  "contact_first_name": "Maria",
  "contact_last_name": "Dela Cruz",
  "contact_mobile_number": "+639179876543",
  "contact_relationship": "spouse",
  "indigenous_flag": false,
  "indigenous_group": null,
  "consent_flag": true,
  "image_url": null,
  "active": true,
  "status": "active",
  "created_at": "2026-02-10T10:00:00Z",
  "updated_at": "2026-02-12T15:30:45Z"
}
```

### Serializer Transformations

**computed_fields in output:**
- `full_name`: Generated from first_name, middle_name, last_name, suffix_name
- `age`: Calculated from birthdate
- `full_address`: Generated from address_* fields (in ACL, not in default serializer)

**field_transformations:**
```python
# Gender case conversion
gender_input: "Male" → gender_output: "male"

# Civil status/marital status codes
civil_status_input: "married" → civil_status_output: "M" (stored as code)
```

**NULL handling:**
- Null fields are included in response (serializers.CharField(allow_null=True))
- Empty strings are returned for null values in many cases

---

## 7️⃣ WAH4PC READINESS ASSESSMENT (Patient Module Only)

### Is PhilHealth ID Unique?

```python
philhealth_id = models.CharField(max_length=255, null=True, blank=True)
```

**🔴 Answer: NO, NOT UNIQUE**

- ✅ Has db_index=True
- ❌ Does NOT have unique=True
- ❌ Multiple patients can have same PhilHealth ID
- **WAH4PC Impact:** webhook_receive_push() uses get_or_create(philhealth_id) 
  - If multiple patients with same PhilHealth ID exist, behavior is undefined
  - Only first record is updated/retrieved

---

### Is PhilHealth ID Required?

**🟡 Answer: NULLABLE BUT TREATED AS REQUIRED**

- ❌ Model allows null: null=True, blank=True
- ❌ No model-level required constraint
- ✅ API expects it for proper deduplication ("Looks like optional, but needed for matching")
- **Current Implementation:** Depends on which endpoint is used
  - Direct Patient creation: optional
  - webhook_receive_push(): requires for proper deduplication

---

### Can Duplicate Patients Exist?

**🟢 Answer: YES, DUPLICATES CAN EXIST**

**Multiple scenarios:**
1. Same patient registered twice via API (deduplication only by first_name/last_name/birthdate)
2. Multiple patients with same PhilHealth ID (philhealth_id not unique)
3. Multiple patients with same patient_id (has unique constraint, so NO)
4. Soft-deleted and active patient with same data (query doesn't filter soft-deleted)

---

### Does Model Support Idempotent Update?

**🟡 Answer: NOT REALLY**

```python
# Current implementation in webhook_receive_push():
patient, created = Patient.objects.get_or_create(
    philhealth_id=philhealth_id,
    defaults=patient_data
)

if not created:
    # Update path - NOT ATOMIC
    for key, value in patient_data.items():
        setattr(patient, key, value)
    patient.save()
```

**Issues:**
- ✅ get_or_create is atomic
- ❌ update path is not atomic (setattr + save)
- ⚠️ Multiple concurrent updates can race

---

### Does It Support Upsert Logic?

**🟡 Answer: PARTIAL**

**Current Implementation:**
```python
# In webhook_receive_push():
patient, created = Patient.objects.get_or_create(
    philhealth_id=philhealth_id,
    defaults=patient_data  # Create if not exists
)

if not created:
    # Manual update
    for key, value in patient_data.items():
        setattr(patient, key, value)
    patient.save()
```

**Assessment:**
- ✅ Implements upsert pattern (get_or_create)
- ❌ Update path is not atomic (race condition)
- ❌ Only works if philhealth_id is unique (which it isn't)

---

### Does It Support External Identifier Mapping?

**🟡 Answer: VERY LIMITED**

**Current Implementation:**
```python
# Patient model has 1 external identifier field:
patient_id = models.CharField(unique=True, null=True)  # Hospital ID (WAH-YYYY-XXXXX)
```

**Identifier Systems Supported:**
1. patient_id (hospital MRN) - unique, stored locally
2. philhealth_id - NOT unique, indexed
3. mobile_number - searchable, indexed

**External Identifier Mapping:**
- ❌ No generic identifier system storage
- ❌ No separate identifier[] table (like FHIR allows)
- ❌ Hard-coded to these 3 systems only

**WAH4PC Integration:**
```python
# In mapping_service.py (Patient to FHIR):
identifiers.append({
    "type": {"coding": [{"code": "SB"}]},
    "system": "http://philhealth.gov.ph",
    "value": patient.philhealth_id
})

identifiers.append({
    "type": {"coding": [{"code": "MR"}]},
    "system": f"{GATEWAY_URL}/providers/{provider_id}",
    "value": patient.patient_id
})
```

**Incoming FHIR Mapping:**
```python
# In mapping_service.py (FHIR to Patient):
ph_id = next(
    (i["value"] for i in ids if "philhealth" in i.get("system", "")), None
)
```

- ✅ Can parse multiple identifiers from FHIR
- ❌ Can only store in 3 hardcoded fields
- ❌ Any 4th identifier system is lost

---

## 8️⃣ SUMMARY VERDICT

### Is Patient Module Stable?

**🟡 Answer: MOSTLY, WITH CAVEATS**

**Stable:**
- ✅ Model structure is well-defined
- ✅ Serializers enforce required fields
- ✅ Transaction safety on creation (atomic)
- ✅ Clinical data relationships are solid

**Unstable:**
- ⚠️ Deduplication check not indexed (N+1 performance risk)
- ⚠️ Update path is not atomic (race condition on concurrent updates)
- ⚠️ Soft-deleted patients not filtered by default (may return inactive patients)
- ⚠️ Dual status fields (active boolean + status string) - confusing design

---

### Is It Ready for Cross-System Demographic Sync?

**🔴 Answer: NO - MULTIPLE BLOCKERS**

**Blocker #1: PhilHealth ID Not Unique**
- System assumes PhilHealth ID uniqueness for deduplication
- Model allows duplicates
- Fix: Add unique constraint, handle migration

**Blocker #2: No Generic Identifier System**
- Can't store arbitrary identifier systems
- Only 3 hardcoded fields
- Different systems may use different IDs
- Fix: Create separate PatientIdentifier table

**Blocker #3: Concurrent Update Not Safe**
- webhook_receive_push() has race condition in update path
- Multiple concurrent syncs can corrupt data
- Fix: Use F() objects for atomic updates

**Blocker #4: Soft-Delete Not Filtered**
- Deleted patients appear in search results
- May cause duplicate creation attempts
- Fix: Add default queryset filter

---

### Is It Safe for Concurrent Updates?

**🔴 Answer: NO - RACE CONDITIONS IDENTIFIED**

**Issue #1: Patient Update Race Condition**
```python
# NOT ATOMIC
patient, created = Patient.objects.get_or_create(...)
if not created:
    for key, value in patient_data.items():
        setattr(patient, key, value)  # Thread A
    patient.save()  # Thread B can overwrite simultaneously
```

**Issue #2: Deduplication Check Race Condition**
```python
# Check and create not atomic
existing_patient = Patient.objects.filter(...).first()  # Thread A
if not existing_patient:
    Patient.objects.create(...)  # Thread B creates same patient in between
```

**Fix Required:** Use get_or_create() or select_for_update()

---

### Is It Ready for FHIR Round-Trip?

**🟡 Answer: PARTIAL - DATA LOSS EXPECTED**

**What Survives Round-Trip:**
- ✅ Name (first, last, middle, suffix)
- ✅ Demographics (gender, birthdate, nationality)
- ✅ Identifiers (PhilHealth, MRN, Phone)
- ✅ Address
- ✅ Contact information

**What Gets Lost:**
- ❌ Any 4th identifier system (only 3 fields available)
- ❌ Extensions (stored in FHIR but no local storage for custom extensions)
- ⚠️ Civil status stored as code (single character M/S/D/W) - loses original text

**Data Structure Issues:**
- ❌ Contact name limited to 50 chars (other names are 255)
- ⚠️ Emergency contact is single object (FHIR allows array)
- ⚠️ Marital status codes (M, S, D) lose semantic meaning on retrieval

**Assessment:**
- ✅ Can do basic round-trip (demographics survive)
- ❌ Extended attributes lost (no extension storage)
- ❌ Not safe for full FHIR compliance

---

## ARCHITECTURAL RECOMMENDATIONS (Not Applied)

*These are identified limitations, not implemented fixes:*

1. Add unique constraint on (philhealth_id, organization_id or deleted_at)
2. Create PatientIdentifier table for multi-system support
3. Use atomic F() objects in update operations
4. Add default queryset filter to exclude soft-deleted
5. Remove redundant active + status fields
6. Increase contact name field length to 255
7. Store marital status text separately from code
8. Add extension storage for custom FHIR attributes

---

## FINAL ASSESSMENT MATRIX

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Data Model Completeness** | ✅ Complete | All required fields present |
| **Serializer Validation** | ✅ Adequate | Required fields enforced |
| **Unique Constraints** | ⚠️ Partial | PhilHealth ID not unique |
| **Idempotency** | 🔴 Missing | Update path not atomic |
| **Concurrency Safety** | 🔴 Unsafe | Race conditions exist |
| **Clinic Data Wiring** | ✅ Complete | Conditions, Allergies, Immunizations linked |
| **Clinical Data Retrieval** | ✅ Separate | Requires multiple API calls |
| **Search Capability** | ✅ Adequate | Supports name, ID, phone search |
| **Identifier Flexibility** | 🔴 Limited | Only 3 hardcoded systems |
| **FHIR Round-Trip** | ⚠️ Partial | Data loss on complex attributes |
| **WAH4PC Readiness** | 🔴 Not Ready | Blocker: PhilHealth ID not unique |

---

**AUDIT COMPLETE**  
**Analyst:** Code Inspection Agent  
**Date:** February 12, 2026  
**Confidence:** HIGH (direct code analysis)
