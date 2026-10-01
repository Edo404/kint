import { describe, expect, it } from 'vitest';
import { leadNumber, splitEmphasis, splitQuote } from '../src/lib/emphasis';

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

describe('splitQuote', () => {
  it('mette in risalto la seconda frase', () => {
    expect(splitQuote('Prima frase. Non nasconde la frattura: la valorizza. Terza. Quarta!')).toEqual({
      intro: 'Prima frase.', quote: 'Non nasconde la frattura: la valorizza.', rest: 'Terza. Quarta!',
    });
  });
  it('con una sola frase non crea citazioni', () => {
    expect(splitQuote('Una frase sola.')).toEqual({ intro: 'Una frase sola.', quote: '', rest: '' });
  });
});

describe('leadNumber', () => {
  it('trova il primo numero', () => {
    expect(leadNumber('Prima call: 20 minuti online')).toBe('20');
    expect(leadNumber('Erstgespräch')).toBeNull();
  });
});
