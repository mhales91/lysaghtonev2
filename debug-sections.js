// Debug the sections to see the actual data
// Run this with: node debug-sections.js

import fs from 'fs';
import path from 'path';

async function debugSections() {
  console.log('🔍 Debugging sections...');
  
  try {
    // Read the export file
    const exportPath = path.join(process.cwd(), 'exportdata', 'lysaght_data_export_2025-09-02.txt');
    const exportData = fs.readFileSync(exportPath, 'utf8');
    
    // Find the CLIENTS section specifically
    const clientsMatch = exportData.match(/=== CLIENTS ===\n([\s\S]*?)(?=\n=== [A-Z]|$)/);
    
    if (clientsMatch) {
      const clientsSection = clientsMatch[1];
      console.log('📋 CLIENTS section found:');
      console.log('Length:', clientsSection.length);
      console.log('First 500 characters:');
      console.log(clientsSection.substring(0, 500));
      console.log('\n---\n');
      
      // Parse the CSV
      const lines = clientsSection.trim().split('\n');
      console.log('📊 Lines in CLIENTS section:', lines.length);
      
      if (lines.length > 0) {
        console.log('📝 Headers:', lines[0]);
      }
      
      if (lines.length > 1) {
        console.log('📝 First data row:', lines[1]);
      }
      
      if (lines.length > 2) {
        console.log('📝 Second data row:', lines[2]);
      }
    } else {
      console.log('❌ CLIENTS section not found');
    }
    
    // Find the PROJECTS section specifically
    const projectsMatch = exportData.match(/=== PROJECTS ===\n([\s\S]*?)(?=\n=== [A-Z]|$)/);
    
    if (projectsMatch) {
      const projectsSection = projectsMatch[1];
      console.log('\n📋 PROJECTS section found:');
      console.log('Length:', projectsSection.length);
      console.log('First 500 characters:');
      console.log(projectsSection.substring(0, 500));
      console.log('\n---\n');
      
      // Parse the CSV
      const lines = projectsSection.trim().split('\n');
      console.log('📊 Lines in PROJECTS section:', lines.length);
      
      if (lines.length > 0) {
        console.log('📝 Headers:', lines[0]);
      }
      
      if (lines.length > 1) {
        console.log('📝 First data row:', lines[1]);
      }
    } else {
      console.log('❌ PROJECTS section not found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugSections();
