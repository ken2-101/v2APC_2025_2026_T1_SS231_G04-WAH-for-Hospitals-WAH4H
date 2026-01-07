# Discharge Module Integration Guide

## Overview
The discharge module backend is now fully integrated with the frontend. The API uses camelCase for frontend communication while maintaining snake_case in the database.

## Frontend Usage

### Import the Service
```typescript
import { dischargeService } from '@/services/dischargeService';
import type { DischargeRecord, PendingPatient, DischargedPatient, DischargeForm } from '@/types/discharge';
```

### Available Methods

#### 1. Get All Discharge Records
```typescript
const records = await dischargeService.getAll();
```

#### 2. Get Pending Discharges
```typescript
const pendingPatients = await dischargeService.getPending();
// Returns patients with status 'pending' or 'ready'
```

#### 3. Get Discharged Patients
```typescript
const dischargedPatients = await dischargeService.getDischarged();
// Returns patients with status 'discharged'
```

#### 4. Create New Discharge Record
```typescript
const newRecord = await dischargeService.create({
  patient: 1,
  patientName: 'John Doe',
  room: '101A',
  admissionDate: '2026-01-01',
  condition: 'Recovery',
  physician: 'Dr. Smith',
  department: 'Cardiology',
  age: 45,
  estimatedDischarge: '2026-01-10'
});
```

#### 5. Update Requirements Checklist
```typescript
await dischargeService.updateRequirements(recordId, {
  finalDiagnosis: true,
  physicianSignature: true,
  medicationReconciliation: true,
  dischargeSummary: true,
  billingClearance: true
});
// Automatically sets status to 'ready' when all required items are true
```

#### 6. Process Discharge
```typescript
const dischargeForm: DischargeForm = {
  patientId: 1,
  finalDiagnosis: 'Patient fully recovered',
  hospitalStaySummary: 'Patient stayed for 5 days',
  dischargeMedications: 'Aspirin 100mg daily',
  dischargeInstructions: 'Rest for 2 weeks',
  followUpPlan: 'Follow up in 1 month',
  billingStatus: 'Cleared',
  pendingItems: ''
};

const result = await dischargeService.processDischarge(recordId, dischargeForm);
// Sets status to 'discharged' and records discharge_date
```

#### 7. Search/Filter Records
```typescript
const filtered = await dischargeService.search({
  status: 'pending',
  department: 'Cardiology',
  search: 'John'
});
```

## API Endpoints

All endpoints are accessible at: `https://sturdy-adventure-r4pv79wg54qxc5rwx-8000.app.github.dev/api/discharge/discharge-records/`

- `GET /` - List all discharge records
- `POST /` - Create new discharge record
- `GET /{id}/` - Get specific record
- `PUT /{id}/` - Update record
- `PATCH /{id}/` - Partial update
- `DELETE /{id}/` - Delete record
- `GET /pending/` - Get pending/ready discharges
- `GET /discharged/` - Get discharged patients
- `POST /{id}/process_discharge/` - Process discharge
- `PATCH /{id}/update_requirements/` - Update requirements

## Data Flow

### Creating Discharge Record
```
Frontend (camelCase) → Backend Serializer → Database (snake_case)
{                      {                    {
  patientName          patient_name         patient_name
  admissionDate  →     admission_date  →    admission_date
  estimatedDischarge   estimated_discharge  estimated_discharge
}                      }                    }
```

### Reading Discharge Record
```
Database (snake_case) → Backend Serializer → Frontend (camelCase)
{                        {                    {
  patient_name           patient_name  →      patientName
  admission_date         admission_date →     admissionDate
  discharge_date   →     discharge_date →     dischargeDate
}                        }                    }
```

## Status Flow

1. **pending** - Initial state, missing required clearances
2. **ready** - All required clearances completed (automatic when requirements updated)
3. **discharged** - Patient has been discharged (set by process_discharge)

## Integration Status

✅ Backend models created  
✅ Serializers with camelCase mapping  
✅ ViewSet with custom actions  
✅ URL routing configured  
✅ Admin panel registered  
✅ Migrations applied  
✅ TypeScript types defined  
✅ Frontend service created  
✅ Data format compatibility verified  

## Testing

Backend-frontend integration has been validated:
- ✓ Serializer accepts frontend camelCase format
- ✓ Form serializer validates discharge form data
- ✓ Requirements structure matches frontend expectations
- ✓ All custom endpoints available
- ✓ No TypeScript compilation errors
