"""
Retry Service - Exponential Backoff and Retry Logic

Implements retry strategy for outbound FHIR requests.

Responsibilities:
- Exponential backoff calculation
- Determine if request should be retried
- Calculate next retry time
- Track retry attempts
- Handle max retry limits
- Respect 429 (rate limit) responses
- Log retry attempts

Retryable status codes:
- 429: Rate Limited (exponential backoff)
- 500-503: Server Errors (exponential backoff)
- 408: Request Timeout (exponential backoff)
- Connection errors, timeouts: exponential backoff

Non-retryable status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
"""

import logging
from typing import Tuple, Optional
from datetime import datetime, timedelta
from enum import Enum
import random

logger = logging.getLogger(__name__)


class RetryStrategy(Enum):
    """Retry strategy options."""
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    LINEAR_BACKOFF = "linear_backoff"
    FIXED_DELAY = "fixed_delay"


class RetryConfig:
    """Configuration for retry behavior."""
    
    def __init__(
        self,
        strategy: RetryStrategy = RetryStrategy.EXPONENTIAL_BACKOFF,
        max_retries: int = 5,
        initial_delay_seconds: int = 1,
        max_delay_seconds: int = 300,  # 5 minutes
        backoff_multiplier: float = 2.0,
        jitter_enabled: bool = True,
    ):
        """
        Initialize retry configuration.
        
        Args:
            strategy: Retry strategy (exponential, linear, fixed)
            max_retries: Maximum number of retry attempts
            initial_delay_seconds: Initial delay before first retry
            max_delay_seconds: Maximum delay between retries
            backoff_multiplier: Multiplier for exponential backoff (typically 2.0)
            jitter_enabled: Add random jitter to prevent thundering herd
        """
        self.strategy = strategy
        self.max_retries = max_retries
        self.initial_delay_seconds = initial_delay_seconds
        self.max_delay_seconds = max_delay_seconds
        self.backoff_multiplier = backoff_multiplier
        self.jitter_enabled = jitter_enabled


