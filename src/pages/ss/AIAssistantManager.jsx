
import React, { useState, useEffect } from 'react';
import { AIAssistant } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Bot } from 'lucide-react';
import VectorStoreManager from '../components/ai/VectorStoreManager';
import { ALLOWED_MODELS } from './LysaghtAI'; // Import the whitelist

const AssistantForm = ({ assistant, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: assistant?.name || '',
        description: assistant?.description || '',
        category: assistant?.category || 'General',
        model: assistant?.model || 'gpt-4o-mini',
        system_prompt: assistant?.system_prompt || '',
        web_search_enabled: assistant?.web_search_enabled || false,
        file_search_enabled: assistant?.file_search_enabled || false,
        code_interpreter_enabled: assistant?.code_interpreter_enabled || false,
        image_generation_enabled: assistant?.image_generation_enabled || false,
        voice_enabled: assistant?.voice_enabled || false,
        vector_store_id: assistant?.vector_store_id || '',
        custom_functions: assistant?.custom_functions || [],
        is_active: assistant?.is_active !== undefined ? assistant.is_active : true
    });

    const categoryOptions = ["Engineering", "Planning", "Survey", "PM", "Admin", "General"];
    
    // Use the official, whitelisted models for the dropdown
    const availableModels = ALLOWED_MODELS;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const addCustomFunction = () => {
        setFormData(prev => ({
            ...prev,
            custom_functions: [...prev.custom_functions, {
                name: '',
                description: '',
                parameters: { type: 'object', properties: {} },
                endpoint: ''
            }]
        }));
    };

    const removeCustomFunction = (index) => {
        setFormData(prev => ({
            ...prev,
            custom_functions: prev.custom_functions.filter((_, i) => i !== index)
        }));
    };

    const updateCustomFunction = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            custom_functions: prev.custom_functions.map((func, i) => 
                i === index ? { ...func, [field]: value } : func
            )
        }));
    };

    const handleVectorStoreChange = (newVectorStoreId) => {
        setFormData(prev => ({ ...prev, vector_store_id: newVectorStoreId }));
    };

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>{assistant ? 'Edit AI Assistant' : 'Create New AI Assistant'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Assistant Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Engineering Report Writer"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map(cat => 
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe what this assistant helps with"
                            required
                        />
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="model">OpenAI Model</Label>
                        <Select 
                            value={formData.model} 
                            onValueChange={(val) => setFormData({...formData, model: val})}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels.map(mod => 
                                    <SelectItem key={mod} value={mod}>
                                        {mod}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Select an official OpenAI model.
                        </p>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <Label htmlFor="system_prompt">System Instructions</Label>
                        <Textarea
                            id="system_prompt"
                            value={formData.system_prompt}
                            onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                            placeholder="Define the assistant's behavior, tone, and capabilities..."
                            rows={6}
                            required
                        />
                        <p className="text-xs text-gray-500">
                            This is the core instruction that defines how the assistant behaves, its personality, and guardrails.
                        </p>
                    </div>

                    {/* Built-in Tools */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Built-in Tools</Label>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="web_search_enabled"
                                    checked={formData.web_search_enabled}
                                    onCheckedChange={(checked) => setFormData({...formData, web_search_enabled: checked})}
                                />
                                <Label htmlFor="web_search_enabled" className="font-medium">Web Search</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="file_search_enabled"
                                    checked={formData.file_search_enabled}
                                    onCheckedChange={(checked) => setFormData({...formData, file_search_enabled: checked})}
                                />
                                <Label htmlFor="file_search_enabled" className="font-medium">File Knowledge</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="code_interpreter_enabled"
                                    checked={formData.code_interpreter_enabled}
                                    onCheckedChange={(checked) => setFormData({...formData, code_interpreter_enabled: checked})}
                                />
                                <Label htmlFor="code_interpreter_enabled" className="font-medium">Code Interpreter</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="image_generation_enabled"
                                    checked={formData.image_generation_enabled}
                                    onCheckedChange={(checked) => setFormData({...formData, image_generation_enabled: checked})}
                                />
                                <Label htmlFor="image_generation_enabled" className="font-medium">Image Generation</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="voice_enabled"
                                    checked={formData.voice_enabled}
                                    onCheckedChange={(checked) => setFormData({...formData, voice_enabled: checked})}
                                />
                                <Label htmlFor="voice_enabled" className="font-medium">Voice I/O</Label>
                            </div>
                        </div>

                        {/* Vector Store ID for File Knowledge */}
                        {formData.file_search_enabled && (
                            <div className="space-y-2 mt-4">
                                <Label htmlFor="vector_store_id">Vector Store ID</Label>
                                <Input
                                    id="vector_store_id"
                                    value={formData.vector_store_id || ''}
                                    readOnly
                                    placeholder="Create a vector store below to get an ID"
                                />
                                <VectorStoreManager 
                                    assistant={{ id: assistant?.id, ...formData }}
                                    onVectorStoreChange={handleVectorStoreChange}
                                />
                            </div>
                        )}
                    </div>

                    {/* Custom Functions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Custom Functions (Actions)</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addCustomFunction}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Function
                            </Button>
                        </div>
                        
                        {formData.custom_functions.map((func, index) => (
                            <Card key={index} className="p-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Function {index + 1}</h4>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomFunction(index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor={`function-name-${index}`}>Function Name</Label>
                                            <Input
                                                id={`function-name-${index}`}
                                                value={func.name}
                                                onChange={(e) => updateCustomFunction(index, 'name', e.target.value)}
                                                placeholder="create_invoice"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`function-endpoint-${index}`}>Endpoint URL</Label>
                                            <Input
                                                id={`function-endpoint-${index}`}
                                                value={func.endpoint}
                                                onChange={(e) => updateCustomFunction(index, 'endpoint', e.target.value)}
                                                placeholder="/functions/createInvoice"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor={`function-description-${index}`}>Description</Label>
                                        <Input
                                            id={`function-description-${index}`}
                                            value={func.description}
                                            onChange={(e) => updateCustomFunction(index, 'description', e.target.value)}
                                            placeholder="Creates a new invoice for the specified client"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <Label htmlFor={`function-parameters-${index}`}>Parameters (JSON Schema)</Label>
                                        <Textarea
                                            id={`function-parameters-${index}`}
                                            value={JSON.stringify(func.parameters, null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const parsed = JSON.parse(e.target.value);
                                                    updateCustomFunction(index, 'parameters', parsed);
                                                } catch (err) {
                                                    // Invalid JSON, don't update if parsing fails,
                                                    // but allow user to continue typing invalid JSON
                                                    // For a more robust solution, you might store the raw string
                                                    // and only parse on save, or show an error message.
                                                }
                                            }}
                                            placeholder='{"type": "object", "properties": {"client_id": {"type": "string"}}, "required": ["client_id"]}'
                                            rows={3}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Define the input parameters the function expects using JSON Schema format.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                        />
                        <Label htmlFor="is_active">Active (visible to users)</Label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" style={{ backgroundColor: '#5E0F68' }} className="hover:bg-purple-700">
                            Save Assistant
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default function AIAssistantManager() {
    const [assistants, setAssistants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAssistant, setEditingAssistant] = useState(null);

    useEffect(() => {
        loadAssistants();
    }, []);

    const loadAssistants = async () => {
        setIsLoading(true);
        try {
            const data = await AIAssistant.list('-created_date');
            setAssistants(data);
        } catch (error) {
            console.error('Error loading assistants:', error);
        }
        setIsLoading(false);
    };

    const handleSave = async (data) => {
        try {
            if (editingAssistant) {
                await AIAssistant.update(editingAssistant.id, data);
            } else {
                await AIAssistant.create(data);
            }
            setShowForm(false);
            setEditingAssistant(null);
            loadAssistants();
        } catch (error) {
            console.error('Error saving assistant:', error);
            alert('Error saving assistant. Please try again.');
        }
    };

    const handleEdit = (assistant) => {
        setEditingAssistant(assistant);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this AI assistant?')) {
            try {
                await AIAssistant.delete(id);
                loadAssistants();
            } catch (error) {
                console.error('Error deleting assistant:', error);
                alert('Error deleting assistant. Please try again.');
            }
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Engineering': 'bg-blue-100 text-blue-800',
            'Planning': 'bg-green-100 text-green-800',
            'Survey': 'bg-yellow-100 text-yellow-800',
            'PM': 'bg-purple-100 text-purple-800',
            'Admin': 'bg-red-100 text-red-800',
            'General': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors['General'];
    };

    return (
        <div className="p-6 space-y-8 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant Manager</h1>
                        <p className="text-gray-600">Configure custom AI assistants with Custom GPT capabilities including web search, file knowledge, code interpreter, and custom functions.</p>
                    </div>
                    <Button 
                        onClick={() => { setEditingAssistant(null); setShowForm(!showForm); }}
                        style={{ backgroundColor: '#5E0F68' }}
                        className="hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {showForm ? 'Cancel' : 'New Assistant'}
                    </Button>
                </div>

                {showForm && (
                    <AssistantForm 
                        assistant={editingAssistant}
                        onSave={handleSave}
                        onCancel={() => { setShowForm(false); setEditingAssistant(null); }}
                    />
                )}
                
                <Card>
                    <CardHeader>
                        <CardTitle>AI Assistants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p>Loading assistants...</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Tools</TableHead>
                                        <TableHead>Usage</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assistants.map(assistant => (
                                        <TableRow key={assistant.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Bot className="w-4 h-4 text-purple-600" />
                                                    {assistant.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getCategoryColor(assistant.category)}>
                                                    {assistant.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {assistant.model || 'gpt-4o-mini'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {assistant.web_search_enabled && <Badge variant="outline" className="text-xs">Web</Badge>}
                                                    {assistant.file_search_enabled && <Badge variant="outline" className="text-xs">Files</Badge>}
                                                    {assistant.code_interpreter_enabled && <Badge variant="outline" className="text-xs">Code</Badge>}
                                                    {assistant.image_generation_enabled && <Badge variant="outline" className="text-xs">Images</Badge>}
                                                    {assistant.voice_enabled && <Badge variant="outline" className="text-xs">Voice</Badge>}
                                                    {assistant.custom_functions?.length > 0 && <Badge variant="outline" className="text-xs">Functions</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{assistant.usage_count || 0} times</TableCell>
                                            <TableCell>
                                                <Badge variant={assistant.is_active ? "default" : "secondary"}>
                                                    {assistant.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(assistant)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(assistant.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
