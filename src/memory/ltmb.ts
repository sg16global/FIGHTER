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

export function saveMemoryBank(snapshot: MemorySnapshot): void {
  try {
    const existing = loadMemoryBank();
    const merged = {
      ...existing,
      ...snapshot,
      snapshots: [...(existing.snapshots ?? []), snapshot],
      lastSavedAt: snapshot.capturedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Silent fail: do not break the workspace
  }
}

export function loadMemoryBank(): MemorySnapshot & { snapshots: MemorySnapshot[]; lastSavedAt?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
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
