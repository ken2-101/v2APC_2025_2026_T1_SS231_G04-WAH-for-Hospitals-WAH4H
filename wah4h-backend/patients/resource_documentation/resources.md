// Barrel export for FHIR Resource data - scalable modular structure
// Add new resources by creating a new file and importing here

// Type exports
export type { ResourceSlug, PhCoreResourceSlug, BaseR4ResourceSlug, FieldDefinition, ResourceDefinition, CodeSystem, PageInfo } from "./types";

// ============================================================================
// PH Core Resource Exports (validated against Philippine Core profiles)
// ============================================================================
export { patientResource } from "./patient";
export { encounterResource } from "./encounter";
export { procedureResource } from "./procedure";
export { immunizationResource } from "./immunization";
export { observationResource } from "./observation";
export { medicationResource } from "./medication";
export { locationResource } from "./location";
export { organizationResource } from "./organization";
export { practitionerResource } from "./practitioner";

// ============================================================================
// Base R4 Resource Exports (validated against standard HL7 FHIR R4)
// ============================================================================
// Financial/Administrative
export { accountResource } from "./account";
export { claimResource } from "./claim";
export { claimResponseResource } from "./claim-response";
export { chargeItemResource } from "./charge-item";
export { chargeItemDefinitionResource } from "./charge-item-definition";
export { invoiceResource } from "./invoice";
export { paymentNoticeResource } from "./payment-notice";
export { paymentReconciliationResource } from "./payment-reconciliation";

// Clinical/Other
export { allergyIntoleranceResource } from "./allergy-intolerance";
export { conditionResource } from "./condition";
export { diagnosticReportResource } from "./diagnostic-report";
export { medicationAdministrationResource } from "./medication-administration";
export { medicationRequestResource } from "./medication-request";
export { nutritionOrderResource } from "./nutrition-order";
export { practitionerRoleResource } from "./practitioner-role";

// ============================================================================
// Import for aggregation
// ============================================================================
// PH Core
import { patientResource } from "./patient";
import { encounterResource } from "./encounter";
import { procedureResource } from "./procedure";
import { immunizationResource } from "./immunization";
import { observationResource } from "./observation";
import { medicationResource } from "./medication";
import { locationResource } from "./location";
import { organizationResource } from "./organization";
import { practitionerResource } from "./practitioner";

// Base R4 - Financial/Administrative
import { accountResource } from "./account";
import { claimResource } from "./claim";
import { claimResponseResource } from "./claim-response";
import { chargeItemResource } from "./charge-item";
import { chargeItemDefinitionResource } from "./charge-item-definition";
import { invoiceResource } from "./invoice";
import { paymentNoticeResource } from "./payment-notice";
import { paymentReconciliationResource } from "./payment-reconciliation";

// Base R4 - Clinical/Other
import { allergyIntoleranceResource } from "./allergy-intolerance";
import { conditionResource } from "./condition";
import { diagnosticReportResource } from "./diagnostic-report";
import { medicationAdministrationResource } from "./medication-administration";
import { medicationRequestResource } from "./medication-request";
import { nutritionOrderResource } from "./nutrition-order";
import { practitionerRoleResource } from "./practitioner-role";

import type { ResourceDefinition, ResourceSlug, CodeSystem, PageInfo } from "./types";

// ============================================================================
// Aggregated resources arrays - grouped by category for display
// ============================================================================

// PH Core resources (validated against Philippine Core profiles)
export const phCoreResources: ResourceDefinition[] = [
  patientResource,
  encounterResource,
  procedureResource,
  immunizationResource,
  observationResource,
  medicationResource,
  locationResource,
  organizationResource,
  practitionerResource,
];

// Base R4 resources (validated against standard HL7 FHIR R4)
export const baseR4Resources: ResourceDefinition[] = [
  // Financial/Administrative
  accountResource,
  claimResource,
  claimResponseResource,
  chargeItemResource,
  chargeItemDefinitionResource,
  invoiceResource,
  paymentNoticeResource,
  paymentReconciliationResource,
  // Clinical/Other
  allergyIntoleranceResource,
  conditionResource,
  diagnosticReportResource,
  medicationAdministrationResource,
  medicationRequestResource,
  nutritionOrderResource,
  practitionerRoleResource,
];

// All resources combined (PH Core first, then Base R4)
export const resources: ResourceDefinition[] = [
  ...phCoreResources,
  ...baseR4Resources,
];

// Page metadata
export const pageInfo: PageInfo = {
  title: "FHIR Resources",
  description:
    "Comprehensive schema documentation for all FHIR resource types supported by the WAH4PC Gateway. Resources are categorized into PH Core (Philippine-specific profiles) and Base R4 (standard HL7 FHIR). All resources are validated before being forwarded between healthcare providers.",
  endpoint: "/receive/{resourceType}",
  supportedResources: [
    // PH Core
    "Patient", "Encounter", "Procedure", "Immunization", "Observation", "Medication",
    "Location", "Organization", "Practitioner",
    // Base R4
    "Account", "Claim", "ClaimResponse", "ChargeItem", "ChargeItemDefinition",
    "Invoice", "PaymentNotice", "PaymentReconciliation",
    "AllergyIntolerance", "Condition", "DiagnosticReport",
    "MedicationAdministration", "MedicationRequest", "NutritionOrder", "PractitionerRole",
  ],
};

// Common code systems used across resources
export const commonCodeSystems: CodeSystem[] = [
  {
    name: "SNOMED CT",
    url: "http://snomed.info/sct",
    description: "Systematized Nomenclature of Medicine - Clinical Terms for clinical concepts",
  },
  {
    name: "LOINC",
    url: "http://loinc.org",
    description: "Logical Observation Identifiers Names and Codes for laboratory and clinical observations",
  },
  {
    name: "CVX",
    url: "http://hl7.org/fhir/sid/cvx",
    description: "CDC Vaccine Administered codes for immunizations",
  },
  {
    name: "RxNorm",
    url: "http://www.nlm.nih.gov/research/umls/rxnorm",
    description: "Normalized names for clinical drugs",
  },
  {
    name: "PSGC",
    url: "urn://example.com/ph-core/fhir/CodeSystem/PSGC",
    description: "Philippine Standard Geographic Code for location references",
  },
  {
    name: "PSOC",
    url: "urn://example.com/ph-core/fhir/CodeSystem/PSOC",
    description: "Philippine Standard Occupational Classification",
  },
  {
    name: "PSCED",
    url: "urn://example.com/ph-core/fhir/CodeSystem/PSCED",
    description: "Philippine Standard Classification of Education",
  },
];

// Helper function to get a resource by slug
export function getResourceBySlug(slug: string): ResourceDefinition | undefined {
  return resources.find((r) => r.id === slug);
}

// Get all resource slugs for static generation
export function getAllResourceSlugs(): ResourceSlug[] {
  return resources.map((r) => r.id) as ResourceSlug[];
}