
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, TimeEntry, Project, Client, User, AnalyticsSetting } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { PageLoadingSkeleton } from '@/components/ui/loading-states';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { getNZFinancialYear } from '../components/utils/dateUtils';

import FinancialYearSpotlight from '../components/analytics/FinancialYearSpotlight';
import WriteOffSpotlight from '../components/analytics/WriteOffSpotlight';
import BillableRealisedSpotlight from '../components/analytics/BillableRealisedSpotlight';
import MonthlyDrillDown from '../components/analytics/MonthlyDrillDown';

export default function AnalyticsPage() {
    const [invoices, setInvoices] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [monthlyBudgets, setMonthlyBudgets] = useState(null);
    
    const [dateRange, setDateRange] = useState(() => {
        const { startDate, endDate } = getNZFinancialYear(new Date());
        return { from: startDate, to: endDate };
    });
    
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentFY = getNZFinancialYear(new Date()).startDate.getFullYear();
            const [invoiceData, timeEntryData, projectData, clientData, userData, settingsData] = await Promise.all([
                Invoice.list('-created_date'),
                TimeEntry.list('-created_date'),
                Project.list(),
                Client.list(),
                User.list(),
                AnalyticsSetting.filter({ year: currentFY })
            ]);
            setInvoices(invoiceData || []);
            setTimeEntries(timeEntryData || []);
            setProjects(projectData || []);
            setClients(clientData || []);
            setUsers(userData || []);

            if (settingsData && settingsData.length > 0) {
                setMonthlyBudgets(settingsData[0].department_budgets); // Fixed: use department_budgets
            } else {
                // Create default settings if none exist for the current FY
                const defaultSettings = { year: currentFY, department_budgets: {} }; // Fixed: use department_budgets
                const created = await AnalyticsSetting.create(defaultSettings);
                setMonthlyBudgets(created.department_budgets); // Fixed: use department_budgets
            }
        } catch (error) {
            console.error("Failed to load analytics data", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredData = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return { invoices: [], timeEntries: [], projects: [], clients, users };
        }
        
        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);

        const filteredInvoices = invoices.filter(i => {
            if (!i.sent_date) return false;
            const sentDate = new Date(i.sent_date);
            return !isNaN(sentDate.getTime()) && sentDate >= from && sentDate <= to;
        });

        const filteredTimeEntries = timeEntries.filter(t => {
            if (!t.date) return false;
            const entryDate = new Date(t.date);
            return !isNaN(entryDate.getTime()) && entryDate >= from && entryDate <= to;
        });

        const filteredProjects = projects.filter(p => {
            if (!p.created_date) return false;
            const createdDate = new Date(p.created_date);
            return !isNaN(createdDate.getTime()) && createdDate >= from && createdDate <= to;
        });

        return { 
            invoices: filteredInvoices, 
            timeEntries: filteredTimeEntries, 
            projects: filteredProjects,
            clients,
            users
        };
    }, [invoices, timeEntries, projects, clients, users, dateRange]);

    if (isLoading) {
        return <PageLoadingSkeleton title="Loading Analytics..." />;
    }

    return (
        <div className="p-6 space-y-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                        <p className="text-gray-600">Deep dive into company performance and financials.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                    </div>
                </div>

                <Tabs defaultValue="financial-year" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="financial-year">Financial Year Spotlight</TabsTrigger>
                        <TabsTrigger value="write-off">Write Off Spotlight</TabsTrigger>
                        <TabsTrigger value="billable">Billable & Realised %</TabsTrigger>
                        <TabsTrigger value="monthly-drilldown">Monthly Drill Down</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="financial-year">
                        <FinancialYearSpotlight data={filteredData} monthlyBudgets={monthlyBudgets} />
                    </TabsContent>
                    <TabsContent value="write-off">
                        <WriteOffSpotlight data={filteredData} />
                    </TabsContent>
                     <TabsContent value="billable">
                        <BillableRealisedSpotlight data={filteredData} />
                    </TabsContent>
                    <TabsContent value="monthly-drilldown">
                        <MonthlyDrillDown allData={{invoices, projects, clients, users}} dateRange={dateRange}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
