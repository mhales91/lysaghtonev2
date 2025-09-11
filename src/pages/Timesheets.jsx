
import React, { useState, useEffect, useRef } from "react";
import { TimeEntry, Project, Task, User, Client } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Save, ChevronsUpDown } from "lucide-react";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useUser } from '@/contexts/UserContext';

import WeeklyTimesheetGrid from "../components/timesheets/WeeklyTimesheetGrid";

export default function Timesheets() {
  const { currentUser } = useUser();
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Add saving state to prevent race conditions

  useEffect(() => {
    loadData();
  }, [selectedWeek, currentUser]);

  const loadData = async () => {
    if (!currentUser) {
      console.log('No user in context yet, waiting...');
      return;
    }

    setIsLoading(true);
    try {
      const user = currentUser;

      const weekStart = format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [entriesData, projectsData, tasksData, clientsData] = await Promise.all([
        TimeEntry.filter({
            date: { $gte: weekStart, $lte: weekEnd }
        }),
        Project.list(),
        Task.list(),
        Client.list()
      ]);
      
      setTimeEntries(entriesData || []);
      setProjects(projectsData || []);
      setTasks(tasksData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading timesheet data:', error);
    }
    setIsLoading(false);
  };

  const handleSaveTimesheet = async (gridRows) => {
    if (isSaving) {
      console.log("Save already in progress, skipping.");
      return;
    }
    setIsSaving(true);
    console.log("Saving timesheet with rows:", gridRows);
    let changedCount = 0;
    
    try {
      for (const row of gridRows) {
          for (const cell of row.dailyEntries) {
              if (!cell.isDirty) continue;

              const hours = parseTimeToHours(cell.hours);
              const minutes = Math.round(hours * 60);

              try {
                  if (cell.id && minutes === 0) {
                      // Delete existing entry if hours are zeroed out
                      await TimeEntry.delete(cell.id);
                      changedCount++;
                  } else if (cell.id) {
                      // Update existing entry with proper billable calculation
                      await TimeEntry.update(cell.id, {
                          minutes: minutes,
                          description: cell.notes,
                          billable_amount: minutes > 0 ? (minutes / 60) * (cell.billable_rate_effective || 180) : 0,
                          cost_amount: minutes > 0 ? (minutes / 60) * (cell.base_rate_at_entry || 160) : 0
                      });
                      changedCount++;
                  } else if (minutes > 0) {
                      // Create new entry with proper rates and calculations
                      const baseRate = 160; // Default cost rate
                      const billableRate = 180; // Default billable rate
                      
                      const taskForEntry = tasks.find(t => t.id === row.task.id);
                      const isBillable = taskForEntry ? taskForEntry.is_billable : true;
                      
                      await TimeEntry.create({
                          user_email: currentUser.email,
                          project_id: row.project.id,
                          task_id: row.task.id,
                          date: cell.date,
                          minutes: minutes,
                          description: cell.notes,
                          billable: isBillable,
                          status: 'approved',
                          base_rate_at_entry: baseRate,
                          billable_rate_effective: billableRate,
                          cost_amount: (minutes / 60) * baseRate,
                          billable_amount: isBillable ? (minutes / 60) * billableRate : 0,
                          entry_source: 'manual'
                      });
                      changedCount++;
                  }
              } catch (error) {
                  console.error("Error saving entry:", error);
                  // Stop the process on error to avoid further issues
                  throw error;
              }
          }
      }
      
      if (changedCount > 0) {
          console.log(`Auto-saved ${changedCount} changes`);
          await loadData(); // Await data reload to ensure state is fresh
      }
    } catch(err) {
        console.error("Failed to save timesheet.", err);
    } finally {
        setIsSaving(false); // Release the lock
    }
  };
  
  const parseTimeToHours = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (value.includes(':')) {
        const [h, m] = value.split(':').map(Number);
        return (h || 0) + ((m || 0) / 60);
    }
    return parseFloat(value) || 0;
  };

  // This ref is needed to pass to the child grid to get its current state
  const gridRef = React.useRef();

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
                <span>Timesheets</span>
                <span className="mx-2">&gt;</span>
                <span className="font-semibold text-gray-700">{currentUser?.full_name || '...'}</span>
                 <span className="mx-2">&gt;</span>
                <span className="font-semibold text-purple-600">Enter Weekly Timesheet</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Enter Weekly Timesheet</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                style={{ backgroundColor: '#16a34a', color: 'white' }} 
                className="hover:bg-green-700"
                onClick={() => gridRef.current?.save()}
                disabled={isSaving || isLoading} // Disable save button during saving or loading
            >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <WeeklyTimesheetGrid
            ref={gridRef}
            currentUser={currentUser}
            timeEntries={timeEntries}
            projects={projects}
            tasks={tasks}
            clients={clients}
            isLoading={isLoading}
            onSave={handleSaveTimesheet}
            onSubmit={() => {}} // onSubmit is no longer used
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
        />
      </div>
    </div>
  );
}
