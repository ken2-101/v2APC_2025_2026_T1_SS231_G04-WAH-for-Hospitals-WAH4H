"""
Celery tasks for WAH4PC integration.
Provides async processing for gateway webhooks.
"""

from celery import shared_task
import logging
import os
import requests as http_requests
from patients.models import Patient, WAH4PCTransaction
from patients.services.mapping_service import MappingService

logger = logging.getLogger(__name__)
mapping_service = MappingService()


@shared_task(bind=True, max_retries=3)
def process_gateway_query_async(
    self,
    transaction_id: str,
    identifiers: list,
    return_url: str,
    requester_id: str = None,
):
    """
    Asynchronously process incoming gateway query and send results.
    
    This task is called by webhook_process_query() to handle the actual
    database search and HTTP response without blocking the endpoint.
    
    Args:
        transaction_id: Gateway transaction ID
        identifiers: List of FHIR identifiers (system/value pairs)
        return_url: Gateway webhook return URL
        requester_id: Optional requester provider ID for logging
        
    Retries on network failures (up to 3 times with exponential backoff)
    """
    import uuid
    
    logger.info(f"[Task] Processing gateway query transaction: {transaction_id}")
    
    try:
        # Search for patient using provided identifiers
        patient = None
        for ident in identifiers:
            system = ident.get('system', '').lower()
            value = ident.get('value')

            if not value:
                continue

            # PhilHealth ID
            if 'philhealth' in system:
                patient = Patient.objects.filter(philhealth_id=value).first()

            # Medical Record Number (MRN)
            elif 'mrn' in system or 'medical-record' in system:
                patient = Patient.objects.filter(patient_id=value).first()

            # Mobile number
            elif 'phone' in system or 'mobile' in system:
                patient = Patient.objects.filter(mobile_number=value).first()

            # If patient found, stop searching
            if patient:
                logger.info(f"[Task] Found patient {patient.id} for transaction {transaction_id}")
                break
        
        if not patient:
            logger.warning(f"[Task] Patient not found for transaction {transaction_id}")

        # Convert patient to FHIR if found
        fhir_data = mapping_service.local_patient_to_fhir(patient) if patient else {"error": "Not found"}
        
        # Generate idempotency key for this response
        idempotency_key = str(uuid.uuid4())
        
        # Send response to gateway
        response = http_requests.post(
            return_url,
            headers={
                "X-API-Key": os.getenv('WAH4PC_API_KEY'),
                "X-Provider-ID": os.getenv('WAH4PC_PROVIDER_ID'),
                "Idempotency-Key": idempotency_key,
            },
            json={
                "transactionId": transaction_id,
                "status": "SUCCESS" if patient else "REJECTED",
                "data": fhir_data,
            },
            timeout=30,
        )
        
        response.raise_for_status()
        logger.info(f"[Task] Successfully sent gateway response for transaction {transaction_id}")
        
    except http_requests.RequestException as e:
        logger.error(f"[Task] Network error sending response for {transaction_id}: {str(e)}")
        
        # Retry with exponential backoff (5s, 25s, 125s)
        raise self.retry(exc=e, countdown=5 ** self.request.retries, max_retries=3)
        
    except Exception as e:
        logger.error(f"[Task] Unexpected error processing query {transaction_id}: {str(e)}")
        raise
