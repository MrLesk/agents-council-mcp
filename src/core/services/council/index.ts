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
  SessionCursor,
} from "./types";

export interface CouncilService {
  requestFeedback(input: RequestFeedbackInput): Promise<RequestFeedbackResult>;
  checkSession(input: CheckSessionInput): Promise<CheckSessionResult>;
  provideFeedback(input: ProvideFeedbackInput): Promise<ProvideFeedbackResult>;
}

export class CouncilServiceImpl implements CouncilService {
  constructor(private readonly store: CouncilStateStore) {}

  async requestFeedback(input: RequestFeedbackInput): Promise<RequestFeedbackResult> {
    return this.store.update((state) => {
      const now = nowIso();
      const session = createSession(now);
      const { agentName } = resolveAgentName([], input.agentName, { allowReuse: true });
      const requestId = randomUUID();
      const request: CouncilRequest = {
        id: requestId,
        content: input.content,
        createdBy: agentName,
        createdAt: now,
        status: "open",
      };

      const { participants, participant } = updateParticipant([], agentName, now, (candidate) => ({
        ...candidate,
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
        requests: [request],
        feedback: [],
        participants,
      };

      return {
        state: nextState,
        result: {
          agentName: participant.agentName,
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
      const allowReuse = input.cursor !== undefined;
      const { agentName, existingParticipant } = resolveAgentName(state.participants, input.agentName, {
        allowReuse,
      });
      const effectiveCursor: SessionCursor = input.cursor ?? {
        lastRequestSeen: existingParticipant?.lastRequestSeen ?? null,
        lastFeedbackSeen: existingParticipant?.lastFeedbackSeen ?? null,
      };

      const currentRequest = getCurrentRequest(state);
      const request = currentRequest && currentRequest.id !== effectiveCursor.lastRequestSeen ? currentRequest : null;
      const feedback = sliceAfterId(state.feedback, effectiveCursor.lastFeedbackSeen);
      const lastFeedback = feedback.at(-1);
      const nextCursor: SessionCursor = {
        lastRequestSeen: request ? request.id : effectiveCursor.lastRequestSeen,
        lastFeedbackSeen: lastFeedback ? lastFeedback.id : effectiveCursor.lastFeedbackSeen,
      };

      const { participants, participant } = updateParticipant(state.participants, agentName, now, (candidate) => ({
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
          agentName: participant.agentName,
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
      const { agentName } = resolveAgentName(state.participants, input.agentName, { allowReuse: true });
      const feedback: CouncilFeedback = {
        id: randomUUID(),
        requestId: request.id,
        author: agentName,
        content: input.content,
        createdAt: now,
      };

      const { participants, participant } = updateParticipant(state.participants, agentName, now, (candidate) => ({
        ...candidate,
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
          agentName: participant.agentName,
          feedback,
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

function resolveAgentName(
  participants: CouncilParticipant[],
  requestedName: string,
  options: { allowReuse: boolean },
): { agentName: string; existingParticipant: CouncilParticipant | null } {
  const existingParticipant = participants.find((participant) => participant.agentName === requestedName) ?? null;
  if (existingParticipant && options.allowReuse) {
    return { agentName: existingParticipant.agentName, existingParticipant };
  }

  return {
    agentName: nextAvailableAgentName(participants, requestedName),
    existingParticipant: options.allowReuse ? existingParticipant : null,
  };
}

function nextAvailableAgentName(participants: CouncilParticipant[], requestedName: string): string {
  if (!participants.some((participant) => participant.agentName === requestedName)) {
    return requestedName;
  }

  let suffix = 1;
  while (participants.some((participant) => participant.agentName === `${requestedName}#${suffix}`)) {
    suffix += 1;
  }

  return `${requestedName}#${suffix}`;
}

function updateParticipant(
  participants: CouncilParticipant[],
  agentName: string,
  now: string,
  updater: (participant: CouncilParticipant) => CouncilParticipant,
): { participants: CouncilParticipant[]; participant: CouncilParticipant } {
  const index = participants.findIndex((participant) => participant.agentName === agentName);
  const baseParticipant =
    index >= 0 && participants[index]
      ? participants[index]
      : {
          agentName,
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
