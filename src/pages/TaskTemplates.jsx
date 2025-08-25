
import React, { useState, useEffect } from 'react';
import { TaskTemplate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox'; // Added import for Checkbox
import { Badge } from '@/components/ui/badge'; // Added import for Badge

const TemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    dept: template?.dept || 'Engineering',
    default_hours: template?.default_hours || 0,
    is_billable: template?.is_billable !== undefined ? template.is_billable : true, // Added is_billable
    description: template?.description || ''
  });

  const departmentOptions = ["Planning", "Survey", "Engineering", "PM", "Admin"];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{template ? 'Edit Task Template' : 'Create New Task Template'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Select value={formData.dept} onValueChange={(val) => setFormData({...formData, dept: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* New grid for default_hours and is_billable */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_hours">Default Hours</Label>
              <Input id="default_hours" type="number" value={formData.default_hours} onChange={(e) => setFormData({...formData, default_hours: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_billable">Billable by Default</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is_billable"
                  checked={formData.is_billable}
                  onCheckedChange={(checked) => setFormData({...formData, is_billable: checked})}
                />
                <Label htmlFor="is_billable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Tasks created from this template will be billable by default
                </Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save Template</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default function TaskTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await TaskTemplate.list();
    setTemplates(data);
    setIsLoading(false);
  };

  const handleSave = async (data) => {
    if (editingTemplate) {
      await TaskTemplate.update(editingTemplate.id, data);
    } else {
      await TaskTemplate.create(data);
    }
    setShowForm(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await TaskTemplate.delete(id);
      loadTemplates();
    }
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Templates</h1>
            <p className="text-gray-600">Manage the default task library for projects.</p>
          </div>
          <Button onClick={() => { setEditingTemplate(null); setShowForm(!showForm); }}>
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'New Template'}
          </Button>
        </div>

        {showForm && (
          <TemplateForm 
            template={editingTemplate}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingTemplate(null); }}
          />
        )}
        
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Default Hours</TableHead>
                  <TableHead>Billable</TableHead> {/* Added Billable header */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan="5">Loading...</TableCell></TableRow> // colSpan updated to 5
                ) : (
                  templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.dept}</TableCell>
                      <TableCell>{template.default_hours}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_billable ? "default" : "secondary"}>
                          {template.is_billable ? "Billable" : "Non-billable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
