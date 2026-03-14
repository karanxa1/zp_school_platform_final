import { db } from '../config/firebase-admin';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

// Generic paginated query helper
export async function getPaginated(
  collectionPath: string,
  filters: Record<string, unknown> = {},
  page = 1,
  limit = 20
) {
  let query: FirebaseFirestore.Query = db.collection(collectionPath);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      query = query.where(key, '==', value);
    }
  });

  const snapshot = await query.get();
  const total = snapshot.size;
  const start = (page - 1) * limit;
  const docs = snapshot.docs.slice(start, start + limit).map(d => ({ id: d.id, ...d.data() }));

  return { data: docs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Audit logging
export async function logAudit(params: {
  actorUid: string;
  actorRole: string;
  action: 'created' | 'updated' | 'deleted';
  targetCollection: string;
  targetDocId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}) {
  if (env.NODE_ENV === 'test') return;
  try {
    const logId = uuidv4();
    await db.collection('audit_logs').doc(logId).set({
      logId,
      ...params,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export { db };
