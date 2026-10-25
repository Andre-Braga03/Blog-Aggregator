import { registerCommand, runCommand, type CommandsRegistry } from "./commands.js";
import { handlerLogin, handlerRegister, handlerReset, handlerList } from "./commands.js";
import { handlerAgg, handlerAddFeed , handlerFeeds, handlerFollow, handlerFollowing, handlerUnfollow} from "./commands.js";
import { middlewareLoggedIn } from "./commands.js";
async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerList);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));



  const [cmdName, ...args] = process.argv.slice(2);
  if (!cmdName) {
    console.error("no command provided");
    process.exit(1);
  }
  try{
  await runCommand(registry, cmdName, ...args);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  process.exit(0);
}

main();