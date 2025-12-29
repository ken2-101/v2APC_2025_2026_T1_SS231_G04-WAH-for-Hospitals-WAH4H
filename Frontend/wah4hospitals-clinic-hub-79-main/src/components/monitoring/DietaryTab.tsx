import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Utensils, AlertTriangle } from 'lucide-react';
import { DietaryOrder } from '../../types/monitoring';

interface DietaryTabProps {
  admissionId: string;
  order?: DietaryOrder;
  onSaved?: (order: DietaryOrder) => void;
}

const API_BASE =
  'https://scaling-memory-jj56p55q79g42qwq5-8000.app.github.dev/api/monitoring/dietary-orders/';

export const DietaryTab: React.FC<DietaryTabProps> = ({
  admissionId,
  order: initialOrder,
  onSaved,
}) => {
  const [currentOrder, setCurrentOrder] = useState<DietaryOrder | undefined>(initialOrder);
  const [isEditing, setIsEditing] = useState(!initialOrder);
  const [dietType, setDietType] = useState(initialOrder?.dietType ?? 'Regular');
  const [allergies, setAllergies] = useState(
    Array.isArray(initialOrder?.allergies) ? initialOrder!.allergies.join(', ') : ''
  );
  const [isNPO, setIsNPO] = useState(initialOrder?.npoResponse ?? false);
  const [activityLevel, setActivityLevel] = useState(
    initialOrder?.activityLevel ?? 'As Tolerated'
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch dietary order for this admission
  useEffect(() => {
    if (!initialOrder) {
      setLoading(true);
      axios
        .get(`${API_BASE}?admission=${admissionId}`)
        .then(res => {
          if (res.data.length > 0) {
            setCurrentOrder(res.data[0]);
            setDietType(res.data[0].dietType);
            setAllergies(res.data[0].allergies.join(', '));
            setIsNPO(res.data[0].npoResponse);
            setActivityLevel(res.data[0].activityLevel);
            setIsEditing(false);
          } else {
            setIsEditing(true); // no order yet, allow creation
          }
        })
        .catch(err => console.error('Failed to fetch dietary order:', err))
        .finally(() => setLoading(false));
    }
  }, [admissionId, initialOrder]);

  const handleSave = async () => {
    const payload = {
      admission: Number(admissionId),
      diet_type: dietType,
      allergies: allergies
        ? allergies.split(',').map(a => a.trim()).filter(Boolean)
        : [],
      npo_response: isNPO,
      activity_level: activityLevel,
      ordered_by: 'Dr. Current User',
    };

    console.log('Submitting payload:', payload);

    try {
      setSaving(true);
      let res;

      if (currentOrder?.id) {
        res = await axios.put(`${API_BASE}${currentOrder.id}/`, payload);
      } else {
        res = await axios.post(API_BASE, payload);
      }

      setCurrentOrder(res.data);
      onSaved?.(res.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Dietary save failed:', err.response?.data);
      alert(
        'Failed to save dietary order:\n' +
          JSON.stringify(err.response?.data, null, 2)
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading dietary order…</p>;

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Update Dietary & Activity Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diet Type */}
          <div>
            <Label>Diet Type</Label>
            <Select value={dietType} onValueChange={setDietType} disabled={isNPO}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Soft">Soft</SelectItem>
                <SelectItem value="Low Salt">Low Salt</SelectItem>
                <SelectItem value="Diabetic">Diabetic</SelectItem>
                <SelectItem value="Clear Liquids">Clear Liquids</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NPO */}
          <div className="flex items-center space-x-2 border p-3 rounded bg-red-50">
            <Switch checked={isNPO} onCheckedChange={setIsNPO} />
            <Label className="font-bold text-red-700">NPO (Nothing by Mouth)</Label>
          </div>

          {/* Allergies */}
          {!isNPO && (
            <div>
              <Label>Allergies</Label>
              <Textarea
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                placeholder="Peanuts, Seafood…"
              />
            </div>
          )}

          {/* Activity Level */}
          <div>
            <Label>Activity Level</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bed Rest">Bed Rest</SelectItem>
                <SelectItem value="Bathroom Privileges">Bathroom Privileges</SelectItem>
                <SelectItem value="Ambulatory">Ambulatory</SelectItem>
                <SelectItem value="As Tolerated">As Tolerated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save & Notify Dietary'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {currentOrder ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Diet Info */}
          <Card className={currentOrder.npoResponse ? 'border-red-500 border-2' : ''}>
            <CardHeader>
              <CardTitle>
                Diet Information {currentOrder.npoResponse && <span className="text-red-600 font-bold">(NPO)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">
                {currentOrder.npoResponse ? 'NPO (Nothing by Mouth)' : currentOrder.dietType}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Ordered by: {currentOrder.orderedBy ?? '—'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {currentOrder.lastUpdated ? new Date(currentOrder.lastUpdated).toLocaleString() : '—'}
              </p>
            </CardContent>
          </Card>

          {/* Clinical Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500">Allergies</Label>
                {Array.isArray(currentOrder.allergies) && currentOrder.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentOrder.allergies.map((a, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">{a}</span>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-gray-500">None recorded</p>
                )}
              </div>

              <div>
                <Label className="text-gray-500">Activity Level</Label>
                <div className="flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-2 text-indigo-500" />
                  <span>{currentOrder.activityLevel}</span>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">NPO Status</Label>
                <span>{currentOrder.npoResponse ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-gray-500 italic">No dietary orders found for this admission.</p>
      )}
    </div>
  );
};
