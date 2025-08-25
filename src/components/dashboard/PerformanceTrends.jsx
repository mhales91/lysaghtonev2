import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart } from "recharts";
import { TimeEntry } from "@/api/entities";

export default function PerformanceTrends({ currentUser, isLoading, allUsers, viewMode }) {
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && !isLoading) {
      loadTrendsData();
    }
  }, [currentUser, allUsers, viewMode, isLoading]);

  const loadTrendsData = async () => {
    setLoading(true);
    try {
      let userEmailFilter = null;
      
      if (viewMode === 'staff') {
        if (currentUser?.email) {
            userEmailFilter = { $in: [currentUser.email] };
        }
      } else if (viewMode === 'department') {
        const teamEmails = (allUsers || []).filter(u => u.department === currentUser.department).map(u => u.email);
        userEmailFilter = teamEmails.length > 0 ? { $in: teamEmails } : { $in: ['no-one'] };
      }

      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          year: d.getFullYear(),
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        };
      }).reverse();

      const trendsPromises = months.map(async ({ month, year, start, end }) => {
        let timeEntriesFilter = {
          date: { 
            $gte: start.toISOString().split('T')[0],
            $lte: end.toISOString().split('T')[0],
          }
        };
        if (userEmailFilter) {
          timeEntriesFilter.user_email = userEmailFilter;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        const timeEntries = await TimeEntry.filter(timeEntriesFilter);
        
        const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);
        const totalHours = totalMinutes / 60;
        
        const billableEntries = timeEntries.filter(e => e.billable === true);
        const billableMinutes = billableEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);
        const billableHours = billableMinutes / 60;
        
        const billablePercentage = totalHours > 0 ? (billableHours / totalHours * 100) : 0;
        
        const totalBillableValue = billableEntries.reduce((sum, e) => {
          return sum + (e.billable_amount || 0);
        }, 0);
        
        const invoicedEntries = billableEntries.filter(e => e.status === 'invoiced');
        const totalInvoicedValue = invoicedEntries.reduce((sum, e) => {
          return sum + (e.invoiced_amount || 0);
        }, 0);
        
        const realisedPercentage = totalBillableValue > 0 ? (totalInvoicedValue / totalBillableValue * 100) : 0;

        console.log(`Performance Trends for ${month} ${year} (View: ${viewMode}, User: ${currentUser?.email || currentUser?.department || 'Business'})`, {
          totalEntries: timeEntries.length,
          billableEntries: billableEntries.length,
          invoicedEntries: invoicedEntries.length,
          totalHours: totalHours.toFixed(2),
          billableHours: billableHours.toFixed(2),
          billablePercentage: billablePercentage.toFixed(1),
          totalBillableValue: totalBillableValue.toFixed(2),
          totalInvoicedValue: totalInvoicedValue.toFixed(2),
          realisedPercentage: realisedPercentage.toFixed(1)
        });

        return {
          month,
          billablePercentage: Math.round(billablePercentage * 10) / 10,
          realisedPercentage: Math.round(realisedPercentage * 10) / 10
        };
      });

      const data = await Promise.all(trendsPromises);
      setTrendsData(data);
    } catch (error) {
      console.error('Error loading trends data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Performance Trends
        </CardTitle>
        <p className="text-sm text-gray-600">
          Billable % = Billable Time / Total Time | Realised % = Invoiced Value / Billable Value
        </p>
      </CardHeader>
      <CardContent>
         <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="percentage" orientation="left" tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                />
                <Bar yAxisId="percentage" dataKey="billablePercentage" fill="#94a3b8" name="Billable %" />
                <Line 
                  yAxisId="percentage" 
                  type="monotone" 
                  dataKey="realisedPercentage" 
                  stroke="#5E0F68" 
                  strokeWidth={3}
                  name="Realised %"
                  dot={{ fill: '#5E0F68', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}