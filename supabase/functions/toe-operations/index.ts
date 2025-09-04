// TOE Operations Function for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (method === 'POST' && action === 'create_project') {
      return await createProjectFromTOE(req, supabaseClient)
    } else if (method === 'POST' && action === 'generate_share_link') {
      return await generateShareLink(req, supabaseClient)
    } else if (method === 'GET' && action === 'get_share_data') {
      return await getShareData(req, supabaseClient)
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action or method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('TOE operations error:', error)
    return new Response(JSON.stringify({ 
      error: 'TOE operation failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createProjectFromTOE(req: Request, supabaseClient: any) {
  try {
    const payload = await req.json()
    const { toe_id } = payload

    if (!toe_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: toe_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get the TOE data
    const { data: toe, error: toeError } = await supabaseClient
      .from('toe')
      .select('*')
      .eq('id', toe_id)
      .single()

    if (toeError) {
      throw toeError
    }

    if (!toe) {
      return new Response(JSON.stringify({ 
        error: 'TOE not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (toe.status !== 'signed') {
      return new Response(JSON.stringify({ 
        error: 'TOE must be signed before creating a project' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if project already exists for this TOE
    const { data: existingProject } = await supabaseClient
      .from('project')
      .select('id')
      .eq('toe_id', toe_id)
      .single()

    if (existingProject) {
      return new Response(JSON.stringify({ 
        error: 'Project already exists for this TOE' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create the project
    const projectData = {
      project_name: toe.project_title,
      client_id: toe.client_id,
      toe_id: toe.id,
      status: 'active',
      budget: toe.total_fee_with_gst || 0,
      created_by: toe.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: project, error: projectError } = await supabaseClient
      .from('project')
      .insert(projectData)
      .select()
      .single()

    if (projectError) {
      throw projectError
    }

    // Create tasks from linked task templates if fee structure has them
    if (toe.fee_structure && Array.isArray(toe.fee_structure)) {
      const taskPromises = []
      
      for (const feeItem of toe.fee_structure) {
        if (feeItem.linked_task_templates && Array.isArray(feeItem.linked_task_templates)) {
          for (const templateId of feeItem.linked_task_templates) {
            // Get task template
            const { data: template } = await supabaseClient
              .from('task_template')
              .select('*')
              .eq('id', templateId)
              .single()

            if (template) {
              const taskData = {
                project_id: project.id,
                name: template.name,
                description: template.description || '',
                estimated_hours: template.default_hours || 0,
                status: 'pending',
                created_by: toe.created_by,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }

              taskPromises.push(
                supabaseClient
                  .from('task')
                  .insert(taskData)
                  .select()
                  .single()
              )
            }
          }
        }
      }

      if (taskPromises.length > 0) {
        await Promise.all(taskPromises)
      }
    }

    // Update TOE status to indicate project has been created
    await supabaseClient
      .from('toe')
      .update({ 
        status: 'project_created',
        updated_at: new Date().toISOString()
      })
      .eq('id', toe_id)

    return new Response(JSON.stringify({ 
      success: true, 
      project: project,
      message: 'Project created successfully from TOE'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create project from TOE error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to create project from TOE', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function generateShareLink(req: Request, supabaseClient: any) {
  try {
    const payload = await req.json()
    const { toe_id } = payload

    if (!toe_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: toe_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate a unique share token
    const share_token = crypto.randomUUID()

    // Check if signature record exists
    const { data: existingSignature, error: checkError } = await supabaseClient
      .from('toe_signature')
      .select('*')
      .eq('toe_id', toe_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError
    }

    if (existingSignature) {
      // Update existing signature with share token
      const { data, error } = await supabaseClient
        .from('toe_signature')
        .update({ 
          share_token,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSignature.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ 
        success: true, 
        share_token,
        share_url: `${req.headers.get('origin') || 'http://localhost:5173'}/TOESign?token=${share_token}`,
        signature: data
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      // Create new signature record with share token
      const { data, error } = await supabaseClient
        .from('toe_signature')
        .insert({
          toe_id,
          share_token,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ 
        success: true, 
        share_token,
        share_url: `${req.headers.get('origin') || 'http://localhost:5173'}/TOESign?token=${share_token}`,
        signature: data
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Generate share link error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate share link', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function getShareData(req: Request, supabaseClient: any) {
  try {
    const url = new URL(req.url)
    const share_token = url.searchParams.get('share_token')

    if (!share_token) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: share_token' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get signature record with TOE and client data
    const { data: signature, error: signatureError } = await supabaseClient
      .from('toe_signature')
      .select(`
        *,
        toe:toe_id (
          *,
          client:client_id (*)
        )
      `)
      .eq('share_token', share_token)
      .single()

    if (signatureError) {
      if (signatureError.code === 'PGRST116') { // No rows found
        return new Response(JSON.stringify({ 
          error: 'Invalid or expired share token' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      throw signatureError
    }

    return new Response(JSON.stringify({ 
      success: true, 
      toe: signature.toe,
      client: signature.toe.client,
      signature: signature
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get share data error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to get share data', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
