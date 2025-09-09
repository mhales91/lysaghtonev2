

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";
import GlobalSearch from "@/components/layout/GlobalSearch";
import Login from "./Login";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
  Clock,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  Building2,
  List,
  Cog,
  Briefcase,
  Sparkles,
  BookText,
  DollarSign,
  Upload,
  LogOut,
  Bot
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from '@/api/entities';
import { supabase } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';
import { PageLoadingSkeleton } from '@/components/ui/loading-states';

const allNavigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "AI Assistant", url: createPageUrl("AIAssistant"), icon: Sparkles, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "CRM Pipeline", url: createPageUrl("CRM"), icon: Users, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "TOE Manager", url: createPageUrl("TOEManager"), icon: FileText, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "Projects", url: createPageUrl("Projects"), icon: FolderOpen, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "Timesheets", url: createPageUrl("Timesheets"), icon: Clock, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "Lysaght AI", url: createPageUrl("LysaghtAI"), icon: Sparkles, roles: ["Staff", "Manager", "DeptLead", "Director", "Admin"] },
  { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard, roles: ["Manager", "DeptLead", "Director", "Admin"] },
  { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3, roles: ["Director", "Admin"] },
];

const adminNavigationItems = [
  { title: "Task Templates", url: createPageUrl("TaskTemplates"), icon: List },
  { title: "Company Settings", url: createPageUrl("AdminSettings"), icon: Cog },
  { title: "User Management", url: createPageUrl("UserManagement"), icon: Briefcase },
  { title: "AI Assistant Manager", url: createPageUrl("AIAssistantManager"), icon: Bot },
  { title: "Billing Settings", url: createPageUrl("BillingAdmin"), icon: DollarSign },
  { title: "Analytics Settings", url: createPageUrl("AnalyticsSettings"), icon: Settings },
  { title: "Prompt Library", url: createPageUrl("PromptLibraryManager"), icon: BookText },
  { title: "TOE Admin", url: createPageUrl("TOEAdmin"), icon: FileText },
  { title: "Import Jobs", url: createPageUrl("JobsImport"), icon: Upload }
];

