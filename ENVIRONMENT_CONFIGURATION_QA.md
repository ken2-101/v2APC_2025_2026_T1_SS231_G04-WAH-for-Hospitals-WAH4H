# ════════════════════════════════════════════════════════════════════════════════
# WAH4H Backend - Environment Configuration Summary & Q&A
# ════════════════════════════════════════════════════════════════════════════════

Deployment Status: ⚠️ PRE-PRODUCTION (Security fixes pending)
For: WAH4PC v1.0.0 Integration
Last Updated: February 13, 2026

---

## QUICK REFERENCE: ENVIRONMENT VARIABLES BY ENVIRONMENT

### LOCAL DEVELOPMENT
```bash
DJANGO_SECRET_KEY=django-insecure-local-dev-key-12345 # < 50 chars OK for dev
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
WAH4PC_GATEWAY_URL=http://localhost:3000
WAH4PC_API_KEY=wah_test-key
WAH4PC_PROVIDER_ID=test-provider-001
GATEWAY_AUTH_KEY=test-gateway-key-12345
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
SECURE_HSTS_SECONDS=0
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000
PUBLIC_BASE_URL=http://localhost:8000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@wah4h-test.com
EMAIL_HOST_PASSWORD=test-app-password
LOG_LEVEL=DEBUG
```

### STAGING ENVIRONMENT
```bash
DJANGO_SECRET_KEY=<generate-fresh-50-char-key>
DEBUG=False
ALLOWED_HOSTS=staging.wah4h.ph,staging-api.wah4h.ph
DATABASE_URL=postgresql://wah4h_staging:password@db.staging:5432/wah4h_staging
WAH4PC_GATEWAY_URL=https://wah4pc.echosphere.cfd
WAH4PC_API_KEY=wah_staging-api-key
WAH4PC_PROVIDER_ID=wah-staging-provider
GATEWAY_AUTH_KEY=<generate-fresh-auth-key>
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
CORS_ALLOWED_ORIGINS=https://staging-app.wah4h.ph
CSRF_TRUSTED_ORIGINS=https://staging-app.wah4h.ph
PUBLIC_BASE_URL=https://staging-api.wah4h.ph
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=staging-noreply@wah4h.ph
EMAIL_HOST_PASSWORD=<app-password>
LOG_LEVEL=INFO
CACHE_BACKEND=django.core.cache.backends.redis.RedisCache
```

### PRODUCTION ENVIRONMENT
```bash
DJANGO_SECRET_KEY=<generate-fresh-50-char-key>
DEBUG=False ← DO NOT CHANGE
ALLOWED_HOSTS=api.wah4h.ph,wah4h.ph
DATABASE_URL=postgresql://wah4h_prod:password@db.prod.internal:5432/wah4h_prod
WAH4PC_GATEWAY_URL=https://wah4pc.echosphere.cfd
WAH4PC_API_KEY=wah_production-api-key
WAH4PC_PROVIDER_ID=wah-prod-provider
GATEWAY_AUTH_KEY=<generate-fresh-auth-key>
SECURE_SSL_REDIRECT=True ← DO NOT CHANGE
SESSION_COOKIE_SECURE=True ← DO NOT CHANGE
CSRF_COOKIE_SECURE=True ← DO NOT CHANGE
SECURE_HSTS_SECONDS=31536000 ← DO NOT CHANGE
SECURE_HSTS_INCLUDE_SUBDOMAINS=True ← DO NOT CHANGE
SECURE_HSTS_PRELOAD=True (optional)
CORS_ALLOWED_ORIGINS=https://app.wah4h.ph
CSRF_TRUSTED_ORIGINS=https://app.wah4h.ph
PUBLIC_BASE_URL=https://api.wah4h.ph
EMAIL_HOST=smtp.your-organization.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@wah4h.ph
EMAIL_HOST_PASSWORD=<organization-app-password>
LOG_LEVEL=WARNING
CACHE_BACKEND=django.core.cache.backends.redis.RedisCache
SENTRY_DSN=https://xxxxx@yyyyy.ingest.sentry.io/zzzzz
```

---

