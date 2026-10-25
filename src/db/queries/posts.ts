import { db } from "..";
import { feedFollows, posts } from "../schema";
import { eq, sql } from "drizzle-orm";
import { feeds} from "../schema";
import { and } from "drizzle-orm";

export async function createPost(
    feedId: string,
    title: string,
    url: string,
    description: string | null,
    publishedAt: Date | null,
  ) {
    const [result] = await db
      .insert(posts)
      .values({
        feed_id: feedId,
        title,
        url,
        description,
        publishedAt,
      })
      .onConflictDoNothing()
      .returning();
    return result;
  }

export async function getPostsForUser(userId: string, limit: number) {
    return await db
      .select()
      .from(posts)
      .innerJoin(feedFollows, eq(posts.feed_id, feedFollows.feed_id))
      .where(eq(feedFollows.user_id, userId))
      .orderBy(sql`${posts.publishedAt} DESC NULLS LAST`)
      .limit(limit);
  }