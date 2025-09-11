
import React, { useState, useEffect } from "react";
import { Invoice, TimeEntry, Project, Client, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from '@/contexts/UserContext';

import InvoiceList from "../components/billing/InvoiceList";
import TaskBasedInvoiceForm from "../components/billing/TaskBasedInvoiceForm";
import WIPSheet from "../components/billing/WIPSheet";
import CostTracker from "../components/billing/CostTracker";
import DraftInvoices from "../components/billing/DraftInvoices"; // New import for DraftInvoices component

export default function BillingPage() {
  const { currentUser } = useUser();
  const [invoices, setInvoices] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [preselectedEntries, setPreselectedEntries] = useState([]);
  const [showCostTracker, setShowCostTracker] = useState(null);
  const [xeroConnected, setXeroConnected] = useState(false); // New state for Xero connection status message

  useEffect(() => {
    loadData();

    // Check for Xero connection success parameter from redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('xero') === 'connected') {
      setXeroConnected(true);
      // Remove the parameter from URL to prevent re-triggering on refresh
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('xero');
      window.history.replaceState({}, '', newUrl.toString()); // Use .toString() for URL object
      
      // Show success message briefly
      setTimeout(() => setXeroConnected(false), 5000);
    }

    // The previous window.addEventListener('message') for Xero connection is replaced by URL param check.
    // So, no need for handleXeroMessage and its cleanup here.
  }, [currentUser]); // Add currentUser as dependency

  const loadData = async () => {
    if (!currentUser) {
      console.log('No user in context yet, waiting...');
      return;
    }

    setIsLoading(true);
    try {
      const [inv, te, proj, cli] = await Promise.all([
        Invoice.list('-created_date', 200), // Fetch the 200 most recent invoices
        TimeEntry.filter({ 
          status: { $nin: ['invoiced', 'written_off'] }, 
          billable: true 
        }), // Fetch only uninvoiced and not written off billable time entries for WIP
        Project.list(),
        Client.list()
      ]);

      console.log('Loaded time entries for billing:', te?.length || 0);
      console.log('Time entries sample:', te?.slice(0, 3));

      // Debug: Check for potential duplicates
      if (te && te.length > 0) {
        const duplicateCheck = {};
        te.forEach(entry => {
          // A simple key based on common fields to identify potential duplicates
          // This might need refinement based on exact definition of "duplicate" time entry
          const key = `${entry.user_email}-${entry.project_id}-${entry.task_id}-${entry.date}-${entry.hours}`;
          if (duplicateCheck[key]) {
            console.warn('Potential duplicate time entry found:', {
              original: duplicateCheck[key],
              duplicate: entry
            });
          } else {
            duplicateCheck[key] = entry;
          }
        });
      }

      setInvoices(inv || []);
      setTimeEntries(te || []);
      setProjects(proj || []);
      setClients(cli || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
    }
    setIsLoading(false);
  };
  
  const handleCreateInvoice = (entries) => {
    console.log('Creating invoice for entries:', entries);
    console.log('Available projects:', projects);
    console.log('Available clients:', clients);
    
    if (!entries || entries.length === 0) {
      alert('No time entries selected for invoicing');
      return;
    }
    
    setPreselectedEntries(entries);
    setEditingInvoice(null); // Ensure we are creating a new invoice
    setShowForm(true);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setPreselectedEntries([]); // Clear preselected entries when editing an existing invoice
    setShowForm(true);
  };

  const handleShowCostTracker = (project) => {
    setShowCostTracker(project);
  };

  const handleAttachCostTracker = (costData) => {
    // Add cost tracker data to the invoice being created
    setShowCostTracker(null);
    alert('Cost tracker data attached to invoice (functionality to be implemented)');
  };

  const handleApproveInvoice = async (invoice) => {
    if (!confirm(`Approve and send invoice ${invoice.invoice_number || invoice.id.slice(-6)} directly to Xero?`)) {
      return;
    }

    try {
      // Update invoice status to approved
      await Invoice.update(invoice.id, {
        status: 'approved',
        approved_date: new Date().toISOString().split('T')[0],
        approved_by: currentUser?.email || 'unknown@example.com'
      });

      // Send directly to Xero
      const { xeroIntegration } = await import('@/api/functions');
      const response = await xeroIntegration({
        action: 'push_invoice',
        invoiceId: invoice.id
      });

      if (response.data.success) {
        alert(`Invoice approved and sent to Xero successfully! Xero ID: ${response.data.xero_id}`);
        loadData();
      } else {
        throw new Error(response.data.error || 'Failed to send to Xero');
      }
    } catch (error) {
      console.error('Error approving and sending invoice:', error);
      alert(`Error: ${error.message}. Invoice approved but not sent to Xero.`);
      loadData(); // Refresh to show approval
    }
  };

  const handleSendToXero = async (invoice) => {
    if (!confirm(`Send invoice ${invoice.invoice_number || invoice.id.slice(-6)} to Xero?`)) {
      return;
    }

    try {
      const { xeroIntegration } = await import('@/api/functions'); // This is your existing backend function
      const response = await xeroIntegration({
        action: 'push_invoice',
        invoiceId: invoice.id
      });

      if (response.data.success) {
        alert(`Invoice sent to Xero successfully! Xero ID: ${response.data.xero_id}`);
        loadData();
      } else {
        throw new Error(response.data.error || 'Failed to send to Xero');
      }
    } catch (error) {
      console.error('Error sending to Xero:', error);
      alert(`Error sending invoice to Xero: ${error.message}`);
    }
  };

  const handleSaveInvoice = async (invoiceData) => { // Removed adjustableEntries parameter as it's not used
    try {
      console.log('Saving invoice with data:', invoiceData);
      
      // Validate required fields
      if (!invoiceData.client_id) {
        throw new Error('Client is required');
      }
      
      // Generate invoice number if creating new and no number is provided
      if (!editingInvoice && !invoiceData.invoice_number) {
        // This simple generation logic might not be robust for concurrent users or deleted invoices.
        // A more robust solution would involve a backend sequence or a dedicated number generation service.
        const invoiceCount = invoices.length + 1; // Simple increment, consider a more robust system for production
        invoiceData.invoice_number = `INV-${new Date().getFullYear()}-${invoiceCount.toString().padStart(4, '0')}`;
      }

      // Check if line items are present after processing
      if (invoiceData.line_items.length === 0) {
        throw new Error('Line items are required');
      }

      // Clean up the data before sending
      const cleanData = {
        ...invoiceData,
        line_items: invoiceData.line_items, // Use line items directly from form state
        written_off_entries: invoiceData.written_off_entries || [], // This is now expected from TaskBasedInvoiceForm
        project_ids: invoiceData.project_ids ? invoiceData.project_ids.filter(Boolean) : [], // Remove empty strings, ensure it's an array
        subtotal: parseFloat(invoiceData.subtotal) || 0,
        gst_amount: parseFloat(invoiceData.gst_amount) || 0,
        total_amount: parseFloat(invoiceData.total_amount) || 0
      };

      console.log('Sending clean invoice data to save:', cleanData);

      let savedInvoice;
      if (editingInvoice) {
        savedInvoice = await Invoice.update(editingInvoice.id, cleanData);
        // Note: Updating time entries on edit is more complex and will be handled separately.
        // This fix focuses on the creation path from unbilled time to draft.
      } else {
        savedInvoice = await Invoice.create(cleanData);
      }

      // Update status of all time entries associated with this new invoice
      // This logic applies only when creating a new invoice from preselected entries (WIP)
      if (!editingInvoice && preselectedEntries.length > 0) {
        const writeOffsMap = (cleanData.written_off_entries || []).reduce((map, wo) => {
          if (wo.time_entry_id) map[wo.time_entry_id] = wo;
          return map;
        }, {});

        for (const entry of preselectedEntries) {
          const writeOffData = writeOffsMap[entry.id];
          let finalInvoicedAmount;
          let finalStatus;
          let finalWriteOffReason = null;

          if (writeOffData) {
            // This entry had an adjustment (write-off amount is positive, write-on is negative)
            finalInvoicedAmount = entry.billable_amount - writeOffData.write_off_amount;
            finalWriteOffReason = writeOffData.comments
              ? `${writeOffData.write_off_reason}: ${writeOffData.comments}`
              : writeOffData.write_off_reason;
          } else {
            // No adjustment, invoiced at full value
            finalInvoicedAmount = entry.billable_amount;
          }
          
          finalStatus = finalInvoicedAmount > 0 ? 'invoiced' : 'written_off';

          await TimeEntry.update(entry.id, {
            status: finalStatus,
            invoice_id: savedInvoice.id,
            invoiced_amount: finalInvoicedAmount,
            write_off_reason: finalWriteOffReason,
          });
        }
      }
      
      setShowForm(false);
      setEditingInvoice(null);
      setPreselectedEntries([]);
      loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(`Error saving invoice: ${error.message || 'Please try again'}`);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Invoices</h1>
            <p className="text-gray-600">Manage invoicing and track write-offs</p>
            {xeroConnected && (
              <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                ✅ Successfully connected to Xero!
              </div>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="wip" className="space-y-6">
          <TabsList>
            <TabsTrigger value="wip">WIP Sheet</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="wip">
            <WIPSheet
              onCreateInvoice={handleCreateInvoice}
              timeEntries={timeEntries}
              projects={projects}
              clients={clients}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="drafts">
            <DraftInvoices
              timeEntries={timeEntries}
              projects={projects}
              clients={clients}
              invoices={invoices.filter(i => i.status === 'draft')} 
              currentUser={currentUser}
              isLoading={isLoading}
              onCreateInvoice={handleCreateInvoice}
              onEditInvoice={handleEditInvoice}
              onApproveInvoice={handleApproveInvoice}
              onShowCostTracker={handleShowCostTracker}
            />
          </TabsContent>
          
          <TabsContent value="sent">
            <InvoiceList 
              invoices={invoices.filter(i => i.status === 'sent')} 
              clients={clients}
              projects={projects}
              currentUser={currentUser}
              title="Sent Invoices"
              onShowCostTracker={handleShowCostTracker}
            />
          </TabsContent>
          
          <TabsContent value="paid">
            <InvoiceList 
              invoices={invoices.filter(i => i.status === 'paid')} 
              clients={clients}
              projects={projects}
              currentUser={currentUser}
              title="Paid Invoices"
              onShowCostTracker={handleShowCostTracker}
            />
          </TabsContent>
        </Tabs>
        
        {showForm && (
          <TaskBasedInvoiceForm 
            invoice={editingInvoice}
            clients={clients}
            projects={projects}
            preselectedEntries={preselectedEntries}
            onSave={handleSaveInvoice}
            onCancel={() => {
              setShowForm(false);
              setEditingInvoice(null);
              setPreselectedEntries([]);
            }}
          />
        )}

        {showCostTracker && (
          <CostTracker
            project={showCostTracker}
            onClose={() => setShowCostTracker(null)}
            onAttach={handleAttachCostTracker}
          />
        )}
      </div>
    </div>
  );
}
