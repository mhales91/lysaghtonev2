import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AddTaskModal({ projects, tasks, onAddTask, onClose }) {
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [step, setStep] = useState(1); // 1 = select project, 2 = select task

    const projectOptions = useMemo(() => {
        return projects.map(project => ({
            ...project,
            label: `${project.description || 'N/A'} - ${project.name}`,
            value: project.id,
        }));
    }, [projects]);

    const taskOptions = useMemo(() => {
        if (!selectedProject) return [];
        return tasks
            .filter(task => task.project_id === selectedProject.id)
            .map(task => ({
                ...task,
                label: task.task_name,
                value: task.id,
            }));
    }, [tasks, selectedProject]);

    const handleProjectSelect = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        setSelectedProject(project);
        setStep(2);
    };

    const handleTaskSelect = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        setSelectedTask(task);
    };

    const handleConfirm = () => {
        if (selectedTask) {
            onAddTask(selectedTask);
            onClose();
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
            setSelectedProject(null);
            setSelectedTask(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {step === 1 ? 'Select Job' : `Select Task from ${selectedProject?.name}`}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 ? (
                        <>
                            <p>First, select a job/project to add tasks from.</p>
                            <Command className="rounded-lg border shadow-md">
                                <CommandInput placeholder="Search for a job..." />
                                <CommandList>
                                    <CommandEmpty>No jobs found.</CommandEmpty>
                                    <CommandGroup heading="Available Jobs">
                                        {projectOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onSelect={() => handleProjectSelect(option.value)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{option.label}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {option.office || 'N/A'}
                                                        </Badge>
                                                        <Badge variant={option.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                            {option.status?.replace('_', ' ') || 'Unknown'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </>
                    ) : (
                        <>
                            <p>Now select a task from this job to add to your timesheet.</p>
                            <Command className="rounded-lg border shadow-md">
                                <CommandInput placeholder="Search for a task..." />
                                <CommandList>
                                    <CommandEmpty>No tasks found for this job.</CommandEmpty>
                                    <CommandGroup heading="Available Tasks">
                                        {taskOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.label}
                                                onSelect={() => handleTaskSelect(option.value)}
                                                className="cursor-pointer"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{option.label}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {option.section || 'N/A'}
                                                        </Badge>
                                                        <Badge variant={option.is_billable ? 'default' : 'secondary'} className="text-xs">
                                                            {option.is_billable ? 'Billable' : 'Non-billable'}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            {option.estimated_hours || 0}h estimated
                                                        </span>
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>

                            {selectedTask && (
                                <div className="p-3 bg-gray-100 rounded-md">
                                    <p className="font-semibold">Selected: {selectedTask.task_name}</p>
                                    <p className="text-sm text-gray-600">
                                        From: {selectedProject.description || 'N/A'} - {selectedProject.name}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                    
                    <div className="flex justify-between">
                        <div>
                            {step === 2 && (
                                <Button variant="outline" onClick={handleBack}>
                                    Back to Jobs
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            {step === 2 && (
                                <Button onClick={handleConfirm} disabled={!selectedTask}>
                                    Add to Timesheet
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}