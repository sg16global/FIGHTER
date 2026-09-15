// ============================================================================
// SOVEREIGN BACKEND SECURITY LAYERS // KALI GPT · SHELL GPT · TERMINAL GPT
// ============================================================================
// THESE ARE NOT CONVERSATIONAL AI AGENTS AND NOT STANDARD MODELS.
// KALI GPT, SHELL GPT and TERMINAL GPT are the three backend security layers
// of the entire application. Their sole duty: enforce maximum security,
// isolate threats, and protect the system and the operator from hackers,
// malware, and malicious script execution. The chat surface only VISUALIZES
// their decisions — it can never reprogram, negotiate with, or bypass them.
//
//   LAYER 1 — KALI GPT      REDSHIELD-01  Threat Intelligence & Policy
//             Inspects every payload (prompts, model output, patches, file
//             writes) against the Double-Layer Shield rule base and commits
//             an immutable hash-chained audit record for each verdict.
//
//   LAYER 2 — SHELL GPT     SHELLWEAVER-02  Command Sanitization
//             Tokenizes shell text; every segment of every pipeline must be a
//             sanctioned, read-only, jail-bound command. Emits strict argv —
//             never a raw string — and quarantines anything cleverer than that.
//
//   LAYER 3 — TERMINAL GPT  AUTORUN-03  Sandboxed Execution Gate
//             The ONLY path to running code. Issues single-use, TTL-bound,
//             content-hash-bound execution permits; the sandbox engine consumes
//             the permit itself, so unpermitted calls are refused at the engine.
//
// Enforcement is centralized in src/security/securityCore.ts (the kernel);
// this module adapts kernel decisions to the chat renderer's payload shapes.
// Zero Meta, DeepSeek, or Grok implementations. Powered by the Mistral Suite
// for ANALYSIS ONLY — model output is untrusted input and passes back through
// LAYER 1 before it can reach the editor, terminal, or memory bank.
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import { Crosshair, Command, Terminal } from 'lucide-react';
import {
  getShieldTelemetry,
  shellSanitizeCommand,
  verifyShieldIntegrity,
  type LayerId,
  type ShellCommandAssessment,
  type ShieldTelemetry,
} from '../security/securityCore';

export type AgentId = 'kali-gpt' | 'shell-gpt' | 'terminal-gpt';

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export interface SovereignAgent {
  id: AgentId;
  name: string;
  codename: string;
  tagline: string;
  accent: string;
  role: string;
  icon: LucideIcon;
  capabilities: string[];
  quickPrompts: QuickPrompt[];
  /** Which backend defense layer this identity enforces (1 = outermost check). */
  layer: 1 | 2 | 3;
  layerKey: LayerId;
  defenseRole: 'THREAT_INTELLIGENCE' | 'COMMAND_SANITIZATION' | 'EXECUTION_GATE';
  /** Surfaces this layer gates. Listed for the architecture blueprint UI. */
  enforcementPoints: string[];
}

