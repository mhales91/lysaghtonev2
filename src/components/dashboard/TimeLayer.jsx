import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, Users, Target, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval } from "date-fns";

export default function TimeLayer({ currentUser, contextualData, isLoading, viewMode }) {
  const timeMetrics = useMemo(() => {
    if (!contextualData.timeEntries || !currentUser) return null;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get time entries for different periods
    const thisWeekEntries = contextualData.timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const thisMonthEntries = contextualData.timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    // Calculate metrics
    const weeklyTotalHours = thisWeekEntries.reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const weeklyBillableHours = thisWeekEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const weeklyBillablePercentage = weeklyTotalHours > 0 ? (weeklyBillableHours / weeklyTotalHours * 100) : 0;

    const monthlyTotalHours = thisMonthEntries.reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
    const monthlyBillableValue = thisMonthEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);
    const monthlyInvoicedValue = thisMonthEntries.filter(entry => entry.status === 'invoiced').reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);
    const realizationPercentage = monthlyBillableValue > 0 ? (monthlyInvoicedValue / monthlyBillableValue * 100) : 0;

    return {
      weeklyTotalHours: weeklyTotalHours.toFixed(1),
      weeklyBillableHours: weeklyBillableHours.toFixed(1),
      weeklyBillablePercentage: weeklyBillablePercentage.toFixed(1),
      realizationPercentage: realizationPercentage.toFixed(1),
      entryCount: thisWeekEntries.length
    };
  }, [contextualData.timeEntries, currentUser]);

  const weeklyTrendData = useMemo(() => {
    if (!contextualData.timeEntries || !currentUser) return [];

    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    return last7Days.map(day => {
      const dayEntries = contextualData.timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const totalHours = dayEntries.reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);
      const billableHours = dayEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + ((entry.minutes || 0) / 60), 0);

      return {
        day: format(day, 'EEE'),
        totalHours: parseFloat(totalHours.toFixed(1)),
        billableHours: parseFloat(billableHours.toFixed(1)),
        billablePercentage: totalHours > 0 ? parseFloat(((billableHours / totalHours) * 100).toFixed(1)) : 0
      };
    });
  }, [contextualData.timeEntries, currentUser]);

  const realizationTrendData = useMemo(() => {
    if (!contextualData.timeEntries) return [];
    
    const last12Weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const weekEntries = contextualData.timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      const billableValue = weekEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.billable_amount || 0), 0);
      const invoicedValue = weekEntries.filter(e => e.status === 'invoiced').reduce((sum, e) => sum + (e.billable_amount || 0), 0);
      const realization = billableValue > 0 ? (invoicedValue / billableValue * 100) : 0;

      last12Weeks.push({
        week: format(weekStart, 'MMM dd'),
        realization: parseFloat(realization.toFixed(1))
      });
    }
    
    return last12Weeks;
  }, [contextualData.timeEntries]);

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeMetrics) return null;

  return (
    <Card className="mb-8 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          TIME LAYER - {currentUser.user_role === 'Staff' ? 'YOU' : `${viewMode.toUpperCase()} VIEW`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Weekly Timesheet Hours */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">WEEKLY TIMESHEET HOURS</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
                <Bar dataKey="totalHours" fill="#e5e7eb" />
                <Bar dataKey="billableHours" fill="#5E0F68" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{timeMetrics.weeklyTotalHours}</div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{timeMetrics.weeklyBillableHours}</div>
                <div className="text-sm text-gray-600">Billable Hours</div>
              </div>
            </div>
          </div>

          {/* Center: BYTD Realized % */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">BYTD REALISED %</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={realizationTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Realization %']} />
                <Area 
                  type="monotone" 
                  dataKey="realization" 
                  stroke="#5E0F68" 
                  fill="#5E0F68" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{timeMetrics.realizationPercentage}%</div>
              <div className="text-sm text-gray-600">Current Realization</div>
            </div>
          </div>

          {/* Right: Your Team Pipeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">YOUR TEAM PIPELINE</h3>
            <div className="space-y-3">
              {contextualData.projects.slice(0, 4).map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate">{project.name}</div>
                    <div className="text-xs text-gray-500">{project.description || 'N/A'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      project.status === 'active' ? 'bg-green-500' :
                      project.status === 'on_hold' ? 'bg-yellow-500' :
                      project.status === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-xs text-gray-600 capitalize">{project.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
            {currentUser.user_role !== 'Staff' && (
              <div className="mt-4 text-center">
                <div className="text-lg font-bold text-gray-900">{contextualData.users.length}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}