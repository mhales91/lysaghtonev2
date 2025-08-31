
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57'];

export default function WriteOffSpotlight({ data }) {
    const { invoices } = data;

    const processedData = useMemo(() => {
        const monthlySummary = {};
        const categorySummary = {};
        let totalWriteOffs = 0;

        invoices.forEach(invoice => {
            if (!invoice.sent_date) return; // Skip invoice if sent_date is null or undefined
            try {
                const month = format(parseISO(invoice.sent_date), 'MMM yyyy');
                if (!monthlySummary[month]) {
                    monthlySummary[month] = { writeOffs: 0, invoiced: 0 };
                }
                monthlySummary[month].invoiced += invoice.total_amount || 0; // Use || 0 for robustness

                (invoice.written_off_entries || []).forEach(wo => {
                    const amount = wo.write_off_amount || 0;
                    monthlySummary[month].writeOffs += amount;
                    totalWriteOffs += amount;

                    const category = wo.write_off_reason || 'Unknown';
                    if (!categorySummary[category]) {
                        categorySummary[category] = 0;
                    }
                    categorySummary[category] += amount;
                });
            } catch (error) {
                console.warn('Invalid date or processing error for invoice:', invoice.sent_date, error);
            }
        });

        const monthlyChartData = Object.keys(monthlySummary).map(month => ({
            name: month,
            'Write Offs': Math.round(monthlySummary[month].writeOffs),
            'Monthly Invoiced Amount': Math.round(monthlySummary[month].invoiced),
        })).sort((a,b) => new Date(a.name) - new Date(b.name));

        const categoryChartData = Object.entries(categorySummary)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);

        return { monthlyChartData, categoryChartData, totalWriteOffs };
    }, [invoices]);

    const { monthlyChartData, categoryChartData, totalWriteOffs } = processedData;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Write Offs vs Invoiced Amounts</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value, name) => [`$${value.toLocaleString()}`, name]}/>
                                <Legend />
                                <Bar dataKey="Write Offs" stackId="a" fill="#333333" />
                                <Bar dataKey="Monthly Invoiced Amount" stackId="a" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="col-span-1 flex flex-col items-center justify-center bg-red-50 rounded-lg p-4">
                        <p className="text-lg text-gray-600">Sum of Write offs</p>
                        <p className="text-4xl font-bold text-red-800">-${(totalWriteOffs / 1000).toFixed(2)}K</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Write Off Amount by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {categoryChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Write Off Amount by Month</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}/>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="Write Offs" fill="#333333" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