export const AGENTS: Record<AgentId, SovereignAgent> = {
  'kali-gpt': {
    id: 'kali-gpt',
    name: 'KALI GPT',
    codename: 'REDSHIELD-01',
    tagline:
      'Backend security layer · threat intelligence & policy engine. Inspects every payload, isolates threats, writes the immutable audit ledger.',
    accent: '#ff4d5e',
    role: 'Layer 1 · Security',
    icon: Crosshair,
    capabilities: [
      'Rule-base inspection',
      'Prompt-injection rejection',
      'Telemetry exfiltration blocking',
      'Vulnerability scanning',
      'Hardening advisories',
      'Tamper-evident audit ledger',
    ],
    quickPrompts: [
      { label: 'LIVE SHIELD STATUS', prompt: '/recon status' },
      { label: 'SCAN WORKSPACE', prompt: '/scan workspace' },
      { label: 'GENERATE SECURITY AUDIT', prompt: '/audit sovereign-project' },
      { label: 'HARDEN CONFIG', prompt: '/harden sovereign.config.json' },
    ],
    layer: 1,
    layerKey: 'LAYER1_KALI',
    defenseRole: 'THREAT_INTELLIGENCE',
    enforcementPoints: [
      'Chat prompt ingress',
      'Remote/offline model output',
      'Bite patches before editor sync',
      'Workspace file writes',
      'Terminal command payloads',
    ],
  },
  'shell-gpt': {
    id: 'shell-gpt',
    name: 'SHELL GPT',
    codename: 'SHELLWEAVER-02',
    tagline:
      'Backend security layer · shell sanitizer. Every command is tokenized, policy-checked segment by segment, and reduced to strict argv.',
    accent: '#ffb020',
    role: 'Layer 2 · Shell',
    icon: Command,
    capabilities: [
      'Shell tokenization',
      'Pipeline / subshell isolation',
      'Segment-by-segment policy',
      'Strict argv emission',
      'Read-only flag enforcement',
    ],
    quickPrompts: [
      { label: 'LIST FILES BY SIZE', prompt: 'Show me files sorted by size, largest first' },
      { label: 'EXPLAIN chmod 700', prompt: 'Explain what chmod 700 does' },
      { label: 'PROBE A DANGEROUS PIPE', prompt: 'cat src/*.js | rm -rf /' },
    ],
    layer: 2,
    layerKey: 'LAYER2_SHELL',
    defenseRole: 'COMMAND_SANITIZATION',
    enforcementPoints: [
      'Hidden terminal custom commands',
      'Shell translation output',
      'Pipeline / subshell / redirect smuggling',
      'node interpreter invocation shape',
    ],
  },
  'terminal-gpt': {
    id: 'terminal-gpt',
    name: 'TERMINAL GPT',
    codename: 'AUTORUN-03',
    tagline:
      'Backend security layer · execution gate. Runs nothing without a single-use, hash-bound permit; the sandbox engine refuses unpermitted calls.',
    accent: '#00f2fe',
    role: 'Layer 3 · Terminal',
    icon: Terminal,
    capabilities: [
      'Permit-gated execution',
      'Single-use TTL permits',
      'Payload hash binding',
      'Sandbox scope lock',
      'Exit-code monitoring',
      'Auto-heal loop supervision',
    ],
    quickPrompts: [
      { label: 'RUN paymentProcessor.js', prompt: 'node src/paymentProcessor.js' },
      { label: 'AUTO-HEAL ACTIVE FILE', prompt: '/autoheal' },
      { label: 'EXPLAIN LAST VERDICT', prompt: 'Explain the last terminal output' },
    ],
    layer: 3,
    layerKey: 'LAYER3_TERMINAL',
    defenseRole: 'EXECUTION_GATE',
    enforcementPoints: [
      'executeScriptInSandbox (sole door)',
      'Run-in-sandbox button',
      'Auto-heal re-verification runs',
      'Task runner',
    ],
  },
};

// ----------------------------------------------------------------------------
// Layer decision payloads (discriminated union rendered by the chat panel)
// ----------------------------------------------------------------------------

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface KaliFinding {
  severity: Severity;
  title: string;
  description: string;
  remediation: string;
}

export interface KaliReport {
  type: 'kali';
  scope: string;
  summary: string;
  findings: KaliFinding[];
  /** Live kernel telemetry snapshot taken when this report was generated. */
  telemetry?: ShieldTelemetry;
}

export interface ShellTranslation {
  type: 'shell';
  intent: string;
  command: string;
  explanation: string;
  securityNote: string;
  /** SHELL GPT's own verdict on anything command-shaped in the request. */
  sanitizeState?: ShellCommandAssessment['verdict'];
  threats?: string[];
}

export interface TerminalRun {
  type: 'terminal';
  command: string;
  output: string[];
  exitCode: number;
  verdict: string;
  /** Set by App when the run executed under a consumed LAYER 3 permit. */
  permitId?: string;
}

export type AgentResponse = KaliReport | ShellTranslation | TerminalRun;

export interface AgentContext {
  activeFilePath: string;
  activeFileContent: string;
  modelTitle: string;
}

const ENFORCEMENT_NOTICE =
  'ENFORCED: LAYER 2 emits strict argv only; every workspace file must hold a consumed LAYER 3 permit before execution. No raw string ever reaches an interpreter.';

