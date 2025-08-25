
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, RefreshCcw, Loader2 } from 'lucide-react';
import { aiVectorStore } from '@/api/functions';
import { format } from 'date-fns';

export default function VectorStoreManager({ assistant, onVectorStoreChange }) {
    const [vectorStoreId, setVectorStoreId] = useState(assistant.vector_store_id);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const callApi = useCallback(async (params) => {
        setIsLoading(true);
        try {
            const { data } = await aiVectorStore({ ...params, assistantId: assistant.id });
            return data;
        } catch (error) {
            console.error('Vector store API error:', error);
            alert(`Error: ${error.data?.error || error.message || 'An unknown error occurred.'}`);
        } finally {
            setIsLoading(false);
        }
    }, [assistant.id]);

    const fetchFiles = useCallback(async () => {
        if (!vectorStoreId) return;
        const data = await callApi({ action: 'list', method: 'GET' });
        if (data?.files) {
            setFiles(data.files);
            // Poll for status updates on processing files
            data.files.forEach(file => {
                if (file.status === 'in_progress') {
                    pollFileStatus(file.id);
                }
            });
        }
    }, [vectorStoreId, callApi]);
    
    const pollFileStatus = useCallback(async (fileId) => {
        const poller = setInterval(async () => {
            const data = await callApi({ action: 'status', method: 'GET', fileId });
            if (data?.file?.status !== 'in_progress') {
                clearInterval(poller);
                fetchFiles(); // Refresh the list
            }
        }, 5000); // Poll every 5 seconds
    }, [callApi, fetchFiles]);

    useEffect(() => {
        setVectorStoreId(assistant.vector_store_id);
        if (assistant.vector_store_id) {
            fetchFiles();
        } else {
            setFiles([]);
        }
    }, [assistant.vector_store_id, fetchFiles]);

    const handleCreateStore = async () => {
        const data = await callApi({ action: 'create_store', method: 'POST' });
        if (data?.vector_store_id) {
            setVectorStoreId(data.vector_store_id);
            onVectorStoreChange(data.vector_store_id);
        }
    };

    const handleFileUpload = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (selectedFiles.length === 0) return;
        
        setIsUploading(true);
        try {
            // Get the auth token
            const token = localStorage.getItem('base44_auth_token') || 
                         sessionStorage.getItem('base44_auth_token') || 
                         new URLSearchParams(window.location.search).get('access_token');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Using the user-provided logic for the upload
            const url = `/functions/aiVectorStore?action=upload&assistantId=${encodeURIComponent(assistant.id)}`;
            
            const fd = new FormData();
            for (const f of selectedFiles) {
                fd.append('files', f, f.name); // Key must be "files"
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}` // Browser will set the multipart Content-Type
                },
                body: fd
            });
            
            const data = await response.json();
            console.log('upload result', data);

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            if (data.results) {
                const failedUploads = data.results.filter(r => !r.ok);
                if (failedUploads.length > 0) {
                    console.warn('Some files failed to upload:', failedUploads);
                    alert(`Warning: ${failedUploads.length} files failed to upload. Check console for details.`);
                }
                const successCount = data.results.filter(r => r.ok).length;
                if (successCount > 0) {
                    alert(`Successfully uploaded ${successCount} file(s).`);
                }
            }
        } catch(error) {
             console.error('Upload failed', error);
             alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            fetchFiles();
        }
        
        // Reset file input
        event.target.value = '';
    };

    const handleDeleteFile = async (fileId) => {
        if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return;
        const data = await callApi({ action: 'delete', method: 'DELETE', fileId });
        if (data?.ok) {
            fetchFiles();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <Badge variant="default" className="bg-green-500">Completed</Badge>;
            case 'in_progress': return <Badge variant="secondary">Processing</Badge>;
            case 'failed': return <Badge variant="destructive">Failed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (!vectorStoreId) {
        return (
            <Card className="mt-4 bg-gray-50">
                <CardContent className="p-6 text-center">
                    <p className="mb-4">To enable file knowledge, first create a Vector Store.</p>
                    <Button onClick={handleCreateStore} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Vector Store
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>File Knowledge</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload-input').click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Upload Files
                        </Button>
                        <input 
                            type="file" 
                            id="file-upload-input" 
                            multiple 
                            className="hidden" 
                            onChange={handleFileUpload}
                            accept=".pdf,.docx,.txt,.csv,.md"
                        />
                        <Button variant="outline" size="icon" onClick={fetchFiles} disabled={isLoading}>
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    Manage the files this assistant can access for knowledge retrieval.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Filename</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Uploaded (UTC)</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.length > 0 ? files.map(file => (
                            <TableRow key={file.id}>
                                <TableCell className="font-medium truncate max-w-xs">{file.filename}</TableCell>
                                <TableCell>{(file.bytes / 1024).toFixed(2)} KB</TableCell>
                                <TableCell>{getStatusBadge(file.status)}</TableCell>
                                <TableCell>{format(new Date(file.created_at * 1000), 'yyyy-MM-dd HH:mm')}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No files uploaded yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
