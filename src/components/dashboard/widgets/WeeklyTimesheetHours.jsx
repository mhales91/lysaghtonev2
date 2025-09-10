import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, eachDayOfInterval, addDays, isSameDay, subWeeks, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeEntry, User } from '@/api/entities';

export default function WeeklyTimesheetHours({ isLoading: dashboardLoading, currentUser }) {
  const [displayWeek, setDisplayWeek] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // No longer need to load user - it's passed as prop

  // Load time entries for the display week
  useEffect(() => {
    if (!currentUser) return;

    const loadTimeEntries = async () => {
      setIsLoading(true);
      try {
        const weekStart = startOfWeek(displayWeek, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        // Use TimeEntry entity with service role client to bypass RLS
        const entries = await TimeEntry.filter({
          user_id: currentUser.id,
          date: {
            $gte: weekStartStr,
            $lte: weekEndStr
          }
        });
        
        if (!entries) {
          console.error('Error loading time entries');
          setTimeEntries([]);
        } else {
          setTimeEntries(entries);
        }
      } catch (error) {
        console.error('Error loading time entries for week:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeEntries();
  }, [currentUser, displayWeek]);

  const chartData = useMemo(() => {
    if (!timeEntries || isLoading) return [];

    const weekStart = startOfWeek(displayWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 4) // Mon-Fri
    });

    const relevantTimeEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= addDays(weekStart, 6);
    });

    return weekDays.map(day => {
      const dayEntries = relevantTimeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return isSameDay(entryDate, day);
      });

      const billableHours = dayEntries
        .filter(e => e.billable)
        .reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
      
      const nonBillableHours = dayEntries
        .filter(e => !e.billable)
        .reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);

      const totalHours = billableHours + nonBillableHours;

      return {
        day: format(day, 'EEE'),
        billable: Math.round(billableHours * 10) / 10,
        nonBillable: Math.round(nonBillableHours * 10) / 10,
        total: Math.round(totalHours * 10) / 10
      };
    });
  }, [timeEntries, isLoading, displayWeek]);

  const weeklyBillablePercentage = useMemo(() => {
    const totalBillable = chartData.reduce((sum, day) => sum + day.billable, 0);
    const totalHours = chartData.reduce((sum, day) => sum + day.total, 0);
    return totalHours > 0 ? Math.round((totalBillable / totalHours) * 100) : 0;
  }, [chartData]);

  if (dashboardLoading || isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Weekly Timesheet Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  const weekStartFormatted = format(startOfWeek(displayWeek, { weekStartsOn: 1 }), 'd MMM');
  const weekEndFormatted = format(addDays(startOfWeek(displayWeek, { weekStartsOn: 1 }), 4), 'd MMM yyyy');

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Weekly Timesheet Hours</CardTitle>
          <p className="text-xs text-gray-500">{weekStartFormatted} - {weekEndFormatted}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayWeek(subWeeks(displayWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayWeek(addWeeks(displayWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value, name) => [
                  `${value}h`, 
                  name === 'billable' ? 'Billable' : 'Non-billable'
                ]}
              />
              <Bar dataKey="billable" stackId="hours" fill="#16a34a" name="billable" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nonBillable" stackId="hours" fill="#ef4444" name="nonBillable" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-center border-t pt-4">
          <div className="text-3xl font-bold text-gray-800">
            {weeklyBillablePercentage}%
          </div>
          <div className="text-sm text-gray-500">Billable This Week</div>
        </div>
      </CardContent>
    </Card>
  );
}