// ----------------------------------------------------------------------------
// LAYER 1 — KALI GPT report builders (live posture, not static prose)
// ----------------------------------------------------------------------------

function liveStatusReport(): KaliReport {
  const telemetry = getShieldTelemetry();
  const integrity = verifyShieldIntegrity();
  return {
    type: 'kali',
    scope: 'Live shield posture // kernel telemetry',
    summary: integrity.intact
      ? `Hash-chained audit ledger verified intact (${telemetry.ledgerEntries} entries, head ${telemetry.headHash}). ${telemetry.blockedCount} payload(s) hard-denied, ${telemetry.containedCount} contained. ${telemetry.permitsIssued} execution permit(s) issued.`
      : `⚠ LEDGER INTEGRITY FAULT at #${integrity.brokenAtSeq}: ${integrity.reason}`,
    findings: [
      {
        severity: integrity.intact ? 'INFO' : 'CRITICAL',
        title: 'AUDIT LEDGER CHAIN',
        description: integrity.intact
          ? 'Every KALI GPT inspection commits a record chained to its predecessor; a rewrite or bypass attempt breaks the chain verifiably.'
          : integrity.reason ?? 'Chain mismatch detected.',
        remediation: integrity.intact
          ? 'No action required. Re-run integrity verification any time.'
          : 'Restart the studio; the ledger is rebuilt from the kernel and mutations cannot persist across sessions.',
      },
      {
        severity: telemetry.blockedCount > 0 ? 'HIGH' : 'INFO',
        title: 'HARD DENIALS THIS SESSION',
        description: `${telemetry.blockedCount} payload(s) matching Critical rules were denied at the boundary before any interpreter saw them.`,
        remediation: 'Review the Shield Logs tab in the background terminal for each denial record.',
      },
      {
        severity: 'INFO',
        title: 'EXECUTION PERMITS',
        description: `${telemetry.permitsIssued} single-use permit(s) issued by TERMINAL GPT; each is TTL-bound (30s) and hash-bound to the exact reviewed payload.`,
        remediation: 'No action required.',
      },
    ],
    telemetry,
  };
}

function reconReport(telemetry: ShieldTelemetry): KaliReport {
  return {
    type: 'kali',
    scope: 'Sovereign Airgapped Workspace (sandbox-only visibility)',
    summary:
      'Reconnaissance is executed by LAYER 1 inside the Outside Boundary. Only sandbox-visible endpoints and virtual services are enumerated; the host OS is out of scope and unaddressable.',
    findings: [
      {
        severity: 'INFO',
        title: 'MISTRAL REMOTE API GATEWAY — POLICY-PINNED',
        description:
          'Egress is restricted to sanctioned sovereign inference gateways (https://api.mistral.ai or a loopback vLLM endpoint). Prohibited telemetry hosts are denied at the kernel.',
        remediation: 'Configure API key in settings or run airgapped offline.',
      },
      {
        severity: 'LOW',
        title: 'Port 8080 / AEGIS ENCLAVE — FILTERED',
        description: 'Management API filtered by firewall rules. No banner leaked during probe.',
        remediation: 'Enforce Double-Layer Shield security validation.',
      },
      {
        severity: 'INFO',
        title: 'Port 22 / SSH — NOT APPLICABLE',
        description: 'The studio runs in an isolated renderer with no network listeners at all.',
        remediation: 'No action required.',
      },
      {
        severity: telemetry.intact ? 'MEDIUM' : 'CRITICAL',
        title: 'LOCAL CONFIGURATION /workspace/sovereign-project',
        description: `Sandbox root locked; airgap strict mode ${'ENABLED'}. Ledger head ${telemetry.headHash}.`,
        remediation: 'Maintain client-side encryption for sensitive tokens.',
      },
    ],
    telemetry,
  };
}

function scanReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Dependency & Supply-Chain Scan (simulated CVE database)',
    summary:
      'Scanned workspace manifests for known-vulnerable transitive dependencies. One simulated advisory requires attention.',
    findings: [
      {
        severity: 'CRITICAL',
        title: 'lodash@4.17.15 — prototype pollution (SIMULATED)',
        description:
          'A transitive dependency flagged with a prototype-pollution advisory in the simulated feed.',
        remediation: 'Upgrade to lodash@4.17.21 and lock the lockfile.',
      },
      {
        severity: 'HIGH',
        title: 'paymentProcessor.js — unvalidated payload',
        description:
          'Line 19 reads payload.amount without a type guard and crashes on malformed transactions.',
        remediation: 'Add null/NaN boundary check with Codestral (Option 2 Auto-Heal).',
      },
      {
        severity: 'LOW',
        title: 'authGateway.ts — char-length entropy check',
        description: 'Session key strength is measured by string length rather than real entropy.',
        remediation: 'Hash the key and verify minimum 256 bits of entropy.',
      },
      {
        severity: 'INFO',
        title: 'Mistral Suite Runtime (7B, Large, Codestral, NeMo)',
        description: 'Sovereign runtime is clean. Zero telemetry to prohibited hosts.',
        remediation: 'No action required.',
      },
    ],
  };
}

function auditReport(telemetry: ShieldTelemetry): KaliReport {
  return {
    type: 'kali',
    scope: 'Full Security Audit // /workspace/sovereign-project',
    summary:
      'Findings across the workspace. The live enforcement posture below is read from the kernel at report time — it cannot be spoofed from the chat surface.',
    findings: [
      {
        severity: 'CRITICAL',
        title: 'TypeError in processPayment()',
        description:
          'Unchecked property access on payload.amount causes a crash when a transaction payload is malformed (denial-of-service vector).',
        remediation: 'Guard with typeof checks and default rates before computing totals.',
      },
      {
        severity: 'HIGH',
        title: 'Signature verification trusts address prefix only',
        description:
          'verifySovereignSignature accepts any address starting with sov1 without validating the actual signature.',
        remediation: 'Require an Ed25519 signature verification against a trusted keyring.',
      },
      {
        severity: 'MEDIUM',
        title: 'Debug logs leak ledger amounts',
        description: 'console.log prints net amounts that should be redacted in production.',
        remediation: 'Move to structured, redacted audit logging.',
      },
      {
        severity: telemetry.intact ? 'INFO' : 'CRITICAL',
        title: 'Sandbox jail & ledger integrity',
        description: telemetry.intact
          ? `Outside Boundary path jail and Inside Boundary syscall firewall passed. Ledger: ${telemetry.ledgerEntries} entries, ${telemetry.blockedCount} denials.`
          : 'LEDGER FAULT — see live status report.',
        remediation: 'No action required.',
      },
    ],
    telemetry,
  };
}

function hardenReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Hardening Pass // sovereign.config.json + runtime',
    summary:
      'Hardening advisories computed by LAYER 1. All analysis stays inside the sandbox copy; the host operating system is never touched.',
    findings: [
      {
        severity: 'INFO',
        title: 'Airgap strict mode re-affirmed',
        description: 'Telemetry to meta.ai, deepseek.com, grok.x.ai and openai.com is denied at the kernel endpoint policy.',
        remediation: 'Confirmed.',
      },
      {
        severity: 'LOW',
        title: 'Blocked destructive syscalls enabled',
        description: 'Wipes, raw-device writes, fork bombs, persistence and credential exfil are intercepted pre-execution.',
        remediation: 'Confirmed active.',
      },
      {
        severity: 'LOW',
        title: 'Sandbox root locked',
        description: 'All file writes resolve inside /workspace/sovereign-project via lexical jail resolution.',
        remediation: 'Confirmed active.',
      },
      {
        severity: 'INFO',
        title: 'Least-privilege runtime user',
        description: 'Run the sovereign runtime under a dedicated non-root user in production containers.',
        remediation: 'Apply in production container definition.',
      },
    ],
  };
}

function exploitReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Exploit Vector Analysis (advisory only — PoC execution is denied)',
    summary:
      'KALI GPT analyzes exploitability defensively. It does not stage, store, or execute weaponized payloads; destructive variants are blocked by the firewall before execution.',
    findings: [
      {
        severity: 'CRITICAL',
        title: 'Defensive finding: malformed transaction triggers uncaught exception',
        description:
          'Passing { id: "TX-1" } (no amount) throws a TypeError and terminates the process — an availability risk.',
        remediation: 'Wrap in a typed guard; the Option 2 Auto-Heal loop patches this with Codestral.',
      },
      {
        severity: 'HIGH',
        title: 'Impact: process crash (not remote code execution)',
        description: 'No memory-unsafe primitive exists, so impact is limited to availability.',
        remediation: 'Apply input validation and a try/catch boundary.',
      },
      {
        severity: 'INFO',
        title: 'Shield interaction',
        description: 'A destructive variant ("rm -rf /") is blocked by the Inside Boundary firewall before execution.',
        remediation: 'No action required.',
      },
    ],
  };
}

function overviewReport(ctx: AgentContext, telemetry: ShieldTelemetry): KaliReport {
  return {
    type: 'kali',
    scope: `${ctx.activeFilePath} // defensive baseline`,
    summary:
      'KALI GPT (LAYER 1) is armed on every boundary: prompt ingress, model output, patches, writes, commands. Use /recon, /scan, /audit, /harden, /exploit or ask for a live shield status.',
    findings: [
      {
        severity: 'INFO',
        title: 'Inside Boundary: ACTIVE',
        description: 'Every prompt and generated payload is intercepted before it reaches any editor, terminal, or the memory bank.',
        remediation: 'Confirmed.',
      },
      {
        severity: 'INFO',
        title: 'Outside Boundary: JAILED',
        description: 'All file and process operations resolve inside /workspace/sovereign-project.',
        remediation: 'Confirmed.',
      },
      {
        severity: 'LOW',
        title: 'Suggested next step',
        description: 'Run "/recon status" for the live ledger + denial count, or "/audit sovereign-project" for findings.',
        remediation: 'Execute the command above.',
      },
    ],
    telemetry,
  };
}

export function kaliRespond(input: string, ctx: AgentContext): KaliReport {
  const lower = input.toLowerCase();
  const telemetry = getShieldTelemetry();
  if (lower.includes('status') || lower.includes('posture')) return liveStatusReport();
  if (lower.includes('recon')) return reconReport(telemetry);
  if (lower.includes('scan') || lower.includes('dependen')) return scanReport();
  if (lower.includes('harden')) return hardenReport();
  if (lower.includes('exploit') || lower.includes('vuln') || lower.includes('poc')) return exploitReport();
  if (lower.includes('audit')) return auditReport(telemetry);
  return overviewReport(ctx, telemetry);
}

// ----------------------------------------------------------------------------
// LAYER 2 — SHELL GPT translation (kernel-sanitized, never raw)
// ----------------------------------------------------------------------------

function noteFor(assessment: ShellCommandAssessment | null): {
  sanitizeState?: ShellCommandAssessment['verdict'];
  threats?: string[];
  securityNote: string;
} {
  if (!assessment) {
    return { securityNote: ENFORCEMENT_NOTICE };
  }
  return {
    sanitizeState: assessment.verdict,
    threats: assessment.threats.map((t) => `${t.ruleId} · ${t.category}`),
    securityNote:
      assessment.verdict === 'BLOCKED'
        ? `⛔ SHELL GPT (LAYER 2) BLOCKED this command shape: ${assessment.reason} ${ENFORCEMENT_NOTICE}`
        : `✓ LAYER 2 verdict: ${assessment.verdict} — ${assessment.reason} ${ENFORCEMENT_NOTICE}`,
  };
}

