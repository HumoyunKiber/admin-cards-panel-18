import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { simCards } = await req.json()
    
    if (!simCards || !Array.isArray(simCards)) {
      return new Response(
        JSON.stringify({ error: 'Simkartalar ro\'yxati kiritilishi shart' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const apiUrl = 'http://localhost:9020/bulk-check-simcards'
    const results = []

    // Har bir simkarta uchun API ga so'rov yuborish
    for (const simCard of simCards) {
      try {
        const response = await fetch(`${apiUrl}/${simCard.code}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          results.push({
            simCardId: simCard.id,
            code: simCard.code,
            isSold: data.is_sold || false,
            status: data.is_sold ? 'sold' : 'available',
            saleDate: data.sale_date || null,
            lastChecked: new Date().toISOString()
          })
        } else {
          // API xatosi bo'lsa, oldingi holatni saqlaymiz
          results.push({
            simCardId: simCard.id,
            code: simCard.code,
            isSold: simCard.status === 'sold',
            status: simCard.status,
            saleDate: simCard.saleDate || null,
            lastChecked: new Date().toISOString(),
            error: `API xatosi: ${response.status}`
          })
        }
      } catch (error) {
        // Tarmoq xatosi
        results.push({
          simCardId: simCard.id,
          code: simCard.code,
          isSold: simCard.status === 'sold',
          status: simCard.status,
          saleDate: simCard.saleDate || null,
          lastChecked: new Date().toISOString(),
          error: error.message
        })
      }
      
      // API ga ortiqcha yuklama bermash uchun kichik pauza
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalChecked: results.length,
        soldCount: results.filter(r => r.isSold).length,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Avtomatik tekshirishda xatolik:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Avtomatik tekshirishda xatolik yuz berdi',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})