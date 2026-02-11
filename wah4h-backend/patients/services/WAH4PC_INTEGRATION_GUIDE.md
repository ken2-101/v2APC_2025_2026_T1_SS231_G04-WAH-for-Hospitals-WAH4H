# WAH4PC FHIR Integration - Modular Service Architecture

This document describes the modular service architecture for WAH4PC FHIR interoperability in the WAH4H Django backend.

## Overview

The WAH4PC integration is split into clean, single-responsibility services:

```
patients/
├── services/
│   ├── __init__.py                    # Exports all services
│   ├── fhir_service.py                # Outbound FHIR requests/pushes
│   ├── webhook_service.py             # Inbound webhook processing
│   ├── mapping_service.py             # FHIR ↔ Local transformations
│   ├── transaction_service.py         # Transaction lifecycle
│   ├── logging_service.py             # Structured event logging
│   ├── retry_service.py               # Exponential backoff/retry
│   └── matching_service.py            # Patient matching/deduplication
└── middleware/
    ├── __init__.py                    # Exports middleware
    └── transaction_middleware.py      # X-Transaction-ID propagation
```

## Service Descriptions

### 1. FHIRService (`fhir_service.py`)

**Responsibility**: Handle outbound FHIR requests to WAH4PC Gateway

**Key Classes**:
- `FHIRService`: Main service for outbound requests
  - `send_fhir_request()`: POST /api/v1/fhir/request/{resourceType}
  - `push_fhir_resource()`: POST /api/v1/fhir/push/{resourceType}
  - `get_providers()`: GET /api/v1/providers
  - `get_transaction_status()`: GET /api/v1/transactions/{id}
  - `_build_headers()`: Compose request headers (auth, transaction ID, idempotency)
  - `_handle_response()`: Parse gateway responses
- `FHIRRequestProcessor`: Async processor (Celery/threading support)

**Key Dependencies** (to inject):
- `retry_service`: For handling retries
- `transaction_service`: For tracking transactions
- `logging_service`: For event logging
- `transaction_middleware`: To get current transaction ID

**HTTP Headers**:
- `Content-Type`: application/fhir+json
- `X-API-Key`: {api_key}
- `X-Transaction-ID`: {transaction_id} (propagated from request context)
- `Idempotency-Key`: {idempotency_key} (auto-generated if not provided)

**Usage Example**:
```python
from patients.services import FHIRService, FHIRResourceType

fhir_service = FHIRService(api_key="your-key")
success, response = fhir_service.send_fhir_request(
    resource_type=FHIRResourceType.PATIENT,
    fhir_resource={'resourceType': 'Patient', ...},
    target_provider_id='provider-123',
    transaction_id='txn-abc123',
    idempotency_key='idempotency-abc123'
)
```

---

### 2. WebhookService (`webhook_service.py`)

**Responsibility**: Handle inbound webhooks from WAH4PC Gateway

**Key Classes**:
- `WebhookValidator`: HMAC-SHA256 signature validation (X-Gateway-Auth)
- `ProcessQueryWebhookProcessor`: Handle data requests (POST /fhir/process-query)
  - Matches patient locally
  - Gathers requested resources
  - Converts to FHIR and sends back
- `ReceiveResultsWebhookProcessor`: Handle incoming results (POST /fhir/receive-results)
  - Validates transaction ID
  - Matches/deduplicates patients
  - Converts FHIR → Local models
  - Stores received data
- `ReceivePushWebhookProcessor`: Handle unsolicited pushes (POST /fhir/receive-push)
  - Similar to receive-results but for notifications
- `WebhookService`: High-level webhook coordinator
- `WebhookProcessor_Async`: Async processor for webhook handling

**Key Dependencies** (to inject):
- `matching_service`: For patient matching
- `mapping_service`: For FHIR conversions
- `fhir_service`: To send responses
- `transaction_service`: For transaction tracking
- `logging_service`: For event logging

**Header Validation**:
- `X-Gateway-Auth`: HMAC-SHA256 signature (required)
- Constant-time comparison to prevent timing attacks

**Usage Example**:
```python
from patients.services import WebhookService

webhook_service = WebhookService(gateway_secret="shared-secret")
success, response = webhook_service.handle_receive_results(
    webhook_data={'transaction_id': '...', 'fhir_bundle': {...}},
    x_gateway_auth='signature-value'
)
```

---

### 3. MappingService (`mapping_service.py`)

**Responsibility**: Bidirectional FHIR ↔ Local Patient transformations

