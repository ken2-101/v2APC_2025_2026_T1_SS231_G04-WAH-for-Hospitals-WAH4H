"""
Matching Service - Patient Matching and Deduplication

Handles patient matching/deduplication logic.

Responsibilities:
- Match local patients against incoming FHIR identifiers
- Deduplication of received data
- Support multiple matching algorithms
- Quality scoring for matches
- Handle edge cases (missing data, partial matches, conflicts)
- Logging of matching operations

Matching priority (philippine context):
1. Exact identifiers (PhilHealth ID, National ID, etc.)
2. Demographic match (name + birthdate + gender)
3. Fuzzy name match (Levenshtein distance) + demographic
4. Contact info match (phone, address)
5. No match found - create new patient or flag for review

Matching quality:
- EXACT: 1.0 (identifier match)
- VERY_HIGH: 0.95+ (birthday + name + gender exact)
- HIGH: 0.85-0.95 (fuzzy name + demographics)
- MEDIUM: 0.70-0.85 (partial demographic match)
- LOW: < 0.70 (speculative match)
- NO_MATCH: Consider creating new patient or flag for manual review
"""

import logging
from typing import Dict, Optional, List, Tuple, Any
from dataclasses import dataclass
from enum import Enum
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class MatchQuality(Enum):
    """Patient match quality levels."""
    EXACT = 1.0
    VERY_HIGH = 0.95
    HIGH = 0.85
    MEDIUM = 0.70
    LOW = 0.50
    NO_MATCH = 0.0


@dataclass
class PatientMatch:
    """Result of patient matching operation."""
    patient_id: Optional[int]     # Matched patient ID (None if no match)
    quality: MatchQuality         # Match quality level
    score: float                  # Match score (0.0 - 1.0)
    reason: str                   # Why this match was selected
    matched_on: List[str]         # Fields used for matching
    confidence: float             # Confidence in match (0.0 - 1.0)
    alternatives: Optional[List[Tuple[int, float]]] = None  # [( patient_id, score), ...]


class MatchingAlgorithm(ABC):
    """Base class for matching algorithms."""
    
    @abstractmethod
    def match(self, fhir_identifiers: Dict[str, Any], patient_query_set) -> Optional[PatientMatch]:
        """
        Match FHIR identifiers against local patients.
        
        Args:
            fhir_identifiers: FHIR identifier data
            patient_query_set: Django queryset of Patient models
        
        Returns:
            PatientMatch or None if no match found
        """
        pass


class ExactIdentifierMatcher(MatchingAlgorithm):
    """
    Matches on exact identifier match (PhilHealth ID, National ID, etc.).
    
    Priority:
    1. PhilHealth ID
    2. National ID
    3. Internal patient ID
    
    Match quality: EXACT (1.0)
    """
    
    def match(self, fhir_identifiers: Dict[str, Any], patient_query_set) -> Optional[PatientMatch]:
        """
        Try to match on exact identifiers.
        
        Args:
            fhir_identifiers: Dict with identifier system → value mappings
            patient_query_set: Patients to search
        
        Returns:
            PatientMatch with quality EXACT if found, None otherwise
        """
        # TODO: Implement
        # 1. Extract identifiers from fhir_identifiers:
        #    - PhilHealth ID (system = "http://www.philhealth.gov.ph/...")
        #    - National ID (system = "http://www.philhealth.gov.ph/national-id")
        #    - Internal ID (system = "http://wah4h.local/...")
        # 2. Query patient by matching identifier:
        #    a. Try PhilHealth ID
        #    b. Try National ID  
        #    c. Try internal ID
        # 3. If match found:
        #    - Return PatientMatch(patient_id, EXACT, 1.0, "Exact identifier match", ...)
        # 4. If not found, return None
        pass


class DemographicMatcher(MatchingAlgorithm):
    """
    Matches on demographic information (name, birthdate, gender).
    
    Criteria:
    - Last name (exact)
    - First name (exact or fuzzy)
    - Birthdate (exact match required)
    - Gender (exact match required)
    
    Match quality: VERY_HIGH (0.95+) if all match
    """
    
    def __init__(self, fuzzy_threshold: float = 0.85):
        """
        Initialize demographic matcher.
        
        Args:
            fuzzy_threshold: Min score for fuzzy name matching (0.0-1.0)
        """
        self.fuzzy_threshold = fuzzy_threshold
    
    def match(self, fhir_identifiers: Dict[str, Any], patient_query_set) -> Optional[PatientMatch]:
        """
        Match on demographic information.
        
        Args:
            fhir_identifiers: Dict with demographics (first_name, last_name, birthdate, gender)
            patient_query_set: Patients to search
        
        Returns:
            PatientMatch or None
        """
        # TODO: Implement
        # 1. Extract demographics from fhir_identifiers:
        #    - first_name, last_name
        #    - birthdate (YYYY-MM-DD)
        #    - gender (male, female, other, unknown)
        # 2. Query patients matching:
        #    a. birthdate (exact)
        #    b. gender (exact)
        #    c. last_name (exact)
        # 3. For matching patients, check first_name:
        #    a. Exact match → score 0.95
        #    b. Fuzzy match (Levenshtein) → score based on distance
        #    c. Below threshold → skip patient
        # 4. Return best match or None
        pass


