import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function TaskForm({ task, projects, currentUser, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    task_name: task?.task_name || '',
    project_id: task?.project_id || '',
    section: task?.section || '',
    assignee_email: task?.assignee_email || currentUser?.email || '',
    estimated_hours: task?.estimated_hours || '',
    due_date: task?.due_date || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'not_started',
    completion_percentage: task?.completion_percentage || 0
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      completion_percentage: parseInt(formData.completion_percentage) || 0
    };
    
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{task ? 'Edit Task' : 'Create New Task'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task_name">Task Name *</Label>
                <Input
                  id="task_name"
                  value={formData.task_name}
                  onChange={(e) => handleInputChange('task_name', e.target.value)}
                  placeholder="Enter task name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => handleInputChange('project_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section and Assignment */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  placeholder="e.g. Design, Planning, Construction"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee_email">Assignee Email</Label>
                <Input
                  id="assignee_email"
                  type="email"
                  value={formData.assignee_email}
                  onChange={(e) => handleInputChange('assignee_email', e.target.value)}
                  placeholder="Enter assignee email"
                />
              </div>
            </div>

            {/* Task Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={formData.estimated_hours}
                  onChange={(e) => handleInputChange('estimated_hours', e.target.value)}
                  placeholder="e.g. 8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
              </div>
            </div>

            {/* Status and Progress */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="completion_percentage">Completion (%)</Label>
                <Input
                  id="completion_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.completion_percentage}
                  onChange={(e) => handleInputChange('completion_percentage', e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                style={{ backgroundColor: '#5E0F68' }}
                className="hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}