
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  User
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export default function TimesheetGrid({ 
  timeEntries, 
  projects, 
  tasks, 
  isLoading, 
  viewMode = 'list',
  selectedWeek,
  onWeekChange,
  onEdit, 
  onDelete,
  currentUser 
}) {
  const getProjectName = (projectId) => {
    const project = (projects || []).find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getTaskName = (taskId) => {
    const task = (tasks || []).find(t => t.id === taskId);
    return task?.task_name || 'General';
  };

  const getStatusColor = (status) => {
    // Modified: Removed 'approved' and 'rejected' statuses. 'submitted' now indicates "pushed to WIP".
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-green-100 text-green-800' // 'submitted' is now green, indicating it's ready/processed.
    };
    return colors[status] || colors['draft'];
  };

  const getTotalHours = () => {
    return timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  };

  const getTotalValue = () => {
    return timeEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
  };

  if (viewMode === 'weekly') {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const getEntriesForDay = (day) => {
      return timeEntries.filter(entry => isSameDay(new Date(entry.date), day));
    };

    return (
      <div className="space-y-6">
        {/* Week Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Week of {format(weekStart, 'MMM d, yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWeekChange(new Date(selectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWeekChange(new Date())}
                >
                  This Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWeekChange(new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Weekly Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dayEntries = getEntriesForDay(day);
            const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.hours, 0);
            
            return (
              <Card key={day.toString()} className="min-h-48">
                <CardHeader className="pb-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      {format(day, 'EEE')}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {format(day, 'd')}
                    </p>
                    {dayTotal > 0 && (
                      <Badge variant="outline" className="mt-1">
                        {dayTotal}h
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {dayEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="p-2 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100"
                        onClick={() => onEdit(entry)}
                      >
                        <p className="font-medium truncate">
                          {getProjectName(entry.project_id)}
                        </p>
                        <p className="text-gray-600">
                          {entry.hours}h - {getTaskName(entry.task_id)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Week Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalHours()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billable Hours</p>
                <p className="text-2xl font-bold text-green-600">
                  {timeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Non-Billable</p>
                <p className="text-2xl font-bold text-red-600">
                  {timeEntries.filter(e => !e.billable).reduce((sum, e) => sum + e.hours, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${getTotalValue().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Summary Cards - Updated: Approved Hours replaced with Billable Hours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold">{getTotalHours()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Billable Hours</p>
                <p className="text-2xl font-bold">
                  {/* Calculation for billable hours */}
                  {timeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${getTotalValue().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : timeEntries.length > 0 ? (
            <div className="space-y-3">
              {timeEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {getProjectName(entry.project_id)}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{getTaskName(entry.task_id)}</span>
                        <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                        <span>{entry.hours} hours</span>
                        {entry.billable ? (
                          <Badge className="bg-green-100 text-green-800">Billable</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Non-billable</Badge>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-sm text-gray-600 mt-1 truncate max-w-md">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(entry.total_cost || 0).toLocaleString()}
                      </p>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entry)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {/* Delete button condition updated: only 'draft' entries can be deleted */}
                      {entry.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Time Entries</h3>
              <p className="text-gray-600">Start tracking your time by adding your first entry.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
