// ============================================================================
// SOVEREIGN SECURITY KERNEL // THE SINGLE TRUST CHOKEPOINT
// ============================================================================
// KALI GPT, SHELL GPT and TERMINAL GPT are NOT conversational models. They are
// the three backend security layers of this application, and this module is the
// kernel that chains them into one firewall with no bypass path:
//
//   LAYER 1 — KALI GPT    (Threat Intelligence & Policy)
//             Every payload (prompt, model output, file write, patch) is
//             inspected against the Double-Layer Shield rule base. A Critical
//             finding hard-denies and is written immutably to the audit ledger.
//
//   LAYER 2 — SHELL GPT   (Command Sanitization)
//             Shell text is tokenized and every segment — including pipeline
//             stages, subshells, redirects and separators — must individually
//             clear the policy. The kernel only ever forwards argv, never a
//             raw string to any interpreter.
//
//   LAYER 3 — TERMINAL GPT(Sandboxed Execution Gate)
//             Execution requires a single-use, TTL-bound permit whose payload
//             hash matches the code being run. The sandbox engine consumes the
//             permit itself; unpermitted calls are refused at the engine door,
//             which is the only door.
//
// The audit ledger is a hash chain: every entry commits to the previous one,
// so tampering (or a disabled check) is detectable by verifyShieldIntegrity().
// ============================================================================

import {
  DEFAULT_SHIELD_CONFIG,
  FORBIDDEN_TELEMETRY_HOSTS,
  inspectSecurityPayload,
  validateSandboxPath,
  type SecurityAuditResult,
  type SecurityPayloadSource,
  type ShieldConfig,
  type ThreatMatch,
} from './doubleLayerShield';

export type LayerId = 'LAYER1_KALI' | 'LAYER2_SHELL' | 'LAYER3_TERMINAL';

export const LAYER_META: Record<LayerId, { name: string; duty: string; color: string }> = {
  LAYER1_KALI: {
    name: 'KALI GPT',
    duty: 'Threat intelligence · rule-base inspection · audit ledger',
    color: '#ff4d5e',
  },
  LAYER2_SHELL: {
    name: 'SHELL GPT',
    duty: 'Shell tokenization · argv sanitization · segment isolation',
    color: '#ffb020',
  },
  LAYER3_TERMINAL: {
    name: 'TERMINAL GPT',
    duty: 'Execution gate · single-use permits · sandbox dispatch',
    color: '#00f2fe',
  },
};

// ----------------------------------------------------------------------------
// Tamper-evident audit ledger (hash chain)
// ----------------------------------------------------------------------------

export interface LedgerEntry {
  seq: number;
  hash: string;
  prevHash: string;
  audit: SecurityAuditResult;
}

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(seed: number, text: string): number {
  let h = seed;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** Two-round 64-bit-width digest built from two FNV lanes; sufficient for a
 *  tamper-EVIDENT (not signature) chain inside the client. */
function chainHash(prevHash: string, payload: string): string {
  const a = fnv1a(FNV_OFFSET, payload) ^ fnv1a(0x7fffffff, prevHash);
  const b = fnv1a(0x7feb352d, `${payload.length}:${prevHash}:${payload}`);
  return `${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}

const GENESIS_HASH = '0000000000000000';
const ledger: LedgerEntry[] = [];
const listeners = new Set<() => void>();

export function subscribeShieldLedger(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commitToLedger(audit: SecurityAuditResult): LedgerEntry {
  const prevHash = ledger.length === 0 ? GENESIS_HASH : ledger[ledger.length - 1].hash;
  const entry: LedgerEntry = {
    seq: ledger.length + 1,
    prevHash,
    hash: chainHash(prevHash, `${audit.id}|${audit.verdict}|${audit.contentHash}|${audit.source}`),
    audit,
  };
  ledger.push(entry);
  if (ledger.length > 400) ledger.splice(0, ledger.length - 400); // bounded, tail-committed
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // A UI listener can never break the security path.
    }
  });
  return entry;
}

export function getShieldLedger(): readonly LedgerEntry[] {
  return ledger;
}

export interface ShieldIntegrityReport {
  intact: boolean;
  entries: number;
  blockedCount: number;
  containedCount: number;
  headHash: string;
  brokenAtSeq?: number;
  reason?: string;
}

/** Recomputes the whole chain; any rewrite of an entry, deletion, or an
 *  inspection that bypassed the kernel changes the head and is reported here. */
export function verifyShieldIntegrity(): ShieldIntegrityReport {
  let prevHash = GENESIS_HASH;
  for (const entry of ledger) {
    const expected = chainHash(
      prevHash,
      `${entry.audit.id}|${entry.audit.verdict}|${entry.audit.contentHash}|${entry.audit.source}`,
    );
    if (entry.hash !== expected || entry.prevHash !== prevHash || entry.seq !== ledger.indexOf(entry) + 1) {
      return {
        intact: false,
        entries: ledger.length,
        blockedCount: ledger.filter((e) => e.audit.verdict === 'BLOCKED_SYSCALL').length,
        containedCount: ledger.filter((e) => e.audit.verdict === 'SANDBOX_CONTAINED').length,
        headHash: entry.hash,
        brokenAtSeq: entry.seq,
        reason: `Chain mismatch at entry #${entry.seq}. The ledger was mutated or an inspection bypassed the kernel.`,
      };
    }
    prevHash = entry.hash;
  }
  return {
    intact: true,
    entries: ledger.length,
    blockedCount: ledger.filter((e) => e.audit.verdict === 'BLOCKED_SYSCALL').length,
    containedCount: ledger.filter((e) => e.audit.verdict === 'SANDBOX_CONTAINED').length,
    headHash: prevHash,
  };
}

