import { registerCommand, runCommand, handlerLogin, type CommandsRegistry } from "./commands.js";

function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);

  const [cmdName, ...args] = process.argv.slice(2);
  if (!cmdName) {
    console.error("no command provided");
    process.exit(1);
  }

  try{
  runCommand(registry, cmdName, ...args);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();