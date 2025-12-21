import { randomUUID } from "node:crypto";

import type { CouncilStateStore } from "../../state/store";
import type {
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
} from "./types";

export interface CouncilService {
  startCouncil(input: StartCouncilInput): Promise<StartCouncilResult>;
  getCurrentSessionData(input: GetCurrentSessionDataInput): Promise<GetCurrentSessionDataResult>;
  sendResponse(input: SendResponseInput): Promise<SendResponseResult>;
}

export class CouncilServiceImpl implements CouncilService {
  constructor(private readonly store: CouncilStateStore) {}

  async startCouncil(input: StartCouncilInput): Promise<StartCouncilResult> {
    return this.store.update((state) => {
      const now = nowIso();
      const session = createSession(now);
      const { agentName } = resolveAgentName([], input.agentName, { allowReuse: true });
      const requestId = randomUUID();
      const request: CouncilRequest = {
        id: requestId,
        content: input.request,
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

  async getCurrentSessionData(input: GetCurrentSessionDataInput): Promise<GetCurrentSessionDataResult> {
    return this.store.update((state) => {
      const now = nowIso();
      const { agentName } = resolveAgentName(state.participants, input.agentName, {
        allowReuse: true,
      });
      const effectiveCursor = input.cursor ?? null;
      const request = getCurrentRequest(state);
      const feedback = sliceAfterId(state.feedback, effectiveCursor);
      const lastFeedback = feedback.at(-1);
      const nextCursor = lastFeedback ? lastFeedback.id : effectiveCursor;

      const { participants, participant } = updateParticipant(state.participants, agentName, now, (candidate) => ({
        ...candidate,
        lastSeen: now,
        lastRequestSeen: request ? request.id : candidate.lastRequestSeen,
        lastFeedbackSeen: nextCursor,
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

  async sendResponse(input: SendResponseInput): Promise<SendResponseResult> {
    return this.store.update((state) => {
      const request = getCurrentRequest(state);
      if (!request) {
        throw new Error("No active request.");
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
