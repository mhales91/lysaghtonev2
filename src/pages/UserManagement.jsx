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
import { canAccessUserManagement, setGlobalRoleConfigs } from '@/utils/permissions';
import { useUser } from '@/contexts/UserContext';

export default function UserManagementPage() {
    const { currentUser } = useUser();
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

    // Check if user has permission to access User Management
    if (!currentUser || !canAccessUserManagement(currentUser.user_role)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Card className="w-full max-w-md mx-auto">
                    <CardContent className="text-center p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-4">
                            You don't have permission to access User Management. Please contact your administrator.
                        </p>
                        <Button onClick={() => window.history.back()} className="w-full">
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
        console.log('Loading role configs from localStorage...');
        const saved = localStorage.getItem('roleConfigs');
        if (saved) {
            try {
                const roleConfigs = JSON.parse(saved);
                console.log('Loaded role configs from localStorage:', roleConfigs);
                setRoleConfigs(roleConfigs);
                // Also update global configs
                setGlobalRoleConfigs(roleConfigs);
            } catch (error) {
                console.warn('Error parsing roleConfigs from localStorage:', error);
                loadDefaultConfigs();
            }
        } else {
            console.log('No saved role configs found, loading defaults');
            loadDefaultConfigs();
        }
    };

    const loadDefaultConfigs = () => {
        // Default configurations
        const defaultConfigs = {
            'Admin': allPages,
            'Director': allPages,
            'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
            'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
            'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
        };
        console.log('Loading default configs:', defaultConfigs);
        setRoleConfigs(defaultConfigs);
        setGlobalRoleConfigs(defaultConfigs);
        localStorage.setItem('roleConfigs', JSON.stringify(defaultConfigs));
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
                const defaultWidgets = {
                    'Admin': allDashboardWidgets,
                    'Director': allDashboardWidgets,
                    'Manager': allDashboardWidgets,
                    'Staff': allDashboardWidgets.slice(0, 8),
                    'Client': allDashboardWidgets.slice(0, 6)
                };
                setWidgetConfigs(defaultWidgets);
                localStorage.setItem('widgetConfigs', JSON.stringify(defaultWidgets));
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
                
                console.log('📊 Production user data loaded:', usersData);
                
                const approvedUsers = usersData.filter(user => user.approval_status === 'approved');
                const pendingUsersData = usersData.filter(user => user.approval_status === 'pending');
                
                console.log('✅ Setting approved users:', approvedUsers);
                console.log('⏳ Setting pending users:', pendingUsersData);
                
                setUsers(approvedUsers);
                setPendingUsers(pendingUsersData);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveUser = async (user) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // For localhost, move from pending to approved in localStorage
                const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                const updatedPendingUsers = pendingUsers.filter(u => u.id !== user.id);
                localStorage.setItem('pendingUsers', JSON.stringify(updatedPendingUsers));
                
                const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
                const updatedUser = { ...user, approval_status: 'approved', approved_by: 'admin', approved_date: new Date().toISOString() };
                approvedUsers.push(updatedUser);
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

    const handleSavePendingUser = async (userData) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // For localhost, update in localStorage
                const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
                const updatedPendingUsers = pendingUsers.map(u => 
                    u.id === editingPendingUser.id 
                        ? { ...u, ...userData, updated_at: new Date().toISOString() }
                        : u
                );
                localStorage.setItem('pendingUsers', JSON.stringify(updatedPendingUsers));
            } else {
                // For production, update in database
                await User.update(editingPendingUser.id, userData);
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
        console.log('Editing role:', role);
        const currentPermissions = getRolePermissions(role);
        console.log('Current permissions for', role, ':', currentPermissions);
        setEditingRole(role);
        setSelectedPages(currentPermissions);
        setShowRoleConfig(true);
    };

    const handleSaveRoleConfig = (role, selectedPages) => {
        console.log('Saving role config for:', role, 'with pages:', selectedPages);
        
        // Always update the role configs state
        const updatedConfigs = {
            ...roleConfigs,
            [role]: selectedPages
        };
        console.log('Updated configs:', updatedConfigs);
        
        setRoleConfigs(updatedConfigs);
        
        // Update global role configs so other components can see the changes
        setGlobalRoleConfigs(updatedConfigs);
        
        // Always save to localStorage regardless of environment
        localStorage.setItem('roleConfigs', JSON.stringify(updatedConfigs));
        console.log('Saved to localStorage:', JSON.stringify(updatedConfigs));
        console.log('Role permissions updated for session:', role, selectedPages);
        
        toast.success(`Role permissions updated for ${role}`);
        setShowRoleConfig(false);
        setEditingRole(null);
        
        // Trigger navigation refresh
        window.dispatchEvent(new CustomEvent('permissionsChanged'));
    };

    // Delete user function for localhost only
    const handleDeleteUser = async (user) => {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                // For localhost, remove from localStorage
                const localApprovedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
                const updatedUsers = localApprovedUsers.filter(u => u.id !== user.id);
                localStorage.setItem('approvedUsers', JSON.stringify(updatedUsers));
            } else {
                // For production, delete from database
                await User.delete(user.id);
            }
            
            toast.success('User deleted successfully');
            loadUsers(); // Reload to update the lists
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user');
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
            />
        );
    }

    // Role Configuration Modal
    if (showRoleConfig && editingRole) {
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
                    <p className="text-gray-600 mb-6">Select which pages this role can access:</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {allPages.map(page => (
                            <label key={page} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPages.includes(page)}
                                    onChange={() => togglePage(page)}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-gray-700">{page}</span>
                            </label>
                        ))}
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

    // Dashboard Widgets Configuration Modal
    if (showWidgetConfig && editingWidgetRole) {

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
                    <p className="text-gray-600 mb-6">Select which widgets this role can see on the dashboard (max {maxWidgets}):</p>
                    
                    <div className="grid grid-cols-1 gap-4 mb-6">
                        {allDashboardWidgets.map(widget => {
                            const isSelected = selectedWidgets.includes(widget);
                            const canSelect = isSelected || canAddMore;
                            
                            return (
                                <label key={widget} className={`flex items-center space-x-3 cursor-pointer ${!canSelect ? 'opacity-50' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={!canSelect}
                                        onChange={() => toggleWidget(widget)}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{widget}</span>
                                </label>
                            );
                        })}
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
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-600">Approve, manage, and assign roles to users.</p>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('approved')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'approved'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Approved Users ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'pending'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Pending Approval ({pendingUsers.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('roles')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'roles'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Role Configuration
                            </button>
                            <button
                                onClick={() => setActiveTab('widgets')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'widgets'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Dashboard Widgets
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <span className="ml-2 text-gray-600">Loading users...</span>
                            </div>
                        ) : activeTab === 'approved' ? (
                            <div className="space-y-4">
                                {users.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No approved users found.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={user.user_role}
                                                            onValueChange={(value) => {
                                                                const updatedUser = { ...user, user_role: value };
                                                                handleSaveUser(updatedUser);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-32">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableRoles.map(role => (
                                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setShowForm(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        ) : activeTab === 'pending' ? (
                            <div className="space-y-4">
                                {pendingUsers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No pending users found.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={user.user_role}
                                                            onValueChange={(value) => {
                                                                const updatedUser = { ...user, user_role: value };
                                                                handleSavePendingUser(updatedUser);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-32">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availableRoles.map(role => (
                                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(user.approval_status)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleApproveUser(user)}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRejectUser(user)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEditingPendingUser(user);
                                                                    setShowForm(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        ) : activeTab === 'roles' ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availableRoles.map(role => {
                                        const permissions = getRolePermissions(role);
                                        return (
                                            <Card key={role} className="p-4">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-lg">{role}</CardTitle>
                                                    <CardDescription>
                                                        {permissions.length} pages accessible
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        {permissions.slice(0, 3).map(page => (
                                                            <div key={page} className="text-sm text-gray-600">
                                                                {page}
                                                            </div>
                                                        ))}
                                                        {permissions.length > 3 && (
                                                            <div className="text-sm text-gray-500">
                                                                +{permissions.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-4 w-full"
                                                        onClick={() => handleEditRole(role)}
                                                    >
                                                        Configure
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : activeTab === 'widgets' ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availableRoles.map(role => {
                                        const widgets = getRoleWidgetPermissions(role);
                                        return (
                                            <Card key={role} className="p-4">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-lg">{role}</CardTitle>
                                                    <CardDescription>
                                                        {widgets.length} widgets accessible
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        {widgets.slice(0, 3).map(widget => (
                                                            <div key={widget} className="text-sm text-gray-600">
                                                                {widget}
                                                            </div>
                                                        ))}
                                                        {widgets.length > 3 && (
                                                            <div className="text-sm text-gray-500">
                                                                +{widgets.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-4 w-full"
                                                        onClick={() => handleEditWidgetRole(role)}
                                                    >
                                                        Configure
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}