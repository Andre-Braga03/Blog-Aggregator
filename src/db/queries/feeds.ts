import { db } from "..";
import { feeds } from "../schema";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, user_id: userId })
    .returning();
  return result;
}

export async function getAllFeeds() {
  return await db
  .select()
  .from(feeds)
  .innerJoin(users, eq(feeds.user_id, users.id));
}

export async function getFeedByUrl(url: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.url, url)).limit(1);
  return result;
}

export async function getFeedById(id: string) {
  const [result] = await db.select().from(feeds).where(eq(feeds.id, id)).limit(1);
  return result;
}