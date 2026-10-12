import { describe, expect, it } from 'vitest';
import { leadNumber, sentences, splitEmphasis } from '../src/lib/emphasis';

describe('splitEmphasis', () => {
  it("separa l'ultima parola dalla punteggiatura finale", () => {
    expect(splitEmphasis('Parliamo del tuo progetto.')).toEqual({ lead: 'Parliamo del tuo ', word: 'progetto', tail: '.' });
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

describe('leadNumber', () => {
  it('trova il primo numero', () => {
    expect(leadNumber('Prima call: 20 minuti online')).toBe('20');
    expect(leadNumber('Erstgespräch')).toBeNull();
  });
});

describe('sentences', () => {
  it('divide il testo della call in frasi', () => {
    expect(sentences('Prima. Poi? Infine!')).toEqual(['Prima.', 'Poi?', 'Infine!']);
  });
  it('un testo con una sola frase resta intero, uno vuoto non dà frasi', () => {
    expect(sentences('  Solo questa  ')).toEqual(['Solo questa']);
    expect(sentences('   ')).toEqual([]);
  });
  it('non spezza i numeri con il punto né le abbreviazioni senza spazio', () => {
    expect(sentences('Costa 2.5 mila. Scrivi a info@kint.ch.')).toEqual(['Costa 2.5 mila.', 'Scrivi a info@kint.ch.']);
  });
});
