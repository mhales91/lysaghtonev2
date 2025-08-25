
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Plus, Calculator } from "lucide-react";
import { format } from 'date-fns';

export default function TaskBasedInvoiceForm({ 
  invoice, 
  clients, 
  projects, 
  preselectedEntries, 
  onSave, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    client_id: '',
    project_ids: [],
    date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    line_items: [],
    subtotal: 0,
    gst_amount: 0,
    total_amount: 0,
    status: 'draft'
  });

  const [taskGroups, setTaskGroups] = useState([]);
  const [costs, setCosts] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [writeOffReasons, setWriteOffReasons] = useState({}); // New state for write-off reasons

  useEffect(() => {
    if (invoice) {
      // Edit mode - load existing invoice data
      setFormData({
        ...invoice,
        date: invoice.created_date ? format(new Date(invoice.created_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        due_date: invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
      // Call reconstructTaskGroups, which is now async
      reconstructTaskGroups(invoice);
      // Set initial active tab if there are tasks in the invoice
      if (invoice.line_items?.some(item => item.task_id || (item.hours !== undefined && item.hours !== null))) {
        setActiveTab('timesheet');
      }
    } else if (preselectedEntries?.length > 0) {
      // Create mode - process preselected entries
      processPreselectedEntries();
      // In create mode, if preselected entries exist, default to timesheet review
      setActiveTab('timesheet');
    }
  }, [invoice, preselectedEntries, projects]);

  const processPreselectedEntries = () => {
    if (!preselectedEntries?.length) return;

    const firstProjectId = preselectedEntries[0]?.project_id;
    const firstProject = projects.find(p => p.id === firstProjectId);
    const clientId = firstProject?.client_id;

    if (!clientId) {
      alert('Error: Could not find client for this project.');
      return;
    }

    const projectIds = [...new Set(preselectedEntries.map(e => e.project_id).filter(Boolean))];

    const taskGroupsMap = {};
    preselectedEntries.forEach(entry => {
      const taskKey = `${entry.project_id}-${entry.task_id}`;
      if (!taskGroupsMap[taskKey]) {
        taskGroupsMap[taskKey] = {
          id: entry.task_id,
          name: entry.task_name || 'Unknown Task',
          project_id: entry.project_id,
          project_name: projects.find(p => p.id === entry.project_id)?.project_name || 'Unknown Project',
          time_entries: [],
          total_time: 0,
          calculated_amount: 0,
          tax_rate: '15% GST ex',
          fixed_price: 0,
          is_billable: true,
          write_offs: []
        };
      }
      
      const hours = (entry.minutes || 0) / 60;
      const rate = entry.billable_rate_effective || 180;
      const amount = entry.billable_amount || (hours * rate);

      taskGroupsMap[taskKey].time_entries.push({
        ...entry,
        hours,
        rate,
        amount,
        original_amount: amount,
        invoiced_amount: amount // Initialize invoiced_amount
      });
      
      taskGroupsMap[taskKey].total_time += hours;
      taskGroupsMap[taskKey].calculated_amount += amount;
      taskGroupsMap[taskKey].fixed_price = taskGroupsMap[taskKey].calculated_amount;
    });

    setTaskGroups(Object.values(taskGroupsMap));
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      project_ids: projectIds
    }));
    
    updateTotals(Object.values(taskGroupsMap), costs);
  };

  const reconstructTaskGroups = async (invoice) => {
    if (!invoice || !invoice.line_items) {
      setTaskGroups([]);
      setCosts([]);
      setWriteOffReasons({});
      updateTotals([], []);
      return;
    }
    
    const taskGroupsMap = {};
    const costsArray = [];

    // Reconstruct from line items
    invoice.line_items.forEach(item => {
      if (item.task_id || (item.hours !== undefined && item.hours !== null)) {
        // Use task_id as the primary key for the task group
        // Fallback to description if task_id is missing, but append a prefix to prevent conflicts
        const taskKey = item.task_id || `task-desc-${item.description}-${item.amount}`; 
        
        if (!taskGroupsMap[taskKey]) {
          taskGroupsMap[taskKey] = {
            id: item.task_id || `task-${Object.keys(taskGroupsMap).length}`, // Use original task ID or generate one
            name: item.description?.includes(':') ? item.description.split(':')[1].trim() : item.description || 'Unknown Task',
            project_id: invoice.project_ids?.[0] || '', // Assuming project_ids has relevant data
            project_name: projects.find(p => invoice.project_ids?.includes(p.id))?.project_name || 'Unknown Project',
            time_entries: [], // Initialize empty, will be populated by loadTimeEntriesForInvoice
            total_time: 0,
            calculated_amount: 0, // This will be the original amount before any write-off/on
            tax_rate: '15% GST ex', // Default, should ideally be stored in item
            fixed_price: 0, // This will be the final amount invoiced
            is_billable: true, // Default, should ideally be stored in item
            write_offs: [] // For new write-offs created during editing
          };
        }
        
        const group = taskGroupsMap[taskKey];
        group.total_time += item.hours || 0;
        group.calculated_amount += item.original_amount || item.amount || 0; // Use original_amount if available, else billed amount
        group.fixed_price += item.amount || 0; // The amount that was actually billed
        
      } else {
        // This is a cost line item
        costsArray.push({
          id: item.id || `cost-${costsArray.length}-${Date.now()}`, // Ensure unique ID
          name: item.description || 'Unknown Cost',
          quantity: item.quantity || 1,
          rate: item.rate || (item.amount / (item.quantity || 1)) || 0, // Calculate rate if only amount is present
          calculated_amount: item.amount || 0, // Costs calculated_amount is just its amount
          fixed_price: item.amount || 0, // Fixed price for cost is its amount
          tax_rate: '15% GST ex', // Default, should ideally be stored in item
          is_billable: true // Default
        });
      }
    });

    // Load actual time entries that were included in this invoice
    // Ensure invoice.id exists before attempting to load entries
    if (invoice.id) {
        await loadTimeEntriesForInvoice(invoice.id, taskGroupsMap);
    }
    
    // Convert map to array for state and further processing
    const finalTaskGroups = Object.values(taskGroupsMap);
    
    // Reconstruct write-off reasons state based on stored adjustments
    const reconstructedWriteOffReasons = {};
    finalTaskGroups.forEach(task => {
        // The 'difference' is (original calculated amount) - (final fixed price)
        const difference = task.calculated_amount - task.fixed_price;
        if (Math.abs(difference) > 0.01) { // If there was a significant adjustment
            // Find a corresponding write-off entry to get reason/comments from original invoice data
            const relatedWriteOffEntry = invoice.written_off_entries?.find(wo => 
              wo.task_id === task.id || wo.description?.includes(task.name)
            );

            reconstructedWriteOffReasons[task.id] = {
                amount: difference, // This represents the net adjustment for the task
                isVisible: true, // Show the write-off card
                reason: relatedWriteOffEntry?.write_off_reason || 'other', // Use stored reason, default to 'other'
                comments: relatedWriteOffEntry?.comments || '', // Use stored comments
            };
        }
    });
    setWriteOffReasons(reconstructedWriteOffReasons);

    setTaskGroups(finalTaskGroups);
    setCosts(costsArray);
    updateTotals(finalTaskGroups, costsArray);
  };

  const loadTimeEntriesForInvoice = async (invoiceId, taskGroupsMap) => {
    try {
      // Import TimeEntry entity
      const { TimeEntry } = await import('@/api/entities');
      
      // Load time entries that were invoiced in this invoice
      const invoicedTimeEntries = await TimeEntry.filter({ 
        invoice_id: invoiceId,
        status: { $in: ['invoiced', 'written_off'] } // Filter by relevant statuses for invoiced entries
      });

      console.log('Loaded time entries for invoice:', invoicedTimeEntries.length);

      // Create a copy to modify without directly mutating the original map from reconstructTaskGroups
      const updatedTaskGroupsMap = { ...taskGroupsMap };

      // Group time entries by task and add to taskGroupsMap
      invoicedTimeEntries.forEach(entry => {
        // Find the corresponding task group using its ID (which should be the task_id from the entry)
        const taskGroup = updatedTaskGroupsMap[entry.task_id]; 
        
        if (taskGroup) {
          const hours = entry.minutes ? (entry.minutes / 60) : 0;
          const originalAmount = entry.billable_amount || 0;
          const invoicedAmount = entry.invoiced_amount || originalAmount; // Use invoiced_amount from time entry if available

          taskGroup.time_entries.push({
            id: entry.id,
            user_email: entry.user_email,
            date: entry.date,
            description: entry.description || 'No description',
            hours: hours,
            original_amount: originalAmount,
            invoiced_amount: invoicedAmount,
            write_off_reason: entry.write_off_reason || null,
            status: entry.status // Status of the time entry itself (e.g., invoiced, written_off)
          });
        } else {
            console.warn(`Time entry ${entry.id} with task_id ${entry.task_id} did not find a matching task group. It might belong to a cost or an unknown task.`);
        }
      });

      // Update the state with loaded time entries.
      setTaskGroups(Object.values(updatedTaskGroupsMap));

    } catch (error) {
      console.error('Error loading time entries for invoice:', error);
      // Optionally, handle error gracefully, e.g., display a message to the user
    }
  };

  const updateTotals = (tasks = taskGroups, currentCosts = costs) => {
    const taskSubtotal = tasks.filter(t => t.is_billable).reduce((sum, task) => sum + (task.fixed_price || 0), 0);
    const costSubtotal = currentCosts.filter(c => c.is_billable).reduce((sum, cost) => sum + (cost.fixed_price || 0), 0);
    const subtotal = taskSubtotal + costSubtotal;
    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    setFormData(prev => ({
      ...prev,
      subtotal,
      gst_amount: gst,
      total_amount: total,
      line_items: [
        ...tasks.filter(t => t.is_billable).map(task => ({
          task_id: task.id,
          description: `${task.project_name}: ${task.name}`,
          hours: task.total_time,
          rate: task.total_time > 0 ? (task.fixed_price / task.total_time) : 0,
          amount: task.fixed_price, // Billed amount
          original_amount: task.calculated_amount // Original calculated amount before adjustments
        })),
        ...currentCosts.filter(c => c.is_billable).map(cost => ({
          description: cost.name,
          quantity: cost.quantity,
          rate: cost.rate,
          amount: cost.fixed_price
        }))
      ]
    }));
  };

  const handleTaskChange = (taskIndex, field, value) => {
    const updatedTasks = [...taskGroups];
    updatedTasks[taskIndex][field] = value;
    
    if (field === 'fixed_price') {
      const task = updatedTasks[taskIndex];
      const originalAmount = task.calculated_amount;
      const newAmount = parseFloat(value || 0);
      const difference = originalAmount - newAmount; // Positive for write-off, negative for write-on
      
      if (Math.abs(difference) > 0.01) { // More than 1 cent difference
        // Show write-off reason form for this task
        setWriteOffReasons(prev => ({
          ...prev,
          [task.id]: {
            ...prev[task.id],
            amount: difference, 
            isVisible: true,
            reason: prev[task.id]?.reason || '',
            comments: prev[task.id]?.comments || ''
          }
        }));
        
        if (difference > 0) { // original > new -> write-off
          prorateWriteOff(task, difference);
        } else { // original < new -> write-on
          prorateWriteOn(task, Math.abs(difference));
        }
      } else {
        // No significant change, clear write-offs and hide form
        task.write_offs = [];
        // Reset invoiced amount for time entries if the fixed price goes back to original
        task.time_entries.forEach(entry => {
          entry.invoiced_amount = entry.original_amount;
        });
        setWriteOffReasons(prev => {
          const updated = { ...prev };
          delete updated[task.id];
          return updated;
        });
      }
    }
    
    setTaskGroups(updatedTasks);
    updateTotals(updatedTasks, costs);
  };

  const prorateWriteOff = (task, totalWriteOff) => {
    if (!task.time_entries?.length) return;
    
    const totalOriginal = task.time_entries.reduce((sum, entry) => sum + entry.original_amount, 0);
    
    task.write_offs = [];
    task.time_entries.forEach(entry => {
      if (totalOriginal > 0) {
        const proportion = entry.original_amount / totalOriginal;
        const entryWriteOff = totalWriteOff * proportion;
        entry.invoiced_amount = entry.original_amount - entryWriteOff;
        
        if (entryWriteOff > 0) {
          task.write_offs.push({
            time_entry_id: entry.id,
            original_amount: entry.original_amount,
            write_off_amount: entryWriteOff,
            user_email: entry.user_email,
            date: entry.date,
            description: entry.description,
            task_id: task.id, // Ensure task_id is included
            write_off_reason: 'Task amount adjustment - prorated' // Placeholder, will be updated by form
          });
        }
      } else { // Handle case where totalOriginal is 0 (e.g., manually added task with no time entries)
        entry.invoiced_amount = 0; // If original is 0, then after write-off it's 0
        if (totalWriteOff > 0) { // If there's a write-off, but no original value, it means reducing to 0
            task.write_offs.push({
                time_entry_id: entry.id,
                original_amount: entry.original_amount,
                write_off_amount: totalWriteOff, // Apply total write-off to this entry if it's the only one
                user_email: entry.user_email,
                date: entry.date,
                description: entry.description,
                task_id: task.id,
                write_off_reason: 'Task amount adjustment - prorated'
            });
        }
      }
    });
  };

  const prorateWriteOn = (task, totalWriteOn) => {
    if (!task.time_entries?.length) return;
    
    const totalOriginal = task.time_entries.reduce((sum, entry) => sum + entry.original_amount, 0);
    
    task.write_offs = [];
    task.time_entries.forEach(entry => {
      if (totalOriginal > 0) {
        const proportion = entry.original_amount / totalOriginal;
        const entryWriteOn = totalWriteOn * proportion;
        entry.invoiced_amount = entry.original_amount + entryWriteOn;
        
        if (entryWriteOn > 0) {
          task.write_offs.push({
            time_entry_id: entry.id,
            original_amount: entry.original_amount,
            write_off_amount: -entryWriteOn, // Negative for write-on
            user_email: entry.user_email,
            date: entry.date,
            description: entry.description,
            task_id: task.id, // Ensure task_id is included
            write_off_reason: 'Task amount adjustment - prorated (write-on)' // Placeholder, will be updated by form
          });
        }
      } else { // Handle case where totalOriginal is 0
        entry.invoiced_amount = totalWriteOn; // If no original amount, assign all write-on to this entry
        if (totalWriteOn > 0) {
          task.write_offs.push({
            time_entry_id: entry.id,
            original_amount: entry.original_amount,
            write_off_amount: -totalWriteOn, // Apply total write-on to this entry
            user_email: entry.user_email,
            date: entry.date,
            description: entry.description,
            task_id: task.id, // Ensure task_id is included
            write_off_reason: 'Task amount adjustment - prorated (write-on)'
          });
        }
      }
    });
  };

  const handleWriteOffReasonChange = (taskId, field, value) => {
    setWriteOffReasons(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
    // Note: The actual write-off entries in taskGroups are updated by handleSubmit based on this state
  };

  const validateWriteOffs = () => {
    for (const task of taskGroups) {
      const writeOffData = writeOffReasons[task.id];
      // Check if a write-off/write-on was applied (i.e., form is visible)
      // and if the reason or comments are missing/empty.
      // We only validate if isVisible is true and the amount is non-negligible
      if (writeOffData?.isVisible && Math.abs(writeOffData.amount) > 0.01 && (!writeOffData.reason || !writeOffData.comments?.trim())) {
        alert(`Please provide both a reason and comments for the write-off/write-on for task: ${task.name}`);
        return false;
      }
    }
    return true;
  };

  const addTask = () => {
    const newTask = {
      id: `new-${Date.now()}`,
      name: 'New Task',
      project_id: formData.project_ids[0] || '',
      project_name: projects.find(p => p.id === formData.project_ids[0])?.project_name || '',
      time_entries: [],
      total_time: 0,
      calculated_amount: 0,
      tax_rate: '15% GST ex',
      fixed_price: 0,
      is_billable: true,
      write_offs: []
    };
    
    setTaskGroups([...taskGroups, newTask]);
    updateTotals([...taskGroups, newTask], costs); // Update totals immediately after adding task
  };

  const addCost = () => {
    const newCost = {
      id: `cost-${Date.now()}`,
      name: 'New Cost',
      quantity: 1,
      rate: 0, // Initial rate for new costs
      calculated_amount: 0,
      tax_rate: '15% GST ex',
      fixed_price: 0,
      is_billable: true
    };
    const updatedCosts = [...costs, newCost];
    setCosts(updatedCosts);
    updateTotals(taskGroups, updatedCosts); // Update totals with new costs
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateWriteOffs()) {
      return;
    }
    
    const allWriteOffs = taskGroups.reduce((acc, task) => {
      // Collect write-offs that were created or modified during this session
      if (task.write_offs?.length > 0) {
        const reasonData = writeOffReasons[task.id];
        const updatedWriteOffs = task.write_offs.map(writeOff => ({
          ...writeOff,
          write_off_reason: reasonData?.reason || writeOff.write_off_reason || 'No reason provided',
          comments: reasonData?.comments || writeOff.comments || 'No comments provided'
        }));
        acc.push(...updatedWriteOffs);
      }
      return acc;
    }, []);
    
    // Merge new/modified write-offs with existing ones, ensuring no duplicates based on time_entry_id
    const existingWrittenOffEntries = invoice?.written_off_entries || [];
    const finalWrittenOffEntries = [
        ...existingWrittenOffEntries.filter(existingWo => 
            // Keep existing write-offs ONLY if they are not superseded by a new write-off in allWriteOffs
            !allWriteOffs.some(newWo => newWo.time_entry_id === existingWo.time_entry_id)
        ), 
        ...allWriteOffs
    ];

    const finalData = {
      ...formData,
      written_off_entries: finalWrittenOffEntries
    };
    
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {invoice ? `Edit Invoice ${invoice.invoice_number || invoice.id?.slice(-6)}` : 'Create Invoice'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Client</Label>
                {/* Client selection is read-only if preselected or in edit mode */}
                <p className="font-semibold">{clients.find(c => c.id === formData.client_id)?.company_name || 'N/A'}</p>
              </div>
              <div>
                <Label htmlFor="date">Invoice Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})} 
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input 
                  id="due_date" 
                  type="date" 
                  value={formData.due_date} 
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})} 
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="costs">Costs</TabsTrigger>
                {/* Always show timesheet review tab if there are tasks or line items (in edit mode) */}
                {(taskGroups.length > 0 || (invoice && invoice.line_items?.length > 0)) && (
                  <TabsTrigger value="timesheet">Timesheet Review</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Tasks</h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addTask}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add a Task
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Calculated</TableHead>
                      <TableHead>Tax rate</TableHead>
                      <TableHead>Fixed Price</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskGroups.map((task, index) => (
                      <React.Fragment key={task.id || index}>
                        <TableRow>
                          <TableCell>
                            <Checkbox
                              checked={task.is_billable}
                              onCheckedChange={(checked) => handleTaskChange(index, 'is_billable', checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.project_name}</div>
                              <Input
                                value={task.name}
                                onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                                className="mt-1"
                                placeholder="Task name"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.total_time.toFixed(2)}h
                          </TableCell>
                          <TableCell>
                            ${task.calculated_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={task.tax_rate} 
                              onValueChange={(value) => handleTaskChange(index, 'tax_rate', value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15% GST ex">15% GST ex</SelectItem>
                                <SelectItem value="0% GST">0% GST</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={task.fixed_price}
                              onChange={(e) => handleTaskChange(index, 'fixed_price', parseFloat(e.target.value) || 0)}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center">
                              <Calculator className="w-4 h-4" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={task.is_billable}
                              onCheckedChange={(checked) => handleTaskChange(index, 'is_billable', checked)}
                            />
                          </TableCell>
                        </TableRow>
                        
                        {/* Write-off Reason Section */}
                        {writeOffReasons[task.id]?.isVisible && (
                          <TableRow className="bg-yellow-50">
                            <TableCell colSpan="8">
                              <Card className="border-yellow-200">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                    Write-off/Write-on Required for {task.name}
                                    <Badge variant="outline" className="ml-2">
                                      {writeOffReasons[task.id]?.amount > 0 ? 'Write-off' : 'Write-on'}: 
                                      ${Math.abs(writeOffReasons[task.id]?.amount || 0).toFixed(2)}
                                    </Badge>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`reason-${task.id}`}>Reason for Adjustment</Label>
                                      <Select 
                                        value={writeOffReasons[task.id]?.reason || ''} 
                                        onValueChange={(value) => handleWriteOffReasonChange(task.id, 'reason', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select reason..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="scope_creep">Scope Creep</SelectItem>
                                          <SelectItem value="client_request">Client Request</SelectItem>
                                          <SelectItem value="quality_issue">Quality Issue</SelectItem>
                                          <SelectItem value="efficiency_gain">Efficiency Gain</SelectItem>
                                          <SelectItem value="budget_constraint">Budget Constraint</SelectItem>
                                          <SelectItem value="additional_work">Additional Work Required</SelectItem>
                                          <SelectItem value="goodwill">Goodwill Gesture</SelectItem>
                                          <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor={`comments-${task.id}`}>Internal Comments</Label>
                                      <Textarea
                                        id={`comments-${task.id}`}
                                        placeholder="Explain the reason for this adjustment..."
                                        value={writeOffReasons[task.id]?.comments || ''}
                                        onChange={(e) => handleWriteOffReasonChange(task.id, 'comments', e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    This information is for internal tracking only and will not appear on the client invoice.
                                  </div>
                                </CardContent>
                              </Card>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Costs</h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addCost}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Multiple Costs
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addCost}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add a Cost
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Tax rate</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost, index) => (
                      <TableRow key={cost.id || index}>
                        <TableCell>
                          <Checkbox
                            checked={cost.is_billable}
                            onCheckedChange={(checked) => {
                              const updatedCosts = [...costs];
                              updatedCosts[index].is_billable = checked;
                              setCosts(updatedCosts);
                              updateTotals(taskGroups, updatedCosts);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={cost.name}
                            onChange={(e) => {
                              const updatedCosts = [...costs];
                              updatedCosts[index].name = e.target.value;
                              setCosts(updatedCosts);
                            }}
                            placeholder="Cost description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="1"
                            value={cost.quantity}
                            onChange={(e) => {
                              const updatedCosts = [...costs];
                              const newQuantity = parseFloat(e.target.value) || 0;
                              updatedCosts[index].quantity = newQuantity;
                              updatedCosts[index].fixed_price = newQuantity * updatedCosts[index].rate;
                              setCosts(updatedCosts);
                              updateTotals(taskGroups, updatedCosts);
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={cost.rate}
                            onChange={(e) => {
                              const updatedCosts = [...costs];
                              const newRate = parseFloat(e.target.value) || 0;
                              updatedCosts[index].rate = newRate;
                              updatedCosts[index].fixed_price = updatedCosts[index].quantity * newRate;
                              setCosts(updatedCosts);
                              updateTotals(taskGroups, updatedCosts);
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          ${cost.fixed_price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={cost.tax_rate} 
                            onValueChange={(value) => {
                              const updatedCosts = [...costs];
                              updatedCosts[index].tax_rate = value;
                              setCosts(updatedCosts);
                              // Tax rate change doesn't directly impact fixed_price or totals, but good to set
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15% GST ex">15% GST ex</SelectItem>
                              <SelectItem value="0% GST">0% GST</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={cost.is_billable}
                            onCheckedChange={(checked) => {
                              const updatedCosts = [...costs];
                              updatedCosts[index].is_billable = checked;
                              setCosts(updatedCosts);
                              updateTotals(taskGroups, updatedCosts);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {costs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan="7" className="text-center py-12 text-gray-500">
                          <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Add a Cost</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Show Timesheet Review tab content only if there are any time entries or if it's an existing invoice with tasks */}
              {(taskGroups.length > 0 || (invoice && invoice.line_items?.length > 0)) && (
                <TabsContent value="timesheet" className="space-y-4">
                  <h3 className="text-lg font-semibold">Timesheet Review</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Time entries that were included in this invoice, showing original amounts and any adjustments made.
                  </p>
                  
                  {taskGroups.map((task, taskIndex) => (
                    // Show card if task has time entries OR if there are adjustments for it (calculated_amount vs fixed_price)
                    (task.time_entries?.length > 0 || Math.abs(task.calculated_amount - task.fixed_price) > 0.01) && (
                      <Card key={task.id || taskIndex} className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-md">{task.project_name}: {task.name}</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">
                              {task.total_time.toFixed(2)} hours
                            </Badge>
                            {Math.abs(task.calculated_amount - task.fixed_price) > 0.01 && (
                              <Badge variant="outline" className={
                                task.calculated_amount - task.fixed_price > 0 ? "border-red-300 text-red-700 bg-red-50" : "border-green-300 text-green-700 bg-green-50"
                              }>
                                {task.calculated_amount - task.fixed_price > 0 ? 'Write-off' : 'Write-on'}: 
                                ${Math.abs(task.calculated_amount - task.fixed_price).toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {task.time_entries?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                    <TableHead className="text-right">Original Amount</TableHead>
                                    <TableHead className="text-right">Invoiced Amount</TableHead>
                                    <TableHead className="text-right">Adjustment</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {task.time_entries.map((entry, entryIndex) => {
                                    const adjustment = entry.original_amount - entry.invoiced_amount;
                                    return (
                                      <TableRow key={entry.id || entryIndex}>
                                        <TableCell className="font-medium">{entry.user_email}</TableCell>
                                        <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>{entry.description}</TableCell>
                                        <TableCell className="text-right">{entry.hours?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell className="text-right">${entry.original_amount?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell className="text-right">${entry.invoiced_amount?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell className="text-right">
                                          {Math.abs(adjustment) > 0.01 ? (
                                            <Badge variant={adjustment > 0 ? "destructive" : "default"} className="text-xs">
                                              {adjustment > 0 ? '-' : '+'}${Math.abs(adjustment).toFixed(2)}
                                            </Badge>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">
                                            {entry.status}
                                          </Badge>
                                          {entry.write_off_reason && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Reason: {entry.write_off_reason}
                                            </div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <p>No detailed time entries available for this task.</p>
                              <p className="text-sm mt-2">
                                Task total: ${task.calculated_amount.toFixed(2)} &rarr; ${task.fixed_price.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  ))}

                  {/* Show general message if no tasks have time entries AND no adjustments were made */}
                  {taskGroups.length === 0 || !taskGroups.some(t => t.time_entries?.length > 0 || Math.abs(t.calculated_amount - t.fixed_price) > 0.01) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No timesheet data available for this invoice.</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>${taskGroups.filter(t => t.is_billable).reduce((sum, task) => sum + (task.fixed_price || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Costs:</span>
                      <span>${costs.filter(c => c.is_billable).reduce((sum, cost) => sum + (cost.fixed_price || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Internals:</span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Added issue:</span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Added costs:</span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${formData.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${formData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>15% GST on Income (15.00%):</span>
                      <span>${formData.gst_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${formData.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>Gross Profit Margin: ${(formData.subtotal * 0.25).toFixed(2)}</div>
                      <div>Gross Profit %: 25.00%</div>
                      <div>Amount due: ${formData.total_amount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
    </div>
  );
}
