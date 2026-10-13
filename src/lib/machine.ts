// Pagina "Machine": copia in solo testo del sito (stile terminale), per agenti AI, crawler e per chi la preferisce così.

// Larghezza delle etichette nella scheda "NOME ........ valore".
export const DOT_WIDTH = 14;

/** Etichetta in maiuscolo seguita da puntini fino a `width` caratteri (almeno uno spazio). */
export function dotLabel(label: string, width = DOT_WIDTH): string {
  const l = label.toLocaleUpperCase();
  const n = [...l].length;
  return n + 1 >= width ? `${l} ` : `${l} ${'.'.repeat(width - n - 1)}`;
}

// Logo "kint." in caratteri a blocchi: k e punto in oro come nel marchio, "int" chiaro.
export const KINT_ASCII: Array<{ k: string; int: string; dot: string }> = [
  { k: '██╗  ██╗', int: '██╗███╗   ██╗████████╗', dot: '   ' },
  { k: '██║ ██╔╝', int: '██║████╗  ██║╚══██╔══╝', dot: '   ' },
  { k: '█████╔╝ ', int: '██║██╔██╗ ██║   ██║   ', dot: '   ' },
  { k: '██╔═██╗ ', int: '██║██║╚██╗██║   ██║   ', dot: '   ' },
  { k: '██║  ██╗', int: '██║██║ ╚████║   ██║   ', dot: '██╗' },
  { k: '╚═╝  ╚═╝', int: '╚═╝╚═╝  ╚═══╝   ╚═╝   ', dot: '╚═╝' },
];
