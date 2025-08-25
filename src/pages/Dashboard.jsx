import React, { useState, useEffect, useMemo } from "react";
import { 
  Project, 
  TimeEntry, 
  Invoice, 
  TOE, 
  Client,
  User
} from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import RoleAwareStats from "../components/dashboard/RoleAwareStats";
import BudgetAlerts from "../components/dashboard/BudgetAlerts";
import PipelineOverview from "../components/dashboard/PipelineOverview";
import PerformanceTrends from "../components/dashboard/PerformanceTrends";

export default function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [viewAsUser, setViewAsUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('staff');
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setLoggedInUser(user);
      setViewAsUser(user);
      setSelectedDepartment(user.department);

      // Load data sequentially to avoid rate limiting
      console.log('Loading users...');
      const users = await User.list();
      setAllUsers(users);

      const depts = [...new Set(users.map(u => u.department).filter(Boolean))];
      setAllDepartments(depts);

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Loading projects...');
      const projectsData = await Project.list('-created_date');
      setProjects(projectsData || []);

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Loading clients...');
      const clientsData = await Client.list();
      setClients(clientsData || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
  };
  
  const handleViewAsChange = (userId) => {
    const selectedUser = allUsers.find(u => u.id === userId);
    if (selectedUser) {
        setViewAsUser(selectedUser);
    } else if (loggedInUser && userId === loggedInUser.id) {
        setViewAsUser(loggedInUser);
    }
  };

  const viewContextUser = useMemo(() => {
    if (viewMode === 'business') {
        return { ...loggedInUser, user_role: 'Director' };
    }
    if (viewMode === 'department' && selectedDepartment) {
        return { 
            ...loggedInUser, 
            id: `dept-${selectedDepartment}`,
            full_name: `${selectedDepartment} Department`,
            user_role: 'DeptLead', 
            department: selectedDepartment 
        };
    }
    return viewAsUser;
  }, [viewMode, selectedDepartment, viewAsUser, loggedInUser]);

  const filteredProjects = useMemo(() => {
    if (!viewContextUser) return [];
    if (viewContextUser.user_role === 'Director' || viewContextUser.user_role === 'Admin') return projects;
    if (viewContextUser.user_role === 'DeptLead') {
      return projects.filter(p => p.lead_department === viewContextUser.department);
    }
    return projects.filter(p => p.project_manager === viewContextUser.email);
  }, [projects, viewContextUser]);

  const filteredClients = useMemo(() => {
    if (!viewContextUser) return [];
    if (viewContextUser.user_role === 'Director' || viewContextUser.user_role === 'Admin') return clients;
    if (viewContextUser.user_role === 'DeptLead') {
      const deptUsers = allUsers.filter(u => u.department === viewContextUser.department);
      const deptEmails = deptUsers.map(u => u.email);
      return clients.filter(c => deptEmails.includes(c.lead_pm));
    }
    return clients.filter(c => c.lead_pm === viewContextUser.email);
  }, [clients, viewContextUser, allUsers]);

  const budgetAlerts = useMemo(() => 
    filteredProjects.filter(p => {
      const utilization = p.budget_fees > 0 ? ((p.actual_fees || 0) / p.budget_fees * 100) : 0;
      return utilization >= 75;
    }), 
  [filteredProjects]);

  const pipelineData = useMemo(() => {
    const pipeline = filteredClients.reduce((acc, client) => {
      const stage = client.crm_stage || 'lead';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(pipeline).map(([stage, count]) => ({ stage, count }));
  }, [filteredClients]);

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Operations Dashboard</h1>
            {loggedInUser && (
              <p className="text-gray-600">
                Logged in as: <b>{loggedInUser.full_name}</b> ({loggedInUser.user_role}).
                {viewMode === 'staff' && viewAsUser && loggedInUser.id !== viewAsUser.id && (
                  <span className="ml-2 italic text-purple-700">Viewing as {viewAsUser.full_name}.</span>
                )}
                 {viewMode === 'department' && selectedDepartment && (
                  <span className="ml-2 italic text-purple-700">Viewing {selectedDepartment} department.</span>
                )}
                 {viewMode === 'business' && (
                  <span className="ml-2 italic text-purple-700">Viewing entire business.</span>
                )}
              </p>
            )}
          </div>
          
          {loggedInUser && (loggedInUser.user_role === 'Admin' || loggedInUser.user_role === 'Director') && (
            <div className="w-full md:w-auto">
              <Label className="mb-2 block">View Dashboard As</Label>
              <Tabs value={viewMode} onValueChange={setViewMode}>
                  <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="business">Business</TabsTrigger>
                      <TabsTrigger value="department">Department</TabsTrigger>
                      <TabsTrigger value="staff">Staff</TabsTrigger>
                  </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {viewMode === 'department' && (loggedInUser?.user_role === 'Admin' || loggedInUser?.user_role === 'Director') && (
            <div className="mb-4 max-w-sm">
                <Label htmlFor="dept-select">Select Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger id="dept-select">
                        <SelectValue placeholder="Select a department..." />
                    </SelectTrigger>
                    <SelectContent>
                        {allDepartments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
        
        {viewMode === 'staff' && (loggedInUser?.user_role === 'Admin' || loggedInUser?.user_role === 'Director') && (
            <div className="mb-4 max-w-sm">
              <Label htmlFor="view-as-select">Select Staff Member</Label>
              <Select
                  value={viewAsUser?.id}
                  onValueChange={handleViewAsChange}
              >
                  <SelectTrigger id="view-as-select">
                      <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value={loggedInUser.id}>Myself ({loggedInUser.full_name})</SelectItem>
                      {allUsers
                          .filter(u => u.id !== loggedInUser.id)
                          .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                              {user.full_name} ({user.user_role})
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          )}

        {/* Role-Aware Stats - Pass the `viewContextUser` and allUsers to prevent re-fetching */}
        <RoleAwareStats currentUser={viewContextUser} isLoading={isLoading} allUsers={allUsers} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            <PerformanceTrends currentUser={viewContextUser} isLoading={isLoading} allUsers={allUsers} viewMode={viewMode} /> 
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            <BudgetAlerts alerts={budgetAlerts} isLoading={isLoading} />
            <PipelineOverview data={pipelineData} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}