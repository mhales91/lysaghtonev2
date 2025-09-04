
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink } from 'lucide-react';
import { User, StaffRate, BillingSettings } from '@/api/entities';
import { toast } from 'sonner';

function StaffRatesManager() {
  const [users, setUsers] = useState([]);
  const [staffRates, setStaffRates] = useState([]);
  const [editingRates, setEditingRates] = useState({}); // Stores changes for multiple users

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [userData, rateData] = await Promise.all([User.list(), StaffRate.list()]);
    setUsers(userData);
    setStaffRates(rateData);
  };

  const handleRateChange = (userEmail, field, value) => {
    setEditingRates(prev => ({
      ...prev,
      [userEmail]: {
        ...prev[userEmail],
        [field]: value
      }
    }));
  };

  const handleSaveRate = async (userEmail) => {
    const changes = editingRates[userEmail];
    if (!changes) return;

    try {
      // Find the existing rate for the user
      const existingRate = staffRates.find(r => r.user_email === userEmail);

      const rateData = {
        user_email: userEmail,
        // Ensure values are numbers, default to 0 if parsing fails
        base_cost_rate: parseFloat(changes.base_cost_rate) || 0,
        billable_rate: parseFloat(changes.billable_rate) || 0,
        // Default effective_from to today if not provided
        effective_from: changes.effective_from || new Date().toISOString().split('T')[0]
      };

      if (existingRate) {
        // If an existing rate exists, update it
        await StaffRate.update(existingRate.id, rateData);
      } else {
        // Otherwise, create a new rate
        await StaffRate.create(rateData);
      }

      toast.success('Staff rate saved successfully!');
      
      // Clear editing state for this specific user
      setEditingRates(prev => {
        const newState = { ...prev };
        delete newState[userEmail];
        return newState;
      });
      
      fetchData(); // Re-fetch all data to ensure UI reflects the latest saved rates
    } catch (error) {
      console.error('Failed to save staff rate:', error);
      toast.error('Failed to save staff rate.');
    }
  };

  // Combine users with their rates and sort by billable rate
  const usersWithRates = users.map(user => {
    const rate = staffRates.find(r => r.user_email === user.email);
    const editing = editingRates[user.email]; // Get specific user's changes from editingRates

    return {
      ...user,
      // Prioritize editing changes, then existing rate, then default values
      base_cost_rate: editing?.base_cost_rate ?? rate?.base_cost_rate ?? 160,
      billable_rate: editing?.billable_rate ?? rate?.billable_rate ?? 180,
      effective_from: editing?.effective_from ?? rate?.effective_from ?? new Date().toISOString().split('T')[0],
      hasChanges: !!editing // True if there are unsaved changes for this user
    };
  }).sort((a, b) => b.billable_rate - a.billable_rate); // Sort by billable rate, highest first

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Rate Management</CardTitle>
        <CardDescription>Set cost and billable rates for each staff member. Sorted by billable rate (highest first).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Staff Member</th>
                <th className="text-right py-3 px-2">Cost Rate ($/hr)</th>
                <th className="text-right py-3 px-2">Billable Rate ($/hr)</th>
                <th className="text-center py-3 px-2">Effective From</th>
                <th className="text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersWithRates.map(user => (
                <tr 
                  key={user.id} 
                  className={`border-b hover:bg-gray-50 ${user.hasChanges ? 'bg-blue-50' : ''}`} // Highlight rows with unsaved changes
                >
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.department} • {user.user_role}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={user.base_cost_rate}
                      onChange={(e) => handleRateChange(user.email, 'base_cost_rate', e.target.value)}
                      className="w-24 text-right"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={user.billable_rate}
                      onChange={(e) => handleRateChange(user.email, 'billable_rate', e.target.value)}
                      className="w-24 text-right font-medium"
                    />
                  </td>
                  <td className="py-3 px-2">
                    <Input
                      type="date"
                      value={user.effective_from}
                      onChange={(e) => handleRateChange(user.email, 'effective_from', e.target.value)}
                      className="w-36"
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    {user.hasChanges && ( // Only show save button if there are changes
                      <Button
                        size="sm"
                        onClick={() => handleSaveRate(user.email)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>• Make changes directly in the table and click "Save" to update rates</p>
          <p>• Staff are sorted by billable rate (highest first)</p>
          <p>• Blue highlighting indicates unsaved changes</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TOECalculatorSettings() {
  const [billingSettings, setBillingSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await BillingSettings.list();
      setBillingSettings(settings[0] || {
        toe_calculator_rates: {
          graduate: 160,
          intermediate: 180,
          senior: 220,
          director: 250,
          admin: 120
        },
        default_overhead_multiplier: 1.2
      });
    } catch (error) {
      console.error('Error loading billing settings:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      if (billingSettings.id) {
        await BillingSettings.update(billingSettings.id, billingSettings);
      } else {
        const created = await BillingSettings.create(billingSettings);
        setBillingSettings(created);
      }
      alert('TOE calculator settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const updateRate = (level, value) => {
    setBillingSettings(prev => ({
      ...prev,
      toe_calculator_rates: {
        ...prev.toe_calculator_rates,
        [level]: parseFloat(value) || 0
      }
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>TOE Calculator Settings</CardTitle>
        <CardDescription>Set default hourly rates for the TOE cost calculator.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Staff Level Rates ($/hour)</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="graduate_rate">Graduate</Label>
                <Input
                  id="graduate_rate"
                  type="number"
                  value={billingSettings?.toe_calculator_rates?.graduate || 0}
                  onChange={e => updateRate('graduate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="intermediate_rate">Intermediate</Label>
                <Input
                  id="intermediate_rate"
                  type="number"
                  value={billingSettings?.toe_calculator_rates?.intermediate || 0}
                  onChange={e => updateRate('intermediate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="senior_rate">Senior</Label>
                <Input
                  id="senior_rate"
                  type="number"
                  value={billingSettings?.toe_calculator_rates?.senior || 0}
                  onChange={e => updateRate('senior', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="director_rate">Director</Label>
                <Input
                  id="director_rate"
                  type="number"
                  value={billingSettings?.toe_calculator_rates?.director || 0}
                  onChange={e => updateRate('director', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="admin_rate">Admin</Label>
                <Input
                  id="admin_rate"
                  type="number"
                  value={billingSettings?.toe_calculator_rates?.admin || 0}
                  onChange={e => updateRate('admin', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Other Settings</h4>
            
            <div>
              <Label htmlFor="overhead_multiplier">Default Overhead Multiplier</Label>
              <Input
                id="overhead_multiplier"
                type="number"
                step="0.1"
                value={billingSettings?.default_overhead_multiplier || 1.2}
                onChange={e => setBillingSettings(prev => ({
                  ...prev,
                  default_overhead_multiplier: parseFloat(e.target.value) || 1.2
                }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Multiplier applied to base rates for overhead costs (e.g., 1.2 = 20% overhead)
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function XeroConnectionManager() {
    const handleCheckXeroConnection = async () => {
        alert('Checking Xero connection...');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Xero Integration</CardTitle>
                <CardDescription>Connect to your Xero account to sync invoices.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCheckXeroConnection}
                        className="flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Check Connection
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.open('https://lysaght-xero-bridge.mitchellhales.workers.dev/xero/auth?workspace=lysaght', '_blank', 'width=600,height=740')}
                        className="flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Connect Xero
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillingAdminPage() {
  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing Administration</h1>
          <p className="text-gray-600">Manage billing settings, staff rates, and integrations.</p>
        </div>
        
        <div className="space-y-6">
          <XeroConnectionManager />
          <StaffRatesManager />
          <TOECalculatorSettings />
        </div>
      </div>
    </div>
  );
}