**Key Classes**:
- `FHIRMapping`: Constants for coding systems and identifier systems
  - `IDENTIFIER_SYSTEM_PHILHEALTH`
  - `IDENTIFIER_SYSTEM_INTERNAL`
  - Gender, marital status, blood type mappings
- `PatientToFHIRMapper`: Local Patient → FHIR Patient resource
  - `map_patient_to_fhir()`: Main conversion
  - `_build_identifiers()`: FHIR identifier array
  - `_build_name()`: FHIR name array
  - `_build_address()`: FHIR address array
  - `_build_telecom()`: FHIR contact info
  - `_build_extensions()`: Philippine-specific extensions (PWD, indigenous, consent)
  - `_build_emergency_contact()`: Contact array
- `FHIRToPatientMapper`: FHIR Patient → Local Patient model
  - `map_fhir_to_patient()`: Main conversion
  - `_extract_*()`: Extract individual fields
  - Returns unsaved Patient instance (caller must validate/save)
- `BundleMapper`: Handle FHIR Bundle resources
  - `map_bundle_to_local()`: Extract and map all resources in bundle
  - `_map_resource()`: Dispatch to correct mapper by resourceType
- `MappingService`: High-level coordinator

**Philippine Extensions**:
- PWD status (pwd_type)
- Indigenous status (indigenous_flag, indigenous_group)
- Blood type
- Consent flag
- Occupation/Education

**Usage Example**:
```python
from patients.services import MappingService

mapping_service = MappingService()

# Local → FHIR
success, fhir_patient, error = mapping_service.local_patient_to_fhir(patient)

# FHIR → Local
success, patient_instance, error = mapping_service.fhir_to_local_patient(fhir_resource)

# FHIR Bundle → Local
success, resources_dict, errors = mapping_service.fhir_bundle_to_local(fhir_bundle)
# resources_dict = {'patients': [...], 'conditions': [...], ...}
```

---

### 4. TransactionService (`transaction_service.py`)

**Responsibility**: Transaction lifecycle management and CRUD

**Key Classes**:
- `TransactionStatus`: Enum (PENDING, IN_PROGRESS, COMPLETED, FAILED, RECEIVED, RETRYING, TIMEOUT, CANCELLED)
- `TransactionType`: Enum (FHIR_REQUEST, FHIR_PUSH, WEBHOOK_QUERY, WEBHOOK_RESULTS, WEBHOOK_PUSH)
- `TransactionService`: Main service
  - `create_outbound_transaction()`: Create new transaction (auto-generates UUID)
  - `create_inbound_transaction()`: Create transaction from webhook
  - `update_transaction_status()`: Update status with validation
  - `get_transaction()`: Retrieve transaction details
  - `list_transactions()`: Query with filtering/pagination
  - `retry_transaction()`: Mark transaction for retry
  - `mark_transaction_completed()`: Mark successful
  - `mark_transaction_failed()`: Record error
  - `check_idempotency()`: Prevent duplicate requests
  - `cleanup_stale_transactions()`: Mark timed-out transactions
  - `get_transaction_statistics()`: Dashboard metrics

**Database Model**: `WAH4PCTransaction`
- `transaction_id`: Unique identifier (UUID)
- `type`: Transaction type (FHIR_REQUEST, FHIR_PUSH, etc.)
- `status`: Current status (PENDING, COMPLETED, etc.)
- `patient_id`: Associated patient (optional)
- `target_provider_id`: Target provider (optional)
- `error_message`: Error details (if failed)
- `idempotency_key`: For deduplication (optional)
- `created_at`, `updated_at`: Timestamps

**Idempotency**:
- Same `idempotency_key` within short window returns same `transaction_id`
- Prevents duplicate requests to external system
- Use UUID or request signature as key

**Status Lifecycle**:
```
PENDING → IN_PROGRESS → COMPLETED
                     ↘ FAILED
                     ↘ RETRYING → COMPLETED or FAILED
                     ↘ TIMEOUT

PENDING → FAILED (validation error)

RECEIVED → IN_PROGRESS → COMPLETED or FAILED
```

**Usage Example**:
```python
from patients.services import TransactionService, TransactionType, TransactionStatus

tx_service = TransactionService()

# Create outbound transaction
success, tx_id, error = tx_service.create_outbound_transaction(
    transaction_type=TransactionType.FHIR_REQUEST,
    patient_id=123,
    target_provider_id='provider-xyz',
    resource_type='Patient',
    idempotency_key='idempotency-key-abc'
)

# Update status
success, error = tx_service.update_transaction_status(
    transaction_id=tx_id,
    new_status=TransactionStatus.COMPLETED
)

# Check idempotency
is_duplicate, existing_tx_id = tx_service.check_idempotency('idempotency-key-abc')
```

