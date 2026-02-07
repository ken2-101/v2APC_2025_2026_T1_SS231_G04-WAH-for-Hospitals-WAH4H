/**
 * Patient Validation Schema using Zod
 * Defines validation rules for patient data
 */
import { z } from 'zod';

// ============================================================================
// GENDER, BLOOD TYPE, MARITAL STATUS, PWD TYPE SCHEMAS
// ============================================================================
export const genderSchema = z.enum(['male', 'female', 'other', 'unknown']).optional();

export const bloodTypeSchema = z
  .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  .optional();

export const maritalStatusSchema = z
  .enum(['S', 'M', 'D', 'W', 'L'])
  .optional();

export const pwdTypeSchema = z
  .enum(['visual', 'hearing', 'mobility', 'mental', 'intellectual', 'speech', 'multiple', 'other'])
  .optional();

// ============================================================================
// PATIENT REGISTRATION SCHEMA (Step 1: Personal Information)
// ============================================================================
export const patientPersonalInfoSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(255, 'First name is too long')
    .trim(),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(255, 'Last name is too long')
    .trim(),
  middle_name: z
    .string()
    .max(255, 'Middle name is too long')
    .trim()
    .optional(),
  suffix_name: z
    .string()
    .max(255, 'Suffix is too long')
    .trim()
    .optional(),
  gender: genderSchema,
  birthdate: z
    .string()
    .refine(
      (date) => !isNaN(new Date(date).getTime()),
      'Invalid date format'
    )
    .refine(
      (date) => new Date(date) < new Date(),
      'Birthdate must be in the past'
    )
    .optional(),
  nationality: z
    .string()
    .max(255, 'Nationality is too long')
    .trim()
    .optional(),
  religion: z
    .string()
    .max(255, 'Religion is too long')
    .trim()
    .optional(),
  race: z
    .string()
    .max(100, 'Race is too long')
    .trim()
    .optional(),
  civil_status: maritalStatusSchema,
});

// ============================================================================
// PATIENT REGISTRATION SCHEMA (Step 2: Contact & Address)
// ============================================================================
export const patientContactAddressSchema = z.object({
  mobile_number: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      'Invalid mobile number format'
    )
    .optional(),
  address_line: z
    .string()
    .max(255, 'Address line is too long')
    .trim()
    .optional(),
  address_city: z
    .string()
    .max(255, 'City is too long')
    .trim()
    .optional(),
  address_district: z
    .string()
    .max(255, 'District is too long')
    .trim()
    .optional(),
  address_state: z
    .string()
    .max(255, 'State is too long')
    .trim()
    .optional(),
  address_country: z
    .string()
    .max(255, 'Country is too long')
    .trim()
    .optional(),
  address_postal_code: z
    .string()
    .max(100, 'Postal code is too long')
    .trim()
    .optional(),
});

// ============================================================================
// PATIENT REGISTRATION SCHEMA (Step 3: Health Information)
// ============================================================================
export const patientHealthInfoSchema = z.object({
  philhealth_id: z
    .string()
    .max(255, 'PhilHealth ID is too long')
    .trim()
    .optional(),
  blood_type: bloodTypeSchema,
  pwd_type: pwdTypeSchema,
  occupation: z
    .string()
    .max(255, 'Occupation is too long')
    .trim()
    .optional(),
  education: z
    .string()
    .max(255, 'Education is too long')
    .trim()
    .optional(),
});

// ============================================================================
// PATIENT REGISTRATION SCHEMA (Step 4: Additional Information)
// ============================================================================
export const patientAdditionalInfoSchema = z.object({
  contact_first_name: z
    .string()
    .max(50, 'Contact first name is too long')
    .trim()
    .optional(),
  contact_last_name: z
    .string()
    .max(50, 'Contact last name is too long')
    .trim()
    .optional(),
  contact_mobile_number: z
    .string()
    .max(50, 'Contact mobile number is too long')
    .trim()
    .optional(),
  contact_relationship: z
    .string()
    .max(50, 'Contact relationship is too long')
    .trim()
    .optional(),
  indigenous_flag: z.boolean().optional(),
  indigenous_group: z
    .string()
    .max(255, 'Indigenous group is too long')
    .trim()
    .optional(),
  consent_flag: z.boolean().optional(),
});

// ============================================================================
// COMPLETE PATIENT FORM DATA SCHEMA
// ============================================================================
export const patientFormDataSchema = patientPersonalInfoSchema
  .merge(patientContactAddressSchema)
  .merge(patientHealthInfoSchema)
  .merge(patientAdditionalInfoSchema)
  .extend({
    patient_id: z.string().optional(),
  });

// ============================================================================
// COMPLETE PATIENT SCHEMA (including system fields)
// ============================================================================
export const patientSchema = patientFormDataSchema.extend({
  id: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  active: z.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type PatientPersonalInfo = z.infer<typeof patientPersonalInfoSchema>;
export type PatientContactAddress = z.infer<typeof patientContactAddressSchema>;
export type PatientHealthInfo = z.infer<typeof patientHealthInfoSchema>;
export type PatientAdditionalInfo = z.infer<typeof patientAdditionalInfoSchema>;
export type PatientFormDataType = z.infer<typeof patientFormDataSchema>;
export type PatientSchemaType = z.infer<typeof patientSchema>;

// ============================================================================
// STEP 1 SCHEMA (for wizard)
// ============================================================================
export const patientStep1Schema = patientPersonalInfoSchema.pick({
  first_name: true,
  last_name: true,
  middle_name: true,
  suffix_name: true,
  gender: true,
  birthdate: true,
  nationality: true,
  religion: true,
  race: true,
  civil_status: true,
});

export type PatientStep1FormData = z.infer<typeof patientStep1Schema>;

// ============================================================================
// STEP 2 SCHEMA (for wizard)
// ============================================================================
export const patientStep2Schema = patientContactAddressSchema.pick({
  mobile_number: true,
  address_line: true,
  address_city: true,
  address_district: true,
  address_state: true,
  address_country: true,
  address_postal_code: true,
});

export type PatientStep2FormData = z.infer<typeof patientStep2Schema>;

// ============================================================================
// STEP 3 SCHEMA (for wizard)
// ============================================================================
export const patientStep3Schema = patientHealthInfoSchema.pick({
  philhealth_id: true,
  blood_type: true,
  pwd_type: true,
  occupation: true,
  education: true,
});

export type PatientStep3FormData = z.infer<typeof patientStep3Schema>;

// ============================================================================
// STEP 4 SCHEMA (for wizard)
// ============================================================================
export const patientStep4Schema = patientAdditionalInfoSchema.pick({
  contact_first_name: true,
  contact_last_name: true,
  contact_mobile_number: true,
  contact_relationship: true,
  indigenous_flag: true,
  indigenous_group: true,
  consent_flag: true,
});

export type PatientStep4FormData = z.infer<typeof patientStep4Schema>;
