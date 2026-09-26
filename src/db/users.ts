import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, avatarUrl?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      // update details if provided
      if (displayName || avatarUrl) {
        const updated = await db.update(users)
          .set({
            email,
            displayName: displayName || existing[0].displayName,
            avatarUrl: avatarUrl || existing[0].avatarUrl,
          })
          .where(eq(users.uid, uid))
          .returning();
        return updated[0];
      }
      return existing[0];
    }

    const inserted = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        avatarUrl: avatarUrl || '',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to get or create user in DB:', error);
    throw new Error('Database user lookup failed', { cause: error });
  }
}
