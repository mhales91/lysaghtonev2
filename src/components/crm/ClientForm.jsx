import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle } from "lucide-react";
import { validateCompanyName, validateEmail, sanitizeInput } from "@/components/utils/inputValidation";
import { handleApiError, handleSuccess } from "@/components/utils/errorHandler";
import { LoadingButton } from "@/components/ui/loading-states";

export default function ClientForm({ client, users, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    crm_stage: 'lead',
    lead_pm: '',
    estimated_value: '',
    probability: '',
    scope_summary: '',
    address: {
      street: '',
      city: '',
      postcode: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        crm_stage: client.crm_stage || 'lead',
        lead_pm: client.lead_pm || '',
        estimated_value: client.estimated_value?.toString() || '',
        probability: client.probability?.toString() || '',
        scope_summary: client.scope_summary || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          postcode: client.address?.postcode || ''
        }
      });
    }
  }, [client]);

  const validateForm = () => {
    const errors = {};
    
    if (!validateCompanyName(formData.company_name)) {
      errors.company_name = 'Company name is required';
    }
    
    if (!formData.contact_person.trim()) {
      errors.contact_person = 'Contact person is required';
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.estimated_value && (isNaN(parseFloat(formData.estimated_value)) || parseFloat(formData.estimated_value) < 0)) {
      errors.estimated_value = 'Estimated value must be a positive number';
    }
    
    if (formData.probability && (isNaN(parseInt(formData.probability)) || parseInt(formData.probability) < 0 || parseInt(formData.probability) > 100)) {
      errors.probability = 'Probability must be between 0 and 100';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field, value) => {
    let sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setFormData(prev => {
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1];
        return {
          ...prev,
          address: {
            ...prev.address,
            [addressField]: sanitizedValue
          }
        };
      }
      return {
        ...prev,
        [field]: sanitizedValue
      };
    });
    
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
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        probability: formData.probability ? parseInt(formData.probability) : null,
      };
      
      await onSave(dataToSave);
      handleSuccess(client ? 'Client updated successfully' : 'Client created successfully');
    } catch (error) {
      handleApiError(error, client ? 'Updating client' : 'Creating client');
    } finally {
      setIsLoading(false);
    }
  };

  const stageOptions = [
    { value: 'lead', label: 'Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];

  const renderField = (field, label, component, required = false) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label} {required && '*'}</Label>
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{client ? 'Edit Client' : 'Add New Client'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {renderField('company_name', 'Company Name', 
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                  maxLength={200}
                />, 
                true
              )}

              {renderField('contact_person', 'Contact Person',
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleChange('contact_person', e.target.value)}
                  placeholder="Enter contact person"
                  maxLength={100}
                />,
                true
              )}

              {renderField('email', 'Email',
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              )}

              {renderField('phone', 'Phone',
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              )}

              {renderField('crm_stage', 'Stage',
                <Select value={formData.crm_stage} onValueChange={(value) => handleChange('crm_stage', value)}>
                  <SelectTrigger id="crm_stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {renderField('lead_pm', 'Project Manager',
                <Select value={formData.lead_pm} onValueChange={(value) => handleChange('lead_pm', value)}>
                  <SelectTrigger id="lead_pm">
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

              {renderField('estimated_value', 'Estimated Value ($)',
                <Input
                  id="estimated_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimated_value}
                  onChange={(e) => handleChange('estimated_value', e.target.value)}
                  placeholder="0.00"
                />
              )}

              {renderField('probability', 'Probability (%)',
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => handleChange('probability', e.target.value)}
                  placeholder="50"
                />
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Address</Label>
              <div className="grid md:grid-cols-2 gap-4">
                {renderField('address.street', 'Street',
                  <Input
                    id="address.street"
                    value={formData.address.street}
                    onChange={(e) => handleChange('address.street', e.target.value)}
                    placeholder="Enter street address"
                  />
                )}

                {renderField('address.city', 'City',
                  <Input
                    id="address.city"
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    placeholder="Enter city"
                  />
                )}

                <div className="md:col-span-1">
                  {renderField('address.postcode', 'Postcode',
                    <Input
                      id="address.postcode"
                      value={formData.address.postcode}
                      onChange={(e) => handleChange('address.postcode', e.target.value)}
                      placeholder="Enter postcode"
                    />
                  )}
                </div>
              </div>
            </div>

            {renderField('scope_summary', 'Scope Summary',
              <Textarea
                id="scope_summary"
                value={formData.scope_summary}
                onChange={(e) => handleChange('scope_summary', e.target.value)}
                placeholder="Brief description of the project scope..."
                className="h-24"
                maxLength={1000}
              />
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
                {client ? 'Update Client' : 'Create Client'}
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}