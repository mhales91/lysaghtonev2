
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { getNZFinancialYear } from '@/components/utils/dateUtils';
import { format, eachMonthOfInterval, isWithinInterval } from 'date-fns';

export default function YearlyBillableTracker({ timeEntries, isLoading }) {
  const { ytdBillablePercentage, ytdRealisedPercentage, trendData } = useMemo(() => {
    if (!timeEntries || isLoading) return { ytdBillablePercentage: 0, ytdRealisedPercentage: 0, trendData: [] };

    const { startDate, endDate } = getNZFinancialYear(new Date());

    const ytdEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= new Date(); // YTD is from FY start to today
    });

    const totalYtdHours = ytdEntries.reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
    const billableYtdHours = ytdEntries.filter(e => e.billable).reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
    const billableYtdValue = ytdEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.billable_amount || 0), 0);
    const realisedYtdValue = ytdEntries.filter(e => e.status === 'invoiced').reduce((sum, e) => sum + (e.invoiced_amount || 0), 0);

    const billablePercentage = totalYtdHours > 0 ? (billableYtdHours / totalYtdHours * 100) : 0;
    const realisedPercentage = billableYtdValue > 0 ? (realisedYtdValue / billableYtdValue * 100) : 0;

    // For the trend line, we can still show monthly percentages
    const months = eachMonthOfInterval({ start: startDate, end: new Date() });
    const monthlyTrendData = months.map(monthStart => {
       const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
       const monthEntries = ytdEntries.filter(entry => isWithinInterval(new Date(entry.date), {start: monthStart, end: monthEnd}));
       
       const totalMonthHours = monthEntries.reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
       const billableMonthHours = monthEntries.filter(e => e.billable).reduce((sum, e) => sum + ((e.minutes || 0) / 60), 0);
       return {
         month: format(monthStart, 'MMM'),
         "Billable %": totalMonthHours > 0 ? (billableMonthHours / totalMonthHours * 100) : 0
       };
    });

    return { 
      ytdBillablePercentage: billablePercentage, 
      ytdRealisedPercentage: realisedPercentage,
      trendData: monthlyTrendData
    };
  }, [timeEntries, isLoading]);

  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Yearly Billable Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // The viewLevel, currentUser, dateRange props are no longer passed to the component,
  // so the title should be generic or determined by other means if necessary.
  // For now, let's make it fixed as per the outline's intent to simplify the component.
  const getViewTitle = () => {
    // Since viewLevel is no longer a prop, we assume a general title or
    // it implies that the title logic will be handled by the parent component.
    // For this component, a generic title like "Yearly Performance" is appropriate.
    return 'Yearly Performance (FYTD)';
  };

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">{getViewTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorBillable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis unit="%" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(1)}%`, null]}
              cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{ 
                background: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
            />
            <Area type="monotone" dataKey="Billable %" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorBillable)" />
          </AreaChart>
        </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t pt-4">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {ytdBillablePercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">YTD Billable</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {ytdRealisedPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">YTD Realised</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
