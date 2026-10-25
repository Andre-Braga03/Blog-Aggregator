import { db } from "..";
import { eq, and } from "drizzle-orm";
import { feedFollows } from "../schema";
import { getFeedByUrl } from "./feeds";

export async function createFeedFollow(userId: string, feedId: string) {
    const [result] = await db.insert(feedFollows).values({
        user_id: userId,
        feed_id: feedId,
    }).returning();
    return result;
}

export async function getFeedFollowsForUser(userId: string) {
    return await db.select().from(feedFollows).where(eq(feedFollows.user_id, userId));
}

export async function unfollowFeed(userId: string, feedUrl: string) {
    const feed = await getFeedByUrl(feedUrl);
    if(!feed){
        throw new Error("feed does not exist.");
    }
    return await db.delete(feedFollows).where(and(eq(feedFollows.user_id, userId), eq(feedFollows.feed_id, feed.id)));
}