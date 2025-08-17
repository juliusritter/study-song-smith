import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');

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
    if (!SUNO_API_KEY) {
      throw new Error('Missing SUNO_API_KEY secret');
    }

    const { title, lyrics, genre, referenceArtist } = await req.json();
    if (!title || !lyrics || !genre) {
      return new Response(JSON.stringify({ error: 'Invalid body: { title, lyrics, genre, referenceArtist? } required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `${lyrics}\n\nReference vibe: inspired by ${referenceArtist || 'Taylor Swift'}; energetic, study-friendly; clear enunciation; verse/chorus/bridge structure.`;

    // 1) Generate
    const generateResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        title,
        style: genre,
        prompt,
        model: 'V4_5',
        callBackUrl: 'https://example.com/callback'
      }),
    });

    if (!generateResponse.ok) {
      const errText = await generateResponse.text();
      console.error('Suno generate error', generateResponse.status, errText);
      return new Response(JSON.stringify({ error: 'Suno generate error', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generateData = await generateResponse.json();
    const taskId = generateData?.data?.taskId ?? generateData?.data?.task_id;
    if (!taskId) {
      console.error('Unexpected Suno generate response', generateData);
      return new Response(JSON.stringify({ error: 'Suno generate did not return a taskId' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Poll
    let attempts = 0;
    const maxAttempts = 60; // ~5 minutes

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000));

      const resultResponse = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Accept': 'application/json',
        },
      });

      if (!resultResponse.ok) {
        const errText = await resultResponse.text();
        console.error('Suno result error', resultResponse.status, errText);
        return new Response(JSON.stringify({ error: 'Suno result error', details: errText }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const resultData = await resultResponse.json();
      const status = resultData?.data?.status;

      if (status === 'SUCCESS' || status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS') {
        const tracks = resultData?.data?.response?.sunoData || [];
        const firstUrl = tracks[0]?.audioUrl || tracks[0]?.streamAudioUrl;
        if (firstUrl) {
          return new Response(JSON.stringify({ audioUrl: firstUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (status === 'FAILED') {
        return new Response(JSON.stringify({ error: 'Song generation failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      attempts++;
    }

    return new Response(JSON.stringify({ error: 'Song generation timed out' }), {
      status: 504,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('suno-generate function error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
