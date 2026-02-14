// Laboratory Test Parameter Configurations
// This file defines all test parameters, reference ranges, and metadata for laboratory forms

export interface LabParameterConfig {
    name: string;
    label: string;
    unit: string;
    refLow: number;
    refHigh: number;
    step: string;
    placeholder: string;
    formKey: string; // Key in the result form state
}

export interface LabPanelConfig {
    id: string;
    title: string;
    color: string; // Tailwind color class prefix (e.g., 'purple', 'blue', 'green')
    parameters: LabParameterConfig[];
}

// ==========================================
// HEMATOLOGY
// ==========================================

// Complete Blood Count (CBC) Panel
const cbcPanel: LabPanelConfig = {
    id: 'cbc',
    title: 'Complete Blood Count (CBC)',
    color: 'purple',
    parameters: [
        { name: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', refLow: 12.0, refHigh: 16.0, step: '0.1', placeholder: '14.2', formKey: 'hemoglobin' },
        { name: 'hematocrit', label: 'Hematocrit', unit: '%', refLow: 37, refHigh: 47, step: '0.1', placeholder: '42', formKey: 'hematocrit' },
        { name: 'rbc', label: 'RBC Count', unit: 'x10^12/L', refLow: 4.2, refHigh: 5.9, step: '0.01', placeholder: '4.8', formKey: 'rbc' },
        { name: 'wbc', label: 'WBC Count', unit: 'x10^9/L', refLow: 4.0, refHigh: 11.0, step: '0.1', placeholder: '7.5', formKey: 'wbc' },
        // Differential Count mixed in for simplicity, or separate if needed
        { name: 'neutrophils', label: 'Neutrophils', unit: '%', refLow: 40, refHigh: 70, step: '0.1', placeholder: '60', formKey: 'neutrophils' },
        { name: 'lymphocytes', label: 'Lymphocytes', unit: '%', refLow: 20, refHigh: 40, step: '0.1', placeholder: '30', formKey: 'lymphocytes' },
        { name: 'monocytes', label: 'Monocytes', unit: '%', refLow: 2, refHigh: 8, step: '0.1', placeholder: '6', formKey: 'monocytes' },
        { name: 'eosinophils', label: 'Eosinophils', unit: '%', refLow: 1, refHigh: 4, step: '0.1', placeholder: '3', formKey: 'eosinophils' },
        { name: 'basophils', label: 'Basophils', unit: '%', refLow: 0, refHigh: 1, step: '0.1', placeholder: '0', formKey: 'basophils' },
        { name: 'platelets', label: 'Platelet Count', unit: 'x10^9/L', refLow: 150, refHigh: 400, step: '1', placeholder: '280', formKey: 'platelets' },
    ]
};

const plateletPanel: LabPanelConfig = {
    id: 'platelet_count',
    title: 'Platelet Count',
    color: 'purple',
    parameters: [
        { name: 'platelets', label: 'Platelet Count', unit: 'x10^9/L', refLow: 150, refHigh: 400, step: '1', placeholder: '250', formKey: 'platelets' }
    ]
};

const bloodTypingPanel: LabPanelConfig = {
    id: 'blood_typing',
    title: 'Blood Typing',
    color: 'red',
    parameters: [
        { name: 'blood_type', label: 'Blood Group (ABO)', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'A, B, AB, O', formKey: 'blood_type' },
        { name: 'rh_factor', label: 'Rh Factor', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Positive (+)', formKey: 'rh_factor' }
    ]
};

const coagPanel: LabPanelConfig = {
    id: 'coagulation',
    title: 'Coagulation Studies',
    color: 'red',
    parameters: [
        { name: 'clotting_time', label: 'Clotting Time', unit: 'min', refLow: 4, refHigh: 10, step: '0.1', placeholder: '5-8', formKey: 'clotting_time' },
        { name: 'bleeding_time', label: 'Bleeding Time', unit: 'min', refLow: 2, refHigh: 7, step: '0.1', placeholder: '3-5', formKey: 'bleeding_time' }
    ]
};

// ==========================================
// CLINICAL MICROSCOPY
// ==========================================

const urinalysisPanel: LabPanelConfig = {
    id: 'urinalysis',
    title: 'Urinalysis',
    color: 'yellow',
    parameters: [
        // Macroscopic
        { name: 'color', label: 'Color', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Straw/Yellow', formKey: 'color' },
        { name: 'transparency', label: 'Transparency', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Clear', formKey: 'transparency' },
        { name: 'ph', label: 'pH', unit: '', refLow: 5.0, refHigh: 8.0, step: '0.5', placeholder: '6.0', formKey: 'ph' },
        { name: 'sp_gravity', label: 'Specific Gravity', unit: '', refLow: 1.005, refHigh: 1.030, step: '0.005', placeholder: '1.015', formKey: 'sp_gravity' },
        // Chemical
        { name: 'sugar', label: 'Sugar', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'sugar' },
        { name: 'protein', label: 'Protein', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'protein' },
        // Microscopic
        { name: 'rbc_urine', label: 'RBC', unit: '/hpf', refLow: 0, refHigh: 2, step: '1', placeholder: '0-2', formKey: 'rbc_urine' },
        { name: 'pus_cells', label: 'Pus Cells', unit: '/hpf', refLow: 0, refHigh: 2, step: '1', placeholder: '0-2', formKey: 'pus_cells' },
        { name: 'epithelial_cells', label: 'Epithelial Cells', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Few', formKey: 'epithelial_cells' },
        { name: 'bacteria', label: 'Bacteria', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'None', formKey: 'bacteria' },
        { name: 'crystals', label: 'Crystals', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'None', formKey: 'crystals' },
        { name: 'amorphous', label: 'Amorphous', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'None', formKey: 'amorphous' },
        { name: 'casts', label: 'Casts', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'None', formKey: 'casts' },
    ]
};

const fecalysisPanel: LabPanelConfig = {
    id: 'fecalysis',
    title: 'Fecalysis',
    color: 'brown',
    parameters: [
        { name: 'color_stool', label: 'Color', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Brown', formKey: 'color_stool' },
        { name: 'consistency', label: 'Consistency', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Formed/Soft', formKey: 'consistency' },
        { name: 'rbc_stool', label: 'RBC', unit: '/hpf', refLow: 0, refHigh: 0, step: '', placeholder: 'None', formKey: 'rbc_stool' },
        { name: 'pus_cells_stool', label: 'Pus Cells', unit: '/hpf', refLow: 0, refHigh: 0, step: '', placeholder: 'None', formKey: 'pus_cells_stool' },
        { name: 'ova_parasites', label: 'Ova/Parasites', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'No Ova or Parasite seen', formKey: 'ova_parasites' },
    ]
};

const pregnancyPanel: LabPanelConfig = {
    id: 'pregnancy_test',
    title: 'Pregnancy Test (Urine)',
    color: 'pink',
    parameters: [
        { name: 'pt_result', label: 'Result', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative/Positive', formKey: 'pt_result' }
    ]
};

// ==========================================
// BLOOD CHEMISTRY
// ==========================================

const glucosePanel: LabPanelConfig = {
    id: 'glucose_panel',
    title: 'Blood Glucose',
    color: 'green',
    parameters: [
        { name: 'fbs', label: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', refLow: 70, refHigh: 100, step: '1', placeholder: '90', formKey: 'fbs' },
        { name: 'rbs', label: 'Random Blood Sugar (RBS)', unit: 'mg/dL', refLow: 70, refHigh: 140, step: '1', placeholder: '110', formKey: 'rbs' }
    ]
};

// Lipid Panel (Updated)
const lipidPanel: LabPanelConfig = {
    id: 'lipid_profile',
    title: 'Lipid Profile',
    color: 'amber',
    parameters: [
        { name: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 200, step: '1', placeholder: '180', formKey: 'total_cholesterol' },
        { name: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', refLow: 0, refHigh: 150, step: '1', placeholder: '110', formKey: 'triglycerides' },
        { name: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', refLow: 40, refHigh: 999, step: '1', placeholder: '50', formKey: 'hdl' },
        { name: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 100, step: '1', placeholder: '90', formKey: 'ldl' },
    ]
};

const kidneyPanel: LabPanelConfig = {
    id: 'kidney_func',
    title: 'Kidney Function',
    color: 'green',
    parameters: [
        { name: 'creatinine', label: 'Creatinine', unit: 'mg/dL', refLow: 0.6, refHigh: 1.2, step: '0.01', placeholder: '0.9', formKey: 'creatinine' },
        { name: 'bun', label: 'BUN', unit: 'mg/dL', refLow: 7, refHigh: 20, step: '0.1', placeholder: '14', formKey: 'bun' },
        { name: 'bua', label: 'Blood Uric Acid', unit: 'mg/dL', refLow: 3.5, refHigh: 7.2, step: '0.1', placeholder: '5.5', formKey: 'bua' }
    ]
};

const liverPanel: LabPanelConfig = {
    id: 'liver_func',
    title: 'Liver Function',
    color: 'green',
    parameters: [
        { name: 'sgpt', label: 'SGPT / ALT', unit: 'U/L', refLow: 0, refHigh: 41, step: '1', placeholder: '25', formKey: 'sgpt' },
        { name: 'sgot', label: 'SGOT / AST', unit: 'U/L', refLow: 0, refHigh: 40, step: '1', placeholder: '22', formKey: 'sgot' }
    ]
};

const electrolytesPanel: LabPanelConfig = {
    id: 'electrolytes',
    title: 'Electrolytes',
    color: 'green',
    parameters: [
        { name: 'sodium', label: 'Sodium (Na)', unit: 'mmol/L', refLow: 135, refHigh: 145, step: '1', placeholder: '140', formKey: 'sodium' },
        { name: 'potassium', label: 'Potassium (K)', unit: 'mmol/L', refLow: 3.5, refHigh: 5.0, step: '0.1', placeholder: '4.0', formKey: 'potassium' },
        { name: 'chloride', label: 'Chloride (Cl)', unit: 'mmol/L', refLow: 98, refHigh: 107, step: '1', placeholder: '102', formKey: 'chloride' }
    ]
};

// ==========================================
// SEROLOGY & IMMUNOLOGY
// ==========================================

const serologyPanel: LabPanelConfig = {
    id: 'serology',
    title: 'Serology / Immunology',
    color: 'orange',
    parameters: [
        { name: 'hbsag', label: 'HBsAg', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Non-reactive', formKey: 'hbsag' },
        { name: 'syphilis', label: 'Syphilis (RPR/VDRL)', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Non-reactive', formKey: 'syphilis' },
        { name: 'typhoid', label: 'Typhoid Test', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'typhoid' }
    ]
};

const denguePanel: LabPanelConfig = {
    id: 'dengue',
    title: 'Dengue Duo Test',
    color: 'orange',
    parameters: [
        { name: 'ns1', label: 'NS1 Antigen', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'ns1' },
        { name: 'igg', label: 'IgG', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'igg' },
        { name: 'igm', label: 'IgM', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'igm' }
    ]
};

// ==========================================
// MICROBIOLOGY
// ==========================================

const microbioPanel: LabPanelConfig = {
    id: 'microbiology',
    title: 'Microbiology',
    color: 'indigo',
    parameters: [
        { name: 'gram_stain', label: 'Gram Stain', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'No organisms seen', formKey: 'gram_stain' },
        { name: 'afb_stain', label: 'AFB Stain', unit: '', refLow: 0, refHigh: 0, step: '', placeholder: 'Negative', formKey: 'afb_stain' }
    ]
};

// Legacy CMP Panel (Kept for compatibility if needed, or remove)
const cmpPanel: LabPanelConfig = {
    id: 'cmp',
    title: 'Comprehensive Metabolic Panel',
    color: 'green',
    parameters: [
        // Copied essentials from kidney/liver/electploytes if needed, or just rely on modular panels
        { name: 'glucose_cmp', label: 'Glucose', unit: 'mg/dL', refLow: 70, refHigh: 100, step: '1', placeholder: '90', formKey: 'glucose_cmp' }
    ]
};

// Export all panels
export const labPanels = {
    // Hematology
    cbc: cbcPanel,
    platelet_count: plateletPanel,
    blood_typing: bloodTypingPanel,
    coagulation: coagPanel,
    // Microscopy
    urinalysis: urinalysisPanel,
    fecalysis: fecalysisPanel,
    pregnancy_test: pregnancyPanel,
    // Chemistry
    glucose: glucosePanel,
    lipid: lipidPanel,
    kidney: kidneyPanel,
    liver: liverPanel,
    electrolytes: electrolytesPanel,
    // Serology
    serology: serologyPanel,
    dengue: denguePanel,
    // Micro
    microbiology: microbioPanel,
    // Legacy
    cmp: cmpPanel
};

// Export as array for iteration
export const labPanelsArray = [
    // Hematology
    cbcPanel, plateletPanel, bloodTypingPanel, coagPanel,
    // Microscopy
    urinalysisPanel, fecalysisPanel, pregnancyPanel,
    // Chemistry
    glucosePanel, lipidPanel, kidneyPanel, liverPanel, electrolytesPanel,
    // Serology
    serologyPanel, denguePanel,
    // Micro
    microbioPanel,
    // Legacy
    cmpPanel
];
