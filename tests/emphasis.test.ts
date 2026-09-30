import { describe, expect, it } from 'vitest';
import { splitEmphasis } from '../src/lib/emphasis';

describe('splitEmphasis', () => {
  it("separa l'ultima parola dalla punteggiatura finale", () => {
    expect(splitEmphasis('Scrivici due righe.')).toEqual({ lead: 'Scrivici due ', word: 'righe', tail: '.' });
  });
  it('funziona senza punteggiatura', () => {
    expect(splitEmphasis('Cosa facciamo')).toEqual({ lead: 'Cosa ', word: 'facciamo', tail: '' });
  });
  it('tiene gli apostrofi e le lettere accentate nella parola', () => {
    expect(splitEmphasis("Ce qu'on fait !")).toEqual({ lead: "Ce qu'on ", word: 'fait', tail: ' !' });
    expect(splitEmphasis("L'oro dell'artigiano")).toEqual({ lead: "L'oro ", word: "dell'artigiano", tail: '' });
    expect(splitEmphasis('Was wir tun für Sie.')).toEqual({ lead: 'Was wir tun für ', word: 'Sie', tail: '.' });
  });
  it('con una sola parola evidenzia quella', () => {
    expect(splitEmphasis('Kontakt')).toEqual({ lead: '', word: 'Kontakt', tail: '' });
  });
});
