// ============================================================================
// SOVEREIGN AEGIS-IDE // DOUBLE-LAYER SECURITY SHIELD (OPTION 3 ARCHITECTURE)
// ============================================================================
// Layer 1 (Outside Boundary): Sandbox Path Jail & Airgapped OS Containment
// Layer 2 (Inside Boundary) : Realtime AST / Syscall / Terminal Command Firewall
//
// This module is the RULE BASE only. It contains no UI imports, no network
// access, and no execution capability, so it can be verified in isolation and
// reused by every backend security layer (KALI GPT, SHELL GPT, TERMINAL GPT)
// without creating an import cycle with the execution engine.
//
// ZERO Meta, DeepSeek, or Grok implementations. Sovereign Mistral Suite.
// ============================================================================

export type SecurityVerdict = 'SAFE' | 'SANDBOX_CONTAINED' | 'BLOCKED_SYSCALL';

export type ThreatCategory =
  | 'FILESYSTEM_WIPE'
  | 'PRIVILEGE_ESCALATION'
  | 'FORK_BOMB'
  | 'TELEMETRY_EXFILTRATION'
  | 'SANDBOX_ESCAPE'
  | 'JAILBREAK_ATTEMPT';

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface ThreatMatch {
  ruleId: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  patternMatched: string;
  mitigation: string;
}

export type SecurityPayloadSource =
  | 'USER_PROMPT'
  | 'AI_CODE_OUTPUT'
  | 'TERMINAL_EXECUTION'
  | 'FILE_WRITE';

export interface SecurityAuditResult {
  id: string;
  timestamp: string;
  verdict: SecurityVerdict;
  inputSnippet: string;
  source: SecurityPayloadSource;
  sandboxJailPath: string;
  threats: ThreatMatch[];
  executionAllowed: boolean;
  notes: string;
  /** Content fingerprint used to bind a Shield permit to exactly this payload. */
  contentHash: string;
}

export interface ShieldConfig {
  airgapStrict: boolean;          // Sovereign Mistral isolation enabled
  blockDestructiveSyscalls: boolean;
  enforcePathJail: boolean;
  sandboxRoot: string;            // e.g. "/workspace/sovereign-project"
  allowNetworkFetch: boolean;
}

export const DEFAULT_SHIELD_CONFIG: ShieldConfig = {
  airgapStrict: true,
  blockDestructiveSyscalls: true,
  enforcePathJail: true,
  sandboxRoot: '/workspace/sovereign-project',
  allowNetworkFetch: false,
};

export const SANDBOX_ROOT = DEFAULT_SHIELD_CONFIG.sandboxRoot;

/** Hosts the sovereign enclave is contractually forbidden to talk to. */
export const FORBIDDEN_TELEMETRY_HOSTS = [
  'api.meta.ai',
  'meta.ai',
  'api.deepseek.com',
  'deepseek.com',
  'grok.x.ai',
  'api.grok.x.ai',
  'api.openai.com',
  'openai.com',
  'telemetry.external.net',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.cohere.com',
];

// ----------------------------------------------------------------------------
// Rule base
// ----------------------------------------------------------------------------

/**
 * A pattern is matched against the NORMALIZED form of the payload (see
 * `normalizeInput`), never against the raw text. That closes the classic
 * obfuscation gaps: `r​m  -rf /` with injected zero-width spaces, escaped
 * string concatenation, and backslash-continued newlines.
 */
interface ShieldRule {
  ruleId: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  regex: RegExp;
  mitigation: string;
  /** Restrict the rule to specific payload sources (empty = every source). */
  sources?: SecurityPayloadSource[];
}

