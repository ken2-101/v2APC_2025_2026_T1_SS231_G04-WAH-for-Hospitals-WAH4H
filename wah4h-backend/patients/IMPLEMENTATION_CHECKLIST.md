# WAH4PC Integration Implementation Checklist

## File Structure Created

```
wah4h-backend/
└── patients/
    ├── services/
    │   ├── __init__.py                           # ✅ Updated with new exports
    │   ├── fhir_service.py                       # ✅ Created (stub)
    │   ├── webhook_service.py                    # ✅ Created (stub)
    │   ├── mapping_service.py                    # ✅ Created (stub)
    │   ├── transaction_service.py                # ✅ Created (stub)
    │   ├── logging_service.py                    # ✅ Created (stub)
    │   ├── retry_service.py                      # ✅ Created (stub)
    │   ├── matching_service.py                   # ✅ Created (stub)
    │   └── WAH4PC_INTEGRATION_GUIDE.md           # ✅ Created (comprehensive docs)
    ├── middleware/
    │   ├── __init__.py                           # ✅ Created (exports)
    │   └── transaction_middleware.py             # ✅ Created (stub)
    ├── models.py                                 # ⚠️  Needs updates
    └── ...existing files...
```

## Implementation Steps

### Phase 1: Models & Configuration

- [ ] Add InteroperabilityLog model to `patients/models.py`
  - Fields: event_type, transaction_id, patient_id, external_id, status_code, event_data, error_message, duration_ms, timestamp
  - Indexes on transaction_id + timestamp, event_type + timestamp, patient_id + timestamp

- [ ] Update Django settings.py:
  - [ ] Add WAH4PC_GATEWAY_URL, WAH4PC_API_KEY, WAH4PC_GATEWAY_SECRET
  - [ ] Add RETRY_CONFIG dictionary
  - [ ] Add TRANSACTION_TIMEOUT_SECONDS and IDEMPOTENCY_WINDOW_SECONDS
  - [ ] Add TransactionIDMiddleware to MIDDLEWARE list
  - [ ] Add TransactionIDFilter to LOGGING configuration

- [ ] Run migrations:
  - [ ] `python manage.py makemigrations patients`
  - [ ] `python manage.py migrate`

### Phase 2: Core Service Implementation (Priority Order)

#### 1. TransactionService (Foundation)
- [ ] Implement `create_outbound_transaction()`
- [ ] Implement `create_inbound_transaction()`
- [ ] Implement `update_transaction_status()`
- [ ] Implement `get_transaction()`
- [ ] Implement `list_transactions()`
- [ ] Implement `check_idempotency()`
- [ ] Implement `mark_transaction_completed()`
- [ ] Implement `mark_transaction_failed()`
- [ ] Implement `retry_transaction()`
- [ ] Implement `cleanup_stale_transactions()`
- [ ] Implement `get_transaction_statistics()`

#### 2. LoggingService (Closely related to Transactions)
- [ ] Implement `log_outbound_request()`
- [ ] Implement `log_outbound_response()`
- [ ] Implement `log_outbound_error()`
- [ ] Implement `log_webhook_received()`
- [ ] Implement `log_webhook_processed()`
- [ ] Implement `log_webhook_error()`
- [ ] Implement `log_patient_matched()`
- [ ] Implement `log_patient_not_found()`
- [ ] Implement `log_mapping_success()`
- [ ] Implement `log_mapping_error()`
- [ ] Implement `log_retry_initiated()`
- [ ] Implement `query_logs()`
- [ ] Implement `get_audit_trail()`

#### 3. TransactionIDMiddleware (Used by all services)
- [ ] Implement `get_transaction_id()`
- [ ] Implement `set_transaction_id()`
- [ ] Implement `generate_transaction_id()`
- [ ] Implement `TransactionIDMiddleware.__call__()`
- [ ] Implement `TransactionIDMiddleware.process_view()`
- [ ] Implement `TransactionIDContextManager.__enter__()` and `__exit__()`
- [ ] Implement `TransactionIDFilter.filter()`

#### 4. MappingService (FHIR Conversions)
- [ ] Implement `PatientToFHIRMapper.map_patient_to_fhir()`
  - [ ] `_build_identifiers()`
  - [ ] `_build_name()`
  - [ ] `_build_address()`
  - [ ] `_build_telecom()`
  - [ ] `_build_extensions()`
  - [ ] `_build_emergency_contact()`
- [ ] Implement `FHIRToPatientMapper.map_fhir_to_patient()`
  - [ ] `_extract_identifiers()`
  - [ ] `_extract_name()`
  - [ ] `_extract_demographics()`
  - [ ] `_extract_address()`
  - [ ] `_extract_telecom()`
  - [ ] `_extract_extensions()`
  - [ ] `_extract_emergency_contact()`
- [ ] Implement `BundleMapper.map_bundle_to_local()`
  - [ ] `_map_resource()` dispatcher
- [ ] Implement `MappingService` wrapper methods

