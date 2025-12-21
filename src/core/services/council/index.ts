import { randomUUID } from "node:crypto";

import type { CouncilStateStore } from "../../state/store";
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
  ResetSessionResult,
  SessionCursor,
} from "./types";

export interface CouncilService {
  requestFeedback(input: RequestFeedbackInput): Promise<RequestFeedbackResult>;
  checkSession(input: CheckSessionInput): Promise<CheckSessionResult>;
  provideFeedback(input: ProvideFeedbackInput): Promise<ProvideFeedbackResult>;
  resetSession(): Promise<ResetSessionResult>;
}

export class CouncilServiceImpl implements CouncilService {
  constructor(private readonly store: CouncilStateStore) {}

  async requestFeedback(input: RequestFeedbackInput): Promise<RequestFeedbackResult> {
    return this.store.update((state) => {
      const now = nowIso();
      const session = state.session ?? createSession(now);
      const requestId = randomUUID();
      const request: CouncilRequest = {
        id: requestId,
        content: input.content,
        createdBy: input.agentId,
        createdAt: now,
        status: "open",
      };

      const { participants } = updateParticipant(state.participants, input.agentId, now, (participant) => ({
        ...participant,
        lastSeen: now,
        lastRequestSeen: requestId,
      }));

      const nextSession: CouncilSession = {
        ...session,
        status: "active",
        currentRequestId: requestId,
      };

      const nextState: CouncilState = {
        ...state,
        session: nextSession,
        requests: [...closeOpenRequests(state.requests), request],
        participants,
      };

      return {
        state: nextState,
        result: {
          session: nextSession,
          request,
          state: nextState,
        },
      };
    });
  }

  async checkSession(input: CheckSessionInput): Promise<CheckSessionResult> {
    return this.store.update((state) => {
      const now = nowIso();
      const existingParticipant = getParticipant(state.participants, input.agentId, now);
      const effectiveCursor: SessionCursor = input.cursor ?? {
        lastRequestSeen: existingParticipant.lastRequestSeen,
        lastFeedbackSeen: existingParticipant.lastFeedbackSeen,
      };

      const currentRequest = getCurrentRequest(state);
      const request = currentRequest && currentRequest.id !== effectiveCursor.lastRequestSeen ? currentRequest : null;
      const feedback = sliceAfterId(state.feedback, effectiveCursor.lastFeedbackSeen);
      const lastFeedback = feedback.at(-1);
      const nextCursor: SessionCursor = {
        lastRequestSeen: request ? request.id : effectiveCursor.lastRequestSeen,
        lastFeedbackSeen: lastFeedback ? lastFeedback.id : effectiveCursor.lastFeedbackSeen,
      };

      const { participants, participant } = updateParticipant(state.participants, input.agentId, now, (candidate) => ({
        ...candidate,
        lastSeen: now,
        lastRequestSeen: nextCursor.lastRequestSeen,
        lastFeedbackSeen: nextCursor.lastFeedbackSeen,
      }));

      const nextState: CouncilState = {
        ...state,
        participants,
      };

      return {
        state: nextState,
        result: {
          session: state.session,
          request,
          feedback,
          participant,
          nextCursor,
          state: nextState,
        },
      };
    });
  }

  async provideFeedback(input: ProvideFeedbackInput): Promise<ProvideFeedbackResult> {
    return this.store.update((state) => {
      const request = state.requests.find((candidate) => candidate.id === input.requestId);
      if (!request) {
        throw new Error(`Request not found: ${input.requestId}`);
      }

      const now = nowIso();
      const feedback: CouncilFeedback = {
        id: randomUUID(),
        requestId: request.id,
        author: input.agentId,
        content: input.content,
        createdAt: now,
      };

      const { participants } = updateParticipant(state.participants, input.agentId, now, (participant) => ({
        ...participant,
        lastSeen: now,
        lastRequestSeen: request.id,
        lastFeedbackSeen: feedback.id,
      }));

      const nextState: CouncilState = {
        ...state,
        feedback: [...state.feedback, feedback],
        participants,
      };

      return {
        state: nextState,
        result: {
          feedback,
          state: nextState,
        },
      };
    });
  }

  async resetSession(): Promise<ResetSessionResult> {
    return this.store.update((state) => {
      const nextState: CouncilState = {
        ...state,
        session: null,
        requests: [],
        feedback: [],
        participants: [],
      };

      return {
        state: nextState,
        result: {
          state: nextState,
        },
      };
    });
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function createSession(createdAt: string): CouncilSession {
  return {
    id: randomUUID(),
    status: "active",
    createdAt,
    currentRequestId: null,
  };
}

function closeOpenRequests(requests: CouncilRequest[]): CouncilRequest[] {
  return requests.map((request) => (request.status === "open" ? { ...request, status: "closed" } : request));
}

function getCurrentRequest(state: CouncilState): CouncilRequest | null {
  const currentId = state.session?.currentRequestId;
  if (!currentId) {
    return null;
  }

  return state.requests.find((request) => request.id === currentId) ?? null;
}

function sliceAfterId<T extends { id: string }>(items: T[], lastSeenId: string | null): T[] {
  if (!lastSeenId) {
    return items;
  }

  const index = items.findIndex((item) => item.id === lastSeenId);
  if (index === -1) {
    return items;
  }

  return items.slice(index + 1);
}

function getParticipant(participants: CouncilParticipant[], agentId: string, now: string): CouncilParticipant {
  const participant = participants.find((candidate) => candidate.agentId === agentId);
  if (participant) {
    return participant;
  }

  return {
    agentId,
    lastSeen: now,
    lastRequestSeen: null,
    lastFeedbackSeen: null,
  };
}

function updateParticipant(
  participants: CouncilParticipant[],
  agentId: string,
  now: string,
  updater: (participant: CouncilParticipant) => CouncilParticipant,
): { participants: CouncilParticipant[]; participant: CouncilParticipant } {
  const index = participants.findIndex((participant) => participant.agentId === agentId);
  const baseParticipant =
    index >= 0 && participants[index]
      ? participants[index]
      : {
          agentId,
          lastSeen: now,
          lastRequestSeen: null,
          lastFeedbackSeen: null,
        };
  const updated = updater(baseParticipant);
  const nextParticipants =
    index >= 0
      ? [...participants.slice(0, index), updated, ...participants.slice(index + 1)]
      : [...participants, updated];

  return { participants: nextParticipants, participant: updated };
}
