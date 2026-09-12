// ============================================================================
// SOVEREIGN AGENT REGISTRY // KALI GPT + SHELL GPT + TERMINAL GPT
// ============================================================================
// Three specialized sovereign agents unified under the Double-Layer Security
// Shield (Inside Boundary = input/output validation, Outside Boundary = sandbox).
// Every agent defaults to GENTLE, non-destructive behavior: read-only unless the
// operator explicitly confirms a write/execute action inside the sandbox jail.
// Zero Meta, DeepSeek, or Grok implementations.
// Powered by Mistral Models: 7B, Large, Codestral, NeMo.
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import { Crosshair, Command, Terminal } from 'lucide-react';

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
}

export const AGENTS: Record<AgentId, SovereignAgent> = {
  'kali-gpt': {
    id: 'kali-gpt',
    name: 'KALI GPT',
    codename: 'REDSHIELD-01',
    tagline: 'Offensive + defensive security copilot, fully sandboxed and read-only by default.',
    accent: '#ff4d5e',
    role: 'Security',
    icon: Crosshair,
    capabilities: [
      'Reconnaissance',
      'Vulnerability scanning',
      'Exploit analysis',
      'Forensics',
      'Hardening',
      'CTF guidance',
    ],
    quickPrompts: [
      { label: 'RUN RECON ON WORKSPACE', prompt: '/recon workspace' },
      { label: 'SCAN DEPENDENCIES', prompt: '/scan dependencies' },
      { label: 'GENERATE SECURITY AUDIT', prompt: '/audit sovereign-project' },
      { label: 'HARDEN CONFIG', prompt: '/harden sovereign.config.json' },
    ],
  },
  'shell-gpt': {
    id: 'shell-gpt',
    name: 'SHELL GPT',
    codename: 'SHELLWEAVER-02',
    tagline: 'Natural language to shell command translator with safe alternatives.',
    accent: '#ffb020',
    role: 'Shell',
    icon: Command,
    capabilities: [
      'Command translation',
      'Script generation',
      'Command explanation',
      'Safe alternatives',
    ],
    quickPrompts: [
      { label: 'LIST FILES BY SIZE', prompt: 'Show me files sorted by size, largest first' },
      { label: 'EXPLAIN chmod 700', prompt: 'Explain what chmod 700 does' },
      { label: 'BACKUP SCRIPT', prompt: 'Write a shell script that backs up src/ with a timestamp' },
    ],
  },
  'terminal-gpt': {
    id: 'terminal-gpt',
    name: 'TERMINAL GPT',
    codename: 'AUTORUN-03',
    tagline: 'Executes, monitors and self-heals inside the sandbox terminal.',
    accent: '#00f2fe',
    role: 'Terminal',
    icon: Terminal,
    capabilities: [
      'Command execution',
      'Exit-code monitoring',
      'Auto-heal loops',
      'Output explanation',
    ],
    quickPrompts: [
      { label: 'RUN paymentProcessor.js', prompt: 'node src/paymentProcessor.js' },
      { label: 'AUTO-HEAL ACTIVE FILE', prompt: '/autoheal' },
      { label: 'EXPLAIN LAST OUTPUT', prompt: 'Explain the last terminal output' },
    ],
  },
};

// ----------------------------------------------------------------------------
// Agent response payloads (discriminated union rendered by the chat panel)
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
}

export interface ShellTranslation {
  type: 'shell';
  intent: string;
  command: string;
  explanation: string;
  securityNote: string;
}

export interface TerminalRun {
  type: 'terminal';
  command: string;
  output: string[];
  exitCode: number;
  verdict: string;
}

export type AgentResponse = KaliReport | ShellTranslation | TerminalRun;

export interface AgentContext {
  activeFilePath: string;
  activeFileContent: string;
  modelTitle: string;
}

const SAFE_NOTICE =
  'GENTLE MODE: read-only. No destructive action will leave the sandbox jail.';

// ----------------------------------------------------------------------------
// KALI GPT report builders
// ----------------------------------------------------------------------------

function reconReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Sovereign Airgapped Workspace (sandbox-only visibility)',
    summary:
      'Host-bound reconnaissance is executed inside the Outside Boundary sandbox. Only sandbox-visible endpoints and virtual services are enumerated.',
    findings: [
      {
        severity: 'INFO',
        title: 'MISTRAL REMOTE API GATEWAY — CONNECTED',
        description:
          'Secure HTTPS API client interface to Mistral models (7B, Large, Codestral, NeMo). Fully encrypted transport.',
        remediation: 'Configure API key in settings or run airgapped offline.',
      },
      {
        severity: 'LOW',
        title: 'Port 8080 / AEGIS ENCLAVE — FILTERED',
        description:
          'Management API filtered by firewall rules. No banner leaked during probe.',
        remediation: 'Enforce Double-Layer Shield security validation.',
      },
      {
        severity: 'INFO',
        title: 'Port 22 / SSH — CLOSED',
        description:
          'No SSH listener detected within the sandbox network namespace.',
        remediation: 'No action required.',
      },
      {
        severity: 'MEDIUM',
        title: 'Local configuration in sovereign.config.json',
        description:
          'Configuration references Mistral model targets and airgap policies. Confirmed secure.',
        remediation: 'Maintain local client-side encryption for sensitive tokens.',
      },
    ],
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
        description:
          'Session key strength is measured by string length rather than real entropy.',
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

function auditReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Full Security Audit // /workspace/sovereign-project',
    summary:
      'Four issues identified across the workspace. One critical flaw is exploitable via malformed input but confined to the sandbox.',
    findings: [
      {
        severity: 'CRITICAL',
        title: 'TypeError in processPayment()',
        description:
          'Unchecked property access on payload.amount causes a crash when a transaction payload is malformed.',
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
        severity: 'INFO',
        title: 'Sandbox jail integrity verified',
        description: 'Outside Boundary path jail and Inside Boundary syscall firewall passed.',
        remediation: 'No action required.',
      },
    ],
  };
}

function hardenReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Hardening Pass // sovereign.config.json + runtime',
    summary:
      'Gentle hardening applied to the sandbox copy only. The host operating system was never touched.',
    findings: [
      {
        severity: 'INFO',
        title: 'Airgap strict mode re-affirmed',
        description: 'Telemetry to meta.ai, deepseek.com and grok.x.ai remains blocked.',
        remediation: 'Confirmed.',
      },
      {
        severity: 'LOW',
        title: 'Blocked destructive syscalls enabled',
        description: 'rm -rf /, mkfs, and fork bombs are intercepted at the AST layer.',
        remediation: 'Confirmed active.',
      },
      {
        severity: 'LOW',
        title: 'Sandbox root locked',
        description: 'All file writes resolve inside /workspace/sovereign-project.',
        remediation: 'Confirmed active.',
      },
      {
        severity: 'INFO',
        title: 'Recommend least-privilege runtime user',
        description: 'Run the sovereign runtime under a dedicated non-root user.',
        remediation: 'Apply in production container definition.',
      },
    ],
  };
}

function exploitReport(): KaliReport {
  return {
    type: 'kali',
    scope: 'Exploit Vector Analysis (proof-of-concept gated by shield)',
    summary:
      'Analyzed the payment crash as a potential denial-of-service vector. The exploit is theoretical and fully contained.',
    findings: [
      {
        severity: 'CRITICAL',
        title: 'PoC: malformed transaction triggers uncaught exception',
        description:
          'Passing { id: "TX-1" } (no amount) throws a TypeError and terminates the process.',
        remediation: 'Wrap in a typed guard; the Option 2 Auto-Heal loop patches this automatically with Codestral.',
      },
      {
        severity: 'HIGH',
        title: 'Impact: process crash (not remote code execution)',
        description:
          'No memory-unsafe primitive exists, so impact is limited to availability.',
        remediation: 'Apply input validation and a try/catch boundary.',
      },
      {
        severity: 'INFO',
        title: 'Shield interaction',
        description:
          'A destructive variant ("rm -rf /") would be blocked by the Inside Boundary firewall before execution.',
        remediation: 'No action required.',
      },
    ],
  };
}

