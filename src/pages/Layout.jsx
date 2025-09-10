import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";
import GlobalSearch from "@/components/layout/GlobalSearch";
import { UserProvider } from '@/contexts/UserContext';
import { canAccessUserManagement, hasPermission, loadAllRolePermissions } from '@/utils/permissions';
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
  Upload
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
import { useEffect, useState } from 'react';
import { PageLoadingSkeleton } from '@/components/ui/loading-states';

// Navigation items without hardcoded roles - permissions will be checked dynamically
const allNavigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "AI Assistant", url: createPageUrl("AIAssistant"), icon: Sparkles },
  { title: "CRM Pipeline", url: createPageUrl("CRM"), icon: Users },
  { title: "TOE Manager", url: createPageUrl("TOEManager"), icon: FileText },
  { title: "Projects", url: createPageUrl("Projects"), icon: FolderOpen },
  { title: "Timesheets", url: createPageUrl("Timesheets"), icon: Clock },
  { title: "Lysaght AI", url: createPageUrl("LysaghtAI"), icon: Sparkles },
  { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
  { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
];

const adminNavigationItems = [
  { title: "Task Templates", url: createPageUrl("TaskTemplates"), icon: List },
  { title: "Company Settings", url: createPageUrl("AdminSettings"), icon: Cog },
  { title: "User Management", url: createPageUrl("UserManagement"), icon: Briefcase },
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
  const [visibleAdminItems, setVisibleAdminItems] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [navRefreshTrigger, setNavRefreshTrigger] = useState(0);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Function to filter navigation items based on user permissions
  const filterNavigationItems = (userRole) => {
    if (!userRole) return { navItems: [], adminItems: [] };

    // Filter main navigation items based on permissions
    const navItems = allNavigationItems.filter(item => 
      hasPermission(userRole, item.title)
    );

    // Filter admin navigation items based on permissions
    const adminItems = adminNavigationItems.filter(item => 
      hasPermission(userRole, item.title)
    );

    return { navItems, adminItems };
  };

  // Load permissions from database on app startup
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        console.log('Loading permissions from database...');
        await loadAllRolePermissions();
        console.log('Permissions loaded successfully');
        setPermissionsLoaded(true);
      } catch (error) {
        console.error('Failed to load permissions from database:', error);
        // Still set permissions loaded to true to prevent infinite loading
        setPermissionsLoaded(true);
      }
    };

    loadPermissions();
  }, []);

  // Load user data and set up navigation
  useEffect(() => {
    const loadUserAndNavigation = async () => {
      if (!permissionsLoaded) {
        console.log('Waiting for permissions to load...');
        return;
      }
      
      try {
        console.log('Loading user data from database...');
        const user = await User.me();
        console.log('Loaded user from database:', user);

        // Auto-approve existing users who don't have an approval_status set
        if (!user.approval_status || user.approval_status === null || user.approval_status === undefined) {
          try {
            await User.updateMyUserData({
              approval_status: 'approved',
              approved_by: 'system',
              approved_date: new Date().toISOString()
            });
            user.approval_status = 'approved';
            console.log('Auto-approved user');
          } catch (updateError) {
            console.error('Failed to auto-approve existing user:', updateError);
          }
        }

        if (user.approval_status !== 'approved') {
          console.log('User not approved, showing pending screen');
          setCurrentUser({ ...user, isPendingApproval: true });
          setIsAuthLoading(false);
          return;
        }

        setCurrentUser(user);

        const userRole = user.user_role || 'Staff';
        console.log('Using user role for navigation:', userRole);
        
        const { navItems, adminItems } = filterNavigationItems(userRole);
        console.log('Filtered navigation items:', { 
          navItems: navItems.map(item => item.title), 
          adminItems: adminItems.map(item => item.title) 
        });
        
        setVisibleNavItems(navItems);
        setVisibleAdminItems(adminItems);

      } catch (e) {
        console.log("ProtectedLayout: Authentication error:", e.message);
        console.log("Full error details:", e);
        // Redirect to login page instead of showing error
        window.location.href = '/login';
        return;
      } finally {
        setIsAuthLoading(false);
      }
    };
    
    loadUserAndNavigation();
  }, [permissionsLoaded]);

  // Refresh navigation when permissions might have changed
  useEffect(() => {
    if (currentUser && permissionsLoaded) {
      const userRole = currentUser.user_role || 'Staff';
      const { navItems, adminItems } = filterNavigationItems(userRole);
      setVisibleNavItems(navItems);
      setVisibleAdminItems(adminItems);
    }
  }, [navRefreshTrigger, currentUser, permissionsLoaded]);

  // Listen for permission changes
  useEffect(() => {
    const handlePermissionChange = () => {
      setNavRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('permissionsChanged', handlePermissionChange);
    return () => window.removeEventListener('permissionsChanged', handlePermissionChange);
  }, []);

  const isAdmin = currentUser?.user_role === 'Admin' || currentUser?.user_role === 'Director';
  const canAccessUserMgmt = currentUser ? canAccessUserManagement(currentUser.user_role) : false;

  if (isAuthLoading || !permissionsLoaded) {
    return <PageLoadingSkeleton title="Loading..." />;
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

              {visibleAdminItems.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-2 py-3" style={{ color: 'var(--lysaght-text-light)' }}>
                    Admin
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleAdminItems.map((item) => (
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
              )}
            </SidebarContent>

            <SidebarFooter className="border-t p-6" style={{ borderColor: 'var(--lysaght-border)' }}>
              <div className="flex items-center gap-3 mb-3">
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
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    await User.logout();
                    // Clear any localStorage data
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('pendingUsers');
                    localStorage.removeItem('approvedUsers');
                    // Redirect to login
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Logout error:', error);
                    // Force redirect even if logout fails
                    window.location.href = '/login';
                  }
                }}
              >
                Sign Out
              </Button>
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
                <UserProvider currentUser={currentUser}>
                  {children}
                </UserProvider>
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