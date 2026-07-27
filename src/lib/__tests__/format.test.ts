import { describe, it, expect } from 'vitest';
import { formatDA, promoPercent } from '../format';

describe('formatDA', () => {
  it('formate un nombre avec le suffixe DA', () => {
    expect(formatDA(5000)).toBe('5 000 DA');
  });

  it('gère les petits nombres sans séparateur', () => {
    expect(formatDA(500)).toBe('500 DA');
  });

  it('gère zéro', () => {
    expect(formatDA(0)).toBe('0 DA');
  });
});

describe('promoPercent', () => {
  it('calcule le pourcentage de réduction', () => {
    expect(promoPercent(2850, 3500)).toBe(19);
  });

  it('retourne null sans ancien prix', () => {
    expect(promoPercent(2850)).toBeNull();
  });

  it('retourne null si l’ancien prix n’est pas supérieur', () => {
    expect(promoPercent(3500, 3000)).toBeNull();
  });
});
