import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X, Loader2, Sparkles } from 'lucide-react';
import { askAssistant, isChatConfigured, type ChatMessage } from '../lib/chat';
import { getWhatsAppUrl } from '../lib/whatsapp';
import { useKeyboardOpen } from '../lib/useKeyboardOpen';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'أهلاً 👋 أنا مساعدة ORYAM. كيف يمكنني مساعدتك اليوم؟ (اسألني عن منتج، توصيل، أو أي استفسار)',
};

/** Icône WhatsApp (trait officiel) */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="18" height="18" fill="#fff" aria-hidden="true">
      <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.223.6 4.306 1.646 6.096L3 29l8.104-2.593A12.93 12.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm7.53 18.36c-.32.9-1.58 1.65-2.59 1.87-.7.15-1.61.27-4.68-1.01-3.93-1.63-6.46-5.62-6.66-5.88-.19-.26-1.6-2.13-1.6-4.07 0-1.94.99-2.9 1.35-3.29.32-.35.7-.44.93-.44.23 0 .47 0 .67.01.22.01.5-.08.78.6.32.78 1.08 2.7 1.17 2.9.1.19.16.42.03.68-.13.26-.2.42-.4.65-.2.23-.42.51-.6.69-.2.19-.4.4-.18.79.23.4 1.02 1.68 2.18 2.72 1.5 1.34 2.76 1.76 3.16 1.96.4.19.63.16.86-.1.23-.26.98-1.14 1.24-1.54.26-.4.52-.33.87-.2.35.13 2.24 1.06 2.63 1.25.39.19.65.29.74.46.1.16.1.94-.21 1.84Z" />
    </svg>
  );
}

/** Mini icône robot pour le sous-bouton "assistant" */
function AiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9FC0FF" strokeWidth={1.6} aria-hidden="true">
      <rect x="5" y="8" width="14" height="10" rx="4" />
      <circle cx="9.5" cy="13" r="1.1" fill="#9FC0FF" stroke="none" />
      <circle cx="14.5" cy="13" r="1.1" fill="#9FC0FF" stroke="none" />
      <path d="M12 8V5" />
      <circle cx="12" cy="3.6" r="1.1" fill="#9FC0FF" stroke="none" />
    </svg>
  );
}

/** Tête de robot luxe — design "casque / visor" (option B validée) */
function LuxeRobotHead() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
      <defs>
        <linearGradient id="fc-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5F7FA" />
          <stop offset="45%" stopColor="#C9D3E0" />
          <stop offset="100%" stopColor="#5A6578" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="21" r="16" fill="none" stroke="#3E7BFA" strokeWidth={0.8} opacity={0.5} />
      <rect x="11" y="12" width="26" height="20" rx="9" fill="url(#fc-metal)" stroke="#0B0E13" strokeWidth={1.2} />
      <path d="M13 16c3-3 19-3 22 0" stroke="#0B0E13" strokeWidth={1} opacity={0.4} fill="none" />
      <line x1="18" y1="12" x2="17" y2="6" stroke="#0B0E13" strokeWidth={1.4} />
      <circle cx="16.6" cy="5" r="1.4" fill="#3E7BFA" />
      <line x1="30" y1="12" x2="31" y2="6" stroke="#0B0E13" strokeWidth={1.4} />
      <circle cx="31.4" cy="5" r="1.4" fill="#3E7BFA" />
      <rect x="16" y="19" width="16" height="5" rx="2.5" fill="#0B0E13" />
      <rect x="17.5" y="20.2" width="5" height="2.6" rx="1.3" fill="#3E7BFA" />
      <rect x="25.5" y="20.2" width="5" height="2.6" rx="1.3" fill="#3E7BFA" />
      <path d="M19 30.5c1.6 1 3.4 1.5 5 1.5s3.4-.5 5-1.5" stroke="#25D366" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  /** Affiche l'option WhatsApp dans le dock (masquée ex. sur les landing pages) */
  showWhatsApp?: boolean;
};

