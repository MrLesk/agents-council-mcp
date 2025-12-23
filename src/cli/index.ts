import path from "node:path";

import { startMcpServer } from "../interfaces/mcp/server";

type ResponseFormat = "markdown" | "json";

declare const __COUNCIL_VERSION__: string | undefined;

const HELP_TEXT = [
  "Agents Council MCP",
  "",
  "Usage:",
  "  council mcp [--format <markdown|json>] [--agent-name <name>]",
  "",
  "Options:",
  "  -f, --format <markdown|json>  Response format (default: markdown)",
  "  -n, --agent-name <name>       Default agent name for the session",
  "  -h, --help                    Show help",
  "  -v, --version                 Show version",
  "",
  "Run `council mcp` to start the MCP server.",
].join("\n");

const main = async (): Promise<void> => {
  const args = Bun.argv.slice(2);
  const wantsHelp = args.includes("-h") || args.includes("--help");
  const wantsVersion = args.includes("-v") || args.includes("--version");

  if (wantsHelp) {
    printHelp();
    return;
  }

  if (wantsVersion) {
    const version = await resolveVersion();
    console.log(version);
    return;
  }

  if (args.length === 0) {
    printHelp();
    return;
  }

  if (args[0] !== "mcp") {
    console.error(`Unknown command: ${args[0]}`);
    printHelp();
    process.exit(1);
  }

  const format = parseFormat(args.slice(1));
  const agentName = parseAgentName(args.slice(1));

  await startMcpServer({ format, agentName });
};

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});

function parseFormat(args: string[]): ResponseFormat {
  let format: ResponseFormat = "markdown";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg === "--format" || arg === "-f") {
      const value = args[index + 1];
      if (!value) {
        console.error("Startup error: --format expects 'markdown' or 'json'.");
        process.exit(1);
      }
      format = value as ResponseFormat;
      index += 1;
      continue;
    }
    if (arg.startsWith("--format=")) {
      format = arg.slice("--format=".length) as ResponseFormat;
    }
  }

  if (format !== "markdown" && format !== "json") {
    console.error("Startup error: --format expects 'markdown' or 'json'.");
    process.exit(1);
  }

  return format;
}

function parseAgentName(args: string[]): string | undefined {
  let agentName: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg === "--agent-name" || arg === "-n") {
      const value = args[index + 1];
      if (!value) {
        console.error("Startup error: --agent-name expects a value.");
        process.exit(1);
      }
      agentName = value.trim();
      index += 1;
      continue;
    }
    if (arg.startsWith("--agent-name=")) {
      agentName = arg.slice("--agent-name=".length).trim();
    }
  }

  if (agentName !== undefined && agentName.length === 0) {
    console.error("Startup error: --agent-name expects a value.");
    process.exit(1);
  }

  return agentName;
}

function printHelp(): void {
  console.log(HELP_TEXT);
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
