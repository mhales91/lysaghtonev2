
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, DollarSign, User, Receipt, FileText, Search, Calculator } from "lucide-react";
import { Project, Client, Task, User as UserEntity } from "@/api/entities";
import { format } from "date-fns";

export default function DraftInvoices({ timeEntries, projects, clients, invoices, currentUser, isLoading, onCreateInvoice, onEditInvoice, onApproveInvoice, onShowCostTracker }) {
  const [pmFilter, setPmFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getClientName = (clientId) => {
    const client = (clients || []).find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getProjectName = (projectId) => {
    const project = (projects || []).find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Group unbilled time entries by project and task first
  const groupedWIP = (timeEntries || [])
    .filter(entry => {
      const isEligible = entry.billable === true && 
                        (entry.minutes > 0 || entry.hours > 0) &&
                        !entry.invoice_id;
      return isEligible;
    })
    .reduce((acc, entry) => {
      const projectId = entry.project_id;
      const taskId = entry.task_id; // Assuming task_id exists
      if (!projectId) return acc;
      
      // Create a unique key per project-task combination to avoid double-counting
      // If taskId is not present, fallback to just projectId to group all entries for a project without task
      const taskKey = `${projectId}-${taskId || 'no_task'}`; 
      
      if (!acc[taskKey]) {
        const project = (projects || []).find(p => p.id === projectId);
        acc[taskKey] = {
          project,
          entries: [],
          totalHours: 0,
          totalValue: 0,
          projectId: projectId, // Keep for grouping in the next step
          taskId: taskId // Keep for potential future use if needed
        };
      }
      
      acc[taskKey].entries.push(entry);
      
      const hours = entry.minutes ? (entry.minutes / 60) : (entry.hours || 0);
      acc[taskKey].totalHours += hours;
      
      const rate = entry.billable_rate_effective || entry.hourly_rate || 180;
      const value = entry.billable_amount || (hours * rate);
      acc[taskKey].totalValue += value;
      
      return acc;
    }, {});

  // Group the task-level WIP objects back into project-level groups for display
  const projectGroups = Object.values(groupedWIP).reduce((acc, taskGroup) => {
    const projectId = taskGroup.projectId;
    if (!acc[projectId]) {
      acc[projectId] = {
        project: taskGroup.project, // Project details are the same across task groups for this project
        taskGroups: [], // Array to hold individual taskGroup objects
        totalHours: 0,
        totalValue: 0
      };
    }
    
    acc[projectId].taskGroups.push(taskGroup); // Add the taskGroup to this project's list
    acc[projectId].totalHours += taskGroup.totalHours;
    acc[projectId].totalValue += taskGroup.totalValue;
    
    return acc;
  }, {});

  let wipProjects = Object.values(projectGroups);

  console.log('Draft invoices - grouped WIP projects:', wipProjects.length);
  // Ensure wipProjects[0] exists before trying to access it for logging
  if (wipProjects.length > 0) {
    console.log('Sample WIP project:', wipProjects[0]);
  } else {
    console.log('No WIP projects to display sample.');
  }


  // Apply filters
  if (pmFilter !== "all") {
    wipProjects = wipProjects.filter(({ project }) => 
      project?.project_manager === pmFilter
    );
  }

  if (searchTerm) {
    wipProjects = wipProjects.filter(({ project }) => {
      const projectName = project?.name?.toLowerCase() || '';
      const clientName = getClientName(project?.client_id).toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return projectName.includes(searchLower) || clientName.includes(searchLower);
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search at top of page */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects, clients, or invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={pmFilter} onValueChange={setPmFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Project Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Project Managers</SelectItem>
                {/* Add project managers here based on your user data */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Unbilled Time Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Unbilled Time Ready for Invoicing
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create new invoices from unbilled time entries ({wipProjects.length} projects). 
            Write-offs and adjustments can be made during invoice creation and editing.
          </p>
        </CardHeader>
      </Card>

      {wipProjects.length > 0 ? (
        <div className="grid gap-6">
          {wipProjects.map((projectGroup) => ( // Renamed from { project, entries, totalHours, totalValue } to projectGroup
            <Card key={projectGroup.project?.id || 'unknown'} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {projectGroup.project?.description || 'N/A'} - {getProjectName(projectGroup.project?.id)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Client: {getClientName(projectGroup.project?.client_id)}
                    </p>
                    {projectGroup.project?.project_manager && (
                      <p className="text-xs text-gray-500">
                        Manager: {projectGroup.project.project_manager}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ${projectGroup.totalValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {projectGroup.totalHours.toFixed(1)} hours
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-medium mb-3 text-gray-700">Time Entries ({projectGroup.taskGroups.reduce((sum, tg) => sum + tg.entries.length, 0)})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {projectGroup.taskGroups.map((taskGroup, tgIndex) => 
                      taskGroup.entries.slice(0, 5).map((entry, index) => ( // Display up to 5 entries per task group
                        <div key={`${tgIndex}-${entry.id || index}`} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{entry.user_email}</span>
                            <span className="mx-2">•</span>
                            <span>{format(new Date(entry.date), 'MMM d')}</span>
                            <span className="mx-2">•</span>
                            <span className="text-gray-600">{entry.description || 'No description'}</span>
                            {!entry.billable && (
                              <Badge variant="secondary" className="ml-2 text-xs">Non-billable</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {((entry.minutes || 0) / 60).toFixed(1)}h
                            </div>
                            <div className="text-xs text-gray-500">
                              ${(entry.billable_amount || ((entry.minutes || 0) / 60) * 180).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {projectGroup.taskGroups.reduce((sum, tg) => sum + tg.entries.length, 0) > 5 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        {/* Note: This logic for 'more entries' assumes a total limit of 5 for the project,
                            while the display shows up to 5 per task group. This may lead to inconsistencies
                            if a project has multiple task groups with entries.
                            The outline specified 'total - 5'. */}
                        ... and {projectGroup.taskGroups.reduce((sum, tg) => sum + tg.entries.length, 0) - 5} more entries
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => onShowCostTracker(projectGroup.project)}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Cost Tracker
                  </Button>
                  <Button 
                    onClick={() => onCreateInvoice(projectGroup.taskGroups.flatMap(tg => tg.entries))} // Flatten all entries from all task groups
                    style={{ backgroundColor: '#5E0F68' }}
                    className="hover:bg-purple-700"
                  >
                    <Receipt className="w-4 h-4 mr-2" />
                    Create Invoice (${projectGroup.totalValue.toLocaleString()})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">No unbilled time found</p>
            <p className="text-gray-500">
              {pmFilter !== "all" || searchTerm 
                ? 'Try adjusting your filters to see more results'
                : 'All billable time has been invoiced or there are no approved time entries'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Draft Invoices Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Draft Invoices ({(invoices || []).filter(i => i.status === 'draft').length})
          </CardTitle>
          <p className="text-sm text-gray-600">
            Review, edit, and approve draft invoices. You can adjust amounts and write-off entries before sending to Xero.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(invoices || []).filter(i => i.status === 'draft').map((invoice) => {
              const client = clients.find(c => c.id === invoice.client_id);
              const project = projects.find(p => invoice.project_ids?.includes(p.id));
              
              return (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {invoice.invoice_number || `INV-${invoice.id.slice(-6)}`}
                      </h3>
                      <Badge className="bg-orange-100 text-orange-800">Draft</Badge>
                      {invoice.written_off_entries?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {invoice.written_off_entries.length} write-offs
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Client:</strong> {client?.name || 'Unknown'}</p>
                      {project && (
                        <p><strong>Project:</strong> {project.description || 'N/A'} - {project.name}</p>
                      )}
                      <p><strong>Created:</strong> {invoice.created_date ? format(new Date(invoice.created_date), 'PPP') : 'N/A'}</p>
                      {invoice.due_date && (
                        <p><strong>Due:</strong> {format(new Date(invoice.due_date), 'PPP')}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${(invoice.total_amount || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.line_items?.length || 0} items
                      </p>
                      {invoice.written_off_entries?.length > 0 && (
                        <p className="text-xs text-orange-600">
                          ${invoice.written_off_entries.reduce((sum, wo) => sum + (wo.write_off_amount || 0), 0).toFixed(2)} written off
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {project && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onShowCostTracker(project)}
                        >
                          <Calculator className="w-4 h-4 mr-2" />
                          Cost Tracker
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditInvoice(invoice)}
                      >
                        Edit & Write-offs
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => onApproveInvoice(invoice)}
                        style={{ backgroundColor: '#5E0F68' }}
                        className="hover:bg-purple-700 text-white"
                      >
                        Approve & Send
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(invoices || []).filter(i => i.status === 'draft').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No draft invoices</p>
                <p className="text-sm">Create invoices from unbilled time below</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
