import { db } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'activate' | 'deactivate';

/**
 * Logs an audit event to the `audit_logs` Firestore collection.
 * Call this after any mutating operation.
 */
export async function logAudit(
  action: AuditAction,
  targetCollection: string,
  targetId: string,
  actorUid: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await db.collection('audit_logs').add({
      action,
      targetCollection,
      targetId,
      actorUid,
      meta: meta || {},
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    // Non-blocking — audit failures should not break the main operation
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
