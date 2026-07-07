#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";
import { parseCliArgs, helpText } from "./args.ts";
import { resolveConnection } from "./local-server.ts";
import { HanaCliClient } from "./client.ts";
import { printSessions, printStatus, startChat } from "./chat.ts";
import { spawnServerForeground, startLocalServerAndWait } from "./server-runner.ts";
import { ansi } from "./terminal-theme.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

export async function main(argv: string[] = process.argv.slice(2)) {
  let args;
  try {
    args = parseCliArgs(argv);
  } catch (err) {
    console.error(`${ansi.red}${(err as Error).message}${ansi.reset}`);
    console.log(helpText());
    return 1;
  }

  if (args.command === "help") {
    if ("error" in args) console.error(`${ansi.yellow}${args.error}${ansi.reset}\n`);
    console.log(helpText());
    return "error" in args ? 1 : 0;
  }

  // After help check, args is the full result type (not the error case)
  const parsedArgs = args as { command: string; plain: boolean; url: string | null; token: string | null; session: string | null; target: string | null; passthrough: string[] };

  if (parsedArgs.command === "serve") {
    spawnServerForeground({ projectRoot: PROJECT_ROOT, extraArgs: parsedArgs.passthrough });
    return 0;
  }

  let connection: ReturnType<typeof resolveConnection> = resolveConnection({ url: parsedArgs.url || undefined, token: parsedArgs.token || undefined });
  if (!connection.ok && shouldAutoStartServer(parsedArgs)) {
    console.error(`${ansi.dim}Starting local Couple Server...${ansi.reset}`);
    connection = await startLocalServerAndWait({ projectRoot: PROJECT_ROOT });
  }
  if (!connection.ok) {
    console.error(`${ansi.red}${("message" in connection ? connection.message : "Connection failed")}${ansi.reset}`);
    console.error(`${ansi.dim}Start one with: hana serve${ansi.reset}`);
    return 1;
  }

  // After ok check, connection has baseUrl and token
  const okConnection = connection as { ok: true; baseUrl: string; token: string; source: string; queryTokenAllowed: boolean };
  const client = new HanaCliClient(okConnection);
  if (parsedArgs.command === "status") {
    await printStatus(client, okConnection);
    return 0;
  }
  if (parsedArgs.command === "sessions") {
    await printSessions(client);
    return 0;
  }
  if (parsedArgs.command === "continue") {
    await startChat(client, okConnection, { target: parsedArgs.target || undefined, plain: parsedArgs.plain });
    return 0;
  }
  if (parsedArgs.command === "chat") {
    await startChat(client, okConnection, { session: parsedArgs.session || undefined, plain: parsedArgs.plain });
    return 0;
  }

  console.log(helpText());
  return 0;
}

function shouldAutoStartServer(args: ReturnType<typeof parseCliArgs>) {
  if ("url" in args && args.url) return false;
  return args.command === "chat" || args.command === "continue";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const code = await main();
  if (code) process.exit(code);
}
