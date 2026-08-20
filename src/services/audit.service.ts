import { AppDataSource } from "../config/data-source.js";
import { AuditLogs } from "../models/AuditLogs.js";

export interface AuditEntry {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  meta?: Record<string, unknown> | null;
}

export function logAudit(entry: AuditEntry): void {
  if (!AppDataSource.isInitialized) return;
  const repo = AppDataSource.getRepository(AuditLogs);
  const record = repo.create({
    organizationId: entry.organizationId ?? null,
    actorId: entry.actorId ?? null,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId ?? null,
    meta: entry.meta ?? null,
  });
  repo.save(record).catch(() => {});
}
