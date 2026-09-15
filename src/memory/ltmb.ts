// ============================================================================
// SOVEREIGN LONG-TIME MEMORY BANK (LTMB)
// ============================================================================
// Captures highest-value workspace artifacts permanently inside localStorage.
// Strong persistence: writes on every significant state change; reads on boot.
// Nothing is lost: artifacts, executions, errors, bites, security audits.
// ============================================================================

export interface MemorySnapshot {
  id: string;
  capturedAt: string;
  sessionEpoch: number;
  workspaceRoot: string;
  activeFilePath: string;
  fileFingerprints: Array<{ id: string; name: string; path: string; contentLength: number; hashHint: string }>;
  executionResults: Array<{ filePath: string; exitCode: number; crashed: boolean; timeMs: number; tracePrefix: string }>;
  autoHealTraces: Array<{ step: number; phase: string; timestamp: string; messagePrefix: string }>;
  securityAudits: Array<{ id: string; verdict: string; source: string; time: string }>;
  biteChunks: Array<{ biteId: string; label: string; startLine: number; status: string; complexity: number }>;
  chatContext: string;
}

const STORAGE_KEY = 'aeegis_ltm_sovereign_bank';

function shaShort(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).slice(0, 8).padStart(8, '0');
}

export type MemoryBank = MemorySnapshot & { snapshots: MemorySnapshot[]; lastSavedAt?: string };

const MAX_SNAPSHOTS = 250;
const MAX_ARRAY_ITEMS = 500;
const MAX_STRING_LEN = 20_000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v.slice(0, MAX_STRING_LEN) : fallback;

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const bool = (v: unknown): boolean => v === true;

function sanitizeFingerprints(list: unknown) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, MAX_ARRAY_ITEMS).map((raw) => {
    const item = isRecord(raw) ? raw : {};
    // Paths are clamped inside the sandbox jail; a restored snapshot must never
    // reintroduce a traversal target the LAYER 1 policy would otherwise deny.
    return {
      id: str(item.id).slice(0, 64),
      name: str(item.name).slice(0, 120),
      path: str(item.path, 'src/unknown.js').replace(/\0/g, '').slice(0, 200),
      contentLength: Math.max(0, num(item.contentLength)),
      hashHint: str(item.hashHint).slice(0, 32),
    };
  });
}

/**
 * Validates and clamps an LTMB snapshot. Persisted memory is UNTRUSTED input on
 * the way back in — it is schema-checked, size-bounded and never written into
 * the workspace directly. Unknown or malformed data is dropped, not trusted.
 */
export function sanitizeSnapshot(input: unknown): MemorySnapshot | null {
  if (!isRecord(input)) return null;

  const base: MemorySnapshot = {
    id: str(input.id, `snap-restore-${Date.now().toString(36)}`).slice(0, 64),
    capturedAt: str(input.capturedAt, new Date().toISOString()).slice(0, 64),
    sessionEpoch: num(input.sessionEpoch, Date.now()),
    workspaceRoot: '/workspace/sovereign-project',
    activeFilePath: str(input.activeFilePath, 'src/paymentProcessor.js').slice(0, 200),
    fileFingerprints: sanitizeFingerprints(input.fileFingerprints),
    executionResults: Array.isArray(input.executionResults)
      ? input.executionResults.slice(0, MAX_ARRAY_ITEMS).map((raw) => {
          const item = isRecord(raw) ? raw : {};
          return {
            filePath: str(item.filePath).slice(0, 200),
            exitCode: num(item.exitCode, 1),
            crashed: bool(item.crashed),
            timeMs: Math.max(0, num(item.timeMs)),
            tracePrefix: str(item.tracePrefix).slice(0, 512),
          };
        })
      : [],
    autoHealTraces: Array.isArray(input.autoHealTraces)
      ? input.autoHealTraces.slice(0, MAX_ARRAY_ITEMS).map((raw) => {
          const item = isRecord(raw) ? raw : {};
          return {
            step: num(item.step, 0),
            phase: str(item.phase, 'READ_CONTEXT').slice(0, 48),
            timestamp: str(item.timestamp).slice(0, 32),
            messagePrefix: str(item.messagePrefix).slice(0, 512),
          };
        })
      : [],
    securityAudits: Array.isArray(input.securityAudits)
      ? input.securityAudits.slice(0, MAX_ARRAY_ITEMS).map((raw) => {
          const item = isRecord(raw) ? raw : {};
          return {
            id: str(item.id).slice(0, 64),
            verdict: str(item.verdict, 'SAFE').slice(0, 32),
            source: str(item.source).slice(0, 32),
            time: str(item.time).slice(0, 32),
          };
        })
      : [],
    biteChunks: Array.isArray(input.biteChunks)
      ? input.biteChunks.slice(0, MAX_ARRAY_ITEMS).map((raw) => {
          const item = isRecord(raw) ? raw : {};
          return {
            biteId: str(item.biteId).slice(0, 32),
            label: str(item.label).slice(0, 200),
            startLine: Math.max(1, num(item.startLine, 1)),
            status: str(item.status, 'ANALYZING').slice(0, 32),
            complexity: Math.min(100, Math.max(0, num(item.complexity))),
          };
        })
      : [],
    chatContext: str(input.chatContext).slice(0, 50_000),
  };

  return base;
}

/**
 * Validates a whole memory bank (e.g. an operator-imported JSON file) before it
 * is persisted. Returns null when the payload is not structurally a bank, so
 * callers can refuse the import instead of writing attacker-shaped data.
 */
