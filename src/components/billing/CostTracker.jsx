
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet } from "lucide-react";
import { CostTracker as CostTrackerEntity, TOE, Project, TimeEntry, Invoice, Task } from "@/api/entities";

export default function CostTracker({ project, onClose }) {
  const [costData, setCostData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (project) {
      loadCostTrackerData();
    }
  }, [project]);

  const loadCostTrackerData = async () => {
    setIsLoading(true);
    try {
      const [toeData, projectTasks, invoices, timeEntries] = await Promise.all([
        project.toe_id ? TOE.get(project.toe_id) : null,
        Task.filter({ project_id: project.id }),
        Invoice.filter({ project_ids: { $in: [project.id] } }), // Fixed: Use $in operator for array search
        TimeEntry.filter({ project_id: project.id })
      ]);
      
      const taskMap = projectTasks.reduce((map, task) => {
        map[task.id] = task.task_name;
        return map;
      }, {});

      const taskBreakdown = {};
      
      // Initialize from TOE data
      if (toeData?.fee_structure) {
        toeData.fee_structure.forEach(item => {
          taskBreakdown[item.description] = {
            task_name: item.description,
            original_estimate: item.cost || 0,
            invoiced_amount: 0,
            actual_cost: 0
          };
        });
      }

      // Add actual costs from time entries
      timeEntries.forEach(entry => {
        const taskName = taskMap[entry.task_id] || 'General';
        if (!taskBreakdown[taskName]) {
          taskBreakdown[taskName] = { 
            task_name: taskName, 
            original_estimate: 0, 
            invoiced_amount: 0, 
            actual_cost: 0 
          };
        }
        taskBreakdown[taskName].actual_cost += entry.cost_amount || 0;
      });

      // Process invoices - check both project_ids array and individual project_id
      const invoiceHistory = [];
      invoices.forEach(invoice => {
        // Check if this invoice relates to our project
        const isRelatedToProject = 
          (Array.isArray(invoice.project_ids) && invoice.project_ids.includes(project.id)) ||
          invoice.project_id === project.id;

        if (isRelatedToProject && invoice.line_items) {
          invoice.line_items.forEach(lineItem => {
            // Match line items to tasks by description parsing
            let taskName = 'General';
            
            // Try to extract task name from description (format: "Project Name: Task Name")
            if (lineItem.description && lineItem.description.includes(':')) {
              const parts = lineItem.description.split(':');
              if (parts.length > 1) {
                taskName = parts[1].trim();
              }
            } else if (lineItem.task_id) {
              taskName = taskMap[lineItem.task_id] || 'General';
            }

            if (!taskBreakdown[taskName]) {
              taskBreakdown[taskName] = { 
                task_name: taskName, 
                original_estimate: 0, 
                invoiced_amount: 0, 
                actual_cost: 0 
              };
            }
            
            taskBreakdown[taskName].invoiced_amount += lineItem.amount || 0;
          });
          
          invoiceHistory.push({
            date: invoice.created_date,
            invoice_number: invoice.invoice_number,
            amount: invoice.total_amount,
            status: invoice.status
          });
        }
      });
      
      const originalEstimate = Object.values(taskBreakdown).reduce((sum, task) => sum + task.original_estimate, 0);
      const totalInvoiced = Object.values(taskBreakdown).reduce((sum, task) => sum + task.invoiced_amount, 0);
      
      setCostData({
        project_id: project.id,
        original_fee_estimate: originalEstimate,
        total_invoiced: totalInvoiced,
        task_breakdown: Object.values(taskBreakdown),
        invoice_history: invoiceHistory.sort((a, b) => new Date(a.date) - new Date(b.date))
      });

    } catch (error) {
      console.error('Error loading cost tracker data:', error);
    }
    setIsLoading(false);
  };

  const exportToExcel = () => {
    alert('Excel export functionality would be implemented here');
  };

  if (isLoading || !costData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-6xl">
          <CardContent className="p-6 text-center">
            <p>{isLoading ? 'Loading cost tracker data...' : 'No cost data available for this project.'}</p>
            {!isLoading && <Button onClick={onClose} className="mt-4">Close</Button>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="bg-gray-800 text-white">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-xl">Cost & Invoice Tracking Summary - {project.job_number}</CardTitle>
                    <p className="text-gray-300 mt-1">{project.project_name}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm">Client: {project.client_name}</p>
                    <p className="text-sm">PM: {project.project_manager}</p>
                </div>
            </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold border-b-2 border-black">TASK</TableHead>
                  <TableHead className="font-bold border-b-2 border-black text-right">FEE ESTIMATE</TableHead>
                  <TableHead className="font-bold border-b-2 border-black text-right">INVOICED</TableHead>
                  <TableHead className="font-bold border-b-2 border-black text-right">VARIATION</TableHead>
                  <TableHead className="font-bold border-b-2 border-black text-right">% COMPLETE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costData.task_breakdown.map((task, index) => {
                  const variation = task.invoiced_amount - task.original_estimate;
                  const percentage = task.original_estimate > 0 ? (task.invoiced_amount / task.original_estimate * 100) : (task.invoiced_amount > 0 ? 100 : 0);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{task.task_name}</TableCell>
                      <TableCell className="text-right">${task.original_estimate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-right">${task.invoiced_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                      <TableCell className={`text-right font-medium ${variation > 0 ? 'text-orange-600' : variation < 0 ? 'text-red-600' : ''}`}>
                        ${variation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </TableCell>
                      <TableCell className="text-right">{percentage.toFixed(0)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 mt-8">
             <Button variant="outline" onClick={exportToExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