## SPECIFIC ANSWERS TO DEPLOYMENT QUESTIONS

### Q1: Are webhook endpoints publicly reachable?

**Answer: YES, but ONLY if PUBLIC_BASE_URL is configured correctly**

**Webhook Endpoints:**
- `POST /fhir/receive-results` → Gateway sends patient data fetch result
- `POST /fhir/receive-push` → Gateway sends pushed patient data
- `POST /fhir/process-query` → Gateway sends query for patient data

**Access Control:**
- ✅ Endpoints ARE publicly reachable (intentional - gateway needs to call them)
- ✅ Requests MUST include `X-Gateway-Auth: {GATEWAY_AUTH_KEY}` header
- ✅ If header missing or wrong, returns HTTP 401 Unauthorized
- ⚠️ If PUBLIC_BASE_URL is wrong, gateway cannot reach endpoints

**Security:**
```python
# Current implementation (from views.py):
@api_view(['POST'])
def webhook_receive(request):
    gateway_key = os.getenv('GATEWAY_AUTH_KEY')  # Read from env
    auth_header = request.headers.get('X-Gateway-Auth')
    
    if not gateway_key or not auth_header or auth_header != gateway_key:
        return Response({'error': 'Unauthorized'}, 
                       status=status.HTTP_401_UNAUTHORIZED)
    # Process if authenticated
```

**Verification:**
```bash
# Should return 401 Unauthorized (not 404 or connection error)
curl -X POST https://api.wah4h.ph/fhir/receive-results \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 401 Unauthorized even with wrong key
curl -X POST https://api.wah4h.ph/fhir/receive-results \
  -H "X-Gateway-Auth: wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Configuration Checklist:**
- [ ] PUBLIC_BASE_URL set to publicly accessible HTTPS URL
- [ ] DNS resolves correctly: `nslookup $(echo $PUBLIC_BASE_URL | grep -o 'https://.*' | cut -d/ -f3)`
- [ ] Firewall allows HTTP(S) inbound traffic on port 80/443
- [ ] No DDoS protection, rate limiting, or IP whitelist blocking gateway
- [ ] Gateway admin configured with correct webhook URL and GATEWAY_AUTH_KEY
- [ ] Test: `curl -i https://PUBLIC_BASE_URL/fhir/receive-results` returns 401, not timeout

---

### Q2: Is HTTPS enforced in staging/production?

**Answer: YES, HTTPS enforcement must be configured, but currently NOT enforced in code**

**Current Status:**
- ✗ SECURE_SSL_REDIRECT is hardcoded as False (should be env var)
- ✗ SESSION_COOKIE_SECURE is hardcoded as False (should be env var)
- ✗ CSRF_COOKIE_SECURE is hardcoded as False (should be env var)
- ✗ No HTTP Strict-Transport-Security header
- ⚠️ Will NOT enforce HTTPS until env vars are configured

**After Fixes Applied:**

**LOCAL Environment:**
```
HTTP/HTTPS: Both allowed (for development convenience)
Cookies sent over: HTTP and HTTPS
HSTS header: Not sent
```

**STAGING Environment:**
```
HTTP → HTTPS: 301 redirect (if SECURE_SSL_REDIRECT=True)
Cookies sent over: HTTPS only
HSTS header: Strict-Transport-Security: max-age=31536000
Result: ✅ HTTPS enforced
```

**PRODUCTION Environment:**
```
HTTP → HTTPS: 301 redirect (MUST have SECURE_SSL_REDIRECT=True)
Cookies sent over: HTTPS only (MUST have SESSION_COOKIE_SECURE=True)
HSTS header: Yes (MUST have SECURE_HSTS_SECONDS=31536000)
Result: ✅ HTTPS enforced at Django + HSTS + Browser caching
```

**How It Works:**
```
Request Flow:
1. Client connects via HTTP
2. Django/nginx redirects: 301 https://api.wah4h.ph
3. Client retries via HTTPS
4. Response includes: Strict-Transport-Security: max-age=31536000
5. Browser caches: Never use HTTP for this domain (1 year)
6. Cookies only sent over HTTPS (SESSION_COOKIE_SECURE=True)
```

