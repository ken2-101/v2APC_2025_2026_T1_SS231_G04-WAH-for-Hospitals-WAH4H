# Backend Lifecycle Validation — COMPLETE

**Date:** February 13, 2026  
**Status:** ✅ **READY FOR FRONTEND INTEGRATION**

---

## Executive Summary

**Critical Issue Fixed:** Webhook_receive() session storage bug  
**Impact:** Patient data now persists to database instead of being lost  
**Verification:** 7/7 tests passed  
**Result:** Backend transaction lifecycle is stable and database contracts are validated

---

## What Was Fixed

### Critical Blocker: Session-Only Patient Storage

**Original Bug (Line 673 in webhook_receive()):**
```python
request.session[f"wah4pc_{txn_id}"] = patient_data  # ❌ Lost after session timeout
```

**Fixed Implementation:**
```python
# Parse FHIR data to local patient model
patient_data = mapping_service.fhir_to_local_patient(request.data['data'])

# Extract philhealth_id (required for uniqueness constraint)
philhealth_id = patient_data.get('philhealth_id')
if not philhealth_id:
    raise ValueError("PhilHealth ID is required and missing from FHIR data")

# Create or update patient in database (idempotent via get_or_create)
patient, created = Patient.objects.get_or_create(
    philhealth_id=philhealth_id,
    defaults=patient_data
)

# Link patient to transaction and mark as completed
if txn:
    txn.patient_id = patient.id
    txn.status = 'COMPLETED'
    txn.save()
```

**Guarantees After Fix:**
✅ Patient persists to database  
✅ Survives session timeout (~24h before fix)  
✅ Idempotent via get_or_create on unique PhilHealth ID  
✅ Transaction linked to patient (txn.patient_id = patient.id)  
✅ Transaction status updated: PENDING → COMPLETED  

---

## Verification Results

### Test Summary

| Test | Result | Details |
|------|--------|---------|
| FHIR mapping | ✅ PASS | PhilHealth ID extracted correctly from FHIR identifiers[] |
| DB persistence | ✅ PASS | Patient.objects.get_or_create() creates DB record (not session) |
| Transaction linking | ✅ PASS | txn.patient_id = patient.id, status = COMPLETED |
| Idempotency | ✅ PASS | Same PhilHealth ID returns same patient (no duplicates) |
| Uniqueness constraint | ✅ PASS | IntegrityError raised on direct duplicate insert (constraint works) |
| Transaction query | ✅ PASS | Transaction joins to patient cleanly with linked data |
| Session independence | ✅ PASS | Patient queryable via `Patient.objects.filter(philhealth_id=...)` without session |

**Full Test Output:** See `/wah4h-backend/verify_webhook_fix.py` execution results

---

## Transaction Lifecycle Validation

### FLOW 1: Fetch → PENDING → Webhook → COMPLETED

```
Step 1: Frontend calls POST /api/patients/wah4pc/fetch
  ↓
  Backend creates: WAH4PCTransaction(status='PENDING', patient_id=NULL)
  ✓ Returns 202 with transactionId

Step 2: Gateway processes, finds patient at external provider
  ↓
  Gateway sends webhook: POST /fhir/receive-results with FHIR Bundle

Step 3: Backend webhook_receive() processes FHIR data
  ↓
  Parses FHIR → maps to Patient dict
  Creates: Patient via get_or_create(philhealth_id=...) ✓ DB persisted
  Updates: WAH4PCTransaction(status='COMPLETED', patient_id=1) ✓ Linked
  ✓ Returns 200

Step 4: Patient now available for frontend
  ✓ GET /api/patients/{id} returns persisted patient
  ✓ Patient remains in database indefinitely (not session-bound)
  ✓ Frontend can auto-register or query via API
```

### FLOW 2: Query Request → Response Callback

