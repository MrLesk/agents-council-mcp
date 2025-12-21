export type CouncilState = {
  version: number;
  session: CouncilSession | null;
  requests: CouncilRequest[];
  feedback: CouncilFeedback[];
  participants: CouncilParticipant[];
};

export type CouncilSession = {
  id: string;
  status: "active";
  createdAt: string;
  currentRequestId: string | null;
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

export type RequestFeedbackInput = {
  content: string;
  agentName: string;
};

export type RequestFeedbackResult = {
  agentName: string;
  session: CouncilSession;
  request: CouncilRequest;
  state: CouncilState;
};

export type SessionCursor = {
  lastRequestSeen: string | null;
  lastFeedbackSeen: string | null;
};

export type CheckSessionInput = {
  agentName: string;
  cursor?: SessionCursor;
};

export type CheckSessionResult = {
  agentName: string;
  session: CouncilSession | null;
  request: CouncilRequest | null;
  feedback: CouncilFeedback[];
  participant: CouncilParticipant;
  nextCursor: SessionCursor;
  state: CouncilState;
};

export type ProvideFeedbackInput = {
  agentName: string;
  requestId: string;
  content: string;
};

export type ProvideFeedbackResult = {
  agentName: string;
  feedback: CouncilFeedback;
  state: CouncilState;
};
