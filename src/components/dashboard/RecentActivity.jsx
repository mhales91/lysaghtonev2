import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, DollarSign, FileText, Clock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentActivity({ activities, isLoading }) {
  const getActivityIcon = (type) => {
    const icons = {
      'project': FileText,
      'timeEntry': Clock,
      'invoice': CreditCard
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getActivityColor = (type) => {
    const colors = {
      'project': 'text-blue-600',
      'timeEntry': 'text-green-600', 
      'invoice': 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (activities && activities.length > 0) ? (
          <div className="space-y-3">
            {activities.map(activity => (
              <Link to={activity.link} key={`${activity.type}-${activity.id}`}>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {activity.type}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}