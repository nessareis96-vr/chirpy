import { db } from "../index.js";
import { chirps } from "../schema.js";
import type { NewChirp } from "../schema.js";
import { and, asc, eq } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();

  return result;
}

export async function getAllChirps(authorId?: string) {
  return await db
    .select()
    .from(chirps)
    .where(
      authorId !== undefined
        ? eq(chirps.userId, authorId)
        : undefined,
    )
    .orderBy(asc(chirps.createdAt));
}

export async function getChirpById(chirpId: string) {
  const [chirp] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, chirpId))
    .limit(1);

  return chirp;
}
export async function deleteChirp(chirpId: string, userId: string) {
  const [deletedChirp] = await db
    .delete(chirps)
    .where(
      and(
        eq(chirps.id, chirpId),
        eq(chirps.userId, userId),
      ),
    )
    .returning({ id: chirps.id });

  return deletedChirp;
}