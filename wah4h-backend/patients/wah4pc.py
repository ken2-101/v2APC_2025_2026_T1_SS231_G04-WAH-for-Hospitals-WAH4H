import requests
import os
import uuid

URL = "https://wah4pc.echosphere.cfd"
API_KEY = os.getenv("WAH4PC_API_KEY")
PROVIDER_ID = os.getenv("WAH4PC_PROVIDER_ID")


def request_patient(target_id, philhealth_id, idempotency_key=None):
    """Request patient data from another provider via WAH4PC gateway.

    Args:
        target_id: Target provider UUID
        philhealth_id: PhilHealth ID to search for
        idempotency_key: Optional idempotency key for retry safety (generated if not provided)

    Returns:
        dict: Response with 'data' key on success, or 'error' and 'status_code' on failure
    """
    if not idempotency_key:
        idempotency_key = str(uuid.uuid4())

    try:
        response = requests.post(
            f"{URL}/api/v1/fhir/request/Patient",
            headers={
                "X-API-Key": API_KEY,
                "X-Provider-ID": PROVIDER_ID,
                "Idempotency-Key": idempotency_key,
            },
            json={
                "requesterId": PROVIDER_ID,
                "targetId": target_id,
                "identifiers": [
                    {"system": "http://philhealth.gov.ph", "value": philhealth_id}
                ],
            },
        )

        # Handle specific error codes
        if response.status_code == 409:
            return {
                'error': 'Request in progress, retry later',
                'status_code': 409,
                'idempotency_key': idempotency_key
            }

        if response.status_code == 429:
            return {
                'error': 'Rate limit exceeded or duplicate request',
                'status_code': 429,
                'idempotency_key': idempotency_key
            }

        if response.status_code >= 400:
            error_msg = response.json().get('error', 'Unknown error') if response.text else 'Unknown error'
            return {
                'error': error_msg,
                'status_code': response.status_code,
                'idempotency_key': idempotency_key
            }

        result = response.json()
        result['idempotency_key'] = idempotency_key
        return result

    except requests.RequestException as e:
        return {
            'error': f'Network error: {str(e)}',
            'status_code': 500,
            'idempotency_key': idempotency_key
        }


def patient_to_fhir(patient):
    """Convert local Patient model to PH Core FHIR Patient resource."""
    extensions = [
        {
            "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
            "valueBoolean": patient.indigenous_flag or False,
        }
    ]

    if patient.nationality:
        extensions.append({
            "url": "http://hl7.org/fhir/StructureDefinition/patient-nationality",
            "extension": [{
                "url": "code",
                "valueCodeableConcept": {
                    "coding": [{"system": "urn:iso:std:iso:3166", "code": "PH", "display": patient.nationality}]
                },
            }],
        })

    if patient.religion:
        extensions.append({
            "url": "http://hl7.org/fhir/StructureDefinition/patient-religion",
            "valueCodeableConcept": {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ReligiousAffiliation",
                    "display": patient.religion,
                }]
            },
        })

    if patient.indigenous_flag and patient.indigenous_group:
        extensions.append({
            "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group",
            "valueCodeableConcept": {
                "coding": [{
                    "system": "urn://example.com/ph-core/fhir/CodeSystem/indigenous-groups",
                    "display": patient.indigenous_group,
                }]
            },
        })

    if patient.occupation:
        extensions.append({
            "url": "urn://example.com/ph-core/fhir/StructureDefinition/occupation",
            "valueCodeableConcept": {
                "coding": [{
                    "system": "urn://example.com/ph-core/fhir/ValueSet/occupational-classifications",
                    "display": patient.occupation,
                }]
            },
        })

    if patient.education:
        extensions.append({
            "url": "urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment",
            "valueCodeableConcept": {
                "coding": [{
                    "system": "urn://example.com/ph-core/fhir/ValueSet/educational-attainments",
                    "display": patient.education,
                }]
            },
        })

    fhir = {
        "resourceType": "Patient",
        "meta": {
            "profile": ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"]
        },
        "extension": extensions,
        "identifier": (
            [{"system": "http://philhealth.gov.ph/fhir/Identifier/philhealth-id", "value": patient.philhealth_id}]
            if patient.philhealth_id else []
        ),
        "name": [{
            "family": patient.last_name,
            "given": [n for n in [patient.first_name, patient.middle_name] if n],
        }],
        "gender": patient.gender.lower() if patient.gender else None,
        "birthDate": str(patient.birthdate) if patient.birthdate else None,
        "active": True,
    }

    if patient.mobile_number:
        fhir["telecom"] = [{"system": "phone", "value": patient.mobile_number, "use": "mobile"}]

    if patient.civil_status:
        status_map = {
            "single": "S", "married": "M", "widowed": "W", "divorced": "D",
            "separated": "L", "annulled": "A",
        }
        code = status_map.get(patient.civil_status.lower(), "UNK")
        fhir["maritalStatus"] = {
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                "code": code,
                "display": patient.civil_status,
            }]
        }

    if patient.address_line or patient.address_city:
        fhir["address"] = [{
            "line": [patient.address_line] if patient.address_line else [],
            "city": patient.address_city,
            "district": patient.address_district,
            "state": patient.address_state,
            "postalCode": patient.address_postal_code,
            "country": patient.address_country or "PH",
        }]

    if patient.contact_first_name or patient.contact_last_name:
        fhir["contact"] = [{
            "relationship": [{
                "coding": [{
                    "system": "http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype",
                    "display": patient.contact_relationship or "Emergency Contact",
                }]
            }],
            "name": {
                "family": patient.contact_last_name,
                "given": [patient.contact_first_name] if patient.contact_first_name else [],
            },
            "telecom": (
                [{"system": "phone", "value": patient.contact_mobile_number}]
                if patient.contact_mobile_number else []
            ),
        }]

    return {k: v for k, v in fhir.items() if v is not None}


