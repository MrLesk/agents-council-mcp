import type { Server } from "bun";

type ChatServerOptions = {
  port: number;
  hostname?: string;
};

export type ChatServer = {
  server: Server<undefined>;
  url: string;
};

export function startChatServer(options: ChatServerOptions): ChatServer {
  const hostname = options.hostname ?? "127.0.0.1";
  const port = options.port;
  let server: Server<undefined>;

  try {
    server = Bun.serve({
      hostname,
      port,
      fetch() {
        return new Response("Agents Council chat UI is not configured yet.", {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    });
  } catch (error) {
    if (isErrno(error, "EADDRINUSE")) {
      throw new Error(
        `Port ${port} is already in use. Close the other council chat instance or launch with --port/-p to use a different port.`,
      );
    }
    throw error;
  }

  return { server, url: `http://localhost:${server.port}` };
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as NodeJS.ErrnoException).code === code
  );
}
