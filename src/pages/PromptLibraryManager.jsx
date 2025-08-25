import React, { useState, useEffect } from 'react';
import { Prompt } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PromptForm = ({ prompt, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: prompt?.title || '',
        prompt_text: prompt?.prompt_text || '',
        category: prompt?.category || 'General',
        is_public: true // For admin, all prompts are public
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>{prompt ? 'Edit Public Prompt' : 'Create New Public Prompt'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt_text">Prompt Text</Label>
                        <Textarea id="prompt_text" value={formData.prompt_text} onChange={(e) => setFormData({...formData, prompt_text: e.target.value})} rows={5} required />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit">Save Prompt</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default function PromptLibraryManager() {
    const [prompts, setPrompts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        setIsLoading(true);
        try {
            const data = await Prompt.filter({ is_public: true });
            setPrompts(data);
        } catch (error) {
            console.error('Error loading prompts:', error);
            toast.error('Failed to load prompts.');
        }
        setIsLoading(false);
    };

    const handleSave = async (data) => {
        try {
            if (editingPrompt) {
                await Prompt.update(editingPrompt.id, data);
                toast.success('Prompt updated successfully!');
            } else {
                await Prompt.create(data);
                toast.success('Prompt created successfully!');
            }
            setShowForm(false);
            setEditingPrompt(null);
            loadPrompts();
        } catch (error) {
            console.error('Error saving prompt:', error);
            toast.error('Failed to save prompt.');
        }
    };

    const handleEdit = (prompt) => {
        setEditingPrompt(prompt);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this public prompt?')) {
            try {
                await Prompt.delete(id);
                toast.success('Prompt deleted.');
                loadPrompts();
            } catch (error) {
                console.error('Error deleting prompt:', error);
                toast.error('Failed to delete prompt.');
            }
        }
    };

    return (
        <div className="p-6 space-y-8 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prompt Library Manager</h1>
                        <p className="text-gray-600">Create and manage public prompts available to all users.</p>
                    </div>
                    <Button onClick={() => { setEditingPrompt(null); setShowForm(!showForm); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {showForm ? 'Cancel' : 'New Prompt'}
                    </Button>
                </div>

                {showForm && (
                    <PromptForm 
                        prompt={editingPrompt}
                        onSave={handleSave}
                        onCancel={() => { setShowForm(false); setEditingPrompt(null); }}
                    />
                )}
                
                <Card>
                    <CardHeader>
                        <CardTitle>Public Prompts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan="3">Loading prompts...</TableCell></TableRow>
                                ) : (
                                    prompts.map(prompt => (
                                        <TableRow key={prompt.id}>
                                            <TableCell className="font-medium">{prompt.title}</TableCell>
                                            <TableCell>{prompt.category}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(prompt)}><Edit className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prompt.id)} className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
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