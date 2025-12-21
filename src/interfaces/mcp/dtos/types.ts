export type CouncilStateDto = {
  version: number;
  session: SessionDto | null;
  requests: RequestDto[];
  feedback: FeedbackDto[];
  participants: ParticipantDto[];
};

export type SessionDto = {
  id: string;
  status: "active";
  created_at: string;
  current_request_id: string | null;
};

export type RequestDto = {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  status: "open" | "closed";
};

export type FeedbackDto = {
  id: string;
  request_id: string;
  author: string;
  content: string;
  created_at: string;
};

export type ParticipantDto = {
  agent_name: string;
  last_seen: string;
  last_request_seen: string | null;
  last_feedback_seen: string | null;
};

export type StartCouncilParams = {
  request: string;
  agent_name: string;
};

export type StartCouncilResponse = {
  agent_name: string;
  session_id: string;
  request_id: string;
  state: CouncilStateDto;
};

export type GetCurrentSessionDataParams = {
  agent_name: string;
  cursor?: string;
};

export type GetCurrentSessionDataResponse = {
  agent_name: string;
  session_id: string | null;
  request: RequestDto | null;
  feedback: FeedbackDto[];
  participant: ParticipantDto;
  next_cursor: string | null;
  state: CouncilStateDto;
};

export type SendResponseParams = {
  agent_name: string;
  content: string;
};

export type SendResponseResponse = {
  agent_name: string;
  feedback: FeedbackDto;
  state: CouncilStateDto;
};
