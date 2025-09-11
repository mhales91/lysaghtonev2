import React, { useState, useEffect } from "react";
import { Task, Project, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from '@/contexts/UserContext';

import TaskBoard from "../components/tasks/TaskBoard";
import TaskList from "../components/tasks/TaskList";
import TaskForm from "../components/tasks/TaskForm";

export default function TasksPage() {
  const { currentUser } = useUser();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    project_id: 'all',
    status: 'all',
    assignee: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) {
      console.log('No user in context yet, waiting...');
      return;
    }

    setIsLoading(true);
    try {
      const [taskData, projectData] = await Promise.all([
        Task.list('-created_date'),
        Project.list()
      ]);
      
      setTasks(taskData);
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading task data:', error);
    }
    setIsLoading(false);
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await Task.update(editingTask.id, taskData);
    } else {
      await Task.create(taskData);
    }
    
    setShowForm(false);
    setEditingTask(null);
    loadData();
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await Task.delete(taskId);
      loadData();
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const completionPercentage = newStatus === 'completed' ? 100 : 
                                newStatus === 'in_progress' ? 50 : 0;
    
    await Task.update(taskId, { 
      status: newStatus,
      completion_percentage: completionPercentage
    });
    loadData();
  };

  const filteredTasks = tasks.filter(task => {
    const projectMatch = filters.project_id === 'all' || task.project_id === filters.project_id;
    const statusMatch = filters.status === 'all' || task.status === filters.status;
    const assigneeMatch = filters.assignee === 'all' || task.assignee_email === filters.assignee;
    return projectMatch && statusMatch && assigneeMatch;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
            <p className="text-gray-600">Manage project tasks and assignments</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#5E0F68' }}
            className="hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <Tabs defaultValue="board" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <TaskBoard
              tasks={filteredTasks}
              projects={projects}
              isLoading={isLoading}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </TabsContent>

          <TabsContent value="list">
            <TaskList
              tasks={filteredTasks}
              projects={projects}
              isLoading={isLoading}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </TabsContent>
        </Tabs>

        {/* Task Form Modal */}
        {showForm && (
          <TaskForm
            task={editingTask}
            projects={projects.filter(p => p.status === 'active')}
            currentUser={currentUser}
            onSave={handleSaveTask}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}