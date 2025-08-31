
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function MonthlyDrillDown({ allData, dateRange }) {
    const { invoices, projects, clients } = allData;

    const availableMonths = useMemo(() => {
        const months = new Set();
        invoices.forEach(i => {
            if (i.sent_date) {
                try {
                    months.add(format(startOfMonth(parseISO(i.sent_date)), 'yyyy-MM-dd'));
                } catch (error) {
                    console.warn('Invalid date in invoice:', i.sent_date, error);
                }
            }
        });
        return Array.from(months).sort((a,b) => new Date(b) - new Date(a));
    }, [invoices]);

    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0] || format(new Date(), 'yyyy-MM-dd'));
    
    const monthlyData = useMemo(() => {
        if (!selectedMonth) return { topClients: [], topJobs: [], writeOffs: { total: 0, byJob: [] }};

        try {
            const monthStart = startOfMonth(parseISO(selectedMonth));
            const monthEnd = endOfMonth(parseISO(selectedMonth));

            const monthInvoices = invoices.filter(i => {
                if (!i.sent_date) return false;
                try {
                    const sentDate = parseISO(i.sent_date);
                    return sentDate >= monthStart && sentDate <= monthEnd;
                } catch (error) {
                    // console.warn('Invalid invoice sent date during filter:', i.sent_date, error); // Uncomment for more verbose logging
                    return false;
                }
            });

            const clientTotals = {};
            monthInvoices.forEach(invoice => {
                const client = clients.find(c => c.id === invoice.client_id);
                if(client) {
                    clientTotals[client.company_name] = (clientTotals[client.company_name] || 0) + invoice.total_amount;
                }
            });
            const topClients = Object.entries(clientTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

            const jobTotals = {};
            monthInvoices.forEach(invoice => {
                invoice.project_ids.forEach(pid => {
                    const project = projects.find(p => p.id === pid);
                    if(project) {
                        const jobName = `${project.job_number || ''}: ${project.project_name}`;
                        jobTotals[jobName] = (jobTotals[jobName] || 0) + invoice.total_amount / (invoice.project_ids.length || 1);
                    }
                })
            });
            const topJobs = Object.entries(jobTotals).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 10);
            
            let totalWriteOffs = 0;
            const writeOffsByJob = {};
            monthInvoices.forEach(invoice => {
                (invoice.written_off_entries || []).forEach(wo => {
                    const amount = wo.write_off_amount || 0;
                    totalWriteOffs += amount;
                    invoice.project_ids.forEach(pid => {
                        const project = projects.find(p => p.id === pid);
                        if(project) {
                            const jobName = project.project_name;
                            writeOffsByJob[jobName] = (writeOffsByJob[jobName] || 0) + amount / (invoice.project_ids.length || 1);
                        }
                    });
                });
            });
            const topWriteOffJobs = Object.entries(writeOffsByJob).map(([name, value]) => ({name, value: Math.round(value)})).sort((a, b) => b.value - a.value).slice(0,10);


            return { topClients, topJobs, writeOffs: { total: totalWriteOffs, byJob: topWriteOffJobs } };
        } catch (error) {
            console.warn('Error processing monthly data:', error);
            return { topClients: [], topJobs: [], writeOffs: { total: 0, byJob: [] }};
        }
    }, [selectedMonth, invoices, projects, clients]);

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Monthly Drill Down: {selectedMonth && format(parseISO(selectedMonth), 'MMMM yyyy')}</h2>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{format(parseISO(month), 'MMMM yyyy')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Top 10 Clients</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={monthlyData.topClients} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {monthlyData.topClients.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top 10 Jobs Invoiced</CardTitle></CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData.topJobs} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12}}/>
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Write On and Off's per Job</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-3 gap-6">
                        <div className="col-span-1 flex flex-col items-center justify-center bg-red-50 rounded-lg p-4">
                            <p className="text-lg text-gray-600">Write On and Off's</p>
                            <p className="text-4xl font-bold text-red-800">-${(monthlyData.writeOffs.total / 1000).toFixed(2)}K</p>
                        </div>
                        <div className="col-span-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData.writeOffs.byJob} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12}} />
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#333333" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
