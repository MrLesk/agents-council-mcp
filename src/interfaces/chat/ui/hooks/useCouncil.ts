import { useCallback, useEffect, useMemo, useState } from "react";

import {
  closeCouncil,
  getCurrentSessionData,
  joinCouncil,
  resolveWebSocketUrl,
  sendResponse,
  startCouncil,
} from "../api";
import type { CouncilStateDto, FeedbackDto, RequestDto } from "../types";

export type ConnectionStatus = "listening" | "offline";

export type SessionStatus = "active" | "closed" | "none";

export type HallState = "idle" | "active" | "closed";

export type CouncilContext = {
  state: CouncilStateDto | null;
  connection: ConnectionStatus;
  busy: boolean;
  error: string | null;
  notice: string | null;
  lastUpdated: string | null;
  sessionStatus: SessionStatus;
  hallState: HallState;
  currentRequest: RequestDto | null;
  feedback: FeedbackDto[];
  canClose: (name: string) => boolean;
  refresh: () => Promise<void>;
  start: (name: string, request: string) => Promise<boolean>;
  join: (name: string) => Promise<boolean>;
  send: (name: string, content: string) => Promise<boolean>;
  close: (name: string, conclusion: string) => Promise<boolean>;
  clearError: () => void;
  clearNotice: () => void;
};

export function useCouncil(name: string | null): CouncilContext {
  const [state, setState] = useState<CouncilStateDto | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("offline");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wsAttempt, setWsAttempt] = useState(0);

  const sessionStatus: SessionStatus = state?.session?.status ?? "none";

  const currentRequest: RequestDto | null = useMemo(() => {
    if (!state?.session?.current_request_id) {
      return null;
    }
    return state.requests.find((r) => r.id === state.session?.current_request_id) ?? null;
  }, [state]);

  const feedback: FeedbackDto[] = state?.feedback ?? [];

  const hallState: HallState = useMemo(() => {
    if (sessionStatus === "active" && currentRequest) {
      return "active";
    }
    if (sessionStatus === "closed" && currentRequest) {
      return "closed";
    }
    return "idle";
  }, [sessionStatus, currentRequest]);

  const canClose = useCallback(
    (_userName: string): boolean => {
      return Boolean(hallState === "active" && currentRequest);
    },
    [hallState, currentRequest],
  );

  const refresh = useCallback(async () => {
    if (!name) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await getCurrentSessionData(name);
      setState(result.state);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh session.");
    } finally {
      setBusy(false);
    }
  }, [name]);

  // Initial fetch when name is set
  useEffect(() => {
    if (name) {
      void refresh();
    }
  }, [name, refresh]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!name) {
      return;
    }
    const wsUrl = resolveWebSocketUrl();
    if (!wsUrl) {
      return;
    }

    // wsAttempt triggers reconnection after WebSocket closes
    const _attempt = wsAttempt;
    void _attempt;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      setConnection("listening");
      void refresh();
    });

    const scheduleReconnect = () => {
      if (reconnectTimer) {
        return;
      }
      setConnection("offline");
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        setWsAttempt((attempt) => attempt + 1);
      }, 1500);
    };

    ws.addEventListener("close", scheduleReconnect);
    ws.addEventListener("error", scheduleReconnect);

    ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as { type?: string };
        if (payload.type === "state-changed") {
          void refresh();
          return;
        }
      } catch {
        // Fall through and still refresh
      }
      void refresh();
    });

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      ws.close();
    };
  }, [name, refresh, wsAttempt]);

  const start = useCallback(async (userName: string, request: string): Promise<boolean> => {
    if (!request.trim()) {
      return false;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await startCouncil(userName, request.trim());
      setState(result.state);
      setLastUpdated(new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start the council.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const join = useCallback(async (userName: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await joinCouncil(userName);
      setState(result.state);
      setLastUpdated(new Date().toLocaleTimeString());
      if (!result.session_id || !result.request) {
        setNotice("No active council found.");
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to join the council.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const send = useCallback(async (userName: string, content: string): Promise<boolean> => {
    if (!content.trim()) {
      return false;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await sendResponse(userName, content.trim());
      setState(result.state);
      setLastUpdated(new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send response.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const close = useCallback(async (userName: string, conclusion: string): Promise<boolean> => {
    if (!conclusion.trim()) {
      return false;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await closeCouncil(userName, conclusion.trim());
      setState(result.state);
      setLastUpdated(new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to close the council.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    state,
    connection,
    busy,
    error,
    notice,
    lastUpdated,
    sessionStatus,
    hallState,
    currentRequest,
    feedback,
    canClose,
    refresh,
    start,
    join,
    send,
    close,
    clearError: () => setError(null),
    clearNotice: () => setNotice(null),
  };
}
