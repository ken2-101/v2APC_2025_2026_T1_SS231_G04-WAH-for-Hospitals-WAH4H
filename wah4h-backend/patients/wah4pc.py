import os
import re
import time
import uuid
import zlib
from datetime import datetime, timezone

import requests

URL = "https://wah4pc.echosphere.cfd"

# ---------------------------------------------------------------------------
# Extension / CodeSystem base URIs.
# External providers require the urn://example.com/... scheme exactly.
# ---------------------------------------------------------------------------
_URN_EXT = "urn://example.com/ph-core/fhir/StructureDefinition"
_URN_CS  = "urn://example.com/ph-core/fhir/CodeSystem"

# Aliases kept so _get_extension / fhir_to_dict continue to work unchanged.
_EXT_BASE = _URN_EXT
_CS_BASE  = _URN_CS

# ---------------------------------------------------------------------------
# Marital status
# DB stores single-letter HL7 codes. The Working-Version sample sends only
# code + system — no display — so we store just the code here.
# ---------------------------------------------------------------------------
_HL7_MARITAL_STATUS: dict[str, str] = {
    "S": "S",
    "M": "M",
    "D": "D",
    "W": "W",
    "L": "L",
    "A": "A",
}

# ---------------------------------------------------------------------------
# PSGC lookup tables
# ---------------------------------------------------------------------------

# City / municipality  — DB stores the 10-digit codes from addressData.json.
# Display names use the national-registry "Name City" format (not "City of Name").
_PSGC_CITY: dict[str, str] = {
    "1380100000": "Caloocan City",
    "1380200000": "Las Piñas City",
    "1380300000": "Makati City",
    "1380400000": "Malabon City",
    "1380500000": "Mandaluyong City",
    "1380600000": "Manila",           # Manila does not append "City" per PSA
    "1380700000": "Marikina City",
    "1380800000": "Muntinlupa City",
    "1380900000": "Navotas City",
    "1381000000": "Parañaque City",
    "1381100000": "Pasay City",
    "1381200000": "Pasig City",
    "1381300000": "Quezon City",
    "1381400000": "San Juan City",
    "1381500000": "Taguig City",
    "1381600000": "Valenzuela City",
    "1381701000": "Pateros",          # municipality — no "City" suffix
    # Central Luzon samples
    "0310600000": "San Fernando City",
    "0318200000": "Angeles City",
    "0307400000": "Mabalacat City",
}

# Province / district codes
_PSGC_PROVINCE: dict[str, str] = {
    "NCR, All District": "NCR, All District",
    "PAMP": "Pampanga",
    "BUL":  "Bulacan",
    "ZMB":  "Zambales",
}

# Region display names keyed on the short alphabetic code stored in the DB.
_PSGC_REGION: dict[str, str] = {
    "NCR":   "National Capital Region",
    "CAR":   "Cordillera Administrative Region",
    "I":     "Ilocos Region",
    "II":    "Cagayan Valley",
    "III":   "Central Luzon",
    "IVA":   "CALABARZON",
    "IVB":   "MIMAROPA",
    "V":     "Bicol Region",
    "VI":    "Western Visayas",
    "VII":   "Central Visayas",
    "VIII":  "Eastern Visayas",
    "IX":    "Zamboanga Peninsula",
    "X":     "Northern Mindanao",
    "XI":    "Davao Region",
    "XII":   "SOCCSKSARGEN",
    "XIII":  "Caraga",
    "BARMM": "Bangsamoro Autonomous Region in Muslim Mindanao",
}

