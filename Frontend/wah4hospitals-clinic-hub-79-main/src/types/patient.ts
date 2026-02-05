export type Patient = {
  /** Django primary key */
  id: number;
  
  /** Hospital-generated ID */
  patient_id?: string;

  /** Name */
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix_name?: string;
  full_name?: string;

  /** Demographics */
  gender: 'M' | 'F';
  birthdate: string; // YYYY-MM-DD
  age?: number;
  civil_status?: string;
  nationality?: string;
  religion?: string;

  /** Health Identifiers */
  philhealth_id?: string;
  blood_type?: string;
  pwd_type?: string;

  /** Socio-economic */
  occupation?: string;
  education?: string;
  indigenous_flag?: boolean;
  indigenous_group?: string;

  /** Contact */
  mobile_number: string;
  
  /** Address */
  address_line?: string;
  address_city?: string;
  address_district?: string;
  address_state?: string;
  address_country?: string;
  address_postal_code?: string;
  full_address?: string;

  /** Emergency Contact */
  contact_first_name?: string;
  contact_last_name?: string;
  contact_mobile_number?: string;
  contact_relationship?: string;

  /** System */
  status?: string;
  consent_flag?: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type PatientFormData = {
  // Optional for creation, required for updates (sometimes handled separately)
  patient_id?: string; 
  
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix_name?: string;

  gender: 'M' | 'F';
  birthdate: string;
  
  civil_status?: string;
  nationality?: string;
  religion?: string;

  philhealth_id?: string;
  blood_type?: string;
  pwd_type?: string;

  occupation?: string;
  education?: string;

  mobile_number: string;

  address_line?: string;
  address_city?: string;
  address_district?: string;
  address_state?: string;
  address_country?: string;
  address_postal_code?: string;
  
  contact_first_name?: string;
  contact_last_name?: string;
  contact_mobile_number?: string;
  contact_relationship?: string;

  indigenous_flag?: boolean;
  indigenous_group?: string;
  
  consent_flag?: boolean;
};

// ============================================================================
// CONDITIONS
// ============================================================================

export interface Condition {
  condition_id: number;
  identifier?: string;
  clinical_status?: string;
  verification_status?: string;
  category?: string;
  severity?: string;
  code?: string;
  patient_id?: number;
  patient_identifier?: string;
  encounter_id?: number;
  body_site?: string;
  onset_datetime?: string;
  recorded_date?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// ALLERGIES
// ============================================================================

export interface Allergy {
  allergy_id: number;
  identifier?: string;
  clinical_status?: string;
  verification_status?: string;
  type?: string;
  category?: string;
  criticality?: string;
  code?: string;
  patient_id?: number;
  patient_identifier?: string;
  encounter_id?: number;
  reaction_description?: string;
  reaction_severity?: string;
  note?: string;
  onset_datetime?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// IMMUNIZATIONS
// ============================================================================

export interface Immunization {
  immunization_id: number;
  identifier?: string;
  status: string;
  vaccine_code?: string;
  vaccine_display?: string;
  patient_id?: number;
  patient_identifier?: string;
  encounter_id?: number;
  occurrence_datetime?: string;
  lot_number?: string;
  dose_quantity_value?: string;
  dose_quantity_unit?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}
