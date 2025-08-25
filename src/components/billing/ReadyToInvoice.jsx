import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { groupBy } from 'lodash';

export default function ReadyToInvoice({ timeEntries, projects, clients, isLoading, onCreateInvoice }) {
  const billableEntries = useMemo(() => {
    return timeEntries.filter(te => te.status === 'approved' && te.billable);
    // In a real app, you'd also check if it's already been invoiced.
  }, [timeEntries]);
  
  const projectsToInvoice = useMemo(() => {
    return groupBy(billableEntries, 'project_id');
  }, [billableEntries]);
  
  const getProject = (id) => projects.find(p => p.id === id);
  const getClient = (id) => clients.find(c => c.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects with Billable Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(projectsToInvoice).map(projectId => {
          const entries = projectsToInvoice[projectId];
          const project = getProject(projectId);
          if (!project) return null;
          const client = getClient(project.client_id);
          const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
          const totalValue = entries.reduce((sum, e) => sum + e.total_cost, 0);

          return (
            <div key={projectId} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{project.project_name}</p>
                <p className="text-sm text-gray-500">{client?.company_name}</p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="font-semibold">{totalHours.toFixed(2)} hrs</p>
                  <p className="text-sm text-gray-500">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <Button onClick={() => onCreateInvoice(entries)}>Create Invoice</Button>
              </div>
            </div>
          );
        })}
        {Object.keys(projectsToInvoice).length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">No approved billable time to invoice.</div>
        )}
      </CardContent>
    </Card>
  );
}