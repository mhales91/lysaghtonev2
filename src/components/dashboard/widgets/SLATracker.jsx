
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { differenceInBusinessDays } from 'date-fns';

const SLA_TARGETS = {
  // CRM stages
  lead: 5,
  qualified: 10,
  proposal_sent: 10,
  negotiation: 15,
  // TOE stages
  draft: 3,
  internal_review: 2,
  ready_to_send: 1,
  sent: 14,
};

const StaffInitials = ({ user }) => (
  <div className="w-8 h-6 bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center rounded-sm">
    {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
  </div>
);

export default function SLATracker({ clients, toes, users, viewLevel, currentUser, departments, isLoading }) {
  const [currentDepartmentIndex, setCurrentDepartmentIndex] = useState(0);

  const slaData = useMemo(() => {
    if (!clients || !toes) return [];

    const items = [
      ...clients.filter(c => c.crm_stage !== 'won' && c.crm_stage !== 'lost').map(c => ({
        ...c,
        type: 'CRM',
        stage: c.crm_stage,
        name: c.name,
        assignee: c.lead_pm
      })),
      ...toes.filter(t => t.status !== 'signed').map(t => ({
        ...t,
        type: 'TOE',
        stage: t.status,
        name: t.project_title,
        assignee: t.created_by
      }))
    ];

    return items.map(item => {
      const daysInStage = item.moved_at ? 
        differenceInBusinessDays(new Date(), new Date(item.moved_at)) : 0;
      const slaTarget = SLA_TARGETS[item.stage] || 7;
      const slaPercentage = (daysInStage / slaTarget) * 100;
      
      return {
        ...item,
        daysInStage,
        slaTarget,
        slaPercentage: Math.min(100, slaPercentage),
        user: users.find(u => u.email === item.assignee)
      };
    });
  }, [clients, toes, users]);

  if (isLoading) {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">SLA Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const getSLAColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage > 75) return 'bg-amber-500';
    return 'bg-green-600';
  };

  // For Director view with department toggle
  if (viewLevel === 'director') {
    const currentDept = departments[currentDepartmentIndex];
    
    const deptUsers = users.filter(u => u.department === currentDept);
    const deptItems = slaData.filter(item => 
      deptUsers.some(user => user.email === item.assignee)
    );

    const withinSLA = deptItems.filter(item => item.slaPercentage < 100).length;
    const totalItems = deptItems.length;
    const withinSLAPercentage = totalItems > 0 ? (withinSLA / totalItems * 100) : 100;

    return (
      <Card className="h-full rounded-xl shadow-sm director-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">SLA Tracker - {currentDept || 'All Departments'}</CardTitle>
          {departments.length > 1 && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentDepartmentIndex(Math.max(0, currentDepartmentIndex - 1))}
                disabled={currentDepartmentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setCurrentDepartmentIndex(Math.min(departments.length - 1, currentDepartmentIndex + 1))}
                disabled={currentDepartmentIndex === departments.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white rounded-lg border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{withinSLAPercentage.toFixed(0)}%</div>
              <div className="text-xs text-gray-600">Within SLA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{(100 - withinSLAPercentage).toFixed(0)}%</div>
              <div className="text-xs text-gray-600">Breached SLA</div>
            </div>
          </div>

          <ScrollArea className="h-[210px] pr-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold">Project</TableHead>
                  <TableHead className="text-xs font-semibold">Staff</TableHead>
                  <TableHead className="text-xs font-semibold">SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptItems.map(item => (
                  <TableRow key={`${item.type}-${item.id}`} className="text-xs">
                    <TableCell className="font-medium truncate max-w-24">{item.name}</TableCell>
                    <TableCell>
                      <StaffInitials user={item.user} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={item.slaPercentage} 
                          className="h-2 w-16"
                          indicatorClassName={getSLAColor(item.slaPercentage)}
                        />
                        <span className="text-gray-500">{item.daysInStage}/{item.slaTarget}d</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">SLA Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Project</TableHead>
                {viewLevel !== 'staff' && <TableHead className="text-xs font-semibold">Staff</TableHead>}
                <TableHead className="text-xs font-semibold">SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaData.length > 0 ? slaData.map(item => (
                <TableRow key={`${item.type}-${item.id}`} className="text-xs">
                  <TableCell className="font-medium truncate max-w-32">{item.name}</TableCell>
                  {viewLevel !== 'staff' && (
                    <TableCell>
                      <StaffInitials user={item.user} />
                    </TableCell>
                  )}
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <Progress 
                          value={item.slaPercentage} 
                          className="h-2 w-16"
                          indicatorClassName={getSLAColor(item.slaPercentage)}
                        />
                        <span className="text-gray-500">{item.daysInStage}/{item.slaTarget}d</span>
                      </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={viewLevel === 'staff' ? 2 : 3} className="text-center text-gray-500 py-8 text-sm">
                    No items to track.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