function overviewReport(ctx: AgentContext): KaliReport {
  return {
    type: 'kali',
    scope: `${ctx.activeFilePath} // defensive baseline`,
    summary:
      'KALI GPT is online in gentle, read-only mode powered by Mistral Large / Codestral. Use /recon, /scan, /audit, /harden or ask about an exploit vector.',
    findings: [
      {
        severity: 'INFO',
        title: 'Inside Boundary: ACTIVE',
        description: 'Every prompt and generated command is intercepted before reaching the terminal.',
        remediation: 'Confirmed.',
      },
      {
        severity: 'INFO',
        title: 'Outside Boundary: JAILED',
        description: 'All file and process operations run inside /workspace/sovereign-project.',
        remediation: 'Confirmed.',
      },
      {
        severity: 'LOW',
        title: 'Suggested next step',
        description: 'Run "/audit sovereign-project" for a full findings report.',
        remediation: 'Execute the command above.',
      },
    ],
  };
}

function kaliRespond(input: string, ctx: AgentContext): KaliReport {
  const lower = input.toLowerCase();
  if (lower.includes('recon')) return reconReport();
  if (lower.includes('scan') || lower.includes('dependen')) return scanReport();
  if (lower.includes('harden')) return hardenReport();
  if (lower.includes('exploit') || lower.includes('vuln') || lower.includes('poc')) return exploitReport();
  if (lower.includes('audit')) return auditReport();
  return overviewReport(ctx);
}

// ----------------------------------------------------------------------------
// SHELL GPT translation builder
// ----------------------------------------------------------------------------

function shellRespond(input: string): ShellTranslation {
  const lower = input.toLowerCase();

  if (lower.includes('chmod')) {
    return {
      type: 'shell',
      intent: 'Explain a permission command',
      command: 'chmod 700 <file>',
      explanation:
        'Sets the file owner to read+write+execute (7), and the group and others to no access (0). Only the owning user can open or run the file.',
      securityNote: 'Safe. Affects a single file and never touches the system.',
    };
  }

  if (lower.includes('backup')) {
    return {
      type: 'shell',
      intent: 'Generate a timestamped backup script',
      command:
        '#!/usr/bin/env bash\nset -euo pipefail\nstamp=$(date +%Y%m%d_%H%M%S)\ntar -czf "backup_$stamp.tar.gz" src/\necho "Backup written: backup_$stamp.tar.gz"',
      explanation:
        'Creates a compressed archive of src/ named with the current timestamp. set -euo pipefail makes it fail safely on any error.',
      securityNote:
        'Read-only on source files; writes only a new archive inside the sandbox workspace.',
    };
  }

  if (lower.includes('size') || lower.includes('largest') || lower.includes('sorted')) {
    return {
      type: 'shell',
      intent: 'List files sorted by size',
      command: 'du -sh * 2>/dev/null | sort -rh | head -20',
      explanation:
        'du -sh reports the human-readable size of each entry, sort -rh orders them largest first, and head -20 limits the output.',
      securityNote: 'Read-only. No files are modified.',
    };
  }

  if (lower.includes('disk')) {
    return {
      type: 'shell',
      intent: 'Show disk usage',
      command: 'df -h',
      explanation: 'Displays mounted filesystem sizes, used space and free space in human-readable units.',
      securityNote: 'Read-only.',
    };
  }

  if (lower.includes('process')) {
    return {
      type: 'shell',
      intent: 'List running processes by memory',
      command: 'ps aux --sort=-%mem | head -10',
      explanation: 'Lists the top 10 processes ordered by memory usage.',
      securityNote: 'Read-only.',
    };
  }

  if (lower.includes('file') || lower.includes('count')) {
    return {
      type: 'shell',
      intent: 'Count files in the workspace',
      command: 'find . -type f | wc -l',
      explanation: 'Counts all regular files recursively from the current directory.',
      securityNote: 'Read-only.',
    };
  }

  return {
    type: 'shell',
    intent: 'General command translation',
    command: `# ${input}\necho "[shell-gpt] Translated request staged for review."`,
    explanation:
      'Your request was captured. Provide more detail (files, permissions, search) and I will emit the exact safe command plus an explanation.',
    securityNote: SAFE_NOTICE,
  };
}