class FuzzyDemographicMatcher(MatchingAlgorithm):
    """
    Fuzzy matching on demographic information using Levenshtein distance.
    
    Uses:
    - Fuzzy name matching (account for typos, spelling variations)
    - Demographic soft rules (e.g., age range instead of exact birthdate)
    
    Match quality: HIGH (0.85-0.95) to MEDIUM (0.70-0.85)
    """
    
    def __init__(self, name_threshold: float = 0.80, age_tolerance_years: int = 1):
        """
        Initialize fuzzy matcher.
        
        Args:
            name_threshold: Min similarity score for name match
            age_tolerance_years: Allow age difference in years
        """
        self.name_threshold = name_threshold
        self.age_tolerance_years = age_tolerance_years
    
    def match(self, fhir_identifiers: Dict[str, Any], patient_query_set) -> Optional[PatientMatch]:
        """
        Fuzzy match on demographics.
        
        Args:
            fhir_identifiers: Demographic data
            patient_query_set: Patients to search
        
        Returns:
            PatientMatch or None
        """
        # TODO: Implement
        # 1. Extract demographics from fhir_identifiers
        # 2. Query all patients in patient_query_set
        # 3. For each patient, calculate similarity scores:
        #    a. Name similarity (Levenshtein distance for first_name + last_name)
        #    b. Birthdate similarity (within age_tolerance_years)
        #    c. Gender match (binary: exact or different)
        # 4. Combine scores to get overall match quality
        # 5. Filter by name_threshold
        # 6. Return best match or None
        pass


class ContactInfoMatcher(MatchingAlgorithm):
    """
    Matches on contact information (phone number, address).
    
    Used as fallback when demographics don't match.
    
    Match quality: MEDIUM (0.70-0.85)
    """
    
    def match(self, fhir_identifiers: Dict[str, Any], patient_query_set) -> Optional[PatientMatch]:
        """
        Match on contact information.
        
        Args:
            fhir_identifiers: Contact data (phone, address)
            patient_query_set: Patients to search
        
        Returns:
            PatientMatch or None
        """
        # TODO: Implement
        # 1. Extract contact info from fhir_identifiers:
        #    - phone_number (mobile_number)
        #    - address (address_line, address_city)
        # 2. Query patients by phone if available
        # 3. Query patients by address if available
        # 4. Combine results
        # 5. Return best match or None
        pass


