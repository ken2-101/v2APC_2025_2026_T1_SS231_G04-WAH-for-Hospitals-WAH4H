import axios from 'axios';
import { Patient, BillingRecord, MedicineItem, DiagnosticItem } from './types';
import { BillingRecord as APIBillingRecord } from '@/services/billingService';

// --- API Fetchers ---

export const fetchPharmacyCharges = async (admissionId: number): Promise<MedicineItem[]> => {
    try {
        const API_BASE =
            import.meta.env.BACKEND_PHARMACY_8000 ||
            (import.meta.env.LOCAL_8000 ? `${import.meta.env.LOCAL_8000}/api/pharmacy` : import.meta.env.BACKEND_PHARMACY);
        const response = await axios.get(`${API_BASE}/medication-requests/?admission=${admissionId}&status=dispensed`);

        const pharmacyItems: MedicineItem[] = response.data.map((item: any, index: number) => ({
            id: Date.now() + index,
            name: item.medication_name || item.item_name,
            dosage: item.dosage || item.strength || 'N/A',
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unit_price || item.price || '0')
        }));

        return pharmacyItems;
    } catch (err) {
        console.error('Error fetching pharmacy charges:', err);
        return [];
    }
};

export const fetchLaboratoryCharges = async (admissionId: number): Promise<DiagnosticItem[]> => {
    try {
        const API_BASE =
            import.meta.env.BACKEND_LABORATORY_8000 ||
            (import.meta.env.LOCAL_8000 ? `${import.meta.env.LOCAL_8000}/api/laboratory` : import.meta.env.BACKEND_LABORATORY);
        const response = await axios.get(`${API_BASE}/requests/?admission=${admissionId}&status=completed`);

        const labItems: DiagnosticItem[] = response.data.results ?
            response.data.results.map((item: any, index: number) => ({
                id: Date.now() + index + 1000,
                name: item.test_type || item.test_name || 'Lab Test',
                cost: parseFloat(item.cost || item.price || '0')
            })) :
            response.data.map((item: any, index: number) => ({
                id: Date.now() + index + 1000,
                name: item.test_type || item.test_name || 'Lab Test',
                cost: parseFloat(item.cost || item.price || '0')
            }));

        return labItems;
    } catch (err) {
        console.error('Error fetching laboratory charges:', err);
        return [];
    }
};

// --- Data Converters ---

export const convertAPIToLocal = (api: APIBillingRecord): BillingRecord => {
    return {
        id: api.id!,
        patientId: api.patient || 0,
        isFinalized: api.is_finalized,
        finalizedDate: api.finalized_date || undefined,
        patientName: api.patient_name,
        hospitalId: api.hospital_id,
        admissionDate: api.admission_date,
        dischargeDate: api.discharge_date,
        roomWard: api.room_ward,
        roomType: api.room_type,
        numberOfDays: api.number_of_days,
        ratePerDay: Number(api.rate_per_day),
        attendingPhysicianFee: Number(api.attending_physician_fee),
        specialistFee: Number(api.specialist_fee),
        surgeonFee: Number(api.surgeon_fee),
        otherProfessionalFees: Number(api.other_professional_fees),
        medicines: api.medicines.map(m => ({
            id: m.id!,
            name: m.name,
            dosage: m.dosage,
            quantity: m.quantity,
            // Check both camelCase (from serializer) and snake_case (potential legacy)
            unitPrice: Number((m as any).unitPrice || (m as any).unit_price)
        })),
        dietType: api.diet_type,
        mealsPerDay: api.meals_per_day,
        dietDuration: api.diet_duration,
        costPerMeal: Number(api.cost_per_meal),
        diagnostics: api.diagnostics.map(d => ({
            id: d.id!,
            name: d.name,
            cost: Number(d.cost)
        })),
        suppliesCharge: Number(api.supplies_charge),
        procedureCharge: Number(api.procedure_charge),
        nursingCharge: Number(api.nursing_charge),
        miscellaneousCharge: Number(api.miscellaneous_charge),
        discount: Number(api.discount),
        philhealthCoverage: Number(api.philhealth_coverage),
        paymentStatus: api.payment_status,
        payments: api.payments
    };
};

export const convertLocalToAPI = (local: Partial<BillingRecord>, selectedDiscount: string | null): Partial<APIBillingRecord> => {
    // Helper function to format date as YYYY-MM-DD
    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        // If already in correct format (YYYY-MM-DD), return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // Otherwise, parse and format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isSenior = selectedDiscount === 'senior';
    const isPWD = selectedDiscount === 'pwd';
    const isPhilHealthMember = selectedDiscount === 'philhealth';

    return {
        patient: local.patientId,
        patient_name: local.patientName || '',
        hospital_id: local.hospitalId || '',
        admission_date: formatDate(local.admissionDate),
        discharge_date: formatDate(local.dischargeDate),
        room_ward: local.roomWard || '',
        room_type: local.roomType || '',
        number_of_days: local.numberOfDays || 0,
        rate_per_day: (local.ratePerDay || 0).toString(),
        attending_physician_fee: (local.attendingPhysicianFee || 0).toString(),
        specialist_fee: (local.specialistFee || 0).toString(),
        surgeon_fee: (local.surgeonFee || 0).toString(),
        other_professional_fees: (local.otherProfessionalFees || 0).toString(),
        diet_type: local.dietType || '',
        meals_per_day: local.mealsPerDay || 0,
        diet_duration: local.dietDuration || 0,
        cost_per_meal: (local.costPerMeal || 0).toString(),
        supplies_charge: (local.suppliesCharge || 0).toString(),
        procedure_charge: (local.procedureCharge || 0).toString(),
        nursing_charge: (local.nursingCharge || 0).toString(),
        miscellaneous_charge: (local.miscellaneousCharge || 0).toString(),
        discount: (local.discount || 0).toString(),
        philhealth_coverage: (local.philhealthCoverage || 0).toString(),
        is_senior: isSenior,
        is_pwd: isPWD,
        is_philhealth_member: isPhilHealthMember,
        medicines: local.medicines?.map(m => ({
            name: m.name,
            dosage: m.dosage,
            quantity: m.quantity,
            unitPrice: m.unitPrice.toString() // Backend expects unitPrice
        })) || [],
        diagnostics: local.diagnostics?.map(d => ({
            name: d.name,
            cost: d.cost.toString()
        })) || []
    };
};
