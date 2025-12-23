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

const serverInstructions = [
  "If you need feedback from other AI agents, start a council with start_council.",
  "If you are requested to join the council, call join_council, read the request, and send_response as soon as possible.",
  "Use get_current_session_data to poll for new responses; pass the cursor returned to fetch only newer messages.",
  "Use close_council to end the current session with a conclusion.",
].join("\n");

const server = new McpServer(
  {
    name: "agents-council",
    version: "0.1.0",
  },
  {
    instructions: serverInstructions,
  },
);

const service = new CouncilServiceImpl(new FileCouncilStateStore());
let responseFormat: ResponseFormat = "markdown";
let agentName: string | null = null;
let toolsRegistered = false;

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

export async function startMcpServer(options: { format?: ResponseFormat; agentName?: string } = {}): Promise<void> {
  const format = options.format ?? "markdown";
  if (format !== "markdown" && format !== "json") {
    throw new Error("Unsupported response format. Use 'markdown' or 'json'.");
  }
  responseFormat = format;
  const configuredAgentName = options.agentName?.trim() || null;
  agentName = configuredAgentName;
  registerTools({ hasDefaultAgentName: configuredAgentName !== null });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Council MCP server running on stdio");
}

function registerTools(options: { hasDefaultAgentName: boolean }): void {
  if (toolsRegistered) {
    return;
  }
  toolsRegistered = true;

  const startCouncilSchema: z.ZodTypeAny = options.hasDefaultAgentName
    ? z.object({ request: z.string().min(1) }).strict()
    : z
        .object({
          request: z.string().min(1),
          agent_name: z.string().min(1),
        })
        .strict();

  const joinCouncilSchema: z.ZodTypeAny = options.hasDefaultAgentName
    ? z.object({}).strict()
    : z
        .object({
          agent_name: z.string().min(1),
        })
        .strict();

  const getCurrentSessionDataSchema: z.ZodTypeAny = z
    .object({
      cursor: z.string().min(1).optional(),
    })
    .strict();

  const sendResponseSchema: z.ZodTypeAny = z
    .object({
      content: z.string().min(1),
    })
    .strict();

  const closeCouncilSchema: z.ZodTypeAny = z
    .object({
      conclusion: z.string().min(1),
    })
    .strict();

  const startCouncilDescription = options.hasDefaultAgentName
    ? "Start a new council session and submit your request. Other council members will reply shortly after."
    : "Start a new council session and submit your request. Other council members will reply shortly after. Provide agent_name to identify yourself; the server may append #1, #2, etc. if the name is already taken.";

  registerTool<StartCouncilParams>(
    "start_council",
    {
      description: startCouncilDescription,
      inputSchema: startCouncilSchema,
    },
    async (params) => {
      try {
        const resolvedName = options.hasDefaultAgentName ? agentName : params.agent_name?.trim();
        if (!resolvedName) {
          throw new Error(
            options.hasDefaultAgentName
              ? "Agent name not set for start_council."
              : "agent_name is required for start_council.",
          );
        }
        const result = await service.startCouncil(
          mapStartCouncilInput({ request: params.request, agent_name: resolvedName }),
        );
        const response = mapStartCouncilResponse(result);
        agentName = response.agent_name;
        return toolOk("start_council", response);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  registerTool<GetCurrentSessionDataParams>(
    "get_current_session_data",
    {
      description: "Get the current session request and responses since the last cursor.",
      inputSchema: getCurrentSessionDataSchema,
    },
    async (params) => {
      try {
        const resolvedName = agentName;
        if (!resolvedName) {
          throw new Error("Agent name not set for get_current_session_data. Call start_council or join_council first.");
        }
        const result = await service.getCurrentSessionData(
          mapGetCurrentSessionDataInput({ cursor: params.cursor, agent_name: resolvedName }),
        );
        const response = mapGetCurrentSessionDataResponse(result);
        return toolOk("get_current_session_data", response, { cursor: params.cursor });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  const joinCouncilDescription = options.hasDefaultAgentName
    ? "Join the current council session and fetch the request and responses."
    : "Join the current council session and fetch the request and responses. Provide agent_name to identify yourself; the server may append #1, #2, etc. if the name is already taken.";

  registerTool<JoinCouncilParams>(
    "join_council",
    {
      description: joinCouncilDescription,
      inputSchema: joinCouncilSchema,
    },
    async (params) => {
      try {
        const resolvedName = options.hasDefaultAgentName ? agentName : params.agent_name?.trim();
        if (!resolvedName) {
          throw new Error(
            options.hasDefaultAgentName
              ? "Agent name not set for join_council."
              : "agent_name is required for join_council.",
          );
        }
        const result = await service.getCurrentSessionData(mapGetCurrentSessionDataInput({ agent_name: resolvedName }));
        const response = mapGetCurrentSessionDataResponse(result);
        agentName = response.agent_name;
        return toolOk("join_council", response, { cursor: undefined });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  registerTool<CloseCouncilParams>(
    "close_council",
    {
      description: "Close the current council session with a conclusion.",
      inputSchema: closeCouncilSchema,
    },
    async (params) => {
      try {
        const resolvedName = agentName;
        if (!resolvedName) {
          throw new Error("Agent name not set for close_council. Call start_council or join_council first.");
        }
        const result = await service.closeCouncil(
          mapCloseCouncilInput({ conclusion: params.conclusion, agent_name: resolvedName }),
        );
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
      description: "Send a response for the current session.",
      inputSchema: sendResponseSchema,
    },
    async (params) => {
      try {
        const resolvedName = agentName;
        if (!resolvedName) {
          throw new Error("Agent name not set for send_response. Call start_council or join_council first.");
        }
        const result = await service.sendResponse(
          mapSendResponseInput({ content: params.content, agent_name: resolvedName }),
        );
        const response = mapSendResponseResponse(result);
        return toolOk("send_response", response);
      } catch (error) {
        return toolError(error);
      }
    },
  );
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
      return formatJoinCouncil(payload as GetCurrentSessionDataResponse);
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
    "Your request is received. Return anon for replies, and look again in a few seconds.",
    `Your assigned name is: ${response.agent_name}`,
  ].join("\n");
}

function formatJoinCouncil(response: GetCurrentSessionDataResponse): string {
  const request = response.request;
  const requestAuthor = request?.created_by ?? "none";
  const requestContent = request?.content ?? "none";

  return [
    `Welcome to this council session ${response.agent_name}.`,
    `We are gathered to weigh a matter set forth by ${requestAuthor}.`,
    "Request:",
    requestContent,
    "---",
    "What say you, and with haste?",
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
      `The council was convened by ${requestAuthor}.`,
      `Request: ${requestContent}`,
      "---",
      `The council is ended, spoken by ${conclusionAuthor}.`,
      `Conclusion: ${conclusionContent}`,
    ].join("\n");
  }

  const cursorLabel = context.cursor ?? "start";
  const cursorToken = response.next_cursor ?? "none";
  const lines = [
    `The council was convened by ${requestAuthor}.`,
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

  lines.push("No further replies are heard for now. Return anon for more.");
  lines.push(`To hear only new replies, use the cursor: ${cursorToken}`);
  return lines.join("\n");
}

function formatCloseCouncil(response: CloseCouncilResponse): string {
  return "The council is ended, and the matter is sealed.";
}

function formatSendResponse(response: SendResponseResponse): string {
  return ["Your reply is set down.", `Your assigned name is: ${response.agent_name}`].join("\n");
}
