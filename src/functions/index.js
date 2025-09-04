// Backend Functions Index
// Routes requests to appropriate function handlers

import generateTOEPDF from './generate-toe-pdf.js';
import aiChat from './ai-chat.js';
import exportData from './export-data.js';
import handleSignature from './handle-signature.js';
import toeOperations from './toe-operations.js';

export default async function handleRequest(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    // Route requests based on pathname
    if (pathname === '/api/generate-toe-pdf') {
      return await generateTOEPDF(req);
    } else if (pathname === '/api/ai-chat') {
      return await aiChat(req);
    } else if (pathname === '/api/export-data') {
      return await exportData(req);
    } else if (pathname === '/api/signature') {
      return await handleSignature(req);
    } else if (pathname === '/api/toe-operations') {
      return await toeOperations(req);
    } else {
      return new Response(JSON.stringify({ 
        error: 'Function not found',
        available_functions: [
          '/api/generate-toe-pdf',
          '/api/ai-chat', 
          '/api/export-data',
          '/api/signature',
          '/api/toe-operations'
        ]
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Function routing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Export individual functions for direct use
export {
  generateTOEPDF,
  aiChat,
  exportData,
  handleSignature,
  toeOperations
};
