
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, BarChart3, TrendingUp, Clock, DollarSign, Filter, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Project, Client, Task, User, TimeEntry } from "@/api/entities"; // These imports might not be strictly needed if data comes from props, but keeping them for consistency and potential future use.
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";

export default function WIPSheet({ onCreateInvoice, timeEntries, projects, clients, isLoading }) {
  const [wipSummary, setWipSummary] = useState({
    totalTime: 0,
    totalCosts: 0,
    totalWIP: 0
  });
  const [wipByClient, setWipByClient] = useState([]);
  const [detailedWIP, setDetailedWIP] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClient, setFilterClient] = useState("all");

  useEffect(() => {
    // Only process data if not loading and all necessary data props are provided
    if (!isLoading && timeEntries && projects && clients) {
      processWIPData();
    } else if (isLoading || !timeEntries || !projects || !clients) {
      // Clear data if loading or if props are missing/not ready
      setWipSummary({ totalTime: 0, totalCosts: 0, totalWIP: 0 });
      setWipByClient([]);
      setDetailedWIP([]);
      setMonthlyChart([]);
    }
  }, [timeEntries, projects, clients, isLoading]);

  const processWIPData = () => {
    try {
      // Data is now received via props
      const clientData = clients;
      const projectData = projects;
      const timeEntryData = timeEntries;

      const calculateBillableAmount = (entry) => {
        // Priority 1: Use billable_amount if it's explicitly set on the time entry.
        if (typeof entry.billable_amount === 'number') {
            return entry.billable_amount;
        }
        
        // Priority 2: Calculate from minutes and an effective rate if present.
        if (typeof entry.minutes === 'number' && typeof entry.billable_rate_effective === 'number') {
            return (entry.minutes / 60) * entry.billable_rate_effective;
        }
    
        // Fallback for older data or entries missing calculated values.
        const hours = (typeof entry.minutes === 'number' ? entry.minutes : 0) / 60;
        const rate = 180; // Hardcoded fallback rate
        return hours * rate;
      };

      // Calculate WIP summary - Time value + Direct costs (NOT staff costs)
      const totalTime = timeEntryData.reduce((sum, entry) => sum + calculateBillableAmount(entry), 0);
      
      // Direct costs are consumables, materials, etc. - NOT staff costs
      const totalDirectCosts = timeEntryData.reduce((sum, entry) => {
        // Only include direct costs (consumables, materials, etc.)
        // cost_amount represents internal staff costs, so we exclude it
        const directCost = entry.direct_cost_amount || 0; // Use a separate field for direct costs
        return sum + directCost;
      }, 0);
      
      setWipSummary({
        totalTime: totalTime,
        totalCosts: totalDirectCosts, // Direct costs only
        totalWIP: totalTime + totalDirectCosts // Time value + direct costs
      });

      // Group by client for top clients view
      const clientWIP = {};
      const clientJobCounts = {};
      
      timeEntryData.forEach(entry => {
        const project = projectData.find(p => p.id === entry.project_id);
        if (!project) return;
        
        const client = clientData.find(c => c.id === project.client_id);
        if (!client) return;
        
        const clientName = client.name;
        
        if (!clientWIP[clientName]) {
          clientWIP[clientName] = 0;
          clientJobCounts[clientName] = new Set();
        }
        
        clientWIP[clientName] += calculateBillableAmount(entry);
        clientWIP[clientName] += entry.direct_cost_amount || 0; // Add direct costs
        clientJobCounts[clientName].add(project.id);
      });

      const wipByClientArray = Object.entries(clientWIP)
        .map(([clientName, wip]) => ({
          clientName,
          jobs: clientJobCounts[clientName].size,
          wip: wip
        }))
        .sort((a, b) => b.wip - a.wip)
        .slice(0, 5);

      setWipByClient(wipByClientArray);

      // Create detailed WIP list by project
      const projectWIP = {};
      
      timeEntryData.forEach(entry => {
        const projectId = entry.project_id;
        if (!projectId) return;
        
        if (!projectWIP[projectId]) {
          const project = projectData.find(p => p.id === projectId);
          if (!project) return;
          
          const client = clientData.find(c => c.id === project.client_id);
          
          projectWIP[projectId] = {
            id: projectId,
            jobNumber: project.description || 'N/A',
            jobName: project.name || 'Unknown Project',
            clientName: client?.name || 'Unknown Client',
            time: 0,
            costs: 0, // Direct costs only
            deposits: 0,
            wip: 0,
            estBilling: 0,
            timeEntries: []
          };
        }
        
        projectWIP[projectId].time += calculateBillableAmount(entry);
        projectWIP[projectId].costs += entry.direct_cost_amount || 0; // Direct costs only
        projectWIP[projectId].timeEntries.push(entry);
      });

      // Calculate WIP and Est Billing for each project
      Object.values(projectWIP).forEach(project => {
        project.wip = project.time + project.costs - project.deposits; // Time + direct costs - deposits
        project.estBilling = project.time + project.costs; // Time + direct costs
      });

      setDetailedWIP(Object.values(projectWIP).filter(p => p.time > 0 || p.costs > 0));

      // Generate real monthly chart data
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        // Filter time entries for this month
        const monthEntries = timeEntryData.filter(entry => {
          const entryDate = parseISO(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd;
        });
        
        const monthValue = monthEntries.reduce((sum, entry) => sum + calculateBillableAmount(entry), 0);
        
        monthlyData.push({
          month: format(monthDate, 'MMM'),
          value: monthValue
        });
      }
      setMonthlyChart(monthlyData);

    } catch (error) {
      console.error('Error processing WIP data:', error);
    }
  };

  const handleJobSelection = (jobId, selected) => {
    if (selected) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  const handleCreateInvoices = () => {
    if (selectedJobs.length === 0) {
      alert('Please select at least one job to create invoices.');
      return;
    }

    // Get time entries for selected jobs
    const selectedTimeEntries = [];
    selectedJobs.forEach(jobId => {
      const project = detailedWIP.find(p => p.id === jobId);
      if (project) {
        selectedTimeEntries.push(...project.timeEntries);
      }
    });

    onCreateInvoice(selectedTimeEntries);
  };

  const filteredWIP = detailedWIP.filter(project => {
    const matchesSearch = !searchTerm || 
      project.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.jobNumber.toString().includes(searchTerm);
    
    // Find the project object to get its client_id, then find the client object to match by ID
    const projectObject = projects.find(p => p.id === project.id);
    const clientObject = clients.find(c => c.id === projectObject?.client_id);
    const matchesClient = filterClient === 'all' || (clientObject && clientObject.id === filterClient);
    
    return matchesSearch && matchesClient;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Selector - Removed date selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Work in Progress</h2>
        <p className="text-sm text-gray-500">
          Showing all unbilled time as of today
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wipSummary.totalTime.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wipSummary.totalCosts.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">WIP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wipSummary.totalWIP.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Client Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aged Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Aged
            </CardTitle>
            <p className="text-sm text-gray-600">As of {format(new Date(), 'MMMM dd, yyyy, h:mm:ss a')}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>WIP - Top Clients</CardTitle>
            <div className="flex gap-4 text-sm text-gray-500">
              <span className="flex-1">Client</span>
              <span className="w-12 text-center">Jobs</span>
              <span className="w-20 text-right">WIP</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wipByClient.map((client, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <div className="flex-1">
                    <p className="font-medium text-green-600">{client.clientName}</p>
                  </div>
                  <div className="w-12 text-center">{client.jobs}</div>
                  <div className="w-20 text-right font-medium">${client.wip.toFixed(0)}</div>
                </div>
              ))}
              {wipByClient.length === 0 && (
                <p className="text-gray-500 text-center py-4">No WIP data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>List</CardTitle>
              <p className="text-sm text-gray-600">
                Data last updated at {format(new Date(), 'MMMM dd, yyyy, h:mm:ss a')}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-gray-600">
                  <th className="text-left py-3 px-2">
                    <Checkbox
                      checked={selectedJobs.length === filteredWIP.length && filteredWIP.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedJobs(filteredWIP.map(p => p.id));
                        } else {
                          setSelectedJobs([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-2">Job</th>
                  <th className="text-left py-3 px-2">Client</th>
                  <th className="text-right py-3 px-2">Time</th>
                  <th className="text-right py-3 px-2">Costs</th>
                  <th className="text-right py-3 px-2">Deposits</th>
                  <th className="text-right py-3 px-2">WIP</th>
                  <th className="text-right py-3 px-2">Est. Billing</th>
                </tr>
              </thead>
              <tbody>
                {filteredWIP.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Checkbox
                        checked={selectedJobs.includes(project.id)}
                        onCheckedChange={(checked) => handleJobSelection(project.id, checked)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{project.jobNumber}</p>
                        <p className="text-sm text-blue-600">{project.jobName}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-green-600">{project.clientName}</span>
                    </td>
                    <td className="py-3 px-2 text-right">${project.time.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right">${project.costs.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right">${project.deposits.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-medium">${project.wip.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right">${project.estBilling.toFixed(2)}</td>
                  </tr>
                ))}
                {filteredWIP.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      {searchTerm || filterClient !== 'all' ? 'No matching projects found' : 'No WIP data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {selectedJobs.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="text-sm text-blue-800">
                  {selectedJobs.length} job(s) selected
                </p>
                <Button 
                  onClick={handleCreateInvoices}
                  style={{ backgroundColor: '#5E0F68' }}
                  className="hover:bg-purple-700"
                >
                  Create Invoices
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
