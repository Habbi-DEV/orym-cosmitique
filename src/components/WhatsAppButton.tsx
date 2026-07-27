import { getWhatsAppUrl } from '../lib/whatsapp';

export default function WhatsAppButton() {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Discuter sur WhatsApp"
      className="fixed bottom-24 left-4 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-xl transition hover:scale-105 active:scale-95 md:bottom-8 md:left-8"
    >
      <svg viewBox="0 0 32 32" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.223.6 4.306 1.646 6.096L3 29l8.104-2.593A12.93 12.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm7.53 18.36c-.32.9-1.58 1.65-2.59 1.87-.7.15-1.61.27-4.68-1.01-3.93-1.63-6.46-5.62-6.66-5.88-.19-.26-1.6-2.13-1.6-4.07 0-1.94.99-2.9 1.35-3.29.32-.35.7-.44.93-.44.23 0 .47 0 .67.01.22.01.5-.08.78.6.32.78 1.08 2.7 1.17 2.9.1.19.16.42.03.68-.13.26-.2.42-.4.65-.2.23-.42.51-.6.69-.2.19-.4.4-.18.79.23.4 1.02 1.68 2.18 2.72 1.5 1.34 2.76 1.76 3.16 1.96.4.19.63.16.86-.1.23-.26.98-1.14 1.24-1.54.26-.4.52-.33.87-.2.35.13 2.24 1.06 2.63 1.25.39.19.65.29.74.46.1.16.1.94-.21 1.84Z" />
      </svg>
    </a>
  );
}
