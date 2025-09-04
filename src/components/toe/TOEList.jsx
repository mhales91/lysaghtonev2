
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Edit, 
  Send, 
  Eye, 
  CheckCircle, 
  Share, 
  Copy, 
  Trash2, 
  Search,
  Folder,
  Plus,
  Archive,
  MoreVertical,
  Download,
  MessageSquare,
  GitPullRequestArrow // New icon for feedback
} from "lucide-react";
import { format } from "date-fns";
import { TOEFolder, TOE, TOEReview } from "@/api/entities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function TOEList({ 
  toes, 
  clients, 
  reviews,
  isLoading, 
  onEdit, 
  onSend, 
  onPreview, 
  onCreateProject, 
  onDuplicate, 
  onGenerateLink, 
  onDelete,
  onViewFeedback, 
  onDownloadSigned, 
  onDownloadSignedTest 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  React.useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const folderData = await TOEFolder.list();
      setFolders(folderData || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await TOEFolder.create({
        name: newFolderName,
        description: `Folder for organizing TOEs`
      });
      setNewFolderName("");
      setShowNewFolderForm(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder');
    }
  };

  const handleMoveToFolder = async (toeId, folderId) => {
    try {
        await TOE.update(toeId, { folder_id: folderId });
        // Optionally, you can trigger a refresh of the TOEs list here if needed
        // For now, we assume parent component handles the refresh.
    } catch (error) {
        console.error("Failed to move TOE to folder", error);
        alert("Failed to move TOE.");
    }
  };

  const getClient = (clientId) => {
    return clients.find(c => c.id === clientId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'internal_review': return 'bg-yellow-100 text-yellow-800';
      case 'review_completed': return 'bg-indigo-100 text-indigo-800';
      case 'ready_to_send': return 'bg-blue-100 text-blue-800'; // New status color
      case 'sent': return 'bg-purple-100 text-purple-800'; // Updated color for sent
      case 'signed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTOEs = toes.filter(toe => {
    const matchesSearch = !searchTerm || 
      toe.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClient(toe.client_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || toe.status === statusFilter;
    const matchesFolder = !selectedFolder || toe.folder_id === selectedFolder;
    
    return matchesSearch && matchesStatus && matchesFolder;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search TOEs by project title or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="internal_review">Internal Review</SelectItem>
                  <SelectItem value="review_completed">Review Completed</SelectItem>
                  <SelectItem value="ready_to_send">Ready to Send</SelectItem> {/* New filter option */}
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolderForm(true)}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>

          {/* New Folder Form */}
          {showNewFolderForm && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCreateFolder} size="sm">
                  Create
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowNewFolderForm(false);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
           {/* Folder Filters */}
           <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                    variant={!selectedFolder ? 'solid' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFolder(null)}
                    className={!selectedFolder ? 'bg-purple-600 text-white' : ''}
                >
                    All
                </Button>
              {folders.map(folder => (
                <Button 
                    key={folder.id} 
                    variant={selectedFolder === folder.id ? 'solid' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFolder(folder.id)}
                    className={selectedFolder === folder.id ? 'bg-purple-600 text-white' : ''}
                >
                  <Folder className="w-3 h-3 mr-2" />
                  {folder.name}
                </Button>
              ))}
           </div>
        </CardContent>
      </Card>

      {/* TOE Cards */}
      <div className="grid gap-6">
        {filteredTOEs.map((toe) => {
          const client = getClient(toe.client_id);
          const toeReviews = reviews.filter(r => r.toe_id === toe.id && r.status === 'completed');
          
          return (
            <Card key={toe.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <CardTitle className="text-lg">{toe.project_title}</CardTitle>
                      <Badge className={getStatusColor(toe.status)}>
                        {toe.status.replace(/_/g, ' ')}
                      </Badge>
                      {toe.project_created && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Project Created
                        </Badge>
                      )}
                      {toe.status === 'review_completed' && toeReviews.length > 0 && (
                         <Badge variant="outline" className="border-green-300 text-green-800">
                           <MessageSquare className="w-3 h-3 mr-1" />
                           Review Feedback
                         </Badge>
                       )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Client:</strong> {client?.name || 'Unknown Client'}</p>
                      <p><strong>Version:</strong> {toe.version}</p>
                      {toe.total_fee_with_gst && (
                        <p><strong>Total Fee:</strong> ${toe.total_fee_with_gst.toLocaleString()}</p>
                      )}
                      <p><strong>Created:</strong> {format(new Date(toe.created_date), 'PPP')}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {toe.status === 'review_completed' ? (
                        <DropdownMenuItem onClick={() => onViewFeedback(toe)}>
                          <GitPullRequestArrow className="w-4 h-4 mr-2" /> View Feedback
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onEdit(toe)} disabled={toe.status === 'internal_review'}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onPreview(toe)}>
                        <Eye className="w-4 h-4 mr-2" /> Preview
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => onDuplicate(toe)}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Folder className="w-4 h-4 mr-2" />
                          Move to Folder
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {folders.map(folder => (
                            <DropdownMenuItem key={folder.id} onClick={() => handleMoveToFolder(toe.id, folder.id)}>
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      {toe.status === 'ready_to_send' && ( // Condition changed to 'ready_to_send'
                        <DropdownMenuItem onClick={() => onSend(toe.id)}>
                          <Send className="w-4 h-4 mr-2" /> Mark as Sent
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onGenerateLink(toe)}>
                        <Share className="w-4 h-4 mr-2" /> Get Share Link
                      </DropdownMenuItem>
                      {/* Download buttons are removed as per user request */}
                      {toe.status === 'signed' && !toe.project_created && (
                        <DropdownMenuItem onClick={() => onCreateProject(toe)}>
                          <CheckCircle className="w-4 h-4 mr-2" /> Create Project
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {toe.status !== 'signed' && (
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(toe.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {filteredTOEs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">No TOEs found</p>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || selectedFolder
                ? 'Try adjusting your search or filters'
                : 'Create your first Terms of Engagement'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
