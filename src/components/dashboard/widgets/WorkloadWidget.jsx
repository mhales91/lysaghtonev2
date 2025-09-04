
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { startOfWeek, endOfWeek } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const StaffInitials = ({ user }) => {
  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  };
  
  return (
    <div 
      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs"
      style={{ backgroundColor: user.user_color || '#6b7280' }}
    >
      {getInitials(user)}
    </div>
  );
};

export default function WorkloadWidget({ users, projects, timeEntries, viewLevel, currentUser, departments, isLoading }) {
  const workloadData = useMemo(() => {
    if (!users || !projects || isLoading) return [];

    if (viewLevel === 'staff') {
      const now = new Date();
      // Set week start/end to Monday/Sunday
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      const weeklyEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        // Ensure time entries are for the current user and within the current week
        return entry.user_email === currentUser.email && entryDate >= weekStart && entryDate <= weekEnd;
      });

      const weeklyHours = weeklyEntries.reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
      const weeklyWorkloadPercentage = (weeklyHours / 40) * 100; // Assuming a standard 40-hour work week

      return [{
        name: 'This Week\'s Workload',
        percentage: weeklyWorkloadPercentage,
        type: 'staff_weekly'
      }];
    } else if (viewLevel === 'manager') {
      // Manager: Team member workloads as horizontal bars
      return users.map(user => {
        const userProjects = projects.filter(p => p.project_manager === user.email);
        const userHours = timeEntries
          .filter(te => te.user_email === user.email)
          .reduce((sum, te) => sum + ((te.minutes || 0) / 60), 0);
        
        // Calculate workload score based on projects and recent hours
        const workloadScore = Math.min(100, (userProjects.length * 15) + (userHours / 40 * 60));
        
        const projectBreakdown = userProjects.map(project => ({
          name: project.name,
          percentage: userProjects.length > 0 ? (1 / userProjects.length * 100) : 0
        }));

        return {
          user,
          name: user.full_name,
          hours: Math.round(userHours * 10) / 10,
          projects: userProjects.length,
          percentage: workloadScore,
          type: 'user',
          breakdown: projectBreakdown
        };
      });
    } else {
      // Director: Department-level cumulative workloads
      return departments.map(dept => {
        const deptUsers = users.filter(u => u.department === dept);
        const deptProjects = projects.filter(p => p.lead_department === dept);
        const deptHours = timeEntries
          .filter(te => deptUsers.some(u => u.email === te.user_email))
          .reduce((sum, te) => sum + ((te.minutes || 0) / 60), 0);
        
        const avgWorkload = deptUsers.length > 0 ? 
          (deptProjects.length * 8 + deptHours / deptUsers.length) : 0;

        const userBreakdown = deptUsers.map(user => {
          const userHours = timeEntries
            .filter(te => te.user_email === user.email)
            .reduce((sum, te) => sum + ((te.minutes || 0) / 60), 0);
          return {
            name: user.full_name,
            percentage: deptHours > 0 ? (userHours / deptHours * 100) : 0
          };
        });
        
        return {
          name: dept,
          hours: Math.round(deptHours * 10) / 10,
          projects: deptProjects.length,
          users: deptUsers.length,
          percentage: Math.min(100, avgWorkload),
          type: 'department',
          breakdown: userBreakdown
        };
      });
    }
  }, [users, projects, timeEntries, viewLevel, currentUser, departments, isLoading]);

  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (percentage) => {
    if (percentage > 100) return 'bg-red-500'; // Overallocated
    if (percentage > 85) return 'bg-amber-500';
    return 'bg-green-600';
  };

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">Workload</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-4">
            {workloadData.length > 0 ? workloadData.map((item, index) => (
              <TooltipProvider key={index} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-1.5 cursor-help">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {item.type === 'user' && (
                            <StaffInitials 
                              user={item.user}
                            />
                          )}
                          <span className="font-medium truncate text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800">{item.percentage.toFixed(0)}%</div>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, item.percentage)}
                        className="h-3 rounded-full bg-gray-200" 
                        indicatorClassName={`rounded-full ${getProgressColor(item.percentage)}`} 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white rounded-md p-2">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold">{item.name}</div>
                      {item.breakdown && item.breakdown.length > 0 ? item.breakdown.map((breakdownItem, i) => (
                        <div key={i}>
                          {breakdownItem.name}: {breakdownItem.percentage.toFixed(1)}%
                        </div>
                      )) : (
                        <div>No project breakdown available.</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No workload data available</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
