import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('Missing OPENAI_API_KEY secret');
    }

    const { summary } = await req.json();
    if (!summary) {
      return new Response(JSON.stringify({ error: 'Invalid body: { summary } required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Create lyrics based on this summary: ${JSON.stringify(summary)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Write accurate, catchy lyrics optimized for learning. Structure:
• Verse 1 (16 bars): Give an overview of the research area and why it matters.
• Hook/Chorus (8 bars): State the main takeaways/conclusions in the simplest, most memorable form.
• Verse 2 (16 bars): Add core mechanisms, definitions, and key equations/parameters.
• Verse 3 (16 bars): Cover limitations, constraints, edge cases, or competing theories.
• Bridge (8 bars): Practical implications or how to apply the insights.
Use tight rhyme and clear scansion; keep technical terms intact; avoid filler. Return JSON format:
{
  "title": "",
  "lyrics": {
    "sections": [
      {"type":"verse","bars":16,"purpose":"overview","lines":["..."]},
      {"type":"chorus","bars":8,"purpose":"main_takeaways","lines":["..."]},
      {"type":"verse","bars":16,"purpose":"mechanisms_and_defs","lines":["..."]},
      {"type":"verse","bars":16,"purpose":"limits_and_edges","lines":["..."]},
      {"type":"bridge","bars":8,"purpose":"applications","lines":["..."]}
    ]
  }
}
Keep per-line ≤ 80 chars.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI generate-lyrics error', response.status, errText);
      return new Response(JSON.stringify({ error: 'OpenAI error', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-lyrics function error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
