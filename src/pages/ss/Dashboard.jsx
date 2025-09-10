
import React, { useState, useEffect, useMemo } from "react";
import { 
  Project, 
  TimeEntry, 
  Invoice, 
  TOE, 
  Client,
  User,
  DashboardSettings,
  AnalyticsSetting
} from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth } from 'date-fns'; // Import date-fns utilities

// Import all widgets
import WeeklyTimesheetHours from "../components/dashboard/widgets/WeeklyTimesheetHours";
import YearlyBillableTracker from "../components/dashboard/widgets/YearlyBillableTracker";
import WorkloadWidget from "../components/dashboard/widgets/WorkloadWidget";
import CRMBoard from "../components/dashboard/widgets/CRMBoard";
import TOEBoard from "../components/dashboard/widgets/TOEBoard";
import SLATracker from "../components/dashboard/widgets/SLATracker";
import ProjectPortfolio from "../components/dashboard/widgets/ProjectPortfolio";
import UpcomingProjects from "../components/dashboard/widgets/UpcomingProjects";
import BudgetWidget from "../components/dashboard/widgets/BudgetWidget";
import { getNZFinancialYear } from '../components/utils/dateUtils';


export default function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [viewLevel, setViewLevel] = useState('staff');
  const [allUsers, setAllUsers] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [toes, setTOEs] = useState([]);
  const [dashboardSettings, setDashboardSettings] = useState(null);
  const [analyticsSettings, setAnalyticsSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date range state - default to current month for faster initial load
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  });

  useEffect(() => {
    // Load static, non-date-dependent data on initial mount
    const loadStaticData = async () => {
      // setIsLoading(true); // Already true by default
      try {
        const user = await User.me();
        setLoggedInUser(user);
        
        // Set default view level based on role
        const defaultLevel = user.user_role === 'Director' || user.user_role === 'Admin' ? 'director' :
                            user.user_role === 'Manager' || user.user_role === 'DeptLead' ? 'manager' : 'staff';
        setViewLevel(defaultLevel);

        const currentFY = getNZFinancialYear(new Date()).startDate.getFullYear();

        // Load static data concurrently, filtering for active items only to improve performance
        const [users, projectsData, clientsData, toesData, settingsList, analyticsSettingsList] = await Promise.all([
          User.list(),
          Project.filter({ status: { $ne: 'archived' } }, '-created_date'), // Only fetch non-archived projects
          Client.list(), // Keep fetching all clients as they are needed for project context
          TOE.filter({ status: { $ne: 'signed' } }, '-created_date'), // Only fetch non-signed TOEs
          DashboardSettings.list(),
          AnalyticsSetting.list()
        ]);

        setAllUsers(users);
        setProjects(projectsData || []);
        setClients(clientsData || []);
        setTOEs(toesData || []);
        setDashboardSettings(settingsList.length > 0 ? settingsList[0] : null);
        setAnalyticsSettings(analyticsSettingsList.length > 0 ? analyticsSettingsList[0] : null);

        const depts = [...new Set(users.map(u => u.department).filter(Boolean))];
        setAllDepartments(depts);

      } catch (error) {
        console.error('Error loading static dashboard data:', error);
        setIsLoading(false); // If static data fails, stop loading
      }
      // Note: isLoading is NOT set to false here. It will be handled by the time-sensitive loader
      // once loggedInUser is set and time-sensitive data is fetched. This ensures spinner until all initial data is ready.
    };
    
    loadStaticData();
  }, []); // Empty dependency array means this runs only once on component mount

  useEffect(() => {
    // Load time-sensitive data when date range changes or after loggedInUser is set by the static load
    if (!loggedInUser || !dateRange) { // Added check for !dateRange
      // Only proceed if loggedInUser is available and dateRange is set
      return;
    }

    const loadTimeSensitiveData = async () => {
      setIsLoading(true); // Set loading to true while fetching time-sensitive data
      try {
        // Add safety checks for dateRange properties
        const from = dateRange?.from ? new Date(dateRange.from) : null;
        const to = dateRange?.to ? new Date(dateRange.to) : null;

        if (from && to) {
          // Format dates to YYYY-MM-DD for backend filtering
          const fromDateStr = from.toISOString().split('T')[0];
          const toDateStr = to.toISOString().split('T')[0];
          
          // Use TimeEntry entity with service role client to bypass RLS
          const timeEntriesData = await TimeEntry.filter({
            start_time: {
              $gte: fromDateStr,
              $lte: toDateStr
            }
          });
          
          if (!timeEntriesData) {
            console.error('Error loading time entries');
            setTimeEntries([]);
          } else {
            setTimeEntries(timeEntriesData);
          }
        } else {
          setTimeEntries([]); // Clear time entries if date range is incomplete
        }
      } catch (error) {
        console.error('Error loading time entries for date range:', error);
      } finally {
        setIsLoading(false); // Always set loading to false after attempt (success or fail)
      }
    };

    loadTimeSensitiveData();
  }, [dateRange, loggedInUser]); // Reruns when dateRange or loggedInUser state changes

  // Filter data based on current view level and user role
  const contextualData = useMemo(() => {
    // Return empty data if loggedInUser is not yet available, to prevent errors in widgets
    if (!loggedInUser) return { projects: [], clients: [], timeEntries: [], users: [], toes: [] };

    const role = loggedInUser.user_role;
    const department = loggedInUser.department;
    const email = loggedInUser.email;

    let filteredUsers = allUsers;
    let filteredProjects = projects; // projects are already pre-filtered
    let filteredClients = clients;
    let filteredTimeEntries = timeEntries; // This `timeEntries` state is already date-filtered from the useEffect
    let filteredToes = toes; // toes are already pre-filtered

    if (viewLevel === 'staff') {
      // Staff sees their own data
      filteredTimeEntries = filteredTimeEntries.filter(te => te.user_email === email);
      filteredProjects = filteredProjects.filter(p => p.project_manager === email);
      filteredUsers = allUsers.filter(u => u.email === email);
      filteredToes = filteredToes.filter(t => t.created_by === email);
    } else if (viewLevel === 'manager') {
      // Manager sees their department's data
      const deptUsers = allUsers.filter(u => u.department === department);
      const deptEmails = deptUsers.map(u => u.email);
      
      filteredUsers = deptUsers;
      filteredTimeEntries = filteredTimeEntries.filter(te => deptEmails.includes(te.user_email));
      filteredProjects = filteredProjects.filter(p => 
        p.lead_department === department || deptEmails.includes(p.project_manager)
      );
      // Show clients where PM is in department OR client is unassigned
      filteredClients = clients.filter(c => deptEmails.includes(c.lead_pm) || c.lead_pm === null);
      // Show TOEs where creator is in department OR TOE is unassigned
      filteredToes = filteredToes.filter(t => deptEmails.includes(t.created_by) || t.created_by === null);
    } else if (viewLevel === 'director') {
      // Director sees everything (already pre-filtered for active items)
      filteredUsers = allUsers;
      filteredProjects = projects;
      filteredClients = clients;
      filteredTimeEntries = timeEntries;
      filteredToes = toes;
    }

    return {
      users: filteredUsers,
      projects: filteredProjects,
      clients: filteredClients,
      timeEntries: filteredTimeEntries,
      toes: filteredToes
    };
  }, [loggedInUser, allUsers, projects, clients, timeEntries, toes, viewLevel]);

  // Check if user can access a specific view level
  const canAccessLevel = (level) => {
    if (!loggedInUser) return false;
    const role = loggedInUser.user_role;
    
    if (level === 'staff') return true;
    if (level === 'manager') return ['Manager', 'DeptLead', 'Director', 'Admin'].includes(role);
    if (level === 'director') return ['Director', 'Admin'].includes(role);
    
    return false;
  };

  // Check if widget is enabled for current user role
  const isWidgetEnabled = (widgetKey) => {
    if (!dashboardSettings) return true; // Default to enabled if no settings are loaded
    
    const roleSettings = dashboardSettings.widget_permissions?.[loggedInUser?.user_role];
    if (!roleSettings) return true; // Default to enabled if no specific role settings are found
    
    return roleSettings[widgetKey] !== false; // Widget is enabled unless explicitly set to false
  };

  // Display loading spinner while data is being fetched (initial load or date range change)
  if (isLoading && !loggedInUser) { // Only show full page loader on very first load
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .director-card {
          background: #F9FAFB;
          border: 1px solid #F3F4F6;
        }
        .section-header {
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
      `}</style>
      
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
            />
            
            {/* View Level Toggle */}
            {(canAccessLevel('manager') || canAccessLevel('director')) && (
              <div>
                <Select value={viewLevel} onValueChange={setViewLevel}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff View</SelectItem>
                    {canAccessLevel('manager') && (
                      <SelectItem value="manager">Manager View</SelectItem>
                    )}
                    {canAccessLevel('director') && (
                      <SelectItem value="director">Director View</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* TIME LAYER */}
        <div className="section-header">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Time
          </h2>
        </div>
        <div className="dashboard-grid mb-8">
            {/* TL-1: Weekly Timesheet Hours */}
            {isWidgetEnabled('weeklyTimesheetHours') && (
              <div className="col-span-12 md:col-span-4">
                <WeeklyTimesheetHours 
                  timeEntries={contextualData.timeEntries}
                  currentUser={loggedInUser}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {/* TL-2: Yearly Billable Tracker */}
            {isWidgetEnabled('yearlyBillableTracker') && (
              <div className="col-span-12 md:col-span-4">
                <YearlyBillableTracker 
                  timeEntries={contextualData.timeEntries}
                  currentUser={loggedInUser}
                  isLoading={isLoading}
                />
              </div>
            )}
            
            {/* TL-3: Workload */}
            {isWidgetEnabled('workload') && (
              <div className={`col-span-12 md:col-span-4 ${viewLevel === 'director' ? 'director-card' : ''}`}>
                <WorkloadWidget 
                  users={contextualData.users}
                  projects={contextualData.projects}
                  timeEntries={contextualData.timeEntries}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>

        {/* LEADS */}
        <div className="section-header">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Leads
          </h2>
        </div>
        <div className="dashboard-grid mb-8">
            {/* LL-1: CRM Board */}
            {isWidgetEnabled('crmBoard') && (
              <div className="col-span-12 md:col-span-4">
                <CRMBoard 
                  clients={contextualData.clients}
                  projects={contextualData.projects}
                  users={contextualData.users}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  isLoading={isLoading}
                  allUsers={allUsers}
                  setClients={setClients}
                />
              </div>
            )}
            
            {/* LL-2: TOE Board */}
            {isWidgetEnabled('toeBoard') && (
              <div className="col-span-12 md:col-span-4">
                <TOEBoard 
                  toes={contextualData.toes}
                  users={contextualData.users}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  isLoading={isLoading}
                  allUsers={allUsers}
                  setTOEs={setTOEs}
                />
              </div>
            )}
            
            {/* LL-3: SLA Tracker */}
            {isWidgetEnabled('slaTracker') && (
              <div className={`col-span-12 md:col-span-4 ${viewLevel === 'director' ? 'director-card' : ''}`}>
                <SLATracker 
                  clients={contextualData.clients}
                  toes={contextualData.toes}
                  users={contextualData.users}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>

        {/* PROJECTS LAYER */}
        <div className="section-header">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Projects Layer
          </h2>
        </div>
        <div className="dashboard-grid mb-8">
            {/* PL-1: Project Portfolio */}
            {isWidgetEnabled('projectPortfolio') && (
              <div className="col-span-12 md:col-span-4">
                <ProjectPortfolio 
                  projects={contextualData.projects}
                  timeEntries={contextualData.timeEntries}
                  users={contextualData.users}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  isLoading={isLoading}
                  allUsers={allUsers}
                  setProjects={setProjects}
                />
              </div>
            )}
            
            {/* PL-2: Upcoming Projects */}
            {isWidgetEnabled('upcomingProjects') && (
              <div className="col-span-12 md:col-span-4">
                <UpcomingProjects 
                  projects={contextualData.projects}
                  users={contextualData.users}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  isLoading={isLoading}
                  allUsers={allUsers}
                  setProjects={setProjects}
                />
              </div>
            )}
            
            {/* PL-3: Budget - Only for Manager+ */}
            {(viewLevel === 'manager' || viewLevel === 'director') && isWidgetEnabled('budget') && (
              <div className={`col-span-12 md:col-span-4 ${viewLevel === 'director' ? 'director-card' : ''}`}>
                <BudgetWidget 
                  timeEntries={contextualData.timeEntries}
                  viewLevel={viewLevel}
                  currentUser={loggedInUser}
                  departments={allDepartments}
                  analyticsSettings={analyticsSettings}
                  isLoading={isLoading}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
