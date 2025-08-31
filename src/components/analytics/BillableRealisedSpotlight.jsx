
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

function calculateMovingAverage(data, windowSize) {
    return data.map((_, i, arr) => {
        const start = Math.max(0, i - windowSize + 1);
        const end = i + 1;
        const subset = arr.slice(start, end);
        const sum = subset.reduce((acc, val) => acc + val.BillablePercentage, 0);
        return { ...data[i], RollingAvg4Week: sum / subset.length };
    });
}

export default function BillableRealisedSpotlight({ data }) {
    const { timeEntries, users } = data;
    const [staffSearch, setStaffSearch] = useState('');

    const processedData = useMemo(() => {
        const weeklyStats = {};
        const staffStats = {};

        timeEntries.forEach(entry => {
            if (!entry.date) return; // Skip entries with no date
            try {
                const weekStart = format(startOfWeek(parseISO(entry.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');

                if (!weeklyStats[weekStart]) {
                    weeklyStats[weekStart] = { totalMinutes: 0, billableMinutes: 0, billableAmount: 0, invoicedAmount: 0 };
                }
                weeklyStats[weekStart].totalMinutes += entry.minutes || 0;
                if (entry.billable) {
                    weeklyStats[weekStart].billableMinutes += entry.minutes || 0;
                    weeklyStats[weekStart].billableAmount += entry.billable_amount || 0;
                }
                if (entry.status === 'invoiced') {
                    weeklyStats[weekStart].invoicedAmount += entry.invoiced_amount || 0;
                }

                const userEmail = entry.user_email;
                if (!staffStats[userEmail]) {
                    staffStats[userEmail] = { totalMinutes: 0, billableMinutes: 0 };
                }
                staffStats[userEmail].totalMinutes += entry.minutes || 0;
                if(entry.billable) {
                    staffStats[userEmail].billableMinutes += entry.minutes || 0;
                }
            } catch (error) {
                console.warn('Invalid date in time entry, skipping:', entry.date, error);
            }
        });
        
        const weeklyChartData = Object.entries(weeklyStats).map(([weekStartDate, stats]) => {
            const billablePercentage = stats.totalMinutes > 0 ? (stats.billableMinutes / stats.totalMinutes) * 100 : 0;
            return {
                WeekStartDate: weekStartDate,
                BillablePercentage: billablePercentage,
            };
        }).sort((a, b) => new Date(a.WeekStartDate) - new Date(b.WeekStartDate));
        
        const weeklyChartDataWithMovingAvg = calculateMovingAverage(weeklyChartData, 4);

        const totalBillableMinutes = Object.values(staffStats).reduce((sum, stats) => sum + stats.billableMinutes, 0);
        const totalMinutes = Object.values(staffStats).reduce((sum, stats) => sum + stats.totalMinutes, 0);
        const overallBillablePercentage = totalMinutes > 0 ? (totalBillableMinutes / totalMinutes) * 100 : 0;
        
        const totalBillableAmount = Object.values(weeklyStats).reduce((sum, stats) => sum + stats.billableAmount, 0);
        const totalInvoicedAmount = Object.values(weeklyStats).reduce((sum, stats) => sum + stats.invoicedAmount, 0);
        const overallRealisedPercentage = totalBillableAmount > 0 ? (totalInvoicedAmount / totalBillableAmount) * 100 : 0;

        const staffLeaderboard = Object.entries(staffStats).map(([email, stats]) => {
            const user = users.find(u => u.email === email);
            const billablePercentage = stats.totalMinutes > 0 ? (stats.billableMinutes / stats.totalMinutes) * 100 : 0;
            return {
                StaffName: user ? user.full_name : email,
                BillablePercentage: billablePercentage.toFixed(2),
            };
        }).sort((a, b) => b.BillablePercentage - a.BillablePercentage);
        
        const departmentStats = {};
        users.forEach(user => {
            if (user.department) {
                if (!departmentStats[user.department]) {
                    departmentStats[user.department] = { totalMinutes: 0, billableMinutes: 0, billableAmount: 0, invoicedAmount: 0 };
                }
            }
        });

        timeEntries.forEach(entry => {
            const user = users.find(u => u.email === entry.user_email);
            if (user && user.department && departmentStats[user.department]) {
                const dept = departmentStats[user.department];
                dept.totalMinutes += entry.minutes || 0;
                 if (entry.billable) {
                    dept.billableMinutes += entry.minutes || 0;
                    dept.billableAmount += entry.billable_amount || 0;
                }
                if (entry.status === 'invoiced') {
                    dept.invoicedAmount += entry.invoiced_amount || 0;
                }
            }
        });
        
        const departmentAverages = Object.entries(departmentStats).map(([name, stats]) => {
            const billablePercentage = stats.totalMinutes > 0 ? (stats.billableMinutes / stats.totalMinutes) * 100 : 0;
            const realisedPercentage = stats.billableAmount > 0 ? (stats.invoicedAmount / stats.billableAmount) * 100 : 0;
            return {
                name,
                billablePercentage: billablePercentage.toFixed(2),
                realisedPercentage: realisedPercentage.toFixed(2),
            }
        });


        return { weeklyChartData: weeklyChartDataWithMovingAvg, staffLeaderboard, overallBillablePercentage, overallRealisedPercentage, departmentAverages };
    }, [timeEntries, users]);

    const { weeklyChartData, staffLeaderboard, overallBillablePercentage, overallRealisedPercentage, departmentAverages } = processedData;
    
    const filteredStaff = staffLeaderboard.filter(staff => 
        staff.StaffName.toLowerCase().includes(staffSearch.toLowerCase())
    );

    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Billable Percentage & Rolling Average</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="WeekStartDate" tickFormatter={(date) => format(parseISO(date), 'MMM yy')} />
                                <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                                <Legend />
                                <Bar dataKey="BillablePercentage" fill="#8884d8" name="Billable %" />
                                <Line type="monotone" dataKey="RollingAvg4Week" stroke="#ff7300" name="4-Week Rolling Avg" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Billable Percentage & Loess Trend</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                             <ComposedChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="WeekStartDate" tickFormatter={(date) => format(parseISO(date), 'MMM yy')} />
                                <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="BillablePercentage" stroke="#8884d8" name="Billable %" dot={false} />
                                <Line type="monotone" dataKey="RollingAvg4Week" stroke="#82ca9d" name="Weighted Loess Trend" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-gray-500">TARGET 60%</p>
                        <p className="text-5xl font-bold">{overallBillablePercentage.toFixed(2)}</p>
                        <p className="text-lg">Billable Percentage</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-gray-500">TARGET 57%</p>
                        <p className="text-5xl font-bold">{overallRealisedPercentage.toFixed(2)}</p>
                        <p className="text-lg">Realised Billable Percentage</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Department Averages</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dept</TableHead>
                                    <TableHead className="text-right">Billable %</TableHead>
                                    <TableHead className="text-right">Realised %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departmentAverages.map(dept => (
                                    <TableRow key={dept.name}>
                                        <TableCell>{dept.name}</TableCell>
                                        <TableCell className="text-right">{dept.billablePercentage}%</TableCell>
                                        <TableCell className="text-right">{dept.realisedPercentage}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Staff Billable %</CardTitle>
                        <div className="relative mt-2">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                           <Input 
                                placeholder="Search staff..."
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                className="pl-9"
                           />
                        </div>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead className="text-right">Billable %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaff.map(staff => (
                                    <TableRow key={staff.StaffName}>
                                        <TableCell>{staff.StaffName}</TableCell>
                                        <TableCell className="text-right">{staff.BillablePercentage}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}
