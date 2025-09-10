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

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [toes, setToes] = useState([]);
  const [clients, setClients] = useState([]);
  const [dashboardSettings, setDashboardSettings] = useState(null);
  const [analyticsSettings, setAnalyticsSettings] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Load dashboard settings
  useEffect(() => {
    const loadDashboardSettings = async () => {
      try {
        const settings = await DashboardSettings.list();
        if (settings && settings.length > 0) {
          setDashboardSettings(settings[0]);
        }
      } catch (error) {
        console.error('Error loading dashboard settings:', error);
      }
    };

    loadDashboardSettings();
  }, []);

  // Load analytics settings
  useEffect(() => {
    const loadAnalyticsSettings = async () => {
      try {
        const settings = await AnalyticsSetting.list();
        if (settings && settings.length > 0) {
          setAnalyticsSettings(settings[0]);
        }
      } catch (error) {
        console.error('Error loading analytics settings:', error);
      }
    };

    loadAnalyticsSettings();
  }, []);

  // Load static dashboard data
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [projectsData, invoicesData, toesData, clientsData] = await Promise.all([
          Project.list('-created_date', 50),
          Invoice.list('-created_date', 50),
          TOE.list('-created_date', 50),
          Client.list('-created_date', 50)
        ]);
        
        setProjects(projectsData || []);
        setInvoices(invoicesData || []);
        setToes(toesData || []);
        setClients(clientsData || []);
      } catch (error) {
        console.error('Error loading static dashboard data:', error);
      }
    };

    loadStaticData();
  }, []);

  // Load time entries based on date range
  useEffect(() => {
    const loadTimeEntries = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      
      try {
        const from = dateRange?.from ? new Date(dateRange.from) : null;
        const to = dateRange?.to ? new Date(dateRange.to) : null;

        if (from && to) {
          // Format dates to YYYY-MM-DD for backend filtering
          const fromDateStr = from.toISOString().split('T')[0];
          const toDateStr = to.toISOString().split('T')[0];
          
          // Use TimeEntry entity with service role client to bypass RLS
          const timeEntriesData = await TimeEntry.filter({
            date: {  // Fixed: use date, not start_time
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
        setTimeEntries([]);
      }
    };

    loadTimeEntries();
  }, [dateRange]);

  // Get filtered data based on selected filters
  const filteredData = useMemo(() => {
    let filteredTimeEntries = timeEntries;
    let filteredProjects = projects;
    let filteredInvoices = invoices;
    let filteredToes = toes;

    // Filter by department
    if (selectedDepartment !== 'all') {
      filteredTimeEntries = filteredTimeEntries.filter(entry => 
        entry.department === selectedDepartment
      );
      filteredProjects = filteredProjects.filter(project => 
        project.lead_department === selectedDepartment
      );
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filteredTimeEntries = filteredTimeEntries.filter(entry => 
        entry.user_email === selectedUser
      );
    }

    return {
      timeEntries: filteredTimeEntries,
      projects: filteredProjects,
      invoices: filteredInvoices,
      toes: filteredToes
    };
  }, [timeEntries, projects, invoices, toes, selectedDepartment, selectedUser]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const deptSet = new Set();
    timeEntries.forEach(entry => {
      if (entry.department) deptSet.add(entry.department);
    });
    projects.forEach(project => {
      if (project.lead_department) deptSet.add(project.lead_department);
    });
    return Array.from(deptSet).sort();
  }, [timeEntries, projects]);

  // Get unique users for filter
  const users = useMemo(() => {
    const userSet = new Set();
    timeEntries.forEach(entry => {
      if (entry.user_email) userSet.add(entry.user_email);
    });
    return Array.from(userSet).sort();
  }, [timeEntries]);

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser.full_name || currentUser.email}!</p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range"
              />
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setDateRange(null);
                  setSelectedDepartment('all');
                  setSelectedUser('all');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WeeklyTimesheetHours 
            isLoading={isLoading} 
            currentUser={currentUser} 
          />
          <YearlyBillableTracker 
            timeEntries={filteredData.timeEntries}
            currentUser={currentUser}
          />
          <WorkloadWidget 
            timeEntries={filteredData.timeEntries}
            projects={filteredData.projects}
            currentUser={currentUser}
          />
          <CRMBoard 
            clients={clients}
            currentUser={currentUser}
          />
          <TOEBoard 
            toes={filteredData.toes}
            currentUser={currentUser}
          />
          <SLATracker 
            projects={filteredData.projects}
            currentUser={currentUser}
          />
          <ProjectPortfolio 
            projects={filteredData.projects}
            currentUser={currentUser}
          />
          <UpcomingProjects 
            projects={filteredData.projects}
            currentUser={currentUser}
          />
          <BudgetWidget 
            projects={filteredData.projects}
            timeEntries={filteredData.timeEntries}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}