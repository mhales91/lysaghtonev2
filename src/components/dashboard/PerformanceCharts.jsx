import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function PerformanceCharts({ isLoading }) {
  // Mock data for demonstration
  const monthlyData = [
    { month: 'Jan', revenue: 45000, projects: 8 },
    { month: 'Feb', revenue: 52000, projects: 10 },
    { month: 'Mar', revenue: 48000, projects: 9 },
    { month: 'Apr', revenue: 61000, projects: 12 },
    { month: 'May', revenue: 55000, projects: 11 },
    { month: 'Jun', revenue: 67000, projects: 14 }
  ];

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Monthly Revenue</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="#5E0F68" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Project Count Chart */}          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Active Projects</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [value, 'Projects']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="projects" 
                  stroke="#5E0F68" 
                  strokeWidth={3}
                  dot={{ fill: '#5E0F68', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}