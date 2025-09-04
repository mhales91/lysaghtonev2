
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import UserEditForm from '../components/admin/UserEditForm'; // Assuming this component exists

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const usersData = await User.list();
            setUsers(usersData);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Failed to load user data.');
        }
        setIsLoading(false);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleSaveUser = async (userData) => { // Function signature matches expected usage
        try {
            await User.update(editingUser.id, userData);
            toast.success('User updated successfully!');
            setShowForm(false);
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
            toast.error('Failed to save user.');
        }
    };
    
    const handleApproveUser = async (userId) => {
        try {
            const currentUser = await User.me();
            await User.update(userId, {
                approval_status: 'approved',
                approved_by: currentUser.email,
                approved_date: new Date().toISOString()
            });
            toast.success('User approved!');
            loadUsers();
        } catch (error) {
            console.error('Failed to approve user:', error);
            toast.error('Failed to approve user.');
        }
    };

    const handleRejectUser = async (userId) => {
        try {
            await User.update(userId, { approval_status: 'rejected' });
            toast.warning('User rejected.');
            loadUsers();
        } catch (error) {
            console.error('Failed to reject user:', error);
            toast.error('Failed to reject user.');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <Badge variant="success">Approved</Badge>;
            case 'pending': return <Badge variant="warning">Pending</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    if (showForm && editingUser) {
        return (
            <UserEditForm
                user={editingUser}
                onSave={handleSaveUser}
                onCancel={() => { setShowForm(false); setEditingUser(null); }}
            />
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">Approve, manage, and assign roles to users.</p>
                </div>

                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan="6">Loading users...</TableCell></TableRow>
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.user_role}</TableCell>
                                            <TableCell>{user.department}</TableCell>
                                            <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                                            <TableCell className="text-right">
                                                {user.approval_status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="sm" variant="success" onClick={() => handleApproveUser(user.id)}>Approve</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleRejectUser(user.id)}>Reject</Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>Edit</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
