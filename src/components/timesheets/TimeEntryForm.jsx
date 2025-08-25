import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CompanySettings, Project, Task } from "@/api/entities";
import { X, Save, Clock, Search } from "lucide-react";

export default function TimeEntryForm({ entry, currentUser, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    project_id: entry?.project_id || '',
    task_id: entry?.task_id || '',
    date: entry?.date || new Date().toISOString().split('T')[0],
    hours: entry?.hours || '',
    description: entry?.description || '',
    billable: entry?.billable !== undefined ? entry.billable : true,
    hourly_rate: entry?.hourly_rate || 180,
    status: entry?.status || 'draft'
  });

  const [allProjects, setAllProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [isTimer, setIsTimer] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      const projectTasks = allTasks.filter(task => task.project_id === formData.project_id);
      setFilteredTasks(projectTasks);
    } else {
      setFilteredTasks([]);
    }
  }, [formData.project_id, allTasks]);

  useEffect(() => {
    let interval;
    if (timerStart) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - timerStart);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerStart]);

  const loadAllData = async () => {
    try {
      const [projectsData, tasksData] = await Promise.all([
        Project.list('-created_date'),
        Task.list('-created_date')
      ]);
      setAllProjects(projectsData || []);
      setAllTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading projects and tasks:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectChange = (projectId) => {
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      task_id: '' // Reset task when project changes
    }));
  };

  const startTimer = () => {
    setTimerStart(Date.now());
    setIsTimer(true);
  };

  const stopTimer = () => {
    if (timerStart) {
      const hours = elapsedTime / (1000 * 60 * 60);
      setFormData(prev => ({
        ...prev,
        hours: hours.toFixed(2)
      }));
    }
    setTimerStart(null);
    setIsTimer(false);
    setElapsedTime(0);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      hours: parseFloat(formData.hours),
      hourly_rate: parseFloat(formData.hourly_rate)
    };
    
    onSave(submitData);
  };

  const getSelectedProject = () => {
    return allProjects.find(p => p.id === formData.project_id);
  };

  const getSelectedTask = () => {
    return allTasks.find(t => t.id === formData.task_id);
  };

  // Filter projects based on search
  const filteredProjects = allProjects.filter(project => 
    project.project_name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.client_id?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Filter tasks based on search and selected project
  const searchFilteredTasks = filteredTasks.filter(task =>
    task.task_name?.toLowerCase().includes(taskSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {entry ? 'Edit Time Entry' : 'Add Time Entry'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Timer Section */}
            {!entry && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Time Tracker</h4>
                      <p className="text-sm text-gray-600">
                        {timerStart ? 'Timer running' : 'Start timer to track time automatically'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {timerStart && (
                        <div className="text-xl font-mono font-bold text-purple-600">
                          {formatTime(elapsedTime)}
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={timerStart ? stopTimer : startTimer}
                        variant={timerStart ? "destructive" : "default"}
                        style={!timerStart ? { backgroundColor: '#5E0F68' } : {}}
                        className={!timerStart ? "hover:bg-purple-700" : ""}
                      >
                        {timerStart ? 'Stop Timer' : 'Start Timer'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Selection with Search */}
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={formData.project_id}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {filteredProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{project.project_name}</span>
                          <span className="text-xs text-gray-500">
                            Status: {project.status} | Manager: {project.project_manager || 'Unassigned'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Task Selection with Search */}
            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <div className="space-y-2">
                {formData.project_id && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tasks..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
                <Select
                  value={formData.task_id}
                  onValueChange={(value) => handleInputChange('task_id', value)}
                  disabled={!formData.project_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.project_id ? "Select a task (optional)" : "Select a project first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    <SelectItem value={null}>No specific task</SelectItem>
                    {searchFilteredTasks.map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{task.task_name}</span>
                          <div className="flex gap-2 text-xs text-gray-500">
                            {task.section && <span>Section: {task.section}</span>}
                            {task.assignee_email && <span>Assigned: {task.assignee_email}</span>}
                            {task.estimated_hours && <span>Est: {task.estimated_hours}h</span>}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Project/Task Info */}
            {getSelectedProject() && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-blue-800">Selected Project</h4>
                      <Badge variant="outline">{getSelectedProject().status}</Badge>
                    </div>
                    <p className="text-sm text-blue-700">{getSelectedProject().project_name}</p>
                    {getSelectedTask() && (
                      <div className="border-t border-blue-200 pt-2 mt-2">
                        <h5 className="font-medium text-blue-800">Selected Task</h5>
                        <p className="text-sm text-blue-700">{getSelectedTask().task_name}</p>
                        {getSelectedTask().section && (
                          <p className="text-xs text-blue-600">Section: {getSelectedTask().section}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date and Hours */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Hours *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => handleInputChange('hours', e.target.value)}
                  placeholder="e.g. 8.5"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What did you work on?"
                rows={3}
              />
            </div>

            {/* Billing Options */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="billable">Billable</Label>
                  <Switch
                    id="billable"
                    checked={formData.billable}
                    onCheckedChange={(checked) => handleInputChange('billable', checked)}
                  />
                </div>
                
                {formData.hours && formData.hourly_rate && (
                  <div className="text-sm text-gray-600">
                    <strong>Total: ${(parseFloat(formData.hours) * parseFloat(formData.hourly_rate)).toFixed(2)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Project Budget Warning */}
            {getSelectedProject() && formData.hours && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 mb-1">Project Budget Status</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-yellow-700">Budget Hours:</span>
                        <span className="ml-2 font-medium">{getSelectedProject().budget_hours || 0}</span>
                      </div>
                      <div>
                        <span className="text-yellow-700">Used Hours:</span>
                        <span className="ml-2 font-medium">{getSelectedProject().actual_hours || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                {entry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}