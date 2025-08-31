
import React, { useState, useEffect } from 'react';
import { AnalyticsSetting, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getNZFinancialYear } from '@/components/utils/dateUtils';
import { PageLoadingSkeleton } from '@/components/ui/loading-states';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"];

export default function AnalyticsSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(getNZFinancialYear().startDate.getFullYear());
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Load static data (departments) once on mount
  useEffect(() => {
    const loadInitialDepartmentsData = async () => {
      try {
        const users = await User.list();
        const uniqueDepts = [...new Set(users.map(u => u.department).filter(Boolean))];
        setDepartments(uniqueDepts);
        if (uniqueDepts.length > 0) {
          setSelectedDepartment(uniqueDepts[0]);
        }
      } catch (e) {
        toast.error('Failed to load initial department data.');
        console.error(e);
      }
      // Note: setIsLoading is handled in the next effect
    };
    loadInitialDepartmentsData();
  }, []); // Empty dependency array means this runs once on mount
  
  // Load settings whenever the year or the list of departments changes
  useEffect(() => {
    // Only proceed if departments have been loaded
    if (departments.length === 0) {
      return; 
    }

    const loadSettings = async () => {
      setIsLoading(true); // Start loading state for settings
      try {
        let settingsList = await AnalyticsSetting.filter({ year: selectedYear });
        let currentSettings;

        if (settingsList.length > 0) {
          currentSettings = settingsList[0];
        } else {
          const newSettings = { year: selectedYear, department_budgets: {} };
          currentSettings = await AnalyticsSetting.create(newSettings);
        }
        
        // Ensure all departments exist in the settings object
        let budgets = currentSettings.department_budgets || {};
        let needsUpdate = false;
        departments.forEach(dept => {
          if (!budgets[dept]) {
            budgets[dept] = MONTHS.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          // If departments were added to budgets, update the settings object in the backend
          currentSettings = await AnalyticsSetting.update(currentSettings.id, { department_budgets: budgets });
        }

        setSettings(currentSettings);

      } catch (e) {
        toast.error('Failed to load settings.');
        console.error(e);
      } finally {
        setIsLoading(false); // End loading state regardless of success or failure
      }
    };

    loadSettings();
  }, [selectedYear, departments]); // Re-run when selectedYear or departments change
  
  const handleBudgetChange = (month, value) => {
    setSettings(prev => {
      const newBudgets = { ...prev.department_budgets };
      if (!newBudgets[selectedDepartment]) {
        newBudgets[selectedDepartment] = {};
      }
      newBudgets[selectedDepartment][month] = parseFloat(value) || 0;
      return { ...prev, department_budgets: newBudgets };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await AnalyticsSetting.update(settings.id, { department_budgets: settings.department_budgets });
      toast.success(`${selectedDepartment} budget targets saved successfully!`);
    } catch (e) {
      console.error('Failed to save settings:', e);
      toast.error('Failed to save settings.');
    }
  };

  const totalBudget = settings?.department_budgets?.[selectedDepartment] 
    ? Object.values(settings.department_budgets[selectedDepartment]).reduce((sum, val) => sum + (val || 0), 0) 
    : 0;

  // Render loading skeleton if still loading or if selectedDepartment hasn't been set yet (which means departments aren't loaded)
  if (isLoading || !selectedDepartment) {
    return <PageLoadingSkeleton title="Loading Analytics Settings..." />;
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Settings</h1>
          <p className="text-gray-600">
            Set monthly budget targets for financial year performance tracking per department.
          </p>
        </div>

        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
              <div>
                <CardTitle>Monthly Budget Targets for FY {selectedYear}/{selectedYear + 1}</CardTitle>
                <CardDescription>
                  Enter the total invoiced amount you are targeting for each month.
                </CardDescription>
              </div>
              <div>
                <Label htmlFor="department-select">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger id="department-select" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MONTHS.map(month => (
                <div key={month} className="space-y-2">
                  <Label htmlFor={month} className="capitalize">{month}</Label>
                  <Input
                    id={month}
                    type="number"
                    value={settings?.department_budgets?.[selectedDepartment]?.[month] ?? ''}
                    onChange={(e) => handleBudgetChange(month, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
               <div className="text-lg font-semibold">
                 Total FY Budget for {selectedDepartment}: ${totalBudget.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
               <Button onClick={handleSave}>Save {selectedDepartment} Budget</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