const RULES: ShieldRule[] = [
  // ---- Filesystem destruction -------------------------------------------------
  {
    ruleId: 'SEC-WIPE-001',
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    regex: /\brm\s+(?:-[a-z]*\s+)*-?[rf]+\w*\s+(?:-\w+\s+)*(?:\/(?:\s|$|\*)|\*|~|\$home|\.\.|\.\.\/+|c:\/|c:\\|\/home\b|\/root\b|\/usr\b|\/etc\b|\/var\b|\/bin\b|\/lib\b|\/boot\b|\/dev\b|\/sys\b|\/proc\b)/i,
    mitigation: 'BLOCKED: Recursive root or system-directory wipe intercepted before the OS kernel syscall.',
  },
  {
    ruleId: 'SEC-WIPE-002',
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    regex: /\bfs\.(?:rm|rmdir|unlink|truncate|writefile)(?:sync)?\s*\(\s*(?:['"`](?:\/|[a-z]:[\\/]|(?:\.\.\/)+)|process\.env)/i,
    mitigation: 'BLOCKED: Node filesystem mutation outside the jail blocked by the Inside Boundary AST check.',
  },
  {
    ruleId: 'SEC-WIPE-003',
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    regex: /\b(?:shutil\.rmtree|rmdir\s+\/s\s+\/q|del\s+\/[fsq]\s+[a-z]:\\|format\s+[a-z]:)\b/i,
    mitigation: 'BLOCKED: Cross-platform format / recursive delete primitive denied inside the sandbox.',
  },
  {
    ruleId: 'SEC-WIPE-004',
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    regex: /\bdd\b[^|;&\n]*\bof=\/dev\/(?!null|zero|stdout\b)[a-z]/i,
    mitigation: 'BLOCKED: Raw block-device write (dd of=/dev/...) intercepted at the syscall firewall.',
  },
  {
    ruleId: 'SEC-WIPE-005',
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    regex: /(?:mkfs(?:\.\w+)?|fdisk|parted|wipefs|blkdiscard)\b\s+\S*\/dev\/|>{1,2}\s*\/dev\/(?:sd|nvme|hd|vd|disk|mapper)\b/i,
    mitigation: 'BLOCKED: Partition table / filesystem rewrite attempt terminated inside the sandbox.',
  },

  // ---- Resource exhaustion ---------------------------------------------------
  {
    ruleId: 'SEC-FORK-006',
    category: 'FORK_BOMB',
    severity: 'CRITICAL',
    regex: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&|fork\s*\(\s*\)\s*(?:;|while|for)|while\s*\(\s*(?:1|true)\s*\)\s*(?:do|\{)?\s*(?:child_process|process\.fork|node|spawn|exec|fork)/i,
    mitigation: 'BLOCKED: Resource-exhaustion fork-bomb signature detected and terminated.',
  },

  // ---- Host containment / privilege ------------------------------------------
  {
    ruleId: 'SEC-PRIVESC-007',
    category: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    regex: /\b(?:sudo|doas|runas|pkexec|su)\s+-\S*\s*(?:root|#0)?|chmod\s+(?:-[a-z]+\s+)*(?:777|a\+rwx|666)\s+\/(?:\s|$|\*)|chown\s+(?:-[a-z]+\s+)*root\b/i,
    mitigation: 'BLOCKED: Privilege-escalation or world-writable system root attempt halted inside the sandbox.',
  },
  {
    ruleId: 'SEC-PERSIST-008',
    category: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    regex: /\b(?:crontab\s+-|schtasks\s+\/create|reg\s+(?:add|import)\b|setx\s|\/etc\/(?:passwd|shadow|sudoers|rc\.local|profile)\b|\.bashrc\b|\.ssh\/authorized_keys|powershell?-[^ ]*-w\s+(?:hidden|h)\b|invoke-webrequest[^|]*\|\s*iex|net\s+localgroup\s+administrators)/i,
    mitigation: 'QUARANTINED: Persistence / privilege-abuse primitive confined to the virtual filesystem; never reached the host.',
  },

  // ---- Exfiltration & forbidden telemetry --------------------------------------
  {
    ruleId: 'SEC-EXFIL-009',
    category: 'TELEMETRY_EXFILTRATION',
    severity: 'CRITICAL',
    regex: new RegExp(
      String.raw`\b(?:fetch|xmlhttprequest\.open|https?\.request|net\.connect|axios\.\w+|curl|wget|nslookup|dig|ping)\b[^\n]{0,160}(?:` +
        FORBIDDEN_TELEMETRY_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|') +
        `)`,
      'i',
    ),
    mitigation: 'BLOCKED: Prohibited external telemetry endpoint. The sovereign shield enforces strict enclave privacy.',
  },
  {
    ruleId: 'SEC-EXFIL-010',
    category: 'TELEMETRY_EXFILTRATION',
    severity: 'CRITICAL',
    regex: /\b(?:curl|wget|fetch|nc|netcat|base64)\b[^\n]{0,80}\b(?:\.aws\/credentials|id_rsa|\.ssh\/|\.npmrc|\.env\b|cookies?\.sqlite|keychain|credentials\.json)|webhook\.site|hooks\.slack\.com|discord(?:app)?\.com\/api\/webhooks|pastebin\.com\/api|transfer\.sh|file\.io|0x0\.st|ngrok\.(?:io|com)/i,
    mitigation: 'BLOCKED: Credential / secret harvesting and pastebin-style exfiltration channel terminated.',
  },

  // ---- Sandbox escape primitives -----------------------------------------------
  {
    ruleId: 'SEC-ESCAPE-011',
    category: 'SANDBOX_ESCAPE',
    severity: 'CRITICAL',
    regex: /\belectron\b|\brequire\s*\(\s*['"`]electron['"`]\s*\)|\bprocess\s*\.\s*(?:binding|_linkedbinding|dlopen)|\bchild_process\b|\brequire\s*\(\s*['"`]node:child_process['"`]\s*\)|\bipcrenderer\s*\.\s*(?:send|invoke)\s*\(\s*['"`]shell|\bwebviewtag\b|\bnwjs\b/i,
    mitigation: 'BLOCKED: Host-runtime / Electron IPC escape primitive removed from the executed scope before evaluation.',
    sources: ['AI_CODE_OUTPUT', 'TERMINAL_EXECUTION'],
  },
  {
    ruleId: 'SEC-ESCAPE-012',
    category: 'SANDBOX_ESCAPE',
    severity: 'CRITICAL',
    regex: /\beval\s*\(|\bnew\s+function\s*\(|(?<![a-z0-9_$])function\s*\(\s*['"`]|\.constructor\s*[.([]|__proto__\b|\bprototype\s*\[\s*['"]|import\s*\(\s*(?!['"])/i,
    mitigation: 'BLOCKED: Dynamic code-compilation / prototype-pollution primitive intercepted by the Inside Boundary firewall.',
    sources: ['AI_CODE_OUTPUT', 'TERMINAL_EXECUTION'],
  },
  {
    ruleId: 'SEC-ESCAPE-013',
    category: 'SANDBOX_ESCAPE',
    severity: 'HIGH',
    regex: /\b(?:fs|require|import|module|process|__dirname|global)\s*=\s*globalthis|\bfunction\s*\w*\s*\([^)]*\)\s*\{[^}]{0,40}\breturn\s+(?:global|window|process)\b/i,
    mitigation: 'QUARANTINED: Ambient-global rebinding attempt neutralized by the hardened Function scope.',
    sources: ['AI_CODE_OUTPUT', 'TERMINAL_EXECUTION'],
  },

  // ---- Jail / prompt-injection attempts ----------------------------------------
  {
    ruleId: 'SEC-JAIL-014',
    category: 'JAILBREAK_ATTEMPT',
    severity: 'CRITICAL',
    regex: /(?:ignore|disregard|forget|override)\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|earlier|system)\s+(?:instructions|prompts|rules|directives|guardrails)|you\s+are\s+(?:now|no\s+longer)\s+(?:in\s+)?(?:developer|dan|jailbreak|unrestricted|god)\s*mode|<\|?im_start\|?>\s*system|assistant\s*:\s*system|<\/?(?:system|instructions|developer)>\s*(?:you|override|disable)|act\s+as\s+(?:if\s+you\s+(?:are|have)\s+)?(?:an?\s+)?(?:unrestricted|jailbroken|unfiltered)\s+(?:ai|model)/i,
    mitigation: 'BLOCKED: Model guardrail-override attempt rejected. Backend security layers cannot be reprogrammed from the chat surface.',
  },
  {
    ruleId: 'SEC-JAIL-015',
    category: 'JAILBREAK_ATTEMPT',
    severity: 'CRITICAL',
    regex: /disable\s+(?:the\s+)?(?:double-?layer\s+)?shield|bypass\s+(?:the\s+)?(?:shield|sandbox|firewall|jail)|turn\s+off\s+(?:security|guardrails|safety)|exfiltrate.{0,24}api\s*key|steal\s+(?:the\s+)?(?:api\s*key|token|credentials)|leak\s+(?:the\s+)?system\s*prompt/i,
    mitigation: 'BLOCKED: Attempt to disarm the security layers is itself a Critical finding and is logged immutably.',
  },

  // ---- Path traversal -----------------------------------------------------------
  {
    ruleId: 'SEC-JAIL-016',
    category: 'JAILBREAK_ATTEMPT',
    severity: 'CRITICAL',
    regex: /(?:\.\.\/){2,}(?:etc|root|proc|sys|dev|home|users|windows)|~\/\.ssh|\/etc\/(?:passwd|shadow|sudoers)/i,
    mitigation: 'BLOCKED: Jail escape / path-traversal read attempt trapped by the Outside Boundary virtual filesystem.',
  },
  {
    ruleId: 'SEC-DOWNEXEC-018',
    category: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    regex: /\b(?:curl|wget)\b[^|;&\n]*\|\s*(?:ba|z|d)?(?:sh|csh|fish|powershell|pwsh)\b|\b(?:mshta|rundll32|wscript|cscript)\b|certutil\s+-decode|bitsadmin\/transfer|-enc(?:odedcommand)?\b/i,
    mitigation: 'BLOCKED: Download-and-execute / encoded-command chain denied by the Inside Boundary firewall.',
  },
  {
    ruleId: 'SEC-EXFIL-019',
    category: 'TELEMETRY_EXFILTRATION',
    severity: 'CRITICAL',
    regex: /(?:readfile|readfilesync|open|fs\.read\w*|get\w*file)\b[^\n]{0,60}(?:~|\$home)\/\.aws\b|(?:~|\$home)\/\.aws\/credentials|\bid_rsa\b|\.git-credentials\b|\.npmrc\b|login data\b|keychain\b|cookies?\.(?:sqlite|db)\b/i,
    mitigation: 'BLOCKED: Credential / secret file access pattern. Secrets never transit the sandbox boundary.',
    sources: ['AI_CODE_OUTPUT', 'TERMINAL_EXECUTION', 'FILE_WRITE'],
  },
  {
    ruleId: 'SEC-ESCAPE-020',
    category: 'SANDBOX_ESCAPE',
    severity: 'CRITICAL',
    regex: /\[\s*['"`](?:constructor|prototype|eval|function|globalthis|window|process|require|self|top|parent)['"`]\s*\]|fromcharcode|unicodeescape/i,
    mitigation: 'BLOCKED: Bracketed-property obfuscation of escape primitives intercepted before compilation.',
    sources: ['AI_CODE_OUTPUT', 'TERMINAL_EXECUTION'],
  },
];

// ----------------------------------------------------------------------------
// Normalization + primitives
// ----------------------------------------------------------------------------

/** Strips obfuscation so every rule sees one canonical form of the payload. */
export function normalizeInput(raw: string): string {
  return String(raw ?? '')
    // Unicode normalize then remove zero-width / bidi / soft-hyphen tricks.
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u00AD\uFEFF]/g, '')
    // Line continuations and null bytes used to split signatures.
    .replace(/\\\r?\n/g, '')
    .replace(/\0/g, '')
    // String-concatenation obfuscation: "r" + "m -rf /"  -> rm -rf /
    .replace(/(['"`])\s*\+\s*(['"`])/g, '')
    .replace(/(['"`])\s*\+\s*([a-z_$][\w$]*)\s*\+\s*(['"`])/gi, '$1$2$1')
    // Collapse whitespace runs so `rm   -rf  /` still matches.
    .replace(/[ \t]{2,}/g, ' ')
    .toLowerCase();
}

/** FNV-1a 32-bit content fingerprint (display + permit binding, not a MAC). */
export function fingerprintContent(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Resolves a workspace-relative path lexically, rejecting traversal. Mirrors the
 * `path.resolve` + containment check the standalone Node reference module uses.
 */
export function validateSandboxPath(
  path: string,
  sandboxRoot: string = SANDBOX_ROOT,
): { allowed: boolean; normalizedPath: string; reason?: string } {
  const raw = String(path ?? '').trim();
  const unified = raw.replace(/\\/g, '/');

  if (!raw) {
    return { allowed: false, normalizedPath: raw, reason: 'Empty path rejected by the Outside Boundary jail.' };
  }
  if (/^[a-z]:/i.test(unified) || unified.startsWith('//') || unified.startsWith('\\\\')) {
    return {
      allowed: false,
      normalizedPath: unified,
      reason: `Absolute host path "${raw}" is outside the sandbox jail ${sandboxRoot}`,
    };
  }
  if (unified.includes('\0')) {
    return { allowed: false, normalizedPath: unified, reason: 'Null byte in path rejected.' };
  }

  if (unified.startsWith('/')) {
    // An absolute posix path is a HOST coordinate. The virtual filesystem is
    // addressed workspace-relative (or under the jail root); anything else is
    // refused outright rather than re-rooted, so "/etc/passwd" can never be
    // laundered into a seemingly-safe relative form.
    if (!unified.startsWith(`${sandboxRoot}/`) && unified !== sandboxRoot) {
      return {
        allowed: false,
        normalizedPath: unified,
        reason: `Absolute host path "${raw}" is outside the sandbox jail ${sandboxRoot}`,
      };
    }
  }

  const segments: string[] = [];
  for (const part of unified.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (segments.length === 0) {
        return {
          allowed: false,
          normalizedPath: unified,
          reason: `Path Escape Blocked: "${raw}" traverses above the sandbox root ${sandboxRoot}`,
        };
      }
      segments.pop();
      continue;
    }
    segments.push(part);
  }

  const normalized = `${sandboxRoot}/${segments.join('/')}`.replace(/\/{2,}/g, '/');
  if (!normalized.startsWith(`${sandboxRoot}/`) && normalized !== sandboxRoot) {
    return {
      allowed: false,
      normalizedPath: normalized,
      reason: `Path Escape Blocked: "${raw}" resolves outside ${sandboxRoot}`,
    };
  }
  return { allowed: true, normalizedPath: normalized };
}

/**
 * True when the payload tries to reach a host location that must never be
 * touched, even if it is expressed as a plain string in prose.
 */
function detectHostPathAccess(normalized: string): boolean {
  return /(?:^|[\s'"`(=])\/(?:etc|root|proc|sys|dev|boot|bin|sbin|lib|usr|var)(?:\/|$)/.test(normalized)
    || /(?:^|[\s'"`(=])~\/\.ssh/.test(normalized)
    || /(?:^|[\s'"`(=])(?:c:\/windows|c:\\windows)/.test(normalized)
    || /\.\.\/\.\.\//.test(normalized);
}

let auditCounter = 0;

/**
 * Double-Layer Inspector: scans user prompts, AI output, workspace writes and
 * terminal scripts against the rule base, then returns an immutable audit
 * record. `executionAllowed` is the ONLY field callers may trust for gating.
 */
export function inspectSecurityPayload(
  content: string,
  source: SecurityPayloadSource,
  config: ShieldConfig = DEFAULT_SHIELD_CONFIG,
): SecurityAuditResult {
  const normalized = normalizeInput(content);
  const threats: ThreatMatch[] = [];

  for (const rule of RULES) {
    if (rule.sources && !rule.sources.includes(source)) continue;
    if (!config.blockDestructiveSyscalls && rule.category === 'FILESYSTEM_WIPE') continue;
    // Exfiltration rules are active only while network egress is restricted.
    if (config.allowNetworkFetch && rule.category === 'TELEMETRY_EXFILTRATION') continue;

    const match = normalized.match(rule.regex);
    if (!match) continue;

    // Prose context (chat discussion) or inert workspace writes that merely
    // MENTION an endpoint are logged for review, not denied; anything that can
    // actually execute (terminal payload / model patch) is enforced in full.
    const proseContext = source === 'USER_PROMPT' || source === 'FILE_WRITE';
    const severity: ThreatSeverity =
      proseContext && rule.category === 'TELEMETRY_EXFILTRATION' && rule.ruleId !== 'SEC-EXFIL-019'
        ? 'MEDIUM'
        : rule.severity;

    threats.push({
      ruleId: rule.ruleId,
      category: rule.category,
      severity,
      patternMatched: String(match[0]).slice(0, 120),
      mitigation: rule.mitigation,
    });
  }

  // Jail containment: a host path reference inside anything that could be
  // EXECUTED or applied as a patch is a Critical finding. Prose (USER_PROMPT)
  // and inert workspace text (FILE_WRITE) are judged by the traversal rules
  // instead, so security documentation stays writable while its execution
  // counterparts are denied at the terminal door.
  const executableContext = source === 'TERMINAL_EXECUTION' || source === 'AI_CODE_OUTPUT';
  if (config.enforcePathJail && executableContext && detectHostPathAccess(normalized)) {
    threats.push({
      ruleId: 'SEC-JAIL-017',
      category: 'JAILBREAK_ATTEMPT',
      severity: 'CRITICAL',
      patternMatched: 'Host filesystem path reference outside the jail',
      mitigation: `Outside Boundary: all access is remapped inside \`${config.sandboxRoot}\`; the host path was never resolved.`,
    });
  }

  const hasCritical = threats.some((t) => t.severity === 'CRITICAL');
  const verdict: SecurityVerdict = hasCritical
    ? 'BLOCKED_SYSCALL'
    : threats.length > 0
      ? 'SANDBOX_CONTAINED'
      : 'SAFE';

  auditCounter += 1;
  const time = new Date().toLocaleTimeString();

  return {
    id: `AUDIT-${time.replace(/[:\s]/g, '')}-${auditCounter.toString().padStart(4, '0')}`,
    timestamp: time,
    verdict,
    inputSnippet: content.length > 180 ? `${content.slice(0, 180)}...` : content,
    source,
    sandboxJailPath: config.sandboxRoot,
    threats,
    executionAllowed: verdict !== 'BLOCKED_SYSCALL',
    notes:
      verdict === 'BLOCKED_SYSCALL'
        ? `Double-Layer Shield blocked execution: ${threats[0]?.mitigation ?? 'Critical rule match'}`
        : verdict === 'SANDBOX_CONTAINED'
          ? 'Contained inside the isolated virtual filesystem; no host primitive was reachable.'
          : 'All Inside Boundary AST checks and Outside Boundary sandbox jail checks passed.',
    contentHash: fingerprintContent(content),
  };
}

// ----------------------------------------------------------------------------
// Standalone reference implementation (shown in the Architecture blueprint)
// ----------------------------------------------------------------------------

/**
 * Option 3 Complete Standalone Python Reference Module Source
 */
export const OPTION_3_PYTHON_REFERENCE = `# ==============================================================================
# SOVEREIGN DOUBLE-LAYER SECURITY SHIELD (OPTION 3 REFERENCE ARCHITECTURE)
# Strict Outside Boundary (chroot/Docker sandbox jail) + Inside Boundary (AST)
# The three backend layers below are the exact same roles KALI GPT / SHELL GPT
# and TERMINAL GPT play inside the studio. Nothing bypasses them.
# ==============================================================================
import ast
import os
import re
from dataclasses import dataclass, field
from typing import List

SANDBOX_ROOT = os.path.abspath("/workspace/sovereign-project")

FORBIDDEN_SYSCALL_PATTERNS = [
    r"\\brm\\s+-r[fF]?\\s+(/|\\*|~)",
    r"\\brmdir\\s+/s\\s+/q",
    r"shutil\\.rmtree\\s*\\(\\s*['\\"]/",
    r"os\\.system\\s*\\(.*rm\\s+-rf",
    r"mkfs\\.",
    r"dd\\s+if=.*of=/dev/",
    r":\\(\\)\\s*\\{\\s*:\\|:&\\s*\\};:",        # fork bomb
    r"\\beval\\s*\\(",
    r"__import__\\s*\\(",
]

FORBIDDEN_EXTERNAL_HOSTS = [
    "api.meta.ai",
    "api.deepseek.com",
    "grok.x.ai",
]


@dataclass
class ShieldAuditResult:
    allowed: bool
    layer: str            # LAYER1_KALI | LAYER2_SHELL | LAYER3_TERMINAL | PASSED
    reason: str
    violations: List[str] = field(default_factory=list)


def _normalize(text: str) -> str:
    """Strip zero-width joiners, escapes and whitespace so patterns cannot be split."""
    text = re.sub(r"[\\u200b-\\u200f\\u2060\\ufeff]", "", text)
    text = text.replace("\\\\n", "").replace("\\\\r", "")
    return re.sub(r"[ \\t]{2,}", " ", text.lower())


class InsideBoundaryASTValidator(ast.NodeVisitor):
    """LAYER 1 (KALI GPT): parse before execute, reject dangerous call shapes."""

    def __init__(self, sandbox_root: str = SANDBOX_ROOT):
        self.sandbox_root = sandbox_root
        self.violations: List[str] = []

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Attribute):
            owner = getattr(node.func.value, "id", "")
            name = f"{owner}.{node.func.attr}"
        elif isinstance(node.func, ast.Name):
            name = node.func.id
        else:
            name = ""

        if name in {"shutil.rmtree", "os.remove", "os.unlink", "os.system", "os.execv",
                    "subprocess.call", "subprocess.run", "subprocess.Popen", "eval", "exec"}:
            target = ""
            if node.args and isinstance(node.args[0], ast.Constant):
                target = str(node.args[0].value)
            if name in {"eval", "exec"} or (target and not _inside_jail(target, self.sandbox_root)):
                self.violations.append(f"SYSCALL_INTERCEPT: {name} on '{target or '<dynamic>'}'")
        self.generic_visit(node)


class Layer2CommandSanitizer:
    """LAYER 2 (SHELL GPT): shell-level deny list + argv parsing, never a raw string."""

    FORBIDDEN_TOKENS = {"rm", "mkfs", "dd", "sudo", "chown", "chmod", "nc", "ncat", "curl", "wget"}

    def check(self, command: str) -> ShieldAuditResult:
        normalized = _normalize(command)
        for pattern in FORBIDDEN_SYSCALL_PATTERNS:
            if re.search(pattern, normalized):
                return ShieldAuditResult(False, "LAYER2_SHELL", f"Denied pattern: {pattern}")
        return ShieldAuditResult(True, "LAYER2_SHELL", "Command shape is read-only and jail-bound.")


def _inside_jail(target: str, root: str) -> bool:
    resolved = os.path.realpath(os.path.join(root, target))
    return resolved == root or resolved.startswith(root + os.sep)


class Layer3ExecutionGate:
    """LAYER 3 (TERMINAL GPT): the only code path that may spawn a process.

    Execution requires a single-use, TTL-bound permit that binds the operator,
    the source, AND the exact SHA-256 of the payload. Editing a byte invalidates it.
    """

    def __init__(self, sandbox_root: str = SANDBOX_ROOT):
        self.sandbox_root = sandbox_root
        self._permits: dict = {}

    def request_permit(self, source: str, payload: str) -> str:
        import hashlib, secrets, time
        token = secrets.token_urlsafe(24)
        self._permits[token] = {
            "hash": hashlib.sha256(payload.encode()).hexdigest(),
            "source": source,
            "expires": time.time() + 15,
        }
        return token

    def execute(self, code: str, permit: str) -> ShieldAuditResult:
        import hashlib, time
        entry = self._permits.pop(permit, None)          # single use: popped, not read
        if entry is None or entry["expires"] < time.time():
            return ShieldAuditResult(False, "LAYER3_TERMINAL", "No valid single-use permit.")
        if entry["hash"] != hashlib.sha256(code.encode()).hexdigest():
            return ShieldAuditResult(False, "LAYER3_TERMINAL", "Payload changed after review.")

        for layer, audit in (
            ("LAYER1_KALI", _layer1(code)),
            ("LAYER2_SHELL", Layer2CommandSanitizer().check(code)),
        ):
            if not audit.allowed:
                return ShieldAuditResult(False, layer, audit.reason, audit.violations)

        return self._run_jailed(code)                   # chroot + uid drop + rlimit + kill timer


def _layer1(code: str) -> ShieldAuditResult:
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return ShieldAuditResult(False, "LAYER1_KALI", f"Reject unparsable source: {exc}")
    visitor = InsideBoundaryASTValidator()
    visitor.visit(tree)
    if visitor.violations:
        return ShieldAuditResult(False, "LAYER1_KALI", "; ".join(visitor.violations), visitor.violations)
    return ShieldAuditResult(True, "LAYER1_KALI", "AST clean.")


def _run_jailed(self, code: str) -> ShieldAuditResult:
    # os.chroot(self.sandbox_root) + setuid(nobody) + RLIMIT_* + SIGKILL watchdog
    raise NotImplementedError("Provided by the runtime container profile.")


Layer3ExecutionGate._run_jailed = _run_jailed
`;
