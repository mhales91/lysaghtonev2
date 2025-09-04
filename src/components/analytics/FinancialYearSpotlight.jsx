
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{`${p.name}: $${p.value.toLocaleString()}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialYearSpotlight({ data, monthlyBudgets }) {
    const { invoices, projects, clients } = data;
    
    const monthlyData = useMemo(() => {
        const months = {};
        invoices.forEach(invoice => {
            if (!invoice.sent_date) return; // Skip if sent_date is null or undefined
            try {
                const date = parseISO(invoice.sent_date);
                const monthKey = format(date, 'MMM yyyy');
                const budgetKey = format(date, 'MMM').toLowerCase();

                if (!months[monthKey]) {
                    months[monthKey] = { invoiced: 0, budget: monthlyBudgets?.[budgetKey] || 0 };
                }
                months[monthKey].invoiced += invoice.total_amount || 0; // Add || 0 for robustness
            } catch (error) {
                console.warn('Invalid date in invoice:', invoice.sent_date, error);
            }
        });

        return Object.keys(months).map(month => ({
            name: month,
            'Invoiced Amount': Math.round(months[month].invoiced),
            'Monthly Budget Amount': Math.round(months[month].budget),
        })).sort((a,b) => new Date(a.name) - new Date(b.name));
    }, [invoices, monthlyBudgets]);

    const topClientsData = useMemo(() => {
        const clientTotals = {};
        invoices.forEach(invoice => {
            const client = clients.find(c => c.id === invoice.client_id);
            if (client) {
                if (!clientTotals[client.name]) {
                    clientTotals[client.name] = 0;
                }
                clientTotals[client.name] += invoice.total_amount || 0; // Add || 0 for robustness
            }
        });

        return Object.entries(clientTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [invoices, clients]);

    const jobsWonData = useMemo(() => {
        const months = {};
        projects.forEach(project => {
            if (!project.created_date) return; // Skip if created_date is null or undefined
            try {
                const month = format(parseISO(project.created_date), 'MMM yyyy');
                const client = clients.find(c => c.id === project.client_id);
                if(client) {
                    const value = client.estimated_value || 0;
                    if (!months[month]) {
                        months[month] = 0;
                    }
                    months[month] += value;
                }
            } catch (error) {
                console.warn('Invalid date in project:', project.created_date, error);
            }
        });
        
        return Object.keys(months).map(month => ({
            name: month,
            'Jobs Won Value': Math.round(months[month]),
        })).sort((a,b) => new Date(a.name) - new Date(b.name));
    }, [projects, clients]);
    
    const totalInvoiced = useMemo(() => 
        monthlyData.reduce((acc, month) => acc + month['Invoiced Amount'], 0),
    [monthlyData]);

    const totalBudget = useMemo(() => 
        monthlyBudgets ? Object.values(monthlyBudgets).reduce((acc, val) => acc + val, 0) : 0,
    [monthlyBudgets]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Invoicing vs Budget</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Invoiced Amount" fill="#8884d8" />
                                <Bar dataKey="Monthly Budget Amount" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="col-span-1 flex flex-col items-center justify-center bg-purple-50 rounded-lg p-4">
                        <p className="text-lg text-gray-600">Total Invoiced</p>
                        <p className="text-4xl font-bold text-purple-800">${(totalInvoiced / 1000).toFixed(1)}K</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{width: `${(totalInvoiced/totalBudget)*100}%`}}></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">of ${ (totalBudget / 1000000).toFixed(2)}M target</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={topClientsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {topClientsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Jobs Won</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={jobsWonData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="Jobs Won Value" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
