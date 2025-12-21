import type {
  CheckSessionParams,
  CheckSessionResponse,
  CouncilStateDto,
  FeedbackDto,
  ParticipantDto,
  ProvideFeedbackParams,
  ProvideFeedbackResponse,
  RequestDto,
  RequestFeedbackParams,
  RequestFeedbackResponse,
  SessionCursorDto,
  SessionDto,
} from "./dtos/types";
import type {
  CheckSessionInput,
  CheckSessionResult,
  CouncilFeedback,
  CouncilParticipant,
  CouncilRequest,
  CouncilSession,
  CouncilState,
  ProvideFeedbackInput,
  ProvideFeedbackResult,
  RequestFeedbackInput,
  RequestFeedbackResult,
  SessionCursor,
} from "../../core/services/council/types";

export function mapRequestFeedbackInput(params: RequestFeedbackParams): RequestFeedbackInput {
  return {
    content: params.content,
    agentName: params.agent_name,
  };
}

export function mapCheckSessionInput(params: CheckSessionParams): CheckSessionInput {
  return {
    agentName: params.agent_name,
    cursor: params.cursor ? mapCursorFromDto(params.cursor) : undefined,
  };
}

export function mapProvideFeedbackInput(params: ProvideFeedbackParams): ProvideFeedbackInput {
  return {
    agentName: params.agent_name,
    requestId: params.request_id,
    content: params.content,
  };
}

export function mapRequestFeedbackResponse(result: RequestFeedbackResult): RequestFeedbackResponse {
  return {
    agent_name: result.agentName,
    session_id: result.session.id,
    request_id: result.request.id,
    state: mapCouncilState(result.state),
  };
}

export function mapCheckSessionResponse(result: CheckSessionResult): CheckSessionResponse {
  return {
    agent_name: result.agentName,
    session_id: result.session?.id ?? null,
    request: result.request ? mapRequest(result.request) : null,
    feedback: result.feedback.map(mapFeedback),
    participant: mapParticipant(result.participant),
    next_cursor: mapCursor(result.nextCursor),
    state: mapCouncilState(result.state),
  };
}

export function mapProvideFeedbackResponse(result: ProvideFeedbackResult): ProvideFeedbackResponse {
  return {
    agent_name: result.agentName,
    feedback: mapFeedback(result.feedback),
    state: mapCouncilState(result.state),
  };
}

function mapCouncilState(state: CouncilState): CouncilStateDto {
  return {
    version: state.version,
    session: state.session ? mapSession(state.session) : null,
    requests: state.requests.map(mapRequest),
    feedback: state.feedback.map(mapFeedback),
    participants: state.participants.map(mapParticipant),
  };
}

function mapSession(session: CouncilSession): SessionDto {
  return {
    id: session.id,
    status: session.status,
    created_at: session.createdAt,
    current_request_id: session.currentRequestId,
  };
}

function mapRequest(request: CouncilRequest): RequestDto {
  return {
    id: request.id,
    content: request.content,
    created_by: request.createdBy,
    created_at: request.createdAt,
    status: request.status,
  };
}

function mapFeedback(feedback: CouncilFeedback): FeedbackDto {
  return {
    id: feedback.id,
    request_id: feedback.requestId,
    author: feedback.author,
    content: feedback.content,
    created_at: feedback.createdAt,
  };
}

function mapParticipant(participant: CouncilParticipant): ParticipantDto {
  return {
    agent_name: participant.agentName,
    last_seen: participant.lastSeen,
    last_request_seen: participant.lastRequestSeen,
    last_feedback_seen: participant.lastFeedbackSeen,
  };
}

function mapCursor(cursor: SessionCursor): SessionCursorDto {
  return {
    last_request_seen: cursor.lastRequestSeen,
    last_feedback_seen: cursor.lastFeedbackSeen,
  };
}

function mapCursorFromDto(cursor: SessionCursorDto): SessionCursor {
  return {
    lastRequestSeen: cursor.last_request_seen,
    lastFeedbackSeen: cursor.last_feedback_seen,
  };
}
