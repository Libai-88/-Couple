import fs from "fs";
import path from "path";

export function validateId(id: string) {
  return id && !id.includes("..") && !id.includes("/") && !id.includes("\\");
}

export function agentExists(engine: any, id: string) {
  return fs.existsSync(path.join(engine.agentsDir, id, "config.yaml"));
}
