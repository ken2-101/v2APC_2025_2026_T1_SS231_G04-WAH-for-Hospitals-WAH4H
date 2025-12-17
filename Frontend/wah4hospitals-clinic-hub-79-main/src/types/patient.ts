export type Patient = {
  /** Django primary key */
  id: number;

  /** Hospital-generated ID (e.g. P0001) */
  patient_id: string;

  philhealth_id?: string;
  national_id?: string;

  last_name: string;
  first_name: string;
  middle_name?: string;
  suffix?: string;

  sex: 'M' | 'F';
  date_of_birth: string;
  civil_status: string;
  nationality: string;

  mobile_number: string;
  telephone?: string;
  email?: string;

  region: string;
  province: string;
  city_municipality: string;
  barangay: string;
  house_no_street?: string;

  occupation?: string;

  /** Patient lifecycle status (Active / Inactive / Deceased) */
  status: string;

  created_at?: string;
  updated_at?: string;
};

export type PatientFormData = {
  philhealth_id?: string;
  national_id?: string;

  last_name: string;
  first_name: string;
  middle_name?: string;
  suffix?: string;

  sex: 'M' | 'F';
  date_of_birth: string;
  civil_status: string;
  nationality: string;

  mobile_number: string;
  telephone?: string;
  email?: string;

  region: string;
  province: string;
  city_municipality: string;
  barangay: string;
  house_no_street?: string;

  occupation?: string;

  status: string;
};
