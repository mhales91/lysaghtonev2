import React, { useState, useEffect } from 'react';
import { User } from '../lib/custom-sdk.js';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
    saveRolePermissions, 
    getRolePermissions, 
    initializeDefaultPermissions, 
    checkTablesExist,
    availableRoles,
    allPages,
    allDashboardWidgets
} from '../api/rolePermissions.js';
import { clearPermissionCache } from '../utils/permissions.js';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('approved');
    const [showRoleConfig, setShowRoleConfig] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleConfigs, setRoleConfigs] = useState({});
    const [selectedPages, setSelectedPages] = useState([]);
    const [showWidgetConfig, setShowWidgetConfig] = useState(false);
    const [editingWidgetRole, setEditingWidgetRole] = useState(null);
    const [widgetConfigs, setWidgetConfigs] = useState({});
    const [selectedWidgets, setSelectedWidgets] = useState([]);
    const [databaseError, setDatabaseError] = useState(null);
    const [databaseInitialized, setDatabaseInitialized] = useState(false);

    // Get current user
    const currentUser = User.current;
    const [hasAccess, setHasAccess] = useState(null);

    // Check if user has permission to access User Management
    useEffect(() => {
        const checkAccess = async () => {
            if (!currentUser) {
                setHasAccess(false);
                return;
            }
            
            try {
                const access = await canAccessUserManagement(currentUser.user_role);
                setHasAccess(access);
            } catch (error) {
                console.error('Error checking access:', error);
                // Fallback: allow Admin and Director access
                setHasAccess(currentUser.user_role === 'Admin' || currentUser.user_role === 'Director');
            }
        };
        
        checkAccess();
    }, [currentUser]);

    if (hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
                        <CardDescription className="text-center">
                            You don't have permission to access this page.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Role display names and expected user counts
    const roleDisplayNames = {
        'Admin': 'Administrator',
        'Director': 'Director',
        'Manager': 'Manager',
        'Staff': 'Staff Member',
        'Client': 'Client'
    };

    const expectedUserCounts = {
        'Admin': 2,
        'Director': 1,
        'Manager': 9,
        'Staff': 8,
        'Client': 6
    };

    // Load role configurations from database
    const loadRoleConfigs = async () => {
        try {
            const configs = {};
            for (const role of availableRoles) {
                if (role && role.trim() !== '') {
                    const permissions = await getRolePermissions(role);
                    configs[role] = permissions;
                }
            }
            setRoleConfigs(configs);
            setDatabaseError(null);
            console.log('Loaded role configurations from database');
        } catch (error) {
            console.error('Error loading role configurations:', error);
            setDatabaseError('Database tables not set up. Please run the SQL script in your Supabase dashboard.');
            toast.error('Database not set up. Please run the SQL script first.');
        }
    };

    // Load widget configurations from localStorage
    const loadWidgetConfigs = () => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            const saved = localStorage.getItem('widgetConfigs');
            if (saved) {
                setWidgetConfigs(JSON.parse(saved));
            } else {
                // Set default widget configurations
                const defaultWidgetConfigs = {
                    'Admin': allDashboardWidgets,
                    'Director': allDashboardWidgets,
                    'Manager': ['Weekly Timesheet Hours', 'Yearly Performance (FYTD)', 'Workload', 'CRM Pipeline - All Departments', 'TOE Board - All Departments', 'SLA Tracker - All Departments', 'Project Portfolio', 'Upcoming Projects', 'Budget Utilisation'],
                    'Staff': ['Weekly Timesheet Hours', 'Yearly Performance (FYTD)', 'Workload', 'CRM Pipeline - All Departments', 'TOE Board - All Departments', 'SLA Tracker - All Departments', 'Project Portfolio', 'Upcoming Projects', 'Budget Utilisation'],
                    'Client': ['Weekly Timesheet Hours', 'Yearly Performance (FYTD)', 'Workload', 'Project Portfolio', 'Upcoming Projects', 'Budget Utilisation']
                };
                setWidgetConfigs(defaultWidgetConfigs);
                localStorage.setItem('widgetConfigs', JSON.stringify(defaultWidgetConfigs));
            }
        }
    };

    const handleSaveWidgetConfig = (role, selectedWidgets) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            const updatedConfigs = {
                ...widgetConfigs,
                [role]: selectedWidgets
            };
            setWidgetConfigs(updatedConfigs);
            localStorage.setItem('widgetConfigs', JSON.stringify(updatedConfigs));
            toast.success(`Dashboard widgets updated for ${role}`);
            setShowWidgetConfig(false);
            setEditingWidgetRole(null);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            await loadUsers();
            
            // Check if database is initialized
            const tablesExist = await checkTablesExist();
            if (tablesExist) {
                setDatabaseInitialized(true);
                await loadRoleConfigs();
            } else {
                setDatabaseError('Database tables not set up. Please run the SQL script in your Supabase dashboard.');
                console.log('Database tables do not exist yet');
            }
            
        loadWidgetConfigs();
        };
        initializeData();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            // Check if we're on localhost
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            console.log('🔍 loadUsers - isLocalhost:', isLocalhost);
            
            if (isLocalhost) {
                // For localhost, get users from the users table
                const usersData = await User.list();
                console.log('📊 User data loaded:', {
                    usersData: usersData.length,
                    dbApprovedUsers: usersData.filter(u => u.user_role).length,
                    localApprovedUsers: 0,
                    pendingUsersData: 0,
                    pendingUsers: []
                });

                // Filter out users without roles (pending approval)
                const approvedUsers = usersData.filter(user => user.user_role && user.user_role.trim() !== '');
                const pendingUsersData = usersData.filter(user => !user.user_role || user.user_role.trim() === '');

                console.log('✅ Setting users:', approvedUsers);
                console.log('⏳ Setting pending users:', pendingUsersData);
                setUsers(approvedUsers);
                setPendingUsers(pendingUsersData);
            } else {
                // For production, use the existing logic
            const usersData = await User.list();
                const approvedUsers = usersData.filter(user => user.user_role);
                const pendingUsersData = usersData.filter(user => !user.user_role);
                setUsers(approvedUsers);
                setPendingUsers(pendingUsersData);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            await User.update(userId, { user_role: newRole });
            
            // Update local state
            setUsers(users.map(u => 
                u.id === userId ? { ...u, user_role: newRole } : u
            ));

            // Move user between lists if needed
            if (newRole && newRole.trim() !== '') {
                // Move from pending to approved
                setPendingUsers(pendingUsers.filter(u => u.id !== userId));
                setUsers([...users.filter(u => u.id !== userId), { ...user, user_role: newRole }]);
            } else {
                // Move from approved to pending
                setUsers(users.filter(u => u.id !== userId));
                setPendingUsers([...pendingUsers, { ...user, user_role: newRole }]);
            }

            toast.success(`User role updated to ${newRole || 'Pending'}`);
        } catch (error) {
            console.error('Error updating user role:', error);
            toast.error('Failed to update user role');
        }
    };

    const handleApproveUser = async (userId) => {
        try {
            const user = pendingUsers.find(u => u.id === userId);
            if (!user) return;

            // Set default role to 'Staff' for approved users
            await User.update(userId, { user_role: 'Staff' });
            
            // Move user from pending to approved
            setPendingUsers(pendingUsers.filter(u => u.id !== userId));
            setUsers([...users, { ...user, user_role: 'Staff' }]);

            toast.success('User approved and assigned Staff role');
        } catch (error) {
            console.error('Error approving user:', error);
            toast.error('Failed to approve user');
        }
    };

    const handleRejectUser = async (userId) => {
        try {
            await User.delete(userId);
            setPendingUsers(pendingUsers.filter(u => u.id !== userId));
            toast.success('User rejected and removed');
        } catch (error) {
            console.error('Error rejecting user:', error);
            toast.error('Failed to reject user');
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setSelectedPages(getRolePermissionsFromConfigs(role));
        setShowRoleConfig(true);
    };

    const handleEditWidgets = (role) => {
        setEditingWidgetRole(role);
        setSelectedWidgets(widgetConfigs[role] || []);
        setShowWidgetConfig(true);
    };

    const getRolePermissionsFromConfigs = (role) => {
        return roleConfigs[role] || [];
    };

    const handleSaveRoleConfig = async (role, selectedPages) => {
        try {
            const result = await saveRolePermissions(role, selectedPages);
            
            if (result.success) {
                // Update the role configs state
        const updatedConfigs = {
            ...roleConfigs,
            [role]: selectedPages
        };
        setRoleConfigs(updatedConfigs);
        
                // Clear permission cache to force refresh
                clearPermissionCache();
        
        toast.success(`Role permissions updated for ${role}`);
        setShowRoleConfig(false);
        setEditingRole(null);
        
        // Trigger navigation refresh
        window.dispatchEvent(new CustomEvent('permissionsChanged'));
            } else {
                toast.error(`Failed to update role permissions: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving role permissions:', error);
            toast.error('Failed to save role permissions. Please check database connection.');
        }
    };

    // Delete user function for localhost only
    const handleDeleteUser = async (user) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (!isLocalhost) {
                toast.error('User deletion is only available on localhost');
                return;
            }

            if (window.confirm(`Are you sure you want to delete user ${user.email}?`)) {
                await User.delete(user.id);
                setUsers(users.filter(u => u.id !== user.id));
                toast.success('User deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleInitializeDatabase = async () => {
        try {
            const result = await initializeDefaultPermissions();
            if (result.success) {
                toast.success('Database permissions initialized successfully!');
                setDatabaseInitialized(true);
                setDatabaseError(null);
                await loadRoleConfigs();
            } else {
                if (result.needsSqlScript) {
                    toast.error('Please run the SQL script in your Supabase dashboard first');
                } else {
                    toast.error(`Failed to initialize: ${result.error}`);
                }
            }
        } catch (error) {
            console.error('Error initializing database:', error);
            toast.error('Failed to initialize database permissions');
        }
    };

    const getRoleStats = () => {
        const stats = {};
        availableRoles.forEach(role => {
            const count = users.filter(user => user.user_role === role).length;
            const expected = expectedUserCounts[role] || 0;
            stats[role] = { count, expected, isComplete: count >= expected };
        });
        return stats;
    };

    const roleStats = getRoleStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">Approve, manage, and assign roles to users.</p>
                    
                    {databaseError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Database Setup Required
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{databaseError}</p>
                                        <div className="mt-2">
                                            <p className="font-medium">To fix this:</p>
                                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                                <li>Go to your Supabase project dashboard</li>
                                                <li>Navigate to SQL Editor</li>
                                                <li>Copy the contents of <code className="bg-red-100 px-1 rounded">initialize-role-permissions.sql</code></li>
                                                <li>Paste and run the SQL script</li>
                                                <li>Refresh this page</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Debug buttons for localhost */}
                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                        <div className="mt-4 flex gap-2">
                            <Button 
                                onClick={handleInitializeDatabase}
                                variant="outline"
                                size="sm"
                            >
                                Initialize Database Permissions
                            </Button>
                        </div>
                    )}
                </div>

                {/* Role Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {availableRoles.map(role => {
                        const stats = roleStats[role];
                        return (
                            <Card key={role} className={`${stats.isComplete ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-900">
                                        {roleDisplayNames[role]}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {stats.count}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            / {stats.expected}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditRole(role)}
                                            disabled={!databaseInitialized}
                                        >
                                            Edit Pages
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditWidgets(role)}
                                        >
                                            Edit Widgets
                                        </Button>
                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="approved">Approved Users ({users.length})</TabsTrigger>
                        <TabsTrigger value="pending">Pending Approval ({pendingUsers.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="approved" className="mt-6">
                <Card>
                            <CardHeader>
                                <CardTitle>Approved Users</CardTitle>
                                <CardDescription>
                                    Users with assigned roles who can access the system.
                                </CardDescription>
                            </CardHeader>
                    <CardContent>
                                {users.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No approved users found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {users.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">
                                                                {user.full_name || user.email}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                        <Badge variant="secondary">
                                                            {roleDisplayNames[user.user_role] || user.user_role}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={user.user_role}
                                                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">Pending</SelectItem>
                                                    {availableRoles.map(role => (
                                                                <SelectItem key={role} value={role}>
                                                                    {roleDisplayNames[role]}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                                                                <Button
                                                            variant="destructive"
                                                                    size="sm"
                                                            onClick={() => handleDeleteUser(user)}
                                                                >
                                                            Delete
                                                                </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="pending" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Approval</CardTitle>
                                <CardDescription>
                                    Users waiting for role assignment and approval.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pendingUsers.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No pending users found.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingUsers.map(user => (
                                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">
                                                        {user.full_name || user.email}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                        onClick={() => handleApproveUser(user.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => handleRejectUser(user.id)}
                                                    >
                                                        Reject
                                                                </Button>
                                                </div>
                                            </div>
                                        ))}
                                                    </div>
                                )}
                    </CardContent>
                </Card>
                    </TabsContent>
                </Tabs>

                {/* Role Configuration Dialog */}
                <Dialog open={showRoleConfig} onOpenChange={setShowRoleConfig}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Configure Pages for {editingRole}</DialogTitle>
                            <DialogDescription>
                                Select which pages users with the {editingRole} role can access.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {allPages.map(page => (
                                <div key={page} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={page}
                                        checked={selectedPages.includes(page)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedPages([...selectedPages, page]);
                                            } else {
                                                setSelectedPages(selectedPages.filter(p => p !== page));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={page} className="text-sm font-medium">
                                        {page}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRoleConfig(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleSaveRoleConfig(editingRole, selectedPages)}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Widget Configuration Dialog */}
                <Dialog open={showWidgetConfig} onOpenChange={setShowWidgetConfig}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Configure Dashboard Widgets for {editingWidgetRole}</DialogTitle>
                            <DialogDescription>
                                Select which dashboard widgets users with the {editingWidgetRole} role can see.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 py-4">
                            {allDashboardWidgets.map(widget => (
                                <div key={widget} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={widget}
                                        checked={selectedWidgets.includes(widget)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedWidgets([...selectedWidgets, widget]);
                                            } else {
                                                setSelectedWidgets(selectedWidgets.filter(w => w !== widget));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={widget} className="text-sm font-medium">
                                        {widget}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowWidgetConfig(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => handleSaveWidgetConfig(editingWidgetRole, selectedWidgets)}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default UserManagement;