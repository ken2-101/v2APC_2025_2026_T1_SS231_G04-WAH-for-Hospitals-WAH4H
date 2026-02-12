
import api from './api';
import { VitalSign, ClinicalNote, DietaryOrder, HistoryEvent, LabRequest, LabResult } from '../types/monitoring';

// Define the backend Observation interface
interface Observation {
    observation_id?: number;
    identifier?: string;
    subject_id: number;
    encounter_id: number;
    code: string;
    status: string;
    category?: string;
    issued?: string;
    effective_datetime?: string;
    performer_id?: number;

    value_quantity?: number;
    value_string?: string;
    note?: string;

    components?: ObservationComponent[];  // For writing (POST/PUT)
    components_data?: ObservationComponent[];  // For reading (GET)
}

interface ObservationComponent {
    code: string;
    value_quantity?: number;
    value_string?: string;
}

// Map frontend types to standard LOINC codes
const CODES = {
    BP: '85354-9', // Blood Pressure
    BP_SYS: '8480-6',
    BP_DIA: '8462-4',
    HR: '8867-4',  // Heart Rate
    RR: '9279-1',  // Respiratory Rate
    TEMP: '8310-5',// Body Temperature
    O2: '2708-6',  // Oxygen Saturation
    NOTE: '11506-3', // Progress Note
    DIET: 'diet-order' // Custom/Placeholder
};

const MONITORING_BASE_URL = '/api/monitoring'; // Uses router in backend: /api/monitoring/

class MonitoringService {

    /**
     * Get Vitals by querying Observations with category 'vital-signs'
     * Groups them by timestamp to form "VitalSign" rows
     */
    async getVitals(encounterId: number): Promise<VitalSign[]> {
        try {
            const response = await api.get(`${MONITORING_BASE_URL}/observations/`, {
                params: {
                    encounter_id: encounterId,
                    // category: 'vital-signs' // If backend supports filtering by category input
                }
            });

            // Filter client-side if needed, assuming backend returns all observations for encounter
            const observations: Observation[] = response.data.results || response.data;
            const vitalObs = observations.filter(o => o.category === 'vital-signs');

            // Group by effective_datetime to reconstruct rows
            const grouped: Record<string, Partial<VitalSign>> = {};

            vitalObs.forEach(obs => {
                const time = obs.effective_datetime || obs.issued || '';
                if (!grouped[time]) {
                    grouped[time] = {
                        id: obs.observation_id?.toString(),
                        admissionId: encounterId.toString(),
                        dateTime: time,
                        staffName: 'Unknown' // Performer ID resolution not implemented yet
                    };
                }

                const entry = grouped[time];

                // Use components_data from backend response (read-only field)
                if (obs.code === CODES.BP && obs.components_data) {
                    const sys = obs.components_data.find(c => c.code === CODES.BP_SYS)?.value_quantity;
                    const dia = obs.components_data.find(c => c.code === CODES.BP_DIA)?.value_quantity;
                    if (sys && dia) entry.bloodPressure = `${sys}/${dia}`;
                } else if (obs.code === CODES.HR) {
                    entry.heartRate = obs.value_quantity;
                } else if (obs.code === CODES.RR) {
                    entry.respiratoryRate = obs.value_quantity;
                } else if (obs.code === CODES.TEMP) {
                    entry.temperature = obs.value_quantity;
                } else if (obs.code === CODES.O2) {
                    entry.oxygenSaturation = obs.value_quantity;
                }
            });

            return Object.values(grouped) as VitalSign[];
        } catch (error) {
            console.error('Error fetching vitals:', error);
            return [];
        }
    }

