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
import { AlertCircle } from 'lucide-react';
import { DietaryOrder } from '../../types/monitoring';

interface DietaryTabProps {
  admissionId: string;
  order?: DietaryOrder;
  onSaved?: (order: DietaryOrder) => void;
}

const API_BASE =
  'https://curly-couscous-wrgjv6x7j6v4hgvrw-8000.app.github.dev/api/monitoring/dietary-orders/';

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
  const [orderedBy, setOrderedBy] = useState(initialOrder?.orderedBy ?? '—');
  const [lastUpdated, setLastUpdated] = useState(initialOrder?.lastUpdated ?? '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper: convert backend response to frontend format
  const mapBackendOrder = (data: any): DietaryOrder => ({
    id: data.id,
    admissionId: data.admission,
    dietType: data.diet_type,
    allergies: data.allergies,
    npoResponse: data.npo_response,
    activityLevel: data.activity_level,
    orderedBy: data.ordered_by,
    lastUpdated: data.last_updated,
  });

  // Always fetch latest order from backend
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}?admission=${admissionId}`);
        if (res.data.length > 0) {
          const orderData = mapBackendOrder(res.data[0]);
          setCurrentOrder(orderData);
          setDietType(orderData.dietType);
          setAllergies(orderData.allergies.join(', '));
          setIsNPO(orderData.npoResponse);
          setActivityLevel(orderData.activityLevel);
          setOrderedBy(orderData.orderedBy);
          setLastUpdated(orderData.lastUpdated);
          setIsEditing(false);
        } else {
          setIsEditing(true); // no order yet, allow creation
        }
      } catch (err) {
        console.error('Failed to fetch dietary order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [admissionId]);

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

    try {
      setSaving(true);
      let res;
      if (currentOrder?.id) {
        res = await axios.put(`${API_BASE}${currentOrder.id}/`, payload);
      } else {
        res = await axios.post(API_BASE, payload);
      }

      const updatedOrder = mapBackendOrder(res.data);
      setCurrentOrder(updatedOrder);
      setDietType(updatedOrder.dietType);
      setAllergies(updatedOrder.allergies.join(', '));
      setIsNPO(updatedOrder.npoResponse);
      setActivityLevel(updatedOrder.activityLevel);
      setOrderedBy(updatedOrder.orderedBy);
      setLastUpdated(updatedOrder.lastUpdated);
      onSaved?.(updatedOrder);
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

  // Editing UI
  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Update Dietary & Activity Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex items-center space-x-2 border p-3 rounded bg-red-50">
            <Switch checked={isNPO} onCheckedChange={setIsNPO} />
            <Label className="font-bold text-red-700">NPO (Nothing by Mouth)</Label>
          </div>

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
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save & Notify Dietary'}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display UI
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Dietary Order Details</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p><strong>Diet Type:</strong> {currentOrder?.dietType}</p>
        <p><strong>Admission:</strong> {currentOrder?.admissionId}</p>
        <p><strong>Ordered By:</strong> {currentOrder?.orderedBy}</p>
        <p><strong>Last Updated:</strong> {currentOrder?.lastUpdated ? new Date(currentOrder.lastUpdated).toLocaleString() : '—'}</p>
        <p><strong>NPO:</strong> {currentOrder?.npoResponse ? 'Yes' : 'No'}</p>

        <div>
          <Label className="text-gray-500">Allergies</Label>
          {Array.isArray(currentOrder?.allergies) && currentOrder.allergies.length > 0 ? (
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
            <span>{currentOrder?.activityLevel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
