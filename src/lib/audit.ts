import { supabase } from './supabase';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  changes: Record<string, unknown>;
  createdAt: number;
}

export async function fetchAuditLog(limit = 300): Promise<AuditEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[supabase] audit_log.select', error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    actorEmail: (r.actor_email as string) ?? null,
    action: r.action as AuditAction,
    entityType: r.entity_type as string,
    entityId: r.entity_id as string,
    entityLabel: (r.entity_label as string) ?? null,
    changes: (r.changes as Record<string, unknown>) ?? {},
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}
