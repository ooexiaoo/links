// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This is needed to handle CORS preflight requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const requestData = await req.json()
    const { 
      link_id,
      ip_address,
      user_agent,
      referrer,
      country,
      device_type
    } = requestData

    // Validate required fields
    if (!link_id) {
      throw new Error('Missing required field: link_id')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      // These are automatically populated by Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // This is the default anon key which is safe to use in the browser
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          // Use the service role key for admin operations
          headers: { 
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` 
          }
        }
      }
    )

    // 1. Record the analytics event
    const { data: analyticsData, error: analyticsError } = await supabaseClient
      .from('link_analytics')
      .insert([
        {
          link_id,
          ip_address,
          user_agent,
          referrer,
          country,
          device_type,
          clicked_at: new Date().toISOString(),
        },
      ])
      .select()

    if (analyticsError) throw analyticsError

    // 2. Update the link's click count and last_clicked_at
    const { error: updateError } = await supabaseClient.rpc('increment_link_clicks', {
      link_id
    })

    if (updateError) throw updateError

    // 3. Get the original URL for the redirect
    const { data: linkData, error: linkError } = await supabaseClient
      .from('links')
      .select('original_url')
      .eq('id', link_id)
      .single()

    if (linkError) throw linkError
    if (!linkData) throw new Error('Link not found')

    // Return success response with the original URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        original_url: linkData.original_url 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in track-link-click:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: error.status || 400,
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/track-link-click' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"link_id":"123","ip_address":"192.168.1.1","user_agent":"Mozilla/5.0","referrer":"https://example.com","country":"US","device_type":"desktop"}'

*/
