import type { ResourceDefinition } from "./types";

export const immunizationResource: ResourceDefinition = {
  id: "immunization",
  name: "Immunization",
  title: "PH Core Immunization",
  description:
    "Describes the event of a patient being administered a vaccine or a record of an immunization as reported by a patient, a clinician or another party. This profile constrains patient and encounter references to use PH Core profiles.",
  profileUrl: "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Immunization",
  fields: [
    {
      name: "meta.profile",
      path: "Immunization.meta.profile",
      type: "canonical[]",
      description: "Must include the PH Core Immunization profile URL",
      required: true,
    },
    {
      name: "status",
      path: "Immunization.status",
      type: "code",
      description: "Current status (completed | entered-in-error | not-done)",
      required: true,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/immunization-status",
        displayName: "Immunization Status",
      },
    },
    {
      name: "vaccineCode",
      path: "Immunization.vaccineCode",
      type: "CodeableConcept",
      description: "Vaccine product administered - CVX codes recommended",
      required: true,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/vaccine-code",
        displayName: "Vaccine Administered Value Set",
      },
    },
    {
      name: "patient",
      path: "Immunization.patient",
      type: "Reference",
      description: "The patient who received the immunization - must conform to PH Core Patient",
      required: true,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient"],
    },
    {
      name: "encounter",
      path: "Immunization.encounter",
      type: "Reference",
      description: "The encounter during which immunization was given - must conform to PH Core Encounter",
      required: false,
      referenceTarget: ["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter"],
    },
    {
      name: "occurrenceDateTime",
      path: "Immunization.occurrence[x]",
      type: "dateTime | string",
      description: "When the vaccine was administered",
      required: true,
    },
    {
      name: "primarySource",
      path: "Immunization.primarySource",
      type: "boolean",
      description: "Indicates if this is from the source who administered the vaccine",
      required: false,
    },
    {
      name: "lotNumber",
      path: "Immunization.lotNumber",
      type: "string",
      description: "Vaccine lot number",
      required: false,
    },
    {
      name: "expirationDate",
      path: "Immunization.expirationDate",
      type: "date",
      description: "Vaccine expiration date",
      required: false,
    },
    {
      name: "site",
      path: "Immunization.site",
      type: "CodeableConcept",
      description: "Body site where vaccine was administered",
      required: false,
    },
    {
      name: "route",
      path: "Immunization.route",
      type: "CodeableConcept",
      description: "Route of administration (e.g., IM, SC)",
      required: false,
    },
    {
      name: "doseQuantity",
      path: "Immunization.doseQuantity",
      type: "Quantity",
      description: "Amount of vaccine administered",
      required: false,
    },
    {
      name: "performer",
      path: "Immunization.performer",
      type: "BackboneElement[]",
      description: "Who performed the immunization",
      required: false,
    },
    {
      name: "fundingSource",
      path: "Immunization.fundingSource",
      type: "CodeableConcept",
      description: "Funding source (public | private)",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Immunization",
  "id": "example-immunization",
  "meta": {
    "profile": [
      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization"
    ]
  },
  "text": {
    "status": "generated",
    "div": "<div xmlns=\\"http://www.w3.org/1999/xhtml\\">Patient received influenza vaccine.</div>"
  },
  "identifier": [
    {
      "system": "urn:ietf:rfc:3986",
      "value": "urn:oid:1.3.6.1.4.1.21367.2005.3.7.1234"
    }
  ],
  "status": "completed",
  "vaccineCode": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/cvx",
        "code": "141",
        "display": "Influenza, seasonal, injectable"
      }
    ],
    "text": "Influenza Vaccine"
  },
  "patient": {
    "reference": "urn:uuid:64eb2d39-8da6-4c1d-b4c7-a6d3e916cd5b"
  },
  "encounter": {
    "reference": "urn:uuid:b3f5e8c2-a123-4567-89ab-cdef01234567"
  },
  "occurrenceDateTime": "2024-01-15T10:00:00+08:00",
  "primarySource": true,
  "lotNumber": "AAJN11K",
  "expirationDate": "2025-06-30",
  "site": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActSite",
        "code": "LA",
        "display": "left arm"
      }
    ]
  },
  "route": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration",
        "code": "IM",
        "display": "Injection, intramuscular"
      }
    ]
  },
  "doseQuantity": {
    "value": 0.5,
    "unit": "mL",
    "system": "http://unitsofmeasure.org",
    "code": "mL"
  },
  "performer": [
    {
      "actor": {
        "reference": "urn:uuid:a036fd4c-c950-497b-8905-0d2c5ec6f1d4"
      },
      "function": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/v2-0443",
            "code": "AP",
            "display": "Administering Provider"
          }
        ]
      }
    }
  ],
  "fundingSource": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/immunization-funding-source",
        "code": "public",
        "display": "Public"
      }
    ]
  },
  "note": [
    {
      "text": "Patient tolerated the vaccine well with no immediate adverse reactions."
    }
  ]
}`,
};