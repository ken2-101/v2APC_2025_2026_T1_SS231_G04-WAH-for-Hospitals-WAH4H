# Status Field Bug Fix

## Issue
Newly registered patients were being created with `status='inactive'` instead of `status='active'`, despite the model having `default='active'`.

## Root Cause

When Django's `Model.objects.create(**data)` is called with an explicit dictionary, **model defaults are NOT applied**. The defaults only work when the field is omitted entirely from the creation.

### The Flow:
1. Frontend sends patient data to `POST /api/patients/`
2. `PatientInputSerializer` validates the data
3. **Problem**: `PatientInputSerializer.fields` did NOT include `status` or `active`
4. Validated data was missing these fields
5. `PatientRegistrationService.register_patient()` called `Patient.objects.create(**data)`
6. Since `status` wasn't in `data`, Django didn't use the model default
7. Result: `status=None` or `status=''` instead of `status='active'`

## The Fix

### Backend Changes

**File**: `wah4h-backend/patients/api/serializers.py`

#### 1. Added `status` and `active` to PatientInputSerializer fields
```python
class PatientInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            # ... existing fields ...
            'consent_flag', 'image_url',
            'active', 'status'  # ← ADDED
        ]
        extra_kwargs = {
            # ... existing rules ...
            'active': {'required': False, 'default': True},
            'status': {'required': False, 'default': 'active'},
        }
```

#### 2. Added `status` and `active` to PatientOutputSerializer
```python
class PatientOutputSerializer(serializers.Serializer):
    # ... existing fields ...

    # Status
    active = serializers.BooleanField(required=False)
    status = serializers.CharField(required=False, allow_null=True)

    # Timestamps
    created_at = serializers.DateTimeField(required=False)
    updated_at = serializers.DateTimeField(required=False)
```

### Frontend Changes

**File**: `Frontend/.../PatientRegistrationModal.tsx`

#### Added explicit `status: 'active'` to submission data
```typescript
const finalData: PatientFormData = {
  ...allStepsData,
  ...step3Form.getValues(),
  active: true, // Default status to active
  status: 'active', // Default status field to active ← ADDED
} as PatientFormData;
```

## How It Works Now

### Registration Flow (After Fix):
1. User completes registration form
2. Frontend creates `finalData` with:
   - `active: true`
   - `status: 'active'` ← Explicit
3. Sends to `POST /api/patients/`
4. `PatientInputSerializer` validates:
   - Accepts `active` and `status` fields
   - Applies defaults if missing: `active=True`, `status='active'`
5. `PatientRegistrationService.register_patient(validated_data)` receives:
   ```python
   {
     'first_name': 'Juan',
     'last_name': 'Dela Cruz',
     # ...
     'active': True,
     'status': 'active'  # ← Included in data
   }
   ```
6. `Patient.objects.create(**data)` creates patient with `status='active'` ✅

### Soft Delete Still Works:
```python
# DELETE /api/patients/{id}/
def destroy(self, request, pk=None):
    patient = Patient.objects.get(id=patient_id)
    patient.status = 'inactive'  # ← Soft delete
    patient.active = False
    patient.save()
```

### List Only Shows Active:
```python
# In patient_acl.py
def search_patients(query: str, limit: int = 50):
    # Only active patients
    patients = Patient.objects.filter(status='active')
    # ...
```

## Files Modified

### Backend (1 file):
1. `wah4h-backend/patients/api/serializers.py`
   - Line ~46: Added `'active', 'status'` to PatientInputSerializer fields
   - Line ~53-54: Added defaults to extra_kwargs
   - Line ~144-146: Added `active` and `status` to PatientOutputSerializer

### Frontend (1 file):
1. `Frontend/.../PatientRegistrationModal.tsx`
   - Line ~165: Added `status: 'active'` to finalData

## Testing

### Verify Fix:
1. Register a new patient through the UI
2. Check database: `status` should be `'active'`
3. Check API response: `GET /api/patients/{id}/` should return `"status": "active"`
4. Check patient list: New patient should appear in the list
5. Soft delete patient: `DELETE /api/patients/{id}/`
6. Verify patient disappears from list (filtered by `status='active'`)
7. Check database: Patient still exists with `status='inactive'`

### Expected Database State:
```sql
SELECT id, patient_id, first_name, last_name, status, active
FROM patients_patient;
```

Result:
```
id | patient_id      | first_name | last_name | status   | active
---+-----------------+------------+-----------+----------+-------
15 | WAH-2026-00001  | Juan       | Dela Cruz | active   | 1
16 | WAH-2026-00002  | Maria      | Santos    | active   | 1
```

## Summary

**Problem**: Model defaults ignored when using `Model.objects.create(**data)`
**Solution**: Add `status` and `active` to serializer fields with explicit defaults
**Result**: All new patients created with `status='active'` and `active=True` ✅

Fix complete! 🎯
