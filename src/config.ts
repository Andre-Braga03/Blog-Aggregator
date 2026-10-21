import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
    dbUrl: string;
    currentUserName: string;
}

export function setUser(userName: string) {
    const cfg = readConfig();
    cfg.currentUserName = userName;
    writeConfig(cfg);
}

export function readConfig(): Config{
    const cfg = JSON.parse(fs.readFileSync(getConfigfilePath(), "utf8"));
    return validateConfig(cfg);
}

function getConfigfilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg : Config) : void{
    const raw = {
        db_url: cfg.dbUrl,
        current_user_name: cfg.currentUserName,
    }
    fs.writeFileSync(getConfigfilePath(), JSON.stringify(raw, null, 2));
}

function validateConfig(cfg : any) : Config{
    if(typeof cfg.db_url !== "string"){
        throw new Error("db_url must be a string");
    }
    return {
        dbUrl: cfg.db_url,
        currentUserName: cfg.current_user_name ?? "",
      };
}