def push_patient(target_id, patient, idempotency_key=None):
    """Push patient data to another provider via WAH4PC gateway.

    Args:
        target_id: Target provider UUID
        patient: Patient model instance
        idempotency_key: Optional idempotency key for retry safety (generated if not provided)

    Returns:
        dict: Response with transaction data on success, or 'error' and 'status_code' on failure
    """
    if not idempotency_key:
        idempotency_key = str(uuid.uuid4())

    try:
        response = requests.post(
            f"{URL}/api/v1/fhir/push/Patient",
            headers={
                "X-API-Key": API_KEY,
                "X-Provider-ID": PROVIDER_ID,
                "Idempotency-Key": idempotency_key,
            },
            json={
                "senderId": PROVIDER_ID,
                "targetId": target_id,
                "resourceType": "Patient",
                "data": patient_to_fhir(patient),
            },
        )

        # Handle specific error codes
        if response.status_code == 409:
            return {
                'error': 'Request in progress, retry later',
                'status_code': 409,
                'idempotency_key': idempotency_key
            }

        if response.status_code == 429:
            return {
                'error': 'Rate limit exceeded or duplicate request',
                'status_code': 429,
                'idempotency_key': idempotency_key
            }

        if response.status_code >= 400:
            error_msg = response.json().get('error', 'Unknown error') if response.text else 'Unknown error'
            return {
                'error': error_msg,
                'status_code': response.status_code,
                'idempotency_key': idempotency_key
            }

        result = response.json()
        result['idempotency_key'] = idempotency_key
        return result

    except requests.RequestException as e:
        return {
            'error': f'Network error: {str(e)}',
            'status_code': 500,
            'idempotency_key': idempotency_key
        }


def _get_extension(extensions, url):
    """Extract value from a FHIR extension by URL."""
    for ext in extensions:
        if ext.get("url") == url:
            for key, val in ext.items():
                if key.startswith("value"):
                    return val
            if "extension" in ext:
                return ext["extension"]
    return None


def fhir_to_dict(fhir):
    """Convert PH Core FHIR Patient resource to local dict."""
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

    # Extract extensions
    indigenous_val = _get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people")
    indigenous_group_val = _get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group")
    nationality_ext = _get_extension(extensions, "http://hl7.org/fhir/StructureDefinition/patient-nationality")
    religion_val = _get_extension(extensions, "http://hl7.org/fhir/StructureDefinition/patient-religion")
    occupation_val = _get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/occupation")
    education_val = _get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment")

    # Parse nested nationality extension
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

    # Parse contact
    contact = contacts[0] if contacts else {}
    contact_name = contact.get("name", {})
    contact_telecoms = contact.get("telecom", [])
    contact_rels = contact.get("relationship", [{}])
    contact_rel = contact_rels[0] if contact_rels else {}

    result = {
        "first_name": given[0] if given else "",
        "middle_name": given[1] if len(given) > 1 else "",
        "last_name": name.get("family", ""),
        "gender": fhir.get("gender", "").capitalize(),
        "birthdate": fhir.get("birthDate"),
        "philhealth_id": ph_id,
        "mobile_number": phone,
        "nationality": nationality,
        "religion": _display(religion_val),
        "occupation": _display(occupation_val),
        "education": _display(education_val),
        "indigenous_flag": indigenous_val if isinstance(indigenous_val, bool) else None,
        "indigenous_group": _display(indigenous_group_val),
        "civil_status": fhir.get("maritalStatus", {}).get("coding", [{}])[0].get("display") if fhir.get("maritalStatus") else None,
        "address_line": addr.get("line", [None])[0] if addr.get("line") else None,
        "address_city": addr.get("city"),
        "address_district": addr.get("district"),
        "address_state": addr.get("state"),
        "address_postal_code": addr.get("postalCode"),
        "address_country": addr.get("country"),
        "contact_first_name": contact_name.get("given", [None])[0] if contact_name.get("given") else None,
        "contact_last_name": contact_name.get("family"),
        "contact_mobile_number": next((t["value"] for t in contact_telecoms if t.get("system") == "phone"), None),
        "contact_relationship": contact_rel.get("coding", [{}])[0].get("display") if contact_rel.get("coding") else None,
    }
    return result