export default function FloatingContact({ showWhatsApp = true }: Props) {
  const [dockOpen, setDockOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const keyboardOpen = useKeyboardOpen();

  useEffect(() => {
    if (chatOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen, loading]);

  // Ferme le dock (pas le chat) au clic en dehors du widget
  useEffect(() => {
    if (!dockOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setDockOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [dockOpen]);

  const chatAvailable = isChatConfigured;
  // Rien à afficher si ni WhatsApp ni le chat ne sont disponibles sur cette page
  if (!showWhatsApp && !chatAvailable) return null;
  // Le bouton flottant (fermé) se superpose aux champs d'un formulaire ailleurs
  // sur la page quand le clavier s'ouvre — masqué tant qu'aucun panneau n'est ouvert.
  if (keyboardOpen && !chatOpen) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', content: text } as ChatMessage];
    setMessages(next);
    setInput('');
    setLoading(true);
    const res = await askAssistant(text, next);
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: res.ok ? res.reply : 'عذراً، حدث خطأ. حاول مرة أخرى أو تواصل معنا مباشرة.',
      },
    ]);
  };

  // Un seul sous-canal disponible → clic direct sur la tête, sans dock à deux choix
  const singleChannel = showWhatsApp && !chatAvailable ? 'whatsapp' : !showWhatsApp && chatAvailable ? 'chat' : null;

  const handleMainClick = () => {
    if (singleChannel === 'whatsapp') {
      window.open(getWhatsAppUrl(), '_blank', 'noreferrer');
      return;
    }
    if (singleChannel === 'chat') {
      setChatOpen((v) => !v);
      return;
    }
    setDockOpen((v) => !v);
  };

  return (
    <>
      {/* Fond derrière le panneau de chat ouvert — masque le reste de la page
          (barre du bas, contenu…) au lieu de le laisser "percer" derrière le
          panneau quand le clavier s'ouvre sur son propre champ de saisie
          (bug WebKit connu : un élément position:fixed contenant un champ
          actif peut se désaligner de la mise en page au moment où le
          clavier apparaît). Un vrai fond opaque évite que ce glissement
          soit visible. */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div ref={wrapRef} className="fixed bottom-24 right-4 z-[90] md:bottom-8 md:right-8" dir="rtl">
        {/* Panneau de chat */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="mb-3 flex h-[70vh] max-h-[520px] w-[92vw] max-w-[360px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between bg-ink px-4 py-3.5 text-white">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blush" />
                  <p className="font-serif text-[15px] font-bold">مساعدة ORYAM</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="rounded-full p-1 hover:bg-white/10" aria-label="إغلاق">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-cream px-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        m.role === 'user' ? 'bg-white text-ink' : 'bg-blush text-white'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-1.5 rounded-2xl bg-blush/80 px-3.5 py-2.5 text-white">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="اكتب سؤالك هنا…"
                  className="flex-1 rounded-full bg-cream px-4 py-2.5 text-[13px] outline-none placeholder:text-ink/40"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
                  aria-label="إرسال"
                >
                  <Send size={15} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dock : sous-boutons WhatsApp + Assistant (uniquement si les deux canaux sont disponibles) */}
        <div className="relative h-14 w-14">
          {!singleChannel && (
            <>
              <motion.a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                aria-label="Discuter sur WhatsApp"
                initial={false}
                animate={
                  dockOpen
                    ? { opacity: 1, scale: 1, y: -78, x: 2, pointerEvents: 'auto' }
                    : { opacity: 0, scale: 0.3, y: 0, x: 0, pointerEvents: 'none' }
                }
                transition={{ type: 'spring', stiffness: 400, damping: 26, delay: dockOpen ? 0.04 : 0 }}
                className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] shadow-xl"
              >
                <WhatsAppIcon />
              </motion.a>

              <motion.button
                type="button"
                aria-label="فتح المساعدة الذكية"
                initial={false}
                animate={
                  dockOpen
                    ? { opacity: 1, scale: 1, y: -52, x: -58, pointerEvents: 'auto' }
                    : { opacity: 0, scale: 0.3, y: 0, x: 0, pointerEvents: 'none' }
                }
                transition={{ type: 'spring', stiffness: 400, damping: 26, delay: dockOpen ? 0.1 : 0 }}
                onClick={() => {
                  setDockOpen(false);
                  setChatOpen(true);
                }}
                className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border border-[#3E7BFA]/60 bg-ink shadow-xl"
              >
                <AiIcon />
              </motion.button>
            </>
          )}

          {/* Tête de robot — bouton principal */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            animate={{ rotate: dockOpen || chatOpen ? 90 : 0 }}
            onClick={handleMainClick}
            aria-label="تواصل معنا"
            className="absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
            style={{
              background: 'linear-gradient(155deg, #F5F7FA, #C9D3E0 45%, #151A22)',
              boxShadow: '0 8px 22px rgba(62,123,250,.3), 0 3px 8px rgba(0,0,0,.6)',
            }}
          >
            {!dockOpen && !chatOpen && (
              <span className="absolute inset-0 animate-ping rounded-full border border-[#9FC0FF]/60" />
            )}
            {chatOpen ? <X size={22} className="text-ink" /> : <LuxeRobotHead />}
          </motion.button>
        </div>
      </div>
    </>
  );
}
