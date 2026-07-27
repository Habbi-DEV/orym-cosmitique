import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Banknote, Users, Clock, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import { formatDA } from '../lib/format';

interface RawCartRow {
  user_id: string;
  product_slug: string;
  qty: number;
  updated_at: string;
}

interface AbandonedGroup {
  userId: string;
  updatedAt: string;
  items: { name: string; price: number; qty: number }[];
  total: number;
}

// Un panier est considéré « abandonné » s'il n'a pas bougé depuis ce délai
const ABANDON_AFTER_MS = 2 * 60 * 60 * 1000; // 2 heures

function timeAgo(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export default function AdminAbandonedCarts() {
  const { catalog } = useData();
  const [rows, setRows] = useState<RawCartRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) {
      setError('Supabase non configuré.');
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('cart_items')
      .select('user_id, product_slug, qty, updated_at')
      .order('updated_at', { ascending: false });
    if (err) {
      // Cause fréquente : le patch SQL "cart_staff_read" n'a pas encore été exécuté
      setError(err.message);
    } else {
      setRows((data ?? []) as RawCartRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo<AbandonedGroup[]>(() => {
    if (!rows) return [];
    const cutoff = Date.now() - ABANDON_AFTER_MS;
    const byUser = new Map<string, RawCartRow[]>();
    rows.forEach((r) => {
      if (new Date(r.updated_at).getTime() > cutoff) return; // trop récent, pas encore « abandonné »
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r]);
    });

    return [...byUser.entries()]
      .map(([userId, lines]) => {
        const items = lines.map((l) => {
          const product = catalog.find((p) => p.id === l.product_slug);
          return { name: product?.name ?? l.product_slug, price: product?.price ?? 0, qty: l.qty };
        });
        return {
          userId,
          updatedAt: lines.reduce((a, b) => (a > b.updated_at ? a : b.updated_at), lines[0].updated_at),
          items,
          total: items.reduce((s, i) => s + i.price * i.qty, 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [rows, catalog]);

  const kpis = [
    { icon: Users, label: 'Paniers abandonnés', value: String(groups.length), chip: 'bg-red-100 text-navred' },
    {
      icon: Banknote,
      label: 'Valeur totale en jeu',
      value: formatDA(groups.reduce((s, g) => s + g.total, 0)),
      chip: 'bg-blush-soft text-[#8E4254]',
    },
    {
      icon: ShoppingCart,
      label: 'Articles concernés',
      value: String(groups.reduce((s, g) => s + g.items.reduce((n, i) => n + i.qty, 0), 0)),
      chip: 'bg-blue-100 text-blue-700',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">Marketing</p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Paniers abandonnés
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            Visiteurs ayant ajouté des produits sans finaliser leur commande depuis plus de 2 h.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-navred/20 bg-red-50 p-4 text-[13px] text-navred">
          Impossible de charger les paniers : {error}
          <br />
          Vérifiez que le patch <code>supabase/schema-patch-abandoned-carts.sql</code> a bien été exécuté
          (policy de lecture staff sur <code>cart_items</code>).
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {kpis.map(({ icon: Icon, label, value, chip }) => (
          <div
            key={label}
            className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_2px_18px_rgba(12,12,14,0.05)]"
          >
            <div className={`inline-flex rounded-xl p-2 ${chip}`}>
              <Icon size={16} />
            </div>
            <p className="mt-3 text-[22px] font-bold">{value}</p>
            <p className="text-[12px] text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {groups.length === 0 && !loading && (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center text-[13px] text-neutral-500">
            Aucun panier abandonné pour le moment 🎉
          </div>
        )}
        {groups.map((g) => (
          <div
            key={g.userId}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_2px_18px_rgba(12,12,14,0.05)]"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                <Clock size={13} />
                {timeAgo(g.updatedAt)}
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10.5px]">
                  {g.userId.slice(0, 8)}…
                </span>
              </div>
              <p className="font-serif text-lg font-bold">{formatDA(g.total)}</p>
            </div>
            <ul className="space-y-1.5 text-[13px]">
              {g.items.map((it, i) => (
                <li key={i} className="flex justify-between text-neutral-600">
                  <span>
                    {it.qty} × {it.name}
                  </span>
                  <span>{formatDA(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
