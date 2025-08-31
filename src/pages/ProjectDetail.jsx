
import React, { useState, useEffect } from 'react';
import { Project, Client, User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoadingSkeleton } from '@/components/ui/loading-states';

import ProjectDetailOverview from '../components/projects/ProjectDetailOverview';
import ProjectTaskManager from '../components/projects/ProjectTaskManager';
import ProjectTOETab from '../components/projects/ProjectTOETab';
import ProjectForm from '../components/projects/ProjectForm';
import { handleSuccess, handleApiError } from '@/components/utils/errorHandler';

export default function ProjectDetail() {
    const [project, setProject] = useState(null);
    const [client, setClient] = useState(null);
    const [clients, setClients] = useState([]); // For the form
    const [users, setUsers] = useState([]); // For the form
    const [projectManager, setProjectManager] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false); // State to control form visibility

    const projectId = new URLSearchParams(window.location.search).get('id');

    useEffect(() => {
        if (!projectId) {
            setError('No project ID provided.');
            setIsLoading(false);
            return;
        }
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const projectData = await Project.get(projectId);
            setProject(projectData);

            const [clientList, userList] = await Promise.all([Client.list(), User.list()]);
            setClients(clientList);
            setUsers(userList);

            if (projectData.client_id) {
                const clientData = clientList.find(c => c.id === projectData.client_id);
                setClient(clientData);
            }

            if (projectData.project_manager) {
                const pm = userList.find(u => u.email === projectData.project_manager);
                setProjectManager(pm);
            }
        } catch (e) {
            console.error("Failed to load project details:", e);
            setError("Failed to load project details. The project may not exist.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProject = async (projectData) => {
        try {
            await Project.update(project.id, projectData);
            handleSuccess("Project updated successfully!");
            setShowForm(false);
            loadData(); // Reload data to reflect changes
        } catch (e) {
            handleApiError(e, "updating project");
        }
    };

    if (isLoading) return <PageLoadingSkeleton title="Loading Project Details..." />;
    if (error) return <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>;
    if (!project) return <div className="p-6 text-center text-gray-500">Project not found.</div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Button asChild variant="outline" size="sm">
                         <Link to={createPageUrl('Projects')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to All Projects
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
                    <p className="text-gray-600">
                        Job #{project.job_number} &bull; {client?.company_name || 'No Client'}
                    </p>
                  </div>
                  <Button onClick={() => setShowForm(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="toe">TOE</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <ProjectDetailOverview project={project} client={client} projectManager={projectManager} />
                    </TabsContent>

                    <TabsContent value="tasks">
                        <ProjectTaskManager projectId={projectId} />
                    </TabsContent>

                    <TabsContent value="toe">
                        <ProjectTOETab project={project} />
                    </TabsContent>
                </Tabs>

                {showForm && (
                    <ProjectForm
                        project={project}
                        clients={clients}
                        users={users}
                        onSave={handleSaveProject}
                        onCancel={() => setShowForm(false)}
                    />
                )}
            </div>
        </div>
    );
}
