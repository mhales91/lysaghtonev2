
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Lock, Trash2, CheckCircle, X } from 'lucide-react'; // Added CheckCircle and X
import UserEditForm from '../components/admin/UserEditForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [appCreatorId, setAppCreatorId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [userList, me] = await Promise.all([
                User.list(),
                User.me()
            ]);
            setUsers(userList);
            setCurrentUser(me);
            
            // Identify app creator - usually the first user created or current admin
            // Ensure we prioritize users with an 'Admin' role as potential creator, otherwise the first user.
            const potentialCreator = userList.find(u => u.user_role === 'Admin') || userList[0];
            if (potentialCreator) {
                setAppCreatorId(potentialCreator.id);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setIsLoading(false);
    };

    const handleSaveUser = async (userId, data) => {
        try {
            await User.update(userId, data);
            setEditingUser(null);
            loadData();
        } catch (error) {
            console.error("Failed to update user:", error);
            if (error.response?.data?.message?.includes('creator of the app')) {
                alert("Cannot update the role of the app creator for security reasons.");
                setAppCreatorId(userId); // Mark this user as the app creator
            } else {
                alert("Failed to update user. Please try again.");
            }
        }
    };

    const handleApproveUser = async (userId) => {
        try {
            await User.update(userId, {
                approval_status: 'approved',
                approved_by: currentUser.email,
                approved_date: new Date().toISOString()
            });
            loadData();
        } catch (error) {
            console.error("Failed to approve user:", error);
            alert("Failed to approve user. Please try again.");
        }
    };

    const handleRejectUser = async (userId) => {
        if (confirm('Are you sure you want to reject this user? They will not be able to access the application.')) {
            try {
                await User.update(userId, {
                    approval_status: 'rejected',
                    approved_by: currentUser.email,
                    approved_date: new Date().toISOString()
                });
                loadData();
            } catch (error) {
                console.error("Failed to reject user:", error);
                alert("Failed to reject user. Please try again.");
            }
        }
    };

    const handleDeleteUser = async (userId, userFullName) => {
        if (confirm(`Are you sure you want to delete the user "${userFullName}"? This action cannot be undone.`)) {
            try {
                await User.delete(userId);
                loadData();
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Failed to delete user. Please try again.");
            }
        }
    };

    const isAppCreator = (user) => {
        return user.id === appCreatorId;
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    const getApprovalBadge = (user) => {
        const status = user.approval_status || 'pending';
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        return (
            <Badge className={colors[status]}>
                {status === 'pending' ? 'Pending Approval' : 
                 status === 'approved' ? 'Approved' : 'Rejected'}
            </Badge>
        );
    };

    return (
        <div className="p-6 space-y-8 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">
                        View and manage user roles, departments, and approval status.
                        <br />
                        <small className="text-amber-600">Note: The app creator's role cannot be changed for security reasons.</small>
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Office</TableHead>
                                    <TableHead>Status</TableHead> {/* New Table Head */}
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell> {/* New Skeleton Cell */}
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.full_name}
                                                {user.id === currentUser?.id && (
                                                    <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                                )}
                                                {isAppCreator(user) && (
                                                    <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">
                                                        App Creator
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.user_role || 'Staff'}</Badge>
                                            </TableCell>
                                            <TableCell>{user.department || 'Not set'}</TableCell>
                                            <TableCell>{user.office || 'Not set'}</TableCell>
                                            <TableCell>{getApprovalBadge(user)}</TableCell> {/* New Table Cell for Status */}
                                            <TableCell className="text-right">
                                                <div className="flex gap-1 justify-end">
                                                    {/* Approval/Rejection buttons for pending users */}
                                                    {user.approval_status === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleApproveUser(user.id)}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                title="Approve user"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRejectUser(user.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                                                title="Reject user"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    
                                                    {/* Edit button */}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleEditUser(user)}
                                                        title={isAppCreator(user) ? "App creator role cannot be changed" : "Edit user"}
                                                    >
                                                        {isAppCreator(user) ? (
                                                            <Lock className="h-4 w-4 text-amber-600" />
                                                        ) : (
                                                            <Pencil className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    
                                                    {/* Delete button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                        disabled={isAppCreator(user) || user.id === currentUser?.id}
                                                        title={
                                                            isAppCreator(user) ? "Cannot delete the app creator" :
                                                            user.id === currentUser?.id ? "Cannot delete yourself" :
                                                            "Delete user"
                                                        }
                                                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {editingUser && (
                <UserEditForm
                    user={editingUser}
                    isAppCreator={isAppCreator(editingUser)}
                    onSave={handleSaveUser}
                    onCancel={() => setEditingUser(null)}
                />
            )}
        </div>
    );
}
