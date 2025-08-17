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

export async function generateSong(
  title: string,
  lyrics: string,
  genre: string,
  referenceArtist: string,
  apiKey: string
): Promise<string> {
  // Step 1: Generate the song
  const generateResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      title,
      style: genre,
      prompt: `${lyrics}\n\nReference vibe: inspired by ${referenceArtist}; energetic, study-friendly; clear enunciation; verse/chorus/bridge structure.`,
      model: 'V4_5'
    }),
  });

  if (!generateResponse.ok) {
    throw new Error(`Suno API generate error: ${generateResponse.statusText}`);
  }

  const generateData: SunoGenerateResponse = await generateResponse.json();
  const taskId = generateData.data.taskId;

  // Step 2: Poll for result
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5s intervals)
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const resultResponse = await fetch(
      `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!resultResponse.ok) {
      throw new Error(`Suno API result error: ${resultResponse.statusText}`);
    }

    const resultData: SunoResultResponse = await resultResponse.json();
    
    if (resultData.data.status === 'SUCCESS' || resultData.data.status === 'FIRST_SUCCESS') {
      // Return the first track's audio URL
      if (resultData.data.response.sunoData.length > 0) {
        return resultData.data.response.sunoData[0].audioUrl;
      }
    }
    
    if (resultData.data.status === 'FAILED') {
      throw new Error('Song generation failed');
    }
    
    attempts++;
  }
  
  throw new Error('Song generation timed out');
}