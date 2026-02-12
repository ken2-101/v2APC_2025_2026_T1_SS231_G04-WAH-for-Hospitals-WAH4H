# WAH4PC Architecture Realignment - Visual Overview

## BEFORE: Monolithic Legacy Architecture

```
┌─────────────────────────────────────────────────────┐
│                    views.py                         │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ fetch_wah4pc()                               │  │
│  │ → Imports directly from wah4pc.py            │  │
│  │ → Calls request_patient()                    │  │
│  │ → No clear separation                        │  │
│  └──────────────────────────────────────────────┘  │
│                        ↓↓↓                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ wah4pc.py (671 lines - MONOLITHIC)           │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ✗ HTTP logic mixed with conversion logic     │  │
│  │ ✗ Business logic mixed with parsing helpers  │  │
│  │ ✗ FHIR mapping + identifier extraction       │  │
│  │ ✗ All 8 functions in one file                │  │
│  │                                               │  │
│  │ request_patient()                            │  │
│  │ push_patient()                               │  │
│  │ patient_to_fhir()                            │  │
│  │ fhir_to_dict()                               │  │
│  │ get_providers()                              │  │
│  │ _parse_marital_status()                      │  │
│  │ _get_extension()                             │  │
│  │ gateway_get_transaction()                    │  │
│  └──────────────────────────────────────────────┘  │
│                        ↓↓↓                          │
│         WAH4PC Gateway (FHIR API)                   │
│                                                     │
└─────────────────────────────────────────────────────┘

PROBLEMS:
❌ Tight coupling between HTTP, FHIR, and parsing logic
❌ Difficult to test individual concerns
❌ No clear separation of responsibilities
❌ Hard to reuse mapping logic elsewhere
❌ Mixing business logic with infrastructure
```

---

## AFTER: Clean Layered Service Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        views.py (REFACTORED)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  fetch_wah4pc()          send_to_wah4pc()    webhook_receive()  │
│  │                        │                    │                 │
│  ├─ Validate headers      ├─ Validate input   ├─ Auth check     │
│  ├─ Parse request         ├─ Get patient DB   ├─ Parse data     │
│  └─ Call service          ├─ Call mapping     └─ Call mapping   │
│      ↓                    ├─ Call FHIR            ↓              │
│  fhir_service            └─ Create txn       (mapping logic)    │
│  .request_patient()                                               │
│                                                                  │
│  list_providers()     list_transactions()   webhook_process_q() │
│  │                   │                      │                    │
│  └─ Call service     └─ Direct DB query    └─ Auth + matching   │
│      ↓                    (read-only)          + mapping + HTTP  │
│  fhir_service                                      ↓             │
│  .get_providers()        (acceptable)        fhir_service       │
│                                              mapping_service    │
│                                                                  │
│  RESPONSIBILITY: Input validation, delegation, response format  │
│  CONSTRAINT: NO business logic allowed                           │
└──────────────────────────────────────────────────────────────────┘
  │
  ├─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  ▼                                    ▼                            ▼
