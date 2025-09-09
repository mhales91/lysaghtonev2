
import React, { useState, useEffect, useMemo } from "react";
import { Project, Client, User, Task } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, List, KanbanSquare, GanttChartSquare, Search, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProjectList from "../components/projects/ProjectList";
import ProjectKanban from "../components/projects/ProjectKanban";
import ProjectGantt from "../components/projects/ProjectGantt";
import ProjectForm from "../components/projects/ProjectForm";
import BulkActionsBar from "../components/projects/BulkActionsBar";
import ProjectPagination from "../components/projects/ProjectPagination";
import { handleApiError, handleSuccess, handleWarning, handleInfo } from "@/components/utils/errorHandler";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [pmFilter, setPmFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection, pagination, and sorting
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: 'job_number', direction: 'desc' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Check if we're on localhost and have a localStorage user
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      let me;
      
      if (isLocalhost) {
        const localUser = localStorage.getItem('currentUser');
        if (localUser) {
          me = JSON.parse(localUser);
        } else {
          // Fallback to Supabase authentication for database users
          me = await User.me();
        }
      } else {
        // Production: Use Supabase authentication
        me = await User.me();
      }
      
      const [projectData, clientData, taskData] = await Promise.all([
        Project.list('-created_date'),
        Client.list(),
        Task.list()
      ]);
      setProjects(projectData);
      setClients(clientData);
      setTasks(taskData);
      
      const canViewUserList = ['Manager', 'DeptLead', 'Director', 'Admin'].includes(me.user_role);
      if (canViewUserList) {
        const userData = await User.list();
        setUsers(userData);
      } else {
        setUsers([]);
      }
    } catch (e) {
      handleApiError(e, 'Loading projects data');
    }
    setIsLoading(false);
  };

  // Separate active and archived projects
  const { activeProjects, archivedProjects } = useMemo(() => {
    const active = projects.filter(p => p.status !== 'archived');
    const archived = projects.filter(p => p.status === 'archived');
    return { activeProjects: active, archivedProjects: archived };
  }, [projects]);

  // Memoized and paginated active projects
  const paginatedProjects = useMemo(() => {
    const clientNameMap = new Map(clients.map(c => [c.id, c.company_name.toLowerCase()]));

    let filtered = activeProjects.filter(p => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const clientName = p.client_id ? clientNameMap.get(p.client_id) || '' : '';
        const searchMatch = !searchTerm || 
            p.project_name?.toLowerCase().includes(lowercasedFilter) ||
            String(p.job_number).includes(lowercasedFilter) ||
            clientName.includes(lowercasedFilter);

        const pmMatch = pmFilter === 'all' || p.project_manager === pmFilter;
        const officeMatch = officeFilter === 'all' || p.office === officeFilter;
        const statusMatch = statusFilter === 'all' || p.status === statusFilter;

        return searchMatch && pmMatch && officeMatch && statusMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'client_id') {
          aValue = clientNameMap.get(a.client_id) || '';
          bValue = clientNameMap.get(b.client_id) || '';
        }
        
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * projectsPerPage;
    return {
      total: filtered.length,
      data: filtered.slice(startIndex, startIndex + projectsPerPage)
    };
  }, [activeProjects, clients, searchTerm, pmFilter, officeFilter, statusFilter, sortConfig, currentPage, projectsPerPage]);

  // Memoized and paginated archived projects
  const paginatedArchivedProjects = useMemo(() => {
    const clientNameMap = new Map(clients.map(c => [c.id, c.company_name.toLowerCase()]));

    let filtered = archivedProjects.filter(p => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const clientName = p.client_id ? clientNameMap.get(p.client_id) || '' : '';
        const searchMatch = !searchTerm || 
            p.project_name?.toLowerCase().includes(lowercasedFilter) ||
            String(p.job_number).includes(lowercasedFilter) ||
            clientName.includes(lowercasedFilter);

        const pmMatch = pmFilter === 'all' || p.project_manager === pmFilter;
        const officeMatch = officeFilter === 'all' || p.office === officeFilter;

        return searchMatch && pmMatch && officeMatch;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'client_id') {
          aValue = clientNameMap.get(a.client_id) || '';
          bValue = clientNameMap.get(b.client_id) || '';
        }
        
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * projectsPerPage;
    return {
      total: filtered.length,
      data: filtered.slice(startIndex, startIndex + projectsPerPage)
    };
  }, [archivedProjects, clients, searchTerm, pmFilter, officeFilter, sortConfig, currentPage, projectsPerPage]);

  const handleSaveProject = async (projectData) => {
    try {
      const savedProject = await Project.create(projectData);
      handleSuccess('Project created successfully!');
      
      if (projectData.selectedTaskTemplates && projectData.selectedTaskTemplates.length > 0) {
        const { Task: ImportedTask, TaskTemplate } = await import('@/api/entities');
        
        for (const templateId of projectData.selectedTaskTemplates) {
          try {
            const template = await TaskTemplate.get(templateId);
            if (template) {
              await ImportedTask.create({
                project_id: savedProject.id,
                task_name: template.name,
                section: template.dept,
                estimated_hours: template.default_hours,
                is_billable: template.is_billable,
                assignee_email: '',
                status: 'not_started',
                completion_percentage: 0,
                priority: 'medium'
              });
            }
          } catch (taskError) {
            console.error(`Error creating task from template ${templateId}:`, taskError);
            handleWarning(`Some tasks from templates could not be created.`);
          }
        }
      }
      
      setShowForm(false);
      loadData();
    } catch (error) {
      handleApiError(error, 'Saving project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        try {
            await Project.delete(projectId);
            handleSuccess('Project deleted successfully!');
            await loadData();
        } catch (error) {
            handleApiError(error, 'Deleting project');
        }
    }
  };
  
  const handleAddDefaultTasks = async (project) => {
    if (!confirm(`Add all default task templates to "${project.project_name}"?`)) {
      return;
    }

    try {
      const { TaskTemplate, Task: TaskEntity } = await import('@/api/entities');
      
      const templates = await TaskTemplate.list();
      
      if (templates.length === 0) {
        handleWarning('No task templates found. Create some in Admin → Task Templates first.');
        return;
      }

      let createdCount = 0;
      let errorCount = 0;
      for (const template of templates) {
        try {
          await TaskEntity.create({
            project_id: project.id,
            task_name: template.name,
            section: template.dept,
            estimated_hours: template.default_hours,
            is_billable: template.is_billable,
            assignee_email: '',
            status: 'not_started',
            completion_percentage: 0,
            priority: 'medium'
          });
          createdCount++;
        } catch (taskError) {
          console.error(`Error creating task from template ${template.name}:`, taskError);
          errorCount++;
        }
      }
      
      if (createdCount > 0) {
        handleSuccess(`Successfully added ${createdCount} default tasks to the project.`);
        if (errorCount > 0) {
          handleWarning(`${errorCount} tasks failed to be added.`);
        }
        loadData();
      } else {
        handleWarning('No default tasks were added. Please check for errors.');
      }
    } catch (error) {
      handleApiError(error, 'Adding default tasks to project');
    }
  };
  
  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await Project.update(projectId, { status: newStatus });
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === projectId ? { ...p, status: newStatus } : p
        )
      );
      handleSuccess('Project status updated successfully!');
    } catch (error) {
      handleApiError(error, 'Updating project status');
      loadData();
    }
  };

  const handleArchiveProject = async (projectId) => {
    if (!confirm('Are you sure you want to archive this project? It will be moved to the archived projects section.')) {
      return;
    }

    try {
      const currentUser = await User.me();
      await Project.update(projectId, { 
        status: 'archived',
        archived_date: new Date().toISOString().split('T')[0],
        archived_by: currentUser.email
      });
      handleSuccess('Project archived successfully!');
      loadData();
    } catch (error) {
      handleApiError(error, 'Archiving project');
    }
  };

  const handleUnarchiveProject = async (projectId) => {
    if (!confirm('Are you sure you want to unarchive this project? It will be moved back to active projects.')) {
      return;
    }

    try {
      await Project.update(projectId, { 
        status: 'completed', // Default back to completed when unarchiving
        archived_date: null,
        archived_by: null
      });
      handleSuccess('Project unarchived successfully!');
      loadData();
    } catch (error) {
      handleApiError(error, 'Unarchiving project');
    }
  };

  const handleSelect = (projectId) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };
  
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedProjectIds(paginatedProjects.data.map(p => p.id));
    } else {
      setSelectedProjectIds([]);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProjectIds.length} projects? This cannot be undone.`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < selectedProjectIds.length; i++) {
        const projectId = selectedProjectIds[i];
        
        try {
          await Project.delete(projectId);
          successCount++;
          
          // Progress feedback for large operations - using handleInfo instead of console.info
          if (selectedProjectIds.length > 10 && (i + 1) % 10 === 0) {
            handleInfo(`Deleted ${i + 1}/${selectedProjectIds.length} projects...`);
          }
          
          if (i < selectedProjectIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (deleteError) {
          console.error(`Failed to delete project ${projectId}:`, deleteError);
          errorCount++;
        }
      }
      
      setSelectedProjectIds([]);
      loadData();
      
      if (errorCount === 0) {
        handleSuccess(`Successfully deleted ${successCount} projects`);
      } else {
        handleWarning(`Deleted ${successCount} projects, ${errorCount} failed`);
      }
      
    } catch (error) {
      handleApiError(error, 'Bulk delete projects');
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < selectedProjectIds.length; i++) {
        const projectId = selectedProjectIds[i];
        
        try {
          await Project.update(projectId, { status });
          successCount++;
          
          // Progress feedback for large operations - using handleInfo instead of console.info
          if (selectedProjectIds.length > 10 && (i + 1) % 10 === 0) {
            handleInfo(`Updated ${i + 1}/${selectedProjectIds.length} projects...`);
          }
          
          if (i < selectedProjectIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (updateError) {
          console.error(`Failed to update project ${projectId}:`, updateError);
          errorCount++;
        }
      }
      
      setSelectedProjectIds([]);
      loadData();
      
      const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
      
      if (errorCount === 0) {
        handleSuccess(`Successfully updated ${successCount} projects to "${statusLabel}"`);
      } else {
        handleWarning(`Updated ${successCount} projects to "${statusLabel}", ${errorCount} failed`);
      }
      
    } catch (error) {
      handleApiError(error, 'Bulk status update');
    }
  };

  const officeOptions = ["Bay of Plenty", "Waikato"];
  const projectStatusOptions = [
    "not_started",
    "in_progress", 
    "on_hold",
    "completed",
    "cancelled",
  ];
  
  const allStatusOptions = [...projectStatusOptions, "archived"];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">View and manage all ongoing and completed projects.</p>
          </div>
          <Button 
            onClick={() => { setShowForm(true); }}
            style={{ backgroundColor: '#5E0F68' }}
            className="hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by Job No, Name, or Client"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-10"
            />
          </div>
          <Select value={pmFilter} onValueChange={(value) => {setPmFilter(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Project Managers</SelectItem>
              {users.map(u => <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => {setStatusFilter(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {projectStatusOptions.map(s => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={officeFilter} onValueChange={(value) => {setOfficeFilter(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Offices</SelectItem>
              {officeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedProjectIds.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedProjectIds.length}
            onDelete={handleBulkDelete}
            onStatusUpdate={handleBulkStatusUpdate}
            projectStatusOptions={allStatusOptions}
          />
        )}

        {/* View Mode Tabs */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">
              <List className="w-4 h-4 mr-2"/>Active Projects
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <KanbanSquare className="w-4 h-4 mr-2"/>Kanban
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="w-4 h-4 mr-2"/>Archived ({archivedProjects.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <ProjectList 
              projects={paginatedProjects.data}
              clients={clients} 
              isLoading={isLoading} 
              onDelete={handleDeleteProject}
              onAddDefaultTasks={handleAddDefaultTasks}
              onArchive={handleArchiveProject}
              selectedProjectIds={selectedProjectIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <ProjectPagination
              currentPage={currentPage}
              totalPages={Math.ceil(paginatedProjects.total / projectsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={projectsPerPage}
              onItemsPerPageChange={(value) => {
                setProjectsPerPage(Number(value));
                setCurrentPage(1);
              }}
              totalItems={paginatedProjects.total}
            />
          </TabsContent>
          
          <TabsContent value="kanban">
            <ProjectKanban 
              projects={paginatedProjects.data}
              clients={clients}
              users={users}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="archived">
            <ProjectList 
              projects={paginatedArchivedProjects.data}
              clients={clients} 
              isLoading={isLoading} 
              onDelete={handleDeleteProject}
              onUnarchive={handleUnarchiveProject}
              selectedProjectIds={selectedProjectIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              sortConfig={sortConfig}
              onSort={handleSort}
              isArchiveView={true}
            />
            <ProjectPagination
              currentPage={currentPage}
              totalPages={Math.ceil(paginatedArchivedProjects.total / projectsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={projectsPerPage}
              onItemsPerPageChange={(value) => {
                setProjectsPerPage(Number(value));
                setCurrentPage(1);
              }}
              totalItems={paginatedArchivedProjects.total}
            />
          </TabsContent>
        </Tabs>

        {showForm && (
          <ProjectForm
            project={null}
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
