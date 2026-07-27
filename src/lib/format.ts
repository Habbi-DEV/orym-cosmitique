export const formatDA = (n: number): string =>
  `${n.toLocaleString('fr-FR').replace(/\p{Zs}/gu, ' ')} DA`;

export const scrollToId = (id: string): void => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export const promoPercent = (price: number, oldPrice?: number): number | null => {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
};
