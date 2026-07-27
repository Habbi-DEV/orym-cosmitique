import { describe, it, expect } from 'vitest';
import { toCsvString } from '../exportCsv';

describe('toCsvString', () => {
  it('retourne une chaîne vide sans lignes', () => {
    expect(toCsvString([])).toBe('');
  });

  it('génère l’en-tête et les lignes séparées par ;', () => {
    const csv = toCsvString([{ Nom: 'Sérum', Prix: 2850 }]);
    expect(csv).toContain('Nom;Prix');
    expect(csv).toContain('Sérum;2850');
  });

  it('échappe les valeurs contenant un point-virgule ou des guillemets', () => {
    const csv = toCsvString([{ Note: 'Top ; qualité "premium"' }]);
    expect(csv).toContain('"Top ; qualité ""premium"""');
  });

  it('commence par le BOM UTF-8 pour Excel', () => {
    const csv = toCsvString([{ a: 1 }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
