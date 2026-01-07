import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  FileText,
  Pill,
  FlaskConical,
  Stethoscope,
  Bed,
  Clock,
} from 'lucide-react';
import { HistoryEvent } from '../../types/monitoring';

interface HistoryTabProps {
  events: HistoryEvent[];
}

/** Safe date parser + formatter */
const formatDateTime = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const HistoryTab: React.FC<HistoryTabProps> = ({ events }) => {
  /** Sort safely */
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const da = new Date(a.dateTime ?? '').getTime();
      const db = new Date(b.dateTime ?? '').getTime();
      return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
    });
  }, [events]);

  const getIcon = (category: HistoryEvent['category']) => {
    switch (category) {
      case 'Vitals':
        return <Activity className="w-5 h-5 text-blue-500" />;
      case 'Note':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'Medication':
        return <Pill className="w-5 h-5 text-green-500" />;
      case 'Lab':
        return <FlaskConical className="w-5 h-5 text-purple-500" />;
      case 'Procedure':
        return <Stethoscope className="w-5 h-5 text-red-500" />;
      case 'Admission':
        return <Bed className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient History & Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No history recorded.
            </div>
          ) : (
            <div className="relative border-l ml-6 pl-6 space-y-8 py-2">
              {sortedEvents.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-10 bg-white border rounded-full p-2 shadow-sm">
                    {getIcon(event.category)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {event.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(event.dateTime)}
                      </span>
                    </div>

                    <h4 className="text-md font-medium">
                      {event.description}
                    </h4>

                    {event.details && (
                      <p className="text-sm text-gray-600 mt-1">
                        {event.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
