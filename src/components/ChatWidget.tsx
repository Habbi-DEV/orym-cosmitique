import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X, Loader2, Sparkles } from 'lucide-react';
import { askAssistant, isChatConfigured, type ChatMessage } from '../lib/chat';
import { useKeyboardOpen } from '../lib/useKeyboardOpen';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'أهلاً 👋 أنا مساعدة ORYAM. كيف يمكنني مساعدتك اليوم؟ (اسألني عن منتج، توصيل، أو أي استفسار)',
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const keyboardOpen = useKeyboardOpen();

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  if (!isChatConfigured) return null; // pas de clé/URL configurée → widget masqué
  // Le bouton flottant (fermé) se superpose aux champs d'un formulaire
  // ailleurs sur la page quand le clavier s'ouvre — on le masque tant que
  // le clavier est ouvert. Le panneau lui-même (une fois ouvert) reste
  // affiché normalement : son propre champ de saisie ouvre le clavier et
  // c'est le comportement attendu.
  if (keyboardOpen && !open) return null;

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
        content: res.ok ? res.reply : "عذراً، حدث خطأ. حاول مرة أخرى أو تواصل معنا مباشرة.",
      },
    ]);
  };

  return (
    <div className="fixed bottom-24 right-4 z-[90] md:bottom-8 md:right-8">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="mb-3 flex h-[70vh] max-h-[520px] w-[92vw] max-w-[360px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            dir="rtl"
          >
            <div className="flex items-center justify-between bg-ink px-4 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blush" />
                <p className="font-serif text-[15px] font-bold">مساعدة ORYAM</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/10">
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
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-2xl"
        aria-label="Ouvrir le chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
}