// ----------------------------------------------------------------------------
// Layer configuration
// ----------------------------------------------------------------------------

let activeConfig: ShieldConfig = { ...DEFAULT_SHIELD_CONFIG };

export function getShieldConfig(): ShieldConfig {
  return { ...activeConfig };
}

export function updateShieldConfig(patch: Partial<ShieldConfig>): ShieldConfig {
  // allowNetworkFetch can only be tightened from here; loosening requires an
  // explicit operator action recorded on the ledger.
  activeConfig = { ...activeConfig, ...patch };
  commitToLedger(
    inspectSecurityPayload(
      `SHIELD CONFIG UPDATE :: ${JSON.stringify(patch)}`,
      'FILE_WRITE',
      activeConfig,
    ),
  );
  return getShieldConfig();
}

// ----------------------------------------------------------------------------
// LAYER 1 — KALI GPT :: inspection entrypoint for every boundary
// ----------------------------------------------------------------------------

export interface KaliInspection extends SecurityAuditResult {
  layer: LayerId;
  ledgerSeq: number;
  /** True only when nothing may proceed on the strength of this payload. */
  denied: boolean;
}

export function kaliInspect(
  payload: string,
  source: SecurityPayloadSource,
): KaliInspection {
  const audit = inspectSecurityPayload(payload, source, activeConfig);
  const entry = commitToLedger(audit);
  return {
    ...audit,
    layer: 'LAYER1_KALI',
    ledgerSeq: entry.seq,
    denied: !audit.executionAllowed,
  };
}

/** Model-output firewall: text arriving from the remote Mistral API or the
 *  offline engine is treated as UNTRUSTED input, exactly like a user prompt. */
export interface OutputGateResult {
  allowed: boolean;
  text: string;
  audit: KaliInspection;
}

export function kaliGateModelOutput(rawText: string): OutputGateResult {
  const audit = kaliInspect(rawText, 'AI_CODE_OUTPUT');
  if (audit.denied) {
    return {
      allowed: false,
      text:
        '⛔ OUTPUT QUARANTINED BY KALI GPT (LAYER 1): the response contained an actionable ' +
        'attack payload and was removed before it could reach the editor, terminal, or ledger.',
      audit,
    };
  }
  return { allowed: true, text: rawText, audit };
}

// ----------------------------------------------------------------------------
// LAYER 2 — SHELL GPT :: argv-level command sanitization
// ----------------------------------------------------------------------------

export type ShellVerdict = 'CLEARED' | 'QUARANTINED' | 'BLOCKED';

