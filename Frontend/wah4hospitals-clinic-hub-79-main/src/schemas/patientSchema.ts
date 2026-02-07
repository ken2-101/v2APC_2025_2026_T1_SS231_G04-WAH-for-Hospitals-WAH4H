/**
 * Patient Registration Validation Schemas
 * Using Zod for runtime validation
 */
import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS (matching patient.ts)
// ============================================================================
const genderEnum = z.enum(['male', 'female', 'other', 'unknown']);
const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const maritalStatusEnum = z.enum(['S', 'M', 'D', 'W', 'L']);
const pwdTypeEnum = z.enum(['visual', 'hearing', 'mobility', 'mental', 'intellectual', 'speech', 'multiple', 'other']);

// ============================================================================
// STEP 1: PERSONAL INFORMATION SCHEMA
// ============================================================================
export const patientStep1Schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(255, 'Last name too long'),
  middle_name: z.string().max(255, 'Middle name too long').optional(),
  suffix_name: z.string().max(255, 'Suffix too long').optional(),
  gender: genderEnum,
  birthdate: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().max(255).optional(),
  civil_status: maritalStatusEnum.optional(),
  religion: z.string().max(255).optional(),
  race: z.string().max(255).optional(),
});

export type PatientStep1FormData = z.infer<typeof patientStep1Schema>;

// ============================================================================
// STEP 2: CONTACT & ADDRESS SCHEMA
// ============================================================================
export const patientStep2Schema = z.object({
  mobile_number: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid mobile number format')
    .max(255),
  address_line: z.string().min(1, 'Barangay is required').max(255),
  address_city: z.string().min(1, 'City/Municipality is required').max(255),
  address_district: z.string().min(1, 'Province is required').max(255),
  address_state: z.string().min(1, 'Region is required').max(255),
  address_postal_code: z.string().max(100).optional(),
  address_country: z.string().max(255).optional(),
});

export type PatientStep2FormData = z.infer<typeof patientStep2Schema>;

// ============================================================================
// STEP 3: HEALTH INFORMATION SCHEMA
// ============================================================================
export const patientStep3Schema = z.object({
  philhealth_id: z.string().max(255).optional(),
  blood_type: bloodTypeEnum.optional(),
  pwd_type: pwdTypeEnum.optional(),
  occupation: z.string().max(255).optional(),
  education: z.string().max(255).optional(),
});

export type PatientStep3FormData = z.infer<typeof patientStep3Schema>;

// ============================================================================
// STEP 4: ADDITIONAL INFORMATION SCHEMA
// ============================================================================
export const patientStep4Schema = z.object({
  contact_first_name: z.string().max(50).optional(),
  contact_last_name: z.string().max(50).optional(),
  contact_mobile_number: z.string().max(50).optional(),
  contact_relationship: z.string().max(50).optional(),
  indigenous_flag: z.boolean().optional(),
  indigenous_group: z.string().max(255).optional(),
  consent_flag: z.boolean().optional(),
});

export type PatientStep4FormData = z.infer<typeof patientStep4Schema>;

// ============================================================================
// COMBINED FULL PATIENT FORM SCHEMA
// ============================================================================
export const patientFormDataSchema = z.object({
  // Personal Information (Step 1)
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  middle_name: z.string().max(255).optional(),
  suffix_name: z.string().max(255).optional(),
  gender: genderEnum,
  birthdate: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().max(255).optional(),
  civil_status: maritalStatusEnum.optional(),
  religion: z.string().max(255).optional(),
  race: z.string().max(255).optional(),

  // Contact & Address (Step 2)
  mobile_number: z.string().min(1, 'Mobile number is required').max(255),
  address_line: z.string().min(1, 'Barangay is required').max(255),
  address_city: z.string().min(1, 'City/Municipality is required').max(255),
  address_district: z.string().min(1, 'Province is required').max(255),
  address_state: z.string().min(1, 'Region is required').max(255),
  address_postal_code: z.string().max(100).optional(),
  address_country: z.string().max(255).optional(),

  // Health Information (Step 3)
  philhealth_id: z.string().max(255).optional(),
  blood_type: bloodTypeEnum.optional(),
  pwd_type: pwdTypeEnum.optional(),
  occupation: z.string().max(255).optional(),
  education: z.string().max(255).optional(),

  // Additional Information (Step 4)
  contact_first_name: z.string().max(50).optional(),
  contact_last_name: z.string().max(50).optional(),
  contact_mobile_number: z.string().max(50).optional(),
  contact_relationship: z.string().max(50).optional(),
  indigenous_flag: z.boolean().optional(),
  indigenous_group: z.string().max(255).optional(),
  consent_flag: z.boolean().optional(),
});

export type PatientFormData = z.infer<typeof patientFormDataSchema>;
