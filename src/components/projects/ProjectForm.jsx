
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Plus, List, Loader2, Briefcase } from "lucide-react"; // Removed LinkIcon and UploadCloud
import { TaskTemplate } from "@/api/entities";
import ProjectTaskManager from './ProjectTaskManager';
import ProjectTOETab from './ProjectTOETab';

export default function ProjectForm({ project, clients, users, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    client_id: project?.client_id || '',
    project_name: project?.project_name || '',
    status: project?.status || 'not_started',
    project_manager: project?.project_manager || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    budget_fees: project?.budget_fees || '',
    billing_model: project?.billing_model || 'time_and_materials',
    lead_department: project?.lead_department || '',
    other_departments: project?.other_departments || [],
    office: project?.office || 'Bay of Plenty',
    signed_toe_url: project?.signed_toe_url || '',
    toe_id: project?.toe_id || null
  });

  const [taskTemplates, setTaskTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [showTaskTemplates, setShowTaskTemplates] = useState(false);
  // Removed [isUploading, setIsUploading] state

  const departmentOptions = ["Planning", "Survey", "Engineering", "PM", "Admin"];
  const officeOptions = ["Bay of Plenty", "Waikato"];

  useEffect(() => {
    // Only load templates for new projects
    if (!project) { 
      loadTaskTemplates();
    }
  }, [project]);

  const loadTaskTemplates = async () => {
    try {
      const templates = await TaskTemplate.list();
      setTaskTemplates(templates || []);
    } catch (error) {
      console.error('Error loading task templates:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleOtherDeptsChange = (dept) => {
    const currentDepts = formData.other_departments;
    if (currentDepts.includes(dept)) {
      handleInputChange('other_departments', currentDepts.filter(d => d !== dept));
    } else {
      handleInputChange('other_departments', [...currentDepts, dept]);
    }
  };

  const handleTemplateToggle = (templateId) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  // Removed handleFileUpload function

  const handleSaveClick = () => {
    const submitData = {
      ...formData,
      selectedTaskTemplates: selectedTemplates
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{project ? 'Edit Project' : 'Create New Project'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="tasks" disabled={!project}>Tasks</TabsTrigger>
              <TabsTrigger value="toe" disabled={!project?.toe_id}>Terms of Engagement</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Project Name and Client */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => handleInputChange('client_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Project Manager and Status */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_manager">Project Manager</Label>
                  <Select
                    value={formData.project_manager}
                    onValueChange={(value) => handleInputChange('project_manager', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a PM" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.email} value={user.email}>{user.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lead Department and Office */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead_department">Lead Department</Label>
                  <Select
                    value={formData.lead_department}
                    onValueChange={(value) => handleInputChange('lead_department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office">Office</Label>
                  <Select
                    value={formData.office}
                    onValueChange={(value) => handleInputChange('office', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      {officeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Other Departments Checkboxes */}
              <div className="space-y-2">
                <Label>Other Departments</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {departmentOptions.map(dept => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={formData.other_departments.includes(dept)}
                        onCheckedChange={() => handleOtherDeptsChange(dept)}
                      />
                      <Label htmlFor={`dept-${dept}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {dept}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Fees and Billing Model */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_fees">Budget Fees ($)</Label>
                  <Input
                    id="budget_fees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budget_fees}
                    onChange={(e) => handleInputChange('budget_fees', e.target.value)}
                    placeholder="e.g. 18000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_model">Billing Model</Label>
                  <Select
                    value={formData.billing_model}
                    onValueChange={(value) => handleInputChange('billing_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_and_materials">Time & Materials</SelectItem>
                      <SelectItem value="fixed_fee">Fixed Fee</SelectItem>
                      <SelectItem value="profit_share">Profit Share</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Signed TOE Upload section removed as per instructions */}
              
              {/* Task Templates Section - Only for new projects */}
              {!project && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Add Default Tasks</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTaskTemplates(!showTaskTemplates)}
                      className="flex items-center gap-2"
                    >
                      <List className="w-4 h-4" />
                      {showTaskTemplates ? 'Hide Templates' : 'Select Task Templates'}
                    </Button>
                  </div>
                  
                  {showTaskTemplates && (
                    <Card className="p-4">
                      <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Select task templates to automatically create default tasks for this project:
                      </p>
                      
                      {taskTemplates.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {taskTemplates.map(template => (
                            <div key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                              <Checkbox
                                id={`template-${template.id}`}
                                checked={selectedTemplates.includes(template.id)}
                                onCheckedChange={() => handleTemplateToggle(template.id)}
                              />
                              <div className="flex-1">
                                <Label 
                                  htmlFor={`template-${template.id}`} 
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {template.name}
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {template.dept}
                                  </Badge>
                                  {/* New badge for billable status */}
                                  <Badge variant={template.is_billable ? "default" : "secondary"} className="text-xs">
                                    {template.is_billable ? "Billable" : "Non-billable"}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {template.default_hours}h
                                  </span>
                                </div>
                                {template.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {template.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No task templates available. Create some in Admin → Task Templates.
                        </p>
                      )}
                      
                      {selectedTemplates.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>{selectedTemplates.length}</strong> task template(s) selected. 
                            These will be created as default tasks when you save the project.
                          </p>
                        </div>
                      )}
                    </div>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-4">
              {project && <ProjectTaskManager projectId={project.id} />}
            </TabsContent>
            
            <TabsContent value="toe" className="mt-4">
              {project?.toe_id && <ProjectTOETab project={project} />}
            </TabsContent>

          </Tabs>
        </CardContent>
        <div className="flex-shrink-0 border-t p-4 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSaveClick}
            style={{ backgroundColor: '#5E0F68' }}
            className="hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {project ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
