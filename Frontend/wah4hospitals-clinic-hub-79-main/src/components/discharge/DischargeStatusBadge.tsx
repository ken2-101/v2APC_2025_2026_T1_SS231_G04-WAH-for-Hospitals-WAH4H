import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DischargeStatusBadgeProps {
  status: 'pending' | 'ready' | 'discharged';
  className?: string;
}

export const DischargeStatusBadge: React.FC<DischargeStatusBadgeProps> = ({ 
  status, 
  className = "" 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending Clearance',
          className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
        };
      case 'ready':
        return {
          icon: AlertCircle,
          text: 'Ready for Discharge',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
        };
      case 'discharged':
        return {
          icon: CheckCircle,
          text: 'Discharged',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className} flex items-center gap-1 font-medium`}
    >
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  );
};