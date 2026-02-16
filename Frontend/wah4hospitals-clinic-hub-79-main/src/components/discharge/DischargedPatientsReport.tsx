import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PrintButton } from '@/components/ui/PrintButton';
import { DischargeStatusBadge } from './DischargeStatusBadge';
import { Search, Calendar, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import type { DischargedPatient } from '@/types/discharge';

interface DischargedPatientsReportProps {
  dischargedPatients: DischargedPatient[];
}

export const DischargedPatientsReport: React.FC<DischargedPatientsReportProps> = ({
  dischargedPatients
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState('all'); // all, yes, no

  const handlePrintPatientPacket = (patient: DischargedPatient) => {
    console.log(`Printing discharge packet for ${patient.patientName}...`);
  };

  const filteredPatients = dischargedPatients.filter(patient => {
    // Text search
    const matchesSearch = 
      patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.physician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.department.toLowerCase().includes(searchTerm.toLowerCase());

    // Date filtering
    let matchesDate = true;
    const dischargeDate = new Date(patient.dischargeDate);
    
    if (startDate) {
      matchesDate = matchesDate && dischargeDate >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && dischargeDate <= new Date(endDate);
    }
    if (filterYear) {
      matchesDate = matchesDate && dischargeDate.getFullYear().toString() === filterYear;
    }
    if (filterMonth) {
      // Month is 0-indexed in JS Date, but input might be 1-12 or 0-11. 
      // Let's assume input is 1-12 string.
      matchesDate = matchesDate && (dischargeDate.getMonth() + 1).toString() === filterMonth;
    }

    // Follow-up filtering
    let matchesFollowUp = true;
    if (followUpFilter === 'yes') matchesFollowUp = patient.followUpRequired;
    if (followUpFilter === 'no') matchesFollowUp = !patient.followUpRequired;

    return matchesSearch && matchesDate && matchesFollowUp;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setFilterYear('');
    setFilterMonth('');
    setFollowUpFilter('all');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Discharged Patients Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Patients who have been fully discharged - Print access available
              </p>
            </div>
            
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search discharged patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Year</label>
                <select 
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {Array.from(new Set(dischargedPatients.map(p => new Date(p.dischargeDate).getFullYear()))).sort().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium">Month</label>
                <select 
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{new Date(2000, month-1, 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">From Date</label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">To Date</label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Follow-up</label>
                <select 
                  className="w-full p-2 border rounded-md text-sm bg-background"
                  value={followUpFilter}
                  onChange={(e) => setFollowUpFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="yes">Required</option>
                  <option value="no">Not Required</option>
                </select>
              </div>
            </div>
          </div>

          <div id="printable-content" className="space-y-4">
            {/* Summary removed as requested */}

            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50/30 gap-4"
                >
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-2 gap-2">
                      <h3 className="font-semibold text-lg">{patient.patientName}</h3>
                      <DischargeStatusBadge status="discharged" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Room:</span> {patient.room}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Condition:</span> {patient.condition}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Department:</span> {patient.department}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Physician:</span> {patient.physician}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Admitted:</span> {patient.admissionDate}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Discharged:</span> {patient.dischargeDate}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Age:</span> {patient.age}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Follow-up:</span> 
                        <span className={patient.followUpRequired ? 'text-yellow-600' : 'text-green-600'}>
                          {patient.followUpRequired ? ' Required' : ' Not Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-auto mt-2 lg:mt-0 lg:ml-4 no-print flex justify-end">
                    <PrintButton
                      onPrint={() => handlePrintPatientPacket(patient)}
                      className="bg-primary hover:bg-primary/90 w-full lg:w-auto"
                      printData={patient}
                      printType="discharge-packet"
                    >
                      Print Discharge Packet
                    </PrintButton>
                  </div>
                </div>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 
                  'No discharged patients found matching your search.' :
                  'No patients have been discharged yet.'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};