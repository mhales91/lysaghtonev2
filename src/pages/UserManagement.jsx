import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import UserEditForm from '../components/admin/UserEditForm'; // Assuming this component exists

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editingPendingUser, setEditingPendingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('approved');
    const [showRoleConfig, setShowRoleConfig] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleConfigs, setRoleConfigs] = useState({});
    const [selectedPages, setSelectedPages] = useState([]);
    const [showWidgetConfig, setShowWidgetConfig] = useState(false);
    const [editingWidgetRole, setEditingWidgetRole] = useState(null);
    const [widgetConfigs, setWidgetConfigs] = useState({});
    const [selectedWidgets, setSelectedWidgets] = useState([]);

    // All available pages
    const allPages = [
        'Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets',
        'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings',
        'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library',
        'TOE Admin', 'Import Jobs'
    ];

    // Available roles
    const availableRoles = ['Admin', 'Director', 'Manager', 'Staff', 'Client'];

    // Dashboard widgets available for each role level
    const allDashboardWidgets = [
        'Weekly Timesheet Hours',
        'Yearly Performance (FYTD)',
        'Workload',
        'CRM Pipeline - All Departments',
        'TOE Board - All Departments',
        'SLA Tracker - All Departments',
        'Project Portfolio',
        'Upcoming Projects',
        'Budget Utilisation'
    ];

    // Widgets available for each role level (Staff gets 8, others get 9)
    const roleWidgetLimits = {
        'Admin': 9,
        'Director': 9,
        'Manager': 9,
        'Staff': 8,
        'Client': 6
    };

    // Load role configurations from localStorage
    const loadRoleConfigs = () => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            const saved = localStorage.getItem('roleConfigs');
            if (saved) {
                setRoleConfigs(JSON.parse(saved));
            } else {
                // Default configurations
                const defaultConfigs = {
                    'Admin': allPages,
                    'Director': allPages,
                    'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
                    'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
                    'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
                };
                setRoleConfigs(defaultConfigs);
                localStorage.setItem('roleConfigs', JSON.stringify(defaultConfigs));
            }
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
                // Default widget configurations
                const defaultWidgetConfigs = {
                    'Admin': allDashboardWidgets,
                    'Director': allDashboardWidgets,
                    'Manager': allDashboardWidgets,
                    'Staff': allDashboardWidgets.slice(0, 8), // Staff gets first 8 widgets
                    'Client': allDashboardWidgets.slice(0, 6) // Client gets first 6 widgets
                };
                setWidgetConfigs(defaultWidgetConfigs);
                localStorage.setItem('widgetConfigs', JSON.stringify(defaultWidgetConfigs));
            }
        }
    };

    // Role-based page permissions for localhost only
    const getRolePermissions = (role) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            // If role has a specific configuration, use it; otherwise use default
            if (roleConfigs[role] && roleConfigs[role].length > 0) {
                return roleConfigs[role];
            }
            // Fallback to default configuration
            const defaultPermissions = {
                'Admin': allPages,
                'Director': allPages,
                'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
                'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
                'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
            };
            return defaultPermissions[role] || [];
        }
        // Fallback for production
        const permissions = {
            'Admin': allPages,
            'Director': allPages,
            'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
            'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
            'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
        };
        return permissions[role] || [];
    };

    // Get widget permissions for a role
    const getRoleWidgetPermissions = (role) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            // If role has a specific widget configuration, use it; otherwise use default
            if (widgetConfigs[role] && widgetConfigs[role].length > 0) {
                return widgetConfigs[role];
            }
            // Fallback to default configuration
            const defaultWidgets = {
                'Admin': allDashboardWidgets,
                'Director': allDashboardWidgets,
                'Manager': allDashboardWidgets,
                'Staff': allDashboardWidgets.slice(0, 8),
                'Client': allDashboardWidgets.slice(0, 6)
            };
            return defaultWidgets[role] || [];
        }
        return [];
    };

    // Handle widget configuration editing
    const handleEditWidgetRole = (role) => {
        setEditingWidgetRole(role);
        setSelectedWidgets(getRoleWidgetPermissions(role));
        setShowWidgetConfig(true);
    };

    // Save widget configuration
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
        loadUsers();
        loadRoleConfigs();
        loadWidgetConfigs();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            // Check if we're on localhost
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            console.log('🔍 loadUsers - isLocalhost:', isLocalhost);
            
            if (isLocalhost) {
                // For localhost, get approved users from localStorage and database, pending from localStorage
                const usersData = await User.list();
                const dbApprovedUsers = usersData.filter(user => user.approval_status === 'approved');
                const localApprovedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
                const pendingUsersData = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                
                console.log('📊 User data loaded:', {
                    usersData: usersData.length,
                    dbApprovedUsers: dbApprovedUsers.length,
                    localApprovedUsers: localApprovedUsers.length,
                    pendingUsersData: pendingUsersData.length,
                    pendingUsers: pendingUsersData
                });
                
                // Combine database and localStorage approved users, prioritizing localStorage
                const localUserIds = new Set(localApprovedUsers.map(u => u.id));
                const dbUsersNotInLocal = dbApprovedUsers.filter(u => !localUserIds.has(u.id));
                const allApprovedUsers = [...localApprovedUsers, ...dbUsersNotInLocal];
                
                console.log('✅ Setting users:', allApprovedUsers);
                console.log('⏳ Setting pending users:', pendingUsersData);
                
                setUsers(allApprovedUsers);
                setPendingUsers(pendingUsersData);
            } else {
                // For production, use database
            const usersData = await User.list();
                const approvedUsers = usersData.filter(user => user.approval_status === 'approved');
                const pendingUsersData = usersData.filter(user => user.approval_status === 'pending');
                
                setUsers(approvedUsers);
                setPendingUsers(pendingUsersData);
            }
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            toast.error('Failed to load user data.');
        }
        setIsLoading(false);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleEditPendingUser = (user) => {
        setEditingPendingUser(user);
        setShowForm(true);
    };

    const handleSavePendingUser = async (userData) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // Update pending user in localStorage
                const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                const updatedPendingUsers = pendingUsers.map(u => 
                    u.id === editingPendingUser.id 
                        ? { ...u, ...userData, updated_at: new Date().toISOString() }
                        : u
                );
                localStorage.setItem('pendingUsers', JSON.stringify(updatedPendingUsers));
            }
            
            toast.success('Pending user updated successfully!');
            setShowForm(false);
            setEditingPendingUser(null);
            loadUsers();
        } catch (error) {
            console.error('Failed to save pending user:', error);
            toast.error('Failed to save pending user');
        }
    };

    // Role configuration functions for localhost only
    const handleEditRole = (role) => {
        setEditingRole(role);
        setSelectedPages(getRolePermissions(role));
        setShowRoleConfig(true);
    };

    const handleSaveRoleConfig = (role, selectedPages) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            const updatedConfigs = {
                ...roleConfigs,
                [role]: selectedPages
            };
            setRoleConfigs(updatedConfigs);
            localStorage.setItem('roleConfigs', JSON.stringify(updatedConfigs));
            toast.success(`Role permissions updated for ${role}`);
            setShowRoleConfig(false);
            setEditingRole(null);
        }
    };

    // Delete user function for localhost only
    const handleDeleteUser = async (user) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // Remove from approved users in localStorage
                const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
                const updatedApprovedUsers = approvedUsers.filter(u => u.id !== user.id);
                localStorage.setItem('approvedUsers', JSON.stringify(updatedApprovedUsers));
                
                // Also remove from pending users if they exist there
                const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                const updatedPendingUsers = pendingUsers.filter(u => u.id !== user.id);
                localStorage.setItem('pendingUsers', JSON.stringify(updatedPendingUsers));
                
                toast.success('User deleted successfully');
                setShowForm(false);
                setEditingUser(null);
                loadUsers();
            } else {
                // For production, you might want to implement database deletion
                toast.error('User deletion not available in production');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleApproveUser = async (user) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // For localhost, move user from pending to approved in localStorage
                const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
                
                // Remove from pending
                const updatedPendingUsers = pendingUsers.filter(u => u.id !== user.id);
                localStorage.setItem('pendingUsers', JSON.stringify(updatedPendingUsers));
                
                // Add to approved with new ID and approval info
                const approvedUser = {
                    ...user,
                    id: crypto.randomUUID(),
                    approval_status: 'approved',
                    approved_by: 'admin',
                    approved_date: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    // Ensure password is preserved for localhost authentication
                    password: user.password || 'defaultPassword123' // Fallback if no password
                };
                
                console.log('Approving user:', { originalUser: user, approvedUser });
                approvedUsers.push(approvedUser);
                localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
                console.log('Updated approvedUsers in localStorage:', JSON.parse(localStorage.getItem('approvedUsers')));
            } else {
                // For production, update in database
                await User.update(user.id, {
                    approval_status: 'approved',
                    approved_by: 'admin',
                    approved_date: new Date().toISOString()
                });
            }
            
            toast.success('User approved successfully');
            loadUsers(); // Reload to update the lists
        } catch (error) {
            console.error('Failed to approve user:', error);
            toast.error('Failed to approve user');
        }
    };

    const handleRejectUser = async (user) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // For localhost, just remove from localStorage
                const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                const updatedPendingUsers = pendingUsers.filter(u => u.id !== user.id);
                localStorage.setItem('pendingUsers', JSON.stringify(updatedPendingUsers));
            } else {
                // For production, update in database
                await User.update(user.id, {
                    approval_status: 'rejected',
                    approved_by: 'admin',
                    approved_date: new Date().toISOString()
                });
            }
            
            toast.success('User rejected');
            loadUsers(); // Reload to update the lists
        } catch (error) {
            console.error('Failed to reject user:', error);
            toast.error('Failed to reject user');
        }
    };

    const handleSaveUser = async (userData) => { // Function signature matches expected usage
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // For localhost, always use localStorage to avoid database constraints
                const localApprovedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
                const localUser = localApprovedUsers.find(u => u.id === editingUser.id);
                
                if (localUser) {
                    // Update existing localStorage user
                    const updatedLocalUsers = localApprovedUsers.map(u => 
                        u.id === editingUser.id 
                            ? { ...u, ...userData, updated_at: new Date().toISOString() }
                            : u
                    );
                    localStorage.setItem('approvedUsers', JSON.stringify(updatedLocalUsers));
                } else {
                    // Create new localStorage entry for database user
                    const newLocalUser = {
                        ...editingUser,
                        ...userData,
                        id: editingUser.id, // Keep original ID
                        updated_at: new Date().toISOString()
                    };
                    localApprovedUsers.push(newLocalUser);
                    localStorage.setItem('approvedUsers', JSON.stringify(localApprovedUsers));
                }
            } else {
                // For production, update in database
            await User.update(editingUser.id, userData);
            }
            
            toast.success('User updated successfully!');
            setShowForm(false);
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
            toast.error('Failed to save user.');
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

    // Component to show accessible pages for localhost only
    const AccessiblePages = ({ user }) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isLocalhost) return null;
        
        const accessiblePages = getRolePermissions(user.user_role);
        
        return (
            <div className="mt-2">
                <div className="text-xs font-medium text-gray-600 mb-1">Page Access:</div>
                <div className="flex flex-wrap gap-1">
                    {allPages.map(page => (
                        <span
                            key={page}
                            className={`text-xs px-2 py-1 rounded ${
                                accessiblePages.includes(page)
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                        >
                            {page}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    if (showForm && (editingUser || editingPendingUser)) {
        return (
            <UserEditForm
                user={editingUser || editingPendingUser}
                onSave={editingUser ? handleSaveUser : handleSavePendingUser}
                onCancel={() => { 
                    setShowForm(false); 
                    setEditingUser(null); 
                    setEditingPendingUser(null); 
                }}
                onDelete={handleDeleteUser}
            />
        );
    }

    // Role Configuration Modal for localhost only
    if (showRoleConfig && editingRole) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalhost) return null;

        const togglePage = (page) => {
            setSelectedPages(prev => 
                prev.includes(page) 
                    ? prev.filter(p => p !== page)
                    : [...prev, page]
            );
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Configure Permissions for {editingRole}</h2>
                    
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">Select which pages this role can access:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {allPages.map(page => (
                                <label key={page} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPages.includes(page)}
                                        onChange={() => togglePage(page)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{page}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRoleConfig(false);
                                setEditingRole(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleSaveRoleConfig(editingRole, selectedPages)}
                            style={{ backgroundColor: '#5E0F68' }}
                        >
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard Widgets Configuration Modal for localhost only
    if (showWidgetConfig && editingWidgetRole) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocalhost) return null;

        const toggleWidget = (widget) => {
            setSelectedWidgets(prev => 
                prev.includes(widget) 
                    ? prev.filter(w => w !== widget)
                    : [...prev, widget]
            );
        };

        const maxWidgets = roleWidgetLimits[editingWidgetRole] || 9;
        const canAddMore = selectedWidgets.length < maxWidgets;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Configure Dashboard Widgets for {editingWidgetRole}</h2>
                    
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                            Select which dashboard widgets this role can see. Maximum: {maxWidgets} widgets.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {allDashboardWidgets.map(widget => {
                                const isSelected = selectedWidgets.includes(widget);
                                const canSelect = isSelected || canAddMore;
                                
                                return (
                                    <label 
                                        key={widget} 
                                        className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${
                                            !canSelect ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleWidget(widget)}
                                            disabled={!canSelect}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">{widget}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {!canAddMore && (
                            <p className="text-sm text-red-600 mt-2">
                                Maximum {maxWidgets} widgets allowed for {editingWidgetRole} role.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowWidgetConfig(false);
                                setEditingWidgetRole(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleSaveWidgetConfig(editingWidgetRole, selectedWidgets)}
                            style={{ backgroundColor: '#5E0F68' }}
                        >
                            Save Widget Configuration
                        </Button>
                    </div>
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
                    
                    {/* Debug button for localhost */}
                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                        <div className="mt-4">
                            <Button 
                                onClick={() => {
                                    const testUser = {
                                        id: Date.now().toString(),
                                        email: 'test@example.com',
                                        full_name: 'Test User',
                                        user_role: 'Staff',
                                        approval_status: 'pending',
                                        department: 'IT',
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    };
                                    
                                    const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                                    pendingUsers.push(testUser);
                                    localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
                                    
                                    // Reload users to update the display
                                    loadUsers();
                                    
                                    console.log('✅ Created test pending user:', testUser);
                                    toast.success('Test pending user created!');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Create Test Pending User
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'approved'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Approved Users ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'pending'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Pending Approval ({pendingUsers.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('roles')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'roles'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Role Configuration
                            </button>
                            <button
                                onClick={() => setActiveTab('widgets')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'widgets'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Dashboard Widgets
                            </button>
                        </nav>
                    </div>
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
                                    <TableRow>
                                        <TableCell colSpan="6">Loading users...</TableCell>
                                    </TableRow>
                                ) : activeTab === 'roles' ? (
                                    // Role Configuration Tab (localhost only)
                                    <TableRow>
                                        <TableCell colSpan="6">
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold mb-4">Configure Role Permissions</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {availableRoles.map(role => (
                                                        <Card key={role} className="p-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-medium">{role}</h4>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleEditRole(role)}
                                                                >
                                                                    Configure
                                                                </Button>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {getRolePermissions(role).length} pages accessible
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {getRolePermissions(role).slice(0, 3).map(page => (
                                                                    <span key={page} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                                        {page}
                                                                    </span>
                                                                ))}
                                                                {getRolePermissions(role).length > 3 && (
                                                                    <span className="text-xs text-gray-500">
                                                                        +{getRolePermissions(role).length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : activeTab === 'widgets' ? (
                                    // Dashboard Widgets Tab (localhost only)
                                    <TableRow>
                                        <TableCell colSpan="6">
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold mb-4">Configure Dashboard Widgets</h3>
                                                <p className="text-sm text-gray-600 mb-6">
                                                    Select which dashboard widgets each role can see. Staff level gets 8 widgets, others get 9.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {availableRoles.map(role => (
                                                        <Card key={role} className="p-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-medium">{role}</h4>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleEditWidgetRole(role)}
                                                                >
                                                                    Configure
                                                                </Button>
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {getRoleWidgetPermissions(role).length} widgets visible
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {getRoleWidgetPermissions(role).slice(0, 3).map(widget => (
                                                                    <span key={widget} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                        {widget}
                                                                    </span>
                                                                ))}
                                                                {getRoleWidgetPermissions(role).length > 3 && (
                                                                    <span className="text-xs text-gray-500">
                                                                        +{getRoleWidgetPermissions(role).length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : activeTab === 'approved' ? (
                                    users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.user_role}</TableCell>
                                            <TableCell>{user.department}</TableCell>
                                            <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : activeTab === 'pending' ? (
                                    (() => {
                                        console.log('🔍 Rendering pending tab:', {
                                            activeTab,
                                            pendingUsersCount: pendingUsers.length,
                                            pendingUsers: pendingUsers
                                        });
                                        return pendingUsers.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.full_name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.user_role}</TableCell>
                                                <TableCell>{user.department}</TableCell>
                                                <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="sm" variant="outline" onClick={() => handleEditPendingUser(user)}>Edit</Button>
                                                        <Button size="sm" variant="default" onClick={() => handleApproveUser(user)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleRejectUser(user)}>Reject</Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })()
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan="6">No data available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}