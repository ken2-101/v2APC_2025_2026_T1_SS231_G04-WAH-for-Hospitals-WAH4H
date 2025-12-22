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
  order: DietaryOrder;
  onUpdateOrder: (order: DietaryOrder) => void;
}

const API_BASE = '/api';

export const DietaryTab: React.FC<DietaryTabProps> = ({
  admissionId,
  order,
  onUpdateOrder,
}) => {
  const [dietType, setDietType] = useState(order.dietType);
  const [activityLevel, setActivityLevel] = useState(order.activityLevel);
  const [allergies, setAllergies] = useState(order.allergies.join(', '));
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
      fluidRestrictions: order.fluidRestrictions,
      npoResponse: order.npoResponse,
      lastUpdated: new Date().toISOString(),
      orderedBy: order.orderedBy,
    };

    try {
      setSaving(true);
      const res = await axios.post(
        `${API_BASE}/monitoring/dietary/`,
        payload
      );
      onUpdateOrder(res.data);
    } catch (err) {
      console.error('Failed to save dietary order', err);
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
