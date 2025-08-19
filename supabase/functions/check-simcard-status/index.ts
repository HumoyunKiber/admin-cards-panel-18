import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { simCardCode } = await req.json()
    
    if (!simCardCode) {
      return new Response(
        JSON.stringify({ error: 'Simkarta kodi kiritilishi shart' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // API ga so'rov yuborish (simkarta holati uchun 9020 porti)
    const apiUrl = `http://141.136.42.126:9020/check-simcard-status`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: simCardCode })
    })

    if (!response.ok) {
      throw new Error(`API xatosi: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        simCardCode,
        status: data.status || 'unknown',
        isSold: data.is_sold || false,
        saleDate: data.sale_date || null,
        message: data.message || 'Ma\'lumot topilmadi'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Simkarta tekshirishda xatolik:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Simkarta tekshirishda xatolik yuz berdi',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})