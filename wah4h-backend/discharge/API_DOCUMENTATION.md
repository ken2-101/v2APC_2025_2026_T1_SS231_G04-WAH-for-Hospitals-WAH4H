# Discharge Module API Documentation

## Base URL
`/api/discharge/`

## Endpoints

### 1. List/Create Discharge Records
- **GET** `/api/discharge/discharge-records/`
  - List all discharge records
  - Query Parameters:
    - `status`: Filter by status (pending, ready, discharged)
    - `department`: Filter by department
    - `condition`: Filter by condition
    - `search`: Search across patient name, room, condition, physician, department

- **POST** `/api/discharge/discharge-records/`
  - Create a new discharge record
  - Required fields: `patient`, `patient_name`, `room`, `admission_date`, `condition`, `physician`, `department`, `age`

### 2. Retrieve/Update/Delete Discharge Record
- **GET** `/api/discharge/discharge-records/{id}/`
  - Retrieve a specific discharge record

- **PUT** `/api/discharge/discharge-records/{id}/`
  - Update a discharge record

- **PATCH** `/api/discharge/discharge-records/{id}/`
  - Partially update a discharge record

- **DELETE** `/api/discharge/discharge-records/{id}/`
  - Delete a discharge record

### 3. Get Pending Discharges
- **GET** `/api/discharge/discharge-records/pending/`
  - Returns all discharge records with status 'pending' or 'ready'

### 4. Get Discharged Patients
- **GET** `/api/discharge/discharge-records/discharged/`
  - Returns all discharge records with status 'discharged'

### 5. Process Discharge
- **POST** `/api/discharge/discharge-records/{id}/process_discharge/`
  - Process a patient discharge
  - Request Body:
    ```json
    {
      "patientId": 1,
      "finalDiagnosis": "string",
      "hospitalStaySummary": "string",
      "dischargeMedications": "string",
      "dischargeInstructions": "string",
      "followUpPlan": "string (optional)",
      "billingStatus": "string",
      "pendingItems": "string (optional)"
    }
    ```
  - Updates the discharge record status to 'discharged' and sets discharge_date

### 6. Update Requirements
- **PATCH** `/api/discharge/discharge-records/{id}/update_requirements/`
  - Update discharge requirements checklist
  - Request Body:
    ```json
    {
      "requirements": {
        "finalDiagnosis": true,
        "physicianSignature": true,
        "medicationReconciliation": true,
        "dischargeSummary": true,
        "billingClearance": true,
        "nursingNotes": true,
        "followUpScheduled": false
      }
    }
    ```
  - Automatically updates status to 'ready' if all required items are completed

## Data Models

### DischargeRecord
```json
{
  "id": 1,
  "patient": 1,
  "admission": 1,
  "patientName": "John Doe",
  "room": "101A",
  "admissionDate": "2026-01-01",
  "condition": "Pneumonia",
  "status": "pending",
  "physician": "Dr. Smith",
  "department": "Internal Medicine",
  "age": 45,
  "estimatedDischarge": "2026-01-10",
  "requirements": {
    "finalDiagnosis": false,
    "physicianSignature": false,
    "medicationReconciliation": true,
    "dischargeSummary": false,
    "billingClearance": false,
    "nursingNotes": true,
    "followUpScheduled": false
  },
  "dischargeDate": null,
  "finalDiagnosis": "",
  "dischargeSummary": "",
  "followUpRequired": false,
  "followUpPlan": "",
  "created_at": "2026-01-05T10:00:00Z",
  "updated_at": "2026-01-05T10:00:00Z"
}
```

## Status Flow
1. **pending** - Initial state, missing required clearances
2. **ready** - All required clearances completed, ready for discharge
3. **discharged** - Patient has been discharged
