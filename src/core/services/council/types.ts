export type CouncilState = {
  version: number;
  session: CouncilSession | null;
  requests: CouncilRequest[];
  feedback: CouncilFeedback[];
  participants: CouncilParticipant[];
};

export type CouncilConclusion = {
  author: string;
  content: string;
  createdAt: string;
};

export type CouncilSession = {
  id: string;
  status: "active" | "closed";
  createdAt: string;
  currentRequestId: string | null;
  conclusion: CouncilConclusion | null;
};

export type CouncilRequest = {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  status: "open" | "closed";
};

export type CouncilFeedback = {
  id: string;
  requestId: string;
  author: string;
  content: string;
  createdAt: string;
};

export type CouncilParticipant = {
  agentName: string;
  lastSeen: string;
  lastRequestSeen: string | null;
  lastFeedbackSeen: string | null;
};

export type StartCouncilInput = {
  request: string;
  agentName: string;
};

export type StartCouncilResult = {
  agentName: string;
  session: CouncilSession;
  request: CouncilRequest;
  state: CouncilState;
};

export type GetCurrentSessionDataInput = {
  agentName: string;
  cursor?: string;
};

export type GetCurrentSessionDataResult = {
  agentName: string;
  session: CouncilSession | null;
  request: CouncilRequest | null;
  feedback: CouncilFeedback[];
  participant: CouncilParticipant;
  nextCursor: string | null;
  state: CouncilState;
};

export type CloseCouncilInput = {
  agentName: string;
  conclusion: string;
};

export type CloseCouncilResult = {
  agentName: string;
  session: CouncilSession;
  conclusion: CouncilConclusion;
  state: CouncilState;
};

export type SendResponseInput = {
  agentName: string;
  content: string;
};

export type SendResponseResult = {
  agentName: string;
  feedback: CouncilFeedback;
  state: CouncilState;
};
