import {readConfig, setUser, type CommandHandler } from "./config.js"
import { createUser,getUser,resetDB, getAllUsers } from "./db/queries/users.js";
import { fetchRSSFeed } from "./rss.js";
import { createFeed, getAllFeeds } from "./db/queries/feeds.js";
import { Feed, User } from "./db/schema.js";

export type CommandsRegistry = Record<string, CommandHandler>;

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

export async function handlerAddFeed(cmdName: string, ...args: string[]){
    if(args.length < 2){
        throw new Error("addfeed requieres a name and a url.");
}

    const name = args[0];
    const url = args[1];
    const user = await getUser(readConfig().currentUserName);
    if(!user){
        throw new Error("current user does not exist.");
    }
    const feed = await createFeed(name, url, user.id);
    printFeed(feed, user);
}

export async function handlerFeeds(){
    const rows = await getAllFeeds();
    for(const row of rows){
        printFeed(row.feeds, row.users);
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