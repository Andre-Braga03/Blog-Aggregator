import { readConfig, setUser } from "./config";
function main() {
  setUser("André");
  const cfg = readConfig();
  console.log(cfg);
}

main();
