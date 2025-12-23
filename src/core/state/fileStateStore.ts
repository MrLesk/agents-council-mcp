import { promises as fs } from "node:fs";
import path from "node:path";

import type { CouncilState } from "../services/council/types";
import { resolveCouncilStatePath } from "./path";
import type { CouncilStateStore, CouncilStateUpdater } from "./store";

const DEFAULT_STATE_VERSION = 1;
const LOCK_STALE_MS = 30_000;
const LOCK_RETRY_DELAY_MS = 50;
const LOCK_MAX_WAIT_MS = 10_000;

export class FileCouncilStateStore implements CouncilStateStore {
  private readonly statePath: string;

  constructor(statePath?: string) {
    this.statePath = resolveCouncilStatePath(statePath);
  }

  async load(): Promise<CouncilState> {
    return readState(this.statePath);
  }

  async save(state: CouncilState): Promise<void> {
    await ensureStateDirectory(this.statePath);
    const lockPath = `${this.statePath}.lock`;
    await withLock(lockPath, async () => {
      await writeStateAtomic(this.statePath, state);
    });
  }

  async update<T>(updater: CouncilStateUpdater<T>): Promise<T> {
    await ensureStateDirectory(this.statePath);
    const lockPath = `${this.statePath}.lock`;
    return withLock(lockPath, async () => {
      const current = await readState(this.statePath);
      const { state, result } = await updater(current);
      await writeStateAtomic(this.statePath, state);
      return result;
    });
  }
}

function createInitialState(): CouncilState {
  return {
    version: DEFAULT_STATE_VERSION,
    session: null,
    requests: [],
    feedback: [],
    participants: [],
  };
}

async function readState(statePath: string): Promise<CouncilState> {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    return JSON.parse(raw) as CouncilState;
  } catch (error) {
    if (isErrno(error, "ENOENT")) {
      return createInitialState();
    }

    throw error;
  }
}

async function writeStateAtomic(statePath: string, state: CouncilState): Promise<void> {
  const directory = path.dirname(statePath);
  const tempPath = path.join(
    directory,
    `state.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`,
  );
  const handle = await fs.open(tempPath, "wx");

  try {
    await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }

  try {
    await fs.rename(tempPath, statePath);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

async function ensureStateDirectory(statePath: string): Promise<void> {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
}

async function withLock<T>(lockPath: string, action: () => Promise<T>): Promise<T> {
  await acquireLock(lockPath);

  try {
    return await action();
  } finally {
    await releaseLock(lockPath);
  }
}

async function acquireLock(lockPath: string): Promise<void> {
  const start = Date.now();

  while (true) {
    try {
      const payload = JSON.stringify({
        pid: process.pid,
        createdAt: new Date().toISOString(),
      });
      await fs.writeFile(lockPath, payload, { flag: "wx" });
      return;
    } catch (error) {
      if (!isErrno(error, "EEXIST")) {
        throw error;
      }

      if (await isLockStale(lockPath)) {
        await releaseLock(lockPath);
        continue;
      }

      if (Date.now() - start > LOCK_MAX_WAIT_MS) {
        throw new Error("Timed out waiting for state lock");
      }

      await delay(LOCK_RETRY_DELAY_MS);
    }
  }
}

async function releaseLock(lockPath: string): Promise<void> {
  try {
    await fs.unlink(lockPath);
  } catch (error) {
    if (!isErrno(error, "ENOENT")) {
      throw error;
    }
  }
}

async function isLockStale(lockPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(lockPath);
    return Date.now() - stats.mtimeMs > LOCK_STALE_MS;
  } catch (error) {
    if (isErrno(error, "ENOENT")) {
      return false;
    }

    throw error;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" && error !== null && "code" in error && (error as NodeJS.ErrnoException).code === code
  );
}
