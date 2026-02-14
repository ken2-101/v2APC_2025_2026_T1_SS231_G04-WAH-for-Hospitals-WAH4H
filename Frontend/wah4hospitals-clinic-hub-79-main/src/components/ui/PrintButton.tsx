import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
// We retain discharge packet logic for now as it's not yet migrated to backend
import { generateDischargePacketHtml } from '@/utils/printTemplates';

interface PrintButtonProps {
  onPrint?: () => void;
  children?: React.ReactNode;
  className?: string;
  printData?: any;
  printType?: 'report' | 'discharge-packet' | 'lab-result';
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  onPrint,
  children = "Print Report",
  className = "",
  printData,
  printType = 'report'
}) => {
  const handlePrint = () => {
    if (printType === 'lab-result' && printData?.id) {
      // Open Backend PDF URL in new tab
      // NOTE: Ensure your backend URL is correct. Assuming /api/laboratory/reports/{id}/pdf/
      // If the backend is on a different port (e.g., 8000), you might need the full URL or a proxy.
      // For now, we use a relative path assuming proxy or same origin.
      const pdfUrl = `http://localhost:8000/api/laboratory/reports/${printData.id}/pdf/`;
      window.open(pdfUrl, '_blank');
    } else if (printType === 'discharge-packet' && printData) {
      // Legacy HTML string method (for now)
      const htmlContent = generateDischargePacketHtml(printData);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } else {
      // Regular window print
      window.print();
    }

    if (onPrint) onPrint();
  };

  return (
    <Button onClick={handlePrint} className={`no-print ${className}`}>
      <Printer className="w-4 h-4 mr-2" />
      {children}
    </Button>
  );
};