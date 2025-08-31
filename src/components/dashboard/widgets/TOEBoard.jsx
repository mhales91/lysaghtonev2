
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, UserCog, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatCurrency } from '@/components/utils/formatter';
import { TOE } from '@/api/entities';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const TOE_STAGES = [
  { key: "draft", label: "Draft" },
  { key: "internal_review", label: "Review" },
  { key: "ready_to_send", label: "Ready" },
  { key: "sent", label: "Sent" },
];

const Stepper = ({ currentStage, stages }) => {
  const currentIndex = stages.findIndex(stage => stage.key === currentStage);

  return (
    <div className="space-y-1 mt-1">
      <div className="flex items-center w-full">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-3 h-3 rounded-full z-10 transition-colors ${index <= currentIndex ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            </div>
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

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
            {(filteredUsers.filter(u => u.email !== user.email).length === 0 && searchTerm) && (
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
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function TOEBoard({ toes, users, viewLevel, currentUser, departments, isLoading, allUsers, setTOEs }) {
  const navigate = useNavigate();
  const [currentDepartmentIndex, setCurrentDepartmentIndex] = useState(0);

  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">TOE Board</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeToes = toes.filter(t => t.status !== 'signed');

  const handleReassign = async (toe, newUser) => {
    try {
      // For TOE, created_by is the owner.
      await TOE.update(toe.id, { created_by: newUser?.email || null }); // Corrected to allow null for unassigned
      toast.success(`TOE ${newUser ? `reassigned to ${newUser.full_name}` : 'unassigned'}`);
      if(setTOEs) {
        setTOEs(prevTOEs => prevTOEs.map(t => 
            t.id === toe.id 
            ? { ...t, created_by: newUser?.email || null } 
            : t
        ));
      }
    } catch (error) {
      toast.error('Failed to reassign TOE');
      console.error(error);
    }
  };

  // For Director view: show department counts
  if (viewLevel === 'director') {
    const currentDept = departments[currentDepartmentIndex];

    const deptUsers = users.filter(u => u.department === currentDept);
    const deptToes = activeToes.filter(toe =>
      deptUsers.some(user => user.email === toe.created_by)
    );

    const stageCounts = TOE_STAGES.reduce((acc, stage) => {
      acc[stage.key] = deptToes.filter(toe => toe.status === stage.key).length;
      return acc;
    }, {});

    return (
      <Card className="h-full rounded-xl shadow-sm director-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">TOE Board - {currentDept || 'All Departments'}</CardTitle>
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
            {TOE_STAGES.map(stage => (
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

  const handleToeClick = (toe) => {
    navigate(createPageUrl(`TOEManager?toeId=${toe.id}`));
  };

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">TOE Board</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <div className="space-y-3">
            {activeToes.length > 0 ? activeToes.map(toe => {
              const assignedUser = users.find(u => u.email === toe.created_by);
              return (
                <div
                  key={toe.id}
                  className="space-y-2 p-3 hover:bg-gray-50 rounded-lg border cursor-pointer transition-colors"
                  onClick={() => handleToeClick(toe)}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: assignedUser?.user_color || '#d1d5db'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-gray-800">{toe.project_title}</p>
                      {toe.total_fee_with_gst && (
                        <span className="text-xs text-gray-600">{formatCurrency(toe.total_fee_with_gst)}</span>
                      )}
                    </div>
                    {viewLevel !== 'staff' && (
                      <div className="ml-2">
                        <StaffInitials
                          user={assignedUser}
                          teamUsers={allUsers}
                          viewLevel={viewLevel}
                          onReassign={(newUser) => handleReassign(toe, newUser)}
                        />
                      </div>
                    )}
                  </div>
                  <Stepper currentStage={toe.status} stages={TOE_STAGES} />
                </div>
              )
            }) : (
              <div className="text-center text-gray-500 py-8 text-sm">No active TOEs.</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