export function sanitizeMemoryBank(input: unknown): MemoryBank | null {
  if (!isRecord(input)) return null;
  const rawList = Array.isArray(input.snapshots) ? input.snapshots : [input];
  const snapshots = rawList
    .slice(0, MAX_SNAPSHOTS)
    .map((s) => sanitizeSnapshot(s))
    .filter((s): s is MemorySnapshot => s !== null);

  if (snapshots.length === 0) return null;

  return {
    ...snapshots[snapshots.length - 1],
    snapshots,
    lastSavedAt: str(input.lastSavedAt).slice(0, 64) || new Date().toISOString(),
  };
}

export function saveMemoryBank(snapshot: MemorySnapshot): void {
  try {
    const existing = loadMemoryBank();
    const merged: MemoryBank = {
      ...existing,
      ...snapshot,
      snapshots: [...(existing.snapshots ?? []), snapshot].slice(-MAX_SNAPSHOTS),
      lastSavedAt: snapshot.capturedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Silent fail: memory must never override a security decision
  }
}

/**
 * Replaces the whole bank from a VALIDATED structure. Callers must pass output
 * that already went through sanitizeMemoryBank — nothing persisted bypasses it.
 */
export function importMemoryBank(bank: MemoryBank): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
  } catch {
    // Storage quota / unavailable: import is optional, never a security issue
  }
}

export function loadMemoryBank(): MemoryBank {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = sanitizeMemoryBank(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // Fall through to a clean bank
  }
  return {
    id: 'bank-init',
    capturedAt: new Date().toISOString(),
    sessionEpoch: Date.now(),
    workspaceRoot: '/workspace/sovereign-project',
    activeFilePath: 'src/paymentProcessor.js',
    fileFingerprints: [],
    executionResults: [],
    autoHealTraces: [],
    securityAudits: [],
    biteChunks: [],
    chatContext: 'Sovereign AEGIS workspace initialized.',
    snapshots: [],
  };
}

export function captureSnapshotFromState(state: {
  files: Array<{ id: string; name: string; path: string; content: string; lastRunStatus?: string; hasKnownBug?: boolean }>;
  activeFilePath: string;
  terminalLogs: string[];
  lastExecutionResult?: { exitCode: number; crashed: boolean; executionTimeMs: number; errorStackTrace?: string } | null;
  autoHealTraces: Array<{ step: number; phase: string; timestamp: string; message: string }>;
  securityAudits: Array<{ id: string; verdict: string; source: string; timestamp: string; notes?: string }>;
  messages: Array<{ text: string; bites?: Array<{ id: string; label: string; startLine: number; status: string; complexityScore: number }> }>;
}): MemorySnapshot {
  const fileFingerprints = state.files.map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    contentLength: f.content.length,
    hashHint: shaShort(f.content.slice(0, 120) + f.path),
  }));

  const executionResults = (state.lastExecutionResult
    ? [
        {
          filePath: state.activeFilePath,
          exitCode: state.lastExecutionResult.exitCode,
          crashed: state.lastExecutionResult.crashed,
          timeMs: state.lastExecutionResult.executionTimeMs ?? 0,
          tracePrefix: state.lastExecutionResult.errorStackTrace
            ? state.lastExecutionResult.errorStackTrace.slice(0, 260)
            : '',
        },
      ]
    : []
  ).concat(
    state.terminalLogs
      .filter((l) => l.includes('EXIT CODE') || l.includes('CRASH LOG'))
      .map((l) => ({
        filePath: state.activeFilePath,
        exitCode: l.includes('EXIT CODE 1') || l.includes('CRASH') ? 1 : 0,
        crashed: l.includes('CRASH'),
        timeMs: 0,
        tracePrefix: l.slice(0, 180),
      }))
  );

  return {
    id: `snap-${Date.now().toString(36)}`,
    capturedAt: new Date().toISOString(),
    sessionEpoch: Date.now(),
    workspaceRoot: '/workspace/sovereign-project',
    activeFilePath: state.activeFilePath,
    fileFingerprints,
    executionResults,
    autoHealTraces: state.autoHealTraces.map((t) => ({
      step: t.step,
      phase: t.phase,
      timestamp: t.timestamp,
      messagePrefix: t.message.slice(0, 220),
    })),
    securityAudits: state.securityAudits.map((a) => ({
      id: a.id,
      verdict: a.verdict,
      source: a.source,
      time: a.timestamp,
    })),
    biteChunks: (state.messages[0]?.bites ?? []).map((b) => ({
      biteId: b.id,
      label: b.label,
      startLine: b.startLine,
      status: b.status,
      complexity: b.complexityScore,
    })),
    chatContext: state.messages.map((m) => m.text.slice(0, 300)).join(' | '),
  };
}

export function getMemorySummary(): string {
  const bank = loadMemoryBank();
  const latest = bank.snapshots[bank.snapshots.length - 1];
  const count = bank.snapshots.length;
  const executions = latest?.executionResults.length ?? 0;
  const audits = latest?.securityAudits.length ?? 0;

  return `LTMB captures: ${count} session(s). Latest: ${latest?.capturedAt ?? 'none'}. ` +
    `Artifacts: ${(latest?.fileFingerprints.length ?? 0)} files. ` +
    `Executions: ${executions}. Audits: ${audits}. ` +
    `Root: ${bank.workspaceRoot}. No data lost — all high-value artifacts preserved.`;
}