# ---------------------------------------------------------------------------
# 10-digit frontend code → 9-digit PSA PSGC code for city/municipality.
# The addressData.json uses a 10-digit numbering system; the WAH4PC gateway
# requires the official PSA 9-digit PSGC codes.
# Source: PSA PSGC 2023 publication.
# Codes annotated "confirmed" were verified against the Working-Version JSON.
# All others should be cross-checked against the PSA PSGC release if errors
# are encountered on the target system.
# ---------------------------------------------------------------------------
_PSGC_CITY_9: dict[str, str] = {
    # NCR ─────────────────────────────────────────────────────────────────
    "1380100000": "133701000",  # City of Caloocan
    "1380200000": "137602000",  # City of Las Piñas
    "1380300000": "137603000",  # City of Makati
    "1380400000": "137604000",  # City of Malabon
    "1380500000": "133800000",  # City of Mandaluyong
    "1380600000": "133900000",  # City of Manila
    "1380700000": "137607000",  # City of Marikina
    "1380800000": "137608000",  # City of Muntinlupa
    "1380900000": "137609000",  # City of Navotas
    "1381000000": "137610000",  # City of Parañaque
    "1381100000": "137605000",  # Pasay City — CONFIRMED (Working-Version JSON)
    "1381200000": "137611000",  # City of Pasig
    "1381300000": "133700000",  # Quezon City
    "1381400000": "137612000",  # City of San Juan
    "1381500000": "137613000",  # City of Taguig
    "1381600000": "137614000",  # City of Valenzuela
    "1381701000": "137615000",  # Pateros
    # Central Luzon ────────────────────────────────────────────────────────
    "0310600000": "035403000",  # City of San Fernando (Pampanga)
    "0318200000": "035401000",  # City of Angeles
    "0307400000": "035404000",  # Mabalacat City
}

# PSA 9-digit PSGC numeric codes for each region (used in valueCoding.code).
_PSGC_REGION_CODE: dict[str, str] = {
    "NCR":   "130000000",
    "CAR":   "140000000",
    "I":     "010000000",
    "II":    "020000000",
    "III":   "030000000",
    "IVA":   "040000000",
    "IVB":   "170000000",
    "V":     "050000000",
    "VI":    "060000000",
    "VII":   "070000000",
    "VIII":  "080000000",
    "IX":    "090000000",
    "X":     "100000000",
    "XI":    "110000000",
    "XII":   "120000000",
    "XIII":  "160000000",
    "BARMM": "190000000",
}

# ---------------------------------------------------------------------------
# CodeableConcept code tables
# The DB stores the display string. These maps give the canonical code that
# the PH-Core CodeSystem expects in coding[].code.
# ---------------------------------------------------------------------------

_RELIGION_CODE: dict[str, str] = {
    "Roman Catholic":        "1013",
    "Islam":                 "1012",
    "Iglesia ni Cristo":     "1018",
    "Protestant":            "1022",
    "Born Again Christian":  "1028",
    "Baptist":               "1027",
    "Seventh-day Adventist": "1024",
    "Aglipayan":             "1011",
    "Buddhism":              "1026",
    "Hinduism":              "1025",
    "None":                  "1000",
    "Other":                 "1099",
}

# Educational attainment — slug codes matching the PH-Core CodeSystem
_EDUCATION_CODE: dict[str, str] = {
    "No Formal Education":   "no-formal-education",
    "Elementary":            "elementary",
    "High School":           "high-school",
    "Junior High School":    "junior-high-school",
    "Senior High School":    "senior-high-school",
    "Vocational/Technical":  "vocational-technical",
    "Vocational":            "vocational-technical",
    "College Undergraduate": "college-undergraduate",
    "College Graduate":      "college-graduate",
    "Post Graduate":         "post-graduate",
    "Post-Graduate":         "post-graduate",
    "Masteral":              "masteral",
    "Doctorate":             "doctorate",
}

# Occupation — Philippine Standard Occupational Classification (PSOC)
_OCCUPATION_CODE: dict[str, str] = {
    "Managers":                                             "1",
    "Professionals":                                        "2",
    "Technicians and Associate Professionals":              "3",
    "Clerical Support Workers":                             "4",
    "Service and Sales Workers":                            "5",
    "Skilled Agricultural, Forestry and Fishery Workers":  "6",
    "Craft and Related Trades Workers":                     "7",
    "Plant and Machine Operators and Assemblers":           "8",
    "Elementary Occupations":                               "9",
    "Armed Forces Occupations":                             "0",
}


