// PatientRegistration.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, Download } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { EditPatientModal } from '@/components/patients/EditPatientModal';
import { DeletePatientModal } from '@/components/patients/DeletePatientModal';
import type { Patient, PatientFormData } from '../types/patient';
import axios from 'axios';

// NOTE: Ensure trailing slash for Django
const API_URL = import.meta.env.BACKEND_PATIENTS;

// How long (ms) to wait after the user stops typing before firing the search.
const SEARCH_DEBOUNCE_MS = 350;

export const PatientRegistration: React.FC = () => {
  // The full "baseline" list returned by the server when there is no search.
  const [patients, setPatients] = useState<Patient[]>([]);
  // The list currently shown in the table (baseline or search results).
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);

  // Timer ref for debouncing the search input.
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  // WAH4PC integration state
  const [philHealthId, setPhilHealthId] = useState('');
  const [philHealthIdError, setPhilHealthIdError] = useState('');

  const PHILHEALTH_REGEX = /^\d{2}-\d{9}-\d$/;

  const handlePhilHealthIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    let masked = digits;
    if (digits.length > 11) {
      masked = digits.slice(0, 2) + '-' + digits.slice(2, 11) + '-' + digits.slice(11);
    } else if (digits.length > 2) {
      masked = digits.slice(0, 2) + '-' + digits.slice(2);
    }
    setPhilHealthId(masked);
    setPhilHealthIdError(masked && !PHILHEALTH_REGEX.test(masked) ? 'Format must be XX-XXXXXXXXX-X (e.g. 12-345678901-2)' : '');
  };
  const [targetProvider, setTargetProvider] = useState('');
  const [providers, setProviders] = useState<Array<{id: string; name: string; type: string; isActive: boolean}>>([]);
  const [wah4pcLoading, setWah4pcLoading] = useState(false);

  // Fetch providers from WAH4PC gateway
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await axios.get(`${API_URL}wah4pc/providers/`);
        setProviders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load WAH4PC providers:', err);
        setProviders([]);
      }
    };
    fetchProviders();
  }, []);

  const fetchFromWAH4PC = async () => {
    setWah4pcLoading(true);
    try {
      await axios.post(`${API_URL}wah4pc/fetch`, {
        targetProviderId: targetProvider,
        philHealthId,
      });
      alert('Request sent to WAH4PC. You will receive the data via webhook.');
    } catch (err) {
      console.error('WAH4PC fetch error:', err);
      alert('Failed to send WAH4PC request.');
    } finally {
      setWah4pcLoading(false);
    }
  };

  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    gender: [] as string[],
    department: [] as string[],
    civilStatus: [] as string[],
  });

  // Fetch the baseline patient list (no search term → all active patients).
  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get<Patient[]>(API_URL);
      const data = Array.isArray(res.data) ? res.data : [];
      setPatients(data);
      setFilteredPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setPatients([]);
      setFilteredPatients([]);
    }
  };

  /**
   * Hit the server-side search endpoint and update the table.
   * Called after the debounce delay so we don't fire on every keystroke.
   */
  const runServerSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Empty search → restore the baseline list and apply local filters.
      applyLocalFilters(patients, activeFilters);
      return;
    }

    try {
      const res = await axios.get<Patient[]>(`${API_URL}search/`, {
        params: { q: query, limit: 100 },
      });
      const results = Array.isArray(res.data) ? res.data : [];
      // Apply the dropdown filters on top of the server search results.
      applyLocalFilters(results, activeFilters);
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [patients, activeFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Apply the dropdown filters (status, gender, civil status) to a list.
   * These are always local because they filter a small already-fetched set.
   */
  const applyLocalFilters = (source: Patient[], filters: typeof activeFilters) => {
    let temp = [...source];
    if (filters.status.length) {
      temp = temp.filter(p => {
        const s = p.active ? 'Active' : 'Inactive';
        return filters.status.includes(s);
      });
    }
    if (filters.gender.length) temp = temp.filter(p => filters.gender.includes(p.gender));
    if (filters.civilStatus.length) temp = temp.filter(p => filters.civilStatus.includes(p.civil_status));
    setFilteredPatients(temp);
  };

  // Re-apply filters whenever the dropdown filters change.
  useEffect(() => {
    if (searchQuery.trim()) {
      // Re-run the search so filter changes take effect on search results too.
      runServerSearch(searchQuery);
    } else {
      applyLocalFilters(patients, activeFilters);
    }
  }, [activeFilters, patients]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle the search input change.
   * Debounces the API call so we only fire after the user stops typing.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Cancel any pending debounce timer.
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      runServerSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleRegisterPatient = async (patientData: PatientFormData) => {
    setFormLoading(true);
    setFormError('');
    try {
      await axios.post(API_URL, patientData);
      // Refresh the baseline list so the new patient appears.
      fetchPatients();
    } catch (err: any) {
      console.error('Full Axios error:', err);
      console.error('Error response data:', err.response?.data);
      if (err.response) {
        const messages = typeof err.response.data === 'object'
          ? Object.entries(err.response.data).map(([f, m]) => Array.isArray(m) ? `${f}: ${m.join(', ')}` : `${f}: ${m}`).join('\n')
          : err.response.data;
        setFormError(messages);
      } else {
        setFormError(err.message || 'Failed to register patient');
      }
      // Re-throw error so modal knows to stay open
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => {
      const prevValues = prev[filterType as keyof typeof prev];
      return {
        ...prev,
        [filterType]: prevValues.includes(value) ? prevValues.filter(v => v !== value) : [...prevValues, value],
      };
    });
  };

  const clearFilters = () => setActiveFilters({ status: [], gender: [], department: [], civilStatus: [] });
  const handleViewDetails = (patient: Patient) => { setSelectedPatient(patient); setShowDetailsModal(true); };

  // --------------------------
  // Edit/Delete handlers
  // --------------------------
  const handleEditPatient = (patient: Patient) => setEditPatient(patient);
  const handleDeletePatient = (patient: Patient) => setDeletePatient(patient);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Patients</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between mb-4 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 max-w-sm"
              />
            </div>
            <Button onClick={() => setShowRegistrationModal(true)} className="flex items-center gap-2">
              <UserPlus /> Register Patient
            </Button>
          </div>

          {/* WAH4PC Fetch Section */}
          <div className="flex flex-col md:flex-row gap-2 mb-4 p-3 border rounded-lg bg-gray-50">
            <div className="flex flex-col max-w-xs">
              <Input
                value={philHealthId}
                onChange={handlePhilHealthIdChange}
                placeholder="12-345678901-2"
                maxLength={14}
                inputMode="numeric"
                className={philHealthIdError ? 'border-red-500' : ''}
              />
              {philHealthIdError && (
                <p className="text-red-500 text-xs mt-1">{philHealthIdError}</p>
              )}
            </div>
            <Select value={targetProvider} onValueChange={setTargetProvider}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select Target Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.length === 0 ? (
                  <SelectItem value="loading" disabled>Loading providers...</SelectItem>
                ) : (
                  providers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchFromWAH4PC}
              disabled={wah4pcLoading || !philHealthId || !targetProvider || !!philHealthIdError || !PHILHEALTH_REGEX.test(philHealthId)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {wah4pcLoading ? 'Fetching...' : 'Fetch from WAH4PC'}
            </Button>
          </div>

          <PatientFilters
            activeFilters={activeFilters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            hasActiveFilters={Object.values(activeFilters).flat().length > 0}
          />

          <PatientTable
            patients={filteredPatients}
            handleViewDetails={handleViewDetails}
            handleEdit={handleEditPatient}
            handleDelete={handleDeletePatient}
          />
        </CardContent>
      </Card>

      <PatientRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handleRegisterPatient}
        isLoading={formLoading}
        error={formError}
      />

      {selectedPatient && (
        <PatientDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          patient={selectedPatient}
        />
      )}

      {editPatient && (
        <EditPatientModal
          patient={editPatient}
          isOpen={!!editPatient}
          onClose={() => setEditPatient(null)}
          fetchPatients={fetchPatients}
        />
      )}

      {deletePatient && (
        <DeletePatientModal
          patient={deletePatient}
          isOpen={!!deletePatient}
          onClose={() => setDeletePatient(null)}
          fetchPatients={fetchPatients}
        />
      )}
    </div>
  );
};
