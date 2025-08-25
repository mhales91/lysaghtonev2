
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BudgetAlerts({ alerts, isLoading }) {
  const getAlertLevel = (utilization) => {
    if (utilization >= 90) return { color: 'bg-red-100 text-red-800', level: 'Critical' };
    if (utilization >= 75) return { color: 'bg-yellow-100 text-yellow-800', level: 'Warning' };
    return { color: 'bg-green-100 text-green-800', level: 'Normal' };
  };

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Budget Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map(project => {
              const utilization = project.budget_fees > 0 ? ((project.actual_fees || 0) / project.budget_fees * 100) : 0;
              const alert = getAlertLevel(utilization);
              
              return (
                <Link to={createPageUrl(`Projects?id=${project.id}`)} key={project.id}>
                  <div className="p-3 border-l-4 border-orange-400 bg-orange-50 rounded hover:bg-orange-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{project.project_name}</h4>
                      <Badge className={alert.color}>
                        {alert.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-3 h-3" />
                      <span>
                        ${(project.actual_fees || 0).toLocaleString()} / ${(project.budget_fees || 0).toLocaleString()}
                        ({utilization.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No budget alerts</p>
            <p className="text-xs">All projects within budget</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