**Verification in Production:**
```bash
# 1. Test HTTP redirect to HTTPS
curl -i http://api.wah4h.ph/api/patients/
# Should return: 301 Moved Permanently with Location: https://...

# 2. Test HTTPS response has HSTS header
curl -I https://api.wah4h.ph/api/patients/
# Should include: Strict-Transport-Security: max-age=31536000

# 3. Verify certificate is valid
openssl s_client -connect api.wah4h.ph:443 -servername api.wah4h.ph
# Look for: Verify return code: 0 (ok)
```

**⚠️ Important: HTTPS Requires Valid SSL/TLS Certificate**
- Certificate must be installed on web server (nginx/Apache)
- Let's Encrypt (free) recommended for staging/production
- Not Django's responsibility, but deployment infrastructure responsibility

---

### Q3: Are transaction logs persisted?

**Answer: YES, transactions persist to database indefinitely (see details below)**

**Transaction Model:**
```python
# From models.py
class WAH4PCTransaction(models.Model):
    transaction_id = models.CharField(max_length=36, unique=True, primary_key=True)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ])
    patient_id = models.ForeignKey(Patient, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    error_message = models.TextField(null=True, blank=True)
```

**Transaction Lifecycle:**

1. **Created:** When fetch request sent to gateway
   - Status: PENDING
   - patient_id: NULL (not yet received)
   - created_at: Current timestamp

2. **Updated:** When webhook received with patient data
   - Status: COMPLETED
   - patient_id: Links to Patient record
   - error_message: NULL (if successful)

3. **Updated on Error:** If patient fetch fails
   - Status: FAILED
   - error_message: Error details
   - patient_id: NULL (no patient to link)

**Persistence:**
- ✅ Stored in main database (not session)
- ✅ Survives application restart
- ✅ Survives network/gateway interruption
- ✅ Queryable via API endpoint: `GET /api/patients/wah4pc/transactions/`
- ✅ Filterable by status, date range, patient
- ✅ Never automatically deleted (retention policy needed)

**Retention Policy (TO BE IMPLEMENTED):**
```python
# Suggested: Management command to archive old transactions
# Run nightly: python manage.py archive_old_wah4pc_transactions --days=90

# Keep last 90 days in active table
# Archive older transactions to audit log/archive table
# HIPAA requirement: Maintain audit trail 7 years minimum
```

**Current Limitation:**
- ⚠️ No automatic data retention/archival policy
- ⚠️ No backup retention specified
- ⚠️ No compliance with HIPAA 7-year audit log requirement

**Compliance Considerations:**
- Healthcare data must be preserved for 7 years (HIPAA)
- Each transaction must show: who initiated, when, result, any errors
- Audit trail must be immutable (cannot delete/modify historical records)

**Query Examples:**
```bash
# Get all transactions
curl https://api.wah4h.ph/api/patients/wah4pc/transactions/

# Get specific transaction details
curl https://api.wah4h.ph/api/patients/wah4pc/transactions/{transaction_id}/

# SQL: Count transactions by status
SELECT status, COUNT(*) FROM wah4pc_transaction GROUP BY status;

# SQL: Transactions from last 7 days
SELECT * FROM wah4pc_transaction 
WHERE created_at >= NOW() - INTERVAL 7 DAY;
```

---

### Q4: Are fallback/default values used if env vars are missing?

**Answer: PARTIALLY - Some fallback exists, but could cause production issues**

**Detailed Analysis:**

#### Variables WITH Fallback (May Hide Configuration Errors):

1. **WAH4PC_GATEWAY_URL**
   ```python
   # mapping_service.py
   GATEWAY_URL = os.getenv("WAH4PC_GATEWAY_URL", 
                           "https://wah4pc.echosphere.cfd")  # DEFAULT
   ```
   - Fallback: `https://wah4pc.echosphere.cfd`
   - Risk: If env var missing, silently uses production gateway
   - Catch: Requests would fail if API key is also wrong

2. **WAH4PC_PROVIDER_ID**
   ```python
   PROVIDER_ID = os.getenv("WAH4PC_PROVIDER_ID", "")  # DEFAULT: empty string
   ```
   - Fallback: Empty string
   - Risk: Requests to gateway include empty provider ID (will fail)
   - Better: Should raise exception if missing

