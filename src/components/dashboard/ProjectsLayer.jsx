import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Target, TrendingUp, AlertCircle, CheckCircle, User, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProjectsLayer({ currentUser, contextualData, isLoading, viewMode }) {
  const projectMetrics = useMemo(() => {
    if (!contextualData.projects) return null;

    const activeProjects = contextualData.projects.filter(p => p.status === 'active');
    const completedProjects = contextualData.projects.filter(p => p.status === 'completed');
    
    // Budget Performance Analysis
    const projectsWithBudget = contextualData.projects.filter(p => p.budget_fees > 0);
    const totalBudgetValue = projectsWithBudget.reduce((sum, p) => sum + p.budget_fees, 0);
    const totalActualValue = projectsWithBudget.reduce((sum, p) => sum + (p.actual_fees || 0), 0);

    // Recent Project Activity
    const recentProjects = contextualData.projects
      .filter(p => p.status === 'active')
      .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
      .slice(0, 6);

    // Department/Office breakdown
    const departmentBreakdown = contextualData.projects.reduce((acc, project) => {
      const dept = project.lead_department || 'Unassigned';
      if (!acc[dept]) acc[dept] = { total: 0, active: 0, budget: 0 };
      acc[dept].total++;
      if (project.status === 'active') acc[dept].active++;
      acc[dept].budget += project.budget_fees || 0;
      return acc;
    }, {});

    return {
      totalProjects: contextualData.projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalBudgetValue,
      totalActualValue,
      recentProjects,
      departmentBreakdown
    };
  }, [contextualData.projects]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!projectMetrics) return null;

  const getClientName = (clientId) => {
    const client = contextualData.clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-purple-600" />
          PROJECTS (LIVE) - OUR TEAM
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Active Projects List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">ACTIVE PROJECTS</h3>
            <div className="space-y-3">
              {projectMetrics.recentProjects.map(project => {
                const utilization = project.budget_fees > 0 ? 
                  ((project.actual_fees || 0) / project.budget_fees * 100) : 0;
                
                return (
                  <Link
                    key={project.id}
                    to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.description || 'N/A'} • {getClientName(project.client_id)}
                        </div>
                      </div>
                      <Badge className={`text-xs ${
                        utilization >= 90 ? 'bg-red-100 text-red-800' :
                        utilization >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {utilization.toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <Progress value={utilization} className="h-2 mb-2" />
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>${(project.actual_fees || 0).toLocaleString()} / ${(project.budget_fees || 0).toLocaleString()}</span>
                      <span className="capitalize">{project.lead_department || 'No Dept'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Center: Staff Workload & Achievement */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">STAFF WORKLOAD</h3>
            <div className="space-y-3">
              {contextualData.users.slice(0, 8).map(user => {
                const userProjects = contextualData.projects.filter(p => p.project_manager === user.email);
                const userTimeThisMonth = contextualData.timeEntries
                  .filter(te => te.user_email === user.email)
                  .filter(te => {
                    const entryDate = new Date(te.date);
                    const now = new Date();
                    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, te) => sum + ((te.minutes || 0) / 60), 0);

                const workloadScore = Math.min(100, (userProjects.length * 15) + (userTimeThisMonth / 40 * 50));

                return (
                  <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                          {user.full_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-500">{user.department}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{userProjects.length}</div>
                        <div className="text-xs text-gray-500">projects</div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        workloadScore <= 40 ? 'bg-green-500' :
                        workloadScore <= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Department Budget & Admin */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">DEPT BUDGET</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Total Budget</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  ${projectMetrics.totalBudgetValue.toLocaleString()}
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Actual Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${projectMetrics.totalActualValue.toLocaleString()}
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {projectMetrics.totalBudgetValue > 0 ? 
                    ((projectMetrics.totalActualValue / projectMetrics.totalBudgetValue) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-blue-700">Budget Utilization</div>
              </div>
            </div>

            {/* Admin/Span section */}
            <h3 className="text-sm font-semibold text-gray-700 mb-4 mt-6">ADMIN/SPAN</h3>
            <div className="space-y-3">
              {Object.entries(projectMetrics.departmentBreakdown).map(([dept, data]) => (
                <div key={dept} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">{dept}</span>
                    <span className="text-xs text-gray-600">{data.active}/{data.total}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ${data.budget.toLocaleString()} budget
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}