/**
 * Patient Registration Validation Schemas
 * Using Zod for runtime validation
 * Aligned with Patient model (wah4h-backend/patients/models.py)
 */
import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS (matching patient.ts)
// ============================================================================
const genderEnum = z.enum(['male', 'female', 'other', 'unknown']);
const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const maritalStatusEnum = z.enum(['S', 'M', 'D', 'W', 'L']);
const pwdTypeEnum = z.enum(['visual', 'hearing', 'mobility', 'mental', 'intellectual', 'speech', 'multiple', 'other']);

// Helper: treat empty string from <select> as undefined for optional enums
const optionalEnum = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.preprocess((val) => (val === '' ? undefined : val), enumSchema.optional());

// Helper: treat empty string as undefined for optional strings
const optionalString = (max = 255) =>
  z.preprocess((val) => (val === '' ? undefined : val), z.string().max(max).optional());

// ============================================================================
// STEP 1: BASIC INFO
// first_name, middle_name, last_name, suffix_name,
// birthdate, gender, civil_status, blood_type, pwd_type,
// indigenous_flag, indigenous_group
// ============================================================================
export const patientStep1Schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(255, 'Last name too long'),
  middle_name: z.string().max(255, 'Middle name too long').optional(),
  suffix_name: z.string().max(255, 'Suffix too long').optional(),
  birthdate: z.string().min(1, 'Date of birth is required'),
  gender: genderEnum,
  civil_status: optionalEnum(maritalStatusEnum),
  blood_type: optionalEnum(bloodTypeEnum),
  pwd_type: optionalEnum(pwdTypeEnum),
  indigenous_flag: z.boolean().optional(),
  indigenous_group: z.string().max(255).optional(),
});

export type PatientStep1FormData = z.infer<typeof patientStep1Schema>;

// ============================================================================
// STEP 2: CONTACT & ADDRESS
// mobile_number, address_line, address_city, address_district,
// address_state, address_postal_code, address_country
// ============================================================================
export const patientStep2Schema = z.object({
  mobile_number: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid mobile number format')
    .max(255),
  address_line: z.string().min(1, 'Barangay is required').max(255),
  address_city: z.string().min(1, 'City/Municipality is required').max(255),
  address_district: optionalString(255),
  address_state: optionalString(255),
  address_postal_code: optionalString(100),
  address_country: optionalString(255),
});

export type PatientStep2FormData = z.infer<typeof patientStep2Schema>;

// ============================================================================
// STEP 3: EMERGENCY CONTACT
// contact_first_name, contact_last_name,
// contact_mobile_number, contact_relationship
// ============================================================================
export const patientStep3Schema = z.object({
  contact_first_name: z.string().min(1, 'Contact first name is required').max(50),
  contact_last_name: z.string().min(1, 'Contact last name is required').max(50),
  contact_mobile_number: z
    .string()
    .min(1, 'Contact mobile number is required')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid mobile number format')
    .max(50),
  contact_relationship: optionalString(50),
});

export type PatientStep3FormData = z.infer<typeof patientStep3Schema>;

// ============================================================================
// STEP 4: ADDITIONAL INFO (all optional)
// nationality, religion, occupation, education,
// philhealth_id, consent_flag, image_url
// ============================================================================
export const patientStep4Schema = z.object({
  nationality: optionalString(255),
  religion: optionalString(255),
  occupation: optionalString(255),
  education: optionalString(255),
  philhealth_id: optionalString(255),
  consent_flag: z.boolean().optional(),
  image_url: optionalString(255),
});

export type PatientStep4FormData = z.infer<typeof patientStep4Schema>;

// ============================================================================
// COMBINED FULL PATIENT FORM SCHEMA
// ============================================================================
export const patientFormDataSchema = z.object({
  // Step 1: Basic Info
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  middle_name: z.string().max(255).optional(),
  suffix_name: z.string().max(255).optional(),
  birthdate: z.string().min(1, 'Date of birth is required'),
  gender: genderEnum,
  civil_status: optionalEnum(maritalStatusEnum),
  blood_type: optionalEnum(bloodTypeEnum),
  pwd_type: optionalEnum(pwdTypeEnum),
  indigenous_flag: z.boolean().optional(),
  indigenous_group: z.string().max(255).optional(),

  // Step 2: Contact & Address
  mobile_number: z.string().min(1, 'Mobile number is required').max(255),
  address_line: z.string().min(1, 'Barangay is required').max(255),
  address_city: z.string().min(1, 'City/Municipality is required').max(255),
  address_district: optionalString(255),
  address_state: optionalString(255),
  address_postal_code: optionalString(100),
  address_country: optionalString(255),

  // Step 3: Emergency Contact
  contact_first_name: z.string().min(1, 'Contact first name is required').max(50),
  contact_last_name: z.string().min(1, 'Contact last name is required').max(50),
  contact_mobile_number: z.string().min(1, 'Contact mobile number is required').max(50),
  contact_relationship: optionalString(50),

  // Step 4: Additional Info
  nationality: optionalString(255),
  religion: optionalString(255),
  occupation: optionalString(255),
  education: optionalString(255),
  philhealth_id: optionalString(255),
  consent_flag: z.boolean().optional(),
  image_url: optionalString(255),
});

export type PatientFormData = z.infer<typeof patientFormDataSchema>;
