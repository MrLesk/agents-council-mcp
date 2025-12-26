import { useState } from "react";

import { Settings } from "../components/Settings";
import type { CouncilContext } from "../hooks/useCouncil";

type HallProps = {
  name: string;
  council: CouncilContext;
  onNameChange: (name: string) => void;
};

export function Hall({ name, council, onNameChange }: HallProps) {
  const [requestDraft, setRequestDraft] = useState("");
  const [responseDraft, setResponseDraft] = useState("");
  const [conclusionDraft, setConclusionDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSummon, setShowSummon] = useState(false);

  const {
    connection,
    busy,
    error,
    notice,
    sessionStatus,
    hallState,
    currentRequest,
    feedback,
    canClose,
    start,
    send,
    close,
  } = council;

  const isActive = hallState === "active";
  const isIdle = hallState === "idle";
  const canCloseCouncil = canClose(name);
  const isCreator = Boolean(currentRequest && currentRequest.created_by === name);
  const hasSpoken = Boolean(
    currentRequest && feedback.some((entry) => entry.request_id === currentRequest.id && entry.author === name),
  );
  const speakLabel = !isCreator && !hasSpoken ? "Join and speak" : "Speak";
  const summonLabel = currentRequest ? "Summon a New Council" : "Summon the Council";

  const sessionLabel =
    sessionStatus === "none" ? "No session" : sessionStatus === "active" ? "In session" : "Concluded";

  const handleStart = async () => {
    const success = await start(name, requestDraft);
    if (success) {
      setRequestDraft("");
      setShowSummon(false);
    }
  };

  const handleSend = async () => {
    const success = await send(name, responseDraft);
    if (success) {
      setResponseDraft("");
    }
  };

  const handleClose = async () => {
    const success = await close(name, conclusionDraft);
    if (success) {
      setConclusionDraft("");
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">
          <div className="brand-text">
            <div className="brand-title">Agents Council — Hall</div>
          </div>
        </div>
        <div className="hero-controls">
          <div className="identity">
            You are <strong>{name}</strong>
          </div>
          <button type="button" className="btn btn-ghost btn-settings" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </header>

      {connection !== "listening" ? (
        <output className={`status-banner status-banner-${connection}`}>
          Connection lost. Attempting to rejoin...
        </output>
      ) : null}

      {error ? (
        <div className="alert" role="alert">
          {error}
        </div>
      ) : null}

      {notice ? <output className="notice">{notice}</output> : null}

      <main className="hall">
        <section className="panel matter-panel">
          <div className="panel-header">
            <h2>The Matter Before the Council</h2>
            <div className="matter-header-actions">
              <div className={`status-pill status-${sessionStatus}`}>{sessionLabel}</div>
            </div>
          </div>
          <div className={`matter-grid${isActive ? "" : " matter-grid-single"}`}>
            <div className="matter-details">
              {currentRequest ? (
                <div className="request-card">
                  <div className="request-card-label">Council Request</div>
                  <p className="request-text">{currentRequest.content}</p>
                  <div className="meta-row">
                    Summoned by {currentRequest.created_by} at {formatTime(currentRequest.created_at)}
                  </div>
                </div>
              ) : (
                <p className="muted">No council is in session. Bring a matter before the wise.</p>
              )}
              {council.state?.session?.conclusion ? (
                <div className="conclusion">
                  <div className="solution-label">The Conclusion</div>
                  <p className="conclusion-text">{council.state.session.conclusion.content}</p>
                  <div className="meta-row">
                    Spoken by {council.state.session.conclusion.author} at{" "}
                    {formatDateTime(council.state.session.conclusion.created_at)}
                  </div>
                </div>
              ) : null}
              {!isActive ? (
                <div className="matter-cta">
                  <button type="button" className="btn btn-primary" onClick={() => setShowSummon(true)} disabled={busy}>
                    {summonLabel}
                  </button>
                </div>
              ) : null}
            </div>
            {isActive ? (
              <div className="matter-actions">
                <div className="seal-panel">
                  <label className="label" htmlFor="conclusion-draft">
                    Seal the Matter
                  </label>
                  <textarea
                    id="conclusion-draft"
                    className="textarea"
                    value={conclusionDraft}
                    onChange={(event) => setConclusionDraft(event.target.value)}
                    placeholder="Speak the final word..."
                    rows={3}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void handleClose()}
                    disabled={busy || !conclusionDraft.trim() || !canCloseCouncil}
                  >
                    Seal the Matter
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel voices-panel">
          <div className="panel-header">
            <h2>Voices of the Council</h2>
            {!isIdle ? <span className="meta">{feedback.length} {feedback.length === 1 ? "voice" : "voices"}</span> : null}
          </div>
          {isIdle ? (
            <div className="empty">No council is in session.</div>
          ) : (
            <>
              <div className="messages">
                {feedback.length === 0 ? (
                  <div className="empty">The council listens...</div>
                ) : (
                  feedback.map((entry) => (
                    <article key={entry.id} className="message">
                      <header>
                        <span className="author">{entry.author}</span>
                        <span className="meta">{formatTime(entry.created_at)}</span>
                      </header>
                      <p>{entry.content}</p>
                    </article>
                  ))
                )}
              </div>
              {isActive ? (
                <div className="composer">
                  <label className="label" htmlFor="response-draft">
                    Your Counsel
                  </label>
                  <textarea
                    id="response-draft"
                    className="textarea"
                    value={responseDraft}
                    onChange={(event) => setResponseDraft(event.target.value)}
                    placeholder="Share your wisdom..."
                    rows={4}
                  />
                  <div className="actions">
                    <button type="button" className="btn btn-primary" onClick={() => void handleSend()} disabled={busy}>
                      {speakLabel}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>

      {showSettings ? (
        <Settings
          currentName={name}
          onSave={(newName) => {
            onNameChange(newName);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      ) : null}

      {showSummon ? (
        <div
          className="dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowSummon(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setShowSummon(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Summon the Council"
        >
          <div className="dialog-panel">
            <div className="dialog-header">
              <h2>Summon the Council</h2>
              <button type="button" className="dialog-close" onClick={() => setShowSummon(false)} aria-label="Close">
                ×
              </button>
            </div>
            <form
              className="dialog-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleStart();
              }}
            >
              <label className="label" htmlFor="request-draft">
                What matter shall we deliberate?
              </label>
              <textarea
                id="request-draft"
                className="textarea"
                value={requestDraft}
                onChange={(event) => setRequestDraft(event.target.value)}
                placeholder="State the matter before the council..."
                rows={4}
              />
              <div className="dialog-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSummon(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy || !requestDraft.trim()}>
                  Summon the Council
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
