# WAH4PC Integration Testing Guide

Complete guide for testing WAH4PC gateway integration locally and in production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [Running Tests](#running-tests)
4. [Test Scenarios](#test-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- [x] **Python 3.8+** with Django installed
- [x] **PostgreSQL** database running
- [x] **Environment variables** configured in `.env`
- [x] **Active patient** with PhilHealth ID in database
- [x] **Gateway credentials** (API key & Provider ID) from administrator

### For Webhook Testing

- [x] **ngrok** or similar tool for local webhook testing ([Download ngrok](https://ngrok.com/download))
- [x] **Public URL** with HTTPS (gateway requirement)

---

## Local Setup

### 1. Copy Environment Template

```bash
cd wah4h-backend
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and fill in your values:

```env
# WAH4PC Gateway Integration
WAH4PC_GATEWAY_URL=https://wah4pc.echosphere.cfd
WAH4PC_API_KEY=wah_your-actual-api-key
WAH4PC_PROVIDER_ID=your-actual-provider-uuid
GATEWAY_AUTH_KEY=your-generated-secret-key

# Public URL (for webhook callbacks)
PUBLIC_BASE_URL=https://your-app.ngrok.io
```

**Generating GATEWAY_AUTH_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Ensure Active Patients Exist

```bash
python manage.py shell
```

```python
from patients.models import Patient

# Check for active patients with PhilHealth ID
patients = Patient.objects.filter(status='active', philhealth_id__isnull=False)
print(f"Active patients with PhilHealth ID: {patients.count()}")

# If none, update existing patients
if patients.count() == 0:
    Patient.objects.all().update(status='active', active=True)
```

---

## Running Tests

### Automated Readiness Test

Run the comprehensive test script:

```bash
cd wah4h-backend
python test_wah4pc_ready.py
```

**What it tests:**
1. ✓ Environment variables configured
2. ✓ Gateway connectivity
3. ✓ Database & patient data
4. ✓ Webhook endpoints accessible
5. ✓ API endpoints working
6. ✓ FHIR conversion functions

**Expected Output:**
```
============================================================
WAH4PC Integration Readiness Test
============================================================

============================================================
1. Environment Variables
============================================================

[PASS] Environment variable: WAH4PC_API_KEY
        Set
[PASS] Environment variable: WAH4PC_PROVIDER_ID
        Set
...

Tests Passed: 6/6

✓ All tests passed! Your system is ready for WAH4PC integration.
```

### Manual API Tests

#### 1. List Providers

```bash
curl http://127.0.0.1:8000/api/patients/wah4pc/providers/
```

**Expected Response:**
```json
[
  {
    "id": "uuid-1234",
    "name": "Clinic ni Pare",
    "type": "clinic",
    "isActive": true
  }
]
```

#### 2. Fetch Patient Data

```bash
curl -X POST http://127.0.0.1:8000/api/patients/wah4pc/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "targetProviderId": "target-provider-uuid",
    "philHealthId": "12-345678901-2"
  }'
```

**Expected Response (202 Accepted):**
```json
{
  "data": {
    "id": "txn_...",
    "status": "PENDING",
    ...
  }
}
```

#### 3. List Local Transactions

```bash
curl http://127.0.0.1:8000/api/patients/wah4pc/transactions/
```

---

## Test Scenarios

### Scenario 1: Request Patient Data (You are Requester)

**Objective:** Fetch patient data from another provider

**Steps:**

1. **Initiate request:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/patients/wah4pc/fetch \
     -H "Content-Type: application/json" \
     -d '{
       "targetProviderId": "partner-provider-uuid",
       "philHealthId": "12-345678901-2"
     }'
   ```

2. **Check transaction status:**
   ```bash
   curl http://127.0.0.1:8000/api/patients/wah4pc/transactions/
   ```

3. **Wait for webhook:**
   - Gateway calls `/fhir/receive-results` on your backend
   - Check logs: `python manage.py runserver` output
   - Check database: `WAH4PCTransaction` should show `COMPLETED` or `FAILED`

**Expected Flow:**
```
[You] → POST /api/v1/fhir/request → [Gateway]
[Gateway] → POST /fhir/process-query → [Partner]
[Partner] → POST /api/v1/fhir/receive → [Gateway]
[Gateway] → POST /fhir/receive-results → [You]
```

---

### Scenario 2: Provide Patient Data (You are Target)

**Objective:** Respond to incoming patient query

**Prerequisites:**
- ngrok running: `ngrok http 8000`
- Update `PUBLIC_BASE_URL` in `.env` with ngrok URL
- Restart Django server

**Steps:**

1. **Simulate incoming query** (from gateway):
   ```bash
   curl -X POST http://127.0.0.1:8000/fhir/process-query \
     -H "Content-Type: application/json" \
     -H "X-Gateway-Auth: your-gateway-auth-key" \
     -d '{
       "transactionId": "test-txn-123",
       "requesterId": "requester-uuid",
       "identifiers": [{
         "system": "http://philhealth.gov.ph",
         "value": "12-345678901-2"
       }],
       "resourceType": "Patient",
       "gatewayReturnUrl": "https://wah4pc.echosphere.cfd/api/v1/fhir/receive/Patient"
     }'
   ```

2. **Expected behavior:**
   - Returns `200 OK` immediately
   - Backend searches for patient asynchronously
   - POSTs FHIR data to `gatewayReturnUrl`
   - Check server logs for async processing

**Success Criteria:**
- Endpoint returns 200 within 5 seconds
- Patient found and FHIR data sent to gateway
- Or REJECTED status sent if patient not found

---

### Scenario 3: Push Patient Data

**Objective:** Send patient data to another provider without prior request

**Steps:**

1. **Get patient ID:**
   ```bash
   curl http://127.0.0.1:8000/api/patients/ | jq '.[0].id'
   ```

2. **Push patient:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/patients/wah4pc/send \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": 1,
       "targetProviderId": "partner-provider-uuid"
     }'
   ```

3. **Check transaction:**
   ```bash
   curl http://127.0.0.1:8000/api/patients/wah4pc/transactions/
   ```

**Expected Response:**
```json
{
  "id": "txn_...",
  "status": "PENDING",
  "idempotency_key": "uuid-..."
}
```

---

### Scenario 4: Receive Push Data

**Objective:** Handle unsolicited patient data from another provider

**Steps:**

1. **Simulate push** (from gateway):
   ```bash
   curl -X POST http://127.0.0.1:8000/fhir/receive-push \
     -H "Content-Type: application/json" \
     -H "X-Gateway-Auth: your-gateway-auth-key" \
     -d '{
       "transactionId": "push-txn-123",
       "senderId": "sender-provider-uuid",
       "resourceType": "Patient",
       "data": {
         "resourceType": "Patient",
         "name": [{"family": "Doe", "given": ["John"]}],
         "birthDate": "1990-01-01",
         "gender": "male",
         "identifier": [{
           "system": "http://philhealth.gov.ph",
           "value": "12-999999999-9"
         }]
       }
     }'
   ```

2. **Verify patient created/updated:**
   ```bash
   curl http://127.0.0.1:8000/api/patients/ | jq '.[] | select(.philhealth_id=="12-999999999-9")'
   ```

**Success Criteria:**
- Returns 200 OK
- Patient created or updated in database
- Transaction recorded as COMPLETED

---

## Troubleshooting

### Issue 1: Environment Variables Not Set

**Symptom:**
```
[FAIL] Environment variable: WAH4PC_API_KEY
       Missing or not configured
```

**Solution:**
```bash
# Copy template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

---

### Issue 2: Gateway Unreachable

**Symptom:**
```
[FAIL] Gateway reachable
       Connection error: ...
```

**Solutions:**
1. Check internet connection
2. Verify gateway URL in `.env`:
   ```env
   WAH4PC_GATEWAY_URL=https://wah4pc.echosphere.cfd
   ```
3. Test manually:
   ```bash
   curl https://wah4pc.echosphere.cfd/api/v1/providers
   ```

---

### Issue 3: Webhook 404 Not Found

**Symptom:**
```
[FAIL] Process Query Webhook (/fhir/process-query)
       Endpoint not found (404)
```

**Solutions:**
1. Verify routes in `wah4h/urls.py`:
   ```python
   path('fhir/process-query', patient_views.webhook_process_query)
   ```
2. Restart Django server:
   ```bash
   python manage.py runserver
   ```
3. Test endpoint:
   ```bash
   curl -X POST http://127.0.0.1:8000/fhir/process-query
   ```

---

### Issue 4: Webhook 401 Unauthorized

**Symptom:**
```
POST /fhir/process-query → 401 Unauthorized
```

**Solution:**
Include `X-Gateway-Auth` header with your `GATEWAY_AUTH_KEY`:
```bash
curl -X POST http://127.0.0.1:8000/fhir/process-query \
  -H "X-Gateway-Auth: your-gateway-auth-key" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

### Issue 5: No Active Patients

**Symptom:**
```
[FAIL] Active patients
       No active patients found
```

**Solution:**
```bash
python manage.py shell
```

```python
from patients.models import Patient
Patient.objects.all().update(status='active', active=True)
print(f"Updated {Patient.objects.count()} patients")
```

---

### Issue 6: FHIR Conversion Errors

**Symptom:**
```
[FAIL] patient_to_fhir conversion
       'NoneType' object has no attribute 'isoformat'
```

**Solution:**
Ensure patient has required fields:
```python
from patients.models import Patient
p = Patient.objects.first()
print(f"Name: {p.first_name} {p.last_name}")
print(f"Birthdate: {p.birthdate}")
print(f"Gender: {p.gender}")
```

If missing, update patient:
```python
p.first_name = "John"
p.last_name = "Doe"
p.birthdate = "1990-01-01"
p.gender = "Male"
p.save()
```

---

### Issue 7: ngrok Connection Refused

**Symptom:**
```
Gateway cannot reach your webhooks
```

**Solutions:**
1. **Start ngrok:**
   ```bash
   ngrok http 8000
   ```

2. **Copy public URL** (e.g., `https://abc123.ngrok.io`)

3. **Update .env:**
   ```env
   PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```

4. **Restart Django:**
   ```bash
   python manage.py runserver
   ```

5. **Test webhook:**
   ```bash
   curl https://abc123.ngrok.io/fhir/process-query
   ```

---

## Production Deployment Checklist

- [ ] Register provider with gateway administrator
- [ ] Obtain `WAH4PC_API_KEY` and `WAH4PC_PROVIDER_ID`
- [ ] Generate and share `GATEWAY_AUTH_KEY` with admin
- [ ] Deploy to public URL with HTTPS
- [ ] Update `PUBLIC_BASE_URL` in production `.env`
- [ ] Verify `/fhir/*` endpoints accessible from internet
- [ ] Run `test_wah4pc_ready.py` in production
- [ ] Test end-to-end with partner provider
- [ ] Set up monitoring for webhook endpoints
- [ ] Configure error alerting

---

## Support

For issues or questions:
- Check logs: `python manage.py runserver` output
- Review WAH4PC API reference documentation
- Contact gateway administrator for credentials/registration
- Test with staging gateway before production

---

**Last Updated:** February 9, 2026
