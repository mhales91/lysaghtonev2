
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2 } from "lucide-react";

const columns = [
  { id: 'not_started', title: 'Not Started' },
  { id: 'active', title: 'Active' }, // Changed from 'in_progress' to match status
  { id: 'on_hold', title: 'On Hold' },
  { id: 'completed', title: 'Completed' }
  // Note: Archived projects are not shown in Kanban view
];

export default function ProjectKanban({ projects, clients, onStatusChange }) {
  const [boardData, setBoardData] = useState({});

  useEffect(() => {
    const newBoardData = columns.reduce((acc, col) => {
      acc[col.id] = projects.filter(p => p.status === col.id);
      return acc;
    }, {});
    setBoardData(newBoardData);
  }, [projects]);
  
  const getClientName = (clientId) => clients.find(c => c.id === clientId)?.company_name || 'N/A';

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId !== destination.droppableId) {
      onStatusChange(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-gray-100 p-4 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-purple-100' : ''}`}
              >
                <h3 className="font-semibold mb-4 text-center">{column.title} ({boardData[column.id]?.length || 0})</h3>
                <div className="space-y-4">
                  {(boardData[column.id] || []).map((project, index) => (
                    <Draggable key={project.id} draggableId={project.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Card className="bg-white">
                            <CardContent className="p-3">
                              <p className="font-semibold text-sm mb-2">{project.project_name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                <Building2 className="w-3 h-3"/>
                                <span>{getClientName(project.client_id)}</span>
                              </div>
                              <Progress value={project.progress_percentage} className="h-2"/>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
