import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/components/utils/formatter';
import { getNZFinancialYear } from '@/components/utils/dateUtils';
import { format } from 'date-fns';

const MONTH_MAP = {
  0: 'jan', 1: 'feb', 2: 'mar', 3: 'apr', 4: 'may', 5: 'jun',
  6: 'jul', 7: 'aug', 8: 'sep', 9: 'oct', 10: 'nov', 11: 'dec'
};

export default function BudgetWidget({ timeEntries, viewLevel, isLoading, currentUser, analyticsSettings, departments }) {

  const budgets = useMemo(() => {
    if (!analyticsSettings || !currentUser) return { monthly: 0, annual: 0 };

    const { department_budgets } = analyticsSettings;
    if (!department_budgets) return { monthly: 0, annual: 0 };
    
    const now = new Date();
    const currentMonthKey = MONTH_MAP[now.getMonth()];
    
    if (viewLevel === 'manager') {
      const deptBudget = department_budgets[currentUser.department] || {};
      const monthly = deptBudget[currentMonthKey] || 0;
      const annual = Object.values(deptBudget).reduce((sum, val) => sum + (val || 0), 0);
      return { monthly, annual };
    }
    
    if (viewLevel === 'director') {
      let totalMonthly = 0;
      let totalAnnual = 0;
      departments.forEach(dept => {
        const deptBudget = department_budgets[dept] || {};
        totalMonthly += deptBudget[currentMonthKey] || 0;
        totalAnnual += Object.values(deptBudget).reduce((sum, val) => sum + (val || 0), 0);
      });
      return { monthly: totalMonthly, annual: totalAnnual };
    }

    return { monthly: 0, annual: 0 }; // Default for staff or if no match
  }, [analyticsSettings, currentUser, viewLevel, departments]);

  const { monthlyFees, annualFees } = useMemo(() => {
    const now = new Date();
    const { startDate } = getNZFinancialYear(now);
    
    const monthly = timeEntries
      .filter(te => {
        const entryDate = new Date(te.date);
        return entryDate.getFullYear() === now.getFullYear() && entryDate.getMonth() === now.getMonth();
      })
      .reduce((sum, te) => sum + (te.billable_amount || 0), 0);

    const annual = timeEntries
      .filter(te => new Date(te.date) >= startDate)
      .reduce((sum, te) => sum + (te.billable_amount || 0), 0);
      
    return { monthlyFees: monthly, annualFees: annual };
  }, [timeEntries]);


  if (isLoading || viewLevel === 'staff') {
    return (
      <Card className="h-full rounded-xl shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">Budget Utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  const monthlyUtilization = budgets.monthly > 0 ? (monthlyFees / budgets.monthly) * 100 : 0;
  const annualUtilization = budgets.annual > 0 ? (annualFees / budgets.annual) * 100 : 0;

  const getProgressColor = (percentage) => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-amber-500';
    return 'bg-green-600';
  };

  return (
    <Card className="h-full rounded-xl shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Budget Utilisation {viewLevel === 'manager' && `- ${currentUser.department}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium text-gray-600">Monthly ({format(new Date(), 'MMMM')})</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(monthlyFees)}</span>
          </div>
          <Progress 
            value={monthlyUtilization} 
            className="h-3 rounded-full" 
            indicatorClassName={`rounded-full ${getProgressColor(monthlyUtilization)}`}
          />
          <p className="text-xs text-gray-500 text-right mt-1">
            vs {formatCurrency(budgets.monthly)}
          </p>
        </div>
        
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium text-gray-600">Annual (FYTD)</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(annualFees)}</span>
          </div>
          <Progress 
            value={annualUtilization} 
            className="h-3 rounded-full"
            indicatorClassName={`rounded-full ${getProgressColor(annualUtilization)}`}
          />
          <p className="text-xs text-gray-500 text-right mt-1">
            vs {formatCurrency(budgets.annual)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}