const ProtectedLayout = ({ children, currentPageName }) => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleNavItems, setVisibleNavItems] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if we're on localhost and have a current user in localStorage
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalhost) {
          const localUser = localStorage.getItem('currentUser');
          if (localUser) {
            // User is logged in via localStorage (new localhost user)
            const user = JSON.parse(localUser);
            setCurrentUser(user);
            
            // For localhost users, use role-based page permissions from localStorage
            const roleConfigs = JSON.parse(localStorage.getItem('roleConfigs') || '{}');
            const userRole = user.user_role || 'Staff';
            
            // If role has a specific configuration, use it; otherwise use default
            let allowedPages = [];
            if (roleConfigs[userRole] && roleConfigs[userRole].length > 0) {
                allowedPages = roleConfigs[userRole];
            } else {
                // Fallback to default configuration
                const defaultPermissions = {
                    'Admin': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings', 'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library', 'TOE Admin', 'Import Jobs'],
                    'Director': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings', 'User Management', 'AI Assistant Manager', 'Billing Settings', 'Analytics Settings', 'Prompt Library', 'TOE Admin', 'Import Jobs'],
                    'Manager': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics', 'Task Templates', 'Company Settings'],
                    'Staff': ['Dashboard', 'AI Assistant', 'CRM Pipeline', 'TOE Manager', 'Projects', 'Timesheets', 'Lysaght AI', 'Billing', 'Analytics'],
                    'Client': ['Dashboard', 'Projects', 'Timesheets', 'Billing']
                };
                allowedPages = defaultPermissions[userRole] || [];
            }
            
            // Map navigation titles to role configuration page names
            const titleToPageMap = {
              'Dashboard': 'Dashboard',
              'AI Assistant': 'AI Assistant', // Keep AI Assistant separate
              'CRM Pipeline': 'CRM Pipeline',
              'TOE Manager': 'TOE Manager',
              'Projects': 'Projects',
              'Timesheets': 'Timesheets',
              'Lysaght AI': 'Lysaght AI', // Keep Lysaght AI separate
              'Billing': 'Billing',
              'Analytics': 'Analytics',
              'AI Assistant Manager': 'AI Assistant Manager'
            };
            
            // Filter navigation items based on allowed pages
            const filteredNav = allNavigationItems.filter(item => {
              const pageName = titleToPageMap[item.title] || item.title;
              const isAllowed = allowedPages.includes(pageName);
              console.log(`Navigation item "${item.title}" (${pageName}): ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
              return isAllowed;
            });
            
            console.log('Localhost user navigation filtering:', {
              userRole,
              allowedPages,
              roleConfigs,
              allNavItems: allNavigationItems.map(item => item.title),
              filteredNav: filteredNav.map(item => item.title)
            });
            
            setVisibleNavItems(filteredNav);
            setIsAuthLoading(false);
            return;
          } else {
            // No localStorage user, try Supabase authentication for database users
            try {
              const user = await User.me();
              
              // Auto-approve existing users who don't have an approval_status set
              if (!user.approval_status || user.approval_status === null || user.approval_status === undefined) {
                try {
                  await User.updateMyUserData({
                    approval_status: 'approved',
                    approved_by: 'system',
                    approved_date: new Date().toISOString()
                  });
                  user.approval_status = 'approved';
                } catch (updateError) {
                  console.error('Failed to auto-approve existing user:', updateError);
                }
              }

              if (user.approval_status !== 'approved') {
                setCurrentUser({ ...user, isPendingApproval: true });
                setIsAuthLoading(false);
                return;
              }

              setCurrentUser(user);

              const userRole = user.user_role || 'Staff';
              const filteredNav = allNavigationItems.filter(item => item.roles.includes(userRole));
              setVisibleNavItems(filteredNav);
              setIsAuthLoading(false);
              return;
            } catch (supabaseError) {
              // No Supabase user found either, show login page
              console.log("ProtectedLayout: No localhost user found, showing login page...");
              setAuthError('Authentication required');
              setIsAuthLoading(false);
              return;
            }
          }
        }

        // Production: Use Supabase authentication
        const user = await User.me();

        // Auto-approve existing users who don't have an approval_status set
        if (!user.approval_status || user.approval_status === null || user.approval_status === undefined) {
          try {
            await User.updateMyUserData({
              approval_status: 'approved',
              approved_by: 'system',
              approved_date: new Date().toISOString()
            });
            user.approval_status = 'approved';
          } catch (updateError) {
            console.error('Failed to auto-approve existing user:', updateError);
          }
        }

        if (user.approval_status !== 'approved') {
          setCurrentUser({ ...user, isPendingApproval: true });
          setIsAuthLoading(false);
          return;
        }

        setCurrentUser(user);

        const userRole = user.user_role || 'Staff';
        
        // Check if we're on localhost and have role configurations
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          const roleConfigs = JSON.parse(localStorage.getItem('roleConfigs') || '{}');
          const allowedPages = roleConfigs[userRole] || [];
          
          if (allowedPages.length > 0) {
            // Use localStorage role configurations
            const titleToPageMap = {
              'Dashboard': 'Dashboard',
              'AI Assistant': 'AI Assistant',
              'CRM Pipeline': 'CRM Pipeline',
              'TOE Manager': 'TOE Manager',
              'Projects': 'Projects',
              'Timesheets': 'Timesheets',
              'Lysaght AI': 'Lysaght AI',
              'Billing': 'Billing',
              'Analytics': 'Analytics'
            };
            
            const filteredNav = allNavigationItems.filter(item => {
              const pageName = titleToPageMap[item.title] || item.title;
              return allowedPages.includes(pageName);
            });
            
            console.log('Database user with localStorage role configs:', {
              userRole,
              allowedPages,
              filteredNav: filteredNav.map(item => item.title)
            });
            
            setVisibleNavItems(filteredNav);
            setIsAuthLoading(false);
            return;
          }
        }
        
        // Fallback to hardcoded role-based filtering
        const filteredNav = allNavigationItems.filter(item => item.roles.includes(userRole));
        setVisibleNavItems(filteredNav);

      } catch (e) {
        console.log("ProtectedLayout: Not logged in, showing login page...", e.message);
        setAuthError('Authentication required');
        // Don't auto-redirect, show login page instead
      } finally {
        setIsAuthLoading(false);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = currentUser?.user_role === 'Admin' || currentUser?.user_role === 'Director';

  // Fetch pending users count when user is loaded and is admin
  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchPendingUsersCount();
    }
  }, [currentUser, isAdmin]);

  const handleLogout = async () => {
    try {
      // Check if we're on localhost
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        // For localhost, clear localStorage and try Supabase logout (in case it's a database user)
        localStorage.removeItem('currentUser');
        try {
          await supabase.auth.signOut();
        } catch (supabaseError) {
          // Ignore Supabase logout errors on localhost
        }
        window.location.reload();
      } else {
        // For production, use Supabase logout
        await supabase.auth.signOut();
        window.location.reload();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchPendingUsersCount = async () => {
    try {
      // For localhost, check localStorage for pending users
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const pendingUsers = JSON.parse(localStorage.getItem('pendingUsers') || '[]');
        setPendingUsersCount(pendingUsers.length);
      } else {
        // For production, use database
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('approval_status', 'pending');
        
        if (!error && data) {
          setPendingUsersCount(data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching pending users count:', error);
    }
  };

  if (isAuthLoading) {
    return <PageLoadingSkeleton title="Authenticating..." />;
  }

  if (authError) {
    return <Login />;
  }

  // Show pending approval screen
  if (currentUser?.isPendingApproval) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Pending Approval</h2>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully. Please wait for an administrator to approve your access to the Lysaght One platform.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p><strong>Name:</strong> {currentUser.full_name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Status:</strong> {currentUser.approval_status}</p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await User.logout();
                window.location.reload();
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <style>
          {`
            :root {
              --lysaght-primary: #5E0F68;
              --lysaght-primary-light: #7B1E7E;
              --lysaght-background: #faf9fb;
              --lysaght-surface: #ffffff;
              --lysaght-border: #e5e7eb;
              --lysaght-text: #1f2937;
              --lysaght-text-light: #6b7280;
            }
          `}
        </style>
        <div className="min-h-screen flex w-full" style={{ backgroundColor: 'var(--lysaght-background)' }}>
          <Sidebar className="border-r" style={{ borderColor: 'var(--lysaght-border)' }}>
            <SidebarHeader className="border-b p-6" style={{ borderColor: 'var(--lysaght-border)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: 'var(--lysaght-primary)' }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--lysaght-text)' }}>
                    Lysaght One
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--lysaght-text-light)' }}>
                    Operations Platform
                  </p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-2 py-3" style={{ color: 'var(--lysaght-text-light)' }}>
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`
                            transition-all duration-200 rounded-xl mb-1
                            ${location.pathname === item.url ? 'bg-purple-600 text-white font-medium' : 'hover:bg-purple-100'}
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {isAdmin && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-2 py-3" style={{ color: 'var(--lysaght-text-light)' }}>
                    Admin
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {(() => {
                        // For localhost users, filter admin items based on role permissions
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                          const roleConfigs = JSON.parse(localStorage.getItem('roleConfigs') || '{}');
                          const userRole = currentUser?.user_role || 'Staff';
                          const allowedPages = roleConfigs[userRole] || [];
                          
                          // Map admin navigation titles to role configuration page names
                          const adminTitleToPageMap = {
                            'Task Templates': 'Task Templates',
                            'Company Settings': 'Company Settings',
                            'User Management': 'User Management',
                            'AI Assistant Manager': 'AI Assistant Manager',
                            'Billing Settings': 'Billing Settings',
                            'Analytics Settings': 'Analytics Settings',
                            'Prompt Library': 'Prompt Library',
                            'TOE Admin': 'TOE Admin',
                            'Import Jobs': 'Import Jobs'
                          };
                          
                          const filteredAdminItems = adminNavigationItems.filter(item => {
                            const pageName = adminTitleToPageMap[item.title] || item.title;
                            return allowedPages.includes(pageName);
                          });
                          
                          return filteredAdminItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                className={`transition-all duration-200 rounded-xl mb-1 ${location.pathname === item.url ? 'bg-purple-600 text-white font-medium' : 'hover:bg-purple-100'}`}
                              >
                                <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                  <item.icon className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-medium text-sm leading-tight">{item.title}</span>
                                  {item.title === 'User Management' && pendingUsersCount > 0 && (
                                    <span className="ml-auto bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                      {pendingUsersCount}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ));
                        } else {
                          // For production, show all admin items
                          return adminNavigationItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                className={`transition-all duration-200 rounded-xl mb-1 ${location.pathname === item.url ? 'bg-purple-600 text-white font-medium' : 'hover:bg-purple-100'}`}
                              >
                                <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                  <item.icon className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-medium text-sm leading-tight">{item.title}</span>
                                  {item.title === 'User Management' && pendingUsersCount > 0 && (
                                    <span className="ml-auto bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                      {pendingUsersCount}
                                    </span>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ));
                        }
                      })()}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </SidebarContent>

            <SidebarFooter className="border-t p-6" style={{ borderColor: 'var(--lysaght-border)' }}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: 'var(--lysaght-text-light)' }}
                  >
                    {currentUser?.full_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--lysaght-text)' }}>
                      {currentUser?.full_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--lysaght-text-light)' }}>
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  style={{ 
                    borderColor: 'var(--lysaght-border)',
                    color: 'var(--lysaght-text-light)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile header with search */}
            <header
              className="bg-white border-b px-6 py-4 md:hidden flex items-center gap-4"
              style={{ borderColor: 'var(--lysaght-border)' }}
            >
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--lysaght-text)' }}>
                Lysaght One
              </h1>
              <div className="flex-shrink-0">
                <GlobalSearch />
              </div>
            </header>

            {/* Desktop header with search - only show on larger screens */}
            <header className="bg-white border-b px-6 py-3 hidden md:flex items-center justify-end"
                    style={{ borderColor: 'var(--lysaght-border)' }}>
              <GlobalSearch />
            </header>

            {/* Main content area */}
            <div className="flex-1 overflow-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Toast notifications for better UX */}
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </SidebarProvider>
    </ErrorBoundary>
  );
};

export default function Layout({ children, currentPageName }) {
  const isPublicPage = currentPageName === 'TOESign';

  if (isPublicPage) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <style>
            {`
              :root {
                --lysaght-primary: #5E0F68;
                --lysaght-primary-light: #7B1E7E;
                --lysaght-background: #faf9fb;
                --lysaght-surface: #ffffff;
                --lysaght-border: #e5e7eb;
                --lysaght-text: #1f2937;
                --lysaght-text-light: #6b7280;
              }
            `}
          </style>

          {/* Minimal header for TOE signing */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold mr-3"
                style={{ backgroundColor: 'var(--lysaght-primary)' }}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-lg" style={{ color: 'var(--lysaght-text)' }}>
                  Lysaght Consultants Limited
                </h1>
                <p className="text-sm" style={{ color: 'var(--lysaght-text-light)' }}>
                  Terms of Engagement
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>

          <Toaster
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
        </div>
      </ErrorBoundary>
    );
  }

  return <ProtectedLayout currentPageName={currentPageName}>{children}</ProtectedLayout>;
}

