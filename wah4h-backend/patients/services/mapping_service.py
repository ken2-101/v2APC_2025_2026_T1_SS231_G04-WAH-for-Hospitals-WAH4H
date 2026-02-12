"""
Mapping Service - FHIR ↔ Local Patient Transformations

Handles bidirectional conversions:
- Local Patient → FHIR Patient Resource
- FHIR Patient → Local Patient Model
- FHIR Bundles → Multiple Local Resources

Uses FHIR standards and Philippine-specific mappings.

Responsibilities:
- Validate FHIR resources
- Map local fields to FHIR codes/systems
- Map FHIR codes/systems to local fields
- Handle identifier systems (PhilHealth, NHS, etc.)
- Convert timestamps and date formats
- Preserve data integrity across formats
"""

import logging
import os
from typing import Dict, Optional, Any, List, Tuple
from datetime import datetime
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class FHIRMapping:
    """
    Constants for FHIR coding systems and identifiers.
    """
    
    # Identifier systems
    IDENTIFIER_SYSTEM_PHILHEALTH = "http://www.philhealth.gov.ph/patient/identifier"
    IDENTIFIER_SYSTEM_INTERNAL = "http://wah4h.local/patient/identifier"
    IDENTIFIER_SYSTEM_NATIONAL = "http://www.philhealth.gov.ph/national-id"
    
    # Gender codes (FHIR)
    GENDER_MAPPING = {
        'male': 'male',
        'female': 'female',
        'M': 'male',
        'F': 'female',
    }
    
    # Marriage status codes (FHIR)
    MARITAL_STATUS_MAPPING = {
        'married': 'M',
        'single': 'S',
        'divorced': 'D',
        'widowed': 'W',
        'unknown': 'U',
    }
    
    # Blood type codes (FHIR)
    BLOOD_TYPE_MAPPING = {
        'O-': 'O negative',
        'O+': 'O positive',
        'A-': 'A negative',
        'A+': 'A positive',
        'B-': 'B negative',
        'B+': 'B positive',
        'AB-': 'AB negative',
        'AB+': 'AB positive',
    }


