// Logo ufficiale "kint." (C:\_EDOARDO\z_kint\logo\kint-trasparente.svg): forme vettoriali, k e punto in oro.
// Le parti chiare nel file hanno una sfumatura (id "bianco") che varia appena: qui sono un colore pieno,
// così più loghi nella stessa pagina non si contendono lo stesso id. viewBox ritagliato sull'inchiostro.
export const LOGO = {
  viewBox: '543 334 651 208',
  width: 651,
  height: 208,
  gold: '#c29436',
  light: '#e2ddd7',
} as const;

export interface LogoShape {
  tone: 'gold' | 'light';
  tag: 'path' | 'rect';
  attrs: Record<string, string>;
}

export const LOGO_SHAPES: LogoShape[] = [
  { tone: 'gold', tag: 'path', attrs: { d: 'M12 0H24Q36 0 36 12V84L73 45Q79 39 86 39H104Q119 39 112 50L74 92L115 141Q122 155 109 155H89Q81 155 75 148L36 102V143Q36 155 24 155H12Q0 155 0 143V12Q0 0 12 0Z', transform: 'translate(543 334) scale(1.41880342 1.32258065)' } },
  { tone: 'light', tag: 'rect', attrs: { x: '719', y: '334', width: '54', height: '41', rx: '13.94' } },
  { tone: 'light', tag: 'rect', attrs: { x: '719', y: '386', width: '53', height: '153', rx: '12' } },
  { tone: 'light', tag: 'path', attrs: { d: 'M11 2H24Q35 2 35 14C45 5 58 0 71 0C99 0 114 20 114 50V106Q114 118 102 118H90Q78 118 78 106V55C78 39 70 30 58 30C45 30 36 40 36 55V106Q36 118 24 118H12Q0 118 0 106V14Q0 2 11 2Z', transform: 'translate(787 383) scale(1.44736842 1.32203390)' } },
  { tone: 'light', tag: 'path', attrs: { d: 'M30 0H43Q55 0 55 12V32H77Q87 32 87 42V52Q87 62 77 62H55V103C55 114 60 119 70 119Q75 119 79 118Q86 116 88 123L92 137Q95 144 87 146C80 149 70 150 61 150C32 150 19 135 19 107V62H10Q0 62 0 52V42Q0 32 10 32H19V12Q19 0 30 0Z', transform: 'translate(954 344) scale(1.32258065 1.32)' } },
  { tone: 'gold', tag: 'path', attrs: { d: 'M1147 448A47 46.5 0 1 1 1147 541A47 46.5 0 1 1 1147 448Z' } },
];
