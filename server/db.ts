import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { decisionRecords, decisionVotes, InsertDecisionRecord, InsertUser, sharedDecisionMembers, sharedDecisions, users } from "../drizzle/schema";
import { MAX_DECISION_HISTORY } from "../shared/decision";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createDecisionRecord(record: InsertDecisionRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.insert(decisionRecords).values(record);
}

export async function getRecentDecisionRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(decisionRecords)
    .where(eq(decisionRecords.userId, userId))
    .orderBy(desc(decisionRecords.createdAt), desc(decisionRecords.id))
    .limit(MAX_DECISION_HISTORY);
}

export async function createSharedDecision(input: typeof sharedDecisions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(sharedDecisions).values(input);
  return Number(result[0].insertId);
}

export async function getSharedDecisionByCode(shareCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(sharedDecisions).where(eq(sharedDecisions.shareCode, shareCode)).limit(1);
  return rows[0];
}

export async function getDecisionVotes(sharedDecisionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(decisionVotes).where(eq(decisionVotes.sharedDecisionId, sharedDecisionId));
}

export async function addSharedDecisionMember(sharedDecisionId: number, userId: number, role: "creator" | "member" = "member") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(sharedDecisionMembers).values({ sharedDecisionId, userId, role }).onDuplicateKeyUpdate({ set: { role } });
}

export async function getSharedDecisionMembers(sharedDecisionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sharedDecisionMembers).where(eq(sharedDecisionMembers.sharedDecisionId, sharedDecisionId));
}

export async function castDecisionVote(sharedDecisionId: number, userId: number, optionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(decisionVotes).values({ sharedDecisionId, userId, optionId }).onDuplicateKeyUpdate({ set: { optionId, updatedAt: new Date() } });
}

export async function resolveSharedDecision(sharedDecisionId: number, finalOptionId: string, finalReason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(sharedDecisions).set({ status: "resolved", finalOptionId, finalReason, resolvedAt: new Date() }).where(eq(sharedDecisions.id, sharedDecisionId));
}
