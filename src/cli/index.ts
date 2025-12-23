import path from "node:path";

import { Command } from "commander";

import { startChatServer, type ChatServer } from "../interfaces/chat/server";
import { startMcpServer } from "../interfaces/mcp/server";

type ResponseFormat = "markdown" | "json";

declare const __COUNCIL_VERSION__: string | undefined;

const DEFAULT_CHAT_PORT = 5123;
const FORCE_SHUTDOWN_TIMEOUT_MS = 3000;

const main = async (): Promise<void> => {
  const version = await resolveVersion();
  const program = new Command();

  program.name("council").description("Agents Council MCP").version(version, "-v, --version", "Show version");

  program
    .command("mcp")
    .description("Start the MCP server.")
    .option("-f, --format <markdown|json>", "Response format (default: markdown)", "markdown")
    .option("-n, --agent-name <name>", "Default agent name for the session")
    .action(async (options: { format: string; agentName?: string }) => {
      try {
        const format = parseFormat(options.format);
        const agentName = parseAgentName(options.agentName);
        await startMcpServer({ format, agentName });
      } catch (error) {
        reportAndExit("Failed to start MCP server", error);
      }
    });

  program
    .command("chat")
    .description("Start the council chat web interface.")
    .option("-p, --port <number>", "Port for the local chat server", `${DEFAULT_CHAT_PORT}`)
    .option("--no-open", "Do not open the browser automatically")
    .action(async (options: { port: string; open: boolean }) => {
      try {
        const port = parsePort(options.port);
        const chatServer = startChatServer({ port });
        printChatStartup(chatServer.url);
        if (options.open) {
          openBrowser(chatServer.url);
        }
        setupChatShutdown(chatServer);
      } catch (error) {
        reportAndExit("Failed to start chat server", error);
      }
    });

  program.on("command:*", (operands: string[]) => {
    const command = operands[0] ?? "unknown";
    console.error(`Unknown command: ${command}`);
    program.outputHelp();
    process.exit(1);
  });

  if (process.argv.length <= 2) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
};

main().catch((error) => {
  reportAndExit("Failed to start council", error);
});

function parseFormat(value: string): ResponseFormat {
  if (value !== "markdown" && value !== "json") {
    throw new Error("Startup error: --format expects 'markdown' or 'json'.");
  }

  return value;
}

function parseAgentName(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const agentName = value.trim();
  if (!agentName) {
    throw new Error("Startup error: --agent-name expects a value.");
  }

  return agentName;
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port)) {
    throw new Error("Startup error: --port expects an integer.");
  }
  if (port < 1 || port > 65535) {
    throw new Error("Startup error: --port must be between 1 and 65535.");
  }
  return port;
}

function printChatStartup(url: string): void {
  const lines = [
    `\uD83D\uDE80 Agents Council browser interface running at ${url}`,
    "\u23F9\uFE0F  Press Cmd+C to stop the server",
    "\uD83D\uDCA1 Open your browser and navigate to the URL above",
  ];
  console.log(lines.join("\n"));
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const command =
    platform === "darwin" ? ["open", url] : platform === "win32" ? ["cmd", "/c", "start", "", url] : ["xdg-open", url];

  try {
    Bun.spawn(command, {
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
    });
  } catch (error) {
    console.warn("Unable to open the browser automatically. Please open the URL manually.");
    console.warn(url);
    console.warn(error);
  }
}

function setupChatShutdown(chatServer: ChatServer): void {
  let shuttingDown = false;
  const { server, close } = chatServer;

  const shutdown = (): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    close();

    const forceTimer = setTimeout(() => {
      close();
      void server.stop(true).finally(() => {
        process.exit(0);
      });
    }, FORCE_SHUTDOWN_TIMEOUT_MS);

    void server
      .stop()
      .catch((error: unknown) => {
        console.error("Failed to stop chat server:", error);
      })
      .finally(() => {
        clearTimeout(forceTimer);
        process.exit(0);
      });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function reportAndExit(message: string, error: unknown): never {
  const details = error instanceof Error ? error.message : String(error);
  console.error(`${message}: ${details}`);
  process.exit(1);
}

async function resolveVersion(): Promise<string> {
  if (typeof __COUNCIL_VERSION__ === "string" && __COUNCIL_VERSION__.length > 0) {
    return __COUNCIL_VERSION__;
  }
  if (typeof process.env.npm_package_version === "string" && process.env.npm_package_version.length > 0) {
    return process.env.npm_package_version;
  }

  const candidates: string[] = [];
  const binaryPath = process.argv[0];
  if (binaryPath) {
    const binaryDir = path.dirname(path.resolve(binaryPath));
    candidates.push(path.join(binaryDir, "package.json"));
    candidates.push(path.join(binaryDir, "..", "package.json"));
  }
  const scriptPath = process.argv[1];
  if (scriptPath) {
    const scriptDir = path.dirname(path.resolve(scriptPath));
    candidates.push(path.join(scriptDir, "..", "package.json"));
    candidates.push(path.join(scriptDir, "..", "..", "package.json"));
  }

  for (const candidate of candidates) {
    try {
      const data = await Bun.file(candidate).json();
      if (data && typeof data.version === "string" && data.version.length > 0) {
        return data.version;
      }
    } catch {
      // Ignore missing or unreadable package.json.
    }
  }

  return "0.0.0";
}
