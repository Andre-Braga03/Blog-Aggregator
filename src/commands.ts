import {setUser, type CommandHandler } from "./config.js"

export type CommandsRegistry = Record<string, CommandHandler>;

export function handlerLogin(cmdName: string, ...args: string[]) : void{
    if(args.length === 0){
        throw new Error("Login requires a username only.");
    
    }
    const userName = args[0];
    setUser(userName);
    console.log(`Logged in as ${userName}.`);
}

export function registerCommand(registry: CommandsRegistry,
    cmd: string, 
    handler: CommandHandler
   ){
       registry[cmd] = handler;    
}

export function runCommand(
   registry: CommandsRegistry,
   cmdName: string,
   ...args: string[]
)  {
   const handler = registry[cmdName];

   if(!handler){
       throw new Error(`Unknown command: ${cmdName}`);
   }

   handler(cmdName, ...args);
}