import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { CouncilServiceImpl } from "../../core/services/council";
import { FileCouncilStateStore } from "../../core/state/fileStateStore";
import {
  mapCheckSessionInput,
  mapCheckSessionResponse,
  mapProvideFeedbackInput,
  mapProvideFeedbackResponse,
  mapRequestFeedbackInput,
  mapRequestFeedbackResponse,
} from "./mapper";
import type { CheckSessionParams, ProvideFeedbackParams, RequestFeedbackParams } from "./dtos/types";

const server = new McpServer({
  name: "agents-council",
  version: "0.1.0",
});

const service = new CouncilServiceImpl(new FileCouncilStateStore());

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

const cursorSchema: z.ZodTypeAny = z.object({
  last_request_seen: z.string().nullable(),
  last_feedback_seen: z.string().nullable(),
});

const requestFeedbackSchema: z.ZodTypeAny = z.object({
  content: z.string().min(1),
  agent_name: z.string().min(1),
});

const checkSessionSchema: z.ZodTypeAny = z.object({
  agent_name: z.string().min(1),
  cursor: cursorSchema.optional(),
});

const provideFeedbackSchema: z.ZodTypeAny = z.object({
  agent_name: z.string().min(1),
  request_id: z.string().min(1),
  content: z.string().min(1),
});

registerTool<RequestFeedbackParams>(
  "request_feedback",
  {
    description:
      "Start a new council session and request feedback. Provide an agent_name; the server may append #1, #2, etc. if the name is already taken. Reuse the returned agent_name on subsequent calls.",
    inputSchema: requestFeedbackSchema,
  },
  async (params) => {
    try {
      const result = await service.requestFeedback(mapRequestFeedbackInput(params));
      const response = mapRequestFeedbackResponse(result);
      return toolOk(response);
    } catch (error) {
      return toolError(error);
    }
  },
);

registerTool<CheckSessionParams>(
  "check_session",
  {
    description: "Check for new requests or feedback since the last cursor. Use the server-assigned agent_name.",
    inputSchema: checkSessionSchema,
  },
  async (params) => {
    try {
      const result = await service.checkSession(mapCheckSessionInput(params));
      const response = mapCheckSessionResponse(result);
      return toolOk(response);
    } catch (error) {
      return toolError(error);
    }
  },
);

registerTool<ProvideFeedbackParams>(
  "provide_feedback",
  {
    description: "Provide feedback for the current request. Use the server-assigned agent_name.",
    inputSchema: provideFeedbackSchema,
  },
  async (params) => {
    try {
      const result = await service.provideFeedback(mapProvideFeedbackInput(params));
      const response = mapProvideFeedbackResponse(result);
      return toolOk(response);
    } catch (error) {
      return toolError(error);
    }
  },
);

export async function startMcpServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Council MCP server running on stdio");
}

function toolOk<T extends Record<string, unknown>>(payload: T): CallToolResult {
  const content = [
    {
      type: "text" as const,
      text: JSON.stringify(payload, null, 2),
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
