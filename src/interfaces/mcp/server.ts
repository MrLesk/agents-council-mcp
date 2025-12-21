import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

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
} from "./mapper";
import type {
  CloseCouncilParams,
  CloseCouncilResponse,
  GetCurrentSessionDataParams,
  GetCurrentSessionDataResponse,
  JoinCouncilParams,
  SendResponseParams,
  SendResponseResponse,
  StartCouncilParams,
  StartCouncilResponse,
} from "./dtos/types";

type ResponseFormat = "markdown" | "json";
type ToolName = "start_council" | "join_council" | "get_current_session_data" | "close_council" | "send_response";
type ToolContext = {
  cursor?: string;
};

const server = new McpServer({
  name: "agents-council",
  version: "0.1.0",
});

const service = new CouncilServiceImpl(new FileCouncilStateStore());
let responseFormat: ResponseFormat = "markdown";

const registerTool = <TParams>(
  name: string,
  config: { description: string; inputSchema: z.ZodTypeAny },
  handler: (params: TParams) => Promise<CallToolResult> | CallToolResult,
) => {
  (server.registerTool as unknown as (toolName: string, toolConfig: unknown, cb: unknown) => void)(
    name,
    config,
    handler,
  );
};

const startCouncilSchema: z.ZodTypeAny = z.object({
  request: z.string().min(1),
  agent_name: z.string().min(1),
});

const joinCouncilSchema: z.ZodTypeAny = z.object({
  agent_name: z.string().min(1),
});

const getCurrentSessionDataSchema: z.ZodTypeAny = z.object({
  agent_name: z.string().min(1),
  cursor: z.string().min(1).optional(),
});

const sendResponseSchema: z.ZodTypeAny = z.object({
  agent_name: z.string().min(1),
  content: z.string().min(1),
});

const closeCouncilSchema: z.ZodTypeAny = z.object({
  agent_name: z.string().min(1),
  conclusion: z.string().min(1),
});

registerTool<StartCouncilParams>(
  "start_council",
  {
    description:
      "Start a new council session and request responses. Provide an agent_name; the server may append #1, #2, etc. if the name is already taken. Reuse the returned agent_name on subsequent calls. Text format is set via the server --format/-f flag (markdown|json).",
    inputSchema: startCouncilSchema,
  },
  async (params) => {
    try {
      const result = await service.startCouncil(mapStartCouncilInput(params));
      const response = mapStartCouncilResponse(result);
      return toolOk("start_council", response);
    } catch (error) {
      return toolError(error);
    }
  },
);

registerTool<GetCurrentSessionDataParams>(
  "get_current_session_data",
  {
    description:
      "Get session data for the current council session since the last cursor. Use the server-assigned agent_name. Text format is set via the server --format/-f flag (markdown|json).",
    inputSchema: getCurrentSessionDataSchema,
  },
  async (params) => {
    try {
      const result = await service.getCurrentSessionData(mapGetCurrentSessionDataInput(params));
      const response = mapGetCurrentSessionDataResponse(result);
      return toolOk("get_current_session_data", response, { cursor: params.cursor });
    } catch (error) {
      return toolError(error);
    }
  },
);

registerTool<JoinCouncilParams>(
  "join_council",
  {
    description:
      "Join the current council session and fetch session data. Use the server-assigned agent_name. Text format is set via the server --format/-f flag (markdown|json).",
    inputSchema: joinCouncilSchema,
  },
  async (params) => {
    try {
      const result = await service.getCurrentSessionData(
        mapGetCurrentSessionDataInput({ agent_name: params.agent_name }),
      );
      const response = mapGetCurrentSessionDataResponse(result);
      return toolOk("join_council", response, { cursor: undefined });
    } catch (error) {
      return toolError(error);
    }
  },
);

registerTool<CloseCouncilParams>(
  "close_council",
  {
    description:
      "Close the current council session with a conclusion. Use the server-assigned agent_name. Text format is set via the server --format/-f flag (markdown|json).",
    inputSchema: closeCouncilSchema,
  },
  async (params) => {
    try {
      const result = await service.closeCouncil(mapCloseCouncilInput(params));
      const response = mapCloseCouncilResponse(result);
      return toolOk("close_council", response);
    } catch (error) {
      return toolError(error);
    }
  },
);

