# Discharge Module API Documentation

## Overview
The discharge module provides REST API endpoints for managing patient discharge records and discharge requirements checklist.

**Base URL:** `/api/discharge/`

---

## Endpoints

### 1. Discharge Records

**Base Route:** `/api/discharge/records/`

#### List All Discharge Records
```http
GET /api/discharge/records/
```

**Query Parameters:**
- `status` - Filter by status: `pending`, `ready`, or `discharged`
- `search` - Search by patient name, room, condition, physician, or department
- `physician` - Filter by physician name
- `department` - Filter by department
- `discharge_date` - Filter by discharge date (YYYY-MM-DD format)

**Response:**
```json
[
  {
    "id": 1,
    "patient": 1,
    "patient_details": {
      "id": 1,
      "patient_id": "P0001",
      "first_name": "John",
      "last_name": "Doe",
      ...
    },
    "admission": 1,
    "admission_details": {
      "id": 1,
      "admission_id": "ADM-2026-1234",
      ...
    },
    "patient_name": "John Doe",
    "room": "301-A",
    "admission_date": "2026-01-01",
    "discharge_date": "2026-01-05",
    "condition": "Stable",
    "physician": "Dr. Smith",
    "department": "Cardiology",
    "age": 45,
    "final_diagnosis": "Acute Myocardial Infarction",
    "discharge_summary": "Patient recovered well...",
    "follow_up_required": true,
    "follow_up_plan": "Follow up in 2 weeks",
    "status": "discharged",
    "requirements": {
      "id": 1,
      "final_diagnosis": true,
      "physician_signature": true,
      ...
    },
    "created_at": "2026-01-05T10:00:00Z",
    "updated_at": "2026-01-05T15:30:00Z"
  }
]
```

#### Create Discharge Record
```http
POST /api/discharge/records/
```

**Request Body:**
```json
{
  "patient": 1,
  "admission": 1,
  "patient_name": "John Doe",
  "room": "301-A",
  "admission_date": "2026-01-01",
  "condition": "Stable",
  "physician": "Dr. Smith",
  "department": "Cardiology",
  "age": 45,
  "final_diagnosis": "Acute Myocardial Infarction",
  "discharge_summary": "Patient recovered well...",
  "follow_up_required": true,
  "follow_up_plan": "Follow up in 2 weeks",
  "status": "pending"
}
```

#### Get Single Discharge Record
```http
GET /api/discharge/records/{id}/
```

#### Update Discharge Record
```http
PUT /api/discharge/records/{id}/
PATCH /api/discharge/records/{id}/
```

#### Delete Discharge Record
```http
DELETE /api/discharge/records/{id}/
```

#### Custom Actions

##### Get Discharged Patients
```http
GET /api/discharge/records/discharged_patients/
```
Returns all patients with status = 'discharged'

##### Get Pending Discharges
```http
GET /api/discharge/records/pending_discharges/
```
Returns all patients with status = 'pending'

##### Get Ready for Discharge
```http
GET /api/discharge/records/ready_for_discharge/
```
Returns all patients with status = 'ready'

##### Mark as Discharged
```http
POST /api/discharge/records/{id}/mark_discharged/
```
**Request Body:**
```json
{
  "discharge_date": "2026-01-05"
}
```

##### Mark as Ready
```http
POST /api/discharge/records/{id}/mark_ready/
```

---

### 2. Discharge Requirements

**Base Route:** `/api/discharge/requirements/`

#### List All Requirements
```http
GET /api/discharge/requirements/
```

**Query Parameters:**
- `admission` - Filter by admission ID

**Response:**
```json
[
  {
    "id": 1,
    "admission": 1,
    "final_diagnosis": true,
    "physician_signature": true,
    "medication_reconciliation": true,
    "discharge_summary": false,
    "billing_clearance": true,
    "nursing_notes": true,
    "follow_up_scheduled": false,
    "is_ready": false,
    "created_at": "2026-01-05T10:00:00Z",
    "updated_at": "2026-01-05T15:30:00Z"
  }
]
```