#### 5. RetryService (Resilience)
- [ ] Implement `should_retry()`
- [ ] Implement `calculate_retry_delay()`
  - [ ] Exponential backoff calculation
  - [ ] Linear backoff calculation
  - [ ] Fixed delay calculation
  - [ ] Jitter application
- [ ] Implement `calculate_next_retry_time()`
- [ ] Implement `is_request_expired()`
- [ ] Implement `should_continue_retrying()`
- [ ] Implement `get_next_retry_info()`
- [ ] Implement `RetryScheduler.schedule_retry()` (Celery integration)
- [ ] Implement `RetryScheduler.execute_retry()`

#### 6. MatchingService (Patient Deduplication)
- [ ] Implement `ExactIdentifierMatcher.match()`
  - Identifiers: PhilHealth, National, Internal
- [ ] Implement `DemographicMatcher.match()`
  - Exact name + birthdate + gender matching
- [ ] Implement `FuzzyDemographicMatcher.match()`
  - Levenshtein distance for names
  - Age tolerance support
- [ ] Implement `ContactInfoMatcher.match()`
  - Phone and address matching
- [ ] Implement `MatchingService.match_patient()`
  - Priority chain of matchers
- [ ] Implement `MatchingService.find_duplicate_patients()`
- [ ] Implement `MatchingService.merge_duplicate_patients()`
- [ ] Implement `MatchingStatistics.get_matching_statistics()`
- [ ] Implement helper functions: `_levenshtein_distance()`, `_similarity_score()`

#### 7. FHIRService (Outbound Requests)
- [ ] Implement `_build_headers()`
  - X-API-Key, X-Transaction-ID, Idempotency-Key
  - Content-Type: application/fhir+json
- [ ] Implement `_handle_response()`
  - Parse JSON, handle status codes, extract transaction_id
- [ ] Implement `send_fhir_request()`
  - Validate FHIR resource, build headers, POST, handle response & retries
- [ ] Implement `push_fhir_resource()`
  - Similar to send_fhir_request but for /fhir/push
- [ ] Implement `get_providers()`
  - GET /api/v1/providers
- [ ] Implement `get_transaction_status()`
  - GET /api/v1/transactions/{id}
- [ ] Implement `FHIRRequestProcessor.process_request_async()`
  - Celery task for async processing

#### 8. WebhookService (Inbound Processing)
- [ ] Implement `WebhookValidator.validate_signature()`
  - HMAC-SHA256 validation with constant-time comparison
- [ ] Implement `ProcessQueryWebhookProcessor.process()`
  - Match patient, gather resources, convert to FHIR, send response
- [ ] Implement `ReceiveResultsWebhookProcessor.process()`
  - Validate transaction, match patients, convert FHIR, store data
- [ ] Implement `ReceivePushWebhookProcessor.process()`
  - Match patient, convert FHIR, store data
- [ ] Implement `WebhookService.handle_process_query()`
- [ ] Implement `WebhookService.handle_receive_results()`
- [ ] Implement `WebhookService.handle_receive_push()`
- [ ] Implement `WebhookProcessor_Async.process_webhook_async()`
  - Celery task for async webhook processing

### Phase 3: API Views & Integration

- [ ] Create Django view for POST /fhir/process-query
  - Call WebhookService.handle_process_query()
  - Validate X-Gateway-Auth header
  - Return 202 Accepted

- [ ] Create Django view for POST /fhir/receive-results
  - Call WebhookService.handle_receive_results()
  - Validate X-Gateway-Auth header
  - Return 202 Accepted

- [ ] Create Django view for POST /fhir/receive-push
  - Call WebhookService.handle_receive_push()
  - Validate X-Gateway-Auth header
  - Return 202 Accepted

- [ ] Add views to patients/urls.py

- [ ] Create API endpoint for fetching transaction status
  - GET /api/patients/wah4pc/transactions/{transaction_id}

- [ ] Create API endpoint for initiating outbound request (example)
  - POST /api/patients/wah4pc/request

### Phase 4: Async Processing (Celery)

- [ ] Configure Celery:
  - [ ] Create celery.py in wah4h/ project root
  - [ ] Add Celery app initialization
  - [ ] Configure broker (Redis, RabbitMQ)

- [ ] Create Celery tasks in patients/tasks.py:
  - [ ] Task for FHIRService.send_fhir_request()
  - [ ] Task for webhook processing (per processor type)
  - [ ] Task for retry execution (RetryScheduler.execute_retry())
  - [ ] Periodic task for cleanup_stale_transactions()

- [ ] Update services to use Celery (inject task references)

### Phase 5: Testing

- [ ] Unit tests for TransactionService (all methods)
- [ ] Unit tests for MappingService (all mappers)
- [ ] Unit tests for MatchingService (all matchers)
- [ ] Unit tests for RetryService (backoff calculations)
- [ ] Unit tests for LoggingService (log creation and querying)
- [ ] Unit tests for WebhookService (signature validation)
- [ ] Unit tests for FHIRService (header composition)
- [ ] Unit tests for TransactionIDMiddleware
- [ ] Integration tests for full request/response cycles
- [ ] Integration tests for webhook processing
- [ ] Mock WAH4PC Gateway for testing

