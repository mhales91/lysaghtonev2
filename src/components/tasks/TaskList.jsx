import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function TaskList({ tasks, projects, isLoading, onEdit, onDelete, onStatusChange, filters, onFiltersChange }) {
  const getProject = (projectId) => projects.find(p => p.id === projectId);
  
  const getStatusColor = (status) => ({
    'not_started': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800'
  }[status] || 'bg-gray-100');

  const getPriorityColor = (priority) => ({
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-red-100 text-red-800'
  }[priority] || 'bg-gray-100');

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm">
        <Select
          value={filters.project_id}
          onValueChange={(value) => onFiltersChange({...filters, project_id: value})}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({...filters, status: value})}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{task.task_name}</div>
                    {task.section && (
                      <div className="text-sm text-gray-500">{task.section}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getProject(task.project_id)?.project_name}</TableCell>
                <TableCell>{task.assignee_email || 'Unassigned'}</TableCell>
                <TableCell>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={task.status}
                    onValueChange={(value) => onStatusChange(task.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={task.completion_percentage} className="w-16 h-2" />
                    <span className="text-sm">{task.completion_percentage}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(task.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tasks.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No tasks found. Create your first task to get started.
          </div>
        )}
      </div>
    </div>
  );
}