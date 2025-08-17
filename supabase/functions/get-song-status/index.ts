import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();
    console.log('Checking song status for taskId:', taskId);

    if (!SUNO_API_KEY) {
      throw new Error('Suno API key not configured');
    }

    const response = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Suno get status error:', error);
      throw new Error(`Suno status check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Song status raw response:', data);

    const record = data?.data;
    const status = record?.status ?? 'UNKNOWN';
    
    // Extract songs from any success-like status
    let songs: Array<{ id: string; audioUrl: string; title?: string; duration?: number }> = [];
    const sunoData = record?.response?.sunoData ?? record?.response?.data ?? [];
    if (Array.isArray(sunoData) && sunoData.length > 0) {
      songs = sunoData
        .map((t: any) => ({
          id: t.id,
          audioUrl: t.audioUrl || t.streamAudioUrl || t.sourceAudioUrl || t.sourceStreamAudioUrl || '',
          title: t.title,
          duration: t.duration,
        }))
        .filter((s) => !!s.audioUrl);
    }

    // Normalize status so the client can proceed when audio is ready
    let effectiveStatus = status;
    if ((status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS' || status === 'SUCCESS') && songs.length > 0) {
      effectiveStatus = 'SUCCESS';
    }

    return new Response(JSON.stringify({
      success: true,
      data: { songs, status: effectiveStatus, taskId: record?.taskId }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-song-status function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});