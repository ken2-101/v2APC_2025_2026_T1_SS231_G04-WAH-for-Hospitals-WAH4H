import type { ResourceDefinition } from "./types";

export const conditionResource: ResourceDefinition = {
  id: "condition",
  name: "Condition",
  title: "Condition",
  description:
    "A clinical condition, problem, diagnosis, or other event, situation, issue, or clinical concept that has risen to a level of concern. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/Condition",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/Condition",
  fields: [
    {
      name: "identifier",
      path: "Condition.identifier",
      type: "Identifier[]",
      description: "External IDs for this condition",
      required: false,
    },
    {
      name: "clinicalStatus",
      path: "Condition.clinicalStatus",
      type: "CodeableConcept",
      description: "The clinical status (active | recurrence | relapse | inactive | remission | resolved)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/condition-clinical",
        displayName: "Condition Clinical Status",
      },
    },
    {
      name: "verificationStatus",
      path: "Condition.verificationStatus",
      type: "CodeableConcept",
      description: "Verification status (unconfirmed | provisional | differential | confirmed | refuted | entered-in-error)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/condition-ver-status",
        displayName: "Condition Verification Status",
      },
    },
    {
      name: "category",
      path: "Condition.category",
      type: "CodeableConcept[]",
      description: "Category of condition (problem-list-item | encounter-diagnosis)",
      required: false,
      binding: {
        strength: "extensible",
        valueSet: "http://hl7.org/fhir/ValueSet/condition-category",
        displayName: "Condition Category",
      },
    },
    {
      name: "severity",
      path: "Condition.severity",
      type: "CodeableConcept",
      description: "Subjective severity of condition",
      required: false,
      binding: {
        strength: "preferred",
        valueSet: "http://hl7.org/fhir/ValueSet/condition-severity",
        displayName: "Condition Severity",
      },
    },
    {
      name: "code",
      path: "Condition.code",
      type: "CodeableConcept",
      description: "Identification of the condition, problem or diagnosis",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/condition-code",
        displayName: "Condition/Problem/Diagnosis Codes",
      },
    },
    {
      name: "bodySite",
      path: "Condition.bodySite",
      type: "CodeableConcept[]",
      description: "Anatomical location, if relevant",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/body-site",
        displayName: "Body Site",
      },
    },
    {
      name: "subject",
      path: "Condition.subject",
      type: "Reference",
      description: "Who has the condition",
      required: true,
      referenceTarget: ["Patient", "Group"],
    },
    {
      name: "encounter",
      path: "Condition.encounter",
      type: "Reference",
      description: "Encounter created as part of",
      required: false,
      referenceTarget: ["Encounter"],
    },
    {
      name: "onsetDateTime",
      path: "Condition.onset[x]",
      type: "dateTime",
      description: "Estimated or actual date, date-time, or age",
      required: false,
    },
    {
      name: "recordedDate",
      path: "Condition.recordedDate",
      type: "dateTime",
      description: "Date record was first recorded",
      required: false,
    },
    {
      name: "recorder",
      path: "Condition.recorder",
      type: "Reference",
      description: "Who recorded the condition",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Patient", "RelatedPerson"],
    },
    {
      name: "note",
      path: "Condition.note",
      type: "Annotation[]",
      description: "Additional information about the condition",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "Condition",
  "id": "example-condition",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
        "code": "active",
        "display": "Active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        "code": "confirmed",
        "display": "Confirmed"
      }
    ]
  },
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/condition-category",
          "code": "encounter-diagnosis",
          "display": "Encounter Diagnosis"
        }
      ]
    }
  ],
  "severity": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "24484000",
        "display": "Severe"
      }
    ]
  },
  "code": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "E11.9",
        "display": "Type 2 diabetes mellitus without complications"
      }
    ],
    "text": "Type 2 Diabetes Mellitus"
  },
  "subject": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "encounter": {
    "reference": "Encounter/example-encounter"
  },
  "onsetDateTime": "2020-06-15",
  "recordedDate": "2020-06-15T10:00:00Z",
  "recorder": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  }
}`,
};