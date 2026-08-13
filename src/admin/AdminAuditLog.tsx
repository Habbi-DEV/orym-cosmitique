import { useEffect, useMemo, useState } from 'react';
import { History, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { fetchAuditLog, rowToAuditEntry, type AuditEntry, type AuditAction } from '../lib/audit';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LanguageContext';
import type { TranslationKey } from '../lib/translations';

const ACTION_META: Record<AuditAction, { icon: React.ElementType; chip: string; labelKey: TranslationKey }> = {
  create: { icon: Plus, chip: 'bg-stock-soft text-stockgreen', labelKey: 'adminAuditLog.actionCreation' },
  update: { icon: Pencil, chip: 'bg-blue-100 text-blue-700', labelKey: 'adminAuditLog.actionModification' },
  delete: { icon: Trash2, chip: 'bg-red-100 text-navred', labelKey: 'adminAuditLog.actionSuppression' },
};

const ENTITY_LABEL_KEYS: Record<string, TranslationKey> = {
  commande: 'adminAuditLog.entiteCommande',
  produit: 'adminAuditLog.entiteProduit',
  promotion: 'adminAuditLog.entitePromotion',
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
  const { t } = useLang();

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
    // Alias local : TypeScript ne conserve pas le narrowing du `if`
    // ci-dessus à l'intérieur de la fonction de cleanup retournée par
    // useEffect, car `supabase` est un import de module (SupabaseClient |
    // null). `client` est une const locale à cet effet, donc son type
    // non-null reste garanti dans la closure de cleanup.
    const client = supabase;
    const channel = client
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
      void client.removeChannel(channel);
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
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">
          {t('adminAuditLog.tracabilite')}
        </p>
        <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('adminAuditLog.titre')}
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">{t('adminAuditLog.sub')}</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('adminAuditLog.rechercherPlaceholder')}
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
            {t('adminAuditLog.tout')}
          </button>
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setEntityFilter(type)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                entityFilter === type ? 'bg-ink text-white' : 'bg-cream text-neutral-500'
              }`}
            >
              {ENTITY_LABEL_KEYS[type] ? t(ENTITY_LABEL_KEYS[type]) : type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-400">{t('adminAuditLog.chargement')}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center">
          <History size={28} className="text-neutral-300" />
          <p className="text-[13.5px] text-neutral-400">{t('adminAuditLog.aucuneActivite')}</p>
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
                      {t(meta.labelKey)} · {ENTITY_LABEL_KEYS[e.entityType] ? t(ENTITY_LABEL_KEYS[e.entityType]) : e.entityType}
                    </p>
                    <span className="truncate text-[12.5px] text-neutral-500">{e.entityLabel}</span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-neutral-400">
                    {e.actorEmail ?? t('adminAuditLog.systeme')} ·{' '}
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
