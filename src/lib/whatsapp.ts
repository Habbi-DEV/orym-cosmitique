// ⚠️ Remplacez par le numéro WhatsApp réel de la boutique
// Format international, sans "+", sans espaces (ex. 213555000000)
export const WHATSAPP_NUMBER = '213555000000';

export function getWhatsAppUrl(message?: string): string {
  const text = encodeURIComponent(
    message ?? 'Bonjour ORYAM Cosmetics, j’ai une question ✨',
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
