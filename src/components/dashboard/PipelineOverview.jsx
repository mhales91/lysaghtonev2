
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PipelineOverview({ data, isLoading }) {
  const stageColors = {
    'lead': 'bg-gray-200',
    'qualified': 'bg-blue-200',
    'proposal_sent': 'bg-yellow-200',
    'negotiation': 'bg-orange-200',
    'won': 'bg-green-200',
    'lost': 'bg-red-200'
  };

  const formatStage = (stage) => {
    return stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const totalLeads = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          CRM Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-3">
            {data.map(item => (
              <Link to={createPageUrl(`CRM?stage=${item.stage}`)} key={item.stage} className="block hover:bg-gray-50 rounded-lg p-2 -m-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${stageColors[item.stage] || 'bg-gray-200'}`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {formatStage(item.stage)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {item.count}
                    </span>
                    {totalLeads > 0 && (
                      <span className="text-xs text-gray-500">
                        ({((item.count / totalLeads) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            <div className="pt-3 border-t mt-4">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-sm text-gray-700">Total Leads</span>
                <span className="text-sm text-gray-900">{totalLeads}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pipeline data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
