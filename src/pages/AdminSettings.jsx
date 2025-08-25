import React, { useState, useEffect } from 'react';
import { CompanySettings } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const settingsList = await CompanySettings.list();
    if (settingsList.length > 0) {
      setSettings(settingsList[0]);
    } else {
      // Create settings if they don't exist
      const newSettings = await CompanySettings.create({});
      setSettings(newSettings);
    }
    setIsLoading(false);
  };
  
  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      const dataToSave = {
        ...settings,
        job_seed: Number(settings.job_seed)
      };
      await CompanySettings.update(settings.id, dataToSave);
      toast.success('Settings saved successfully!');
    } catch (e) {
      console.error('Failed to save settings:', e);
      toast.error('Failed to save settings.');
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Settings</h1>
          <p className="text-gray-600">
            Manage global settings for the application.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Number Seed</CardTitle>
            <CardDescription>
              Set the next job number to be assigned to a new project. This number will auto-increment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job_seed">Next Job Number</Label>
              <Input
                id="job_seed"
                type="number"
                value={settings.job_seed || ''}
                onChange={(e) => handleInputChange('job_seed', e.target.value)}
              />
            </div>
            <Button onClick={handleSave}>Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}