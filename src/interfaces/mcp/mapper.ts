import type {
  CloseCouncilParams,
  CloseCouncilResponse,
  ConclusionDto,
  CouncilStateDto,
  FeedbackDto,
  GetCurrentSessionDataParams,
  GetCurrentSessionDataResponse,
  ParticipantDto,
  RequestDto,
  SendResponseParams,
  SendResponseResponse,
  SessionDto,
  StartCouncilParams,
  StartCouncilResponse,
} from "./dtos/types";
import type {
  CloseCouncilInput,
  CloseCouncilResult,
  CouncilConclusion,
  CouncilFeedback,
  CouncilParticipant,
  CouncilRequest,
  CouncilSession,
  CouncilState,
  GetCurrentSessionDataInput,
  GetCurrentSessionDataResult,
  SendResponseInput,
  SendResponseResult,
  StartCouncilInput,
  StartCouncilResult,
} from "../../core/services/council/types";

export function mapStartCouncilInput(params: StartCouncilParams): StartCouncilInput {
  return {
    request: params.request,
    agentName: params.agent_name,
  };
}

export function mapGetCurrentSessionDataInput(params: GetCurrentSessionDataParams): GetCurrentSessionDataInput {
  return {
    agentName: params.agent_name,
    cursor: params.cursor,
  };
}

export function mapCloseCouncilInput(params: CloseCouncilParams): CloseCouncilInput {
  return {
    agentName: params.agent_name,
    conclusion: params.conclusion,
  };
}

export function mapSendResponseInput(params: SendResponseParams): SendResponseInput {
  return {
    agentName: params.agent_name,
    content: params.content,
  };
}

export function mapStartCouncilResponse(result: StartCouncilResult): StartCouncilResponse {
  return {
    agent_name: result.agentName,
    session_id: result.session.id,
    request_id: result.request.id,
    state: mapCouncilState(result.state),
  };
}

export function mapGetCurrentSessionDataResponse(
  result: GetCurrentSessionDataResult,
): GetCurrentSessionDataResponse {
  return {
    agent_name: result.agentName,
    session_id: result.session?.id ?? null,
    request: result.request ? mapRequest(result.request) : null,
    feedback: result.feedback.map(mapFeedback),
    participant: mapParticipant(result.participant),
    next_cursor: result.nextCursor,
    state: mapCouncilState(result.state),
  };
}

export function mapCloseCouncilResponse(result: CloseCouncilResult): CloseCouncilResponse {
  return {
    agent_name: result.agentName,
    session_id: result.session.id,
    conclusion: mapConclusion(result.conclusion),
    state: mapCouncilState(result.state),
  };
}

export function mapSendResponseResponse(result: SendResponseResult): SendResponseResponse {
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
    conclusion: session.conclusion ? mapConclusion(session.conclusion) : null,
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

function mapConclusion(conclusion: CouncilConclusion): ConclusionDto {
  return {
    author: conclusion.author,
    content: conclusion.content,
    created_at: conclusion.createdAt,
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
