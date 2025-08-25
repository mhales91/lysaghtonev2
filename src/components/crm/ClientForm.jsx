
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function ClientForm({ client, users, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    company_name: client?.company_name || '',
    contact_person: client?.contact_person || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: {
      street: client?.address?.street || '',
      city: client?.address?.city || '',
      postcode: client?.address?.postcode || ''
    },
    crm_stage: client?.crm_stage || 'lead',
    estimated_value: client?.estimated_value || '',
    probability: client?.probability || '',
    tags: client?.tags?.join(', ') || '',
    scope_summary: client?.scope_summary || '',
    lead_pm: client?.lead_pm || '',
    response_due: client?.response_due || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
      probability: formData.probability ? parseFloat(formData.probability) : null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };
    
    onSave(submitData);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{client ? 'Edit Client' : 'Add New Client'}</CardTitle>
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
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Address</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={formData.address.postcode}
                      onChange={(e) => handleInputChange('address.postcode', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CRM Information */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crm_stage">CRM Stage</Label>
                <Select
                  value={formData.crm_stage}
                  onValueChange={(value) => handleInputChange('crm_stage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => handleInputChange('estimated_value', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => handleInputChange('probability', e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="e.g. residential, commercial, urgent"
              />
            </div>
            
            {/* Scope & PM */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead_pm">Lead Project Manager</Label>
                <Select
                  value={formData.lead_pm}
                  onValueChange={(value) => handleInputChange('lead_pm', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response_due">Response Due</Label>
                <Input
                  id="response_due"
                  type="date"
                  value={formData.response_due}
                  onChange={(e) => handleInputChange('response_due', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="scope_summary">Scope Summary</Label>
                <Textarea
                  id="scope_summary"
                  value={formData.scope_summary}
                  onChange={(e) => handleInputChange('scope_summary', e.target.value)}
                  placeholder="Briefly describe the project scope or opportunity..."
                />
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
                {client ? 'Update Client' : 'Create Client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
