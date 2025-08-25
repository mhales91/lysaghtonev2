import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, FileText, Clock, Target, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsGrid({ stats, isLoading }) {
  const statCards = [
    {
      title: "Active Projects",
      value: stats.activeProjects || 0,
      icon: FileText,
      color: "bg-blue-500",
      description: "Currently in progress"
    },
    {
      title: "Budget Utilization",
      value: `${stats.utilizationRate || 0}%`,
      icon: Target,
      color: "bg-purple-500",
      description: "Actual vs budgeted"
    },
    {
      title: "Monthly Revenue",
      value: `$${(stats.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      description: "This month's earnings"
    },
    {
      title: "Pending Invoices",
      value: stats.pendingInvoices || 0,
      icon: Clock,
      color: "bg-orange-500",
      description: "Awaiting payment"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden bg-white shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
          <div className={`absolute top-0 right-0 w-20 h-20 ${stat.color} rounded-full opacity-10 transform translate-x-6 -translate-y-6`} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              )}
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}