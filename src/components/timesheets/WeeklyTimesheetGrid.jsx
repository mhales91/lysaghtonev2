
import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Copy, Plus, AlertCircle, Trash2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { TimeEntry, Project, Task, Client } from '@/api/entities';
import AddTaskModal from './AddTaskModal';

const WeeklyTimesheetGrid = forwardRef(({ 
    currentUser, 
    timeEntries,
    projects,
    tasks,
    clients,
    isLoading,
    onSave,
    onSubmit,
    selectedWeek,
    onWeekChange
}, ref) => {
    const [gridRows, setGridRows] = useState([]);
    const [activeNotesCell, setActiveNotesCell] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);

    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Memoize lookup maps for performance
    const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
    const tasksMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
    const clientsMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

    // Auto-save functionality
    const autoSaveTimeoutRef = React.useRef(null);
    const saveInProgressRef = React.useRef(false); // New ref to track save status

    const triggerAutoSave = () => {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        
        // Set new timeout to auto-save after 2 seconds of inactivity
        autoSaveTimeoutRef.current = setTimeout(() => {
            if (!saveInProgressRef.current) { // Prevent multiple saves if one is already in progress
                saveInProgressRef.current = true;
                onSave(gridRows).finally(() => {
                    saveInProgressRef.current = false;
                });
            }
        }, 2000);
    };

    useImperativeHandle(ref, () => ({
        save: () => {
            if (!saveInProgressRef.current) { // Prevent multiple saves if one is already in progress
                saveInProgressRef.current = true;
                return onSave(gridRows).finally(() => {
                    saveInProgressRef.current = false;
                });
            }
            return Promise.resolve(); // Return a resolved promise if save is already in progress
        }
    }));

    useEffect(() => {
        buildGridRows();
    }, [timeEntries, projects, tasks, clients, selectedWeek]);
    
    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    const parseTimeToHours = (value) => {
        if (!value) return 0;
        if (value.includes(':')) {
            const [h, m] = value.split(':').map(Number);
            return (h || 0) + ((m || 0) / 60);
        }
        return parseFloat(value) || 0;
    };

    const handleCellChange = (rowIndex, dayIndex, value) => {
        const entry = gridRows[rowIndex].dailyEntries[dayIndex];
        
        // Check if this time entry is locked (invoiced)
        if (entry.id && entry.isLocked) {
            alert('This time entry has been invoiced and cannot be modified.');
            return;
        }
        
        const newGridRows = [...gridRows];
        newGridRows[rowIndex].dailyEntries[dayIndex].hours = value; // Keep raw input for display
        newGridRows[rowIndex].dailyEntries[dayIndex].isDirty = true;
        setGridRows(newGridRows);
        
        // Trigger auto-save
        triggerAutoSave();
    };

    const handleNotesChange = (rowIndex, dayIndex, value) => {
        const entry = gridRows[rowIndex].dailyEntries[dayIndex];
        
        // Check if this time entry is locked (invoiced)
        if (entry.id && entry.isLocked) {
            alert('This time entry has been invoiced and cannot be modified.');
            return;
        }
        
        const newGridRows = [...gridRows];
        newGridRows[rowIndex].dailyEntries[dayIndex].notes = value;
        newGridRows[rowIndex].dailyEntries[dayIndex].isDirty = true;
        setGridRows(newGridRows);
        
        // Trigger auto-save
        triggerAutoSave();
    };

    const buildGridRows = () => {
        if (isLoading) return;

        console.log('Building grid rows with time entries:', timeEntries.length);

        const rowsMap = new Map();

        // First, create rows from existing time entries
        // This pass ensures that each unique project-task combination gets one row
        timeEntries.forEach(entry => {
            const key = `${entry.project_id}-${entry.task_id}`;
            if (!rowsMap.has(key)) {
                const project = projectsMap.get(entry.project_id);
                const task = tasksMap.get(entry.task_id);
                const client = project ? clientsMap.get(project.client_id) : null;
                
                if (project && task) { // Only add if project and task are valid
                    rowsMap.set(key, {
                        key,
                        project,
                        task,
                        client,
                        dailyEntries: Array(7).fill(null).map((_, i) => ({
                            date: format(weekDays[i], 'yyyy-MM-dd'),
                            hours: '',
                            notes: '',
                            isDirty: false,
                            status: null,
                            isLocked: false
                        })),
                    });
                } else {
                    console.warn(`Skipping entry due to missing project or task: Project ID ${entry.project_id}, Task ID ${entry.task_id}`);
                }
            }
        });

        // Fill in the actual time data from entries into the created rows
        timeEntries.forEach(entry => {
            const key = `${entry.project_id}-${entry.task_id}`;
            if (rowsMap.has(key)) {
                const dayIndex = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === entry.date);
                if (dayIndex !== -1) {
                    const row = rowsMap.get(key);
                    const isLocked = entry.status === 'invoiced';
                    row.dailyEntries[dayIndex] = {
                        ...row.dailyEntries[dayIndex], // Preserve date, etc.
                        id: entry.id,
                        hours: (entry.minutes / 60).toFixed(2),
                        notes: entry.description || '',
                        status: entry.status,
                        isLocked: isLocked
                    };
                }
            }
        });

        const finalRows = Array.from(rowsMap.values());
        console.log('Final grid rows (unique project-task combinations):', finalRows.length);
        setGridRows(finalRows);
        setSelectedRows([]);
    };
    
    const handleAddTask = (task) => {
        const project = projectsMap.get(task.project_id);
        const client = project ? clientsMap.get(project.client_id) : null;
        const key = `${task.project_id}-${task.id}`;

        if (gridRows.some(row => row.key === key)) {
            alert("This task is already in your timesheet.");
            return;
        }

        const newRow = {
            key,
            project,
            task,
            client,
            dailyEntries: Array(7).fill(null).map((_, i) => ({
                date: format(weekDays[i], 'yyyy-MM-dd'),
                hours: '',
                notes: '',
                isDirty: false,
                status: null,
                isLocked: false
            })),
        };
        setGridRows(prevRows => [...prevRows, newRow]);
    };
    
    const handleCopyPreviousWeek = async () => {
        if (!confirm("This will add tasks from last week to your current timesheet. Continue?")) return;

        const lastWeekStart = format(subWeeks(weekStart, 1), 'yyyy-MM-dd');
        const lastWeekEnd = format(subWeeks(weekEnd, 1), 'yyyy-MM-dd');
        
        try {
            const lastWeekEntries = await TimeEntry.filter({
                user_email: currentUser.email,
                date: { $gte: lastWeekStart, $lte: lastWeekEnd }
            });

            const tasksToAdd = new Map();
            lastWeekEntries.forEach(entry => {
                const task = tasksMap.get(entry.task_id);
                if (task) {
                    tasksToAdd.set(task.id, task);
                }
            });

            tasksToAdd.forEach(task => handleAddTask(task));
        } catch (error) {
            console.error("Error copying previous week:", error);
            alert("Failed to copy tasks from the previous week.");
        }
    };
    
    const handleToggleRowSelection = (rowIndex) => {
        const newSelectedRows = [...selectedRows];
        if (newSelectedRows.includes(rowIndex)) {
            setSelectedRows(newSelectedRows.filter(i => i !== rowIndex));
        } else {
            setSelectedRows([...newSelectedRows, rowIndex]);
        }
    };

    const handleToggleAllRows = () => {
        if (selectedRows.length === gridRows.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(gridRows.map((_, i) => i));
        }
    };

    const handleDeleteSelectedRows = () => {
        if (selectedRows.length === 0) {
            alert("No rows selected to delete.");
            return;
        }

        const hasLockedEntry = selectedRows.some(rowIndex => 
            gridRows[rowIndex].dailyEntries.some(entry => entry.isLocked)
        );

        if (hasLockedEntry) {
            alert("Cannot delete rows that contain invoiced time entries. Please deselect them first.");
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedRows.length} selected task row(s)? This will also delete any saved time entries for these tasks this week.`)) {
            const newGridRows = gridRows.filter((_, i) => !selectedRows.includes(i));
            setGridRows(newGridRows);
            setSelectedRows([]); // Clear selection after deletion
            // Note: This only removes from UI. The `onSave` logic handles DB deletion for entries.
            triggerAutoSave(); // Trigger save to reflect deletions
        }
    };

    const calculateRowTotal = (dailyEntries) => {
        return dailyEntries.reduce((sum, entry) => sum + parseTimeToHours(entry.hours), 0).toFixed(2);
    };

    const calculateDayTotal = (dayIndex) => {
        return gridRows.reduce((sum, row) => sum + parseTimeToHours(row.dailyEntries[dayIndex].hours), 0).toFixed(2);
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            {isModalOpen && (
                <AddTaskModal
                    projects={projects}
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => onWeekChange(subWeeks(selectedWeek, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onWeekChange(addWeeks(selectedWeek, 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold text-gray-800 ml-2">
                        Weekly Summary - {format(weekStart, 'd MMMM yyyy')} to {format(weekEnd, 'd MMMM yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCopyPreviousWeek}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Previous Week
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add a Task
                    </Button>
                    {selectedRows.length > 0 && (
                        <Button variant="destructive" onClick={handleDeleteSelectedRows}>
                            <Trash2 className="w-4 h-4 mr-2" />
                             Delete Selected
                        </Button>
                    )}
                </div>
            </div>

            {/* Auto-save indicator */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-xs text-gray-500">
                    Changes are automatically saved
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 w-[40px] text-left">
                                <Checkbox 
                                    checked={selectedRows.length === gridRows.length && gridRows.length > 0}
                                    onCheckedChange={handleToggleAllRows}
                                />
                            </th>
                            <th className="p-2 text-left font-semibold text-gray-600 w-[350px]">Job / Task</th>
                            {weekDays.map((day, dayIndex) => (
                                <th key={day.toString()} className="p-2 text-center font-semibold text-gray-600">
                                    {format(day, 'EEE')}
                                    <div className="text-gray-500 font-normal">{format(day, 'MMM d')}</div>
                                </th>
                            ))}
                            <th className="p-2 text-right font-semibold text-gray-600 w-[100px]">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gridRows.length === 0 ? (
                            <tr>
                                <td colSpan="10">
                                    <div className="text-center py-12 text-gray-500">
                                        <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                                        <h3 className="font-semibold">Your timesheet is empty for this week.</h3>
                                        <p>Click "Add a Task" or "Copy Previous Week" to get started.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            gridRows.map((row, rowIndex) => (
                                <React.Fragment key={row.key}>
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="p-2">
                                            <Checkbox 
                                                checked={selectedRows.includes(rowIndex)}
                                                onCheckedChange={() => handleToggleRowSelection(rowIndex)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="font-semibold text-gray-800">{row.project?.description || 'N/A'} - {row.project?.name}</div>
                                            <div className="text-sm text-purple-700">{row.task?.task_name}</div>
                                            <div className="text-xs text-gray-500">{row.client?.name}</div>
                                        </td>
                                        {row.dailyEntries.map((cell, dayIndex) => (
                                            <td key={dayIndex} className="p-2 w-[100px] relative">
                                                <Input
                                                    type="text"
                                                    className={`text-center ${cell.isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    placeholder="0:00"
                                                    value={cell.hours}
                                                    onChange={(e) => handleCellChange(rowIndex, dayIndex, e.target.value)}
                                                    onFocus={() => setActiveNotesCell({ rowIndex, dayIndex })}
                                                    disabled={cell.isLocked}
                                                    title={cell.isLocked ? 'This entry has been invoiced and cannot be modified' : ''}
                                                />
                                                {cell.isLocked && (
                                                    <div className="absolute top-1 right-1">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full" title="Invoiced - Locked"></div>
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                        <td className="p-2 text-right font-bold text-gray-800">{calculateRowTotal(row.dailyEntries)}</td>
                                    </tr>
                                    {activeNotesCell?.rowIndex === rowIndex && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="2"></td>
                                            <td colSpan="2" className="p-2">
                                                <div className="font-semibold text-sm mb-1">Notes for {format(weekDays[activeNotesCell.dayIndex], 'EEE, MMM d')}</div>
                                                <Textarea
                                                    placeholder="Add note..."
                                                    rows={3}
                                                    value={row.dailyEntries[activeNotesCell.dayIndex].notes}
                                                    onChange={(e) => handleNotesChange(rowIndex, activeNotesCell.dayIndex, e.target.value)}
                                                    disabled={row.dailyEntries[activeNotesCell.dayIndex].isLocked}
                                                    className={row.dailyEntries[activeNotesCell.dayIndex].isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                                                />
                                            </td>
                                            <td colSpan="6"></td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 font-bold">
                            <td colSpan="2" className="p-2 text-right">Total</td>
                            {weekDays.map((_, dayIndex) => (
                                <td key={dayIndex} className="p-2 text-center">{calculateDayTotal(dayIndex)}</td>
                            ))}
                            <td className="p-2 text-right text-lg">
                                {gridRows.reduce((sum, row) => sum + parseFloat(calculateRowTotal(row.dailyEntries)), 0).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
});

export default WeeklyTimesheetGrid;
