
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, Calculator } from "lucide-react";
import { BillingSettings } from "@/api/entities"; // Added import

export default function CostCalculator({ companySettings, onCalculate, onClose }) {
  const [staffLines, setStaffLines] = useState([
    { role: 'intermediate', hours: 0, rate: 0 } // Initialize rate to 0, will be updated by defaultRates
  ]);

  const [defaultRates, setDefaultRates] = useState({
    graduate: 160,
    intermediate: 180,
    senior: 220,
    director: 250,
    admin: 120 // Added admin role
  });

  // State for the new staff line to be added via the form
  const [newStaff, setNewStaff] = useState({
    role: 'intermediate',
    hours: 0, // Default hours for new entry
    rate: 0 // Will be set from defaultRates
  });

  useEffect(() => {
    loadDefaultRates();
  }, []);

  // Effect to update newStaff's rate when defaultRates load or newStaff role changes
  useEffect(() => {
    if (defaultRates[newStaff.role] && newStaff.rate === 0) { // Only update if rate is 0 (not manually set)
      setNewStaff(prev => ({
        ...prev,
        rate: defaultRates[prev.role]
      }));
    } else if (newStaff.rate === 0 && defaultRates[newStaff.role] === undefined) {
      // Handle cases where a role might not have a default rate, though unlikely with fixed roles
      setNewStaff(prev => ({
        ...prev,
        rate: 0 // Explicitly set to 0 if default not found
      }));
    }
  }, [defaultRates, newStaff.role, newStaff.rate]);


  const loadDefaultRates = async () => {
    try {
      const billingSettings = await BillingSettings.list();
      if (billingSettings.length > 0 && billingSettings[0].toe_calculator_rates) {
        const loadedRates = billingSettings[0].toe_calculator_rates;
        setDefaultRates(loadedRates);
        // Update initial staff line and newStaff with loaded rates
        setStaffLines(prevLines => prevLines.map(line => ({
          ...line,
          rate: loadedRates[line.role] || line.rate // Use loaded rate, fallback to existing or 0
        })));
        setNewStaff(prev => ({
          ...prev,
          rate: loadedRates[prev.role] || 0 // Use loaded rate for new staff form
        }));
      }
    } catch (error) {
      console.error('Error loading default rates:', error);
      // Fallback to internal defaults if API fails
      setStaffLines(prevLines => prevLines.map(line => ({
        ...line,
        rate: defaultRates[line.role] || line.rate
      })));
      setNewStaff(prev => ({
        ...prev,
        rate: defaultRates[prev.role] || 0
      }));
    }
  };

  const addStaffLine = () => {
    // Use the values from the newStaff form state
    const effectiveRate = newStaff.rate > 0 ? newStaff.rate : (defaultRates[newStaff.role] || 0);

    setStaffLines([
      ...staffLines,
      {
        role: newStaff.role,
        hours: newStaff.hours,
        rate: effectiveRate
      }
    ]);
    // Reset newStaff for the next entry, setting rate based on default
    setNewStaff({
      role: 'intermediate',
      hours: 0,
      rate: defaultRates.intermediate || 0
    });
  };

  const removeStaffLine = (index) => {
    if (staffLines.length > 1) {
      setStaffLines(staffLines.filter((_, i) => i !== index));
    }
  };

  const updateStaffLine = (index, field, value) => {
    const newStaffLines = [...staffLines];
    newStaffLines[index] = {
      ...newStaffLines[index],
      [field]: field === 'hours' || field === 'rate' ? parseFloat(value) || 0 : value
    };
    
    // Update rate when role changes
    if (field === 'role') {
      newStaffLines[index].rate = defaultRates[value] || 0; // Use loaded defaultRates
    }
    
    setStaffLines(newStaffLines);
  };

  const calculateTotals = () => {
    const breakdown = staffLines.map(line => ({
      role: line.role,
      hours: line.hours,
      rate: line.rate,
      cost: line.hours * line.rate
    }));

    const totalHours = breakdown.reduce((sum, item) => sum + item.hours, 0);
    const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);

    return { breakdown, totalHours, totalCost };
  };

  const handleCalculate = () => {
    const calculation = calculateTotals();
    onCalculate(calculation);
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Cost Calculator
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Staff Breakdown</h4>

            {/* New section for adding staff with customizable role and rate */}
            <Card className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newStaffRole">Staff Level</Label> {/* Added ID */}
                  <Select
                    value={newStaff.role}
                    onValueChange={(value) => {
                      const updatedRate = defaultRates[value] || 0;
                      setNewStaff({ ...newStaff, role: value, rate: updatedRate });
                    }}
                  >
                    <SelectTrigger id="newStaffRole"> {/* Added ID */}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem> {/* Added Admin */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="newStaffRate">Hourly Rate ($)</Label> {/* Added ID */}
                  <Input 
                    id="newStaffRate" // Added ID
                    type="number" 
                    value={newStaff.rate}
                    onChange={(e) => setNewStaff({...newStaff, rate: parseFloat(e.target.value) || 0})}
                    placeholder={`Default: $${defaultRates[newStaff.role]?.toFixed(2) || '0.00'}`}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={addStaffLine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff
                </Button>
              </div>
            </Card>

            {/* Existing staff lines mapping */}
            {staffLines.map((line, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-3">
                    <Label>Role</Label>
                    <Select
                      value={line.role}
                      onValueChange={(value) => updateStaffLine(index, 'role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem> {/* Added Admin */}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-3">
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={line.hours}
                      onChange={(e) => updateStaffLine(index, 'hours', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <Label>Rate ($/hr)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.rate}
                      onChange={(e) => updateStaffLine(index, 'rate', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Total</Label>
                    <div className="text-lg font-semibold">
                      ${(line.hours * line.rate).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStaffLine(index)}
                      disabled={staffLines.length <= 1}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold">{totals.totalHours}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold">${totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCalculate}
              style={{ backgroundColor: '#5E0F68' }}
              className="hover:bg-purple-700"
            >
              Apply Calculation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
