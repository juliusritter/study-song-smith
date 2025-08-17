interface KeyPoint {
  id: string;
  concept: string;
  one_liner: string;
  details: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
}

interface SummaryResult {
  title: string;
  key_points: KeyPoint[];
  glossary: GlossaryTerm[];
  references: string[];
}

interface LyricsSection {
  type: string;
  bars: number;
  purpose: string;
  lines: string[];
}

interface LyricsResult {
  title: string;
  lyrics: {
    sections: LyricsSection[];
  };
}

export async function summarizeTextForLearning(text: string, apiKey: string): Promise<SummaryResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a domain-faithful scientific summarizer. Extract only the essential ideas from the paper text for learning. Prefer precise definitions, causal mechanisms, key equations/parameters, and constraints. Avoid rhetoric, anecdotes, and long quotes. Return JSON with fields: {title, key_points:[{id, concept, one_liner, details}], glossary:[{term, definition}], references:[]}. Keep `one_liner` ≤ 140 chars each.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generateLyrics(summary: SummaryResult, apiKey: string): Promise<LyricsResult> {
  const prompt = `Create lyrics based on this summary: ${JSON.stringify(summary)}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}