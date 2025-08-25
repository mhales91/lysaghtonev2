
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntry, Project, User, Invoice } from "@/api/entities";
import { TrendingUp, DollarSign, Clock, Users, AlertTriangle, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default function RoleAwareStats({ currentUser, isLoading, allUsers }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && !isLoading) {
      loadRoleSpecificStats();
    }
  }, [currentUser, allUsers, isLoading]);

  const loadRoleSpecificStats = async () => {
    setLoading(true);
    try {
      const role = currentUser.user_role;
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      // Add delays between API calls to avoid rate limiting
      switch (role) {
        case 'Staff':
          await loadStaffStats(weekStart, weekEnd, monthStart, monthEnd);
          break;
        case 'Manager':
          await loadManagerStats(monthStart, monthEnd);
          break;
        case 'DeptLead':
          await loadDeptLeadStats(monthStart, monthEnd);
          break;
        case 'Director':
        case 'Admin':
          await loadDirectorStats(monthStart, monthEnd);
          break;
        default:
          await loadStaffStats(weekStart, weekEnd, monthStart, monthEnd);
      }
    } catch (error) {
      console.error('Error loading role-specific stats:', error);
    }
    setLoading(false);
  };

  const loadStaffStats = async (weekStart, weekEnd, monthStart, monthEnd) => {
    console.log('Loading staff stats...');
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const weeklyEntries = await TimeEntry.filter({
      user_email: currentUser.email,
      date: { $gte: weekStart.toISOString().split('T')[0], $lte: weekEnd.toISOString().split('T')[0] }
    });
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const monthlyEntries = await TimeEntry.filter({
      user_email: currentUser.email,
      date: { $gte: monthStart.toISOString().split('T')[0], $lte: monthEnd.toISOString().split('T')[0] }
    });
    
    const weeklyTotalHours = weeklyEntries.reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const weeklyBillableHours = weeklyEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const weeklyBillablePercentage = weeklyTotalHours > 0 ? (weeklyBillableHours / weeklyTotalHours * 100) : 0;

    const monthlyTotalHours = monthlyEntries.reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const monthlyRealized = monthlyEntries.filter(entry => entry.status === 'invoiced').reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);
    const monthlyBillable = monthlyEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);
    const realizedPercentage = monthlyBillable > 0 ? (monthlyRealized / monthlyBillable * 100) : 0;

    setStats({
      myTimesheetHours: weeklyTotalHours,
      myBillablePercentage: weeklyBillablePercentage.toFixed(1),
      myRealizedPercentage: realizedPercentage.toFixed(1),
      totalEntries: weeklyEntries.length,
      avgHoursPerDay: (weeklyTotalHours / 7).toFixed(1)
    });
  };

  const loadManagerStats = async (monthStart, monthEnd) => {
    console.log('Loading manager stats...');
    
    const teamMembers = (allUsers || []).filter(u => u.department === currentUser.department);
    const teamEmails = teamMembers.map(u => u.email);
    
    if (teamEmails.length === 0) {
      setStats({
        teamHours: 0,
        teamBillablePercentage: 0,
        teamRealizedPercentage: 0,
        projectsAtRisk: 0,
        totalProjects: 0
      });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const timeEntries = await TimeEntry.filter({
      user_email: { $in: teamEmails },
      date: { $gte: monthStart.toISOString().split('T')[0], $lte: monthEnd.toISOString().split('T')[0] }
    });
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const projects = await Project.filter({ project_manager: { $in: teamEmails } });
    
    const atRiskProjects = projects.filter(p => {
      const utilization = p.budget_fees > 0 ? (p.actual_fees / p.budget_fees * 100) : 0;
      return utilization > 75;
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const billableHours = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const realizedAmount = timeEntries.filter(entry => entry.status === 'invoiced').reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);
    const billableAmount = timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);
    const realizedPercentage = billableAmount > 0 ? (realizedAmount / billableAmount * 100) : 0;

    setStats({
      teamHours: totalHours,
      teamBillablePercentage: totalHours > 0 ? (billableHours / totalHours * 100).toFixed(1) : 0,
      teamRealizedPercentage: realizedPercentage.toFixed(1),
      projectsAtRisk: atRiskProjects.length,
      totalProjects: projects.length
    });
  };

  const loadDeptLeadStats = async (monthStart, monthEnd) => {
    console.log('Loading dept lead stats...');
    
    const deptUsers = (allUsers || []).filter(u => u.department === currentUser.department);
    const deptEmails = deptUsers.map(u => u.email);
    
    if (deptEmails.length === 0) {
      setStats({
        deptRevenueYTD: 0,
        deptUtilisation: 0,
        deptRealizedPercentage: 0,
        deptProjectsAtRisk: 0,
        totalDeptProjects: 0
      });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const timeEntries = await TimeEntry.filter({
      user_email: { $in: deptEmails }
    });
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const projects = await Project.filter({ lead_department: currentUser.department });
    
    const atRiskProjects = projects.filter(p => {
      const utilization = p.budget_fees > 0 ? (p.actual_fees / p.budget_fees * 100) : 0;
      return utilization > 75;
    });

    const currentYear = new Date().getFullYear();
    const ytdEntries = timeEntries.filter(e => new Date(e.date).getFullYear() === currentYear);
    const ytdRevenue = ytdEntries.reduce((sum, e) => sum + (e.billable_amount || 0), 0);
    const ytdRealized = ytdEntries.filter(e => e.status === 'invoiced').reduce((sum, e) => sum + (e.billable_amount || 0), 0);
    const realizedPercentage = ytdRevenue > 0 ? (ytdRealized / ytdRevenue * 100) : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget_fees || 0), 0);
    const totalActual = projects.reduce((sum, p) => sum + (p.actual_fees || 0), 0);
    const utilization = totalBudget > 0 ? (totalActual / totalBudget * 100).toFixed(1) : 0;

    setStats({
      deptRevenueYTD: ytdRevenue,
      deptUtilisation: utilization,
      deptRealizedPercentage: realizedPercentage.toFixed(1),
      deptProjectsAtRisk: atRiskProjects.length,
      totalDeptProjects: projects.length
    });
  };

  const loadDirectorStats = async (monthStart, monthEnd) => {
    console.log('Loading director stats...');
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const projects = await Project.list();
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Delay
    const timeEntries = await TimeEntry.list();

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget_fees || 0), 0);
    const totalActual = projects.reduce((sum, p) => sum + (p.actual_fees || 0), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = timeEntries
      .filter(e => {
        const entryDate = new Date(e.date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.billable_amount || 0), 0);

    const monthlyRealized = timeEntries
      .filter(e => {
        const entryDate = new Date(e.date);
        return entryDate.getMonth() === currentMonth && 
               entryDate.getFullYear() === currentYear && 
               e.status === 'invoiced';
      })
      .reduce((sum, e) => sum + (e.billable_amount || 0), 0);

    const realizedPercentage = monthlyRevenue > 0 ? (monthlyRealized / monthlyRevenue * 100) : 0;

    setStats({
      activeProjects,
      totalBudget,
      totalActual,
      utilizationRate: totalBudget > 0 ? (totalActual / totalBudget * 100).toFixed(1) : 0,
      monthlyRevenue,
      realizedPercentage: realizedPercentage.toFixed(1)
    });
  };

  const getStatsForRole = () => {
    const role = currentUser?.user_role;
    
    switch (role) {
      case 'Staff':
        return [
          {
            title: "My Hours This Week",
            value: (stats.myTimesheetHours || 0).toFixed(1),
            icon: Clock,
            color: "bg-blue-500",
            description: `${stats.totalEntries || 0} time entries`
          },
          {
            title: "My Billable %",
            value: `${stats.myBillablePercentage || 0}%`,
            icon: Target,
            color: "bg-green-500",
            description: "This week's ratio"
          },
          {
            title: "My Realized %",
            value: `${stats.myRealizedPercentage || 0}%`,
            icon: DollarSign,
            color: "bg-purple-500",
            description: "This month's invoiced"
          }
        ];
        
      case 'Manager':
        return [
          {
            title: "Team Hours",
            value: (stats.teamHours || 0).toFixed(1),
            icon: Users,
            color: "bg-blue-500",
            description: "This month"
          },
          {
            title: "Team Billable %",
            value: `${stats.teamBillablePercentage || 0}%`,
            icon: Target,
            color: "bg-green-500",
            description: "Team average"
          },
          {
            title: "Team Realized %",
            value: `${stats.teamRealizedPercentage || 0}%`,
            icon: DollarSign,
            color: "bg-purple-500",
            description: "Invoiced vs billable"
          }
        ];
        
      case 'DeptLead':
        return [
          {
            title: "Dept Revenue YTD",
            value: `$${(stats.deptRevenueYTD || 0).toLocaleString()}`,
            icon: DollarSign,
            color: "bg-green-500",
            description: "Year to date"
          },
          {
            title: "Dept Utilisation",
            value: `${stats.deptUtilisation || 0}%`,
            icon: Target,
            color: "bg-purple-500",
            description: "Budget vs actual"
          },
          {
            title: "Dept Realized %",
            value: `${stats.deptRealizedPercentage || 0}%`,
            icon: TrendingUp,
            color: "bg-orange-500",
            description: "Invoiced vs billable"
          }
        ];
        
      default: // director/admin
        return [
          {
            title: "Active Projects",
            value: stats.activeProjects || 0,
            icon: TrendingUp,
            color: "bg-blue-500",
            description: "Currently in progress"
          },
          {
            title: "Budget Utilization",
            value: `${stats.utilizationRate || 0}%`,
            icon: Target,
            color: "bg-purple-500",
            description: "Actual vs budgeted"
          },
          {
            title: "Realized %",
            value: `${stats.realizedPercentage || 0}%`,
            icon: DollarSign,
            color: "bg-green-500",
            description: "This month's invoiced"
          }
        ];
    }
  };

  const statCards = getStatsForRole();

  if (loading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array(3).fill(0).map((_, index) => (
          <Card key={index} className="relative overflow-hidden bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden bg-white shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
          <div className={`absolute top-0 right-0 w-20 h-20 ${stat.color} rounded-full opacity-10 transform translate-x-6 -translate-y-6`} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
