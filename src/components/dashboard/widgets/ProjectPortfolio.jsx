
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/components/utils/formatter';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Project } from '@/api/entities';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { UserCog, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';


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
            {filteredUsers.filter(u => u.email !== user.email).length === 0 && searchTerm && (
              <div className="text-gray-500 text-sm p-2">No users found</div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function ProjectPortfolio({ projects, timeEntries, users, viewLevel, isLoading, allUsers, setProjects }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Project Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeProjects = projects.filter(p => ['not_started', 'active', 'on_hold'].includes(p.status));

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleProjectClick = (project) => {
    navigate(createPageUrl(`ProjectDetail?id=${project.id}`));
  };

  const handleReassign = async (project, newUser) => {
    try {
      await Project.update(project.id, { project_manager: newUser?.email || null });
      toast.success(`Project ${newUser ? `reassigned to ${newUser.full_name}` : 'unassigned'}`);
      if(setProjects) {
        setProjects(prevProjects => prevProjects.map(p =>
            p.id === project.id
            ? { ...p, project_manager: newUser?.email || null }
            : p
        ));
      }
    } catch (error) {
      toast.error('Failed to reassign project');
      console.error(error);
    }
  };

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">Project Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Project</TableHead>
                {viewLevel !== 'staff' && <TableHead className="text-xs font-semibold">PM</TableHead>}
                <TableHead className="text-xs font-semibold text-right">Billable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeProjects.length > 0 ? activeProjects.map(project => {
                const monthlyBillable = timeEntries
                  .filter(te => te.project_id === project.id && te.billable)
                  .reduce((sum, te) => sum + (te.billable_amount || 0), 0);

                const budgetUsed = ((project.actual_fees || 0) / (project.budget_fees || 1)) * 100;
                const assignedUser = users.find(u => u.email === project.project_manager);

                return (
                  <TableRow
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="cursor-pointer hover:bg-gray-50"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: assignedUser?.user_color || '#d1d5db'
                    }}
                  >
                    <TableCell className="font-medium text-xs">
                      <div className="truncate font-semibold text-gray-800">{project.job_number} - {project.project_name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Progress value={budgetUsed} className="h-2 w-20 rounded-full" indicatorClassName="bg-purple-500 rounded-full" />
                      </div>
                    </TableCell>
                     {viewLevel !== 'staff' && (
                        <TableCell>
                          <StaffInitials
                            user={assignedUser}
                            teamUsers={allUsers}
                            viewLevel={viewLevel}
                            onReassign={(newUserToAssign) => handleReassign(project, newUserToAssign)}
                          />
                        </TableCell>
                      )}
                    <TableCell className="text-right text-xs text-gray-600">{formatCurrency(monthlyBillable)}</TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={viewLevel !== 'staff' ? 3 : 2} className="text-center text-gray-500 py-8">No active projects.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