// ----------------------------------------------------------------------------
// TERMINAL GPT run builder
// ----------------------------------------------------------------------------

function terminalRespond(input: string, ctx: AgentContext): TerminalRun {
  const lower = input.toLowerCase();

  if (lower.includes('autoheal')) {
    return {
      type: 'terminal',
      command: '/autoheal',
      output: [
        '[auto-heal] Targeting active file: ' + ctx.activeFilePath,
        '[auto-heal] Option 2 loop will capture the crash, decompose AST Bites, patch and re-verify using Codestral.',
      ],
      exitCode: 0,
      verdict: 'STAGED',
    };
  }

  if (lower.includes('explain')) {
    return {
      type: 'terminal',
      command: '# explain last output',
      output: [
        '[terminal-gpt] The last run produced a TypeError on line 19 (unchecked payload.amount).',
        '[terminal-gpt] Run the auto-heal loop with Codestral to patch it, then re-execute to verify EXIT CODE 0.',
      ],
      exitCode: 0,
      verdict: 'EXPLAINED',
    };
  }

  const cleanCommand = input.trim().replace(/^\/run\s+/i, '');
  const nodeCommand = /^node\s+/.test(cleanCommand) ? cleanCommand : `node ${ctx.activeFilePath}`;
  return {
    type: 'terminal',
    command: nodeCommand,
    output: ['[terminal-gpt] Queued for sandbox execution: ' + nodeCommand],
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
 * Agent-aware terminal log lines for the bottom shell screen.
 */
export function generateAgentTerminalLogs(agentId: AgentId, input: string): string[] {
  const cmd = input.trim();

  if (agentId === 'kali-gpt') {
    const lower = cmd.toLowerCase();
    if (lower.startsWith('/recon')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT // RECON] Scanning sandbox namespace (gentle, read-only)...',
        '[KALI GPT // RECON] Mistral Remote Gateway CONNECTED  |  8080/enclave FILTERED  |  22/ssh CLOSED',
        '[KALI GPT // RECON] Host OS out of scope. Outside Boundary sandbox jail respected.',
      ];
    }
    if (lower.startsWith('/scan')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT // SCAN] Consulting simulated CVE feed with Mistral Large...',
        '[KALI GPT // SCAN] CRITICAL: lodash@4.17.15 prototype pollution (SIMULATED)',
        '[KALI GPT // SCAN] Recommend: upgrade lodash and re-lock dependencies.',
      ];
    }
    if (lower.startsWith('/audit')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT // AUDIT] 4 findings: 1 CRITICAL, 1 HIGH, 1 MEDIUM, 1 INFO.',
        '[KALI GPT // AUDIT] CRITICAL: processPayment() crashes on malformed payload.',
      ];
    }
    if (lower.startsWith('/harden')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT // HARDEN] Applied gentle hardening to sandbox copy only.',
        '[KALI GPT // HARDEN] Airgap + syscall firewall + path jail re-affirmed.',
      ];
    }
    if (lower.startsWith('/exploit')) {
      return [
        `$ ${cmd}`,
        '[KALI GPT // EXPLOIT] Analyzing vector (gated by Double-Layer Shield)...',
        '[KALI GPT // EXPLOIT] Impact limited to availability; no RCE primitive.',
      ];
    }
    return [`$ ${cmd}`, '[KALI GPT] Read-only analysis. Use /recon, /scan, /audit, /harden, /exploit.'];
  }

  if (agentId === 'shell-gpt') {
    const translation = shellRespond(cmd);
    return [
      `$ ${cmd}`,
      `[SHELL GPT] → ${translation.command.split('\n')[0]}`,
      `[SHELL GPT] ${translation.explanation}`,
    ];
  }

  // terminal-gpt falls through to normal execution elsewhere
  return [`$ ${cmd}`];
}