    /**
     * Save Vitals by creating multiple Observation records
     */
    async addVital(vital: Omit<VitalSign, 'id'>, subjectId: number): Promise<void> {
        const timestamp = Date.now();
        const common = {
            subject_id: subjectId,
            encounter_id: parseInt(vital.admissionId),
            status: 'final',
            category: 'vital-signs',
            effective_datetime: vital.dateTime,
            issued: new Date().toISOString()
        };

        const promises = [];

        // Blood Pressure (Complex)
        if (vital.bloodPressure && vital.bloodPressure.includes('/')) {
            const [sys, dia] = vital.bloodPressure.split('/');
            promises.push(api.post(`${MONITORING_BASE_URL}/observations/`, {
                ...common,
                identifier: `VITAL-BP-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                code: CODES.BP,
                components: [
                    { code: CODES.BP_SYS, value_quantity: parseFloat(sys) },
                    { code: CODES.BP_DIA, value_quantity: parseFloat(dia) }
                ]
            }));
        }

        // Simple Vitals
        if (vital.heartRate) {
            promises.push(api.post(`${MONITORING_BASE_URL}/observations/`, {
                ...common,
                identifier: `VITAL-HR-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                code: CODES.HR,
                value_quantity: vital.heartRate
            }));
        }
        if (vital.respiratoryRate) {
            promises.push(api.post(`${MONITORING_BASE_URL}/observations/`, {
                ...common,
                identifier: `VITAL-RR-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                code: CODES.RR,
                value_quantity: vital.respiratoryRate
            }));
        }
        if (vital.temperature) {
            promises.push(api.post(`${MONITORING_BASE_URL}/observations/`, {
                ...common,
                identifier: `VITAL-TEMP-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                code: CODES.TEMP,
                value_quantity: vital.temperature
            }));
        }
        if (vital.oxygenSaturation) {
            promises.push(api.post(`${MONITORING_BASE_URL}/observations/`, {
                ...common,
                identifier: `VITAL-O2-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                code: CODES.O2,
                value_quantity: vital.oxygenSaturation
            }));
        }

        await Promise.all(promises);
    }

    /**
     * Get Notes (Mapped from Observations)
     */
    async getNotes(encounterId: number): Promise<ClinicalNote[]> {
        const response = await api.get(`${MONITORING_BASE_URL}/observations/`, {
            params: { encounter_id: encounterId }
        });
        const observations: Observation[] = response.data.results || response.data;
        const noteObs = observations.filter(o => o.category === 'clinical-note');

        return noteObs.map(obs => {
            // Parse stored JSON note or plain text
            let content = { subjective: '', objective: '', assessment: '', plan: '' };
            try {
                if (obs.note && obs.note.startsWith('{')) {
                    content = JSON.parse(obs.note);
                } else {
                    content.assessment = obs.note || '';
                }
            } catch (e) { content.assessment = obs.note || ''; }

            return {
                id: obs.observation_id?.toString() || '',
                admissionId: obs.encounter_id.toString(),
                dateTime: obs.effective_datetime || '',
                type: (obs.value_string as 'SOAP' | 'Progress') || 'SOAP', // Read from value_string
                subjective: content.subjective,
                objective: content.objective,
                assessment: content.assessment,
                plan: content.plan,
                providerName: 'Unknown'
            };
        });
    }

    /**
     * Add Note (Saved as Observation)
     */
    async addNote(note: ClinicalNote, subjectId: number): Promise<void> {
        const noteContent = JSON.stringify({
            subjective: note.subjective,
            objective: note.objective,
            assessment: note.assessment,
            plan: note.plan
        });

        // Generate unique identifier for this observation
        const identifier = `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const payload = {
            identifier, // Required unique field
            subject_id: subjectId,
            encounter_id: parseInt(note.admissionId),
            code: CODES.NOTE,
            status: 'final',
            category: 'clinical-note',
            effective_datetime: note.dateTime,
            value_string: note.type, // Required by backend: Observation must have a value
            note: noteContent
        };

        console.log('Adding clinical note with payload:', payload);

        try {
            await api.post(`${MONITORING_BASE_URL}/observations/`, payload);
        } catch (error: any) {
            console.error('Error adding clinical note:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw new Error(JSON.stringify(error.response?.data) || 'Failed to add clinical note');
        }
    }

    /**
     * Get Dietary (Mapped from Observations)
     */
    async getDietary(encounterId: number): Promise<DietaryOrder | null> {
        const response = await api.get(`${MONITORING_BASE_URL}/observations/`, {
            params: { encounter_id: encounterId }
        });
        const observations: Observation[] = response.data.results || response.data;
        // Find latest diet order
        const dietObs = observations
            .filter(o => o.category === 'dietary')
            .sort((a, b) => new Date(b.effective_datetime || 0).getTime() - new Date(a.effective_datetime || 0).getTime())[0];

        if (!dietObs) return null;

        let details = { dietType: '', allergies: [], npoResponse: false, activityLevel: '' };
        try {
            if (dietObs.note) details = JSON.parse(dietObs.note);
        } catch (e) { }

        return {
            id: dietObs.observation_id?.toString(),
            admissionId: dietObs.encounter_id.toString(),
            dietType: details.dietType || dietObs.value_string || '',
            allergies: details.allergies || [],
            npoResponse: details.npoResponse,
            activityLevel: details.activityLevel,
            orderedBy: 'Unknown',
            lastUpdated: dietObs.effective_datetime || ''
        };
    }

    /**
     * Update/Add Dietary (Saved as Observation)
     */
    async saveDietary(order: DietaryOrder, subjectId: number): Promise<void> {
        const content = JSON.stringify({
            dietType: order.dietType,
            allergies: order.allergies,
            npoResponse: order.npoResponse,
            activityLevel: order.activityLevel
        });

        // Generate unique identifier
        const identifier = `DIET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const payload = {
            identifier, // Required unique field
            subject_id: subjectId,
            encounter_id: parseInt(order.admissionId),
            code: CODES.DIET,
            status: 'final',
            category: 'dietary',
            value_string: order.dietType,
            note: content,
            effective_datetime: new Date().toISOString()
        };

        console.log('Saving dietary order with payload:', payload);

        try {
            await api.post(`${MONITORING_BASE_URL}/observations/`, payload);
        } catch (error: any) {
            console.error('Error saving dietary order:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw new Error(JSON.stringify(error.response?.data) || 'Failed to save dietary order');
        }
    }

    /**
     * Get Laboratory Requests by querying Observations with category 'laboratory'
     */
    async getLaboratoryRequests(encounterId: number): Promise<LabRequest[]> {
        try {
            const response = await api.get(`${MONITORING_BASE_URL}/observations/`, {
                params: {
                    encounter_id: encounterId,
                    category: 'laboratory',
                }
            });

            const observations: Observation[] = response.data.results || response.data;

            return observations.map(obs => {
                let resultContent = undefined;
                if (obs.note) {
                    try {
                        const parsed = JSON.parse(obs.note);
                        if (parsed.resultContent) {
                            resultContent = parsed.resultContent;
                        }
                    } catch (e) {
                        // Not JSON or no resultContent
                    }
                }

                const labRequest: LabRequest = {
                    id: obs.observation_id?.toString() || '',
                    admissionId: encounterId.toString(),
                    testName: obs.value_string || 'Unknown Test',
                    testCode: obs.code,
                    priority: 'routine', // Default, could be stored in observation
                    notes: typeof obs.note === 'string' ? obs.note : '',
                    lifecycleStatus: obs.status as 'ordered' | 'requested' | 'completed',
                    orderedBy: 'Unknown', // Could be retrieved from performer_id
                    orderedAt: obs.effective_datetime || obs.issued || '',
                    resultContent,
                };

                return labRequest;
            });
        } catch (error) {
            console.error('Error fetching laboratory requests:', error);
            return [];
        }
    }

    /**
     * Add a new laboratory request
     */
    async addLaboratoryRequest(request: Omit<LabRequest, 'id'>, subjectId: number): Promise<void> {
        try {
            const timestamp = Date.now();
            const identifier = `LAB-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

            const payload: Observation = {
                identifier,
                subject_id: subjectId,
                encounter_id: parseInt(request.admissionId),
                code: request.testCode,
                status: request.lifecycleStatus,
                category: 'laboratory',
                effective_datetime: request.orderedAt,
                issued: new Date().toISOString(),
                value_string: request.testName,
                note: JSON.stringify({
                    priority: request.priority,
                    notes: request.notes,
                    orderedBy: request.orderedBy,
                }),
            };

            await api.post(`${MONITORING_BASE_URL}/observations/`, payload);
        } catch (error) {
            console.error('Error adding laboratory request:', error);
            throw error;
        }
    }

    /**
     * Update laboratory request with results
     */
    async updateLabResult(requestId: number, result: LabResult): Promise<void> {
        try {
            // Fetch the existing observation
            const response = await api.get(`${MONITORING_BASE_URL}/observations/${requestId}/`);
            const observation: Observation = response.data;

            // Parse existing note to preserve priority and notes
            let existingData: any = {};
            if (observation.note) {
                try {
                    existingData = JSON.parse(observation.note);
                } catch (e) {
                    existingData = { notes: observation.note };
                }
            }

            // Update with result content
            const updatedNote = {
                ...existingData,
                resultContent: result,
            };

            // Update the observation
            const payload = {
                ...observation,
                status: 'completed',
                note: JSON.stringify(updatedNote),
            };

            await api.put(`${MONITORING_BASE_URL}/observations/${requestId}/`, payload);
        } catch (error) {
            console.error('Error updating lab result:', error);
            throw error;
        }
    }
    /**
     * Update laboratory request status
     */
    async updateLabRequestStatus(requestId: string, status: 'ordered' | 'requested'): Promise<void> {
        try {
            // 1. Get existing observation
            const response = await api.get(`${MONITORING_BASE_URL}/observations/${requestId}/`);
            const observation: Observation = response.data;

            // 2. Update status
            const payload = {
                ...observation,
                status: status
            };

            // 3. Save
            await api.put(`${MONITORING_BASE_URL}/observations/${requestId}/`, payload);
        } catch (error) {
            console.error('Error updating lab request status:', error);
            throw error;
        }
    }
}

export default new MonitoringService();
