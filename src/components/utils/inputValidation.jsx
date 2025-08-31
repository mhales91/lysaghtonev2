// Input validation utilities for production security
export const sanitizeInput = (input) => {
  if (!input) return '';
  return String(input)
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .trim()
    .substring(0, 1000); // Limit length
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateJobNumber = (jobNumber) => {
  const num = parseInt(jobNumber);
  return !isNaN(num) && num > 0 && num <= 999999;
};

export const validateCurrency = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0 && num <= 999999999;
};

export const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date.getFullYear() >= 1900;
};

export const validateProjectName = (name) => {
  return name && name.length >= 2 && name.length <= 200;
};

export const validateCompanyName = (name) => {
  return name && name.length >= 1 && name.length <= 200;
};

export const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const validateTimeEntry = (entry) => {
  const errors = [];
  
  if (!entry.minutes || entry.minutes < 0 || entry.minutes > 1440) {
    errors.push('Minutes must be between 0 and 1440 (24 hours)');
  }
  
  if (!entry.date || !validateDate(entry.date)) {
    errors.push('Valid date is required');
  }
  
  if (!entry.project_id) {
    errors.push('Project is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateInvoice = (invoice) => {
  const errors = [];
  
  if (!invoice.client_id) {
    errors.push('Client is required');
  }
  
  if (!invoice.line_items || invoice.line_items.length === 0) {
    errors.push('At least one line item is required');
  }
  
  if (!validateCurrency(invoice.total_amount)) {
    errors.push('Valid total amount is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};