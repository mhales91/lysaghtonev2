import React, { useState, useEffect } from 'react';
import { Prompt } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PromptForm = ({ prompt, onSave, onCancel, userEmail }) => {
    const [formData, setFormData] = useState({
        title: prompt?.title || '',
        prompt_text: prompt?.prompt_text || '',
        category: prompt?.category || 'My Prompts',
        is_public: false,
        user_email: userEmail
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Prompt</Button>
            </DialogFooter>
        </form>
    );
};

export default function PromptLibrary({ onClose, onSelectPrompt, currentUser }) {
    const [publicPrompts, setPublicPrompts] = useState([]);
    const [userPrompts, setUserPrompts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);

    useEffect(() => {
        loadPrompts();
    }, [currentUser]);

    const loadPrompts = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const [publicData, userData] = await Promise.all([
                Prompt.filter({ is_public: true }),
                Prompt.filter({ user_email: currentUser.email, is_public: false })
            ]);
            setPublicPrompts(publicData);
            setUserPrompts(userData);
        } catch (error) {
            console.error("Error loading prompts:", error);
            toast.error("Failed to load prompts.");
        }
        setIsLoading(false);
    };
    
    const handleSave = async (data) => {
        try {
            if (editingPrompt) {
                await Prompt.update(editingPrompt.id, data);
                toast.success('Prompt updated!');
            } else {
                await Prompt.create(data);
                toast.success('Prompt saved!');
            }
            setShowForm(false);
            setEditingPrompt(null);
            loadPrompts();
        } catch (error) {
            console.error("Error saving prompt:", error);
            toast.error('Failed to save prompt.');
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this prompt?")) {
            try {
                await Prompt.delete(id);
                toast.success("Prompt deleted.");
                loadPrompts();
            } catch (error) {
                console.error("Error deleting prompt:", error);
                toast.error("Failed to delete prompt.");
            }
        }
    };
    
    const PromptList = ({ title, prompts }) => (
        <div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <div className="space-y-2">
                {prompts.length > 0 ? prompts.map(p => (
                    <div key={p.id} className="group p-3 rounded-lg border hover:bg-gray-50 flex justify-between items-center">
                        <div className="cursor-pointer flex-1" onClick={() => onSelectPrompt(p.prompt_text)}>
                            <p className="font-medium">{p.title}</p>
                            <p className="text-sm text-gray-500 truncate">{p.prompt_text}</p>
                        </div>
                        {title === "My Prompts" && (
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingPrompt(p); setShowForm(true); }}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )) : <p className="text-sm text-gray-500">No prompts here yet.</p>}
            </div>
        </div>
    );

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Prompt Library</DialogTitle>
                </DialogHeader>

                {showForm ? (
                    <PromptForm 
                        prompt={editingPrompt} 
                        onSave={handleSave}
                        onCancel={() => { setShowForm(false); setEditingPrompt(null); }}
                        userEmail={currentUser?.email}
                    />
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto space-y-6 p-1">
                            {isLoading ? <p>Loading...</p> : (
                                <>
                                    <PromptList title="Public Prompts" prompts={publicPrompts} />
                                    <PromptList title="My Prompts" prompts={userPrompts} />
                                </>
                            )}
                        </div>
                        <DialogFooter className="mt-4">
                            <Button onClick={() => { setEditingPrompt(null); setShowForm(true); }}>
                                <Plus className="w-4 h-4 mr-2" /> Add My Prompt
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}