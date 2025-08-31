
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
  from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/components/utils/formatter';
import { Button } from '@/components/ui/button';
import { Project } from '@/api/entities';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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

export default function UpcomingProjects({ projects, users, viewLevel, isLoading, allUsers, setProjects }) {
  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Upcoming Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const upcomingProjects = projects.filter(p => p.status === 'not_started');

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
        <CardTitle className="text-base font-medium">Upcoming Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Project</TableHead>
                {viewLevel !== 'staff' && <TableHead className="text-xs font-semibold">PM</TableHead>}
                <TableHead className="text-xs font-semibold text-right">Budget</TableHead>
                {viewLevel === 'manager' && <TableHead className="text-xs font-semibold text-center">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingProjects.length > 0 ? upcomingProjects.map(project => {
                const assignedUser = users.find(u => u.email === project.project_manager);
                return (
                  <TableRow
                    key={project.id}
                    className="text-xs"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: assignedUser?.user_color || '#d1d5db'
                    }}
                  >
                    <TableCell className="font-medium truncate max-w-32">{project.project_name}</TableCell>
                    {viewLevel !== 'staff' && (
                      <TableCell>
                        <StaffInitials
                          user={assignedUser}
                          teamUsers={allUsers}
                          viewLevel={viewLevel}
                          onReassign={(newUser) => handleReassign(project, newUser)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-right">{formatCurrency(project.budget_fees)}</TableCell>
                    {viewLevel === 'manager' && (
                      <TableCell className="text-center">
                        <Button variant="outline" size="xs" className="text-xs h-6 px-2">Allocate</Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={viewLevel === 'manager' ? 4 : (viewLevel === 'staff' ? 2 : 3)} className="text-center text-gray-500 py-8">
                    No upcoming projects.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
