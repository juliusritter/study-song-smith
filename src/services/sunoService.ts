export async function generateSong(
  title: string,
  lyrics: string,
  genre: string,
  referenceArtist: string
): Promise<string> {
  const FUNCTIONS_BASE = 'https://xtvtoowocispdntduphk.functions.supabase.co';

  const res = await fetch(`${FUNCTIONS_BASE}/suno-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, lyrics, genre, referenceArtist }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Suno generate failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  if (!data?.audioUrl) {
    throw new Error('Suno generate returned no audioUrl');
  }
  return data.audioUrl as string;
}
