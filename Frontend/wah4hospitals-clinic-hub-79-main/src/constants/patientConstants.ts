/**
 * Patient Module Validation Constants
 * Aligned with backend models and FHIR standards
 */

// ============================================================================
// GENDER OPTIONS (FHIR AdministrativeGender)
// ============================================================================
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export const GENDER_MAP: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  unknown: 'Unknown',
};

// ============================================================================
// BLOOD TYPE OPTIONS (ABO/Rh)
// ============================================================================
export const BLOOD_TYPE_OPTIONS = [
  { value: 'A+', label: 'A Positive' },
  { value: 'A-', label: 'A Negative' },
  { value: 'B+', label: 'B Positive' },
  { value: 'B-', label: 'B Negative' },
  { value: 'AB+', label: 'AB Positive' },
  { value: 'AB-', label: 'AB Negative' },
  { value: 'O+', label: 'O Positive' },
  { value: 'O-', label: 'O Negative' },
] as const;

export const BLOOD_TYPE_MAP: Record<string, string> = {
  'A+': 'A Positive',
  'A-': 'A Negative',
  'B+': 'B Positive',
  'B-': 'B Negative',
  'AB+': 'AB Positive',
  'AB-': 'AB Negative',
  'O+': 'O Positive',
  'O-': 'O Negative',
};

// ============================================================================
// MARITAL STATUS OPTIONS (FHIR v3-MaritalStatus)
// ============================================================================
export const MARITAL_STATUS_OPTIONS = [
  { value: 'S', label: 'Never Married (Single)' },
  { value: 'M', label: 'Married' },
  { value: 'D', label: 'Divorced' },
  { value: 'W', label: 'Widowed' },
  { value: 'L', label: 'Legally Separated' },
] as const;

export const MARITAL_STATUS_MAP: Record<string, string> = {
  S: 'Never Married (Single)',
  M: 'Married',
  D: 'Divorced',
  W: 'Widowed',
  L: 'Legally Separated',
};

// ============================================================================
// PWD TYPE OPTIONS (Philippine-specific)
// ============================================================================
export const PWD_TYPE_OPTIONS = [
  { value: 'visual', label: 'Visual Disability' },
  { value: 'hearing', label: 'Hearing Disability' },
  { value: 'mobility', label: 'Mobility Disability' },
  { value: 'mental', label: 'Mental/Psychosocial Disability' },
  { value: 'intellectual', label: 'Intellectual Disability' },
  { value: 'speech', label: 'Speech and Language Disability' },
  { value: 'multiple', label: 'Multiple Disabilities' },
  { value: 'other', label: 'Other' },
] as const;

export const PWD_TYPE_MAP: Record<string, string> = {
  visual: 'Visual Disability',
  hearing: 'Hearing Disability',
  mobility: 'Mobility Disability',
  mental: 'Mental/Psychosocial Disability',
  intellectual: 'Intellectual Disability',
  speech: 'Speech and Language Disability',
  multiple: 'Multiple Disabilities',
  other: 'Other',
};

// ============================================================================
// COMMON NATIONALITIES
// ============================================================================
export const NATIONALITY_OPTIONS = [
  { value: 'Filipino', label: 'Filipino' },
  { value: 'American', label: 'American' },
  { value: 'British', label: 'British' },
  { value: 'Canadian', label: 'Canadian' },
  { value: 'Australian', label: 'Australian' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Indian', label: 'Indian' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Other', label: 'Other' },
] as const;

// ============================================================================
// COMMON RELIGIONS
// ============================================================================
export const RELIGION_OPTIONS = [
  { value: 'Roman Catholic', label: 'Roman Catholic' },
  { value: 'Islam', label: 'Islam' },
  { value: 'Christianity', label: 'Christianity' },
  { value: 'Buddhism', label: 'Buddhism' },
  { value: 'Hinduism', label: 'Hinduism' },
  { value: 'Judaism', label: 'Judaism' },
  { value: 'Atheist', label: 'Atheist' },
  { value: 'Agnostic', label: 'Agnostic' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
] as const;

// ============================================================================
// EMERGENCY CONTACT RELATIONSHIPS
// ============================================================================
export const CONTACT_RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'employer', label: 'Employer' },
  { value: 'other', label: 'Other' },
] as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================
export const PATIENT_VALIDATION = {
  // Name fields
  firstName: {
    minLength: 2,
    maxLength: 255,
  },
  lastName: {
    minLength: 2,
    maxLength: 255,
  },
  middleName: {
    maxLength: 255,
  },
  suffixName: {
    maxLength: 255,
  },

  // Contact
  mobileNumber: {
    pattern: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    minLength: 7,
    maxLength: 20,
  },

  // IDs
  philHealthId: {
    maxLength: 255,
  },
  patientId: {
    maxLength: 255,
  },

  // Text fields
  nationality: {
    maxLength: 255,
  },
  religion: {
    maxLength: 255,
  },
  race: {
    maxLength: 100,
  },
  occupation: {
    maxLength: 255,
  },
  education: {
    maxLength: 255,
  },
  indigenousGroup: {
    maxLength: 255,
  },

  // Address fields
  addressLine: {
    maxLength: 255,
  },
  addressCity: {
    maxLength: 255,
  },
  addressDistrict: {
    maxLength: 255,
  },
  addressState: {
    maxLength: 255,
  },
  addressPostalCode: {
    maxLength: 100,
  },
  addressCountry: {
    maxLength: 255,
  },

  // Emergency contact
  contactFirstName: {
    maxLength: 50,
  },
  contactLastName: {
    maxLength: 50,
  },
  contactMobileNumber: {
    maxLength: 50,
  },
  contactRelationship: {
    maxLength: 50,
  },
};

// ============================================================================
// REGISTRATION WIZARD STEPS
// ============================================================================
export const REGISTRATION_STEPS = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Basic identity and demographic information',
  },
  {
    id: 2,
    title: 'Contact & Address',
    description: 'Contact details and address information',
  },
  {
    id: 3,
    title: 'Health Information',
    description: 'Blood type, PhilHealth ID, and health status',
  },
  {
    id: 4,
    title: 'Additional Information',
    description: 'Emergency contact and special requirements',
  },
] as const;