---

### 5. LoggingService (`logging_service.py`)

**Responsibility**: Structured logging for audit trail

**Key Classes**:
- `InteroperabilityEventType`: Enum for event types
  - OUTBOUND_REQUEST, OUTBOUND_RESPONSE, OUTBOUND_ERROR
  - WEBHOOK_RECEIVED, WEBHOOK_PROCESSED, WEBHOOK_ERROR
  - PATIENT_MATCHED, PATIENT_NOT_FOUND
  - MAPPING_SUCCESS, MAPPING_ERROR
  - TRANSACTION_CREATED, TRANSACTION_UPDATED
  - RETRY_INITIATED, RETRY_SUCCESS, RETRY_FAILED
  - VALIDATION_ERROR, AUTHENTICATION_ERROR, TIMEOUT, DEDUPLICATION
- `VerbosityLevel`: Enum (MINIMAL, STANDARD, DETAILED, DEBUG)
  - Controls what gets logged (request/response bodies, full headers, etc.)
- `LoggingService`: Main service
  - `log_outbound_request()`: Log request sent to gateway
  - `log_outbound_response()`: Log response from gateway
  - `log_outbound_error()`: Log request error
  - `log_webhook_received()`: Log incoming webhook
  - `log_webhook_processed()`: Log successful processing
  - `log_webhook_error()`: Log processing error
  - `log_patient_matched()`: Log successful patient match
  - `log_patient_not_found()`: Log failed match
  - `log_mapping_success()`: Log successful FHIR mapping
  - `log_mapping_error()`: Log mapping failure
  - `log_retry_initiated()`: Log retry attempt
  - `query_logs()`: Query logs with filtering
  - `get_audit_trail()`: Get chronological event history for transaction

**Database Model**: `InteroperabilityLog` (to be created)
- `event_type`: Type of event
- `transaction_id`: Associated transaction
- `patient_id`: Associated patient (if any)
- `external_id`: External identifier (provider ID, etc.)
- `status_code`: HTTP status code (if applicable)
- `event_data`: Event-specific data (JSON)
- `error_message`: Error message (if applicable)
- `duration_ms`: Request duration in milliseconds
- `timestamp`: When event occurred

**Usage Example**:
```python
from patients.services import LoggingService, InteroperabilityEventType, VerbosityLevel

logging_service = LoggingService(verbosity=VerbosityLevel.STANDARD)

# Log outbound request
success, error = logging_service.log_outbound_request(
    transaction_id='txn-abc123',
    endpoint='/api/v1/fhir/request/Patient',
    method='POST',
    resource_type='Patient',
    target_provider_id='provider-xyz',
    patient_id=123,
    request_body={...}  # Only logged if verbosity >= DETAILED
)

# Query audit trail
success, events, error = logging_service.get_audit_trail('txn-abc123')
```

---

### 6. RetryService (`retry_service.py`)

**Responsibility**: Exponential backoff and retry logic

**Key Classes**:
- `RetryStrategy`: Enum (EXPONENTIAL_BACKOFF, LINEAR_BACKOFF, FIXED_DELAY)
- `RetryConfig`: Configuration object
  - `strategy`: Retry strategy
  - `max_retries`: Max attempts (default 5)
  - `initial_delay_seconds`: First delay (default 1s)
  - `max_delay_seconds`: Maximum delay (default 300s)
  - `backoff_multiplier`: Exponential factor (default 2.0)
  - `jitter_enabled`: Add randomness (default True)
- `RetryService`: Main service
  - `should_retry()`: Check if request should be retried
  - `calculate_retry_delay()`: Get delay in seconds
  - `calculate_next_retry_time()`: Get datetime for next retry
  - `is_request_expired()`: Check if too old to retry
  - `should_continue_retrying()`: Comprehensive retry check
  - `get_next_retry_info()`: Get full retry decision info
- `RetryScheduler`: Schedule retry execution
  - `schedule_retry()`: Queue retry task (Celery)
  - `execute_retry()`: Execute retry (called by task)

**Retryable Status Codes**:
- 429: Rate Limited (respect Retry-After header)
- 408: Request Timeout
- 500-503: Server Errors
- Connection errors, timeouts

**Non-Retryable Status Codes**:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 2xx, 3xx: Success