#### Create Requirements Checklist
```http
POST /api/discharge/requirements/
```

**Request Body:**
```json
{
  "admission": 1,
  "final_diagnosis": false,
  "physician_signature": false,
  "medication_reconciliation": false,
  "discharge_summary": false,
  "billing_clearance": false,
  "nursing_notes": false,
  "follow_up_scheduled": false
}
```

#### Get Single Requirements Record
```http
GET /api/discharge/requirements/{id}/
```

#### Update Requirements
```http
PUT /api/discharge/requirements/{id}/
PATCH /api/discharge/requirements/{id}/
```

**Example PATCH Request:**
```json
{
  "final_diagnosis": true,
  "physician_signature": true
}
```

#### Delete Requirements
```http
DELETE /api/discharge/requirements/{id}/
```

---

## Data Models

### DischargeRecord Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patient | FK | Yes | Reference to Patient model |
| admission | FK | Yes | Reference to Admission model (OneToOne) |
| patient_name | String(200) | Yes | Patient's full name |
| room | String(20) | Yes | Room number |
| admission_date | Date | Yes | Date of admission |
| discharge_date | Date | No | Date of discharge |
| condition | String(100) | Yes | Patient condition at discharge |
| physician | String(100) | Yes | Attending physician name |
| department | String(100) | Yes | Department name |
| age | Integer | Yes | Patient age |
| final_diagnosis | Text | Yes | Final diagnosis |
| discharge_summary | Text | Yes | Discharge summary |
| follow_up_required | Boolean | Yes | Whether follow-up is needed |
| follow_up_plan | Text | No | Follow-up plan details |
| status | String(20) | Yes | Status: 'pending', 'ready', or 'discharged' |

### DischargeRequirements Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| admission | FK | Yes | Reference to Admission model (OneToOne) |
| final_diagnosis | Boolean | Yes | Final diagnosis completed |
| physician_signature | Boolean | Yes | Physician signature obtained |
| medication_reconciliation | Boolean | Yes | Medications reconciled |
| discharge_summary | Boolean | Yes | Discharge summary completed |
| billing_clearance | Boolean | Yes | Billing cleared |
| nursing_notes | Boolean | Yes | Nursing notes completed |
| follow_up_scheduled | Boolean | Yes | Follow-up scheduled if needed |
| is_ready | Boolean | Read-only | Computed: All required items completed |

**Required items for discharge:**
- final_diagnosis
- physician_signature
- medication_reconciliation
- discharge_summary
- billing_clearance

---

## Frontend Integration Notes

### Example Usage (JavaScript/TypeScript)

```typescript
// Get all discharged patients
const response = await fetch('http://localhost:8000/api/discharge/records/discharged_patients/');
const dischargedPatients = await response.json();

// Search for patients
const searchResponse = await fetch('http://localhost:8000/api/discharge/records/?search=John');
const results = await searchResponse.json();

// Update requirements checklist
const updateRequirements = await fetch('http://localhost:8000/api/discharge/requirements/1/', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    final_diagnosis: true,
    physician_signature: true
  })
});

// Mark patient as discharged
const markDischarged = await fetch('http://localhost:8000/api/discharge/records/1/mark_discharged/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    discharge_date: '2026-01-05'
  })
});
```

### Status Flow
1. **pending** - Patient pending discharge clearance (default)
2. **ready** - All required items completed, ready for discharge
3. **discharged** - Patient has been discharged

### Integration Checklist
- ✅ Models created and migrated
- ✅ Serializers implemented with nested relationships
- ✅ ViewSets with filtering and search
- ✅ Custom actions for status management
- ✅ URL routing configured
- ✅ Admin interface registered
- ✅ CORS enabled for frontend access
- ✅ Authentication ready (JWT configured in settings)

---

## Testing the API

Use Django admin or API client to test:
```bash
# Run development server
python manage.py runserver

# Access admin panel
http://localhost:8000/admin/

# Access API endpoints
http://localhost:8000/api/discharge/records/
http://localhost:8000/api/discharge/requirements/
```