3. **LOG_LEVEL**
   ```python
   # If not configured, Django uses WARNING by default
   ```
   - Fallback: WARNING
   - Risk: Important INFO logs not captured
   - Impact: Supports operations debugging difficult

#### Variables WITHOUT Fallback (Will Cause Clear Errors):

1. **DJANGO_SECRET_KEY**
   ```python
   SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
   if not SECRET_KEY:
       # Will fail unhelpfully: Secret key is required
   ```
   - Fallback: NONE
   - Error: KeyError or AttributeError (not clear)
   - Recommended: Should raise explicit ValueError

2. **DEBUG**
   ```python
   DEBUG = True  # HARDCODED - no fallback check
   ```
   - Fallback: NONE (hardcoded value)
   - Risk: Always True (insecure in production)
   - Recommended: Should be `os.getenv('DEBUG', 'False')`

3. **ALLOWED_HOSTS**
   ```python
   ALLOWED_HOSTS = ["*"]  # HARDCODED - no fallback check
   ```
   - Fallback: NONE (wildcard always used)
   - Risk: Host header injection in production
   - Recommended: Should be `os.getenv('ALLOWED_HOSTS', '...')`

#### Variables WITHOUT Fallback (Will Use Empty Default):

1. **DATABASE_URL / DB_* variables**
   - If not set: SQLite used (may work locally, fails in production)
   - Recommended: Should raise explicit error in production

2. **EMAIL_HOST_USER / EMAIL_HOST_PASSWORD**
   - If not set: None/empty
   - Result: Email delivery fails silently (broken OTP)
   - Recommended: Should raise explicit error

---

## SUMMARY: ENVIRONMENT CONFIGURATION READINESS

### ✅ READY FOR PRODUCTION (After Fixes)

1. **WAH4PC Integration Endpoints** ← Fully implemented, authenticated
2. **Transaction Persistence** ← Database persists all transactions
3. **Webhook Security** ← GATEWAY_AUTH_KEY validates all incoming webhooks
4. **FHIR Compliance** ← Mappings tested and working
5. **Patient Deduplication** ← PhilHealth ID uniqueness enforced

### ⚠️ SECURITY FIXES REQUIRED BEFORE PRODUCTION (4-6 Hours Work)

1. ✗ Hardcoded SECRET_KEY → Move to environment variable
2. ✗ Hardcoded DEBUG=True → Move to environment variable with False default
3. ✗ Hardcoded ALLOWED_HOSTS=["*"] → Move to environment variable
4. ✗ CORS_ALLOW_ALL_ORIGINS=True → Disable, configure whitelist
5. ✗ Hardcoded GATEWAY_URL → Make configurable via environment
6. ✗ Add explicit error handling for missing critical env vars

### 🟡 OPERATIONAL IMPROVEMENTS RECOMMENDED (Nice-to-Have)

1. Add transaction archival policy (7-year HIPAA retention)
2. Configure Sentry for error tracking
3. Set up Redis caching for multi-server deployments
4. Implement rate limiting for webhook endpoints
5. Add monitoring/alerting for failed transactions
6. Document SSL certificate renewal process

---

## FINAL RECOMMENDATIONS

### Before Staging Deployment:
✅ Must Fix:
1. Environment variables security audit (see HARDCODED_SECRETS_AUDIT_REPORT.md)
2. Configure SSL/TLS certificate
3. Test PUBLIC_BASE_URL accessibility from internet
4. Verify DATABASE_URL connectivity
5. Complete email configuration testing

### Before Production Deployment:
✅ Must Verify:
1. All 6 hardcoded values remediated
2. HTTPS enforced (SECURE_SSL_REDIRECT, HSTS headers)
3. All security headers configured correctly
4. Backups automated and tested
5. Incident response plan documented
6. HIPAA compliance verified (7-year audit trail)
7. Load testing completed (if high traffic expected)
8. Monitoring/alerting configured (Sentry, etc.)

════════════════════════════════════════════════════════════════════════════════
