import { startMcpServer } from "../interfaces/mcp/server";

type ResponseFormat = "markdown" | "json";

const args = Bun.argv.slice(2);

if (args[0] !== "mcp") {
  console.error("Startup error: you need to run 'council mcp' in order to start the mcp server");
  process.exit(1);
}

const format = parseFormat(args.slice(1));

startMcpServer({ format }).catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});

function parseFormat(args: string[]): ResponseFormat {
  let format: ResponseFormat = "markdown";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
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
