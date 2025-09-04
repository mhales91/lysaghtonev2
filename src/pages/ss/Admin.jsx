import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Cog, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const adminPages = [
  {
    title: 'Task Templates',
    description: 'Manage the default task library for projects.',
    icon: List,
    url: createPageUrl('TaskTemplates')
  },
  {
    title: 'Company Settings',
    description: 'Edit global settings like job number seeds and charge-out rates.',
    icon: Cog,
    url: createPageUrl('AdminSettings')
  },
   {
    title: 'User Management',
    description: 'Manage users and their roles.',
    icon: Briefcase,
    url: createPageUrl('UserManagement')
  }
];

export default function AdminPage() {
  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">
            Manage global settings and libraries for the Lysaght One platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminPages.map((page) => (
            <Link to={page.url} key={page.title}>
              <Card className="hover:shadow-lg hover:border-purple-500 transition-all duration-200 h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <page.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>{page.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{page.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}