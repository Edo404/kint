// Divide un titolo per evidenziare l'ultima parola (in oro), lasciando fuori la punteggiatura finale.
export function splitEmphasis(title: string): { lead: string; word: string; tail: string } {
  const m = title.match(/^(.*?)([\p{L}\p{N}'’-]+)([^\p{L}\p{N}]*)$/u);
  if (!m) return { lead: title, word: '', tail: '' };
  return { lead: m[1], word: m[2], tail: m[3] };
}

// Frasi di un testo, in ordine (si divide dopo . ! ? seguiti da spazio).
export const sentences = (text: string): string[] => text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);

// Primo numero in un testo ("Prima call: 20 minuti" → "20"), per mostrarlo in grande come decorazione.
export function leadNumber(text: string): string | null {
  return text.match(/\d+/)?.[0] ?? null;
}
