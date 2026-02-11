import type { ResourceDefinition } from "./types";

export const allergyIntoleranceResource: ResourceDefinition = {
  id: "allergy-intolerance",
  name: "AllergyIntolerance",
  title: "Allergy Intolerance",
  description:
    "Risk of harmful or undesirable physiological response which is unique to an individual and associated with exposure to a substance. This resource uses standard HL7 FHIR R4 validation.",
  profileUrl: "http://hl7.org/fhir/StructureDefinition/AllergyIntolerance",
  fhirVersion: "4.0.1",
  baseDefinition: "http://hl7.org/fhir/StructureDefinition/AllergyIntolerance",
  fields: [
    {
      name: "identifier",
      path: "AllergyIntolerance.identifier",
      type: "Identifier[]",
      description: "External IDs for this allergy",
      required: false,
    },
    {
      name: "clinicalStatus",
      path: "AllergyIntolerance.clinicalStatus",
      type: "CodeableConcept",
      description: "Clinical status of the allergy (active | inactive | resolved)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/allergyintolerance-clinical",
        displayName: "Allergy Intolerance Clinical Status",
      },
    },
    {
      name: "verificationStatus",
      path: "AllergyIntolerance.verificationStatus",
      type: "CodeableConcept",
      description: "Verification status (unconfirmed | confirmed | refuted | entered-in-error)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/allergyintolerance-verification",
        displayName: "Allergy Intolerance Verification Status",
      },
    },
    {
      name: "type",
      path: "AllergyIntolerance.type",
      type: "code",
      description: "allergy | intolerance - Underlying mechanism",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/allergy-intolerance-type",
        displayName: "Allergy Intolerance Type",
      },
    },
    {
      name: "category",
      path: "AllergyIntolerance.category",
      type: "code[]",
      description: "Category of the identified substance (food | medication | environment | biologic)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/allergy-intolerance-category",
        displayName: "Allergy Intolerance Category",
      },
    },
    {
      name: "criticality",
      path: "AllergyIntolerance.criticality",
      type: "code",
      description: "Potential seriousness (low | high | unable-to-assess)",
      required: false,
      binding: {
        strength: "required",
        valueSet: "http://hl7.org/fhir/ValueSet/allergy-intolerance-criticality",
        displayName: "Allergy Intolerance Criticality",
      },
    },
    {
      name: "code",
      path: "AllergyIntolerance.code",
      type: "CodeableConcept",
      description: "Code that identifies the allergy or intolerance",
      required: false,
      binding: {
        strength: "example",
        valueSet: "http://hl7.org/fhir/ValueSet/allergyintolerance-code",
        displayName: "Allergy Intolerance Substance/Product",
      },
    },
    {
      name: "patient",
      path: "AllergyIntolerance.patient",
      type: "Reference",
      description: "Who the sensitivity is for",
      required: true,
      referenceTarget: ["Patient"],
    },
    {
      name: "encounter",
      path: "AllergyIntolerance.encounter",
      type: "Reference",
      description: "Encounter when the allergy was asserted",
      required: false,
      referenceTarget: ["Encounter"],
    },
    {
      name: "onsetDateTime",
      path: "AllergyIntolerance.onset[x]",
      type: "dateTime",
      description: "When allergy or intolerance was identified",
      required: false,
    },
    {
      name: "recorder",
      path: "AllergyIntolerance.recorder",
      type: "Reference",
      description: "Who recorded the sensitivity",
      required: false,
      referenceTarget: ["Practitioner", "PractitionerRole", "Patient", "RelatedPerson"],
    },
    {
      name: "reaction",
      path: "AllergyIntolerance.reaction",
      type: "BackboneElement[]",
      description: "Adverse reaction events linked to exposure",
      required: false,
    },
  ],
  jsonTemplate: `{
  "resourceType": "AllergyIntolerance",
  "id": "example-allergy",
  "clinicalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        "code": "active",
        "display": "Active"
      }
    ]
  },
  "verificationStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
        "code": "confirmed",
        "display": "Confirmed"
      }
    ]
  },
  "type": "allergy",
  "category": ["medication"],
  "criticality": "high",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "7980",
        "display": "Penicillin"
      }
    ],
    "text": "Penicillin"
  },
  "patient": {
    "reference": "Patient/example-patient",
    "display": "Juan Dela Cruz"
  },
  "onsetDateTime": "2010-01-01",
  "recorder": {
    "reference": "Practitioner/example-practitioner",
    "display": "Dr. Maria Santos"
  },
  "reaction": [
    {
      "manifestation": [
        {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "39579001",
              "display": "Anaphylaxis"
            }
          ]
        }
      ],
      "severity": "severe"
    }
  ]
}`,
};