registerTool<SendResponseParams>(
  "send_response",
  {
    description:
      "Send a response for the current session. Use the server-assigned agent_name. Text format is set via the server --format/-f flag (markdown|json).",
    inputSchema: sendResponseSchema,
  },
  async (params) => {
    try {
      const result = await service.sendResponse(mapSendResponseInput(params));
      const response = mapSendResponseResponse(result);
      return toolOk("send_response", response);
    } catch (error) {
      return toolError(error);
    }
  },
);

export async function startMcpServer(options: { format?: ResponseFormat } = {}): Promise<void> {
  responseFormat = options.format ?? "markdown";
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Council MCP server running on stdio");
}

function toolOk<T extends Record<string, unknown>>(
  toolName: ToolName,
  payload: T,
  context: ToolContext = {},
): CallToolResult {
  const content = [
    {
      type: "text" as const,
      text: formatToolText(toolName, payload, context),
    },
  ];

  return {
    content,
    structuredContent: payload,
  };
}

function toolError(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : "Unknown error";
  const content = [
    {
      type: "text" as const,
      text: message,
    },
  ];

  return {
    content,
    isError: true,
  };
}

function formatToolText(toolName: ToolName, payload: unknown, context: ToolContext): string {
  if (responseFormat === "json") {
    return JSON.stringify(payload, null, 2);
  }

  switch (toolName) {
    case "start_council":
      return formatStartCouncil(payload as StartCouncilResponse);
    case "get_current_session_data":
      return formatGetCurrentSessionData(payload as GetCurrentSessionDataResponse, context);
    case "join_council":
      return formatGetCurrentSessionData(payload as GetCurrentSessionDataResponse, context);
    case "close_council":
      return formatCloseCouncil(payload as CloseCouncilResponse);
    case "send_response":
      return formatSendResponse(payload as SendResponseResponse);
    default: {
      const _exhaustive: never = toolName;
      return _exhaustive;
    }
  }
}

function formatStartCouncil(response: StartCouncilResponse): string {
  return [
    "Council request received. Check again later for responses.",
    `Your assigned name is: ${response.agent_name}`,
  ].join("\n");
}

function formatGetCurrentSessionData(response: GetCurrentSessionDataResponse, context: ToolContext): string {
  const request = response.request;
  const requestAuthor = request?.created_by ?? "none";
  const requestContent = request?.content ?? "none";
  const sessionStatus = response.state.session?.status;
  const conclusion = response.state.session?.conclusion;
  if (sessionStatus === "closed") {
    const conclusionAuthor = conclusion?.author ?? "none";
    const conclusionContent = conclusion?.content ?? "none";
    return [
      `Your assigned name is: ${response.agent_name}`,
      "---",
      `Council session started by ${requestAuthor}`,
      `Request: ${requestContent}`,
      "---",
      `Council session ended by ${conclusionAuthor}`,
      `Conclusion: ${conclusionContent}`,
    ].join("\n");
  }

  const cursorLabel = context.cursor ?? "start";
  const cursorToken = response.next_cursor ?? "none";
  const lines = [
    `Your assigned name is: ${response.agent_name}`,
    "---",
    `Council session started by ${requestAuthor}`,
    `Request: ${requestContent}`,
    "---",
    `Messages (from ${cursorLabel}):`,
    "",
  ];

  response.feedback.forEach((entry) => {
    lines.push(entry.author);
    lines.push(`Response: ${entry.content}`);
    lines.push("---");
  });

  lines.push("There are no other responses for now. You can query again later.");
  lines.push(`If you want to skip these responses use the cursor to get only new responses: ${cursorToken}`);
  return lines.join("\n");
}

function formatCloseCouncil(response: CloseCouncilResponse): string {
  return ["Council session closed.", `Your assigned name is: ${response.agent_name}`].join("\n");
}

function formatSendResponse(response: SendResponseResponse): string {
  return ["Response recorded.", `Your assigned name is: ${response.agent_name}`].join("\n");
}
