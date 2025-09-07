import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  onPrint: () => void;
  children?: React.ReactNode;
  className?: string;
  printData?: any;
  printType?: 'report' | 'discharge-packet';
}

export const PrintButton: React.FC<PrintButtonProps> = ({ 
  onPrint, 
  children = "Print Report", 
  className = "",
  printData,
  printType = 'report'
}) => {
  const handlePrint = () => {
    if (printType === 'discharge-packet' && printData) {
      // Create discharge packet for individual patient
      const patient = printData;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Discharge Packet - ${patient.patientName}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  color: #000;
                  background: white;
                  line-height: 1.6;
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 3px solid #2563eb;
                  padding-bottom: 20px;
                }
                .section { 
                  margin: 25px 0; 
                  page-break-inside: avoid;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: bold;
                  color: #1e40af;
                  border-bottom: 2px solid #e5e7eb;
                  padding-bottom: 8px;
                  margin-bottom: 15px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin: 15px 0;
                }
                .info-item {
                  padding: 10px;
                  background: #f8fafc;
                  border-left: 4px solid #3b82f6;
                }
                .info-label {
                  font-weight: bold;
                  color: #374151;
                  display: block;
                  margin-bottom: 5px;
                }
                .info-value {
                  color: #1f2937;
                }
                .summary-box {
                  background: #f0f9ff;
                  border: 2px solid #bae6fd;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 15px 0;
                }
                .followup-box {
                  background: ${patient.followUpRequired ? '#fef3c7' : '#d1fae5'};
                  border: 2px solid ${patient.followUpRequired ? '#fbbf24' : '#10b981'};
                  padding: 20px;
                  border-radius: 8px;
                  margin: 15px 0;
                }
                .status-badge {
                  display: inline-block;
                  padding: 8px 16px;
                  background: #10b981;
                  color: white;
                  border-radius: 20px;
                  font-weight: bold;
                  font-size: 14px;
                }
                @media print {
                  body { margin: 0; }
                  .page-break { page-break-before: always; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>DISCHARGE PACKET</h1>
                <h2>WAH4Hospitals Management System</h2>
                <div class="status-badge">PATIENT DISCHARGED</div>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                </p>
              </div>

              <div class="section">
                <div class="section-title">Patient Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Patient Name:</span>
                    <span class="info-value">${patient.patientName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${patient.age} years</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Room:</span>
                    <span class="info-value">${patient.room}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Department:</span>
                    <span class="info-value">${patient.department}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Attending Physician:</span>
                    <span class="info-value">${patient.physician}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Discharge Condition:</span>
                    <span class="info-value">${patient.condition}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Hospital Stay Details</div>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Admission Date:</span>
                    <span class="info-value">${patient.admissionDate}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Discharge Date:</span>
                    <span class="info-value">${patient.dischargeDate}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Final Diagnosis</div>
                <div class="summary-box">
                  <p><strong>Primary Diagnosis:</strong></p>
                  <p>${patient.finalDiagnosis || 'Final diagnosis to be documented by attending physician.'}</p>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Summary of Hospital Stay</div>
                <div class="summary-box">
                  <p>${patient.dischargeSummary || 'The patient was admitted and received appropriate medical care during their hospital stay. Treatment was provided according to medical protocols and the patient responded well to therapy. Discharge planning was coordinated with the healthcare team to ensure continuity of care.'}</p>
                </div>
              </div>

               <div class="section">
                 <div class="section-title">Follow-Up Plan</div>
                 <div class="followup-box">
                   ${patient.followUpPlan ? 
                     `<p><strong>${patient.followUpRequired ? '⚠️ FOLLOW-UP REQUIRED' : '✅ FOLLOW-UP INSTRUCTIONS'}</strong></p>
                      <div style="margin-top: 15px; white-space: pre-line;">${patient.followUpPlan}</div>` :
                     (patient.followUpRequired ? 
                       `<p><strong>⚠️ FOLLOW-UP REQUIRED</strong></p>
                        <p>• Schedule follow-up appointment within 1-2 weeks</p>
                        <p>• Continue prescribed medications as directed</p>
                        <p>• Monitor symptoms and report any concerns</p>
                        <p>• Contact healthcare provider if condition worsens</p>
                        <p>• Return to emergency department if experiencing severe symptoms</p>` :
                       `<p><strong>✅ NO IMMEDIATE FOLLOW-UP REQUIRED</strong></p>
                        <p>• Patient discharged in stable condition</p>
                        <p>• Resume normal activities as tolerated</p>
                        <p>• Follow general health maintenance guidelines</p>
                        <p>• Contact healthcare provider for any new concerns</p>`)
                   }
                 </div>
               </div>

              <div class="section" style="margin-top: 50px; text-align: center; border-top: 2px solid #e5e7eb; padding-top: 20px;">
                <p style="font-size: 12px; color: #666;">
                  This discharge packet was generated by WAH4Hospitals Management System<br/>
                  For questions regarding this discharge, please contact the hospital at your earliest convenience.
                </p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    } else {
      // Create a print-friendly view for regular reports
      const printContent = document.getElementById('printable-content');
      if (printContent) {
        // Clone the content to modify it for printing
        const clonedContent = printContent.cloneNode(true) as HTMLElement;
        
        // Remove elements that shouldn't be printed
        const elementsToRemove = clonedContent.querySelectorAll(
          'button, .no-print, [data-no-print], .print-exclude, .hover\\:bg-'
        );
        elementsToRemove.forEach(el => el.remove());
        
        // Remove action columns from tables
        const actionHeaders = clonedContent.querySelectorAll('th');
        actionHeaders.forEach(header => {
          if (header.textContent?.toLowerCase().includes('action')) {
            const columnIndex = Array.from(header.parentNode?.children || []).indexOf(header);
            header.remove();
            
            // Remove corresponding cells in all rows
            const rows = clonedContent.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const cells = row.children;
              if (cells[columnIndex]) {
                cells[columnIndex].remove();
              }
            });
          }
        });
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Hospital Report</title>
                <style>
                  body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #000;
                    background: white;
                  }
                  .print-header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                  }
                  .print-content { 
                    margin: 0; 
                  }
                  table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0;
                  }
                  th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                  }
                  th { 
                    background-color: #f5f5f5; 
                    font-weight: bold;
                  }
                  .grid {
                    display: grid !important;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                  }
                  .card {
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 5px;
                  }
                  .badge {
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                  }
                  @media print {
                    body { margin: 0; }
                    .no-print, button { display: none !important; }
                    .page-break { page-break-before: always; }
                  }
                  h1, h2, h3 { color: #333; }
                  .text-2xl { font-size: 24px; font-weight: bold; }
                  .text-sm { font-size: 14px; }
                  .font-medium { font-weight: 500; }
                  .font-bold { font-weight: bold; }
                  .text-gray-600 { color: #666; }
                  .text-gray-900 { color: #333; }
                </style>
              </head>
              <body>
                <div class="print-header">
                  <h1>WAH4Hospitals Report</h1>
                  <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                <div class="print-content">
                  ${clonedContent.innerHTML}
                </div>
                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
                  <p>This report was generated by WAH4Hospitals Management System</p>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }
      }
    }
    onPrint();
  };

  return (
    <Button onClick={handlePrint} className={`no-print ${className}`}>
      <Printer className="w-4 h-4 mr-2" />
      {children}
    </Button>
  );
};