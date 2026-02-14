// Laboratory Test Parameters with Reference Ranges
// Based on real clinical laboratory standards

export interface TestParameter {
  parameter_name: string;
  unit: string;
  reference_range: string;
  normalMin?: number;
  normalMax?: number;
}

export const LAB_TEST_PARAMETERS: Record<string, TestParameter[]> = {
  cbc: [
    { parameter_name: 'Hemoglobin', unit: 'g/dL', reference_range: '12-16 (F), 14-18 (M)', normalMin: 12, normalMax: 18 },
    { parameter_name: 'Hematocrit', unit: '%', reference_range: '36-46 (F), 41-53 (M)', normalMin: 36, normalMax: 53 },
    { parameter_name: 'RBC Count', unit: 'x10^6/µL', reference_range: '4.5-5.5 (F), 5.0-6.0 (M)', normalMin: 4.5, normalMax: 6.0 },
    { parameter_name: 'WBC Count', unit: 'x10^3/µL', reference_range: '4.5-11.0', normalMin: 4.5, normalMax: 11.0 },
    { parameter_name: 'Platelet Count', unit: 'x10^3/µL', reference_range: '150-400', normalMin: 150, normalMax: 400 },
    { parameter_name: 'MCV', unit: 'fL', reference_range: '80-100', normalMin: 80, normalMax: 100 },
    { parameter_name: 'MCH', unit: 'pg', reference_range: '27-31', normalMin: 27, normalMax: 31 },
    { parameter_name: 'MCHC', unit: 'g/dL', reference_range: '32-36', normalMin: 32, normalMax: 36 },
  ],
  urinalysis: [
    { parameter_name: 'Color', unit: '', reference_range: 'Light Yellow', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Transparency', unit: '', reference_range: 'Clear', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'pH', unit: '', reference_range: '4.5-8.0', normalMin: 4.5, normalMax: 8.0 },
    { parameter_name: 'Specific Gravity', unit: '', reference_range: '1.005-1.030', normalMin: 1.005, normalMax: 1.030 },
    { parameter_name: 'Protein', unit: '', reference_range: 'Negative', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Glucose', unit: '', reference_range: 'Negative', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Ketones', unit: '', reference_range: 'Negative', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Blood', unit: '', reference_range: 'Negative', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'WBC', unit: '/hpf', reference_range: '0-5', normalMin: 0, normalMax: 5 },
    { parameter_name: 'RBC', unit: '/hpf', reference_range: '0-3', normalMin: 0, normalMax: 3 },
  ],
  fecalysis: [
    { parameter_name: 'Color', unit: '', reference_range: 'Brown', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Consistency', unit: '', reference_range: 'Soft, Formed', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Occult Blood', unit: '', reference_range: 'Negative', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'Ova/Parasites', unit: '', reference_range: 'None Seen', normalMin: undefined, normalMax: undefined },
    { parameter_name: 'WBC', unit: '/hpf', reference_range: '0-3', normalMin: 0, normalMax: 3 },
    { parameter_name: 'RBC', unit: '/hpf', reference_range: '0-2', normalMin: 0, normalMax: 2 },
    { parameter_name: 'Fat Globules', unit: '', reference_range: 'None', normalMin: undefined, normalMax: undefined },
  ],
  blood_chemistry: [
    { parameter_name: 'Fasting Blood Sugar', unit: 'mg/dL', reference_range: '70-110', normalMin: 70, normalMax: 110 },
    { parameter_name: 'Total Cholesterol', unit: 'mg/dL', reference_range: '<200', normalMin: 0, normalMax: 200 },
    { parameter_name: 'Triglycerides', unit: 'mg/dL', reference_range: '<150', normalMin: 0, normalMax: 150 },
    { parameter_name: 'HDL Cholesterol', unit: 'mg/dL', reference_range: '>40 (M), >50 (F)', normalMin: 40, normalMax: 999 },
    { parameter_name: 'LDL Cholesterol', unit: 'mg/dL', reference_range: '<130', normalMin: 0, normalMax: 130 },
    { parameter_name: 'Creatinine', unit: 'mg/dL', reference_range: '0.6-1.2', normalMin: 0.6, normalMax: 1.2 },
    { parameter_name: 'Blood Urea Nitrogen', unit: 'mg/dL', reference_range: '7-20', normalMin: 7, normalMax: 20 },
    { parameter_name: 'Uric Acid', unit: 'mg/dL', reference_range: '3.5-7.2 (M), 2.6-6.0 (F)', normalMin: 2.6, normalMax: 7.2 },
    { parameter_name: 'SGPT (ALT)', unit: 'U/L', reference_range: '7-56', normalMin: 7, normalMax: 56 },
    { parameter_name: 'SGOT (AST)', unit: 'U/L', reference_range: '5-40', normalMin: 5, normalMax: 40 },
  ],
};

/**
 * Automatically calculate interpretation based on result value and reference range
 * @param resultValue - The test result value
 * @param normalMin - Minimum normal value
 * @param normalMax - Maximum normal value
 * @returns 'low' | 'normal' | 'high' | ''
 */
export function calculateInterpretation(
  resultValue: string,
  normalMin?: number,
  normalMax?: number
): 'low' | 'normal' | 'high' | '' {
  // If no reference range provided, cannot calculate
  if (normalMin === undefined || normalMax === undefined) {
    return '';
  }

  // Parse the result value to a number
  const numericValue = parseFloat(resultValue);

  // If result is not a valid number, cannot calculate
  if (isNaN(numericValue)) {
    return '';
  }

  // Compare with reference range
  if (numericValue < normalMin) {
    return 'low';
  } else if (numericValue > normalMax) {
    return 'high';
  } else {
    return 'normal';
  }
}

/**
 * Get predefined parameters for a test type
 */
export function getTestParameters(testType: string): TestParameter[] {
  return LAB_TEST_PARAMETERS[testType] || [];
}
