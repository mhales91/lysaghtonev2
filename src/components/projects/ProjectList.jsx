
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
  const isSorted = sortConfig.key === sortKey;
  const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead>
      <Button variant="ghost" onClick={() => onSort(sortKey)} className="px-2 py-1 h-auto">
        {children}
        {isSorted && <Icon className="w-3 h-3 ml-2" />}
      </Button>
    </TableHead>
  );
};

export default function ProjectList({ 
  projects, clients, isLoading, onEdit, onDelete, onAddDefaultTasks,
  selectedProjectIds, onSelect, onSelectAll, sortConfig, onSort
}) {

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.company_name : 'N/A';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-200'}>{status.replace('_', ' ')}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
            <Skeleton className="h-5 w-5" /> {/* Added skeleton for checkbox */}
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead padding="checkbox">
              <Checkbox
                checked={selectedProjectIds.length > 0 && selectedProjectIds.length === projects.length}
                onCheckedChange={(checked) => onSelectAll(checked)}
                aria-label="Select all"
              />
            </TableHead>
            <SortableHeader sortKey="job_number" sortConfig={sortConfig} onSort={onSort}>Job No.</SortableHeader>
            <SortableHeader sortKey="project_name" sortConfig={sortConfig} onSort={onSort}>Project Name</SortableHeader>
            <SortableHeader sortKey="client_id" sortConfig={sortConfig} onSort={onSort}>Client</SortableHeader>
            <TableHead>Budget Utilisation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map(project => (
            <TableRow key={project.id} data-state={selectedProjectIds.includes(project.id) && "selected"}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedProjectIds.includes(project.id)}
                  onCheckedChange={() => onSelect(project.id)}
                  aria-label="Select row"
                />
              </TableCell>
              <TableCell className="font-medium">{project.job_number}</TableCell>
              <TableCell>{project.project_name}</TableCell>
              <TableCell>{getClientName(project.client_id)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{project.budget_utilisation || 0}%</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${project.budget_utilisation || 0}%` }}
                    ></div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(project.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddDefaultTasks(project)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Default Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => onDelete(project.id)} 
                        className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
