// Divide un titolo per evidenziare l'ultima parola (in oro), lasciando fuori la punteggiatura finale.
export function splitEmphasis(title: string): { lead: string; word: string; tail: string } {
  const m = title.match(/^(.*?)([\p{L}\p{N}'’-]+)([^\p{L}\p{N}]*)$/u);
  if (!m) return { lead: title, word: '', tail: '' };
  return { lead: m[1], word: m[2], tail: m[3] };
}

// Divide un testo in frasi e mette in risalto la seconda come citazione: [apertura, citazione, resto].
// Con meno di due frasi non c'è citazione e il testo resta intero.
export function splitQuote(text: string): { intro: string; quote: string; rest: string } {
  const s = text.trim().split(/(?<=[.!?])\s+/);
  if (s.length < 2) return { intro: text.trim(), quote: '', rest: '' };
  return { intro: s[0], quote: s[1], rest: s.slice(2).join(' ') };
}

// Primo numero in un testo ("Prima call: 20 minuti" → "20"), per mostrarlo in grande come decorazione.
export function leadNumber(text: string): string | null {
  return text.match(/\d+/)?.[0] ?? null;
}
