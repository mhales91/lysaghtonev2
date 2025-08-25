import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  MoreHorizontal,
  DollarSign,
  CalendarClock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { isPast, format } from 'date-fns';

const stages = [
  { key: 'lead', title: 'Leads' },
  { key: 'qualified', title: 'Qualified' },
  { key: 'proposal_sent', title: 'Proposal Sent' },
  { key: 'negotiation', title: 'Negotiation' },
  { key: 'won', title: 'Won' },
  { key: 'lost', title: 'Lost' }
];

export default function PipelineBoard({ 
  clients, 
  users,
  isLoading, 
  onEditClient, 
  onStageChange, 
  onGenerateTOE,
  onDelete
}) {
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId)) {
      return;
    }
    onStageChange(draggableId, destination.droppableId);
  };
  
  const getUserName = (email) => {
    return users.find(u => u.email === email)?.full_name || email || 'Unassigned';
  };

  const getClientsByStage = (stage) => {
    return clients.filter(client => client.crm_stage === stage);
  };

  const moveToNextStage = (client) => {
    const currentIndex = stages.findIndex(s => s.key === client.crm_stage);
    if (currentIndex < stages.length - 1 && stages[currentIndex + 1].key !== 'lost') {
      onStageChange(client.id, stages[currentIndex + 1].key);
    }
  };

  const ClientCard = ({ client, index }) => (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card className={`mb-4 hover:shadow-lg transition-shadow cursor-pointer bg-white ${snapshot.isDragging ? 'shadow-xl' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {client.company_name}
                  </h4>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditClient(client)}>
                      Edit Client
                    </DropdownMenuItem>
                    {client.crm_stage === 'qualified' && (
                      <DropdownMenuItem onClick={() => onGenerateTOE(client)}>
                        Generate TOE
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => moveToNextStage(client)}>
                      Move to Next Stage
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(client.id)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      Delete Client
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onStageChange(client.id, 'lost')}
                      className="text-orange-600 focus:bg-orange-50 focus:text-orange-700"
                    >
                      Mark as Lost
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span className="truncate">{getUserName(client.lead_pm)}</span>
                </div>
                {client.scope_summary && (
                  <p className="text-xs text-gray-500 italic truncate">
                    "{client.scope_summary}"
                  </p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <DollarSign className="w-3 h-3" />
                  <span>${(client.estimated_value || 0).toLocaleString()}</span>
                  {client.probability && (
                    <Badge variant="outline" className="text-xs">
                      {client.probability}%
                    </Badge>
                  )}
                </div>
                {client.response_due && (
                  <div className={`flex items-center gap-2 ${isPast(new Date(client.response_due)) ? 'text-red-600' : ''}`}>
                    <CalendarClock className="w-3 h-3" />
                    <span>Due {format(new Date(client.response_due), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 h-full">
        {stages.map(stage => {
          const stageClients = clients.filter(client => client.crm_stage === stage.key);
          
          return (
            <div key={stage.key} className="w-72 min-w-72 flex flex-col">
              <Card className="bg-gray-100 border-0 mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-800 flex items-center justify-between">
                    {stage.title}
                    <Badge variant="secondary" className="bg-white text-gray-700">
                      {stageClients.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className={`flex-grow p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-purple-50' : ''}`}
                  >
                    {isLoading ? (
                      Array(2).fill(0).map((_, i) => (
                        <Card key={i} className="p-4">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2 mb-1" />
                          <Skeleton className="h-3 w-2/3" />
                        </Card>
                      ))
                    ) : (
                      stageClients.map((client, index) => (
                        <ClientCard key={client.id} client={client} index={index} />
                      ))
                    )}
                    {provided.placeholder}
                    
                    {!isLoading && stageClients.length === 0 && (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                        <p className="text-sm">Drop clients here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}