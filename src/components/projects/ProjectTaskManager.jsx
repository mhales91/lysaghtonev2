import React, { useState, useEffect } from 'react';
import { Task, TaskTemplate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function ProjectTaskManager({ projectId }) {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingHours, setEditingHours] = useState('');

    useEffect(() => {
        if (projectId) {
            loadTasks();
            loadTaskTemplates();
        }
    }, [projectId]);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const projectTasks = await Task.filter({ project_id: projectId });
            setTasks(projectTasks);
        } catch (error) {
            console.error("Failed to load tasks:", error);
        }
        setIsLoading(false);
    };
    
    const loadTaskTemplates = async () => {
        try {
            const templates = await TaskTemplate.list();
            setTaskTemplates(templates || []);
        } catch (error) {
            console.error('Error loading task templates:', error);
        }
    };

    const handleAddFromTemplate = async (template) => {
        if (!template) return;
        
        try {
            await Task.create({
                project_id: projectId,
                task_name: template.name,
                section: template.dept,
                estimated_hours: template.default_hours,
                is_billable: template.is_billable,
                template_id: template.id,
                status: 'not_started',
                completion_percentage: 0,
                priority: 'medium'
            });
            loadTasks();
        } catch (error) {
            console.error("Error adding task from template:", error);
            alert("Failed to add task from template.");
        }
    };

    const handleUpdateHours = async (taskId, newHours) => {
        try {
            await Task.update(taskId, { estimated_hours: parseFloat(newHours) || 0 });
            setEditingTaskId(null);
            setEditingHours('');
            loadTasks();
        } catch (error) {
            console.error("Failed to update task hours:", error);
            alert("Failed to update task hours.");
        }
    };

    const startEditingHours = (task) => {
        setEditingTaskId(task.id);
        setEditingHours(task.estimated_hours?.toString() || '0');
    };

    return (
        <Card className="mt-6 border-t pt-6">
            <CardHeader>
                <CardTitle>Manage Project Tasks</CardTitle>
                <p className="text-sm text-gray-600">Tasks can only be added from templates. Click on hours to edit allocation.</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Add from template */}
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <label className="text-sm font-medium">Add from Template</label>
                        <Select onValueChange={(templateId) => handleAddFromTemplate(taskTemplates.find(t => t.id === templateId))}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a task template to add..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {taskTemplates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name} ({template.dept}) - {template.default_hours}h {template.is_billable ? '(Billable)' : '(Non-billable)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Task list */}
                    <div className="space-y-2">
                        <h4 className="font-medium">Project Tasks</h4>
                        {isLoading ? (
                            <p>Loading tasks...</p>
                        ) : tasks.length > 0 ? (
                            <div className="border rounded-lg max-h-60 overflow-y-auto">
                                {tasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                                        <div className="flex-1">
                                            <p className="font-medium">{task.task_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {task.section}
                                                </Badge>
                                                <Badge variant={task.is_billable ? "default" : "secondary"} className="text-xs">
                                                    {task.is_billable ? "Billable" : "Non-billable"}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editingTaskId === task.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={editingHours}
                                                        onChange={(e) => setEditingHours(e.target.value)}
                                                        className="w-20 h-8"
                                                        step="0.5"
                                                    />
                                                    <Button size="sm" onClick={() => handleUpdateHours(task.id, editingHours)}>
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditingTaskId(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => startEditingHours(task)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <span className="font-mono">{task.estimated_hours || 0}h</span>
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 p-4 text-center border rounded-lg">No tasks found for this project. Add tasks from templates above.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}