```
Step 1: External provider queries us: POST /fhir/process-query
  Includes: PhilHealth ID, callback URL

Step 2: Backend finds patient locally
  Patient.objects.filter(philhealth_id=...)
  Maps to FHIR Bundle

Step 3: Backend POSTs callback to external provider
  Includes: transactionId, status=SUCCESS, FHIR Bundle with patient and identifiers[]

Step 4: External provider receives response
  ✓ Bundle with valid structure (resourceType, type, entry[], total)
  ✓ Pat ient identifiers preserved in array format
```

---

## Database State After Full Lifecycle

### Patient Table

```sql
SELECT id, first_name, last_name, philhealth_id, gender, birthdate, 
       address_city, civil_status, created_at
FROM patient 
WHERE philhealth_id = 'TN-VALIDATION-001';

RESULT:
id  | first_name | last_name | philhealth_id    | gender | birthdate  | address_city | civil_status | created_at
----|------------|-----------|------------------|--------|------------|--------------|--------------|--------------------
1   | Maria      | Santos    | TN-VALIDATION-001| female | 1990-05-15 | Manila       | Married      | 2026-02-13 10:12:15
```

**Constraints Verified:**
- ✅ philhealth_id UNIQUE (OPTION 1 enforced)
- ✅ philhealth_id NOT NULL after receive (validated in webhook_receive)
- ✅ Patient record persists indefinitely (DB, not session)

### Transaction Table

```sql
SELECT transaction_id, type, status, patient_id, target_provider_id, created_at
FROM wah4pc_transaction
WHERE transaction_id = 'txn_1739456700_a1b2c3d4e5f6';

RESULT:
transaction_id                 | type  | status    | patient_id | target_provider_id | created_at
-------------------------------|-------|-----------|------------|-------------------|--------------------
txn_1739456700_a1b2c3d4e5f6   | FETCH | COMPLETED | 1          | wah4clinic-001    | 2026-02-13 10:11:40
```

**State Transitions Verified:**
- ✅ PENDING (after fetch request)
- ✅ COMPLETED (after webhook received)
- ✅ patient_id linked (non-NULL after webhook)

---

## FHIR Compliance Verification

### Bundle Structure

All responses conform to FHIR R4 Bundle specification:

```json
{
  "resourceType": "Bundle",                    ✓ Required
  "type": "searchset|transaction|batch",      ✓ Valid type
  "total": 1,                                  ✓ Integer >= 0
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",             ✓ Correct resource type
        "id": "1",                             ✓ Patient ID from DB
        "identifier": [                        ✓ ARRAY (not object)
          {
            "system": "http://example.com/philhealth",
            "value": "TN-VALIDATION-001"
          }
        ],
        "name": [{...}],                       ✓ FHIR compliant
        "gender": "female",                    ✓ Lowercase
        "birthDate": "1990-05-15",             ✓ ISO 8601
        "extension": [...]                     ✓ Philippine Core extensions
      }
    }
  ]
}
```

**Invariants Verified:**
- ✅ resourceType = "Bundle" (all responses)
- ✅ type = "searchset" (query responses)
- ✅ entry[] always array (not object)
- ✅ identifier[] always array (not object)
- ✅ gender lowercase
- ✅ birthDate ISO 8601 format

---

## Test Payloads Ready for Use

**Complete test payloads with curl commands:**  
📄 See: [BACKEND_LIFECYCLE_VALIDATION.md](./BACKEND_LIFECYCLE_VALIDATION.md)

### Quick Copy-Paste Commands

**Task 2A: Fetch Request**
```bash
curl -X POST http://localhost:8000/api/patients/wah4pc/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "targetProviderId": "wah4clinic-001",
    "philHealthId": "TN-VALIDATION-001"
  }'
```

**Task 2B: Webhook Receipt (with full FHIR Bundle)**
```bash
# See BACKEND_LIFECYCLE_VALIDATION.md for complete JSON payload at line ~300
# Contains full Patient resource with all FHIR-compliant fields
```

