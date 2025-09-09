
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, AlertTriangle, Lock, Palette, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const defaultColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'
];

export default function UserEditForm({ user, isAppCreator, onSave, onCancel, onDelete }) {
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        user_role: user.user_role || 'Staff',
        department: user.department || '',
        office: user.office || 'Bay of Plenty',
        user_color: user.user_color || defaultColors[Math.floor(Math.random() * defaultColors.length)]
    });

    const roles = ["Staff", "Manager", "DeptLead", "Director", "Admin"];
    const departments = ["Planning", "Survey", "Engineering", "PM", "Admin"];
    const offices = ["Bay of Plenty", "Waikato"];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData); // Fix: Pass only formData, not user.id
    };

    const getInitials = () => {
        const first = formData.first_name?.[0] || '';
        const last = formData.last_name?.[0] || '';
        if (first && last) return `${first}${last}`.toUpperCase();
        return user.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
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
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-2">
                            <Label>Full Name (from provider)</Label>
                            <p className="text-sm text-gray-500">{user.full_name}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData(p => ({ ...p, first_name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData(p => ({ ...p, last_name: e.target.value }))} />
                            </div>
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

                        <div className="space-y-2">
                            <Label htmlFor="user_color">User Color</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    id="user_color"
                                    type="color"
                                    value={formData.user_color}
                                    onChange={(e) => setFormData(p => ({ ...p, user_color: e.target.value }))}
                                    className="w-16 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                                />
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-10 h-8 rounded-md border flex items-center justify-center text-white font-semibold text-sm"
                                        style={{ backgroundColor: formData.user_color }}
                                    >
                                        {getInitials()}
                                    </div>
                                    <span className="text-sm text-gray-600">Preview</span>
                                </div>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {defaultColors.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, user_color: color }))}
                                        className="w-6 h-6 rounded border-2 border-transparent hover:border-gray-500"
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex justify-between pt-4">
                            {/* Delete button - only for localhost users */}
                            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && onDelete && (
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
                                            onDelete(user);
                                        }
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                </Button>
                            )}
                            
                            <div className="flex gap-2 ml-auto">
                                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                                <Button type="submit" style={{ backgroundColor: '#5E0F68' }}>
                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
