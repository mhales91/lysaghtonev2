import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";
import GlobalSearch from "@/components/layout/GlobalSearch";
import { UserProvider } from '@/contexts/UserContext';
import { getUserAccessiblePages, canAccessUserManagement } from '@/utils/permissions';
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

const allNavigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "AI Assistant", url: createPageUrl("AIAssistant"), icon: Sparkles },
  { title: "CRM Pipeline", url: createPageUrl("CRM"), icon: Users },
  { title: "TOE Manager", url: createPageUrl("TOEManager"), icon: FileText },
  { title: "Projects", url: createPageUrl("Projects"), icon: FolderOpen },
  { title: "Timesheets", url: createPageUrl("Timesheets"), icon: Clock },
  { title: "Lysaght AI", url: createPageUrl("LysaghtAI"), icon: Briefcase },
  { title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
  { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
  { title: "Task Templates", url: createPageUrl("TaskTemplates"), icon: List },
  { title: "Company Settings", url: createPageUrl("AdminSettings"), icon: Settings }
];

const adminNavigationItems = [
  { title: "User Management", url: createPageUrl("UserManagement"), icon: Users },
  { title: "AI Assistant Manager", url: createPageUrl("AIAssistantManager"), icon: Cog },
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
  const [navRefreshTrigger, setNavRefreshTrigger] = useState(0);
  const [canAccessUserMgmt, setCanAccessUserMgmt] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();

        // Auto-approve existing users who don't have an approval_status set
        if (!user.approval_status || user.approval_status === null || user.approval_status === undefined) {
          console.log("Auto-approving user:", user.email);
          await User.update(user.id, {
            approval_status: 'approved',
            approved_by: 'system',
            approved_date: new Date().toISOString()
          });
          user.approval_status = 'approved';
        }

        setCurrentUser(user);

        // Load user's accessible pages from database
        const accessiblePages = await getUserAccessiblePages(user.id);
        console.log('User accessible pages:', accessiblePages);
        
        // Filter navigation items based on accessible pages
        const filteredNav = allNavigationItems.filter(item => 
          accessiblePages.includes(item.title)
        );
        setVisibleNavItems(filteredNav);

        // Check if user can access user management
        const canAccess = canAccessUserManagement(user.user_role);
        setCanAccessUserMgmt(canAccess);

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

    fetchUser();
  }, []);

  // Refresh navigation when permissions might have changed
  useEffect(() => {
    const refreshNavigation = async () => {
      if (currentUser) {
        try {
          const accessiblePages = await getUserAccessiblePages(currentUser.id);
          console.log('Refreshed accessible pages:', accessiblePages);
          
          const filteredNav = allNavigationItems.filter(item => 
            accessiblePages.includes(item.title)
          );
          setVisibleNavItems(filteredNav);

          const canAccess = await canAccessUserManagement(currentUser.id);
          setCanAccessUserMgmt(canAccess);
        } catch (error) {
          console.error('Error refreshing navigation:', error);
        }
      }
    };

    refreshNavigation();
  }, [navRefreshTrigger, currentUser]);

  // Listen for permission changes
  useEffect(() => {
    const handlePermissionChange = () => {
      setNavRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('permissionsChanged', handlePermissionChange);
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  };

  if (isAuthLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!currentUser) {
    return <PageLoadingSkeleton />;
  }

  const isAdmin = currentUser.user_role === 'Admin' || currentUser.user_role === 'Director';

  return (
    <UserProvider currentUser={currentUser}>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
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

              {(isAdmin || canAccessUserMgmt) && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-2 py-3" style={{ color: 'var(--lysaght-text-light)' }}>
                    Admin
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminNavigationItems.map((item) => (
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

            <SidebarFooter className="p-4 border-t" style={{ borderColor: 'var(--lysaght-border)' }}>
              <Card className="bg-gray-50 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                      {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentUser.user_role || 'Staff'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b px-6 py-4" style={{ borderColor: 'var(--lysaght-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden" />
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--lysaght-text)' }}>
                    {currentPageName || 'Dashboard'}
                  </h1>
                </div>
                <GlobalSearch />
              </div>
            </header>

            <main className="flex-1 overflow-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </UserProvider>
  );
};

export default ProtectedLayout;
