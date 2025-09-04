
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, AlertTriangle } from "lucide-react";
import { TaskTemplate } from "@/api/entities";
import { validateProjectName, validateCurrency, validateDate, sanitizeInput } from "@/components/utils/inputValidation";
import { handleApiError, handleSuccess } from "@/components/utils/errorHandler";
import { LoadingButton } from "@/components/ui/loading-states";

export default function ProjectForm({ project, clients, users, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    project_manager: '',
    office: 'Bay of Plenty',
    lead_department: '',
    other_departments: [],
    budget_hours: '',
    budget_fees: '',
    start_date: '',
    end_date: '',
    status: 'not_started',
    billing_model: 'time_and_materials',
    selectedTaskTemplates: []
  });
  
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        client_id: project.client_id || '',
        project_manager: project.project_manager || '',
        office: project.office || 'Bay of Plenty',
        lead_department: project.lead_department || '',
        other_departments: project.other_departments || [],
        budget_hours: project.budget_hours?.toString() || '',
        budget_fees: project.budget_fees?.toString() || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status || 'not_started',
        billing_model: project.billing_model || 'time_and_materials',
        selectedTaskTemplates: []
      });
    }
    
    loadTaskTemplates();
  }, [project]);

  const loadTaskTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const templates = await TaskTemplate.list();
      setTaskTemplates(templates || []);
    } catch (error) {
      handleApiError(error, 'Loading task templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!validateProjectName(formData.name)) {
      errors.name = 'Project name must be 2-200 characters long';
    }
    
    if (!formData.client_id) {
      errors.client_id = 'Client is required';
    }
    
    if (formData.budget_fees && !validateCurrency(formData.budget_fees)) {
      errors.budget_fees = 'Budget fees must be a valid positive number';
    }
    
    if (formData.start_date && !validateDate(formData.start_date)) {
      errors.start_date = 'Start date must be a valid date';
    }
    
    if (formData.end_date && !validateDate(formData.end_date)) {
      errors.end_date = 'End date must be a valid date';
    }
    
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    // Sanitize text inputs
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        budget_hours: formData.budget_hours ? parseFloat(formData.budget_hours) : null,
        budget_fees: formData.budget_fees ? parseFloat(formData.budget_fees) : null,
      };
      
      await onSave(dataToSave);
      handleSuccess(project ? 'Project updated successfully' : 'Project created successfully');
    } catch (error) {
      handleApiError(error, project ? 'Updating project' : 'Creating project');
    } finally {
      setIsLoading(false);
    }
  };

  const departmentOptions = ["Planning", "Survey", "Engineering", "PM", "Admin"];
  const officeOptions = ["Bay of Plenty", "Waikato"];
  const statusOptions = [
    { value: "not_started", label: "Not Started" },
    { value: "active", label: "Active" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "archived", label: "Archived" }
  ];
  const billingModelOptions = [
    { value: "time_and_materials", label: "Time & Materials" },
    { value: "fixed_fee", label: "Fixed Fee" },
    { value: "profit_share", label: "Profit Share" }
  ];

  const renderField = (field, label, component) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      {component}
      {validationErrors[field] && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {validationErrors[field]}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{project ? 'Edit Project' : 'Create New Project'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {renderField('name', 'Project Name *', 
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter project name"
                  maxLength={200}
                />
              )}
              
              {renderField('client_id', 'Client *',
                <Select value={formData.client_id} onValueChange={(value) => handleChange('client_id', value)}>
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {renderField('project_manager', 'Project Manager',
                <Select value={formData.project_manager} onValueChange={(value) => handleChange('project_manager', value)}>
                  <SelectTrigger id="project_manager">
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {renderField('office', 'Office',
                <Select value={formData.office} onValueChange={(value) => handleChange('office', value)}>
                  <SelectTrigger id="office">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {officeOptions.map(office => (
                      <SelectItem key={office} value={office}>{office}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {renderField('lead_department', 'Lead Department',
                <Select value={formData.lead_department} onValueChange={(value) => handleChange('lead_department', value)}>
                  <SelectTrigger id="lead_department">
                    <SelectValue placeholder="Select lead department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {renderField('status', 'Status',
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {renderField('budget_hours', 'Budget Hours',
                <Input
                  id="budget_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.budget_hours}
                  onChange={(e) => handleChange('budget_hours', e.target.value)}
                  placeholder="0"
                />
              )}
              
              {renderField('budget_fees', 'Budget Fees ($)',
                <Input
                  id="budget_fees"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget_fees}
                  onChange={(e) => handleChange('budget_fees', e.target.value)}
                  placeholder="0.00"
                />
              )}
              
              {renderField('start_date', 'Start Date',
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                />
              )}
              
              {renderField('end_date', 'End Date',
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              )}
              
              {renderField('billing_model', 'Billing Model',
                <Select value={formData.billing_model} onValueChange={(value) => handleChange('billing_model', value)}>
                  <SelectTrigger id="billing_model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {billingModelOptions.map(model => (
                      <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {!project && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Add Default Tasks (Optional)</Label>
                {isLoadingTemplates ? (
                  <div className="text-sm text-gray-500">Loading task templates...</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                    {taskTemplates.map(template => (
                      <div key={template.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`template-${template.id}`}
                          checked={formData.selectedTaskTemplates.includes(template.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleChange('selectedTaskTemplates', [...formData.selectedTaskTemplates, template.id]);
                            } else {
                              handleChange('selectedTaskTemplates', formData.selectedTaskTemplates.filter(id => id !== template.id));
                            }
                          }}
                        />
                        <Label htmlFor={`template-${template.id}`} className="text-sm">
                          {template.name} ({template.dept})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                style={{ backgroundColor: '#5E0F68' }}
                className="hover:bg-purple-700"
              >
                {project ? 'Update Project' : 'Create Project'}
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