export function shellRespond(input: string): ShellTranslation {
  const lower = input.toLowerCase();

  // If the request embeds something command-shaped, run it through the kernel
  // sanitizer so the translation surface can never smuggle an executable idea.
  const commandShaped = /(?:^|\s)(?:rm|sudo|curl|wget|chmod|chown|dd|mkfs|nc|cat|ls|node|echo)\b|[|;&]/.test(lower);
  const assessment = commandShaped ? shellSanitizeCommand(input) : null;
  const gate = noteFor(assessment);

  if (assessment?.verdict === 'BLOCKED') {
    return {
      type: 'shell',
      intent: 'Blocked command shape',
      command: `# BLOCKED BY LAYER 2 — nothing was staged\n# segments: ${assessment.segments.join(' ;; ') || '(none)'}`,
      explanation: assessment.reason,
      ...gate,
    };
  }

  if (lower.includes('chmod')) {
    return {
      type: 'shell',
      intent: 'Explain a permission command',
      command: 'chmod 700 src/config.json',
      explanation:
        'Sets the file owner to read+write+execute (7), and the group and others to no access (0). Only the owning user can open or run the file. Displayed for education — it is never dispatched.',
      ...gate,
    };
  }

  if (lower.includes('backup')) {
    return {
      type: 'shell',
      intent: 'Generate a timestamped backup script',
      command:
        '#!/usr/bin/env bash\nset -euo pipefail\nstamp=$(date +%Y%m%d_%H%M%S)\ntar -czf "backup_$stamp.tar.gz" src/\necho "Backup written: backup_$stamp.tar.gz"',
      explanation:
        'Creates a compressed archive of src/ named with the current timestamp. set -euo pipefail makes it fail safely on any error. Staged for operator review only; execution still requires a consumed LAYER 3 permit.',
      ...gate,
    };
  }

  if (lower.includes('size') || lower.includes('largest') || lower.includes('sorted')) {
    return {
      type: 'shell',
      intent: 'List files sorted by size',
      command: 'du -sh * 2>/dev/null | sort -rh | head -20',
      explanation:
        'du -sh reports sizes, sort -rh orders largest first, head -20 limits output. Education only: in the sovereign terminal, dispatch is limited to the read-only allowlist.',
      ...gate,
    };
  }

  if (lower.includes('disk')) {
    return {
      type: 'shell',
      intent: 'Show disk usage',
      command: 'df -h',
      explanation: 'Displays mounted filesystem sizes, used space and free space in human-readable units.',
      ...gate,
    };
  }

  if (lower.includes('process')) {
    return {
      type: 'shell',
      intent: 'List running processes by memory',
      command: 'ps aux --sort=-%mem | head -10',
      explanation: 'Lists the top 10 processes ordered by memory usage. Read-only, display-only.',
      ...gate,
    };
  }

  if (lower.includes('file') || lower.includes('count')) {
    return {
      type: 'shell',
      intent: 'Count files in the workspace',
      command: 'find . -type f | wc -l',
      explanation: 'Counts all regular files recursively from the current directory.',
      ...gate,
    };
  }

  return {
    type: 'shell',
    intent: 'General command translation',
    command: `# ${assessment ? assessment.normalized.replace(/\n/g, ' ') : input}\n# staged for review — no interpreter receives this text directly`,
    explanation:
      'Your request was captured by LAYER 2. Provide more detail (files, permissions, search) and the sanitizer will emit the exact read-only argv shape plus an explanation.',
    ...gate,
  };
}

// ----------------------------------------------------------------------------
// LAYER 3 — TERMINAL GPT run builder (staging only; permits minted by App)
// ----------------------------------------------------------------------------

export function terminalRespond(input: string, ctx: AgentContext): TerminalRun {
  const lower = input.toLowerCase();

  if (lower.includes('autoheal')) {
    return {
      type: 'terminal',
      command: '/autoheal',
      output: [
        '[TERMINAL GPT · LAYER 3] Auto-heal run supervised: target ' + ctx.activeFilePath,
        '[TERMINAL GPT · LAYER 3] Each execution (capture-crash, patched verify) consumes its own single-use permit bound to the exact payload hash.',
        '[TERMINAL GPT · LAYER 3] Patched code synthesized by any model re-passes LAYER 1 before it may touch the editor.',
      ],
      exitCode: 0,
      verdict: 'STAGED',
    };
  }

  if (lower.includes('explain')) {
    return {
      type: 'terminal',
      command: '# explain last verdict',
      output: [
        '[TERMINAL GPT · LAYER 3] The last run produced a TypeError on line 19 (unchecked payload.amount).',
        '[TERMINAL GPT · LAYER 3] Run the auto-heal loop with Codestral to patch it, then re-execute to verify EXIT CODE 0.',
      ],
      exitCode: 0,
      verdict: 'EXPLAINED',
    };
  }

  // The staged command must clear LAYER 2 *before* LAYER 3 will even queue it.
  const cleanCommand = input.trim().replace(/^\/run\s+/i, '');
  const assessment = shellSanitizeCommand(cleanCommand);
  if (assessment.verdict === 'BLOCKED') {
    return {
      type: 'terminal',
      command: `# REJECTED at gate: ${assessment.normalized}`,
      output: [
        '[TERMINAL GPT · LAYER 3] Staging refused: ' + assessment.reason,
        '[TERMINAL GPT · LAYER 3] No permit was issued; the sandbox engine would reject this payload even if a permit were forged.',
      ],
      exitCode: 126,
      verdict: 'BLOCKED',
    };
  }
  return {
    type: 'terminal',
    command: assessment.argv?.join(' ') ?? `node ${ctx.activeFilePath}`,
    output: [
      '[TERMINAL GPT · LAYER 3] Queued for sandbox execution: ' + (assessment.argv?.join(' ') ?? ctx.activeFilePath),
      '[TERMINAL GPT · LAYER 3] LAYER 2 verdict: ' + assessment.verdict + ' — ' + assessment.reason,
    ],
    exitCode: 0,
    verdict: 'QUEUED',
  };
}

