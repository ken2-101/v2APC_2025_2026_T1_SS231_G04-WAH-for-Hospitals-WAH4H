import type { ResourceDefinition } from "./types";

export const patientResource: ResourceDefinition = {
  id: "patient",
  name: "Patient",
  title: "PH Core Patient",
  description:
    "Captures key demographic and administrative information about individuals receiving care or other health-related services. This profile extends the base FHIR Patient resource with Philippine-specific extensions for indigenous peoples, nationality, religion, occupation, race, and educational attainment.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Patient",
  fields: [
    {
      name: "meta.profile",
      path: "Patient.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Patient profile URL",
      required: true,
    },
    {
      name: "extension:indigenousPeople",
      path: "Patient.extension",
      type: "Extension",
      description: "Indicates whether the patient is an indigenous person (boolean value)",
      required: true,
      pattern: "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
    },
    {
      name: "extension:nationality",
      path: "Patient.extension",
      type: "Extension",
      description: "Patient's nationality using ISO 3166 country codes",
      required: false,
      pattern: "http://hl7.org/fhir/StructureDefinition/patient-nationality",
    },
    {
      name: "extension:religion",
      path: "Patient.extension",
      type: "Extension",
      description: "Patient's religious affiliation",
      required: false,
      pattern: "http://hl7.org/fhir/StructureDefinition/patient-religion",
    },
    {
      name: "extension:indigenousGroup",
      path: "Patient.extension",
      type: "Extension",
      description: "Specific indigenous group if patient is indigenous",
      required: false,
      pattern: "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-group",
      binding: {
        strength: "extensible",
        valueSet: "urn://example.com/ph-core/fhir/CodeSystem/indigenous-groups",
        displayName: "Indigenous Groups CodeSystem",
      },
    },
    {
      name: "extension:occupation",
      path: "Patient.extension",
      type: "Extension",
      description: "Patient's occupation using PSOC codes",
      required: false,
      pattern: "urn://example.com/ph-core/fhir/StructureDefinition/occupation",
      binding: {
        strength: "extensible",
        valueSet: "urn://example.com/ph-core/fhir/ValueSet/occupational-classifications",
        displayName: "PSOC Occupational Classifications",
      },
    },
    {
      name: "extension:race",
      path: "Patient.extension",
      type: "Extension",
      description: "Patient's race",
      required: false,
      pattern: "urn://example.com/ph-core/fhir/StructureDefinition/race",
      binding: {
        strength: "extensible",
        valueSet: "urn://example.com/ph-core/fhir/CodeSystem/race",
        displayName: "Race CodeSystem",
      },
    },
    {
      name: "extension:educationalAttainment",
      path: "Patient.extension",
      type: "Extension",
      description: "Patient's highest educational attainment using PSCED codes",
      required: false,
      pattern: "urn://example.com/ph-core/fhir/StructureDefinition/educational-attainment",
      binding: {
        strength: "extensible",
        valueSet: "urn://example.com/ph-core/fhir/ValueSet/educational-attainments",
        displayName: "PSCED Educational Attainments",
      },
    },
    {
      name: "identifier:PHCorePhilHealthID",
      path: "Patient.identifier",
      type: "Identifier",
      description: "PhilHealth ID - system must match the pattern when provided",
      required: false,
      pattern: "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
    },
    {
      name: "identifier:PHCorePddRegistration",
      path: "Patient.identifier",
      type: "Identifier",
      description: "PhilHealth Dialysis Database Registration Number",
      required: false,
      pattern: "http://doh.gov.ph/fhir/Identifier/pdd-registration",
    },
    {
      name: "address",
      path: "Patient.address",
      type: "Address",
      description: "Patient address using PH Core Address profile with PSGC extensions",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address"],
    },
    {
      name: "maritalStatus",
      path: "Patient.maritalStatus",
      type: "CodeableConcept",
      description: "Patient's marital status",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/marital-status",
        displayName: "Marital Status Codes",
      },
    },
    {
      name: "contact.relationship",
      path: "Patient.contact.relationship",
      type: "CodeableConcept",
      description: "Relationship of contact to patient",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype",
        displayName: "Related Person Relationship Type",
      },
    },
    {
      name: "name",
      path: "Patient.name",
      type: "HumanName[]",
      description: "Patient's name(s) - given and family names",
      required: false,
    },
    {
      name: "gender",
      path: "Patient.gender",
      type: "code",
      description: "Patient's administrative gender (male | female | other | unknown)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/administrative-gender",
        displayName: "Administrative Gender",
      },
    },
    {
      name: "birthDate",
      path: "Patient.birthDate",
      type: "date",
      description: "Patient's date of birth (YYYY-MM-DD format)",
      required: false,
    },
    {
      name: "active",
      path: "Patient.active",
      type: "boolean",
      description: "Whether the patient record is active",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Patient",
  "id": "example-patient",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Juan Dela Cruz is a male patient born on June 15, 1985, residing in Quezon City, NCR, Philippines.</div>"
  },
  "extension": [
    {
      "url": "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people",
      "valueBoolean": false
    },
    {
      "url": "http://hl7.org/fhir/StructureDefinition/patient-nationality",
      "extension": [
        {
          "url": "code",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn:iso:std:iso:3166",
                "code": "PH",
                "display": "Philippines"
              }
            ]
          }
        }
      ]
    },
    {
      "url": "http://hl7.org/fhir/StructureDefinition/patient-religion",
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ReligiousAffiliation",
            "code": "1041",
            "display": "Roman Catholic Church"
          }
        ]
      }
    },
    {
      "url": "urn://example.com/ph-core/fhir/StructureDefinition/race",
      "valueCodeableConcept": {
        "coding": [
          {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/race",
            "code": "filipino",
            "display": "Filipino"
          }
        ]
      }
    }
  ],
  "identifier": [
    {
      "system": "http://philhealth.gov.ph/fhir/Identifier/philhealth-id",
      "value": "12-345678901-2"
    }
  ],
  "name": [
    {
      "family": "Dela Cruz",
      "given": ["Juan", "Santos"]
    }
  ],
  "gender": "male",
  "birthDate": "1985-06-15",
  "active": true,
  "address": [
    {
      "line": ["123 Rizal Street", "Barangay Commonwealth"],
      "city": "Quezon City",
      "postalCode": "1121",
      "country": "PH",
      "extension": [
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-address-region",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
                "code": "130000000",
                "display": "NCR"
              }
            ]
          }
        },
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/city-municipality",
          "valueCoding": {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
            "code": "137404000",
            "display": "Quezon City"
          }
        },
        {
          "url": "urn://example.com/ph-core/fhir/StructureDefinition/barangay",
          "valueCoding": {
            "system": "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
            "code": "137404019",
            "display": "Camp Aguinaldo"
          }
        }
      ]
    }
  ],
  "maritalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        "code": "M",
        "display": "Married"
      }
    ]
  }
}`,
};