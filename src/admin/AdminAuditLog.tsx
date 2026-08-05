import { useEffect, useMemo, useState } from 'react';
import { History, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { fetchAuditLog, rowToAuditEntry, type AuditEntry, type AuditAction } from '../lib/audit';
import { supabase } from '../lib/supabase';

const ACTION_META: Record<AuditAction, { icon: React.ElementType; chip: string; label: string }> = {
  create: { icon: Plus, chip: 'bg-stock-soft text-stockgreen', label: 'Création' },
  update: { icon: Pencil, chip: 'bg-blue-100 text-blue-700', label: 'Modification' },
  delete: { icon: Trash2, chip: 'bg-red-100 text-navred', label: 'Suppression' },
};

const ENTITY_LABELS: Record<string, string> = {
  commande: 'Commande',
  produit: 'Produit',
  promotion: 'Promotion',
};

function ChangesSummary({ changes }: { changes: Record<string, unknown> }) {
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-neutral-500">
      {entries.map(([k, v]) => (
        <span key={k}>
          <span className="font-medium text-neutral-400">{k.replace(/_/g, ' ')}:</span> {String(v)}
        </span>
      ))}
    </div>
  );
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<'tous' | string>('tous');

  useEffect(() => {
    fetchAuditLog().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  // Temps réel : chaque nouvelle ligne d'audit (créée par les triggers SQL
  // dès qu'un produit/une commande/une promo est modifié, y compris depuis
  // un autre poste admin) apparaît en tête de liste immédiatement — l'audit
  // log n'est jamais modifié ni supprimé après coup, donc INSERT suffit.
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('admin-audit-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        (payload) => {
          const incoming = rowToAuditEntry(payload.new as Record<string, unknown>);
          setEntries((prev) => (prev.some((e) => e.id === incoming.id) ? prev : [incoming, ...prev]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const matchQ =
        !q ||
        (e.entityLabel ?? '').toLowerCase().includes(q) ||
        (e.actorEmail ?? '').toLowerCase().includes(q);
      const matchE = entityFilter === 'tous' || e.entityType === entityFilter;
      return matchQ && matchE;
    });
  }, [entries, query, entityFilter]);

  const entityTypes = useMemo(() => [...new Set(entries.map((e) => e.entityType))], [entries]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">Traçabilité</p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Journal d'audit
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          Qui a changé quoi, et quand — commandes, produits et promotions.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un élément, un email…"
            className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-blush"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setEntityFilter('tous')}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              entityFilter === 'tous' ? 'bg-ink text-white' : 'bg-cream text-neutral-500'
            }`}
          >
            Tout
          </button>
          {entityTypes.map((t) => (
            <button
              key={t}
              onClick={() => setEntityFilter(t)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                entityFilter === t ? 'bg-ink text-white' : 'bg-cream text-neutral-500'
              }`}
            >
              {ENTITY_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-400">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <History size={28} className="text-neutral-300" />
          <p className="text-[13.5px] text-neutral-400">Aucune activité pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const meta = ACTION_META[e.action];
            const Icon = meta.icon;
            return (
              <div key={e.id} className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white p-3.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.chip}`}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-[13px] font-bold text-ink">
                      {meta.label} · {ENTITY_LABELS[e.entityType] ?? e.entityType}
                    </p>
                    <span className="truncate text-[12.5px] text-neutral-500">{e.entityLabel}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-neutral-400">
                    {e.actorEmail ?? 'Système'} ·{' '}
                    {new Date(e.createdAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <ChangesSummary changes={e.changes} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