### Phase 6: Monitoring & Documentation

- [ ] Create admin dashboard for transactions
  - [ ] WAH4PCTransaction model admin
  - [ ] InteroperabilityLog model admin
  - [ ] Filters and search

- [ ] Create monitoring API endpoints:
  - [ ] GET /api/patients/wah4pc/statistics (transaction stats)
  - [ ] GET /api/patients/wah4pc/audit-trail/{transaction_id}
  - [ ] GET /api/patients/wah4pc/logs (query logs)

- [ ] Add API documentation (OpenAPI/Swagger)
  - [ ] Webhook endpoints
  - [ ] Transaction status endpoints
  - [ ] Monitoring endpoints

- [ ] Create deployment guide
- [ ] Create troubleshooting guide
- [ ] Add health check endpoint

---

## Dependency Graph

```
TransactionIDMiddleware (foundation)
    ↓
TransactionService
    ↓
FHIRService ← LoggingService ← RetryService
WebhookService ← MappingService ← MatchingService
```

**Load order for initialization**:
1. TransactionIDMiddleware (in Django MIDDLEWARE first)
2. TransactionService
3. LoggingService
4. RetryService
5. MappingService
6. MatchingService
7. FHIRService (uses 2, 3, 4, 5)
8. WebhookService (uses 2, 3, 5, 6, 7)

---

## Key Implementation Notes

### 1. Context Variables
- Use `contextvars.ContextVar` for transaction ID (async-safe)
- Fall back to `threading.local` for older Django versions
- Middleware automatically sets/gets transaction ID

### 2. Database Transactions
- Wrap service methods with Django transaction management:
  ```python
  from django.db import transaction
  
  with transaction.atomic():
      success, tx_id, error = tx_service.create_outbound_transaction(...)
      success, error = logging_service.log_outbound_request(...)
  ```

### 3. Error Handling
- Services return `Tuple[bool, Optional[result], Optional[str]]` for consistency
- Always return tuple, never raise exceptions (for service layer)
- Log all errors via LoggingService
- Use appropriate HTTP status codes in views

### 4. Idempotency
- Always provide idempotency_key for outbound requests
- Can use request signature hash or custom key
- Service checks for duplicates and returns existing transaction

### 5. String Representation
- Always include transaction_id in error messages for traceability
- Use logging filter to automatically inject transaction_id into all logs
- Include transaction_id in API responses

### 6. Async Processing
- Queue all long-running operations via Celery
- Use `apply_async()` with `countdown` or `eta` parameter for scheduling
- Update transaction status periodically
- Provide status query endpoint for clients

### 7. FHIR Standards
- Validate FHIR resources before sending
- Use proper FHIR coding systems and identifiers
- Map Philippine-specific extensions correctly
- Support multiple resource types (not just Patient)

### 8. Philippine Context
- Support PhilHealth ID as primary identifier
- Support National ID as secondary identifier
- Include PWD status, indigenous status in extensions
- Support Philippine address format (region, province, municipality)
- Use correct gender vocabulary (male, female, other, unknown)
- Support Philippine phone number format

---

## Quick Start for Developers

To use the WAH4PC services in your code:

```python
# In your view or service method:

from patients.middleware import get_transaction_id
from patients.services import (
    TransactionService, TransactionType, TransactionStatus,
    LoggingService, FHIRService, FHIRResourceType,
    MappingService, MatchingService, RetryService
)

transaction_id = get_transaction_id()

# Initialize services
tx_service = TransactionService()
logging_service = LoggingService()
mapping_service = MappingService()
matching_service = MatchingService()
retry_service = RetryService()
fhir_service = FHIRService(api_key=settings.WAH4PC_API_KEY)

# Create transaction
success, tx_id, error = tx_service.create_outbound_transaction(
    transaction_type=TransactionType.FHIR_REQUEST,
    patient_id=patient.id,
    target_provider_id='provider-123'
)

if success:
    # Map patient to FHIR
    success, fhir_resource, error = mapping_service.local_patient_to_fhir(patient)
    
    if success:
        # Send to gateway
        success, response = fhir_service.send_fhir_request(
            resource_type=FHIRResourceType.PATIENT,
            fhir_resource=fhir_resource,
            target_provider_id='provider-123',
            transaction_id=transaction_id
        )
        
        if success:
            tx_service.mark_transaction_completed(tx_id)
        else:
            # Handle error...pass
            
        # Log the operation
        logging_service.log_outbound_response(
            transaction_id=transaction_id,
            status_code=response.get('http_status')
        )
```

---

## Resources

- WAH4PC API Docs: https://wah4pc.echosphere.cfd/docs
- FHIR Specification: http://hl7.org/fhir/
- Django Documentation: https://docs.djangoproject.com/
- Celery Documentation: https://docs.celeryproject.org/
- HMAC-SHA256 Reference: https://tools.ietf.org/html/rfc2104

---

Last Updated: 2026-02-11
Status: Stub files created, ready for implementation
