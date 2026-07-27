import { useState, type FormEvent } from 'react';
import { Gift, Copy, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { useStore } from '../context/StoreContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getWhatsAppUrl } from '../lib/whatsapp';

export default function LoyaltyPage() {
  const { showToast } = useStore();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const shareMessage = code
    ? `Bonjour ! Je te recommande ORYAM Cosmetics ✨ Utilise mon code ${code} pour -500 DA sur ta première commande : ${window.location.origin}`
    : '';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 8) {
      setError('Merci d’entrer un numéro de téléphone valide.');
      return;
    }
    setError(null);
    setLoading(true);

    if (!supabase || !isSupabaseConfigured) {
      setError('Ce service n’est pas disponible pour le moment.');
      setLoading(false);
      return;
    }

    const { data: codeData, error: codeErr } = await supabase.rpc('get_or_create_referral_code', {
      p_phone: phone,
    });
    if (codeErr) {
      setError(codeErr.message || 'Une erreur est survenue.');
      setLoading(false);
      return;
    }
    const { data: summary } = await supabase.rpc('get_loyalty_summary', { p_phone: phone });
    const row = Array.isArray(summary) ? summary[0] : summary;

    setCode(codeData as string);
    setPoints(Number(row?.points ?? 0));
    setLoading(false);
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    showToast('Code copié !');
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">Parrainage</p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Partagez, <span className="italic text-blush">gagnez</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-neutral-500">
            Offrez 500 DA à vos amies dès leur première commande, et gagnez 200 points à chaque
            parrainage livré.
          </p>
        </div>

        {!code ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Votre numéro de téléphone"
              className="w-full rounded-full border border-black/10 bg-white px-5 py-3.5 text-center text-sm font-medium outline-none transition focus:border-blush"
            />
            {error && <p className="text-center text-[12.5px] font-medium text-navred">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              <Gift size={15} />
              Obtenir mon code
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-black/8 bg-white p-6 text-center shadow-sm">
            <Sparkles size={22} className="mx-auto text-blush" />
            <p className="mt-2 text-[12.5px] font-semibold text-neutral-500">Votre code personnel</p>
            <div className="mx-auto mt-3 flex max-w-[240px] items-center justify-between rounded-xl border border-dashed border-blush/40 bg-blush-soft px-4 py-3">
              <span className="font-serif text-xl font-bold tracking-widest text-ink">{code}</span>
              <button onClick={copyCode} aria-label="Copier" className="text-blush transition hover:text-blush-dark">
                <Copy size={18} />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="rounded-full bg-stock-soft px-3 py-1 text-[12.5px] font-bold text-stockgreen">
                {points} point{points > 1 ? 's' : ''} gagné{points > 1 ? 's' : ''}
              </span>
            </div>

            <a
              href={getWhatsAppUrl(shareMessage)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <MessageCircle size={16} />
              Partager sur WhatsApp
            </a>
            <p className="mt-4 text-[11.5px] leading-relaxed text-neutral-400">
              Chaque ami(e) qui commande avec ce code obtient -500 DA. Vous gagnez 200 points dès
              que sa commande est livrée.
            </p>
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
