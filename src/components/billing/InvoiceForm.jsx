import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus, Trash2, AlertTriangle, BarChart3 } from "lucide-react";
import { format } from 'date-fns';
import { WriteOff, User } from "@/api/entities";
import CostTracker from "./CostTracker";

function ChangesSummary({ invoice }) {
    if (!invoice || invoice.status !== 'draft') {
        return null;
    }

    const changes = [];
    
    (invoice.line_items || []).forEach(item => {
        if (item.time_entry_id && typeof item.original_amount === 'number' && typeof item.amount === 'number') {
            if (Math.abs(item.original_amount - item.amount) > 0.01) {
                changes.push(`Amount for "${item.description}" adjusted from $${item.original_amount.toFixed(2)} to $${item.amount.toFixed(2)}.`);
            }
        }
    });

    (invoice.written_off_entries || []).forEach(item => {
        if (typeof item.original_amount === 'number' && item.original_amount > 0) {
            changes.push(`An entry for ${item.user_email || 'an employee'} (${item.description || 'unspecified'}) of $${item.original_amount.toFixed(2)} was written off: ${item.write_off_reason || 'No reason specified'}.`);
        }
    });

    if (changes.length === 0) {
        return (
            <Card className="mb-6 bg-green-50 border-green-200">
                <CardHeader>
                    <CardTitle className="text-green-800 text-md">Changes Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-700">No adjustments made. All time entries are invoiced at their original amounts.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
                <CardTitle className="text-blue-800 text-md">Changes Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                    {changes.map((change, index) => <li key={index}>{change}</li>)}
                </ul>
            </CardContent>
        </Card>
    );
}

export default function InvoiceForm({ invoice, clients, projects, preselectedEntries, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    client_id: '',
    project_ids: [],
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    line_items: [],
    subtotal: 0,
    gst_amount: 0,
    total_amount: 0,
    status: 'draft',
    attach_cost_tracker: false,
  });

  const [adjustableEntries, setAdjustableEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCostTracker, setShowCostTracker] = useState(null);

  useEffect(() => {
    loadCurrentUser();

    if (invoice) {
      // EDIT MODE: Load existing invoice data and reconstruct adjustable entries
      setFormData({
        ...invoice,
        date: invoice.created_date ? format(new Date(invoice.created_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        due_date: invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        attach_cost_tracker: invoice.attach_cost_tracker || false,
      });
      
      // Reconstruct adjustable entries from existing invoice data for edit mode
      const reconstructedEntries = [];
      
      // Process line items
      (invoice.line_items || []).forEach(lineItem => {
        if (lineItem.time_entry_id) {
          reconstructedEntries.push({
            id: lineItem.time_entry_id,
            user_email: 'Unknown User', // We don't have this stored, but it's for display
            date: invoice.created_date || new Date().toISOString().split('T')[0],
            description: lineItem.description || 'Time entry',
            hours: lineItem.hours || 0,
            hourly_rate: lineItem.rate || 180,
            originalAmount: lineItem.original_amount || lineItem.amount,
            adjustedAmount: lineItem.amount,
            includeInInvoice: true,
            writeOffAmount: Math.max(0, (lineItem.original_amount || lineItem.amount) - lineItem.amount),
            writeOffReason: '',
            isBillable: true,
            writeOffProcessed: false
          });
        }
      });
      
      // Process written-off entries
      (invoice.written_off_entries || []).forEach(writeOffEntry => {
        reconstructedEntries.push({
          id: writeOffEntry.time_entry_id,
          user_email: writeOffEntry.user_email || 'Unknown User',
          date: writeOffEntry.date || invoice.created_date || new Date().toISOString().split('T')[0],
          description: writeOffEntry.description || 'Written-off entry',
          hours: 0, // We don't have this stored
          hourly_rate: 180, // Default
          originalAmount: writeOffEntry.original_amount,
          adjustedAmount: 0, // Written off completely
          includeInInvoice: false,
          writeOffAmount: writeOffEntry.original_amount,
          writeOffReason: writeOffEntry.write_off_reason || 'Previously written off',
          isBillable: true,
          writeOffProcessed: true
        });
      });
      
      setAdjustableEntries(reconstructedEntries);
      
    } else if (preselectedEntries?.length > 0) {
      // CREATE MODE: Process preselected entries from WIP sheet
      console.log('Processing preselected entries:', preselectedEntries);
      
      const firstProjectId = preselectedEntries[0]?.project_id;
      const firstProject = projects.find(p => p.id === firstProjectId);
      const clientId = firstProject?.client_id;
      
      if (!clientId) {
        console.error('No client ID found for project');
        alert('Error: Could not find client for this project. Please check project data.');
        return;
      }
      
      const projectIds = [...new Set(preselectedEntries.map(e => e.project_id).filter(Boolean))];
      
      const entriesWithAdjustments = preselectedEntries.map(entry => {
        const hours = (entry.minutes || 0) / 60;
        const rate = entry.billable_rate_effective || 180;
        const isBillable = entry.billable === true;

        let originalAmount = entry.billable_amount || 0;
        if (isBillable && originalAmount === 0 && hours > 0) {
            originalAmount = hours * rate;
        }

        return {
          ...entry,
          originalAmount: originalAmount,
          adjustedAmount: isBillable ? originalAmount : 0,
          hours: hours,
          hourly_rate: rate,
          includeInInvoice: isBillable,
          writeOffAmount: isBillable ? 0 : originalAmount,
          writeOffReason: isBillable ? '' : 'Non-billable task',
          writeOffCategory: isBillable ? 'other' : 'non_billable_task',
          writeOffProcessed: false,
          isBillable: isBillable
        };
      });

      setAdjustableEntries(entriesWithAdjustments);
      updateTotals(entriesWithAdjustments);
      
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        project_ids: projectIds
      }));
    }
  }, [invoice, preselectedEntries, projects]);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const updateTotals = (entries) => {
    const includedEntries = entries.filter(e => e.includeInInvoice && e.isBillable);
    const subtotal = includedEntries.reduce((sum, entry) => sum + entry.adjustedAmount, 0);
    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    const lineItems = includedEntries.map(entry => {
      const project = projects.find(p => p.id === entry.project_id);
      const projectName = project?.project_name || 'Unknown Project';
      
      return {
        task_id: entry.task_id,
        description: `${projectName}: ${entry.description || 'Time entry'}`,
        hours: entry.hours || 0,
        rate: entry.hourly_rate || 0,
        amount: entry.adjustedAmount,
        time_entry_id: entry.id,
        original_amount: entry.originalAmount,
      };
    });

    setFormData(prev => ({
      ...prev,
      line_items: lineItems,
      subtotal,
      gst_amount: gst,
      total_amount: total
    }));
  };

  const handleEntryToggle = (entryIndex, include) => {
    const updated = [...adjustableEntries];
    if (!updated[entryIndex].isBillable && include) {
        alert('Non-billable entries cannot be included in the invoice.');
        return;
    }

    updated[entryIndex].includeInInvoice = include;
    
    if (!include) {
      updated[entryIndex].writeOffAmount = updated[entryIndex].originalAmount;
      updated[entryIndex].adjustedAmount = 0;
      if (updated[entryIndex].isBillable) {
        updated[entryIndex].writeOffReason = updated[entryIndex].writeOffReason || 'Excluded from invoice';
        updated[entryIndex].writeOffCategory = updated[entryIndex].writeOffCategory || 'other';
      }
    } else {
      updated[entryIndex].writeOffAmount = 0;
      updated[entryIndex].adjustedAmount = updated[entryIndex].originalAmount;
      updated[entryIndex].writeOffReason = '';
      updated[entryIndex].writeOffCategory = 'other';
    }
    
    setAdjustableEntries(updated);
    updateTotals(updated);
  };
  
  const handleAmountChange = (index, newAmount) => {
    const updated = [...adjustableEntries];
    const newAmountValue = parseFloat(newAmount) || 0;
    updated[index].adjustedAmount = newAmountValue;
    updated[index].writeOffAmount = Math.max(0, updated[index].originalAmount - newAmountValue);
    setAdjustableEntries(updated);
    updateTotals(updated);
  };

  const handleWriteOffReasonChange = (index, reason) => {
    const updated = [...adjustableEntries];
    updated[index].writeOffReason = reason;
    setAdjustableEntries(updated);
  };

  const handleManualLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index][field] = value;
    if (field === 'hours' || field === 'rate') {
      const hours = parseFloat(newLineItems[index].hours) || 0;
      const rate = parseFloat(newLineItems[index].rate) || 0;
      newLineItems[index].amount = hours * rate;
    }
    
    const subtotal = newLineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    setFormData(prev => ({ ...prev, line_items: newLineItems, subtotal, gst_amount: gst, total_amount: total }));
  };

  const addManualLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { description: '', hours: 1, rate: 0, amount: 0, time_entry_id: null }
      ]
    }));
  };

  const removeManualLineItem = (index) => {
    const newLineItems = formData.line_items.filter((_, i) => i !== index);
    const subtotal = newLineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const gst = subtotal * 0.15;
    const total = subtotal + gst;
    setFormData(prev => ({ ...prev, line_items: newLineItems, subtotal, gst_amount: gst, total_amount: total }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const writeOffsWithoutReason = adjustableEntries.filter(entry => 
      entry.isBillable && 
      ((!entry.includeInInvoice && !entry.writeOffProcessed) || 
       (entry.includeInInvoice && entry.adjustedAmount < entry.originalAmount)) && 
      !entry.writeOffReason
    );

    if (writeOffsWithoutReason.length > 0) {
      alert("Please provide a reason for all written-off time entries.");
      return;
    }

    onSave(formData, adjustableEntries);
  };
  
  const getProjectForCostTracker = () => {
    if (invoice?.project_ids?.length > 0) {
      return projects.find(p => p.id === invoice.project_ids[0]);
    }
    if (preselectedEntries?.length > 0) {
      return projects.find(p => p.id === preselectedEntries[0].project_id);
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Always show changes summary for draft invoices when editing */}
            {invoice && <ChangesSummary invoice={invoice} />}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Client</Label>
                <p className="font-semibold">{clients.find(c => c.id === formData.client_id)?.company_name || 'N/A'}</p>
              </div>
              <div>
                <Label htmlFor="date">Invoice Date</Label>
                <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
              </div>
            </div>

            {/* Time Entries Review Section - Show for both create and edit */}
            {adjustableEntries.length > 0 && (
              <div>
                <Label className="text-lg font-semibold">Time Entries Review</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Review and adjust time entries. Non-billable entries are shown for transparency.
                </p>
                <div className="border rounded-md">
                  {adjustableEntries.map((entry, index) => (
                    <div key={entry.id || index} className={`p-4 border-b last:border-b-0 ${!entry.isBillable ? 'bg-gray-50' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={entry.includeInInvoice}
                            onCheckedChange={(checked) => handleEntryToggle(index, checked)}
                            disabled={!entry.isBillable}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{entry.user_email}</span>
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(entry.date), 'MMM d')}
                              </Badge>
                              {!entry.isBillable && (
                                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                                  Non-Billable
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {entry.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.hours.toFixed(2)}h @ ${entry.hourly_rate}/h
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                              <p className="text-xs text-gray-500">Original</p>
                              <p className="font-medium">${entry.originalAmount.toFixed(2)}</p>
                          </div>
                          <div>
                            <Label htmlFor={`amount-${index}`} className="text-xs">Invoice Amount</Label>
                            <Input
                              id={`amount-${index}`}
                              type="number"
                              step="0.01"
                              value={entry.adjustedAmount}
                              onChange={(e) => handleAmountChange(index, e.target.value)}
                              className="w-28 text-right"
                              disabled={!entry.includeInInvoice}
                            />
                          </div>
                        </div>
                      </div>
                      {entry.isBillable && (!entry.includeInInvoice || entry.adjustedAmount < entry.originalAmount) && (
                        <div className="mt-3 pl-8">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <p className="text-sm text-orange-600">
                              {!entry.includeInInvoice 
                                ? `$${entry.originalAmount.toFixed(2)} will be written off` 
                                : `$${(entry.originalAmount - entry.adjustedAmount).toFixed(2)} will be written off`}
                            </p>
                          </div>
                          <Textarea
                              placeholder="Reason for write-off (required)..."
                              value={entry.writeOffReason || ''}
                              onChange={(e) => handleWriteOffReasonChange(index, e.target.value)}
                              className="mt-2 text-sm"
                              rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-2">
                  <Label className="text-lg font-semibold">Invoice Line Items</Label>
                  <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowCostTracker(getProjectForCostTracker())} disabled={!getProjectForCostTracker()}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Cost Tracker
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addManualLineItem} className="ml-2">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Line Item
                      </Button>
                  </div>
              </div>

              <div className="space-y-2">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleManualLineItemChange(index, 'description', e.target.value)}
                      className="flex-grow"
                    />
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={item.hours}
                      onChange={(e) => handleManualLineItemChange(index, 'hours', e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => handleManualLineItemChange(index, 'rate', e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleManualLineItemChange(index, 'amount', e.target.value)}
                      className="w-32 font-semibold"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeManualLineItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="attach_cost_tracker"
                  checked={formData.attach_cost_tracker}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, attach_cost_tracker: checked }))}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="attach_cost_tracker">
                    Attach Cost Tracker to Invoice
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Note: Attaching as a PDF to Xero is not yet supported. This option saves your preference for future use.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-500">Subtotal: ${formData.subtotal.toFixed(2)}</div>
                <div className="text-gray-500">GST (15%): ${formData.gst_amount.toFixed(2)}</div>
                <div className="text-xl font-bold">Total: ${formData.total_amount.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#5E0F68' }} className="hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Save Invoice
              </Button>
            </div>
          </form>
        </div>
      </div>
      {showCostTracker && (
        <CostTracker
          project={showCostTracker}
          onClose={() => setShowCostTracker(null)}
        />
      )}
    </div>
  );
}