import React, { useState, useEffect } from 'react';
import { TOELibraryItem } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, FileText } from 'lucide-react';

const LibraryItemForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || item?.title || '', // Map title to name for database
    title: item?.title || item?.name || '', // Keep title for display
    category: item?.category || 'scope',
    content: item?.content || '',
    tags: item?.tags?.join(', ') || '',
    department: item?.department || 'Planning',
    third_party_entity: item?.third_party_entity || '',
    fee_amount: item?.fee_amount || '',
    is_active: item?.is_active !== undefined ? item.is_active : true
  });

  // Update form data when item prop changes (for editing)
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || item.title || '',
        title: item.title || item.name || '',
        category: item.category || 'scope',
        content: item.content || '',
        tags: item.tags?.join(', ') || '',
        department: item.department || 'Planning',
        third_party_entity: item.third_party_entity || '',
        fee_amount: item.fee_amount || '',
        is_active: item.is_active !== undefined ? item.is_active : true
      });
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        title: '',
        category: 'scope',
        content: '',
        tags: '',
        department: 'Planning',
        third_party_entity: '',
        fee_amount: '',
        is_active: true
      });
    }
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      name: formData.title, // Ensure name field is populated from title
      fee_amount: formData.fee_amount ? parseFloat(formData.fee_amount) : null, // Convert to number or null
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    };
    onSave(submitData);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{item ? 'Edit Library Item' : 'Create New Library Item'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({...formData, category: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scope">Scope Items</SelectItem>
                  <SelectItem value="assumption">Assumptions</SelectItem>
                  <SelectItem value="exclusion">Exclusions</SelectItem>
                  <SelectItem value="third_party_fee">Third Party Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(val) => setFormData({...formData, department: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Surveying">Surveying</SelectItem>
                  <SelectItem value="Project Management">Project Management</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.category === 'third_party_fee' && (
              <div className="space-y-2">
                <Label htmlFor="third_party_entity">Third Party Entity</Label>
                <Input 
                  id="third_party_entity" 
                  value={formData.third_party_entity} 
                  onChange={(e) => setFormData({...formData, third_party_entity: e.target.value})} 
                  placeholder="e.g. Tauranga City Council, Powerco, etc."
                />
              </div>
            )}
          </div>

          {formData.category === 'third_party_fee' && (
            <div className="space-y-2">
              <Label htmlFor="fee_amount">Fee Amount (NZD)</Label>
              <Input 
                id="fee_amount" 
                type="number"
                step="0.01"
                min="0"
                value={formData.fee_amount} 
                onChange={(e) => setFormData({...formData, fee_amount: e.target.value})} 
                placeholder="e.g. 886.00"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea 
              id="content" 
              value={formData.content} 
              onChange={(e) => setFormData({...formData, content: e.target.value})} 
              rows={4}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input 
              id="tags" 
              value={formData.tags} 
              onChange={(e) => setFormData({...formData, tags: e.target.value})} 
              placeholder="e.g. residential, commercial, standard"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" style={{ backgroundColor: '#5E0F68' }} className="hover:bg-purple-700">
              {item ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default function TOEAdmin() {
  const [libraryItems, setLibraryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadLibraryItems();
  }, []);

  useEffect(() => {
    let filtered = libraryItems;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    setFilteredItems(filtered);
  }, [libraryItems, searchTerm, categoryFilter]);

  const loadLibraryItems = async () => {
    setIsLoading(true);
    try {
      const data = await TOELibraryItem.list('-created_date');
      setLibraryItems(data);
    } catch (error) {
      console.error('Error loading library items:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async (data) => {
    try {
      if (editingItem) {
        await TOELibraryItem.update(editingItem.id, data);
      } else {
        await TOELibraryItem.create(data);
      }
      setShowForm(false);
      setEditingItem(null);
      loadLibraryItems();
    } catch (error) {
      console.error('Error saving library item:', error);
      alert('Error saving library item. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this library item?')) {
      try {
        await TOELibraryItem.delete(id);
        loadLibraryItems();
      } catch (error) {
        console.error('Error deleting library item:', error);
        alert('Error deleting library item.');
      }
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'scope': return 'bg-blue-100 text-blue-800';
      case 'assumption': return 'bg-green-100 text-green-800';
      case 'exclusion': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TOE Content Library</h1>
            <p className="text-gray-600">
              Manage standard content for scope items, assumptions, and exclusions.
            </p>
          </div>
          <Button 
            onClick={() => { setEditingItem(null); setShowForm(!showForm); }}
            style={{ backgroundColor: '#5E0F68' }}
            className="hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'New Library Item'}
          </Button>
        </div>

        {showForm && (
          <LibraryItemForm 
            item={editingItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search library items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="scope">Scope Items</SelectItem>
                  <SelectItem value="assumption">Assumptions</SelectItem>
                  <SelectItem value="exclusion">Exclusions</SelectItem>
                  <SelectItem value="third_party_fee">Third Party Fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Library Items by Category */}
        <Tabs value={categoryFilter === 'all' ? 'scope' : categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            <TabsTrigger value="scope">Scope Items ({libraryItems.filter(i => i.category === 'scope').length})</TabsTrigger>
            <TabsTrigger value="assumption">Assumptions ({libraryItems.filter(i => i.category === 'assumption').length})</TabsTrigger>
            <TabsTrigger value="exclusion">Exclusions ({libraryItems.filter(i => i.category === 'exclusion').length})</TabsTrigger>
            <TabsTrigger value="third_party_fee">Third Party Fees ({libraryItems.filter(i => i.category === 'third_party_fee').length})</TabsTrigger>
          </TabsList>
          
          {['scope', 'assumption', 'exclusion', 'third_party_fee'].map(category => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading library items...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Content Preview</TableHead>
                          <TableHead>Department</TableHead>
                          {category === 'third_party_fee' && <TableHead>Third Party Entity</TableHead>}
                          {category === 'third_party_fee' && <TableHead>Fee Amount</TableHead>}
                          <TableHead>Tags</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.filter(item => item.category === category).map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title || item.name}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate text-sm text-gray-600">
                                {item.content}
                              </div>
                            </TableCell>
                            <TableCell>{item.department || 'Planning'}</TableCell>
                            {category === 'third_party_fee' && (
                              <TableCell>{item.third_party_entity || '-'}</TableCell>
                            )}
                            {category === 'third_party_fee' && (
                              <TableCell>
                                {item.fee_amount ? `$${parseFloat(item.fee_amount).toFixed(2)}` : '-'}
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {item.tags?.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags && item.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.usage_count || 0}</TableCell>
                            <TableCell>
                              <Badge className={item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDelete(item.id)}
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
                  
                  {!isLoading && filteredItems.filter(item => item.category === category).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No {category === 'third_party_fee' ? 'third party fee' : category} items found</p>
                      <p className="text-sm">Create your first {category === 'third_party_fee' ? 'third party fee' : category} item to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}