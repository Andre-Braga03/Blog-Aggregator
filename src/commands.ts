import {readConfig, setUser, type CommandHandler } from "./config.js"
import { createUser,getUser,resetDB, getAllUsers } from "./db/queries/users.js";
import { fetchRSSFeed } from "./rss.js";
import { createFeed, getAllFeeds, getFeedByUrl, getFeedById } from "./db/queries/feeds.js";
import { Feed, User } from "./db/schema.js";
import { createFeedFollow, getFeedFollowsForUser, unfollowFeed } from "./db/queries/FeedsAndUsers.js";

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


export async function handlerAgg(cmdName: string, ...args: string[]){
    const feed = await fetchRSSFeed("https://www.wagslane.dev/index.xml");
    console.log(JSON.stringify(feed, null, 2));
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