┌──────────────────────┐  ┌────────────────────────┐  ┌──────────────────────┐
│ fhir_service.py      │  │ mapping_service.py     │  │ matching_service.py  │
├──────────────────────┤  ├────────────────────────┤  ├──────────────────────┤
│                      │  │                        │  │ TODO: Patient        │
│ ✅ COMPLETE          │  │ ✅ COMPLETE            │  │ matching algorithms  │
│                      │  │                        │  │                      │
│ Responsibilities:    │  │ Responsibilities:      │  │ ExactIdentifier()    │
│                      │  │                        │  │ Demographic()        │
│ • HTTP to gateway    │  │ • FHIR ↔ Local         │  │ FuzzyDemographic()   │
│ • Headers building   │  │   conversion           │  │ ContactInfoMatcher() │
│ • Error handling     │  │ • Identifier[] array   │  │                      │
│ • 409/429 handling   │  │ • Extensions parsing   │  │ Returns: PatientMatch│
│                      │  │ • Null stripping       │  │ with quality score   │
│ Methods:             │  │ • Phil-specific info   │  │                      │
│                      │  │                        │  │ Methods:             │
│ request_patient()    │  │ Methods:               │  │                      │
│ push_patient()       │  │                        │  │ match_by_identifier()│
│ get_providers()      │  │ local_patient_        │  │ match_by_demographic()
│ get_transaction_...()│  │  to_fhir()             │  │ match_by_fuzzy()    │
│ _build_headers()     │  │ fhir_to_local_        │  │                      │
│ _handle_response()   │  │  patient()             │  │ NO: HTTP, DB, logic  │
│                      │  │ _get_extension()       │  │                      │
│ NO: ORM, FHIR        │  │ _parse_marital_       │  │ Status: TODO         │
│      mapping, DB     │  │   status()             │  │                      │
│                      │  │                        │  │                      │
│ NO: Database access  │  │ NO: HTTP, DB, logic    │  │                      │
│ NO: Business logic   │  │                        │  │                      │
└──────────────────────┘  └────────────────────────┘  └──────────────────────┘
  │                                │                         │
  │ POST /fhir/request/Patient     │                         │
  ├────────────────────────────────→ Process                 │
  │ POST /fhir/push/Patient         │ Local Patient          │
  ├────────────────────────────────→ Convert FHIR           │
  │ GET /api/v1/providers           │ ← → Parse Extensions   │
  ├────────────────────────────────→ Match by ID            │
  │ GET /transactions/{id}          │ Marital Status        │
  └────────────────────────────────→ Em. Contact           │
                                                            │
                              ▼▼▼
                     ┌──────────────────┐
                     │  WAH4PC Gateway  │
                     │  FHIR API Server │
                     └──────────────────┘
