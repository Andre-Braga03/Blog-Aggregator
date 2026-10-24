import {readConfig, setUser, type CommandHandler } from "./config.js"
import { createUser,getUser,resetDB, getAllUsers } from "./db/queries/users.js";

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