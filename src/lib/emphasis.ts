// Divide un titolo per evidenziare l'ultima parola (in oro), lasciando fuori la punteggiatura finale.
export function splitEmphasis(title: string): { lead: string; word: string; tail: string } {
  const m = title.match(/^(.*?)([\p{L}\p{N}'’-]+)([^\p{L}\p{N}]*)$/u);
  if (!m) return { lead: title, word: '', tail: '' };
  return { lead: m[1], word: m[2], tail: m[3] };
}