```

---

## DATA FLOW: Request Patient Example

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                                        │
│    POST /patients/fetch_wah4pc/                                          │
│    {                                                                      │
│      "targetProviderId": "uuid-456",                                     │
│      "philHealthId": "PH-123456"                                         │
│    }                                                                      │
└───────────────────────────┬──────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────────┐
│ 2. views.fetch_wah4pc()                                                  │
│    • Validate: targetProviderId, philHealthId (400 if missing)           │
│    • Parse request data                                                  │
│    • Delegate to service layer ──────────────────────────────────────┐   │
│                                                                      │   │
└──────────────────────────────────────────────────────────────────────┼───┘
                                                                       │
        ┌──────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────────────┐
│ 3. fhir_service.request_patient(target_id, philhealth_id)                 │
│    • Generate idempotency_key (UUID)                                      │
│    • Build headers:                                                       │
│      - X-API-Key: {WAH4PC_API_KEY}                                        │
│      - X-Provider-ID: {WAH4PC_PROVIDER_ID}                                │
│      - Idempotency-Key: {idempotency_key}                                 │
│    • Build JSON request body:                                            │
│      {                                                                    │
│        "requesterId": {PROVIDER_ID},                                      │
│        "targetId": {target_id},                                           │
│        "identifiers": [{"system": "http://philhealth.gov.ph",            │
│                        "value": {philhealth_id}}]                        │
│      }                                                                    │
│    • POST to https://wah4pc.echosphere.cfd/api/v1/fhir/request/Patient   │
│    • Handle response:                                                    │
│      - 200-202: Return JSON with idempotency_key                        │
│      - 409: Return {"error": "Request in progress...", "status_code": 409}
│      - 429: Return {"error": "Rate limit...", "status_code": 429}        │
│      - Network error: Wrap in {"error": "Network error...", ...}        │
│                                                                           │
│    NO DATABASE ACCESS | NO FHIR CONVERSION | NO BUSINESS LOGIC          │
└───────┬────────────────────────────────────────────────────────────────────┘
        │
        │ Response: {"id": "txn-789", "status": "PENDING", ...}
        │           + idempotency_key: "uuid-key-123"
        │
┌───────▼────────────────────────────────────────────────────────────────────┐
│ 4. views.fetch_wah4pc() - Response Processing                             │
│    • If error in response: Return with error status code                 │
│    • Extract transaction ID and idempotency key                          │
│    • Create WAH4PCTransaction record:                                    │
│      - transaction_id: txn-789                                           │
│      - type: 'fetch'                                                     │
│      - status: 'PENDING'                                                 │
│      - target_provider_id: uuid-456                                      │
│      - idempotency_key: uuid-key-123                                     │
│    • Return 202 ACCEPTED to client                                       │
└───────┬────────────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────────────┐
│ 5. CLIENT RESPONSE                                                         │
│    HTTP 202 ACCEPTED                                                      │
│    {                                                                       │
│      "id": "txn-789",                                                    │
│      "status": "PENDING",                                                │
│      ...,                                                                 │
│      "idempotency_key": "uuid-key-123"                                   │
│    }                                                                       │
│                                                                            │
│    ✓ Immediate acknowledgment to client                                  │
│    ✓ Transaction tracked in database                                     │
│    ✓ async processing by gateway                                         │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## DATA FLOW: Receive Pushed Patient (Webhook)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. GATEWAY WEBHOOK REQUEST                                                 │
│    POST /fhir/receive-push/                                               │
│    X-Gateway-Auth: {gateway_secret}                                       │
│    {                                                                       │
│      "transactionId": "txn-101",                                          │
│      "senderId": "provider-uuid-654",                                    │
│      "resourceType": "Patient",                                           │
│      "data": {                                                            │
│        "resourceType": "Patient",                                         │
│        "identifier": [...],                                              │
│        "name": [{"family": "Doe", "given": ["John"]}],                  │
│        "birthDate": "1990-01-15",                                        │
│        "gender": "male",                                                 │
│        ...extensions...                                                  │
│      }                                                                    │
│    }                                                                      │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────────┐
│ 2. views.webhook_receive_push()                                         │
│    • Auth check: X-Gateway-Auth == GATEWAY_AUTH_KEY (401 if not match) │
│    • Validate request: txn_id, sender_id, resource_type (400 if missing)│
│    • Check resource_type == 'Patient' (400 if not)                      │
│    • Delegate to mapping service ─────────────────────────────────────┐ │
│                                                                       │ │
└───────────────────────────────────────────────────────────────────────┼─┘
                                                                        │
                ┌───────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────────────┐
│ 3. mapping_service.fhir_to_local_patient(fhir_data)                        │
│                                                                              │
│    Conversion Process:                                                      │
│    ┌─ Extract identifiers                                                  │
│    │  └─ Find identifier.system="http://philhealth.gov.ph"                 │
│    │  └─ → philhealth_id: "PH-123456"                                      │
│    │                                                                        │
│    ├─ Extract name                                                         │
│    │  └─ name[0].family → last_name: "Doe"                                 │
│    │  └─ name[0].given[0] → first_name: "John"                             │
│    │  └─ name[0].given[1] → middle_name: (if present)                      │
│    │                                                                        │
│    ├─ Extract demographics                                                 │
│    │  └─ gender: "male"                                                    │
│    │  └─ birthDate: "1990-01-15"                                           │
│    │                                                                        │
│    ├─ Extract address (address[0])                                         │
│    │  └─ address_line, city, district, state, postal_code, country        │
│    │                                                                        │
│    ├─ Extract telecom                                                      │
│    │  └─ Find system="phone" → mobile_number                               │
│    │                                                                        │
│    ├─ Parse marital status                                                 │
│    │  └─ maritalStatus.coding[0].code → civil_status (S/M/W/D/L/A)        │
│    │                                                                        │
│    ├─ Extract extensions                                                   │
│    │  └─ Find extension.url="hl7.org/fhir/.../patient-nationality"        │
│    │  └─ Find extension.url=".../indigenous-people"                        │
│    │  └─ Find extension.url=".../occupation"                               │
│    │  └─ Find extension.url=".../patient-religion"                        │
│    │                                                                        │
│    ├─ Extract emergency contact                                            │
│    │  └─ contact[0].name → contact_first_name, contact_last_name          │
│    │  └─ contact[0].telecom[0].value → contact_mobile_number              │
│    │  └─ contact[0].relationship[0] → contact_relationship                 │
│    │                                                                        │
│    └─ Return dict: {                                                       │
│         "first_name": "John",                                              │
│         "last_name": "Doe",                                                │
│         "gender": "male",                                                  │
│         "birthdate": "1990-01-15",                                         │
│         "philhealth_id": "PH-123456",                                     │
│         "mobile_number": "+63-9XX-XXX-XXXX",                               │
│         "nationality": "Filipino",                                         │
│         "religion": "Catholic",                                            │
│         "occupation": "Engineer",                                          │
│         "indigenous_flag": False,                                          │
│         "civil_status": "S",                                               │
│         ...                                                                │
│       }                                                                    │
│                                                                             │
│    NO NETWORK | NO DATABASE | PURE TRANSFORMATION                         │
└───────┬──────────────────────────────────────────────────────────────────┘
        │
        │ patient_data = {
        │   "first_name": "John",
        │   "last_name": "Doe",
        │   ...
        │ }
        │
┌───────▼──────────────────────────────────────────────────────────────────┐
│ 4. views.webhook_receive_push() - Patient Deduplication & Creation      │
│    • Extract philhealth_id from patient_data                            │
│    • If philhealth_id exists:                                           │
│      - Query: existing = Patient.objects.filter(                        │
│                 philhealth_id=philhealth_id).first()                    │
│      - If exists:                                                        │
│        • Update all non-None fields on existing_patient                 │
│        • existing_patient.save()                                        │
│        • action = 'updated'                                             │
│      - Else:                                                             │
│        • patient = Patient.objects.create(**patient_data)               │
│        • action = 'created'                                             │
│    • Else:                                                               │
│      - Create new patient (no match possible)                           │
│                                                                          │
│    • Create WAH4PCTransaction record:                                   │
│      {                                                                   │
│        "transaction_id": "txn-101",                                     │
│        "type": "receive_push",                                          │
│        "status": "COMPLETED",                                           │
│        "patient_id": patient.id,                                        │
│        "target_provider_id": "provider-uuid-654"                        │
│      }                                                                   │
│    • Return 200 OK {action: "created"/"updated"}                        │
└───────┬──────────────────────────────────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE TO GATEWAY                                                   │
│    HTTP 200 OK                                                            │
│    {                                                                      │
│      "message": "Patient created successfully",                          │
│      "patientId": 42,                                                   │
│      "action": "created"                                                │
│    }                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## KEY ARCHITECTURAL IMPROVEMENTS

### BEFORE ❌
- Everything in one file (wah4pc.py)
- HTTP logic mixed with FHIR conversion
- Business logic mixed with parsing helpers
- Hard to test independently
- Hard to reuse components
- Difficult to understand data flow

### AFTER ✅
- Clear service separation by responsibility
- `fhir_service.py` → HTTP only
- `mapping_service.py` → Conversion only
- `views.py` → API contracts only
- Easy to test each component
- Easy to reuse components
- Clear data flow and responsibilities

---

## SERVICE INTERACTION GRAPH

```
Every API request follows this pattern:

