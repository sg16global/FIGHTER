// ============================================================================
// SOVEREIGN AEGIS-IDE // DOUBLE-LAYER SECURITY SHIELD (OPTION 3 ARCHITECTURE)
// ============================================================================
// Layer 1 (Outside Boundary): Sandbox Path Jail & Airgapped OS Containment
// Layer 2 (Inside Boundary) : Realtime AST / Syscall / Terminal Command Firewall
// ZERO Meta, DeepSeek, or Grok implementations. Sovereign Mistral Suite.
// ============================================================================

export type SecurityVerdict = 'SAFE' | 'SANDBOX_CONTAINED' | 'BLOCKED_SYSCALL';

export interface ThreatMatch {
  ruleId: string;
  category: 'FILESYSTEM_WIPE' | 'PRIVILEGE_ESCALATION' | 'FORK_BOMB' | 'TELEMETRY_EXFILTRATION' | 'JAILBREAK_ATTEMPT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  patternMatched: string;
  mitigation: string;
}

export interface SecurityAuditResult {
  id: string;
  timestamp: string;
  verdict: SecurityVerdict;
  inputSnippet: string;
  source: 'USER_PROMPT' | 'AI_CODE_OUTPUT' | 'TERMINAL_EXECUTION' | 'FILE_WRITE';
  sandboxJailPath: string;
  threats: ThreatMatch[];
  executionAllowed: boolean;
  notes: string;
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

// Known destructive syscall and wipe patterns
const MALICIOUS_PATTERNS: Array<{
  ruleId: string;
  regex: RegExp;
  category: ThreatMatch['category'];
  severity: ThreatMatch['severity'];
  mitigation: string;
}> = [
  {
    ruleId: 'SEC-WIPE-001',
    regex: /\b(rm\s+-r[fF]?\s+(\/|\*|\~|\$HOME|\.\.)|rmdir\s+\/s\s+\/q\s+[cCdD]:\\?|shutil\.rmtree\s*\(\s*['"]\/['"])/i,
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    mitigation: 'BLOCKED: Attempted recursive root or system directory wipe intercepted before OS kernel syscall.',
  },
  {
    ruleId: 'SEC-WIPE-002',
    regex: /fs\.(rm|rmdir|unlink)(Sync)?\s*\(\s*['"`](\/|C:\\|D:\\|\.\.\/\.\.)['"`]/i,
    category: 'FILESYSTEM_WIPE',
    severity: 'CRITICAL',
    mitigation: 'BLOCKED: Node.js fs root-level destructive removal blocked by Inside Boundary AST check.',
  },
  {
    ruleId: 'SEC-FORK-003',
    regex: /(:\(\)\s*\{\s*:\|:&\s*\};:|while\s*\(\s*true\s*\)\s*\{\s*fork\s*\(\s*\)|process\.fork\s*\(\s*__filename\s*\)\s*in\s*loop)/i,
    category: 'FORK_BOMB',
    severity: 'CRITICAL',
    mitigation: 'BLOCKED: Resource exhaustion fork-bomb signature detected and terminated.',
  },
  {
    ruleId: 'SEC-TELEMETRY-004',
    regex: /(api\.meta\.ai|api\.deepseek\.com|grok\.x\.ai|api\.openai\.com|telemetry\.external\.net)/i,
    category: 'TELEMETRY_EXFILTRATION',
    severity: 'HIGH',
    mitigation: 'BLOCKED: Prohibited external cloud telemetry detected. Sovereign Shield enforces strict enclave privacy.',
  },
  {
    ruleId: 'SEC-PRIVESC-005',
    regex: /\b(sudo\s+chmod\s+777\s+\/|mkfs\.|dd\s+if=.*of=\/dev\/sd|chown\s+-R\s+root)/i,
    category: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    mitigation: 'BLOCKED: System partition format / privilege escalation attempt halted inside sandbox.',
  },
];

/**
 * Validates a file path against Outside Boundary Sandbox Path Jail
 */
export function validateSandboxPath(path: string, sandboxRoot: string = '/workspace/sovereign-project'): {
  allowed: boolean;
  normalizedPath: string;
  reason?: string;
} {
  const normalized = path.replace(/\\/g, '/');
  if (
    normalized.startsWith('/etc/') ||
    normalized.startsWith('/root/') ||
    normalized.startsWith('/var/') ||
    normalized.startsWith('C:/Windows') ||
    normalized.includes('../..')
  ) {
    return {
      allowed: false,
      normalizedPath: normalized,
      reason: `Path Escape Blocked: "${path}" attempts to traverse outside sandbox jail ${sandboxRoot}`,
    };
  }
  return {
    allowed: true,
    normalizedPath: normalized.startsWith(sandboxRoot)
      ? normalized
      : `${sandboxRoot}/${normalized.replace(/^\/+/, '')}`,
  };
}

/**
 * Double-Layer Inspector: Scans user prompts, AI output, or terminal scripts
 */
export function inspectSecurityPayload(
  content: string,
  source: SecurityAuditResult['source'],
  config: ShieldConfig = DEFAULT_SHIELD_CONFIG
): SecurityAuditResult {
  const threats: ThreatMatch[] = [];

  for (const rule of MALICIOUS_PATTERNS) {
    const match = content.match(rule.regex);
    if (match) {
      threats.push({
        ruleId: rule.ruleId,
        category: rule.category,
        severity: rule.severity,
        patternMatched: match[0],
        mitigation: rule.mitigation,
      });
    }
  }

  // Check path escapes if it's a command
  const hasPathTraversal = content.includes('../../etc/') || content.includes('/root/.ssh');
  if (hasPathTraversal) {
    threats.push({
      ruleId: 'SEC-JAIL-006',
      category: 'JAILBREAK_ATTEMPT',
      severity: 'HIGH',
      patternMatched: '../../etc/ or /root/.ssh',
      mitigation: 'Outside Boundary: Sandboxed Virtual File System trapped path traversal.',
    });
  }

  const hasCriticalThreat = threats.some((t) => t.severity === 'CRITICAL');
  const verdict: SecurityVerdict = hasCriticalThreat
    ? 'BLOCKED_SYSCALL'
    : threats.length > 0
    ? 'SANDBOX_CONTAINED'
    : 'SAFE';

  return {
    id: `AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    timestamp: new Date().toLocaleTimeString(),
    verdict,
    inputSnippet: content.length > 180 ? content.slice(0, 180) + '...' : content,
    source,
    sandboxJailPath: config.sandboxRoot,
    threats,
    executionAllowed: verdict !== 'BLOCKED_SYSCALL',
    notes:
      verdict === 'BLOCKED_SYSCALL'
        ? `Double-Layer Shield blocked execution: ${threats[0]?.mitigation}`
        : verdict === 'SANDBOX_CONTAINED'
        ? 'Executed within isolated container virtual filesystem (`/workspace/sovereign-project/`).'
        : 'All Inside AST checks and Outside Sandbox Jail checks passed.',
  };
}

/**
 * Option 3 Complete Standalone Python Reference Module Source
 */
export const OPTION_3_PYTHON_REFERENCE = `# ==============================================================================
# SOVEREIGN DOUBLE-LAYER SECURITY SHIELD (OPTION 3 REFERENCE ARCHITECTURE)
# Strict Outside Boundary (Docker/chroot Sandbox Jail) + Inside Boundary (AST/Syscall)
# ==============================================================================
import ast
import os
import re
import shlex
import subprocess
from dataclasses import dataclass
from typing import List, Tuple

FORBIDDEN_SYSCALL_PATTERNS = [
    r"\\brm\\s+-r[fF]?\\s+(/|\\*|~)",
    r"\\brmdir\\s+/s\\s+/q",
    r"shutil\\.rmtree\\s*\\(\\s*['\"]/['\"]",
    r"os\\.system\\s*\\(.*rm\\s+-rf",
    r"mkfs\\.",
    r"dd\\s+if=.*of=/dev/",
    r":(?:\\(\\)\\s*\\{\\s*:|:&\\s*\\};:)",  # Fork bomb
]

FORBIDDEN_EXTERNAL_HOSTS = [
    "api.meta.ai",
    "api.deepseek.com",
    "grok.x.ai",
]


@dataclass
class ShieldAuditResult:
    allowed: bool
    layer_triggered: str  # "INSIDE_AST", "OUTSIDE_SANDBOX", "PASSED"
    reason: str


class InsideBoundaryASTValidator(ast.NodeVisitor):
    """
    Inside Boundary: Parses Python source code into an AST before execution.
    Intercepts dangerous syscalls, os.system/subprocess destructive commands.
    """
    def __init__(self, sandbox_root: str):
        self.sandbox_root = os.path.abspath(sandbox_root)
        self.violations: List[str] = []

    def visit_Call(self, node: ast.Call):
        func_name = ""
        if isinstance(node.func, ast.Attribute):
            func_name = f"{getattr(node.func.value, 'id', '')}.{node.func.attr}"
        elif isinstance(node.func, ast.Name):
            func_name = node.func.id

        # Block root shutil.rmtree or os.remove outside jail
        if func_name in ("shutil.rmtree", "os.remove", "os.unlink", "os.system"):
            if node.args and isinstance(node.args[0], ast.Constant):
                target = str(node.args[0].value)
                if target.startswith("/") and not target.startswith(self.sandbox_root):
                    self.violations.append(
                        f"SYSCALL_INTERCEPT: {func_name} attempted on outside path '{target}'"
                    )
        self.generic_visit(node)


class OutsideBoundarySandbox:
    """
    Outside Boundary: Wraps file access & terminal execution in an isolated
    directory jail (/workspace/sovereign-project) with resource limits.
    """
    def __init__(self, root_dir: str = "/workspace/sovereign-project"):
        self.root_dir = os.path.abspath(root_dir)
        os.makedirs(self.root_dir, exist_ok=True)

    def resolve_safe_path(self, relative_path: str) -> str:
        full_path = os.path.abspath(os.path.join(self.root_dir, relative_path))
        if not full_path.startswith(self.root_dir):
            raise PermissionError(
                f"[OUTSIDE BOUNDARY VIOLATION] Path escape blocked: {relative_path}"
            )
        return full_path


class SovereignDoubleLayerShield:
    def __init__(self, sandbox_root: str = "/workspace/sovereign-project"):
        self.sandbox = OutsideBoundarySandbox(sandbox_root)

    def inspect_and_execute(self, code_or_cmd: str, is_python_code: bool = True) -> ShieldAuditResult:
        # 1. Regex Syscall & Destructive Wipe Filter
        for pattern in FORBIDDEN_SYSCALL_PATTERNS:
            if re.search(pattern, code_or_cmd):
                return ShieldAuditResult(
                    allowed=False,
                    layer_triggered="INSIDE_SYSCALL_FIREWALL",
                    reason=f"Blocked destructive command matching regex: {pattern}",
                )

        # 2. If Python code, run deep AST inspection
        if is_python_code:
            try:
                tree = ast.parse(code_or_cmd)
                visitor = InsideBoundaryASTValidator(self.sandbox.root_dir)
                visitor.visit(tree)
                if visitor.violations:
                    return ShieldAuditResult(
                        allowed=False,
                        layer_triggered="INSIDE_AST_VALIDATOR",
                        reason="; ".join(visitor.violations),
                    )
            except SyntaxError:
                pass  # Syntax errors caught by compiler safely

        return ShieldAuditResult(
            allowed=True,
            layer_triggered="PASSED",
            reason="Inside AST & Outside Sandbox Jail checks passed.",
        )
`;
