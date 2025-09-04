import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Clock } from "lucide-react";

export default function RunningTimer({ currentUser, onSaveTimer, projects, tasks }) {
    const [activeTimer, setActiveTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval;
        if (isRunning && activeTimer) {
            interval = setInterval(() => {
                const now = new Date().getTime();
                const start = new Date(activeTimer.start_time).getTime();
                setElapsedTime(Math.floor((now - start) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, activeTimer]);

    useEffect(() => {
        // Load any existing active timer on component mount
        loadActiveTimer();
    }, []);

    const loadActiveTimer = async () => {
        // This would check for any running timers for the current user
        // Implementation depends on your backend
    };

    const startTimer = async (projectId, taskId, description = '') => {
        const timerData = {
            user_email: currentUser.email,
            project_id: projectId,
            task_id: taskId,
            description,
            start_time: new Date().toISOString(),
            is_running: true
        };

        setActiveTimer(timerData);
        setIsRunning(true);
        setElapsedTime(0);
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const resumeTimer = () => {
        setIsRunning(true);
    };

    const stopTimer = async () => {
        if (!activeTimer) return;

        const endTime = new Date().toISOString();
        const totalMinutes = Math.floor(elapsedTime / 60);

        const timeEntry = {
            ...activeTimer,
            end_time: endTime,
            minutes: totalMinutes,
            is_running: false
        };

        await onSaveTimer(timeEntry);
        
        setActiveTimer(null);
        setIsRunning(false);
        setElapsedTime(0);
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project?.name || 'Unknown Project';
    };

    const getTaskName = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        return task?.task_name || 'General';
    };

    if (!activeTimer) {
        return null;
    }

    return (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                {getProjectName(activeTimer.project_id)}
                            </h4>
                            <p className="text-sm text-gray-600">
                                {getTaskName(activeTimer.task_id)}
                            </p>
                            {activeTimer.description && (
                                <p className="text-xs text-gray-500">{activeTimer.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-mono font-bold text-purple-600">
                                {formatTime(elapsedTime)}
                            </div>
                            <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
                                {isRunning ? "Running" : "Paused"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            {isRunning ? (
                                <Button variant="outline" size="sm" onClick={pauseTimer}>
                                    <Pause className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={resumeTimer}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={stopTimer} className="text-red-600">
                                <Square className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}