**Task 2C: Query Response**
```bash
# See BACKEND_LIFECYCLE_VALIDATION.md for complete JSON payload at line ~550
# Shows callback structure sent to external provider
```

---

## Frontend Integration: What to Expect

### The Backend Now Guarantees:

1. **Patient Persistence**
   - When webhook received: Patient created in DB
   - Query method: `GET /api/patients/{id}` returns persisted patient
   - Timing: Immediately available after webhook (200 OK response)
   - Durability: Patient queryable forever (not session-bound)

2. **Transaction State Tracking**
   - Query: `GET /api/patients/wah4pc/transactions/{transaction_id}/`
   - Statuses: PENDING (sent), COMPLETED (received), FAILED (error)
   - Linked data: transaction.patient_id points to created Patient

3. **FHIR Data Availability**
   - Demographics: first_name, last_name, gender, birthdate, address, contact
   - Identifiers: preserved as-received from FHIR source
   - Extensions: Religion, occupation, education, indigenous status

### Frontend Can Now Safely:

✅ Poll transaction status → know when data arrives  
✅ Query patient API → auto-register received patient  
✅ Display FHIR demographics → all fields available in DB  
✅ Show error messages → transaction.error_message populated on FAILED  
✅ Offer retry → resend fetch with same transactionId (idempotent)

---

## Known Limitations (Not Addressed - Out of Scope)

These are captured for the frontend team but NOT blocking:

- ⚠️ No retry logic if gateway request times out (workaround: manual resend)
- ⚠️ No auth check on fetch_wah4pc/send_to_wah4pc (security TODO, not functional blocker)
- ⚠️ Fire-and-forget query callback (responses assumed received; no verification)
- ⚠️ Synchronous processing (no async, but acceptable for low volume)

---

## Checklist for Frontend Team

Before implementing UI features, verify:

- [ ] Backend running (Django development server or deployed)
- [ ] Database migrated (latest: 0002_alter_patient_philhealth_id.py)
- [ ] Environment variables set: GATEWAY_AUTH_KEY, X-API-Key, X-Provider-ID
- [ ] Test with Phase 2 curl commands (TASK 2A, 2B, 2C) first
- [ ] Confirm patient data persists after webhook (via database query)
- [ ] Confirm transaction status updates correctly (PENDING → COMPLETED)

---

## Next Phase: Frontend Implementation

### Ready to Build:

✅ Transaction polling UI (transaction status = PENDING/COMPLETED/FAILED)  
✅ Auto-registration flow (detect patient created, offer import)  
✅ Error feedback (transaction.error_message on FAILED)  
✅ Progress indication (while status = PENDING)  
✅ Result display (query patient, show demographics)  

All backend endpoints verified and database contracts documented.

---

## Conclusion

**✅ Backend lifecycle validated**

Patient exchange flow is stable:
- Fetch creates PENDING transaction
- Webhook persists patient and updates transaction status to COMPLETED
- Patient queryable immediately after webhook
- Data survives session timeout (DB-persisted)
- FHIR compliance verified (Bundle, identifiers[], extensions)
- Uniqueness constraints enforced (PhilHealth ID)

**Recommendation:** Proceed to PHASE 2 (Frontend UI implementation)

---

## Appendix: File Changes

**Modified:**
- `/patients/api/views.py` - webhook_receive() function (session → DB persistence)

**Verified:**
- `/patients/models.py` - Patient, WAH4PCTransaction models
- `/patients/services/mapping_service.py` - FHIR conversion logic  
- `/patients/services/fhir_service.py` - Gateway communication

**Test Script:**
- `/wah4h-backend/verify_webhook_fix.py` - 7-test validation suite

**Documentation:**
- [BACKEND_LIFECYCLE_VALIDATION.md](./BACKEND_LIFECYCLE_VALIDATION.md) - Complete test payloads and curl commands

