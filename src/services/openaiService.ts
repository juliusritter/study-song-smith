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

const FUNCTIONS_BASE = 'https://xtvtoowocispdntduphk.functions.supabase.co';

export async function summarizeTextForLearning(text: string): Promise<SummaryResult> {
  const res = await fetch(`${FUNCTIONS_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Summarize failed: ${res.status} ${err}`);
  }
  return (await res.json()) as SummaryResult;
}

export async function generateLyrics(summary: SummaryResult): Promise<LyricsResult> {
  const res = await fetch(`${FUNCTIONS_BASE}/generate-lyrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Generate lyrics failed: ${res.status} ${err}`);
  }
  return (await res.json()) as LyricsResult;
}
