import React, { useState, useEffect } from 'react';
import { DashboardSettings, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const WIDGET_DEFINITIONS = {
  weeklyTimesheetHours: {
    name: 'Weekly Timesheet Hours',
    description: 'Segmented bar chart showing billable vs non-billable hours',
    layer: 'Time Layer',
    required: false
  },
  yearlyBillableTracker: {
    name: 'Yearly Billable Tracker',
    description: 'Monthly percentage tracking for billable and realised time',
    layer: 'Time Layer',
    required: false
  },
  workload: {
    name: 'Workload',
    description: 'Horizontal progress bars showing workload distribution',
    layer: 'Time Layer',
    required: false
  },
  crmBoard: {
    name: 'CRM Board',
    description: 'Stage progression tracker for CRM pipeline',
    layer: 'Leads Layer',
    required: false
  },
  toeBoard: {
    name: 'TOE Board',
    description: 'Stage progression tracker for TOE documents',
    layer: 'Leads Layer',
    required: false
  },
  slaTracker: {
    name: 'SLA Tracker',
    description: 'Horizontal duration bars showing time in stage vs SLA',
    layer: 'Leads Layer',
    required: false
  },
  projectPortfolio: {
    name: 'Project Portfolio',
    description: 'Table with embedded progress bars for project status',
    layer: 'Projects Layer',
    required: false
  },
  upcomingProjects: {
    name: 'Upcoming Projects',
    description: 'Table view of upcoming project allocations',
    layer: 'Projects Layer',
    required: false
  },
  budget: {
    name: 'Budget',
    description: 'Linear progress bars for budget utilization',
    layer: 'Projects Layer',
    required: false
  }
};

const ROLES = ['Staff', 'Manager', 'DeptLead', 'Director', 'Admin'];
const ROLE_HIERARCHY = {
  'Staff': 0,
  'Manager': 1,
  'DeptLead': 1,
  'Director': 2,
  'Admin': 2
};

export default function DashboardSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changes, setChanges] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [user, settingsList] = await Promise.all([
        User.me(),
        DashboardSettings.list()
      ]);
      
      setCurrentUser(user);
      
      if (settingsList.length > 0) {
        setSettings(settingsList[0]);
      } else {
        // Create default settings
        const defaultSettings = await DashboardSettings.create({
          widget_permissions: {}
        });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading dashboard settings:', error);
      toast.error('Failed to load dashboard settings');
    }
    setIsLoading(false);
  };

  const isWidgetEnabled = (role, widgetKey) => {
    if (!settings?.widget_permissions?.[role]) return true;
    return settings.widget_permissions[role][widgetKey] !== false;
  };

  const isInherited = (role, widgetKey) => {
    if (!settings?.widget_permissions?.[role]) return true;
    return settings.widget_permissions[role][widgetKey] === undefined;
  };

  const getInheritedValue = (role, widgetKey) => {
    const hierarchy = ROLE_HIERARCHY[role];
    if (hierarchy === 0) return true; // Staff inherits default true
    
    // Find parent role
    const parentRole = ROLES.find(r => ROLE_HIERARCHY[r] === hierarchy - 1);
    if (!parentRole) return true;
    
    return isWidgetEnabled(parentRole, widgetKey);
  };

  const handleWidgetToggle = (role, widgetKey, enabled) => {
    const newChanges = { ...changes };
    
    if (!newChanges[role]) newChanges[role] = {};
    newChanges[role][widgetKey] = enabled;
    
    setChanges(newChanges);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const newPermissions = { ...settings.widget_permissions };
      
      // Apply changes
      Object.keys(changes).forEach(role => {
        if (!newPermissions[role]) newPermissions[role] = {};
        Object.keys(changes[role]).forEach(widget => {
          newPermissions[role][widget] = changes[role][widget];
        });
      });

      await DashboardSettings.update(settings.id, {
        widget_permissions: newPermissions
      });

      setSettings(prev => ({
        ...prev,
        widget_permissions: newPermissions
      }));
      
      setChanges({});
      toast.success('Dashboard settings saved successfully');
    } catch (error) {
      console.error('Error saving dashboard settings:', error);
      toast.error('Failed to save dashboard settings');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Settings</h1>
            <p className="text-gray-600">Configure which widgets are visible for each user role.</p>
          </div>
          
          {hasChanges && (
            <Button 
              onClick={saveChanges} 
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Widget Permissions by Role</CardTitle>
            <p className="text-sm text-gray-600">
              Roles inherit permissions from roles below them unless explicitly overridden.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Widget</th>
                    <th className="text-left py-3 px-4">Layer</th>
                    {ROLES.map(role => (
                      <th key={role} className="text-center py-3 px-4 min-w-24">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(WIDGET_DEFINITIONS).map(([widgetKey, widget]) => (
                    <tr key={widgetKey} className="border-b">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium">{widget.name}</div>
                          <div className="text-sm text-gray-500">{widget.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{widget.layer}</Badge>
                      </td>
                      {ROLES.map(role => {
                        const currentValue = changes[role]?.[widgetKey] !== undefined ? 
                          changes[role][widgetKey] : isWidgetEnabled(role, widgetKey);
                        const inherited = isInherited(role, widgetKey) && !changes[role]?.[widgetKey];
                        
                        return (
                          <td key={role} className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Checkbox
                                checked={currentValue}
                                onCheckedChange={(checked) => handleWidgetToggle(role, widgetKey, checked)}
                                disabled={widget.required}
                              />
                              {inherited && (
                                <Badge variant="secondary" className="text-xs">
                                  Inherited
                                </Badge>
                              )}
                              {changes[role]?.[widgetKey] !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  Override
                                </Badge>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Inheritance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                • <strong>Staff</strong>: Base level - all widgets enabled by default
              </p>
              <p className="text-sm text-gray-600">
                • <strong>Manager/DeptLead</strong>: Inherits from Staff + additional manager widgets
              </p>
              <p className="text-sm text-gray-600">
                • <strong>Director/Admin</strong>: Inherits from Manager + director-level widgets
              </p>
              <p className="text-sm text-gray-600 mt-4">
                You can override inherited permissions by explicitly enabling/disabling widgets for specific roles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}