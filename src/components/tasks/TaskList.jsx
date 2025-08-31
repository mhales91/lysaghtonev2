
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress";

function getPriorityBadge(priority) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  return (
    <Badge className={colors[priority] || colors.medium}>
      {priority || 'medium'}
    </Badge>
  );
}

function getStatusBadge(status) {
  const colors = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };
  return (
    <Badge className={colors[status] || colors.not_started}>
      {status?.replace('_', ' ') || 'not started'}
    </Badge>
  );
}

export default function TaskList({ tasks, users, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px]">Progress</TableHead> {/* Updated header */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full" /></TableCell> {/* Skeleton for progress */}
                <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const safeTasks = tasks || [];
  const safeUsers = users || [];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task Name</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[200px]">Progress</TableHead> {/* Updated header */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500"> {/* Colspan adjusted */}
                No tasks found. Click "Add Task" to get started.
              </TableCell>
            </TableRow>
          ) : (
            safeTasks.map(task => {
              if (!task) return null;
              
              const assignedUser = safeUsers.find(u => u.email === task.assignee_email);
              const progress = task.estimated_hours > 0 ? ((task.actual_hours || 0) / task.estimated_hours) * 100 : 0;
              
              return (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.task_name || 'Unnamed Task'}</TableCell>
                  <TableCell>{assignedUser?.full_name || 'Unassigned'}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                       <span className="text-xs text-gray-500">
                         {task.actual_hours || 0}h / {task.estimated_hours || 0}h
                       </span>
                       <Progress value={progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit && onEdit(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete && onDelete(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