**Backoff Examples**:

Exponential (default):
```
Attempt 1: 1s
Attempt 2: 2s
Attempt 3: 4s
Attempt 4: 8s
Attempt 5: 16s + jitter (±20%)
```

With jitter (prevents thundering herd):
```
Attempt 1: 1s ± 0.2s = 0.8s - 1.2s
Attempt 2: 2s ± 0.4s = 1.6s - 2.4s
...
```

**Usage Example**:
```python
from patients.services import RetryService, RetryConfig, RetryStrategy

config = RetryConfig(
    strategy=RetryStrategy.EXPONENTIAL_BACKOFF,
    max_retries=5,
    initial_delay_seconds=1,
    max_delay_seconds=300,
    backoff_multiplier=2.0,
    jitter_enabled=True
)
retry_service = RetryService(config)

# Check if should retry
should_retry, reason = retry_service.should_retry(
    http_status=429,
    retry_count=2
)

# Get retry info
success, retry_info = retry_service.get_next_retry_info(
    transaction_id='txn-abc123',
    retry_count=2,
    created_at=datetime.now() - timedelta(minutes=5),
    http_status=429,
    rate_limit_retry_after=30  # Server says wait 30s
)

if success and retry_info['should_retry']:
    print(f"Retry in {retry_info['delay_seconds']}s")
    print(f"Retry at: {retry_info['retry_at']}")
```

---

### 7. MatchingService (`matching_service.py`)

**Responsibility**: Patient matching and deduplication

**Key Classes**:
- `MatchQuality`: Enum (EXACT=1.0, VERY_HIGH=0.95, HIGH=0.85, MEDIUM=0.70, LOW=0.50, NO_MATCH=0.0)
- `PatientMatch`: Result dataclass
  - `patient_id`: Matched patient ID
  - `quality`: MatchQuality enum
  - `score`: Numeric score (0.0-1.0)
  - `reason`: Why this match was selected
  - `matched_on`: List of fields used
  - `confidence`: Confidence in match
  - `alternatives`: Alternative matches
- `MatchingAlgorithm`: Abstract base
  - `match()`: Perform matching
- Concrete matchers:
  - `ExactIdentifierMatcher`: PhilHealth ID, National ID, etc. (EXACT)
  - `DemographicMatcher`: Name + birthdate + gender exact (VERY_HIGH)
  - `FuzzyDemographicMatcher`: Fuzzy name + demographics (HIGH/MEDIUM)
  - `ContactInfoMatcher`: Phone, address (MEDIUM)
- `MatchingService`: High-level coordinator
  - `match_patient()`: Find match using priority chain
  - `find_duplicate_patients()`: Find potential duplicates
  - `merge_duplicate_patients()`: Merge records
- `MatchingStatistics`: Reporting
  - `get_matching_statistics()`: Dashboard metrics

**Matching Priority Chain**:
1. ExactIdentifierMatcher (PhilHealth ID, National ID)
2. DemographicMatcher (exact name + birthdate + gender)
3. FuzzyDemographicMatcher (fuzzy name + demographics, with age tolerance)
4. ContactInfoMatcher (phone, address)
5. No match → Flag for manual review or create new patient

**Input Format** for `match_patient()`:
```python
fhir_identifiers = {
    'identifiers': [
        {'system': 'http://www.philhealth.gov.ph/...', 'value': 'PH-123456'},
        ...
    ],
    'first_name': 'Juan',
    'last_name': 'Dela Cruz',
    'birthdate': '1990-05-15',  # YYYY-MM-DD
    'gender': 'male',
    'phone': '09123456789',
    'address_line': '123 Main St',
    'address_city': 'Manila',
}
```

**Usage Example**:
```python
from patients.services import MatchingService, MatchQuality

matching_service = MatchingService(min_match_quality=MatchQuality.MEDIUM)

success, match, error = matching_service.match_patient({
    'identifiers': [{'system': 'http://...', 'value': 'PH-123'}],
    'first_name': 'Juan',
    'last_name': 'Dela Cruz',
    'birthdate': '1990-05-15',
    'gender': 'male'
})

if match:
    print(f"Matched patient {match.patient_id}")
    print(f"Quality: {match.quality.name}")
    print(f"Score: {match.score}")
else:
    print("No match found - may need to create new patient")

# Find duplicates
success, duplicates, error = matching_service.find_duplicate_patients(
    patient_id=123,
    threshold=MatchQuality.HIGH
)

if duplicates:
    for dup_id, score in duplicates:
        print(f"Duplicate: {dup_id} (score: {score})")
```