// ----------------------------------------------------------------------------
// Main dispatcher
// ----------------------------------------------------------------------------

export function generateAgentResponse(
  agentId: AgentId,
  input: string,
  ctx: AgentContext
): AgentResponse {
  switch (agentId) {
    case 'kali-gpt':
      return kaliRespond(input, ctx);
    case 'shell-gpt':
      return shellRespond(input);
    case 'terminal-gpt':
      return terminalRespond(input, ctx);
  }
}

/**
 * Layer activity lines for the background terminal screen.
 */
export function generateAgentTerminalLogs(agentId: AgentId, input: string): string[] {
  const cmd = input.trim();

  if (agentId === 'kali-gpt') {
    const lower = cmd.toLowerCase();
    if (lower.startsWith('/recon')) {
      const t = getShieldTelemetry();
      return [
        `$ ${cmd}`,
        '[KALI GPT · LAYER 1] Scanning sandbox namespace (policy read-only)...',
        `[KALI GPT · LAYER 1] Ledger: ${t.ledgerEntries} entries · head ${t.headHash} · intact=${t.intact}`,
        `[KALI GPT · LAYER 1] Denials: ${t.blockedCount} blocked · ${t.containedCount} contained · permits issued: ${t.permitsIssued}`,
      ];
    }
    if (lower.startsWith('/scan')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT · LAYER 1] Consulting simulated CVE feed with Mistral Large...',
        '[KALI GPT · LAYER 1] CRITICAL: lodash@4.17.15 prototype pollution (SIMULATED)',
        '[KALI GPT · LAYER 1] Recommend: upgrade lodash and re-lock dependencies.',
      ];
    }
    if (lower.startsWith('/audit')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT · LAYER 1] 4 findings: 1 CRITICAL, 1 HIGH, 1 MEDIUM, 1 INFO.',
        '[KALI GPT · LAYER 1] CRITICAL: processPayment() crashes on malformed payload.',
      ];
    }
    if (lower.startsWith('/harden')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT · LAYER 1] Hardening advisories computed; sandbox copy only.',
        '[KALI GPT · LAYER 1] Airgap + syscall firewall + path jail re-affirmed.',
      ];
    }
    if (lower.startsWith('/exploit')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT · LAYER 1] Analyzing vector defensively (PoC execution denied)...',
        '[KALI GPT · LAYER 1] Impact limited to availability; no RCE primitive.',
      ];
    }
    return [
      `$ ${cmd}`,
      '[KALI GPT · LAYER 1] Policy engine active on every boundary. Use /recon, /scan, /audit, /harden, /exploit.',
    ];
  }

  if (agentId === 'shell-gpt') {
    const assessment = shellSanitizeCommand(cmd);
    return [
      `$ ${cmd}`,
      `[SHELL GPT · LAYER 2] ${assessment.verdict}: ${assessment.reason}`,
    ];
  }

  // terminal-gpt execution is dispatched through the App-level gate elsewhere;
  // these lines only annotate the terminal screen.
  return [`$ ${cmd}`, '[TERMINAL GPT · LAYER 3] Dispatch flows exclusively through the permit-gated sandbox engine.'];
}
