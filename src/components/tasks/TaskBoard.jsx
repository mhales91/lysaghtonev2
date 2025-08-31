import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TASK_STATUSES = [
  { key: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' }
];

function TaskCard({ task, users, onStatusChange }) {
  if (!task) return null;
  
  const assignedUser = users.find(u => u.email === task.assignee_email);
  
  const handleStatusChange = (newStatus) => {
    if (onStatusChange && task.id) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{task.task_name || 'Unnamed Task'}</CardTitle>
          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
            {task.priority || 'medium'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.section && (
          <Badge variant="outline" className="text-xs mb-2">
            {task.section}
          </Badge>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {task.estimated_hours || 0}h
          </div>
          {assignedUser && (
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {assignedUser.full_name}
            </div>
          )}
        </div>
        <div className="mt-2 flex gap-1">
          {TASK_STATUSES.map(status => (
            <Button
              key={status.key}
              variant={task.status === status.key ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleStatusChange(status.key)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return 'text-red-600 border-red-200';
    case 'medium': return 'text-yellow-600 border-yellow-200';
    case 'low': return 'text-green-600 border-green-200';
    default: return 'text-gray-600 border-gray-200';
  }
}

export default function TaskBoard({ tasks, users, isLoading, onTaskStatusChange }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TASK_STATUSES.map(status => (
          <Card key={status.key}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full mb-3" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.key] = (tasks || []).filter(task => task && task.status === status.key);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TASK_STATUSES.map(status => (
        <Card key={status.key}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{status.label}</span>
              <Badge variant="secondary">{tasksByStatus[status.key].length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksByStatus[status.key].length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
            ) : (
              tasksByStatus[status.key].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users || []}
                  onStatusChange={onTaskStatusChange}
                />
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}