┌─────────────┐
│  HTTP Req   │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│  views.py    │ (Validate, Parse)
└──────┬───────┘
       │
       ├────────────────┬──────────────────┐
       │                │                  │
       ▼                ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│ fhir_service│  │ mapping_svc  │  │ transaction_ │
│  (HTTP)     │  │  (Convert)   │  │  svc (TODO)  │
└─────────────┘  └──────────────┘  └──────────────┘
       │                │                  │
       └────────────────┴──────────────────┘
                        │
                        ▼
                  ┌──────────────┐
                  │ WAH4PC/Local │
                  │  Resources   │
                  └──────────────┘
```

---

## SUMMARY TABLE

| Aspect | Before | After |
|--------|--------|-------|
| **Files** | 1 monolithic (wah4pc.py) | 3 service files |
| **Lines of Code** | 671 lines in wah4pc.py | Split across services (focused) |
| **HTTP Logic** | Mixed with FHIR | → fhir_service.py |
| **FHIR Conversion** | Mixed with HTTP | → mapping_service.py |
| **Testability** | Difficult (coupled) | Easy (isolated) |
| **Reusability** | Hard to reuse | Easy to import services |
| **Maintainability** | Confusing (all-in-one) | Clear (separation) |
| **Responsibility** | Blurred | Single responsibility |
| **Status** | ❌ DELETED | ✅ COMPLETE |

---
