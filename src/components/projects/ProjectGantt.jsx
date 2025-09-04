import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function ProjectGantt({ projects, isLoading }) {
  if (isLoading) return <div>Loading...</div>;

  const validProjects = projects.filter(p => p.start_date && p.end_date);
  if (validProjects.length === 0) {
    return <Card><CardContent className="p-6 text-center text-gray-500">No projects with defined start and end dates to display in Gantt chart.</CardContent></Card>;
  }

  const projectDates = validProjects.flatMap(p => [new Date(p.start_date), new Date(p.end_date)]);
  const minDate = new Date(Math.min.apply(null, projectDates));
  const maxDate = new Date(Math.max.apply(null, projectDates));

  const startDate = startOfMonth(minDate);
  const endDate = endOfMonth(maxDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  const months = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    months.push({
      name: format(currentDate, 'MMM yyyy'),
      days: differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return (
    <Card>
      <CardContent className="p-4 overflow-x-auto">
        <div style={{ width: `${totalDays * 20}px`, minWidth: '100%' }}>
          {/* Header */}
          <div className="flex sticky top-0 bg-white z-10">
            {months.map((month, i) => (
              <div key={i} className="text-center font-semibold border-b border-r p-2" style={{ width: `${month.days * 20}px` }}>
                {month.name}
              </div>
            ))}
          </div>
          {/* Projects */}
          <div className="space-y-2 mt-2">
            {validProjects.map(project => {
              const projStart = new Date(project.start_date);
              const projEnd = new Date(project.end_date);
              const offset = differenceInDays(projStart, startDate);
              const duration = differenceInDays(projEnd, projStart) + 1;
              const progressWidth = (duration * 20) * (project.progress_percentage / 100);

              return (
                <div key={project.id} className="h-10 flex items-center relative text-xs">
                  <div className="w-48 absolute left-0 bg-white pr-2 truncate font-medium">
                    {project.name}
                  </div>
                  <div
                    className="h-6 bg-purple-200 rounded absolute"
                    style={{ left: `${192 + offset * 20}px`, width: `${duration * 20}px` }}
                  >
                    <div 
                      className="h-full bg-purple-600 rounded" 
                      style={{ width: `${progressWidth}px` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}