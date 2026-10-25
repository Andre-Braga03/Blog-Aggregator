import {readConfig, setUser, type CommandHandler } from "./config.js"
import { createUser,getUser,resetDB, getAllUsers } from "./db/queries/users.js";
import { fetchRSSFeed } from "./rss.js";
import { createFeed, getAllFeeds, getFeedByUrl, getFeedById, getNextFeedsToFetch, markFeedFetched } from "./db/queries/feeds.js";
import { Feed, User } from "./db/schema.js";
import { createFeedFollow, getFeedFollowsForUser, unfollowFeed } from "./db/queries/FeedsAndUsers.js";
import { isEmpty } from "postgre";
import { createPost, getPostsForUser } from "./db/queries/posts.js";

export type CommandsRegistry = Record<string, CommandHandler>;
type UserCommandHandler = (
    cmdName: string,
    user: User,
    ...args: string[]
  ) => Promise<void>;

  export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
    return async (cmdName: string, ...args: string[]) => {
      const user = await getUser(readConfig().currentUserName);
      if (!user) {
        throw new Error("current user does not exist.");
      }
      await handler(cmdName, user, ...args);
    };
  }

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if(args.length === 0){
        throw new Error("Login requires a username only.");
    
    }
    const userName = args[0];
    const existing = await getUser(userName);
    if(!existing){
        throw new Error(`User ${userName} does not exist.`);
    }
    setUser(userName);
    console.log(`Logged in as ${userName}.`);
}

export async function handlerRegister(cmdName: string, ...args: string[]){
    if(args.length === 0){
        throw new Error("Register requires a username only.");
    }
    const userName = args[0];
    const existing = await getUser(userName);
    if(existing){
        throw new Error(`User ${userName} already exists.`);
    }
    const user = await createUser(userName);
    setUser(userName);
    console.log(`User ${userName} was created.`);
    console.log(user);
}

export async function handlerReset(){
    const response = await resetDB();
    console.log(response);
    console.log("Database reset.");
}

export async function handlerList(){
    const allUsers = await getAllUsers();
    const currentUser = readConfig().currentUserName;

    for(const user of allUsers){
        if(user.name === currentUser){
            console.log(`* ${user.name} (current)`);
        } else {
            console.log(`* ${user.name}`);
        }
    }
}

function parsePublishedAt(raw: string | undefined): Date | null {
    if(!raw){
        return null;
    }
    const date = new Date(raw);
    if(Number.isNaN(date.getTime())){
        return null;
    }
    return date;
}
function parseDuration(duration: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = duration.match(regex);
    if(!match){
        throw new Error(`invalid duration`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    switch(unit){
        case "ms":
            return value;
        case "s":
            return value * 1000;
        case "m":
            return value * 60 * 1000;
        default: 
            return value * 60 * 60 * 1000;
    }
}

function handleError(error: unknown){
    console.error(error);
}
export async function handlerAgg(cmdName: string, ...args: string[]){
   if(args.length < 1){
    throw new Error ("agg requires a time between requests");
   }
   const timeBetweenRequests = parseDuration(args[0]);
   console.log(`Collecting feeds every ${args[0]}`);

   scrapeFeeds().catch(handleError);

   const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
   }, timeBetweenRequests);

   await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
        console.log("Shuttind down feed aggregator...");
        clearInterval(interval);
        resolve();
    });
   });
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]){
    if(args.length < 2){
        throw new Error("addfeed requieres a name and a url.");
}

    const name = args[0];
    const url = args[1];
    const feed = await createFeed(name, url, user.id);
    await createFeedFollow(user.id, feed.id);
    console.log(` ${feed.name} ${user.name}`);
}

export async function handlerFeeds(){
    const rows = await getAllFeeds();
    for(const row of rows){
        printFeed(row.feeds, row.users);
    }
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]){
    if(args.length < 1){
        throw new Error("follow requires a url.");
    }

 const url = args[0];
 const feed = await getFeedByUrl(url);
 if(!feed){
    throw new Error("feed does not exist.");
 }

 await createFeedFollow(user.id, feed.id);
 console.log(` ${feed.name}`);
 console.log(` ${user.name}`);

}

export async function handlerFollowing(cmdName: string, user: User){
    const feedFollows = await getFeedFollowsForUser(user.id);
    for(const feedFollow of feedFollows){
        const feedName = await getFeedById(feedFollow.feed_id);
        console.log(`${feedName.name}`);
    }
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]){
    if(args.length < 1){
        throw new Error("unfollow requires a url.");
    }
    const url = args[0];
    await unfollowFeed(user.id, url);
    console.log(`${url}`);
    console.log(`${user.name}`);
}


export async function handlerBrowse(cmdName: string, user: User, ...args: string[]){
    let limit = 2;
    if(args[0]){
        limit = Number(args[0]);
    }

    const rows = await getPostsForUser(user.id, limit);
    for(const row of rows){
        console.log(row.posts.title);
        console.log(row.posts.url);
        console.log(row.posts.publishedAt)
    }
}

export async function scrapeFeeds(){
    const next = await getNextFeedsToFetch();
    if(!next){
        console.log("No feeds to fetch.");
        return;
    }
    const rss = await fetchRSSFeed(next.url);
    await markFeedFetched(next.id);
    for(const item of rss.channel.item){
        if(!item.title || !item.link) continue;
        await createPost(
            next.id,
            item.title,
            item.link,
            item.description ?? null,
            parsePublishedAt(item.pubDate)
        )
    }
}

export function registerCommand(registry: CommandsRegistry,
    cmd: string, 
    handler: CommandHandler
   ){
       registry[cmd] = handler;    
}

export async function runCommand(
   registry: CommandsRegistry,
   cmdName: string,
   ...args: string[]
)  {
   const handler = registry[cmdName];

   if(!handler){
       throw new Error(`Unknown command: ${cmdName}`);
   }

   await handler(cmdName, ...args);
}

function printFeed(feed: Feed, user: User) {
    console.log(`* ID:      ${feed.id}`);
    console.log(`* Created: ${feed.createdAt}`);
    console.log(`* Updated: ${feed.updatedAt}`);
    console.log(`* Name:    ${feed.name}`);
    console.log(`* URL:     ${feed.url}`);
    console.log(`* User:    ${user.name}`);
  }