export interface ShellCommandAssessment {
  verdict: ShellVerdict;
  /** Original text, normalized. Never executed raw. */
  normalized: string;
  /** Safe argv the execution layer may consume, if any. */
  argv: string[] | null;
  /** Segments the raw string decomposed into (pipelines, ;, &&, subshells). */
  segments: string[];
  threats: ThreatMatch[];
  reason: string;
  audit?: KaliInspection;
}

/** Commands the in-browser terminal GPT can actually service. Everything else
 *  is refused at this layer — the terminal never forwards an unknown command. */
const ALLOWED_COMMANDS = new Set([
  'node',
  'ls',
  'cat',
  'echo',
  'pwd',
  'wc',
  'head',
  'tail',
  'grep',
  'whoami',
  'shield',
  'help',
  'clear',
]);

/** Exposed so the UI can render the exact policy surface without duplicating it. */
export const ALLOWED_SHELL_VERBS: readonly string[] = [...ALLOWED_COMMANDS];

const READ_ONLY_FLAG = /^-[a-z]*[rR]?$/;
const DANGEROUS_SHELL_SYNTAX = /[<>`]|\$\(|\b(?:exec|system|spawn)\b/i;

function splitSegments(command: string): string[] {
  return command
    .replace(/\$\(([^()]*)\)/g, ' $1 ')     // subshells become standalone segments
    .replace(/`([^`]*)`/g, ' $1 ')
    .split(/(?:&&|\|\||;|\||\n)+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * SHELL GPT never trusts its own tokenizer output blindly: it evaluates every
 * segment, and the caller only receives argv when ALL segments clear policy.
 */
export function shellSanitizeCommand(rawCommand: string): ShellCommandAssessment {
  const normalized = String(rawCommand ?? '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const base: ShellCommandAssessment = {
    verdict: 'BLOCKED',
    normalized,
    argv: null,
    segments: [],
    threats: [],
    reason: '',
  };

  if (!normalized) {
    return { ...base, reason: 'EMPTY COMMAND: nothing to sanitize.' };
  }

  // LAYER 1 first: the full payload must clear the rule base as a command.
  const audit = kaliInspect(normalized, 'TERMINAL_EXECUTION');
  if (audit.denied) {
    return {
      ...base,
      threats: audit.threats,
      audit,
      reason: audit.threats[0]?.mitigation ?? 'Blocked by the Inside Boundary firewall.',
    };
  }

  // Smuggling check runs on the RAW shape BEFORE tokenization: inlining the
  // contents of `...`/$(...) would otherwise launder subshells into innocuous
  // segments, and redirects could hide a write target.
  if (DANGEROUS_SHELL_SYNTAX.test(normalized)) {
    return {
      ...base,
      threats: audit.threats,
      audit,
      reason:
        'REDIRECTS / SUBSHELLS / INTERPRETER CALLS ARE NOT NATIVE TO THE IN-BROWSER TERMINAL. ' +
        'SHELL GPT refuses to tokenize them into an executable form.',
    };
  }

  const segments = splitSegments(normalized);
  // A command that decomposes into hidden segments (pipes, backticks, ...) is
  // only allowed when every visible segment is itself a first-class command.
  for (const segment of segments) {
    if (DANGEROUS_SHELL_SYNTAX.test(segment)) {
      return {
        ...base,
        segments,
        audit,
        reason:
          'REDIRECTS / SUBSHELLS / INTERPRETER CALLS ARE NOT NATIVE TO THE IN-BROWSER TERMINAL. ' +
          'SHELL GPT will not tokenize them into an executable form.',
      };
    }
    const tokens = segment.split(' ').filter(Boolean);
    const head = tokens[0]?.toLowerCase();
    if (!head || !ALLOWED_COMMANDS.has(head)) {
      return {
        ...base,
        segments,
        audit,
        reason:
          `"${head ?? '<empty>'}" is not a command the sovereign terminal can service. ` +
          'Only read-only workspace tools and `node <workspace file>` are dispatched to LAYER 3.',
      };
    }
  }

  // Single command, allowlisted head → produce strict argv (no raw string).
  const [head, ...rest] = segments[0].split(' ').filter(Boolean);
  const lowered = head.toLowerCase();
  const threats = audit.threats;

  if (lowered === 'node') {
    const target = rest[0];
    if (!target || rest.length > 1 || !/^[a-z0-9._/-]+\.(?:js|cjs|mjs)$/i.test(target)) {
      return {
        ...base,
        segments,
        threats,
        audit,
        reason: 'node must be invoked with exactly one *.js path inside the workspace.',
      };
    }
    const jail = validateSandboxPath(target, activeConfig.sandboxRoot);
    if (!jail.allowed) {
      return { ...base, segments, threats, audit, reason: jail.reason ?? 'Path outside jail.' };
    }
  } else if (rest.some((t) => t.startsWith('-') && !READ_ONLY_FLAG.test(t) && !/^-\d+$/.test(t) && t !== '-n' && t !== '-h')) {
    return {
      ...base,
      segments,
      threats,
      audit,
      verdict: 'QUARANTINED',
      reason: 'Non read-only flag rejected; use read-only forms inside the jail.',
    };
  }

  return {
    verdict: threats.length > 0 ? 'QUARANTINED' : 'CLEARED',
    normalized,
    argv: [head, ...rest],
    segments,
    threats,
    audit,
    reason:
      threats.length > 0
        ? 'Cleared with containment notes; execution stays inside the virtual filesystem.'
        : 'Command fully sanitized; eligible for a LAYER 3 execution permit.',
  };
}

// ----------------------------------------------------------------------------
// LAYER 3 — TERMINAL GPT :: permit-gated execution
// ----------------------------------------------------------------------------

export interface ExecutionPermit {
  id: string;
  payloadHash: string;
  source: SecurityPayloadSource;
  issuedAt: number;
  expiresAt: number;
  consumed: boolean;
}

export interface TerminalAuthorization {
  granted: boolean;
  permit?: ExecutionPermit;
  inspection: KaliInspection;
  denialReason?: string;
}

const permits = new Map<string, ExecutionPermit>();
const PERMIT_TTL_MS = 30_000;
let permitCounter = 0;

function issuePermit(payloadHash: string, source: SecurityPayloadSource): ExecutionPermit {
  permitCounter += 1;
  const permit: ExecutionPermit = {
    id: `PERMIT-${Date.now().toString(36).toUpperCase()}-${permitCounter.toString(36).toUpperCase()}`,
    payloadHash,
    source,
    issuedAt: Date.now(),
    expiresAt: Date.now() + PERMIT_TTL_MS,
    consumed: false,
  };
  permits.set(permit.id, permit);
  return permit;
}

/**
 * The ONLY path to execution. KALI must clear the code (and its resolved jail
 * path), and the resulting permit is bound to this exact content hash.
 */
export function terminalAuthorizeRun(
  fileName: string,
  code: string,
  source: SecurityPayloadSource = 'TERMINAL_EXECUTION',
): TerminalAuthorization {
  const inspection = kaliInspect(code, source);

  if (activeConfig.enforcePathJail) {
    const jail = validateSandboxPath(fileName, activeConfig.sandboxRoot);
    if (!jail.allowed) {
      return {
        granted: false,
        inspection,
        denialReason: jail.reason ?? 'Target path escapes the sandbox jail.',
      };
    }
  }

  if (inspection.denied) {
    return {
      granted: false,
      inspection,
      denialReason: inspection.threats[0]?.mitigation ?? 'Payload denied by LAYER 1 policy.',
    };
  }

  return { granted: true, permit: issuePermit(inspection.contentHash, source), inspection };
}

/** Consumed by the sandbox engine itself. Single-use, TTL-bound, hash-bound. */
export function consumeExecutionPermit(
  permitId: string | undefined,
  payloadHash: string,
): { valid: boolean; reason?: string } {
  if (!permitId) {
    return { valid: false, reason: 'Execution refused: TERMINAL GPT issued no permit for this call.' };
  }
  const permit = permits.get(permitId);
  if (!permit) {
    return { valid: false, reason: 'Execution refused: permit unknown or already used (replay rejected).' };
  }
  permits.delete(permitId); // pop before validating — a failed check still burns it
  permit.consumed = true;
  if (Date.now() > permit.expiresAt) {
    return { valid: false, reason: 'Execution refused: permit expired (stale authorization).' };
  }
  if (permit.payloadHash !== payloadHash) {
    return { valid: false, reason: 'Execution refused: payload changed after review (hash mismatch).' };
  }
  return { valid: true };
}

// ----------------------------------------------------------------------------
// Workspace path & filename policy (shared by FILE_WRITE boundary)
// ----------------------------------------------------------------------------

const ALLOWED_FILE_EXTENSIONS = new Set(['js', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'css', 'md', 'txt']);

export function validateWorkspaceFilename(
  name: string,
): { ok: boolean; safeName: string; reason?: string } {
  const raw = String(name ?? '').trim().replace(/\\/g, '/');
  if (!raw || /[\0<>:"|?*]/.test(raw)) {
    return { ok: false, safeName: raw, reason: 'Filename rejected: control or reserved characters.' };
  }
  if (raw.includes('..') || raw.startsWith('/')) {
    return { ok: false, safeName: raw, reason: 'Filename rejected: traversal / absolute path outside jail.' };
  }
  const ext = raw.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_FILE_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      safeName: raw,
      reason: `Extension ".${ext}" is not executable material; allowed: ${[...ALLOWED_FILE_EXTENSIONS].join(', ')}.`,
    };
  }
  const segments = raw.split('/').filter(Boolean);
  if (segments.some((s) => !/^[a-z0-9._-]+$/i.test(s))) {
    return { ok: false, safeName: raw, reason: 'Filename rejected: suspicious path segment.' };
  }
  const safeName = raw.startsWith('src/') ? raw : `src/${raw}`;
  const jail = validateSandboxPath(safeName, activeConfig.sandboxRoot);
  if (!jail.allowed) {
    return { ok: false, safeName: raw, reason: jail.reason };
  }
  return { ok: true, safeName };
}

// ----------------------------------------------------------------------------
// Remote endpoint policy (used by the network client and the settings UI)
// ----------------------------------------------------------------------------

export interface EndpointVerdict {
  ok: boolean;
  url: string;
  reason?: string;
}

/**
 * A hacker who can edit settings must still not be able to point the client at
 * their own server or a prohibited telemetry host: the kernel pins the scheme,
 * validates https (except loopback dev gateways), and blocks denied hosts.
 */
export function validateRemoteEndpoint(rawUrl: string): EndpointVerdict {
  const url = String(rawUrl ?? '').trim();
  if (!url) return { ok: false, url, reason: 'Empty endpoint URL.' };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, url, reason: 'Endpoint is not a valid absolute URL.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, url, reason: `Scheme "${parsed.protocol}" is not permitted (https only, or http://localhost for a local vLLM gateway).` };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, url, reason: 'Embedded credentials in endpoint URL are blocked.' };
  }
  const host = parsed.hostname.toLowerCase();
  const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
  if (parsed.protocol === 'http:' && !isLoopback) {
    return { ok: false, url, reason: 'Plaintext http:// is only tolerated for loopback dev gateways.' };
  }
  if (!isLoopback && !host.endsWith('mistral.ai')) {
    return {
      ok: false,
      url,
      reason: `Host "${host}" is not a sanctioned sovereign inference gateway. Allowed: *.mistral.ai or a loopback vLLM endpoint.`,
    };
  }
  if (FORBIDDEN_TELEMETRY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { ok: false, url, reason: 'Host is on the prohibited telemetry list.' };
  }
  return { ok: true, url: url.replace(/\/+$/, '') };
}

// ----------------------------------------------------------------------------
// Runtime telemetry for the UI
// ----------------------------------------------------------------------------

export interface ShieldTelemetry {
  blockedCount: number;
  containedCount: number;
  permitsIssued: number;
  ledgerEntries: number;
  headHash: string;
  intact: boolean;
}

export function getShieldTelemetry(): ShieldTelemetry {
  const integrity = verifyShieldIntegrity();
  return {
    blockedCount: integrity.blockedCount,
    containedCount: integrity.containedCount,
    permitsIssued: permitCounter,
    ledgerEntries: ledger.length,
    headHash: integrity.headHash,
    intact: integrity.intact,
  };
}

/** Seed entry so the ledger never starts empty in a cold session. */
commitToLedger(
  inspectSecurityPayload(
    'Mount virtual filesystem /workspace/sovereign-project/',
    'FILE_WRITE',
    activeConfig,
  ),
);
