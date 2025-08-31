import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, AlertTriangle, TrendingUp, Zap, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function LeadsTOELayer({ currentUser, contextualData, toes, isLoading, viewMode }) {
  const operationalMetrics = useMemo(() => {
    if (!contextualData || !toes) return null;

    // TOE Pipeline Metrics
    const toesByStatus = toes.reduce((acc, toe) => {
      acc[toe.status] = (acc[toe.status] || 0) + 1;
      return acc;
    }, {});

    // Team Workload Analysis
    const userWorkloadMap = contextualData.users.reduce((acc, user) => {
      const userProjects = contextualData.projects.filter(p => p.project_manager === user.email);
      const userTimeThisMonth = contextualData.timeEntries
        .filter(te => te.user_email === user.email)
        .filter(te => {
          const entryDate = new Date(te.date);
          const now = new Date();
          return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, te) => sum + ((te.minutes || 0) / 60), 0);

      acc[user.email] = {
        name: user.full_name,
        department: user.department,
        activeProjects: userProjects.filter(p => p.status === 'active').length,
        totalHours: userTimeThisMonth,
        workloadScore: Math.min(100, (userProjects.length * 10) + (userTimeThisMonth / 40 * 50))
      };
      return acc;
    }, {});

    return {
      toesByStatus,
      userWorkloadMap,
      totalTOEs: toes.length,
      averageWorkload: Object.values(userWorkloadMap).reduce((sum, user) => sum + user.workloadScore, 0) / Object.keys(userWorkloadMap).length
    };
  }, [contextualData, toes]);

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!operationalMetrics) return null;

  const getWorkloadColor = (score) => {
    if (score <= 40) return 'bg-green-500';
    if (score <= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const leadStatuses = ['draft', 'sent', 'signed', 'internal_review'];
  
  return (
    <Card className="mb-8 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          TOE / MANAGER LAYER - YOUR LEADS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: TOE Status Cards */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">TOE STATUS</h3>
            <div className="grid grid-cols-2 gap-3">
              {leadStatuses.map(status => (
                <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {operationalMetrics.toesByStatus[status] || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 capitalize">
                    {status.replace('_', ' ')}
                  </div>
                  <div className={`w-full h-2 rounded-full mt-2 ${
                    status === 'draft' ? 'bg-gray-300' :
                    status === 'sent' ? 'bg-blue-300' :
                    status === 'signed' ? 'bg-green-300' : 'bg-yellow-300'
                  }`}></div>
                </div>
              ))}
            </div>
            
            {/* Project Status Cards */}
            <h3 className="text-sm font-semibold text-gray-700 mb-4 mt-6">PROJECT STATUS</h3>
            <div className="space-y-3">
              {contextualData.projects.slice(0, 3).map(project => {
                const utilization = project.budget_fees > 0 ? 
                  ((project.actual_fees || 0) / project.budget_fees * 100) : 0;
                
                return (
                  <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900 truncate flex-1">
                        {project.project_name}
                      </div>
                      <Badge className={`text-xs ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Progress value={utilization} className="h-2 mb-2" />
                    <div className="text-xs text-gray-500">
                      Budget: {utilization.toFixed(1)}% used
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center: Achievement/Progress */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">ACHIEVEMENT</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {operationalMetrics.averageWorkload.toFixed(0)}%
                </div>
                <div className="text-sm text-purple-700 mt-1">Team Capacity</div>
                <Progress value={operationalMetrics.averageWorkload} className="h-2 mt-2" />
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {contextualData.projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-blue-700 mt-1">Active Projects</div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {operationalMetrics.totalTOEs}
                </div>
                <div className="text-sm text-green-700 mt-1">TOEs in Pipeline</div>
              </div>
            </div>
          </div>

          {/* Right: Your Team */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">YOUR TEAM</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-xs font-semibold text-gray-600 text-center">LEAD</div>
              <div className="text-xs font-semibold text-gray-600 text-center">PM</div>
              <div className="text-xs font-semibold text-gray-600 text-center">WORKLOAD</div>
            </div>
            
            <div className="space-y-3">
              {Object.entries(operationalMetrics.userWorkloadMap).slice(0, 6).map(([email, userData]) => (
                <div key={email} className="grid grid-cols-3 gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                        {userData.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-700 truncate">{userData.name.split(' ')[0]}</span>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-xs font-medium text-gray-900">
                      {userData.activeProjects}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getWorkloadColor(userData.workloadScore)}`}></div>
                    <span className="text-xs text-gray-600">
                      {userData.workloadScore.toFixed(0)}%
                    </span>
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