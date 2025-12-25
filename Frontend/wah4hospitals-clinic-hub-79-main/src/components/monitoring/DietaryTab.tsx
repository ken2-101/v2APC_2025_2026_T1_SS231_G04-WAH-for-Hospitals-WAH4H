import React, { useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { DietaryOrder } from '../../types/monitoring';

interface DietaryTabProps {
  admissionId: string;
  order?: DietaryOrder; // optional, may not exist yet
  onUpdateOrder: (order: DietaryOrder) => void;
}

const API_BASE = '/api/monitoring/dietary-orders/';

export const DietaryTab: React.FC<DietaryTabProps> = ({
  admissionId,
  order,
  onUpdateOrder,
}) => {
  // Initialize with backend defaults if order is undefined
  const [dietType, setDietType] = useState(order?.dietType ?? 'Regular');
  const [activityLevel, setActivityLevel] = useState(
    order?.activityLevel ?? 'As Tolerated'
  );
  const [allergies, setAllergies] = useState(
    order?.allergies?.join(', ') ?? ''
  );
  const [npoResponse, setNpoResponse] = useState(order?.npoResponse ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const payload: DietaryOrder = {
      admissionId,
      dietType,
      activityLevel,
      allergies: allergies
        .split(',')
        .map(a => a.trim())
        .filter(Boolean),
      npoResponse,
      lastUpdated: new Date().toISOString(),
      orderedBy: order?.orderedBy ?? 'Unknown',
      id: order?.id,
    };

    try {
      setSaving(true);

      // Decide POST (new) or PUT (update)
      const res = order?.id
        ? await axios.put(`${API_BASE}${order.id}/`, payload)
        : await axios.post(API_BASE, payload);

      onUpdateOrder(res.data);
    } catch (err) {
      console.error('Failed to save dietary order', err);
      alert('Failed to save dietary order. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Dietary & Activity Orders
          <Badge variant="outline" className="text-xs">
            Admission #{admissionId}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-5">
        {/* Diet Type */}
        <div className="space-y-1">
          <Label>Diet Type</Label>
          <Select value={dietType} onValueChange={setDietType}>
            <SelectTrigger>
              <SelectValue placeholder="Select diet type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Soft">Soft</SelectItem>
              <SelectItem value="Clear Liquids">Clear Liquids</SelectItem>
              <SelectItem value="NPO">NPO</SelectItem>
              <SelectItem value="Diabetic">Diabetic</SelectItem>
              <SelectItem value="Low Salt">Low Salt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Level */}
        <div className="space-y-1">
          <Label>Activity Level</Label>
          <Select value={activityLevel} onValueChange={setActivityLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select activity level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bed Rest">Bed Rest</SelectItem>
              <SelectItem value="Bathroom Privileges">
                Bathroom Privileges
              </SelectItem>
              <SelectItem value="Ambulatory">Ambulatory</SelectItem>
              <SelectItem value="As Tolerated">As Tolerated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Allergies */}
        <div className="space-y-1">
          <Label>Food Allergies</Label>
          <Textarea
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            placeholder="e.g. peanuts, shellfish"
          />
        </div>

        {/* NPO Response */}
        <div className="space-y-1">
          <Label>NPO Response</Label>
          <Select
            value={npoResponse ? 'Yes' : 'No'}
            onValueChange={val => setNpoResponse(val === 'Yes')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select NPO status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Orders'}
        </Button>
      </CardFooter>
    </Card>
  );
};