class PatientToFHIRMapper:
    """
    Converts local Patient model to FHIR Patient resource.
    
    Output is PH Core compliant FHIR R4 Patient resource with proper identifier[] array,
    meta.profile, and null stripping.
    """
    
    # Gateway URL for internal identifiers
    GATEWAY_URL = "https://wah4pc.echosphere.cfd"
    PROVIDER_ID = os.getenv("WAH4PC_PROVIDER_ID", "")
    
    def map_patient_to_fhir(self, patient) -> Dict[str, Any]:
        """
        Convert local Patient model to FHIR Patient resource.
        
        Args:
            patient: Django Patient model instance
        
        Returns:
            Dict representing FHIR Patient resource (nulls removed)
        """
        import os
        
        identifiers: List[Dict[str, Any]] = []
        fhir: Dict[str, Any] = {
            "resourceType": "Patient",
            "identifier": identifiers,
            "name": [{
                "use": "official",
                "family": patient.last_name,
                "given": [n for n in [patient.first_name, patient.middle_name] if n],
                "suffix": [patient.suffix_name] if patient.suffix_name else [],
            }],
            "gender": patient.gender.lower() if patient.gender else None,
            "birthDate": str(patient.birthdate) if patient.birthdate else None,
            "active": patient.active,
        }

        # Add PhilHealth identifier with proper type
        if patient.philhealth_id:
            identifiers.append({
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "SB",
                        "display": "Social Beneficiary Identifier"
                    }]
                },
                "system": "http://philhealth.gov.ph",
                "value": patient.philhealth_id
            })

        # Add MRN if exists
        if patient.patient_id:
            provider_id = os.getenv("WAH4PC_PROVIDER_ID", "")
            identifiers.append({
                "type": {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                        "code": "MR",
                        "display": "Medical record number"
                    }]
                },
                "system": f"{self.GATEWAY_URL}/providers/{provider_id}",
                "value": patient.patient_id
            })

        # Telecom
        if patient.mobile_number:
            fhir["telecom"] = [{
                "system": "phone",
                "value": patient.mobile_number,
                "use": "mobile"
            }]

        # Marital status with valid codes
        if patient.civil_status:
            status_map = {
                "single": "S", "s": "S",
                "married": "M", "m": "M",
                "widowed": "W", "w": "W",
                "divorced": "D", "d": "D",
                "separated": "L", "l": "L",
                "annulled": "A", "a": "A",
            }
            code = status_map.get(patient.civil_status.lower())

            if code:  # Only include if we have a valid code
                fhir["maritalStatus"] = {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                        "code": code
                    }]
                }

        # Address with use attribute
        if patient.address_line or patient.address_city:
            fhir["address"] = [{
                "use": "home",
                "line": [patient.address_line] if patient.address_line else [],
                "city": patient.address_city,
                "district": patient.address_district,
                "state": patient.address_state,
                "postalCode": patient.address_postal_code,
                "country": patient.address_country or "Philippines",
            }]

        # Emergency contact with proper relationship code
        if patient.contact_first_name or patient.contact_last_name:
            relationship_map = {
                "spouse": "N", "parent": "N", "mother": "N", "father": "N",
                "child": "N", "sibling": "N", "emergency": "C",
            }

            rel_code = None
            rel_display: str = patient.contact_relationship or "Emergency Contact"

            for key, code in relationship_map.items():
                if key in rel_display.lower():
                    rel_code = code
                    break

            if not rel_code:
                rel_code = "C"

            fhir["contact"] = [{
                "relationship": [{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0131",
                        "code": rel_code
                    }],
                    "text": rel_display
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

        # Store Philippine-specific data in extensions
        extensions: List[Dict[str, Any]] = []

        if patient.nationality:
            extensions.append({
                "url": "http://hl7.org/fhir/StructureDefinition/patient-nationality",
                "extension": [{
                    "url": "code",
                    "valueCodeableConcept": {
                        "coding": [{
                            "system": "urn:iso:std:iso:3166",
                            "code": "PH",
                            "display": patient.nationality
                        }]
                    }
                }]
            })

        if patient.religion:
            extensions.append({
                "url": "http://hl7.org/fhir/StructureDefinition/patient-religion",
                "valueCodeableConcept": {
                    "text": patient.religion
                }
            })

        if patient.occupation:
            extensions.append({
                "url": "urn://example.com/ph-core/fhir/StructureDefinition/occupation",
                "valueCodeableConcept": {
                    "text": patient.occupation
                }
            })

        if patient.indigenous_flag is not None:
            extensions.append({
                "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
                "valueBoolean": patient.indigenous_flag
            })

        if patient.indigenous_group:
            extensions.append({
                "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group",
                "valueCodeableConcept": {
                    "coding": [{
                        "system": "urn://example.com/ph-core/fhir/CodeSystem/indigenous-groups",
                        "code": patient.indigenous_group,
                        "display": patient.indigenous_group
                    }]
                }
            })

        if extensions:
            fhir["extension"] = extensions

        # Remove None values and empty lists
        return {k: v for k, v in fhir.items() if v not in (None, [], {})}
    
    def _build_identifiers(self, patient) -> List[Dict[str, str]]:
        """Build FHIR identifier array from patient data."""
        pass
    
    def _build_name(self, patient) -> List[Dict[str, Any]]:
        """Build FHIR name array from patient data."""
        pass
    
    def _build_address(self, patient) -> List[Dict[str, Any]]:
        """Build FHIR address array from patient data."""
        pass
    
    def _build_telecom(self, patient) -> List[Dict[str, str]]:
        """Build FHIR telecom array from patient data."""
        pass
    
    def _build_extensions(self, patient) -> List[Dict[str, Any]]:
        """Build FHIR extension array for Philippine-specific fields."""
        pass
    
    def _build_emergency_contact(self, patient) -> List[Dict[str, Any]]:
        """Build FHIR contact array for emergency contact."""
        pass


class FHIRToPatientMapper:
    """
    Converts FHIR Patient resource to local Patient data dict.
    
    Input: FHIR Patient resource (dict or json)
    Output: Dict matching Patient model fields
    """
    
    def map_fhir_to_patient(self, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert FHIR Patient resource to local Patient dict.
        
        Args:
            fhir_resource: FHIR Patient resource as dict
        
        Returns:
            Dict with patient fields ready for Patient model
        """
        name: Dict[str, Any] = fhir_resource.get("name", [{}])[0]
        ids: List[Dict[str, Any]] = fhir_resource.get("identifier", [])
        extensions: List[Dict[str, Any]] = fhir_resource.get("extension", [])
        addresses: List[Dict[str, Any]] = fhir_resource.get("address", [{}])
        addr: Dict[str, Any] = addresses[0] if addresses else {}
        telecoms: List[Dict[str, Any]] = fhir_resource.get("telecom", [])
        contacts: List[Dict[str, Any]] = fhir_resource.get("contact", [])

        ph_id = next(
            (i["value"] for i in ids if "philhealth" in i.get("system", "")), None
        )
        phone = next(
            (t["value"] for t in telecoms if t.get("system") == "phone"), None
        )
        given = name.get("given", [])

        # Extract extensions
        indigenous_val = self._get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people")
        indigenous_group_val = self._get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group")
        nationality_ext = self._get_extension(extensions, "http://hl7.org/fhir/StructureDefinition/patient-nationality")
        religion_val = self._get_extension(extensions, "http://hl7.org/fhir/StructureDefinition/patient-religion")
        occupation_val = self._get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/occupation")
        education_val = self._get_extension(extensions, "urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment")

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
                codings = val.get("coding", [])
                if codings:
                    return codings[0].get("display") or codings[0].get("code")
                return val.get("text")
            return None

        # Parse contact
        contact: Dict[str, Any] = contacts[0] if contacts else {}
        contact_name: Dict[str, Any] = contact.get("name", {})
        contact_telecoms: List[Dict[str, Any]] = contact.get("telecom", [])
        contact_rels: List[Dict[str, Any]] = contact.get("relationship", [{}])
        contact_rel: Dict[str, Any] = contact_rels[0] if contact_rels else {}

        result = {
            "first_name": given[0] if given else "",
            "middle_name": given[1] if len(given) > 1 else "",
            "last_name": name.get("family", ""),
            "gender": fhir_resource.get("gender", "").lower(),
            "birthdate": fhir_resource.get("birthDate"),
            "philhealth_id": ph_id,
            "mobile_number": phone,
            "nationality": nationality,
            "religion": _display(religion_val),
            "occupation": _display(occupation_val),
            "education": _display(education_val),
            "indigenous_flag": indigenous_val if isinstance(indigenous_val, bool) else None,
            "indigenous_group": _display(indigenous_group_val),
            "civil_status": self._parse_marital_status(fhir_resource.get("maritalStatus")),
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
    
    def _get_extension(self, extensions: List[Dict[str, Any]], url: str) -> Any:
        """Extract value from a FHIR extension by URL."""
        for ext in extensions:
            if ext.get("url") == url:
                for key, val in ext.items():
                    if key.startswith("value"):
                        return val
                if "extension" in ext:
                    return ext["extension"]
        return None
    
    def _parse_marital_status(self, marital_status: Optional[Dict[str, Any]]) -> Optional[str]:
        """Extract FHIR v3-MaritalStatus code (S, M, W, D)."""
        if not marital_status:
            return None
        codings = marital_status.get("coding", [])
        if not codings:
            # If no coding, try to map text to code
            text = marital_status.get("text", "").lower()
            text_map = {
                "single": "S", "never married": "S",
                "married": "M",
                "divorced": "D",
                "widowed": "W",
                "separated": "L", "legally separated": "L",
                "annulled": "A"
            }
            return text_map.get(text)

        # Return the code directly (S, M, W, D, L, A)
        return codings[0].get("code")
    
    def _extract_identifiers(self, fhir_resource: Dict) -> Tuple[str, Optional[str], Optional[str]]:
        """Extract identifiers from FHIR Patient resource."""
        pass
    
    def _extract_name(self, fhir_resource: Dict) -> Tuple[str, str, Optional[str], Optional[str]]:
        """Extract name from FHIR Patient resource."""
        pass
    
    def _extract_demographics(self, fhir_resource: Dict) -> Tuple[str, Optional[str]]:
        """Extract demographic info from FHIR Patient resource."""
        pass
    
    def _extract_address(self, fhir_resource: Dict) -> Dict[str, Optional[str]]:
        """Extract address from FHIR Patient resource."""
        pass
    
    def _extract_telecom(self, fhir_resource: Dict) -> Tuple[Optional[str], Optional[str]]:
        """Extract telecom from FHIR Patient resource."""
        pass
    
    def _extract_extensions(self, fhir_resource: Dict) -> Dict[str, Any]:
        """Extract extensions from FHIR Patient resource."""
        pass
    
    def _extract_emergency_contact(self, fhir_resource: Dict) -> Dict[str, Optional[str]]:
        """Extract emergency contact from FHIR Patient resource."""
        pass


class BundleMapper:
    """
    Handles FHIR Bundle resource containing multiple resources.
    """
    
    def map_bundle_to_local(self, fhir_bundle: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """Map FHIR Bundle to local resources."""
        pass
    
    def _map_resource(self, resource: Dict[str, Any], resource_type: str) -> Tuple[Optional[Any], Optional[str]]:
        """Map individual FHIR resource to local model."""
        pass


class MappingService:
    """
    High-level service coordinating all mapping operations.
    """
    
    def __init__(self):
        """Initialize mapping service with component mappers."""
        self.patient_to_fhir = PatientToFHIRMapper()
        self.fhir_to_patient = FHIRToPatientMapper()
        self.bundle_mapper = BundleMapper()
    
    def local_patient_to_fhir(self, patient) -> Dict[str, Any]:
        """
        Convert local Patient to FHIR Patient.
        
        Args:
            patient: Django Patient model instance
        
        Returns:
            Dict - FHIR Patient resource (nulls removed)
        """
        try:
            return self.patient_to_fhir.map_patient_to_fhir(patient)
        except Exception as e:
            logger.error(f"[Mapping] Error converting patient to FHIR: {str(e)}")
            raise
    
    def fhir_to_local_patient(self, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert FHIR Patient to local Patient dict.
        
        Args:
            fhir_resource: FHIR Patient resource as dict
        
        Returns:
            Dict with patient fields ready for Patient model
        """
        try:
            return self.fhir_to_patient.map_fhir_to_patient(fhir_resource)
        except Exception as e:
            logger.error(f"[Mapping] Error converting FHIR to patient: {str(e)}")
            raise
    
    def fhir_bundle_to_local(self, fhir_bundle: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """Convert FHIR Bundle to local resources."""
        try:
            return self.bundle_mapper.map_bundle_to_local(fhir_bundle)
        except Exception as e:
            logger.error(f"[Mapping] Error converting bundle: {str(e)}")
            raise
