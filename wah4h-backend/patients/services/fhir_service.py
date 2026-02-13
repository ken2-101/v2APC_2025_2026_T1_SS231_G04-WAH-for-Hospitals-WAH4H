"""
FHIR Service - Outbound FHIR Request & Push Logic

Handles outbound FHIR requests to WAH4PC Gateway:
- POST /api/v1/fhir/request/{resourceType}
- POST /api/v1/fhir/push/{resourceType}

Responsibilities:
- Build FHIR requests with proper headers (X-API-Key, Idempotency-Key, X-Provider-ID)
- Handle request/response serialization
- Implement error handling for specific status codes (409, 429)
- Log transactions and errors
- Track transaction status
"""

import logging
import json
import uuid
import os
from typing import Dict, Optional, Any, Tuple
from datetime import datetime
from enum import Enum

import requests

logger = logging.getLogger(__name__)


class FHIRResourceType(Enum):
    """Supported FHIR resource types."""
    PATIENT = "Patient"
    BUNDLE = "Bundle"
    OBSERVATION = "Observation"
    MEDICATION = "Medication"
    IMMUNIZATION = "Immunization"
    CONDITION = "Condition"
    ALLERGY_INTOLERANCE = "AllergyIntolerance"


class FHIRService:
    """
    Service for handling outbound FHIR requests to WAH4PC Gateway.
    
    Features:
    - Request composition with authentication headers
    - Idempotency key generation and management
    - Proper error handling for 409 (conflict), 429 (rate limit)
    - Logging and transaction tracking
    - No database access (stateless)
    """
    
    BASE_URL = "https://wah4pc.echosphere.cfd"
    REQUEST_TIMEOUT = 30  # seconds
    
    def __init__(self, api_key: Optional[str] = None, provider_id: Optional[str] = None):
        """
        Initialize FHIR service.
        
        Args:
            api_key: WAH4PC API key for authentication (defaults to env var)
            provider_id: Provider ID (defaults to env var)
        """
        self.api_key = api_key or os.getenv("WAH4PC_API_KEY")
        self.provider_id = provider_id or os.getenv("WAH4PC_PROVIDER_ID")
    
    def request_patient(
        self,
        target_id: str,
        philhealth_id: str,
        resource_type: str = "Patient",
        idempotency_key: Optional[str] = None,
        reason: str = "Patient data request",
        notes: str = None,
    ) -> Dict[str, Any]:
        """
        Request FHIR resource data from another provider via WAH4PC gateway.

        Args:
            target_id: Target provider UUID
            philhealth_id: PhilHealth ID to search for
            resource_type: FHIR resource type to request (defaults to "Patient")
            idempotency_key: Optional idempotency key for retry safety (generated if not provided)
            reason: Reason for request (optional, defaults to "Patient data request")
            notes: Additional notes about the request (optional)

        Returns:
            dict: Response with 'data' key on success, or 'error' and 'status_code' on failure
        """
        if not idempotency_key:
            idempotency_key = str(uuid.uuid4())

        try:
            # Build request body with optional reason and notes
            request_body = {
                "requesterId": self.provider_id,
                "targetId": target_id,
                "identifiers": [
                    {"system": "http://philhealth.gov.ph", "value": philhealth_id}
                ],
                "resourceType": resource_type,
                "reason": reason,
            }
            
            if notes:
                request_body["notes"] = notes
            
            response = requests.post(
                f"{self.BASE_URL}/api/v1/fhir/request/{resource_type}",
                headers=self._build_headers(idempotency_key),
                json=request_body,
                timeout=self.REQUEST_TIMEOUT,
            )

            return self._handle_response(response, idempotency_key)

        except requests.RequestException as e:
            logger.error(f"[FHIR] Network error requesting patient: {str(e)}")
            return {
                'error': f'Network error: {str(e)}',
                'status_code': 500,
                'idempotency_key': idempotency_key
            }

    def push_patient(
        self,
        target_id: str,
        fhir_resource: Dict[str, Any],
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Push patient data to another provider via WAH4PC gateway.

        Args:
            target_id: Target provider UUID
            fhir_resource: FHIR Patient resource to send
            idempotency_key: Optional idempotency key for retry safety (generated if not provided)

        Returns:
            dict: Response with transaction data on success, or 'error' and 'status_code' on failure
        """
        if not idempotency_key:
            idempotency_key = str(uuid.uuid4())

        try:
            response = requests.post(
                f"{self.BASE_URL}/api/v1/fhir/push/Patient",
                headers=self._build_headers(idempotency_key),
                json={
                    "senderId": self.provider_id,
                    "targetId": target_id,
                    "resourceType": "Patient",
                    "data": fhir_resource,
                },
                timeout=self.REQUEST_TIMEOUT,
            )

            return self._handle_response(response, idempotency_key)

        except requests.RequestException as e:
            logger.error(f"[FHIR] Network error pushing patient: {str(e)}")
            return {
                'error': f'Network error: {str(e)}',
                'status_code': 500,
                'idempotency_key': idempotency_key
            }

    def get_providers(self) -> list:
        """
        Fetch all registered providers from WAH4PC gateway (public endpoint).

        Returns:
            list: List of active provider dictionaries with id, name, type, isActive fields
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/api/v1/providers",
                timeout=self.REQUEST_TIMEOUT
            )

            if response.status_code == 200:
                result = response.json()
                # Handle both wrapped {"data": [...]} and flat array formats
                providers = result.get("data", result) if isinstance(result, dict) else result
                # Filter to only return active providers
                return [p for p in providers if p.get("isActive", True)]

            logger.warning(f"[FHIR] Failed to fetch providers: HTTP {response.status_code}")
            return []

        except requests.RequestException as e:
            logger.error(f"[FHIR] Error fetching providers: {str(e)}")
            return []

    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """
        Get transaction details from WAH4PC gateway.

        Args:
            transaction_id: Transaction ID to retrieve

        Returns:
            dict: Response with transaction details, or 'error' and 'status_code' on failure
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/api/v1/transactions/{transaction_id}",
                headers={
                    "X-API-Key": self.api_key,
                    "X-Provider-ID": self.provider_id,
                },
                timeout=self.REQUEST_TIMEOUT,
            )

            if response.status_code >= 400:
                error_msg = response.json().get('error', 'Unknown error') if response.text else 'Unknown error'
                logger.warning(f"[FHIR] Failed to get transaction {transaction_id}: {error_msg}")
                return {
                    'error': error_msg,
                    'status_code': response.status_code
                }

            return response.json()

        except requests.RequestException as e:
            logger.error(f"[FHIR] Network error getting transaction: {str(e)}")
            return {
                'error': f'Network error: {str(e)}',
                'status_code': 500
            }

    def _build_headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        """
        Build request headers for WAH4PC Gateway.
        
        Headers:
        - Content-Type: application/json
        - X-API-Key: {api_key}
        - X-Provider-ID: {provider_id}
        - Idempotency-Key: {idempotency_key} (if provided)
        
        Args:
            idempotency_key: Idempotency key for request
        
        Returns:
            Dict of headers
        """
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "X-Provider-ID": self.provider_id,
        }
        
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key
            
        return headers

    def _handle_response(self, response: requests.Response, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Handle WAH4PC Gateway response.
        
        Handles specific error codes:
        - 409: Request in progress (conflict)
        - 429: Rate limit exceeded
        - 4xx/5xx: Other errors
        
        Args:
            response: requests.Response object
            idempotency_key: Idempotency key for response tracking
        
        Returns:
            Dict with status, data, error info
        """
        result = {}
        
        # Handle specific error codes
        if response.status_code == 409:
            result['error'] = 'Request in progress, retry later'
            result['status_code'] = 409
            logger.warning("[FHIR] Received 409 (conflict)")
            
        elif response.status_code == 429:
            result['error'] = 'Rate limit exceeded or duplicate request'
            result['status_code'] = 429
            logger.warning("[FHIR] Received 429 (rate limit)")
            
        elif response.status_code >= 400:
            try:
                error_msg = response.json().get('error', 'Unknown error') if response.text else 'Unknown error'
            except (ValueError, KeyError):
                error_msg = 'Unknown error'
            result['error'] = error_msg
            result['status_code'] = response.status_code
            logger.warning(f"[FHIR] Received {response.status_code}: {error_msg}")
            
        else:
            # Success (2xx status)
            try:
                body = response.json()
                result.update(body)
            except ValueError:
                result['error'] = 'Failed to parse response'
                result['status_code'] = 500

        if idempotency_key:
            result['idempotency_key'] = idempotency_key
            
        return result


class FHIRRequestProcessor:
    """
    Async processor for outbound FHIR requests.
    
    TODO: Use Celery or threading for async processing:
    - Queue outbound requests
    - Process with retry logic
    - Update transaction status
    - Handle timeouts and failures
    """

    
    def process_request_async(
        self,
        service: FHIRService,
        resource_type: FHIRResourceType,
        fhir_resource: Dict[str, Any],
        target_provider_id: str,
        transaction_id: str,
    ) -> None:
        """
        Process FHIR request asynchronously.
        
        TODO: Implement using Celery or threading:
        - Use @celery.task decorator or Thread
        - Call service.send_fhir_request()
        - Handle retries
        - Update transaction status
        """
        # TODO: Implement async processing
        # - May use Celery task or threading.Thread
        # - Call FHIRService.send_fhir_request()
        # - Implement retry logic via retry_service
        # - Log progress to InteroperabilityLog
        pass