class MatchingService:
    """
    High-level service coordinating patient matching.
    
    Matching priority chain:
    1. ExactIdentifierMatcher (PhilHealth ID, etc.)
    2. DemographicMatcher (name + birthdate + gender exact)
    3. FuzzyDemographicMatcher (fuzzy name + demographics)
    4. ContactInfoMatcher (phone, address)
    5. No match → flag for manual review or create new
    """
    
    def __init__(self, min_match_quality: MatchQuality = MatchQuality.MEDIUM):
        """
        Initialize matching service.
        
        Args:
            min_match_quality: Min acceptable match quality
            
        TODO: Import Patient model
        - from patients.models import Patient
        """
        self.min_match_quality = min_match_quality
        
        # Initialize matchers in priority order
        self.matchers = [
            ExactIdentifierMatcher(),
            DemographicMatcher(fuzzy_threshold=0.85),
            FuzzyDemographicMatcher(name_threshold=0.80, age_tolerance_years=1),
            ContactInfoMatcher(),
        ]
    
    def match_patient(
        self,
        fhir_identifiers: Dict[str, Any],
    ) -> Tuple[bool, Optional[PatientMatch], Optional[str]]:
        """
        Match incoming FHIR identifiers against local patients.
        
        Args:
            fhir_identifiers: Dict containing any combination of:
            {
                'identifiers': [  # FHIR identifier objects
                    {'system': '...', 'value': '...'},
                    ...
                ],
                'first_name': str,
                'last_name': str,
                'birthdate': 'YYYY-MM-DD',
                'gender': str,  # male, female, other, unknown
                'phone': str,
                'address_line': str,
                'address_city': str,
            }
        
        Returns:
            Tuple[
                success: bool,
                match: Optional[PatientMatch],
                error: Optional[str]
            ]
        
        Behavior:
        - Tries matching algorithms in priority order
        - Returns first match meeting min_match_quality threshold
        - Logs matching attempt to InteroperabilityLog
        - Returns None if no match found (not an error)
        """
        # TODO: Implement
        # 1. Validate fhir_identifiers input
        # 2. Fetch all patients (or filtered set if identifiers provided)
        # 3. Try each matcher in order:
        #    a. Call matcher.match(fhir_identifiers, patients_qs)
        #    b. If match found:
        #       - Check if match.score >= min_match_quality
        #       - If meets threshold, return match
        #       - Else, continue to next matcher
        # 4. If no matcher finds suitable match:
        #    - Log "patient_not_found" event
        #    - Return (True, None, None) (not an error)
        # 5. Log match result to InteroperabilityLog
        # 6. Return (True, match, None) or (False, None, error_msg)
        pass
    
    def find_duplicate_patients(
        self,
        patient_id: int,
        threshold: MatchQuality = MatchQuality.HIGH,
    ) -> Tuple[bool, Optional[List[Tuple[int, float]]], Optional[str]]:
        """
        Find potential duplicates for given patient.
        
        Used for deduplication.
        
        Args:
            patient_id: Patient to check
            threshold: Min match quality for duplicates
        
        Returns:
            Tuple[
                success: bool,
                duplicates: Optional[List[(patient_id, score)]],
                error: Optional[str]
            ]
        """
        # TODO: Implement
        # 1. Fetch patient by patient_id
        # 2. Compare against all other patients:
        #    a. DemographicMatcher (exact name + birthdate)
        #    b. FuzzyDemographicMatcher (fuzzy name + demographics)
        # 3. Filter by threshold
        # 4. Return sorted list of duplicates by score
        pass
    
    def merge_duplicate_patients(
        self,
        patient_id_primary: int,
        patient_id_secondary: int,
    ) -> Tuple[bool, Optional[str]]:
        """
        Merge secondary patient into primary patient.
        
        Args:
            patient_id_primary: Primary patient record to keep
            patient_id_secondary: Secondary patient record to merge
        
        Returns:
            Tuple[success: bool, error: Optional[str]]
        
        TODO: Implement:
        - Identify related records (encounters, conditions, etc.)
        - Update foreign keys to point to primary
        - Archive secondary patient
        - Log merge operation
        """
        # TODO: Implement
        # 1. Fetch both patient records
        # 2. Find all related records for secondary:
        #    - Conditions, allergies, immunizations, encounters, etc.
        # 3. Update foreign keys to primary patient
        # 4. Mark secondary as inactive/archived
        # 5. Create audit record of merge
        # 6. Log merge operation to InteroperabilityLog
        # 7. Return (True, None) or (False, error_msg)
        pass


class MatchingStatistics:
    """
    Collects and reports matching statistics.
    
    TODO: Query InteroperabilityLog to gather statistics
    """
    
    def get_matching_statistics(
        self,
        time_range_days: int = 30,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Get matching operation statistics.
        
        Args:
            time_range_days: Look back this many days
        
        Returns:
            Tuple[success: bool, stats: Optional[Dict], error: Optional[str]]
        
        Stats include:
        - total_matches: int
        - successful_matches: int (matched with quality >= MEDIUM)
        - failed_matches: int (no match found)
        - by_algorithm: {algo_name: count}
        - by_quality: {quality_level: count}
        - avg_match_score: float
        """
        # TODO: Implement
        # 1. Query InteroperabilityLog where event_type IN (PATIENT_MATCHED, PATIENT_NOT_FOUND)
        # 2. Filter by date range
        # 3. Calculate statistics
        # 4. Return (True, stats, None) or (False, None, error_msg)
        pass


def _levenshtein_distance(s1: str, s2: str) -> int:
    """
    Calculate Levenshtein distance between two strings.
    
    Args:
        s1: First string
        s2: Second string
    
    Returns:
        Edit distance (int)
    """
    # TODO: Implement or use python-Levenshtein library
    # For now, can use simple implementation or third-party library
    pass


def _similarity_score(s1: str, s2: str) -> float:
    """
    Calculate similarity score (0.0 - 1.0) between two strings.
    
    Args:
        s1: First string
        s2: Second string
    
    Returns:
        Similarity score (0.0 = different, 1.0 = identical)
    """
    # TODO: Implement using Levenshtein distance
    # score = 1 - (distance / max_length)
    pass