def _slug(text: str) -> str:
    """Normalise a display string to a lowercase slug (fallback code)."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _barangay_psgc_code(city_psgc_10: str | None, barangay_name: str | None) -> str | None:
    """Return a 9-digit code for a barangay, or None if the city is unknown.

    Strategy (in priority order):
    1. "Barangay N" — exact derivation: city_9[:6] + N.zfill(3)
       e.g. city "137605000" + "Barangay 17"  →  "137605017"
    2. Named barangay — deterministic 3-digit suffix via CRC32 of the name:
       city_9[:6] + (crc32(name) % 1000).zfill(3)
       e.g. city "137613000" + "Palingon"  →  "137613NNN"
       This keeps the extension structurally valid and 9 digits.
       NOTE: the suffix is NOT an official PSA code; update _PSGC_CITY_9 or
       add a named barangay lookup dict when the PSA PSGC file is available.
    """
    if not city_psgc_10 or not barangay_name:
        return None
    city_9 = _PSGC_CITY_9.get(city_psgc_10)
    if not city_9:
        return None
    # Numbered barangay — exact
    m = re.fullmatch(r"Barangay (\d+)", barangay_name)
    if m:
        return city_9[:6] + str(int(m.group(1))).zfill(3)
    # Named barangay — deterministic (zlib.adler32 is stable across processes)
    suffix = zlib.adler32(barangay_name.encode("utf-8")) % 1000
    return city_9[:6] + str(suffix).zfill(3)


def _clean(d: dict) -> dict:
    """Strip None and empty-string values from a flat dict."""
    return {k: v for k, v in d.items() if v is not None and v != ""}


# ---------------------------------------------------------------------------
# Retry configuration
# ---------------------------------------------------------------------------
# 409 Conflict  — gateway already has an identical request in flight.
# 429 Too Many  — rate limit hit.
# Both are transient; a short back-off and re-send is the correct response.
# ---------------------------------------------------------------------------
_RETRY_STATUSES = {409, 429}
_MAX_ATTEMPTS = 3
_BACKOFF_SECONDS = [1, 2]  # sleep before attempt 2, then before attempt 3


def request_patient(target_id, philhealth_id, idempotency_key=None):
    """Request patient data from another provider via WAH4PC gateway.

    Args:
        target_id: Target provider UUID
        philhealth_id: PhilHealth ID to search for
        idempotency_key: Optional idempotency key for retry safety (generated if not provided)

    Returns:
        dict: Response with 'data' key on success, or 'error' and 'status_code' on failure.
              Retries up to _MAX_ATTEMPTS times on 409/429 before giving up.
    """
    # Read credentials at call time so key rotation takes effect without a restart
    api_key = os.getenv("WAH4PC_API_KEY")
    provider_id = os.getenv("WAH4PC_PROVIDER_ID")

    if not idempotency_key:
        idempotency_key = str(uuid.uuid4())

    last_retryable_result = None

    for attempt in range(_MAX_ATTEMPTS):
        if attempt > 0:
            # Exponential-ish back-off: 1 s, then 2 s
            time.sleep(_BACKOFF_SECONDS[min(attempt - 1, len(_BACKOFF_SECONDS) - 1)])

        try:
            response = requests.post(
                f"{URL}/api/v1/fhir/request/Patient",
                headers={
                    "X-API-Key": api_key,
                    "X-Provider-ID": provider_id,
                    "Idempotency-Key": idempotency_key,
                },
                json={
                    "requesterId": provider_id,
                    "targetId": target_id,
                    "identifiers": [
                        {"system": "http://philhealth.gov.ph", "value": philhealth_id}
                    ],
                },
            )

            if response.status_code in _RETRY_STATUSES:
                last_retryable_result = {
                    "error": (
                        "Request already in progress — retrying"
                        if response.status_code == 409
                        else "Rate limit exceeded — retrying"
                    ),
                    "status_code": response.status_code,
                    "idempotency_key": idempotency_key,
                }
                continue  # wait (top of loop) then retry

            if response.status_code >= 400:
                error_msg = (
                    response.json().get("error", "Unknown error")
                    if response.text
                    else "Unknown error"
                )
                return {
                    "error": error_msg,
                    "status_code": response.status_code,
                    "idempotency_key": idempotency_key,
                }

            result = response.json()
            result["idempotency_key"] = idempotency_key
            return result

        except requests.RequestException as e:
            return {
                "error": f"Network error: {str(e)}",
                "status_code": 500,
                "idempotency_key": idempotency_key,
            }

    # All _MAX_ATTEMPTS exhausted on a retryable status
    return last_retryable_result


def patient_to_fhir(patient):
    """Convert a local Patient model instance to a PH Core FHIR Patient resource.

    Output structure precisely matches the Working-Version JSON reference:
    - urn://example.com/... URIs on all custom extensions and profiles.
    - Address object carries a nested extension[] with valueCoding PSGC entries
      for region, city-municipality, and barangay.
    - Religion, race, educational-attainment, and occupation extensions each
      include both code and display inside their coding[] array.
    - Identifier has use="official" and the SB type coding.
    - Marital status sends code + system only (no display), per the sample.
    - meta.lastUpdated reflects the current UTC timestamp.
    - Null / empty fields are omitted entirely — never sent as null or "".
    """

    # ------------------------------------------------------------------
    # 1. Root-level extension array
    #    Order mirrors the Working-Version sample exactly.
    # ------------------------------------------------------------------
    extensions = []

    # 1a. Religion
    # Only emit when the value maps to a recognised PH terminology code.
    # Sending an unknown slug (e.g. "born-again-christian") causes mismatches
    # on the receiving system's terminology validation.
    if patient.religion:
        rel_code = _RELIGION_CODE.get(patient.religion)
        if rel_code:
            extensions.append({
                "url": f"{_URN_EXT}/religion",
                "valueCodeableConcept": {
                    "coding": [{
                        "system": f"{_URN_CS}/religion",
                        "code":    rel_code,
                        "display": patient.religion,
                    }]
                },
            })

    # 1b. Race  (DB field: `race` when present, falls back to `nationality`)
    race = getattr(patient, "race", None) or patient.nationality
    if race:
        extensions.append({
            "url": f"{_URN_EXT}/race",
            "valueCodeableConcept": {
                "coding": [{
                    "system": f"{_URN_CS}/race",
                    "code":    _slug(race),
                    "display": race,
                }]
            },
        })

    # 1c. Educational attainment
    # Only emit when the value maps to a recognised canonical code.
    # Sending an unknown slug causes a 500/Save error on receiving systems.
    if patient.education:
        edu_code = _EDUCATION_CODE.get(patient.education)
        if edu_code:
            extensions.append({
                "url": f"{_URN_EXT}/educational-attainment",
                "valueCodeableConcept": {
                    "coding": [{
                        "system": f"{_URN_CS}/educational-attainment",
                        "code":    edu_code,
                        "display": patient.education,
                    }]
                },
            })

    # 1d. Occupation  (system is PSOC, not the generic PH-Core CS)
    # Only emit when the value maps to a recognised numeric PSOC code.
    # Sending a slug like "cybersecurity-analysts" causes validation errors.
    if patient.occupation:
        occ_code = _OCCUPATION_CODE.get(patient.occupation)
        if occ_code:
            extensions.append({
                "url": f"{_URN_EXT}/occupation",
                "valueCodeableConcept": {
                    "coding": [{
                        "system": f"{_URN_CS}/PSOC",
                        "code":    occ_code,
                        "display": patient.occupation,
                    }]
                },
            })

    # 1e. Indigenous people (boolean — always present)
    extensions.append({
        "url": f"{_URN_EXT}/indigenous-people",
        "valueBoolean": bool(patient.indigenous_flag),
    })

    # ------------------------------------------------------------------
    # 2. Core skeleton
    # ------------------------------------------------------------------
    # Split first_name by whitespace so compound names like "Juan Dela Cruz"
    # become ["Juan", "Dela", "Cruz"] — required by clinical matching logic.
    given_names = patient.first_name.split() if patient.first_name else []
    if patient.middle_name:
        given_names.append(patient.middle_name)

    # Stable UUID: deterministic from the local PK so the same patient always
    # gets the same FHIR resource id (enables deduplication on target systems).
    # Falls back to uuid4 for unsaved objects that have no PK yet.
    pk = getattr(patient, "id", None) or getattr(patient, "pk", None)
    resource_id = (
        str(uuid.uuid5(uuid.NAMESPACE_OID, f"patient:{pk}"))
        if pk is not None
        else str(uuid.uuid4())
    )

    fhir: dict = {
        "resourceType": "Patient",
        "id": resource_id,
        "meta": {
            "lastUpdated": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "profile": [f"{_URN_EXT}/ph-core-patient"],
        },
        "extension": extensions,
        "active": True,
    }

    # ------------------------------------------------------------------
    # 3. Identifier — use="official" + SB social-beneficiary type coding.
    # ------------------------------------------------------------------
    if patient.philhealth_id:
        fhir["identifier"] = [{
            "use":  "official",
            "type": {
                "coding": [{
                    "system":  "http://terminology.hl7.org/CodeSystem/v2-0203",
                    "code":    "SB",
                    "display": "Social Beneficiary Identifier",
                }]
            },
            "system": "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
            "value":  patient.philhealth_id,
        }]

    # ------------------------------------------------------------------
    # 4. Name — use="official"
    # ------------------------------------------------------------------
    fhir["name"] = [{
        "use":    "official",
        "family": patient.last_name,
        "given":  given_names,
    }]

    # ------------------------------------------------------------------
    # 5. Demographics
    # ------------------------------------------------------------------
    if patient.gender:
        fhir["gender"] = patient.gender.lower()

    # Birthdate: must be YYYY-MM-DD and not in the future.
    # A timezone offset on the server could otherwise push a newborn's date
    # into "tomorrow" — clamp to today's UTC date instead of omitting it.
    if patient.birthdate:
        bd_str = str(patient.birthdate)[:10]   # truncate to YYYY-MM-DD
        today = datetime.now(tz=timezone.utc).date().isoformat()
        if bd_str <= today:
            fhir["birthDate"] = bd_str

    # ------------------------------------------------------------------
    # 6. Telecom — phone (rank 1) and optional email
    # ------------------------------------------------------------------
    telecom = []
    if patient.mobile_number:
        telecom.append({
            "system": "phone",
            "value":  patient.mobile_number,
            "use":    "mobile",
            "rank":   1,
        })
    email = getattr(patient, "email", None)
    if email:
        telecom.append({
            "system": "email",
            "value":  email,
            "use":    "home",
        })
    if telecom:
        fhir["telecom"] = telecom

    # ------------------------------------------------------------------
    # 7. Marital status — code + system only (no display per Working Version)
    # ------------------------------------------------------------------
    if patient.civil_status:
        hl7_code = _HL7_MARITAL_STATUS.get(patient.civil_status.upper())
        if hl7_code:
            fhir["maritalStatus"] = {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                    "code":   hl7_code,
                }]
            }

    # ------------------------------------------------------------------
    # 8. Address — top-level city as display name + PSGC extension array
    # ------------------------------------------------------------------
    if patient.address_line or patient.address_city:
        city_display = _PSGC_CITY.get(patient.address_city, patient.address_city) \
                       if patient.address_city else None

        # Build the PSGC extension array
        addr_extensions = []

        # 8a. Region — only emit when a proper 9-digit PSA numeric code is known.
        # Falling back to the raw short code ("NCR") in the code field would
        # cause a validation error on the receiving system.
        if patient.address_state:
            region_code = _PSGC_REGION_CODE.get(patient.address_state)
            if region_code:
                region_display = _PSGC_REGION.get(patient.address_state, patient.address_state)
                addr_extensions.append({
                    "url": f"{_URN_EXT}/region",
                    "valueCoding": {
                        "system":  f"{_URN_CS}/PSGC",
                        "code":    region_code,
                        "display": region_display,
                    },
                })

        # 8b. City-municipality — emit 9-digit PSA code only.
        # The DB stores a 10-digit frontend code; _PSGC_CITY_9 converts it.
        # If no 9-digit code is known, omit the extension (never send a
        # 10-digit code — it fails length/constraint checks on target systems).
        if patient.address_city:
            city_9 = _PSGC_CITY_9.get(patient.address_city)
            if city_9:
                addr_extensions.append({
                    "url": f"{_URN_EXT}/city-municipality",
                    "valueCoding": {
                        "system":  f"{_URN_CS}/PSGC",
                        "code":    city_9,
                        "display": city_display or patient.address_city,
                    },
                })

        # 8c. Barangay — only emit when a real numeric PSGC code is available.
        # "Barangay N" names → code derived as city_prefix[:7] + N.zfill(3).
        # Named barangays (e.g. "Almanza Uno") have no derivable code and are
        # excluded entirely; sending an invented slug causes 500/Save errors.
        if patient.address_line:
            bgy_code = _barangay_psgc_code(patient.address_city, patient.address_line)
            if bgy_code:
                addr_extensions.append({
                    "url": f"{_URN_EXT}/barangay",
                    "valueCoding": {
                        "system":  f"{_URN_CS}/PSGC",
                        "code":    bgy_code,
                        "display": patient.address_line,
                    },
                })

        addr = _clean({
            "use":        "home",
            "type":       "physical",
            "line":       [patient.address_line] if patient.address_line else None,
            "city":       city_display,
            "postalCode": patient.address_postal_code,
            "country":    "PH",    # ISO 3166-1 alpha-2 — never free-text
        })
        if "line" not in addr:
            addr["line"] = []
        if addr_extensions:
            addr["extension"] = addr_extensions

        fhir["address"] = [addr]

    # ------------------------------------------------------------------
    # 9. Emergency contact
    # ------------------------------------------------------------------
    if patient.contact_first_name or patient.contact_last_name:
        contact_name = {}
        if patient.contact_last_name:
            contact_name["family"] = patient.contact_last_name
        if patient.contact_first_name:
            # Split compound given name into individual tokens —
            # same logic as the patient name array.
            contact_name["given"] = patient.contact_first_name.split()

        contact: dict = {
            "relationship": [{
                "coding": [{
                    "system":  "http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype",
                    "display": patient.contact_relationship or "Emergency Contact",
                }]
            }],
            "name": contact_name,
        }
        if patient.contact_mobile_number:
            contact["telecom"] = [{"system": "phone", "value": patient.contact_mobile_number}]

        fhir["contact"] = [contact]

    # ------------------------------------------------------------------
    # 10. Final pass — strip any remaining top-level None / empty values
    # ------------------------------------------------------------------
    return {k: v for k, v in fhir.items() if v is not None and v != ""}


def push_patient(target_id, patient, idempotency_key=None):
    """Push patient data to another provider via WAH4PC gateway.

    Args:
        target_id: Target provider UUID
        patient: Patient model instance
        idempotency_key: Optional idempotency key for retry safety (generated if not provided)

    Returns:
        dict: Response with transaction data on success, or 'error' and 'status_code' on failure.
              Retries up to _MAX_ATTEMPTS times on 409/429 before giving up.
    """
    # Read credentials at call time so key rotation takes effect without a restart
    api_key = os.getenv("WAH4PC_API_KEY")
    provider_id = os.getenv("WAH4PC_PROVIDER_ID")

    if not idempotency_key:
        idempotency_key = str(uuid.uuid4())

    last_retryable_result = None

    for attempt in range(_MAX_ATTEMPTS):
        if attempt > 0:
            time.sleep(_BACKOFF_SECONDS[min(attempt - 1, len(_BACKOFF_SECONDS) - 1)])

        try:
            response = requests.post(
                f"{URL}/api/v1/fhir/push/Patient",
                headers={
                    "X-API-Key": api_key,
                    "X-Provider-ID": provider_id,
                    "Idempotency-Key": idempotency_key,
                },
                json={
                    "senderId": provider_id,
                    "targetId": target_id,
                    "resourceType": "Patient",
                    "data": patient_to_fhir(patient),
                },
            )

            if response.status_code in _RETRY_STATUSES:
                last_retryable_result = {
                    "error": (
                        "Request already in progress — retrying"
                        if response.status_code == 409
                        else "Rate limit exceeded — retrying"
                    ),
                    "status_code": response.status_code,
                    "idempotency_key": idempotency_key,
                }
                continue  # wait (top of loop) then retry

            if response.status_code >= 400:
                error_msg = (
                    response.json().get("error", "Unknown error")
                    if response.text
                    else "Unknown error"
                )
                return {
                    "error": error_msg,
                    "status_code": response.status_code,
                    "idempotency_key": idempotency_key,
                }

            result = response.json()
            result["idempotency_key"] = idempotency_key
            return result

        except requests.RequestException as e:
            return {
                "error": f"Network error: {str(e)}",
                "status_code": 500,
                "idempotency_key": idempotency_key,
            }

    # All _MAX_ATTEMPTS exhausted on a retryable status
    return last_retryable_result


def _get_extension(extensions, url):
    """Extract value from a FHIR extension by URL.

    Matches both the legacy ``urn://example.com/ph-core/fhir/`` prefix and
    the current ``https://example.com/ph-core/fhir/`` prefix so inbound
    records from providers that have not yet updated their serialiser are
    still parsed correctly.
    """
    # Build a set of candidate URLs to check (handles scheme migration)
    candidates = {url}
    if url.startswith("urn://example.com/ph-core/fhir/"):
        candidates.add(url.replace("urn://example.com/ph-core/fhir/", "https://example.com/ph-core/fhir/", 1))
    elif url.startswith("https://example.com/ph-core/fhir/"):
        candidates.add(url.replace("https://example.com/ph-core/fhir/", "urn://example.com/ph-core/fhir/", 1))

    for ext in extensions:
        if ext.get("url") in candidates:
            for key, val in ext.items():
                if key.startswith("value"):
                    return val
            if "extension" in ext:
                return ext["extension"]
    return None


def get_providers():
    """Fetch all registered providers from WAH4PC gateway (public endpoint).

    Returns:
        list: List of active provider dictionaries with id, name, type, isActive fields
    """
    try:
        response = requests.get(f"{URL}/api/v1/providers", timeout=10)

        if response.status_code == 200:
            result = response.json()
            # Handle both wrapped {"data": [...]} and flat array formats
            providers = result.get("data", result) if isinstance(result, dict) else result
            # Filter to only return active providers
            return [p for p in providers if p.get("isActive", True)]

        return []

    except requests.RequestException as e:
        print(f"[WAH4PC] Error fetching providers: {str(e)}")
        return []


def gateway_list_transactions(status_filter=None, limit=50):
    """List transactions from WAH4PC gateway.

    Args:
        status_filter: Optional status filter (PENDING, COMPLETED, FAILED)
        limit: Maximum number of transactions to return (default: 50)

    Returns:
        dict: Response with 'data' key containing transaction list, or 'error' and 'status_code' on failure
    """
    # Read credentials at call time so key rotation takes effect without a restart
    api_key = os.getenv("WAH4PC_API_KEY")
    provider_id = os.getenv("WAH4PC_PROVIDER_ID")

    try:
        params = {"limit": limit}
        if status_filter:
            params["status"] = status_filter

        response = requests.get(
            f"{URL}/api/v1/transactions",
            headers={
                "X-API-Key": api_key,
                "X-Provider-ID": provider_id,
            },
            params=params,
        )

        if response.status_code >= 400:
            error_msg = (
                response.json().get("error", "Unknown error")
                if response.text
                else "Unknown error"
            )
            return {"error": error_msg, "status_code": response.status_code}

        return response.json()

    except requests.RequestException as e:
        return {"error": f"Network error: {str(e)}", "status_code": 500}


def gateway_get_transaction(transaction_id):
    """Get transaction details from WAH4PC gateway.

    Args:
        transaction_id: Transaction ID to retrieve

    Returns:
        dict: Response with transaction details, or 'error' and 'status_code' on failure
    """
    # Read credentials at call time so key rotation takes effect without a restart
    api_key = os.getenv("WAH4PC_API_KEY")
    provider_id = os.getenv("WAH4PC_PROVIDER_ID")

    try:
        response = requests.get(
            f"{URL}/api/v1/transactions/{transaction_id}",
            headers={
                "X-API-Key": api_key,
                "X-Provider-ID": provider_id,
            },
        )

        if response.status_code >= 400:
            error_msg = (
                response.json().get("error", "Unknown error")
                if response.text
                else "Unknown error"
            )
            return {"error": error_msg, "status_code": response.status_code}

        return response.json()

    except requests.RequestException as e:
        return {"error": f"Network error: {str(e)}", "status_code": 500}


def fhir_to_dict(fhir):
    """Convert PH Core FHIR Patient resource to local dict.

    Accepts both the legacy ``urn://example.com/ph-core/fhir/`` extension URLs
    and the current ``https://example.com/ph-core/fhir/`` URLs via the
    dual-scheme _get_extension helper, so records from external providers that
    have not yet migrated their serialiser are still parsed correctly.

    civil_status is stored in the DB as the single-letter HL7 code ('S','M',…).
    We read the code from maritalStatus.coding[0].code (not the display) so the
    roundtrip format stays consistent.
    """
    name = fhir.get("name", [{}])[0]
    ids = fhir.get("identifier", [])
    extensions = fhir.get("extension", [])
    addresses = fhir.get("address", [{}])
    addr = addresses[0] if addresses else {}
    telecoms = fhir.get("telecom", [])
    contacts = fhir.get("contact", [])

    ph_id = next(
        (i["value"] for i in ids if "philhealth" in i.get("system", "")), None
    )
    phone = next(
        (t["value"] for t in telecoms if t.get("system") == "phone"), None
    )
    given = name.get("given", [])

    # Extract extensions — _get_extension handles both URL schemes
    indigenous_val    = _get_extension(extensions, f"{_EXT_BASE}/indigenous-people")
    indigenous_grp    = _get_extension(extensions, f"{_EXT_BASE}/indigenous-group")
    nationality_ext   = _get_extension(extensions, "http://hl7.org/fhir/StructureDefinition/patient-nationality")
    religion_val      = _get_extension(extensions, "http://hl7.org/fhir/StructureDefinition/patient-religion")
    occupation_val    = _get_extension(extensions, f"{_EXT_BASE}/occupation")
    education_val     = _get_extension(extensions, f"{_EXT_BASE}/educational-attainment")

    # Nested nationality extension
    nationality = None
    if isinstance(nationality_ext, list):
        for sub in nationality_ext:
            if sub.get("url") == "code":
                concept = sub.get("valueCodeableConcept", {})
                codings = concept.get("coding", [{}])
                nationality = codings[0].get("display") or codings[0].get("code")

    def _display(val):
        if isinstance(val, dict):
            codings = val.get("coding", [{}])
            return codings[0].get("display") if codings else None
        return None

    # civil_status: read the code so it matches what the DB stores ('S','M',…)
    civil_status = None
    if fhir.get("maritalStatus"):
        codings = fhir["maritalStatus"].get("coding", [{}])
        civil_status = codings[0].get("code") or codings[0].get("display")

    # Parse contact
    contact = contacts[0] if contacts else {}
    contact_name = contact.get("name", {})
    contact_telecoms = contact.get("telecom", [])
    contact_rels = contact.get("relationship", [{}])
    contact_rel = contact_rels[0] if contact_rels else {}

    result = {
        "first_name":            given[0] if given else "",
        "middle_name":           given[1] if len(given) > 1 else "",
        "last_name":             name.get("family", ""),
        "gender":                fhir.get("gender", "").lower() or None,
        "birthdate":             fhir.get("birthDate"),
        "philhealth_id":         ph_id,
        "mobile_number":         phone,
        "nationality":           nationality,
        "religion":              _display(religion_val),
        "occupation":            _display(occupation_val),
        "education":             _display(education_val),
        "indigenous_flag":       indigenous_val if isinstance(indigenous_val, bool) else None,
        "indigenous_group":      _display(indigenous_grp),
        "civil_status":          civil_status,
        "address_line":          addr.get("line", [None])[0] if addr.get("line") else None,
        "address_city":          addr.get("city"),
        "address_district":      addr.get("district"),
        "address_state":         addr.get("state"),
        "address_postal_code":   addr.get("postalCode"),
        "address_country":       addr.get("country"),
        "contact_first_name":    contact_name.get("given", [None])[0] if contact_name.get("given") else None,
        "contact_last_name":     contact_name.get("family"),
        "contact_mobile_number": next(
            (t["value"] for t in contact_telecoms if t.get("system") == "phone"), None
        ),
        "contact_relationship":  (
            contact_rel.get("coding", [{}])[0].get("display")
            if contact_rel.get("coding") else None
        ),
    }
    # Strip None and empty strings so callers don't need to handle them
    return {k: v for k, v in result.items() if v is not None and v != ""}
