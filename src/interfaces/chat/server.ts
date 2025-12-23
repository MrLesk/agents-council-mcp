import type { Server } from "bun";

import { CouncilServiceImpl } from "../../core/services/council";
import { FileCouncilStateStore } from "../../core/state/fileStateStore";
import {
  mapCloseCouncilInput,
  mapCloseCouncilResponse,
  mapGetCurrentSessionDataInput,
  mapGetCurrentSessionDataResponse,
  mapSendResponseInput,
  mapSendResponseResponse,
  mapStartCouncilInput,
  mapStartCouncilResponse,
} from "../mcp/mapper";
import type {
  CloseCouncilParams,
  GetCurrentSessionDataParams,
  JoinCouncilParams,
  SendResponseParams,
  StartCouncilParams,
} from "../mcp/dtos/types";

type ChatServerOptions = {
  port: number;
  hostname?: string;
};

type JsonRecord = Record<string, unknown>;

export type ChatServer = {
  server: Server<undefined>;
  url: string;
};

const service = new CouncilServiceImpl(new FileCouncilStateStore());

export function startChatServer(options: ChatServerOptions): ChatServer {
  const hostname = options.hostname ?? "127.0.0.1";
  const port = options.port;
  let server: Server<undefined>;

  try {
    server = Bun.serve({
      hostname,
      port,
      async fetch(req) {
        try {
          const url = new URL(req.url);
          if (req.method === "POST") {
            switch (url.pathname) {
              case "/start-council":
                return await handleStartCouncil(req);
              case "/join-council":
                return await handleJoinCouncil(req);
              case "/get-current-session-data":
                return await handleGetCurrentSessionData(req);
              case "/send-response":
                return await handleSendResponse(req);
              case "/close-council":
                return await handleCloseCouncil(req);
              default:
                return jsonError(404, "Not found.");
            }
          }

          if (req.method === "GET" && url.pathname === "/") {
            return new Response("Agents Council chat UI is not configured yet.", {
              headers: { "content-type": "text/plain; charset=utf-8" },
            });
          }

          return jsonError(404, "Not found.");
        } catch (error) {
          if (error instanceof ApiError) {
            return jsonError(error.status, error.message);
          }
          return jsonError(500, getErrorMessage(error));
        }
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

async function handleStartCouncil(req: Request): Promise<Response> {
  const body = await readJsonBody(req);
  const params: StartCouncilParams & { agent_name: string } = {
    request: requireString(body, "request"),
    agent_name: requireString(body, "agent_name"),
  };
  const result = await service.startCouncil(mapStartCouncilInput(params));
  return Response.json(mapStartCouncilResponse(result));
}

async function handleJoinCouncil(req: Request): Promise<Response> {
  const body = await readJsonBody(req);
  const params: JoinCouncilParams & { agent_name: string } = {
    agent_name: requireString(body, "agent_name"),
  };
  const result = await service.getCurrentSessionData(mapGetCurrentSessionDataInput(params));
  return Response.json(mapGetCurrentSessionDataResponse(result));
}

async function handleGetCurrentSessionData(req: Request): Promise<Response> {
  const body = await readJsonBody(req);
  const params: GetCurrentSessionDataParams & { agent_name: string } = {
    agent_name: requireString(body, "agent_name"),
    cursor: optionalString(body, "cursor"),
  };
  const result = await service.getCurrentSessionData(mapGetCurrentSessionDataInput(params));
  return Response.json(mapGetCurrentSessionDataResponse(result));
}

async function handleSendResponse(req: Request): Promise<Response> {
  const body = await readJsonBody(req);
  const params: SendResponseParams & { agent_name: string } = {
    agent_name: requireString(body, "agent_name"),
    content: requireString(body, "content"),
  };
  const result = await service.sendResponse(mapSendResponseInput(params));
  return Response.json(mapSendResponseResponse(result));
}

async function handleCloseCouncil(req: Request): Promise<Response> {
  const body = await readJsonBody(req);
  const params: CloseCouncilParams & { agent_name: string } = {
    agent_name: requireString(body, "agent_name"),
    conclusion: requireString(body, "conclusion"),
  };
  const result = await service.closeCouncil(mapCloseCouncilInput(params));
  return Response.json(mapCloseCouncilResponse(result));
}

async function readJsonBody(req: Request): Promise<JsonRecord> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }

  if (!isRecord(body)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  return body;
}

function requireString(body: JsonRecord, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `"${field}" is required.`);
  }
  return value.trim();
}

function optionalString(body: JsonRecord, field: string): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `"${field}" must be a string.`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as NodeJS.ErrnoException).code === code
  );
}
