
import React, { useState, useEffect } from "react";
import { Client, User, TOE } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { addDays, format } from "date-fns";

import PipelineBoard from "../components/crm/PipelineBoard";
import ClientForm from "../components/crm/ClientForm";
import { useLocation } from "react-router-dom";

export default function CRM() {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    loadData();
  }, [location.search]);

  useEffect(() => {
    let filtered = clients;
    if (searchTerm) {
      filtered = clients.filter(client => 
        client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check if we're on localhost and have a localStorage user
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      let me;
      
      if (isLocalhost) {
        const localUser = localStorage.getItem('currentUser');
        if (localUser) {
          me = JSON.parse(localUser);
        } else {
          // Fallback to Supabase authentication for database users
          me = await User.me();
        }
      } else {
        // Production: Use Supabase authentication
        me = await User.me();
      }
      
      const clientData = await Client.list('-created_date');
      setClients(clientData);

      const canViewUserList = ['Manager', 'DeptLead', 'Director', 'Admin'].includes(me.user_role);
      if (canViewUserList) {
        const userData = await User.list();
        setUsers(userData);
      } else {
        setUsers([]);
      }
    } catch(e) {
      console.error("Failed to load CRM data", e);
    }
    setIsLoading(false);
  };

  const handleSaveClient = async (clientData) => {
    const dataToSave = { ...clientData };
    if (editingClient) {
      await Client.update(editingClient.id, dataToSave);
    } else {
      dataToSave.response_due = format(addDays(new Date(), 5), 'yyyy-MM-dd');
      await Client.create(dataToSave);
    }
    setShowClientForm(false);
    setEditingClient(null);
    loadData();
  };

  const handleDeleteClient = async (clientId) => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await Client.delete(clientId);
        await loadData();
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('There was an error deleting the client.');
      }
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleStageChange = async (clientId, newStage) => {
    await Client.update(clientId, { 
      crm_stage: newStage,
      moved_at: new Date().toISOString()
    });
    loadData();
  };

  const handleGenerateTOE = async (client) => {
    // Create a draft TOE for the client
    const toeData = {
      client_id: client.id,
      project_title: `${client.company_name} Project`,
      status: 'draft',
      scope_of_work: 'To be defined',
      fee_structure: [],
      total_fee: 0,
      total_fee_with_gst: 0
    };
    
    await TOE.create(toeData);
    
    // Move client to proposal_sent stage
    await Client.update(client.id, { crm_stage: 'proposal_sent' });
    loadData();
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM Pipeline</h1>
            <p className="text-gray-600">Manage leads and convert them to projects</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={() => setShowClientForm(true)}
              style={{ backgroundColor: '#5E0F68' }}
              className="hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Pipeline Board */}
        <div className="flex-grow overflow-x-auto">
          <PipelineBoard 
            clients={filteredClients}
            users={users}
            isLoading={isLoading}
            onEditClient={handleEditClient}
            onStageChange={handleStageChange}
            onGenerateTOE={handleGenerateTOE}
            onDelete={handleDeleteClient}
          />
        </div>

        {/* Client Form Modal */}
        {showClientForm && (
          <ClientForm
            client={editingClient}
            users={users}
            onSave={handleSaveClient}
            onCancel={() => {
              setShowClientForm(false);
              setEditingClient(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
