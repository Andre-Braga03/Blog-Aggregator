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
