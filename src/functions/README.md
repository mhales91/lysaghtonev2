# Backend Functions for TOE Process

This directory contains the backend functions needed to support the TOE (Terms of Engagement) process, adapted from Base44 functions to work with Supabase.

## Functions Overview

### 1. `generate-toe-pdf.js`
**Purpose**: Generates professional PDF documents from TOE data
**Endpoint**: `/api/generate-toe-pdf`
**Method**: POST

**Input**:
```json
{
  "project_title": "Project Name",
  "scope_of_work": "Detailed scope description",
  "assumptions": "Project assumptions",
  "exclusions": "Project exclusions", 
  "client": {
    "company_name": "Client Company",
    "contact_person": "Contact Name",
    "email": "contact@company.com",
    "phone": "123-456-7890",
    "address": {
      "street": "123 Main St",
      "city": "Auckland"
    }
  },
  "fee_structure": [
    {
      "description": "Service description",
      "cost": 5000
    }
  ],
  "total_fee": 5000,
  "total_fee_with_gst": 5750,
  "signatureRecord": {
    "client_signature": "base64_image_data",
    "lysaght_signature": "base64_image_data",
    "client_signer_name": "Client Name",
    "client_signed_date": "2024-01-01T00:00:00Z",
    "lysaght_signed_date": "2024-01-01T00:00:00Z"
  },
  "includeSignatures": true
}
```

**Output**: JSON with PDF data (simplified version - in production, use pdf-lib for actual PDF generation)

### 2. `ai-chat.js`
**Purpose**: Handles AI chat interactions with OpenAI
**Endpoint**: `/api/ai-chat`
**Method**: POST

**Input**:
```json
{
  "prompt": "User message",
  "systemPrompt": "System instructions",
  "model": "gpt-4o",
  "history": [
    {
      "type": "user",
      "content": "Previous user message"
    },
    {
      "type": "assistant", 
      "content": "Previous AI response"
    }
  ]
}
```

**Output**:
```json
{
  "success": true,
  "response": "AI response text",
  "model_used": "gpt-4o",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### 3. `export-data.js`
**Purpose**: Exports all system data for backup/analysis
**Endpoint**: `/api/export-data`
**Method**: POST

**Authentication**: Requires Admin or Director role

**Output**: Text file with CSV data for all entities

### 4. `handle-signature.js`
**Purpose**: Manages TOE signature operations
**Endpoint**: `/api/signature`
**Methods**: GET, POST, PUT

**POST - Create/Update Signature**:
```json
{
  "toe_id": "uuid",
  "signature_data": "base64_image_data",
  "signer_name": "Signer Name",
  "signer_type": "client" | "lysaght"
}
```

**GET - Retrieve Signature**:
- Query params: `toe_id` or `share_token`

### 5. `toe-operations.js`
**Purpose**: Handles TOE-specific operations
**Endpoint**: `/api/toe-operations`
**Methods**: GET, POST

**Actions**:
- `create_project` - Creates a project from a signed TOE
- `generate_share_link` - Generates a shareable link for client signing
- `get_share_data` - Retrieves TOE data for client signing page

## Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_PROJECT_ID=your_openai_project_id (optional)
```

## Usage Examples

### Generate TOE PDF
```javascript
const response = await fetch('/api/generate-toe-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify(toeData)
});
```

### AI Chat
```javascript
const response = await fetch('/api/ai-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    prompt: "Help me write a scope of work for a civil engineering project",
    model: "gpt-4o"
  })
});
```

### Create Project from TOE
```javascript
const response = await fetch('/api/toe-operations?action=create_project', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({ toe_id: "uuid" })
});
```

### Generate Share Link
```javascript
const response = await fetch('/api/toe-operations?action=generate_share_link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({ toe_id: "uuid" })
});
```

## Integration with Frontend

These functions are designed to work with the existing TOE components:

- **TOEWizard**: Uses AI chat for content generation
- **TOEPreview**: Uses PDF generation for document preview
- **TOESign**: Uses signature handling and share data retrieval
- **TOEManager**: Uses project creation and share link generation

## Notes

- All functions include proper error handling and CORS headers
- Authentication is handled via Supabase JWT tokens
- Functions are designed to be stateless and scalable
- The PDF generation function is simplified - in production, integrate with pdf-lib for actual PDF creation
- All database operations use the service role for proper permissions
