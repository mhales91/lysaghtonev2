
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, UserCog, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Fix: Changed '=>' to 'from'
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Client } from '@/api/entities';
import { toast } from 'sonner';

const CRM_STAGES = [
  { key: "lead", label: "Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal_sent", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
];

const Stepper = ({ currentStage, stages, userColor }) => {
  const currentIndex = stages.findIndex(stage => stage.key === currentStage);

  return (
    <div className="space-y-1 mt-1">
      <div className="flex items-center w-full">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <div className="flex-1 flex flex-col items-center relative">
              <div
                className={`w-3 h-3 rounded-full z-10 transition-colors border-2`}
                style={{
                  backgroundColor: index <= currentIndex ? userColor || '#16a34a' : '#d1d5db',
                  borderColor: index <= currentIndex ? userColor || '#16a34a' : '#d1d5db'
                }}
              ></div>
            </div>
            {index < stages.length - 1 && (
              <div className="flex-1 h-0.5"
                style={{
                  backgroundColor: index < currentIndex ? userColor || '#16a34a' : '#d1d5db'
                }}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 -mx-2">
        {stages.map(stage => (
          <span key={stage.key} className="text-center w-full">{stage.label}</span>
        ))}
      </div>
    </div>
  );
};

const StaffInitials = ({ user, teamUsers, onReassign, viewLevel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  };

  const filteredUsers = teamUsers.filter(teamUser =>
    teamUser.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamUser.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user && viewLevel !== 'staff') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); }}
            className="w-8 h-8 p-0 text-xs border-dashed rounded-full"
          >
            <UserCog className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="w-64 p-2">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
            autoFocus
          />
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {filteredUsers.map(teamUser => (
                <button
                  key={teamUser.id}
                  onClick={() => {
                    onReassign(teamUser);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-100 rounded-md text-sm"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: teamUser.user_color || '#6b7280' }}
                  >
                    {getInitials(teamUser)}
                  </div>
                  <span>{teamUser.full_name}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-gray-500 text-sm p-2">No users found</div>
              )}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white font-semibold text-xs"
          style={{ backgroundColor: user.user_color || '#6b7280' }}
          onClick={(e) => e.stopPropagation()}
        >
          {getInitials(user)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()} className="w-64 p-2">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
          autoFocus
        />
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {filteredUsers.filter(u => u.email !== user.email).map(teamUser => (
              <button
                key={teamUser.id}
                onClick={() => {
                  onReassign(teamUser);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-100 rounded-md text-sm"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                  style={{ backgroundColor: teamUser.user_color || '#6b7280' }}
                >
                  {getInitials(teamUser)}
                </div>
                <span>{teamUser.full_name}</span>
              </button>
            ))}
            {filteredUsers.filter(u => u.email !== user.email).length === 0 && searchTerm && (
              <div className="text-gray-500 text-sm p-2">No users found</div>
            )}
            <div className="border-t pt-1 mt-1">
              <button
                onClick={() => {
                  onReassign(null);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="flex items-center gap-2 w-full p-2 text-left hover:bg-red-50 rounded-md text-sm text-red-600"
              >
                <XCircle className="w-4 h-4" />
                Unassign
              </button>
            </div>
            {!searchTerm && filteredUsers.filter(u => u.email !== user.email).length === 0 && (
              <div className="text-gray-500 text-sm p-2">No other users to assign.</div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function CRMBoard({ clients, projects, users, viewLevel, currentUser, departments, isLoading, allUsers, setClients }) {
  const navigate = useNavigate();
  const [currentDepartmentIndex, setCurrentDepartmentIndex] = useState(0);

  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">CRM Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Filter out clients that have an active (non-archived) project
  const clientsWithActiveProjects = new Set(
    (projects || []).filter(p => p.status !== 'archived').map(p => p.client_id)
  );

  const leads = clients.filter(c => 
    c.crm_stage !== 'won' && 
    c.crm_stage !== 'lost' &&
    !clientsWithActiveProjects.has(c.id)
  );

  // For Director view: show department counts
  if (viewLevel === 'director') {
    const currentDept = departments[currentDepartmentIndex];

    // If no departments are defined, show all leads
    let deptLeads = leads;
    if (departments.length > 0 && currentDept) {
      const deptUsers = users.filter(u => u.department === currentDept);
      deptLeads = leads.filter(lead =>
        deptUsers.some(user => user.email === lead.lead_pm) || lead.lead_pm === null || lead.lead_pm === undefined
      );
    }

    const stageCounts = CRM_STAGES.reduce((acc, stage) => {
      acc[stage.key] = deptLeads.filter(lead => lead.crm_stage === stage.key).length;
      return acc;
    }, {});

    return (
      <Card className="h-full rounded-xl shadow-sm director-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">CRM Pipeline - {currentDept || 'All Departments'}</CardTitle>
          {departments.length > 1 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentDepartmentIndex(Math.max(0, currentDepartmentIndex - 1))}
                disabled={currentDepartmentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentDepartmentIndex(Math.min(departments.length - 1, currentDepartmentIndex + 1))}
                disabled={currentDepartmentIndex === departments.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {CRM_STAGES.map(stage => (
              <div key={stage.key} className="text-center p-3 bg-white rounded-lg border">
                <div className="text-3xl font-bold text-purple-600">{stageCounts[stage.key]}</div>
                <div className="text-xs text-gray-600 mt-1">{stage.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleClientClick = (client) => {
    navigate(createPageUrl(`CRM?search=${encodeURIComponent(client.company_name)}`));
  };

  const handleReassign = async (client, newUser) => {
    try {
      await Client.update(client.id, { lead_pm: newUser?.email || null, moved_at: new Date().toISOString() });
      toast.success(`Client ${newUser ? `reassigned to ${newUser.full_name}` : 'unassigned'}`);
      if(setClients) {
        setClients(prevClients => prevClients.map(c => 
            c.id === client.id 
            ? { ...c, lead_pm: newUser?.email || null, moved_at: new Date().toISOString() } 
            : c
        ));
      }
    } catch (error) {
      toast.error('Failed to reassign client');
      console.error(error);
    }
  };

  // Calculate stage counts for non-director view
  const stageCounts = CRM_STAGES.reduce((acc, stage) => {
    acc[stage.key] = leads.filter(lead => lead.crm_stage === stage.key).length;
    return acc;
  }, {});

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">CRM Pipeline</CardTitle>
        {/* Add counts display for non-director view */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {CRM_STAGES.map(stage => (
            <div key={stage.key} className="text-center p-2 bg-gray-50 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{stageCounts[stage.key]}</div>
              <div className="text-xs text-gray-600 mt-1">{stage.label}</div>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-3">
          <div className="space-y-3">
            {leads.length > 0 ? leads.map(lead => {
              const assignedUser = users.find(u => u.email === lead.lead_pm);
              return (
                <div
                  key={lead.id}
                  className="space-y-2 p-3 hover:bg-gray-50 rounded-lg border cursor-pointer transition-colors"
                  onClick={() => handleClientClick(lead)}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: assignedUser?.user_color || '#d1d5db'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm truncate text-gray-800">{lead.company_name}</span>
                    {viewLevel !== 'staff' && (
                      <StaffInitials
                        user={assignedUser}
                        teamUsers={allUsers}
                        viewLevel={viewLevel}
                        onReassign={(newUser) => handleReassign(lead, newUser)}
                      />
                    )}
                  </div>
                  <Stepper
                    currentStage={lead.crm_stage}
                    stages={CRM_STAGES}
                    userColor={assignedUser?.user_color}
                  />
                </div>
              )
            }) : (
              <div className="text-center text-gray-500 py-8 text-sm">No active leads.</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