class RetryService:
    """
    Service for managing retry logic for outbound requests.
    
    Default configuration:
    - Exponential backoff: 1s, 2s, 4s, 8s, 16s, ...
    - Max retries: 5
    - Max delay: 300s (5 minutes)
    - Jitter: enabled (±20% randomness)
    
    TODO: Inject dependencies:
    - logging_service
    - transaction_service
    """
    
    def __init__(self, config: Optional[RetryConfig] = None):
        """
        Initialize retry service.
        
        Args:
            config: RetryConfig instance (uses defaults if None)
        """
        self.config = config or RetryConfig()
    
    def should_retry(
        self,
        http_status: Optional[int] = None,
        exception_type: Optional[str] = None,
        retry_count: int = 0,
    ) -> Tuple[bool, Optional[str]]:
        """
        Determine if request should be retried.
        
        Args:
            http_status: HTTP status code (if applicable)
            exception_type: Exception type (ConnectionError, TimeoutError, etc.)
            retry_count: Current retry attempt number
        
        Returns:
            Tuple[
                should_retry: bool,
                reason: Optional[str] (reason for retry decision)
            ]
        
        Rules:
        - Retryable: 429, 408, 5xx, connection errors, timeouts
        - Non-retryable: 4xx (except 408, 429), 2xx, 3xx
        - Max retries: stop after max_retries attempts
        """
        # TODO: Implement
        # 1. If retry_count >= max_retries, return (False, "Max retries exceeded")
        # 2. If http_status provided:
        #    - 429: return (True, "Rate Limited")
        #    - 408: return (True, "Request Timeout")
        #    - 500-599: return (True, "Server Error")
        #    - 4xx: return (False, "Client Error - not retryable")
        #    - 2xx, 3xx: return (False, "Success/Redirect - not retryable")
        # 3. If exception_type provided:
        #    - "ConnectionError", "TimeoutError", "RequestException": return (True, exception_type)
        #    - Other: return (False, "Unknown exception - not retryable")
        # 4. Default: return (False, "No retry criteria met")
        pass
    
    def calculate_retry_delay(
        self,
        retry_count: int,
        rate_limit_retry_after: Optional[int] = None,
    ) -> int:
        """
        Calculate delay (in seconds) before next retry.
        
        Args:
            retry_count: Current retry attempt number (0-indexed)
            rate_limit_retry_after: Retry-After header value (seconds), if received
        
        Returns:
            Delay in seconds
        
        Behavior:
        - If rate_limit_retry_after provided, return it (prefer server's guidance)
        - Else calculate based on strategy (exponential, linear, fixed)
        - Add jitter if enabled (±20% randomness)
        - Cap at max_delay_seconds
        """
        # TODO: Implement
        # 1. If rate_limit_retry_after provided:
        #    - Add jitter if enabled
        #    - Cap at max_delay_seconds
        #    - Return result
        # 2. Calculate base delay based on strategy:
        #    a. EXPONENTIAL_BACKOFF:
        #       delay = initial_delay * (multiplier ^ retry_count)
        #    b. LINEAR_BACKOFF:
        #       delay = initial_delay * retry_count
        #    c. FIXED_DELAY:
        #       delay = initial_delay
        # 3. Cap at max_delay_seconds
        # 4. Add jitter if enabled:
        #    - Random factor: 0.8 to 1.2 (±20%)
        #    - delay = delay * random_factor
        # 5. Return delay as int (seconds)
        pass
    
    def calculate_next_retry_time(
        self,
        retry_count: int,
        rate_limit_retry_after: Optional[int] = None,
    ) -> Tuple[datetime, int]:
        """
        Calculate when next retry should occur.
        
        Args:
            retry_count: Current retry attempt number
            rate_limit_retry_after: Retry-After header value (seconds), if received
        
        Returns:
            Tuple[
                retry_at: datetime (when retry should occur),
                delay_seconds: int (delay in seconds)
            ]
        """
        # TODO: Implement
        # 1. Call calculate_retry_delay() to get delay_seconds
        # 2. Calculate retry_at = now() + delay_seconds
        # 3. Return (retry_at, delay_seconds)
        pass
    
    def is_request_expired(
        self,
        created_at: datetime,
        timeout_seconds: int = 3600,
    ) -> bool:
        """
        Check if request has expired and should not be retried.
        
        Args:
            created_at: When request was originally made
            timeout_seconds: Request lifetime (default 1 hour)
        
        Returns:
            True if request is too old to retry
        """
        # TODO: Implement
        # 1. Calculate age = now() - created_at
        # 2. If age > timeout_seconds, return True
        # 3. Else return False
        pass
    
    def should_continue_retrying(
        self,
        transaction_id: str,
        retry_count: int,
        created_at: datetime,
        http_status: Optional[int] = None,
        exception_type: Optional[str] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Comprehensive check for whether retry should continue.
        
        Considers:
        - Max retry limit
        - Request expiration
        - Retryability of error
        
        Args:
            transaction_id: Transaction ID (for logging)
            retry_count: Current retry attempt number
            created_at: When request was originally made
            http_status: HTTP status code (if applicable)
            exception_type: Exception type (if applicable)
        
        Returns:
            Tuple[should_continue: bool, reason: Optional[str]]
        """
        # TODO: Implement
        # 1. Check if request is expired via is_request_expired()
        #    - If expired, return (False, "Request expired")
        # 2. Check if should_retry() returns True
        #    - If not retryable, return (False, reason)
        # 3. Check if retry_count < max_retries
        #    - If exceeded, return (False, "Max retries exceeded")
        # 4. All checks passed, return (True, None)
        pass
    
    def get_next_retry_info(
        self,
        transaction_id: str,
        retry_count: int,
        created_at: datetime,
        http_status: Optional[int] = None,
        exception_type: Optional[str] = None,
        rate_limit_retry_after: Optional[int] = None,
    ) -> Tuple[bool, Optional[dict]]:
        """
        Get comprehensive retry information for decision-making.
        
        Args:
            transaction_id: Transaction ID
            retry_count: Current retry attempt number
            created_at: When request was originally made
            http_status: HTTP status code (if applicable)
            exception_type: Exception type (if applicable)
            rate_limit_retry_after: Retry-After header value (seconds)
        
        Returns:
            Tuple[
                should_retry: bool,
                retry_info: Optional[Dict] containing:
                    {
                        'should_retry': bool,
                        'retry_count': int (next retry attempt number),
                        'delay_seconds': int,
                        'retry_at': datetime,
                        'reason': str (if not retrying)
                    }
            ]
        
        Example response (if retry should occur):
        {
            'should_retry': True,
            'retry_count': 2,
            'delay_seconds': 4,
            'retry_at': datetime(...),
            'reason': 'Rate Limited'
        }
        """
        # TODO: Implement
        # 1. Call should_continue_retrying() to check overall retry eligibility
        # 2. If should_continue_retrying() returns False:
        #    - Return (False, {'should_retry': False, 'reason': reason})
        # 3. If should continue:
        #    a. Calculate delay and next retry time
        #    b. Return (True, {
        #       'should_retry': True,
        #       'retry_count': retry_count + 1,
        #       'delay_seconds': delay,
        #       'retry_at': retry_at,
        #       'reason': 'Retryable error'
        #    })
        pass


class RetryScheduler:
    """
    Scheduler for executing retries.
    
    TODO: Use Celery or APScheduler for scheduling retries
    
    Responsibilities:
    - Queue retry tasks
    - Schedule retry execution at calculated time
    - Ensure retry is executed at correct time
    - Handle retry execution and result notification
    """
    
    def schedule_retry(
        self,
        transaction_id: str,
        retry_at: datetime,
        retry_info: dict,
    ) -> Tuple[bool, Optional[str]]:
        """
        Schedule a retry to execute at specified time.
        
        Args:
            transaction_id: Transaction ID to retry
            retry_at: When retry should execute
            retry_info: Retry information from get_next_retry_info()
        
        Returns:
            Tuple[success: bool, error: Optional[str]]
        
        TODO: Implement using Celery apply_async with eta parameter:
        - Calculate ETA from retry_at
        - Queue task with Celery
        - Store retry schedule in database (optional)
        """
        # TODO: Implement
        # 1. Calculate ETA from retry_at
        # 2. Queue retry task:
        #    - Use Celery apply_async() or APScheduler
        #    - Pass transaction_id and retry_info to task
        #    - Set eta parameter
        # 3. Log scheduled retry to InteroperabilityLog
        # 4. Update Transaction record with retry info
        # 5. Return (True, None) or (False, error_msg)
        pass
    
    def execute_retry(
        self,
        transaction_id: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        Execute retry for transaction.
        
        Called by scheduled task or manual trigger.
        
        Args:
            transaction_id: Transaction ID to retry
        
        Returns:
            Tuple[success: bool, error: Optional[str]]
        
        TODO: Implement:
        - Fetch transaction and original request details
        - Re-execute outbound request via fhir_service
        - Handle retry result (success, fail, needs another retry)
        - Update transaction status
        - Log result
        """
        # TODO: Implement
        # 1. Fetch transaction from transaction_service
        # 2. Fetch original request details from InteroperabilityLog
        # 3. Re-execute request via FHIRService
        # 4. Handle response:
        #    a. Success: mark transaction COMPLETED
        #    b. Retryable error: schedule another retry (up to max)
        #    c. Non-retryable error: mark transaction FAILED
        # 5. Log result to InteroperabilityLog
        # 6. Return (True, None) or (False, error_msg)
        pass
