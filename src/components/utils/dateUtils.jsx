export function getNZFinancialYear(date = new Date()) {
  const currentMonth = date.getMonth(); // 0 = Jan, 3 = Apr
  const currentYear = date.getFullYear();
  
  // The financial year starts in April.
  // If the current month is Jan, Feb, or Mar, the financial year started last calendar year.
  const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  
  const startDate = new Date(startYear, 3, 1); // April 1st
  const endDate = new Date(startYear + 1, 2, 31); // March 31st of the next year
  
  return { startDate, endDate };
}