
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function TimesheetApprovals({ timeEntries, projects, tasks, isLoading, onApprove }) {
  const getProjectName = (projectId) => {
    const project = (projects || []).find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getTaskName = (taskId) => {
    const task = (tasks || []).find(t => t.id === taskId);
    return task?.task_name || 'General';
  };

  const pendingEntries = timeEntries.filter(entry => entry.status === 'submitted');
  const totalPendingHours = pendingEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const totalPendingValue = pendingEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold">{pendingEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Hours</p>
                <p className="text-2xl font-bold">{totalPendingHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Value</p>
                <p className="text-2xl font-bold">${totalPendingValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Time Entry Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingEntries.length > 0 ? (
            <div className="space-y-4">
              {pendingEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {getProjectName(entry.project_id)}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {entry.hours} hours
                        </span>
                        <span>{getTaskName(entry.task_id)}</span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-gray-600 mt-1 max-w-md">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(entry.total_cost || 0).toLocaleString()}
                      </p>
                      <Badge className="bg-orange-100 text-orange-800">
                        Pending Approval
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onApprove(entry.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
              <p className="text-gray-600">All time entries have been processed.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
