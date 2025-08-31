import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";

export default function ProjectDetailOverview({ project, client, projectManager }) {

  const getStatusBadge = (status) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-800',
      'active': 'bg-blue-100 text-blue-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return <Badge className={`${colors[status] || 'bg-gray-200'} capitalize`}>{status?.replace(/_/g, ' ')}</Badge>;
  };
  
  const InfoField = ({ label, value, children }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-base font-medium">{children || value || 'N/A'}</p>
    </div>
  );

  const budgetUtilisation = project.budget_fees && project.actual_fees ? (project.actual_fees / project.budget_fees) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
            <InfoField label="Client">{client?.company_name}</InfoField>
            <InfoField label="Project Manager">{projectManager?.full_name}</InfoField>
            <InfoField label="Status">{getStatusBadge(project.status)}</InfoField>

            <InfoField label="Start Date">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</InfoField>
            <InfoField label="End Date">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</InfoField>
            <InfoField label="Billing Model" >
                <span className="capitalize">{project.billing_model?.replace(/_/g, ' ')}</span>
            </InfoField>

            <div className="md:col-span-3">
              <p className="text-sm text-gray-500 mb-2">Budget Utilisation</p>
              <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">${project.actual_fees?.toLocaleString() || '0'} / ${project.budget_fees?.toLocaleString() || '0'}</span>
                  <Progress value={budgetUtilisation} className="flex-1" />
                  <span>{budgetUtilisation.toFixed(1)}%</span>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}