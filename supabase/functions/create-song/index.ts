import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUNO_API_KEY = Deno.env.get('SUNO_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, genre, referenceArtist } = await req.json();
    console.log('Creating song with genre:', genre, 'referenceArtist:', referenceArtist);

    if (!OPENAI_API_KEY || !SUNO_API_KEY) {
      throw new Error('API keys not configured');
    }

    // Step 1: Generate summary with OpenAI
    console.log('Generating summary...');
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an educational content analyzer. Extract key learning points from text and format them as a structured summary for study purposes. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: `Analyze this text and create a learning summary with title, key points (max 5), and glossary terms (max 5): ${text.substring(0, 3000)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!summaryResponse.ok) {
      const error = await summaryResponse.text();
      console.error('OpenAI summary error:', error);
      throw new Error(`OpenAI summary failed: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const summary = JSON.parse(summaryData.choices[0].message.content);
    console.log('Summary generated:', summary.title);

    // Step 2: Generate lyrics with OpenAI
    console.log('Generating lyrics...');
    const lyricsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a songwriter who creates educational songs. Turn learning content into catchy, memorable lyrics that help students remember key concepts. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: `Create song lyrics in ${genre} style based on this summary. Include all key points and terms in a memorable way: ${JSON.stringify(summary)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!lyricsResponse.ok) {
      const error = await lyricsResponse.text();
      console.error('OpenAI lyrics error:', error);
      throw new Error(`OpenAI lyrics failed: ${lyricsResponse.status}`);
    }

    const lyricsData = await lyricsResponse.json();
    const lyrics = JSON.parse(lyricsData.choices[0].message.content);
    console.log('Lyrics generated');

    // Build a robust prompt from lyrics - handle different possible structures
    let builtPrompt = '';
    try {
      if (Array.isArray(lyrics?.lyrics)) {
        builtPrompt = lyrics.lyrics.join('\n');
      } else if (typeof lyrics?.lyrics === 'string') {
        builtPrompt = lyrics.lyrics;
      } else {
        // Fallback to verse/chorus structure
        const parts = [lyrics?.verse1, lyrics?.chorus, lyrics?.verse2, lyrics?.bridge]
          .filter(part => typeof part === 'string' && part.trim().length > 0);
        builtPrompt = parts.join('\n\n');
      }
      
      // Final fallback if nothing worked
      if (!builtPrompt || builtPrompt.trim().length === 0) {
        builtPrompt = `Study song about ${summary?.title || 'learning'}`;
      }
    } catch (error) {
      console.error('Error building prompt:', error);
      builtPrompt = `Study song about ${summary?.title || 'learning'}`;
    }
    
    console.log('Built prompt length:', builtPrompt.length);

    // Step 3: Create song with Suno
    console.log('Creating song with Suno...');
    const styleString = (typeof genre === 'string' && genre.trim().length > 0)
      ? (typeof referenceArtist === 'string' && referenceArtist.trim().length > 0
          ? `${genre} inspired by ${referenceArtist}`
          : genre)
      : genre;
    const finalPrompt = builtPrompt + (typeof referenceArtist === 'string' && referenceArtist.trim().length > 0
      ? `\n\nReference vibe: inspired by ${referenceArtist}; energetic, study-friendly; clear enunciation; verse/chorus/bridge structure.`
      : '');
    console.log('Using style:', styleString);
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        model: 'V4_5',
        prompt: finalPrompt,
        style: styleString,
        title: summary.title || 'Study Song'
      }),
    });

    if (!sunoResponse.ok) {
      const error = await sunoResponse.text();
      console.error('Suno error:', error);
      throw new Error(`Suno failed: ${sunoResponse.status}`);
    }

    const sunoData = await sunoResponse.json();
    console.log('Suno response:', sunoData);

    if (sunoData.code !== 200) {
      throw new Error(`Suno API error: ${sunoData.msg || 'Unknown error'}`);
    }

    return new Response(JSON.stringify({
      success: true,
      taskId: sunoData.data.taskId,
      summary,
      lyrics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-song function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});