// Debug the Base44 import to see what's happening
// Run this with: node debug-import.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Get environment variables
const getEnvVar = (key, defaultValue) => {
  return process.env[key] || defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'http://134.199.146.249:8000');
const supabaseServiceKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY', '');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to generate UUID
function gen_random_uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to parse CSV with proper handling of commas in values
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    data.push(row);
  }
  
  return data;
}

// Helper function to convert Base44 date to ISO
function convertDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

// Helper function to convert string to number
function convertNumber(str) {
  if (!str || str === '') return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

async function debugImport() {
  console.log('🔍 Debugging Base44 import...');
  
  try {
    // Read the export file
    const exportPath = path.join(process.cwd(), 'exportdata', 'lysaght_data_export_2025-09-02.txt');
    const exportData = fs.readFileSync(exportPath, 'utf8');
    
    console.log('📄 Export file size:', exportData.length, 'characters');
    
    // Split into sections
    const sections = exportData.split(/^=== [A-Z]/m);
    console.log('📋 Found', sections.length, 'sections');
    
    // Process each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`\n📋 Section ${i}:`, section.substring(0, 100) + '...');
      
      if (section.includes('PROJECTS ===')) {
        console.log('🎯 Found PROJECTS section');
        const data = parseCSV(section);
        console.log('📊 Parsed', data.length, 'projects');
        if (data.length > 0) {
          console.log('📝 Sample project:', data[0]);
        }
      } else if (section.includes('CLIENTS ===')) {
        console.log('🎯 Found CLIENTS section');
        const data = parseCSV(section);
        console.log('📊 Parsed', data.length, 'clients');
        if (data.length > 0) {
          console.log('📝 Sample client:', data[0]);
        }
      } else if (section.includes('TIME ENTRIES ===')) {
        console.log('🎯 Found TIME ENTRIES section');
        const data = parseCSV(section);
        console.log('📊 Parsed', data.length, 'time entries');
        if (data.length > 0) {
          console.log('📝 Sample time entry:', data[0]);
        }
      } else if (section.includes('TASKS ===')) {
        console.log('🎯 Found TASKS section');
        const data = parseCSV(section);
        console.log('📊 Parsed', data.length, 'tasks');
        if (data.length > 0) {
          console.log('📝 Sample task:', data[0]);
        }
      } else if (section.includes('COMPANY SETTINGS ===')) {
        console.log('🎯 Found COMPANY SETTINGS section');
        const data = parseCSV(section);
        console.log('📊 Parsed', data.length, 'company settings');
        if (data.length > 0) {
          console.log('📝 Sample setting:', data[0]);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugImport();
