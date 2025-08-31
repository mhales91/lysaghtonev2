
import React, { useState, useEffect } from 'react';
import { Task, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TaskList from '@/components/tasks/TaskList';
import TaskForm from '@/components/tasks/TaskForm';
import { toast } from 'sonner'; // Changed from react-toastify to sonner

// Define handleApiError and handleSuccess locally, as per outline implications
const handleApiError = (error, context = "An operation") => {
    console.error(`Error during ${context}:`, error);
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    toast.error(`Failed to ${context}: ${errorMessage}`);
};

const handleSuccess = (message) => {
    console.log("Success:", message);
    toast.success(message);
};

export default function ProjectTaskManager({ projectId }) {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        if (projectId) {
            loadTasks();
            loadUsers();
        }
    }, [projectId]);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            // Removed '-created_date' parameter from filter, added client-side sort
            const taskData = await Task.filter({ project_id: projectId });
            setTasks(taskData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        } catch (error) {
            handleApiError(error, "loading tasks");
        }
        setIsLoading(false);
    };

    const loadUsers = async () => {
        try {
            const userData = await User.list();
            setUsers(userData);
        } catch (error) {
            handleApiError(error, "loading users");
        }
    };
    
    const handleSaveTask = async (taskData) => {
        try {
            if (editingTask) {
                await Task.update(editingTask.id, taskData);
                handleSuccess("Task updated successfully");
            } else {
                await Task.create({ ...(taskData || {}), project_id: projectId });
                handleSuccess("Task created successfully");
            }
            setShowTaskForm(false);
            setEditingTask(null);
            loadTasks();
        } catch (error) {
            handleApiError(error, "saving task");
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setShowTaskForm(true);
    };

    const handleDeleteTask = async (taskId) => {
        // Changed window.confirm to confirm and single quotes
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await Task.delete(taskId);
                handleSuccess("Task deleted successfully");
                loadTasks();
            } catch (error) {
                handleApiError(error, "deleting task");
            }
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Tasks</CardTitle>
                <Button 
                    onClick={() => {
                        setEditingTask(null);
                        setShowTaskForm(true);
                    }}
                    style={{ backgroundColor: '#5E0F68' }}
                    className="hover:bg-purple-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                </Button>
            </CardHeader>
            <CardContent>
                {/* Replaced Tabs with direct TaskList */}
                <TaskList
                  tasks={tasks}
                  users={users}
                  isLoading={isLoading}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
            </CardContent>

            {showTaskForm && (
                <TaskForm
                    task={editingTask}
                    users={users}
                    onSave={handleSaveTask}
                    onCancel={() => { setShowTaskForm(false); setEditingTask(null); }}
                />
            )}
            {/* ToastContainer removed as sonner is used now, and typically handled at a higher level */}
        </Card>
    );
}
