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

  const loadTimeEntries = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
        const weekStart = startOfWeek(displayWeek, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        // Use TimeEntry entity with service role client to bypass RLS
        const entries = await TimeEntry.filter({
          user_email: currentUser.email,  // Fixed: use user_email, not user_id
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

  useEffect(() => {
    loadTimeEntries();
  }, [displayWeek, currentUser]);

  const chartData = useMemo(() => {
    if (!timeEntries.length) return [];

    const weekStart = startOfWeek(displayWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEntries = timeEntries.filter(entry => entry.date === dayStr);
      
      const totalHours = dayEntries.reduce((sum, entry) => {
        return sum + (entry.hours || 0);
      }, 0);

      return {
        day: format(day, 'EEE'),
        date: format(day, 'MMM d'),
        hours: totalHours,
        fullDate: dayStr
      };
    });
  }, [timeEntries, displayWeek]);

  const totalWeekHours = chartData.reduce((sum, day) => sum + day.hours, 0);

  const goToPreviousWeek = () => {
    setDisplayWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setDisplayWeek(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setDisplayWeek(new Date());
  };

  if (isLoading || dashboardLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Timesheet Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Timesheet Hours</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Week of {format(startOfWeek(displayWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')} - {format(addDays(startOfWeek(displayWeek, { weekStartsOn: 1 }), 6), 'MMM d, yyyy')}
        </div>
        <div className="text-lg font-semibold text-green-600">
          Total: {totalWeekHours.toFixed(1)} hours
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.date}</p>
                        <p className="text-sm text-gray-600">
                          Hours: <span className="font-semibold text-blue-600">{data.hours.toFixed(1)}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="hours" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No time entries found</p>
              <p className="text-sm">for this week</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}