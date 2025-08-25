import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserEditForm({ user, isAppCreator, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        user_role: user.user_role || 'Staff',
        department: user.department || '',
        office: user.office || 'Bay of Plenty'
    });

    const roles = ["Staff", "Manager", "DeptLead", "Director", "Admin"];
    const departments = ["Planning", "Survey", "Engineering", "PM", "Admin"];
    const offices = ["Bay of Plenty", "Waikato"];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            Edit User: {user.full_name}
                            {isAppCreator && <Lock className="w-4 h-4 ml-2 text-amber-600" />}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={onCancel}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isAppCreator && (
                            <Alert className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    This is the app creator. Their role cannot be changed for security reasons. 
                                    You can only update their department and office.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user_role">Role</Label>
                            <Select 
                                value={formData.user_role} 
                                onValueChange={(value) => setFormData(p => ({ ...p, user_role: value }))}
                                disabled={isAppCreator}
                            >
                                <SelectTrigger id="user_role" className={isAppCreator ? "opacity-50" : ""}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {isAppCreator && (
                                <p className="text-xs text-amber-600">Role cannot be changed for app creator</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select value={formData.department} onValueChange={(value) => setFormData(p => ({ ...p, department: value }))}>
                                <SelectTrigger id="department"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>Select a department</SelectItem>
                                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="office">Office</Label>
                            <Select value={formData.office} onValueChange={(value) => setFormData(p => ({ ...p, office: value }))}>
                                <SelectTrigger id="office"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {offices.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                            <Button type="submit" style={{ backgroundColor: '#5E0F68' }}>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}