---

### 8. TransactionIDMiddleware (`middleware/transaction_middleware.py`)

**Responsibility**: X-Transaction-ID propagation across request lifecycle

**Key Classes**:
- `TransactionIDMiddleware`: Django middleware
  - Extracts `X-Transaction-ID` from request headers
  - Generates UUID if not present
  - Stores in thread-local/context variable
  - Adds to response headers
  - Available to all services via `get_transaction_id()`
- `TransactionIDContextManager`: Context manager for scoped transaction IDs
  - Useful in testing or non-request contexts
- `TransactionIDFilter`: Logging filter
  - Injects transaction ID into all log records
  - Enables correlation across logs

**Functions**:
- `get_transaction_id()`: Get current transaction ID from context
- `set_transaction_id(id)`: Set transaction ID in context
- `generate_transaction_id()`: Generate new UUID

**Integration Steps**:

1. Add to `settings.py`:
```python
MIDDLEWARE = [
    # ... other middleware ...
    'patients.middleware.TransactionIDMiddleware',
]

LOGGING = {
    'filters': {
        'transaction_id': {
            '()': 'patients.middleware.TransactionIDFilter',
        },
    },
    'formatters': {
        'verbose': {
            'format': '[%(transaction_id)s] %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'filters': ['transaction_id'],
        },
    },
}
```

2. Access in services/views:
```python
from patients.middleware import get_transaction_id

def my_view(request):
    transaction_id = get_transaction_id()
    # Use transaction_id in service calls
    return JsonResponse({'transaction_id': transaction_id})
```

3. For testing:
```python
from patients.middleware import TransactionIDContextManager

def test_something():
    with TransactionIDContextManager('test-txn-123'):
        # All code here has access to test-txn-123
        result = some_function()
        assert result.transaction_id == 'test-txn-123'
```

**Usage Example**:
```python
from patients.middleware import (
    get_transaction_id,
    TransactionIDContextManager,
    generate_transaction_id
)

# In a service during request
transaction_id = get_transaction_id()  # Auto-extracted by middleware

# Manual context manager (testing)
with TransactionIDContextManager('my-txn-id'):
    txn_id = get_transaction_id()
    assert txn_id == 'my-txn-id'

# Generate new ID manually
new_id = generate_transaction_id()
set_transaction_id(new_id)
```

---

## Integration Flow

### Outbound FHIR Request Example

```python
# 1. View receives request (middleware extracts/generates X-Transaction-ID)
transaction_id = get_transaction_id()

# 2. Create transaction record
tx_service = TransactionService()
success, tx_id, error = tx_service.create_outbound_transaction(
    transaction_type=TransactionType.FHIR_REQUEST,
    patient_id=patient.id,
    target_provider_id='provider-123',
    idempotency_key='idempotency-abc'
)

# 3. Convert local patient to FHIR
mapping_service = MappingService()
success, fhir_patient, error = mapping_service.local_patient_to_fhir(patient)

# 4. Send to gateway
fhir_service = FHIRService(api_key='key')
success, response = fhir_service.send_fhir_request(
    resource_type=FHIRResourceType.PATIENT,
    fhir_resource=fhir_patient,
    target_provider_id='provider-123',
    transaction_id=transaction_id,
    idempotency_key='idempotency-abc'
)

# 5. Handle response
if success and response['status'] == 200:
    # Update transaction to COMPLETED
    tx_service.mark_transaction_completed(tx_id, response_data=response['data'])
else:
    # Check if retryable
    retry_service = RetryService()
    should_retry, reason = retry_service.should_retry(
        http_status=response.get('http_status'),
        retry_count=0
    )
    
    if should_retry:
        # Schedule retry via Celery
        retry_info = retry_service.get_next_retry_info(...)
        scheduler = RetryScheduler()
        scheduler.schedule_retry(tx_id, retry_info['retry_at'], retry_info)
        # Update transaction to RETRYING
        tx_service.update_transaction_status(tx_id, TransactionStatus.RETRYING)
    else:
        # Mark as failed
        tx_service.mark_transaction_failed(
            tx_id,
            error_message=reason,
            http_status=response.get('http_status')
        )
```

### Inbound Webhook Example

