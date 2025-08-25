
import React, { useState, useEffect, useMemo } from "react";
import { Project, Client, User, Task } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, List, KanbanSquare, GanttChartSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProjectList from "../components/projects/ProjectList";
import ProjectKanban from "../components/projects/ProjectKanban";
import ProjectGantt from "../components/projects/ProjectGantt";
import ProjectForm from "../components/projects/ProjectForm";
import BulkActionsBar from "../components/projects/BulkActionsBar";
import ProjectPagination from "../components/projects/ProjectPagination";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]); // Kept for Gantt chart
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [pmFilter, setPmFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // New state for selection, pagination, and sorting
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
      const [projectData, clientData, taskData, me] = await Promise.all([
        Project.list('-created_date'),
        Client.list(),
        Task.list(), // Tasks still needed for Gantt chart
        User.me()
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
      console.error("Failed to load projects data:", e);
      // Optionally handle the error visually, e.g., show a toast message
    }
    setIsLoading(false);
  };
  
  // Memoized and paginated projects
  const paginatedProjects = useMemo(() => {
    const clientNameMap = new Map(clients.map(c => [c.id, c.company_name.toLowerCase()]));

    let filtered = projects.filter(p => {
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
        
        // Handle undefined or null values by treating them as empty strings for comparison
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        // Use localeCompare for string comparison for better internationalization
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
  }, [projects, clients, searchTerm, pmFilter, officeFilter, statusFilter, sortConfig, currentPage, projectsPerPage]);

  const handleSaveProject = async (projectData) => {
    try {
      let savedProject;
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
        savedProject = { ...editingProject, ...projectData }; // Ensure savedProject is updated
      } else {
        savedProject = await Project.create(projectData);
        
        // Create default tasks if templates were selected
        if (projectData.selectedTaskTemplates && projectData.selectedTaskTemplates.length > 0) {
          const { Task: ImportedTask, TaskTemplate } = await import('@/api/entities'); // Renamed to avoid conflict with top-level import
          
          for (const templateId of projectData.selectedTaskTemplates) {
            try {
              const template = await TaskTemplate.get(templateId);
              if (template) {
                await ImportedTask.create({
                  project_id: savedProject.id,
                  task_name: template.name,
                  section: template.dept,
                  estimated_hours: template.default_hours,
                  is_billable: template.is_billable, // Add this line
                  assignee_email: '', // Will be assigned later
                  status: 'not_started',
                  completion_percentage: 0,
                  priority: 'medium'
                });
              }
            } catch (taskError) {
              console.error(`Error creating task from template ${templateId}:`, taskError);
            }
          }
        }
      }
      
      setShowForm(false);
      setEditingProject(null);
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        try {
            await Project.delete(projectId);
            await loadData();
        } catch (error) {
            console.error('Failed to delete project:', error);
            alert('There was an error deleting the project.');
        }
    }
  };
  
  const handleAddDefaultTasks = async (project) => {
    if (!confirm(`Add all default task templates to "${project.project_name}"?`)) {
      return;
    }

    try {
      const { TaskTemplate, Task: TaskEntity } = await import('@/api/entities');
      
      // Get all task templates
      const templates = await TaskTemplate.list();
      
      if (templates.length === 0) {
        alert('No task templates found. Create some in Admin → Task Templates first.');
        return;
      }

      // Create tasks from all templates
      let createdCount = 0;
      for (const template of templates) {
        try {
          await TaskEntity.create({
            project_id: project.id,
            task_name: template.name,
            section: template.dept,
            estimated_hours: template.default_hours,
            is_billable: template.is_billable,
            assignee_email: '', // Will be assigned later
            status: 'not_started',
            completion_percentage: 0,
            priority: 'medium'
          });
          createdCount++;
        } catch (taskError) {
          console.error(`Error creating task from template ${template.name}:`, taskError);
        }
      }
      
      if (createdCount > 0) {
        alert(`Successfully added ${createdCount} default tasks to the project.`);
        loadData(); // Refresh the data
      } else {
        alert('Failed to add default tasks. Please try again.');
      }
    } catch (error) {
      console.error('Error adding default tasks:', error);
      alert('Error adding default tasks. Please try again.');
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };
  
  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await Project.update(projectId, { status: newStatus });
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === projectId ? { ...p, status: newStatus } : p
        )
      );
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('There was an error updating the project status.');
      loadData(); // Re-sync with DB on failure
    }
  };

  // --- New handlers for bulk actions, selection, and sorting ---

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
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedProjectIds.length} projects? This cannot be undone.`)) {
      try {
        const projectsToDeleteCount = selectedProjectIds.length;
        // Process deletions sequentially to avoid rate limiting
        for (let i = 0; i < projectsToDeleteCount; i++) {
          const projectId = selectedProjectIds[i];
          try {
            await Project.delete(projectId);
            console.log(`Deleted project ${i + 1}/${projectsToDeleteCount}`);
            
            // Add delay between deletions to avoid rate limiting
            if (i < projectsToDeleteCount - 1) {
              await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
            }
          } catch (deleteError) {
            console.error(`Failed to delete project ${projectId}:`, deleteError);
            // Continue with other deletions even if one fails
          }
        }
        
        setSelectedProjectIds([]);
        loadData();
        alert(`Bulk deletion completed. Attempted to delete ${projectsToDeleteCount} projects.`);
      } catch (error) {
        console.error('Failed to bulk delete projects:', error);
        alert('An error occurred during bulk deletion.');
      }
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      const projectsToUpdateCount = selectedProjectIds.length;
      // Process updates sequentially to avoid rate limiting
      for (let i = 0; i < projectsToUpdateCount; i++) {
        const projectId = selectedProjectIds[i];
        try {
          await Project.update(projectId, { status });
          console.log(`Updated project ${i + 1}/${projectsToUpdateCount}`);
          
          // Add delay between updates to avoid rate limiting
          if (i < projectsToUpdateCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
          }
        } catch (updateError) {
          console.error(`Failed to update project ${projectId}:`, updateError);
          // Continue with other updates even if one fails
        }
      }
      
      setSelectedProjectIds([]);
      loadData();
      alert(`Bulk status update completed. Attempted to update ${projectsToUpdateCount} projects to "${status.replace('_', ' ')}".`);
    } catch (error) {
      console.error('Failed to bulk update status:', error);
      alert('An error occurred during bulk status update.');
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

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">View and manage all ongoing and completed projects.</p>
          </div>
          <Button 
            onClick={() => { setEditingProject(null); setShowForm(true); }}
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
            projectStatusOptions={projectStatusOptions}
          />
        )}

        {/* View Mode Tabs */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">
              <List className="w-4 h-4 mr-2"/>List
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <KanbanSquare className="w-4 h-4 mr-2"/>Kanban
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <ProjectList 
              projects={paginatedProjects.data}
              clients={clients} 
              isLoading={isLoading} 
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onAddDefaultTasks={handleAddDefaultTasks}
              // Pass down selection and sorting props
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

          <TabsContent value="gantt">
            <ProjectGantt
              projects={paginatedProjects.data}
              tasks={tasks}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>

        {showForm && (
          <ProjectForm
            project={editingProject}
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
