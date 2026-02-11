"""
patients/services/__init__.py

Export public services and ACLs for the Patients module.

Includes WAH4PC services for FHIR interoperability:
- FHIRService: Outbound FHIR requests and pushes
- WebhookService: Inbound webhook processing
- MappingService: FHIR ↔ Local Patient transformations
- TransactionService: Transaction lifecycle management
- LoggingService: Structured event logging
- RetryService: Exponential backoff and retry logic
- MatchingService: Patient matching and deduplication
"""

from .patient_acl import (
    validate_patient_exists,
    get_patient_summary,
    get_patient_details
)

from .patients_services import (
    PatientRegistrationService,
    PatientUpdateService,
    ClinicalDataService,
)

# WAH4PC FHIR Interoperability Services
from .fhir_service import (
    FHIRService,
    FHIRResourceType,
    FHIRRequestProcessor,
)

from .webhook_service import (
    WebhookService,
    WebhookValidator,
    ProcessQueryWebhookProcessor,
    ReceiveResultsWebhookProcessor,
    ReceivePushWebhookProcessor,
    WebhookProcessor_Async,
)

from .mapping_service import (
    MappingService,
    PatientToFHIRMapper,
    FHIRToPatientMapper,
    BundleMapper,
    FHIRMapping,
)

from .transaction_service import (
    TransactionService,
    TransactionStatus,
    TransactionType,
)

from .logging_service import (
    LoggingService,
    InteroperabilityEventType,
    VerbosityLevel,
)

from .retry_service import (
    RetryService,
    RetryConfig,
    RetryStrategy,
    RetryScheduler,
)

from .matching_service import (
    MatchingService,
    ExactIdentifierMatcher,
    DemographicMatcher,
    FuzzyDemographicMatcher,
    ContactInfoMatcher,
    PatientMatch,
    MatchQuality,
    MatchingStatistics,
)

__all__ = [
    # Legacy
    'validate_patient_exists',
    'get_patient_summary',
    'get_patient_details',
    'PatientRegistrationService',
    'PatientUpdateService',
    'ClinicalDataService',
    # WAH4PC FHIR Services
    'FHIRService',
    'FHIRResourceType',
    'FHIRRequestProcessor',
    'WebhookService',
    'WebhookValidator',
    'ProcessQueryWebhookProcessor',
    'ReceiveResultsWebhookProcessor',
    'ReceivePushWebhookProcessor',
    'WebhookProcessor_Async',
    'MappingService',
    'PatientToFHIRMapper',
    'FHIRToPatientMapper',
    'BundleMapper',
    'FHIRMapping',
    'TransactionService',
    'TransactionStatus',
    'TransactionType',
    'LoggingService',
    'InteroperabilityEventType',
    'VerbosityLevel',
    'RetryService',
    'RetryConfig',
    'RetryStrategy',
    'RetryScheduler',
    'MatchingService',
    'ExactIdentifierMatcher',
    'DemographicMatcher',
    'FuzzyDemographicMatcher',
    'ContactInfoMatcher',
    'PatientMatch',
    'MatchQuality',
    'MatchingStatistics',
]