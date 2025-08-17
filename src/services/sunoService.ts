interface SunoGenerateResponse {
  code: number;
  data: {
    taskId: string;
  };
}

interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  title: string;
  duration: number;
}

interface SunoResultResponse {
  code: number;
  data: {
    status: 'SUCCESS' | 'FIRST_SUCCESS' | 'TEXT_SUCCESS' | 'FAILED' | 'RUNNING';
    response: {
      sunoData: SunoTrack[];
    };
  };
}

function sanitizeSunoKey(key: string) {
  return key.trim().split(/\s+/)[0];
}

export async function generateSong(
  title: string,
  lyrics: string,
  genre: string,
  referenceArtist: string,
  apiKey: string
): Promise<string> {
  // Step 1: Generate the song
  const sunoAuth = sanitizeSunoKey(apiKey);
  if (sunoAuth.startsWith('sk-')) {
    throw new Error('The Suno API key looks like an OpenAI key (starts with sk-). Please paste your Suno key in the Suno field.');
  }

  const generateResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sunoAuth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      title,
      style: genre,
      prompt: `${lyrics}\n\nReference vibe: inspired by ${referenceArtist}; energetic, study-friendly; clear enunciation; verse/chorus/bridge structure.`,
      model: 'V4_5',
      callBackUrl: 'https://example.com/callback'
    }),
  });

  if (!generateResponse.ok) {
    throw new Error(`Suno API generate error: ${generateResponse.statusText}`);
  }

  const generateData: any = await generateResponse.json();
  if (typeof generateData?.code === 'number' && generateData.code !== 200) {
    throw new Error(`Suno generate failed (${generateData.code}): ${generateData.msg || generateData.message || 'Unauthorized or plan limit reached'}`);
  }

  const taskId = generateData?.data?.taskId ?? generateData?.data?.task_id;
  if (!taskId) {
    console.error('Unexpected Suno generate response', generateData);
    throw new Error('Suno generate did not return a taskId. Please verify your Suno API key.');
  }

  // Step 2: Poll for result
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5s intervals)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const resultResponse = await fetch(
      `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${sunoAuth}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!resultResponse.ok) {
      throw new Error(`Suno API result error: ${resultResponse.statusText}`);
    }

    const resultData: any = await resultResponse.json();
    
    if (typeof resultData?.code === 'number' && resultData.code !== 200) {
      throw new Error(`Suno result failed (${resultData.code}): ${resultData.msg || resultData.message || 'Unknown error'}`);
    }

    const status = resultData?.data?.status;
    if (status === 'SUCCESS' || status === 'FIRST_SUCCESS' || status === 'TEXT_SUCCESS') {
      // Return the first track's audio URL
      const tracks = resultData?.data?.response?.sunoData || [];
      const firstUrl = tracks[0]?.audioUrl || tracks[0]?.streamAudioUrl;
      if (firstUrl) {
        return firstUrl;
      }
    }
    
    if (status === 'FAILED') {
      throw new Error('Song generation failed');
    }
    
    attempts++;
  }
  
  throw new Error('Song generation timed out');
}