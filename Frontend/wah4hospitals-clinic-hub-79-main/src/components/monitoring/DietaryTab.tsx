import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Utensils, AlertTriangle } from 'lucide-react';
import { DietaryOrder } from '../../types/monitoring';

interface DietaryTabProps {
    order: DietaryOrder | undefined;
    onUpdateOrder: (order: DietaryOrder) => void;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ order, onUpdateOrder }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [dietType, setDietType] = useState(order?.dietType || 'Regular');
    const [fluidRestrictions, setFluidRestrictions] = useState(order?.fluidRestrictions || '');
    const [allergies, setAllergies] = useState(order?.allergies.join(', ') || '');
    const [isNPO, setIsNPO] = useState(order?.npoResponse || false);
    const [activityLevel, setActivityLevel] = useState(order?.activityLevel || 'Ad Lib');

    const handleSave = () => {
        const updatedOrder: DietaryOrder = {
            dietType,
            fluidRestrictions,
            allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
            npoResponse: isNPO,
            activityLevel,
            lastUpdated: new Date().toISOString(),
            orderedBy: 'Dr. Current User'
        };
        onUpdateOrder(updatedOrder);
        setIsEditing(false);
        alert('Dietary orders updated and sent to Dietary Department.');
    };

    if (isEditing) {
        return (
            <Card>
                <CardHeader><CardTitle>Update Dietary & Activity Orders</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Diet Type</Label>
                        <Select value={dietType} onValueChange={setDietType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Regular">Regular</SelectItem>
                                <SelectItem value="Soft">Soft</SelectItem>
                                <SelectItem value="Low Salt">Low Salt</SelectItem>
                                <SelectItem value="Diabetic">Diabetic</SelectItem>
                                <SelectItem value="Renal">Renal</SelectItem>
                                <SelectItem value="Clear Liquid">Clear Liquid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2 border p-3 rounded bg-red-50">
                        <Switch id="npo" checked={isNPO} onCheckedChange={setIsNPO} />
                        <Label htmlFor="npo" className="font-bold text-red-700">NPO (Nothing by Mouth)</Label>
                    </div>

                    {!isNPO && (
                        <div>
                            <Label>Fluid Restrictions (optional)</Label>
                            <Input value={fluidRestrictions} onChange={e => setFluidRestrictions(e.target.value)} placeholder="e.g. 1500ml / day" />
                        </div>
                    )}

                    <div>
                        <Label>Allergies (Syncs with Pharmacy)</Label>
                        <Textarea value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Peanuts, Seafood, Latex..." />
                    </div>

                    <div>
                        <Label>Activity Level</Label>
                        <Select value={activityLevel} onValueChange={setActivityLevel}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ad Lib">Ad Lib (No Restrictions)</SelectItem>
                                <SelectItem value="Bed Rest">Bed Rest</SelectItem>
                                <SelectItem value="Assisted Ambulation">Assisted Ambulation</SelectItem>
                                <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save & Notify Dietary</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center">
                    <Utensils className="w-5 h-5 mr-4 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-blue-900">Current Dietary Status</h3>
                        <p className="text-sm text-blue-700">Last updated: {order ? new Date(order.lastUpdated).toLocaleString() : 'Never'}</p>
                    </div>
                </div>
                <Button onClick={() => setIsEditing(true)}>Update Orders</Button>
            </div>

            {order && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className={order.npoResponse ? 'border-red-500 border-2' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                Diet Information
                                {order.npoResponse && <span className="ml-2 text-red-600 font-bold">(NPO)</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!order.npoResponse ? (
                                <>
                                    <div><Label className="text-gray-500">Type</Label><p className="font-medium text-lg">{order.dietType}</p></div>
                                    {order.fluidRestrictions && <div><Label className="text-gray-500">Fluid Restrictions</Label><p className="font-medium">{order.fluidRestrictions}</p></div>}
                                </>
                            ) : (
                                <div className="text-red-600 flex items-center bg-red-50 p-4 rounded">
                                    <AlertTriangle className="w-5 h-5 mr-2" /> Patient is NPO. No food or water.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Clinical Instructions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-500">Allergies</Label>
                                {order.allergies.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {order.allergies.map((alg, i) => (
                                            <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">{alg}</span>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-500 italic">None recorded</p>}
                            </div>

                            <div>
                                <Label className="text-gray-500">Activity Level</Label>
                                <div className="mt-1 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 text-indigo-500" />
                                    <span className="font-medium">{order.activityLevel}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {!order && <div className="text-center text-gray-500 py-8">No dietary orders active. Click Update Orders to add one.</div>}
        </div>
    );
};