```python
# 1. Webhook endpoint receives POST with X-Gateway-Auth header
# Middleware extracts/generates X-Transaction-ID

# 2. Validate signature
webhook_service = WebhookService(gateway_secret='shared-secret')
is_valid = webhook_service.validator.validate_signature(
    payload=request.body,
    signature=request.headers['X-Gateway-Auth']
)

if not is_valid:
    return JsonResponse({'error': 'Invalid signature'}, status=401)

# 3. Process webhook asynchronously
webhook_data = request.json
success, result = webhook_service.handle_receive_results(
    webhook_data=webhook_data,
    x_gateway_auth=request.headers['X-Gateway-Auth']
)

# Webhook processor does:
# a. Create inbound transaction
# b. For each FHIR resource in data:
#    - Match patient (MatchingService)
#    - Convert FHIR → local (MappingService)
#    - Dedup check
#    - Store or update
# c. Log all operations
# d. Update transaction status

return JsonResponse({'success': True}, status=202)  # Accepted
```

---

## Database Models Required

Create these models in `patients/models.py`:

### 1. WAH4PCTransaction (Already exists)
```python
class WAH4PCTransaction(TimeStampedModel):
    transaction_id = models.CharField(max_length=255, unique=True, db_index=True)
    type = models.CharField(max_length=20)  # fhir_request, fhir_push, webhook_*, etc.
    status = models.CharField(max_length=20, default='PENDING')
    patient_id = models.IntegerField(null=True, blank=True)
    target_provider_id = models.CharField(max_length=255, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'wah4pc_transaction'
```

### 2. InteroperabilityLog (Needs to be created)
```python
class InteroperabilityLog(TimeStampedModel):
    event_type = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=255, db_index=True)
    patient_id = models.IntegerField(null=True, blank=True, db_index=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    event_data = models.JSONField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'interoperability_log'
        indexes = [
            models.Index(fields=['transaction_id', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['patient_id', 'timestamp']),
        ]
```

---

## Configuration

Add to `settings.py`:

```python
# WAH4PC Gateway Configuration
WAH4PC_GATEWAY_URL = "https://wah4pc.echosphere.cfd"
WAH4PC_API_KEY = os.getenv("WAH4PC_API_KEY", "")
WAH4PC_GATEWAY_SECRET = os.getenv("WAH4PC_GATEWAY_SECRET", "")  # For webhook validation

# Retry Configuration
RETRY_CONFIG = {
    'strategy': 'exponential_backoff',
    'max_retries': 5,
    'initial_delay_seconds': 1,
    'max_delay_seconds': 300,
    'backoff_multiplier': 2.0,
    'jitter_enabled': True,
}

# Transaction Configuration
TRANSACTION_TIMEOUT_SECONDS = 3600  # 1 hour
IDEMPOTENCY_WINDOW_SECONDS = 86400  # 24 hours

# Middleware
MIDDLEWARE = [
    # ... other middleware ...
    'patients.middleware.TransactionIDMiddleware',
]

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'transaction_id': {
            '()': 'patients.middleware.TransactionIDFilter',
        },
    },
    'formatters': {
        'verbose': {
            'format': '[%(transaction_id)s] %(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'filters': ['transaction_id'],
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/interoperability.log',
            'formatter': 'verbose',
            'filters': ['transaction_id'],
        },
    },
    'loggers': {
        'patients.services': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

---

## Future Work

### Async Processing
Each service has `_Async` variants or placeholders for async processing:
- Use Celery for task queuing and scheduling
- Use APScheduler for scheduled tasks
- Examples:
  - `FHIRRequestProcessor.process_request_async()` (Celery task)
  - `WebhookProcessor_Async.process_webhook_async()` (Celery task)
  - `RetryScheduler.schedule_retry()` (Celery apply_async with ETA)

### Additional Mappers
- Create utility mappers for other FHIR resources:
  - ConditionMapper, AllergyIntolerance, Immunization, etc.
  - Implement in `mapping_service.py`

### Error Handling
- Comprehensive error codes and messages
- Structured exception classes
- Graceful degradation

### Testing
- Unit tests for each service
- Integration tests for full flows
- Mock WAH4PC Gateway for testing

### Monitoring & Alerting
- Dashboard of transaction statistics
- Alerts for high failure rates
- Performance metrics

---

## Summary

This architecture provides:
- **Modularity**: Each service has single responsibility
- **Testability**: Services can be tested in isolation
- **Scalability**: Async processing via Celery
- **Traceability**: Transaction IDs propagate across system
- **Auditability**: Complete event logging
- **Resilience**: Exponential backoff and retry logic
- **Interoperability**: FHIR standards-compliant
- **Localization**: Philippine-specific fields and formats

All services are stubs with detailed docstrings and TODO comments for implementation.
