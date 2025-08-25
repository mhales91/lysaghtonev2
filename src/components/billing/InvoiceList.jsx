
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Calculator, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceList({ 
  invoices, 
  clients, 
  projects,
  title, 
  currentUser,
  onEdit, 
  onApprove, 
  onSendToXero,
  onShowCostTracker
}) {
  const getClient = (clientId) => clients.find(c => c.id === clientId);
  
  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'approved': 'bg-blue-100 text-blue-800',
      'sent': 'bg-green-100 text-green-800',
      'paid': 'bg-emerald-100 text-emerald-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['draft'];
  };

  const getProject = (projectIds) => {
    if (!projectIds || projectIds.length === 0) return null;
    // Assuming projectIds can be an array of IDs, but an invoice might only relate to one project for simplicity in display.
    // Taking the first project ID from the array if multiple are present.
    const firstProjectId = projectIds[0];
    return (projects || []).find(p => p.id === firstProjectId);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 && (
          <div className="text-center p-8 text-gray-500">No invoices in this category.</div>
        )}
        
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const client = getClient(invoice.client_id);
            const project = getProject(invoice.project_ids);
            
            return (
              <div key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1 w-full sm:w-auto mb-4 sm:mb-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {invoice.invoice_number || `INV-${invoice.id.slice(-6)}`}
                    </h3>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                    {invoice.xero_id && (
                      <Badge variant="outline" className="text-xs">
                        Xero ID: {invoice.xero_id}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Client:</strong> {client?.company_name || 'Unknown'}</p>
                    {project && (
                      <p><strong>Project:</strong> {project.job_number} - {project.project_name}</p>
                    )}
                    <p><strong>Created:</strong> {invoice.created_date ? format(new Date(invoice.created_date), 'PPP') : 'N/A'}</p>
                    {invoice.due_date && (
                      <p><strong>Due:</strong> {format(new Date(invoice.due_date), 'PPP')}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="text-right w-full sm:w-auto">
                    <p className="text-2xl font-bold">
                      ${(invoice.total_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.line_items?.length || 0} items
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                    {project && onShowCostTracker && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShowCostTracker(project)}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Cost Tracker
                      </Button>
                    )}
                    
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(invoice)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    
                    {onApprove && (
                      <Button
                        size="sm"
                        onClick={() => onApprove(invoice)}
                        style={{ backgroundColor: '#5E0F68' }}
                        className="hover:bg-purple-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Send
                      </Button>
                    )}
                    
                    {onSendToXero && (
                      <Button
                        size="sm"
                        onClick={() => onSendToXero(invoice)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Send to Xero
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
