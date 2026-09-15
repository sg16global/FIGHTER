// ============================================================================
// MASTER ALGORITHM REGISTRY — the ONLY source of reasoning for this studio.
// ----------------------------------------------------------------------------
// The four Mistral model profiles and the offline engine run as a BLANK
// execution engine: they carry no persona, no default reasoning preset, and
// no autonomous intent detection. All thinking, prompt parsing and task
// execution are dictated exclusively by the user-authored logic blocks
// compiled here. Until at least one enabled block exists, the engine stays
// idle and every model path (remote and offline) is held in STANDBY.
//
// The backend security layers (KALI L1 / SHELL L2 / TERMINAL L3) are NOT part
// of the "thinking" and are never stripped: they enforce on every block save,
// compile and dispatch, in both operational modes.
// ============================================================================

export type LogicStage = 'PARSE' | 'PLAN' | 'EXECUTE' | 'VERIFY';

export const LOGIC_STAGES: LogicStage[] = ['PARSE', 'PLAN', 'EXECUTE', 'VERIFY'];

export interface LogicBlock {
  id: string;
  stage: LogicStage;
  title: string;
  /** Directive text executed verbatim by the blank engine (EMIT:/FILE: verbs). */
  body: string;
  enabled: boolean;
}

export type AppMode = 'CODE' | 'BRAIN';

const STORAGE_KEY = 'aeg**_v1';
const MODE_KEY = '***';

export const MAX_BLOCKS = 24;
export const MAX_BLOCK_CHARS = 4000;
export const MAX_TITLE_CHARS = 80;

// ──────────────────────────────────────────────────────────────────────────
// THE MASTER ALGORITHM & LOGIC HUB — the operator's standing ruleset.
// These blocks ARE the engine's intelligence: fixed, internal, deterministic.
// External AI model presets stay stripped (posture BLANK_EXECUTOR on every
// profile): the hub never borrows reasoning from a vendor persona. On first
// boot the hub seeds these rules and the engine is ARMED by default; clearing
// every block returns it to BLANK standby — the operator always owns the brain.
// ──────────────────────────────────────────────────────────────────────────

export const RULE_ABSOLUTE_AUTONOMY =
  'RULE 1 · ABSOLUTE AUTONOMY & REASONING — Parse every prompt line-by-line ' +
  'before touching code. Build the mental picture (file links, dependency ' +
  'graph, execution impact). Self-evaluate your own output token pass by token ' +
  'pass: intercept duplicate logic, syntax clashes and scope drift, edit and ' +
  'REWRITE behind the scenes, then present only the corrected result.';

export const RULE_SECURE_LOCAL_WORKSPACE =
  'RULE 2 · SECURE LOCAL WORKSPACE (ZERO-SERVER PRIVACY) — Never persist any ' +
  'prompt, code, or context to an external server. Session history, advisories, ' +
  'rewrites and run records live only in the machine-local Logic Hub vault on ' +
  'this device.';

export const RULE_PROACTIVE_SAFEGUARDS =
  'RULE 3 · PROACTIVE DEVELOPER SAFEGUARDS — Address the operator with respect. ' +
  'When a request risks a future vulnerability or architectural bug, stage a ' +
  'proactive alert with a concrete alternative before executing. If the operator ' +
  'insists on their original wording, execute it directly — EXCEPT security ' +
  'denials from the KALI/SHELL/TERMINAL layers, which are never advisory.';

export const RULE_AUTO_INTELLECT =
  'RULE 4 · AUTOMATIC INTELLECTUAL CAPABILITIES — Recognize the host IDE family ' +
  '(VS Code, VSCodium, VS Community, VS Dev) from workspace signals. Isolate ' +
  'duplicate code, syntax errors and injection attempts on every pass. Stay ' +
  'airgapped by default: the ephemeral gateway opens ONLY for a required user ' +
  'utility (web asset, git, deploy push), consumes a single use, and closes.';

export const RULE_TWO_MODE_COMPLIANCE =
  'RULE 5 · TWO-MODE UI COMPLIANCE — CODE MODE: fast line-by-line file parsing, ' +
  'local sandbox testing, seamless execution handoffs. BRAIN MODE: expert ' +
  'architectural guide — interview the operator step-by-step, fold raw concepts ' +
  'and notes into rigorous PARSE→PLAN→EXECUTE→VERIFY blocks, chronologically, ' +
  'until the final system architecture is complete.';

export const DEFAULT_MASTER_BLOCKS: LogicBlock[] = [
  {
    id: 'hub-rule-1',
    stage: 'PARSE',
    title: 'Line-by-line autonomy (Rule 1)',
    body:
      'EMIT:\n' +
      RULE_ABSOLUTE_AUTONOMY +
      '\nEngine note: the pre-generation mental map and the self-evaluation/rewrite loop are executed by the Logic Hub itself on every Code Mode pass — the model receives only the corrected, scoped directive.',
    enabled: true,
  },
  {
    id: 'hub-rule-2',
    stage: 'PLAN',
    title: 'Local-only persistence (Rule 2)',
    body:
      RULE_SECURE_LOCAL_WORKSPACE +
      '\nDirective: all session history, execution records and rewrite journals go to the Logic Hub vault (this device only). Any output that proposes cloud-side storage of user context is a rule violation.',
    enabled: true,
  },
  {
    id: 'hub-rule-3',
    stage: 'PLAN',
    title: 'Proactive safeguards (Rule 3)',
    body:
      RULE_PROACTIVE_SAFEGUARDS +
      '\nDirective: advisory findings surface as "Boss, I can build it your way..." with a clickable alternative and an insist-to-execute path. CRITICAL security verdicts bypass advisory entirely and stay denied.',
    enabled: true,
  },
  {
    id: 'hub-rule-4',
    stage: 'EXECUTE',
    title: 'Universal IDE & gateway discipline (Rule 4)',
    body:
      RULE_AUTO_INTELLECT +
      '\nDirective: code output must be duplicate-free and syntax-balanced; network calls only under a one-shot gateway ticket issued by the hub.',
    enabled: true,
  },
  {
    id: 'hub-rule-5',
    stage: 'VERIFY',
    title: 'Two-mode compliance (Rule 5)',
    body:
      RULE_TWO_MODE_COMPLIANCE +
      '\nDirective: every delivered block must show its self-evaluation result — CLEAN, or REWRITTEN with the fix log visible in the run record.',
    enabled: true,
  },
];

export const STANDBY_NOTICE = [
  '### [ENGINE STATE: BLANK // AWAITING MASTER ALGORITHM]',
  'The intelligence engine is disarmed: model personas, default reasoning',
  'presets and autonomous intent loops have been stripped from all four',
  'Mistral profiles. Nothing synthesized a reply — a blank engine produces',
  'no output without a directive.',
  '',
  'Open **BRAIN MODE** and commit logic blocks (PARSE → PLAN → EXECUTE →',
  'VERIFY). Only your master algorithm dictates how prompts are parsed and',
  'tasks are executed. KALI / SHELL / TERMINAL layers continue to enforce',
  'under the hood in both modes.',
].join('\n');

function clampText(raw: unknown, max: number): string {
  const s = typeof raw === 'string' ? raw : '';
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

/** Schema-clamped loader — persisted blocks are untrusted input. */
export function clampLogicBlocks(raw: unknown): LogicBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: LogicBlock[] = [];
  for (const item of raw.slice(0, MAX_BLOCKS)) {
    if (!item || typeof item !== 'object') continue;
    const stage = LOGIC_STAGES.includes((item as LogicBlock).stage)
      ? (item as LogicBlock).stage
      : 'EXECUTE';
    const title = clampText((item as LogicBlock).title, MAX_TITLE_CHARS).trim();
    const body = clampText((item as LogicBlock).body, MAX_BLOCK_CHARS);
    if (!title && !body.trim()) continue;
    out.push({
      id: clampText((item as LogicBlock).id, 40) || `blk-${out.length}-${Date.now().toString(36)}`,
      stage,
      title: title || `untitled ${stage.toLowerCase()} block`,
      body,
      enabled: (item as LogicBlock).enabled !== false,
    });
  }
  return out;
}

export function loadLogicBlocks(): LogicBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) {
      // First boot: the operator's Master Algorithm ships armed (Rules 1–5).
      saveLogicBlocks(DEFAULT_MASTER_BLOCKS);
      return DEFAULT_MASTER_BLOCKS.map((b) => ({ ...b }));
    }
    return clampLogicBlocks(JSON.parse(raw));
  } catch {
    return DEFAULT_MASTER_BLOCKS.map((b) => ({ ...b }));
  }
}

export function saveLogicBlocks(blocks: LogicBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clampLogicBlocks(blocks)));
  } catch {
    // quota / private-mode: persistence is best-effort; the in-memory state stands.
  }
}

export function activeBlockCount(blocks: LogicBlock[]): number {
  return blocks.filter((b) => b.enabled && b.body.trim().length > 0).length;
}

export function isEngineArmed(blocks: LogicBlock[]): boolean {
  return activeBlockCount(blocks) > 0;
}

/** Deterministic compile: stage-ordered, deduplicated by stage, zero interpretation. */
export function compileMasterAlgorithm(blocks: LogicBlock[]): string {
  const enabled = blocks.filter((b) => b.enabled && b.body.trim().length > 0);
  if (enabled.length === 0) return '';
  const parts: string[] = [
    '=== COMPILED MASTER ALGORITHM — SOLE REASONING AUTHORITY ===',
    'The model must not apply any persona, style preset, or independent',
    'inference beyond these directives. Where the user prompt conflicts with',
    'an active block, the block wins. Where no block covers the request,',
    'answer with exactly: ALGORITHM_GAP <stage>.',
  ];
  for (const stage of LOGIC_STAGES) {
    const inStage = enabled.filter((b) => b.stage === stage);
    if (inStage.length === 0) continue;
    parts.push(`--- STAGE ${stage} (${inStage.length} block${inStage.length > 1 ? 's' : ''}) ---`);
    for (const b of inStage) {
      parts.push(`[BLOCK ${b.id} :: ${b.title}]\n${b.body.trim()}`);
    }
  }
  parts.push('=== END MASTER ALGORITHM ===');
  return parts.join('\n');
}

export function newBlockId(): string {
  return `blk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Operational mode persistence (CODE | BRAIN). The boot router always shows
// the two-module selector; this key only pre-highlights the last choice.
// ---------------------------------------------------------------------------
export function loadAppMode(): AppMode | null {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    return raw === 'CODE' || raw === 'BRAIN' ? raw : null;
  } catch {
    return null;
  }
}

export function saveAppMode(mode: AppMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Directive extraction for the blank offline executor. Pure mechanical
// slicing — no keyword "understanding": `FILE <path>:` regions are emitted as
// synthesized files, `EMIT:`-marked or plain bodies are passed through verbatim.
// ---------------------------------------------------------------------------
export interface CompiledDirective {
  blockId: string;
  stage: LogicStage;
  title: string;
  /** Text to show the operator (body with FILE regions removed). */
  emit: string;
  /** Literal file requested by a `FILE <path>:` directive (gated by the caller). */
  file?: { path: string; content: string };
}

const FILE_DIRECTIVE = /^FILE\s+([A-Za-z0-9_./-]{1,120}):\s*$/;

export function compileDirectives(blocks: LogicBlock[]): CompiledDirective[] {
  const out: CompiledDirective[] = [];
  const enabled = blocks.filter((b) => b.enabled && b.body.trim().length > 0);
  for (const b of enabled) {
    const lines = b.body.split('\n');
    const emitLines: string[] = [];
    let file: CompiledDirective['file'];
    let mode: 'emit' | `file` = 'emit';
    let fileLines: string[] = [];
    let filePath = '';
    for (const line of lines) {
      const m = FILE_DIRECTIVE.exec(line.trim());
      if (m) {
        if (mode === 'file' && filePath) {
          emitLines.push(`(nested FILE directive ignored while ${filePath} open)`);
        }
        if (filePath) {
          file = { path: filePath, content: fileLines.join('\n').trimEnd() };
        }
        filePath = m[1];
        fileLines = [];
        mode = 'file';
        continue;
      }
      if (mode === 'file') fileLines.push(line);
      else emitLines.push(line);
    }
    if (filePath && !file) {
      file = { path: filePath, content: fileLines.join('\n').trimEnd() };
    }
    let emit = emitLines.join('\n').replace(/^EMIT:\s*\n?/, '').trim();
    if (file) emit = (emit ? emit + '\n\n' : '') + `FILE directive honored → \`${file.path}\` (${file.content.length} chars, staged behind L1/L2 gates).`;
    out.push({ blockId: b.id, stage: b.stage, title: b.title, emit: emit || '(empty emit region)', file });
  }
  return out;
}

// ============================================================================
// PHASE 2 — IN-DEPTH ACTION LOGIC (wired into Code Mode execution)
// ----------------------------------------------------------------------------
// Deterministic hub machinery, not model reasoning: the mental map, the
// mandatory self-evaluation & rewrite loop, environment recognition, the
// advisory channel, the machine-local vault and the ephemeral gateway ticket.
// Everything here is pure/serializable — no eval, no timers, no DOM.
// ============================================================================

export type HubIntent =
  | 'BUILD'
  | 'FIX'
  | 'REFACTOR'
  | 'AUDIT'
  | 'PLAN'
  | 'VERIFY'
  | 'NETWORK_UTILITY'
  | 'GIT'
  | 'DEPLOY'
  | 'NOTES';

export interface MentalMapLine {
  n: number;
  text: string;
  /** Workspace files referenced by this line. */
  refs: string[];
  intents: HubIntent[];
}

export interface FileDependency {
  path: string;
  imports: string[];
  exports: string[];
  runnable: boolean;
}

export interface MentalMap {
  lines: MentalMapLine[];
  fileLinks: string[];
  unknownLinks: string[];
  dependencies: FileDependency[];
  impact: {
    filesTouched: string[];
    transitive: string[];
    runsCode: boolean;
    notes: string[];
  };
  intents: HubIntent[];
  summary: string;
}

const INTENT_PATTERNS: Array<[HubIntent, RegExp]> = [
  ['BUILD', /\b(?:build|create|write|generate|implement|scaffold)\b/i],
  ['FIX', /\b(?:fix|repair|heal|patch|debug|resolve)\b/i],
  ['REFACTOR', /\b(?:refactor|restructure|rename|extract|modulari[sz]e)\b/i],
  ['AUDIT', /\b(?:audit|scan|recon|threat|vulnerab|security)\b/i],
  ['PLAN', /\b(?:plan|architect|design|map|structure|scaffold layers)\b/i],
  ['VERIFY', /\b(?:verify|test|check|validate|review)\b/i],
  ['GIT', /\b(?:git clone|git push|git pull|commit to git|repository)\b/i],
  ['DEPLOY', /\b(?:deploy|publish|push to cloud|hosting|release)\b/i],
  ['NETWORK_UTILITY', /\b(?:fetch|download|pull|asset|cdn|url|http)\b|https?:\/\//i],
  ['NOTES', /\b(?:notes|concept|idea|brainstorm|raw)\b/i],
];

function extractFileRefs(line: string, knownPaths: string[]): string[] {
  const refs = new Set<string>();
  const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const before = "(?:^|[\\s\"'(=])";
  const after = "(?:$|[\\s\"'),.;:])";
  for (const p of knownPaths) {
    const base = p.split('/').pop() ?? p;
    const known = new RegExp(before + escapeRe(p) + after);
    const byBase = new RegExp(before + escapeRe(base) + after);
    if (line.includes(p) || known.test(line) || byBase.test(line)) refs.add(p);
  }
  // Any path-shaped token, known or not — unknowns become SCOPE-GAP candidates.
  const shaped = /[\w./-]+\.(?:ts|tsx|js|jsx|json|md|css|html|py)\b/g;
  for (const m of line.matchAll(shaped)) {
    const token = m[0].replace(/^\.?\//, '');
    const hit = [...refs].find((r) => r === token || r.endsWith('/' + token));
    refs.add(hit ?? m[0]);
  }
  return [...refs];
}

function scanFileShape(path: string, content: string): FileDependency {
  const imports: string[] = [];
  for (const m of content.matchAll(/(?:import\s[^'"]*from|require\()\s*['"]([^'"]+)['"]/g)) {
    imports.push(m[1]);
  }
  const exports: string[] = [];
  for (const m of content.matchAll(/export\s+(?:const|function|class|interface|type)\s+([A-Za-z_$][\w$]*)/g)) {
    exports.push(m[1]);
  }
  return {
    path,
    imports,
    exports,
    runnable: /(?:^|\n)\s*(?:function|const)\s+(?:main|runTask)\b/.test(content),
  };
}

/**
 * RULE 1 core: the pre-generation cycle. Prompt is mapped line-by-line
 * against the workspace before any code is drafted — links, dependency
 * graph, transitive impact, and the intents the rewrite loop must honor.
 */
export function buildMentalMap(
  prompt: string,
  files: Array<{ path: string; content: string }>,
  activePath?: string,
): MentalMap {
  const knownPaths = files.map((f) => f.path);
  const rawLines = prompt.split(/\r?\n/);
  const lines: MentalMapLine[] = [];
  const fileLinks = new Set<string>();
  const intents = new Set<HubIntent>();

  rawLines.forEach((text, i) => {
    if (!text.trim()) return;
    const refs = extractFileRefs(text, knownPaths);
    refs.forEach((r) => fileLinks.add(r));
    const lineIntents = INTENT_PATTERNS.filter(([, re]) => re.test(text)).map(([k]) => k);
    lineIntents.forEach((k) => intents.add(k));
    lines.push({ n: i + 1, text: text.trim().slice(0, 400), refs: refs, intents: lineIntents });
  });

  const dependencies = files.map((f) => scanFileShape(f.path, f.content));
  const known = [...knownPaths];
  const unknownLinks = [...fileLinks].filter(
    (l) =>
      !known.includes(l) &&
      !known.some((k) => k.endsWith(`/${l}`)) &&
      !l.startsWith('node:') &&
      !l.startsWith('http') &&
      !l.includes('//')
  );

  const touched = new Set<string>();
  for (const link of fileLinks) {
    const resolved = knownPaths.find((k) => k === link || k.endsWith(`/${link}`));
    if (resolved) touched.add(resolved);
  }
  if (touched.size === 0 && activePath) touched.add(activePath);

  // Transitive impact: files that import a touched file inherit test surface.
  const transitive = new Set<string>();
  for (const dep of dependencies) {
    if (touched.has(dep.path)) continue;
    const pullsTouched = dep.imports.some((imp) =>
      [...touched].some((t) => imp === t || imp.endsWith(`/${t.split('/').pop()}`) || t.endsWith(`/${imp.split('/').pop()}`))
    );
    if (pullsTouched) transitive.add(dep.path);
  }

  const runsCode = [...touched].some(
    (t) => dependencies.find((d) => d.path === t)?.runnable
  );

  const notes: string[] = [];
  if (unknownLinks.length) notes.push(`Unresolved references (will be SCOPE-GAP checked in output): ${unknownLinks.join(', ')}`);
  if (transitive.size) notes.push(`Transitive consumers must be re-verified: ${[...transitive].join(', ')}`);
  if (runsCode) notes.push('Touched files are runnable — sandbox execution impact applies (L3 permit path).');

  return {
    lines,
    fileLinks: [...fileLinks],
    unknownLinks,
    dependencies,
    impact: { filesTouched: [...touched], transitive: [...transitive], runsCode, notes },
    intents: [...intents],
    summary: `${lines.length} line(s) · ${fileLinks.size} file link(s) · intents ${intents.size ? [...intents].join('+') : 'DISCUSSION'} · touches ${touched.size || 'active'} file(s)`,
  };
}

// ── MANDATORY SELF-EVALUATION & REWRITE LOOP ───────────────────────────────

export interface SelfEvalFix {
  check: 'FENCE_BALANCE' | 'BRACE_BALANCE' | 'DUPLICATE_BLOCK' | 'PUNCTUATION_CLASH' | 'SCOPE_ALIGN' | 'EMPTY_REGION';
  note: string;
}

export interface SelfEvalResult {
  text: string;
  fixes: SelfEvalFix[];
  rewrote: boolean;
  passes: number;
}

interface DupWindow {
  key: string;
  start: number;
  lines: string[];
}

function extractCodeWindows(text: string): DupWindow[] {
  const raw = text.split('\n');
  const norm = (l: string) => l.trim().replace(/[ \t]+/g, ' ');
  const codeIdx = raw
    .map((l, i) => ({ n: norm(l), i }))
    .filter((x) => x.n.length > 0 && !x.n.startsWith('#') && !x.n.startsWith('//'));
  const windows: DupWindow[] = [];
  for (let i = 0; i + 4 <= codeIdx.length; i++) {
    const seg = codeIdx.slice(i, i + 4);
    windows.push({ key: seg.map((sq) => sq.n).join('\n'), start: seg[0].i, lines: raw.slice(seg[0].i, seg[0].i + 4) });
  }
  return windows;
}

function balanceBraces(block: string): { text: string; fixed: boolean } {
  const pairs: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
  const openers = new Set(['{', '(', '[']);
  const stack: string[] = [];
  let inStr: string | null = null;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && block[i + 1] === '/') { i = block.indexOf('\n', i); if (i < 0) break; continue; }
    if (openers.has(ch)) stack.push(ch);
    else if (pairs[ch]) {
      if (stack[stack.length - 1] === pairs[ch]) stack.pop();
      else return { text: block, fixed: false }; // mismatched: refuse to auto-mutilate
    }
  }
  if (stack.length === 0) return { text: block, fixed: false };
  // append the closers the author left off, in correct order
  let out = block.replace(/\s+$/, '');
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === '{' ? '\n}' : stack[i] === '(' ? ')' : ']';
  }
  return { text: out, fixed: true };
}

/**
 * RULE 1 rewrite loop + RULE 4 isolation pass. The hub reads its own draft
 * token pass by token pass: fence residue, unbalanced structure, duplicated
 * logic windows, punctuation clashes and prompt-scope drift are intercepted,
 * edited and REWRITTEN before the operator ever sees the block. Max 2 passes
 * — convergent by construction (each pass only removes defects, adds nothing).
 */
export function selfCorrectOutput(
  draft: string,
  ctx: { mentalMap?: MentalMap } = {},
): SelfEvalResult {
  const fixes: SelfEvalFix[] = [];
  let text = draft;

  for (let pass = 1; pass <= 2; pass++) {
    let changedThisPass = false;

    // 1 · fence balance: an odd ``` count in the draft would leak renderer
    //     structure into the workspace view — drop the dangling marker.
    const fences = text.match(/```/g)?.length ?? 0;
    if (fences > 0 && fences % 2 === 1) {
      // Close the dangling region rather than deleting content: append the
      // missing marker so the workspace view never inherits broken renderer
      // structure. Trailing prose after the last marker stays where it is.
      text = text.trimEnd() + '\n```';
      fixes.push({ check: 'FENCE_BALANCE', note: 'odd fence count — region closed with a trailing marker' });
      changedThisPass = true;
    }

    // 2 · brace/paren balance inside every fenced code region.
    const regionRe = /```[a-zA-Z]*\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    let patched = '';
    let cursor = 0;
    while ((m = regionRe.exec(text)) !== null) {
      const { text: balanced, fixed } = balanceBraces(m[1]);
      if (fixed) {
        patched += text.slice(cursor, m.index) + '```\n' + balanced + '\n```';
        cursor = m.index + m[0].length;
        fixes.push({ check: 'BRACE_BALANCE', note: `auto-closed missing brace(s) in fenced region @${m.index}` });
        changedThisPass = true;
      }
    }
    if (cursor > 0) text = patched + text.slice(cursor);
    // un-fenced tail (whole draft is code) also gets balanced when it looks like code
    if (/^\s*(?:import|export|function|const|class)\b/m.test(text) && !/```/.test(text)) {
      const { text: balanced, fixed } = balanceBraces(text);
      if (fixed) {
        text = balanced;
        fixes.push({ check: 'BRACE_BALANCE', note: 'auto-closed missing brace(s) in raw code draft' });
        changedThisPass = true;
      }
    }

    // 3 · duplicate isolation: a repeated 4-line logic window (RULE 4).
    // Windows are line-indexed, so the SECOND occurrence is struck from the
    // draft verbatim; near-matches (>=3 of 4 normalized lines equal) are only
    // flagged for the operator, never silently rewritten.
    const windows = extractCodeWindows(text);
    const seenKeys = new Map<string, number>();
    let strike: { at: number; note: string } | null = null;
    let flag: string | null = null;
    for (let i = 0; i < windows.length; i++) {
      const prev = seenKeys.get(windows[i].key);
      if (prev === undefined) {
        seenKeys.set(windows[i].key, i);
        continue;
      }
      if (i - prev < 4) continue; // adjacent repetition is intentional in some templates
      strike = { at: windows[i].start, note: `repeated logic window @line ${windows[i].start + 1} struck (first kept @${windows[prev].start + 1})` };
      break;
    }
    if (!strike) {
      outer: for (let i = 4; i < windows.length; i++) {
        for (let j = 0; j < i - 4; j++) {
          const a = windows[i].lines.map((l) => l.trim().replace(/[ \t]+/g, ' '));
          const b = windows[j].lines.map((l) => l.trim().replace(/[ \t]+/g, ' '));
          const same = a.filter((line, k) => line === b[k]).length;
          if (same >= 3 && same < 4) {
            flag = `near-duplicate logic near line ${windows[i].start + 1} (kept, flagged for review)`;
            break outer;
          }
        }
      }
    }
    if (strike) {
      const lines = text.split('\n');
      lines.splice(strike.at, 4, '/* [HUB] duplicate logic block isolated by self-evaluation (first definition kept) */');
      text = lines.join('\n');
      fixes.push({ check: 'DUPLICATE_BLOCK', note: strike.note });
      changedThisPass = true;
    }
    if (flag) {
      fixes.push({ check: 'DUPLICATE_BLOCK', note: flag });
    }

    // 4 · punctuation clashes: doubled semicolons, comma-before-brace, stray backticks
    const cleaned = text
      .replace(/;;+/g, ';')
      .replace(/,\s*([)}\]])/g, '$1');
    if (cleaned !== text) {
      text = cleaned;
      fixes.push({ check: 'PUNCTUATION_CLASH', note: 'normalized doubled semicolons and trailing-commas before closers' });
      changedThisPass = true;
    }

    if (!changedThisPass) return finalize(text, fixes, ctx, pass);
  }
  return finalize(text, fixes, ctx, 2);
}

function finalize(
  text: string,
  fixes: SelfEvalFix[],
  ctx: { mentalMap?: MentalMap },
  passes: number,
): SelfEvalResult {
  const alreadyAnnotated = text.includes('_SELF-EVAL') || text.includes('SCOPE-GAP');
  if (alreadyAnnotated) {
    return { text, fixes, rewrote: fixes.length > 0, passes };
  }

  // 5 · scope alignment: if the mental map named workspace targets and the
  //     draft never mentions any of them, the output drifted from the prompt.
  let out = text;
  const map = ctx.mentalMap;
  if (map && map.fileLinks.length > 0) {
    const covers = map.fileLinks.filter((f) => text.includes(f) || text.includes(f.split('/').pop() ?? f));
    if (covers.length === 0 && /\b(?:build|fix|refactor|patch|heal|implement)\b/i.test(map.lines.map((l) => l.text).join(' '))) {
      out = `> ⚠ SCOPE-GAP — Boss, the draft touched none of the mapped targets (${map.fileLinks.join(', ')}). Marking for operator review rather than silently proceeding.\n\n${text}`;
      fixes.push({ check: 'SCOPE_ALIGN', note: `draft drifted from mapped targets: ${map.fileLinks.join(', ')}` });
    }
  }
  if (fixes.length > 0) {
    const log = fixes.map((f) => `${f.check}: ${f.note}`).join(' · ');
    out = `${out}\n\n---\n_SELF-EVAL ${fixes.length} fix(es) applied pre-presentation (pass ${passes}): ${log}_`;
  }
  return { text: out, fixes, rewrote: fixes.length > 0, passes };
}

/**
 * RULE 4 isolation pass over executable content itself — used before any code
 * reaches the workspace editor or a generated file. Duplicate top-level
 * declarations and unbalanced structure are corrected here; a block that the
 * loop cannot repair cleanly is reported unsafe so the caller refuses the write
 * (fail closed) rather than shipping broken code to the user.
 */
export interface CodeCorrectionResult {
  code: string;
  fixes: string[];
  /** Structural damage the hub would not guess at — caller must reject. */
  unrecoverable: string | null;
}

function stripCodeNoise(code: string): string {
  return code
    .replace(/^[ \t]*```[a-zA-Z]*[ \t]*$/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/;;+/g, ';')
    .replace(/,[ \t]*\r?\n[ \t]*([)}\]])/g, '$1\n$2');
}

function scanBalance(code: string): { openers: number; mismatch: boolean } {
  const pairs: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
  const openers = new Set(['{', '(', '[']);
  const stack: string[] = [];
  let inStr: string | null = null;
  let mismatch = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && code[i + 1] === '/') { const nl = code.indexOf('\n', i); i = nl < 0 ? code.length : nl; continue; }
    if (ch === '/' && code[i + 1] === '*') { const e = code.indexOf('*/', i); i = e < 0 ? code.length : e + 1; continue; }
    if (openers.has(ch)) stack.push(ch);
    else if (pairs[ch]) {
      if (stack[stack.length - 1] === pairs[ch]) stack.pop();
      else mismatch = true;
    }
  }
  return { openers: stack.length, mismatch };
}

export function selfCorrectCode(code: string): CodeCorrectionResult {
  const fixes: string[] = [];
  let out = code;

  const noiseless = stripCodeNoise(out);
  if (noiseless !== out) {
    out = noiseless;
    fixes.push('stripped markdown residue and normalized punctuation clashes');
  }

  // duplicate top-level function declarations: keep the LAST (healed) definition
  const dupNames = new Set<string>();
  const declRe = /^(?:export\s+)?function\s+([A-Za-z_$][\w$]*)/gm;
  const seenDecl = new Map<string, number>();
  for (const m of out.matchAll(declRe)) {
    seenDecl.set(m[1], (seenDecl.get(m[1]) ?? 0) + 1);
  }
  for (const [name, count] of seenDecl) if (count > 1) dupNames.add(name);

  if (dupNames.size > 0) {
    const lines = out.split('\n');
    for (const name of dupNames) {
      // collect ranges of each declaration: from its line to the next top-level decl
      const starts: number[] = [];
      lines.forEach((l, i) => {
        if (new RegExp('^(?:export\\s+)?function\\s+' + name + '\\b').test(l.trim()) || new RegExp('^(?:export\\s+)?function\\s+' + name + '\\b').test(l)) starts.push(i);
      });
      for (const sIdx of starts.slice(0, -1)) {
        let end = lines.length;
        for (let i = sIdx + 1; i < lines.length; i++) {
          if (/^(?:export\s+)?(?:function|const|class|interface|type)\b/.test(lines[i]) || lines[i].trim() === '}') {
            if (lines[i].trim() === '}' && i < end) continue;
            end = i;
            break;
          }
        }
        lines.splice(sIdx, end - sIdx, `/* [HUB] duplicate declaration of ${name} isolated (last definition kept) */`);
        fixes.push(`duplicate function ${name}() isolated`);
      }
    }
    out = lines.join('\n');
  }

  // structural verdict on the corrected result
  const balance = scanBalance(out);
  if (balance.mismatch) {
    return { code: out, fixes, unrecoverable: 'bracket mismatch detected after normalization' };
  }
  if (balance.openers > 0) {
    let closed = out.replace(/\s+$/, '');
    for (let i = 0; i < balance.openers; i++) closed += '\n}';
    out = closed;
    fixes.push(`auto-closed ${balance.openers} unterminated block(s)`);
    if (scanBalance(out).openers > 0) {
      return { code: out, fixes, unrecoverable: 'structure still unbalanced after auto-close' };
    }
  }

  return { code: out, fixes, unrecoverable: null };
}

// ── RULE 4 · ENVIRONMENT RECOGNITION ────────────────────────────────────────

export interface IdeEnvironment {
  flavor: 'VS Code' | 'VSCodium' | 'VS Community' | 'VS Dev' | 'Plain Browser';
  signals: string[];
}

export function detectIdeEnv(files?: Array<{ path: string; content?: string }>): IdeEnvironment {
  const signals: string[] = [];
  const ua = typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string' ? navigator.userAgent : '';
  const w = globalThis as { vscode?: unknown; __vscodeApi?: unknown };
  if (/vscode/i.test(ua)) signals.push('userAgent:vscode');
  if (w.vscode || w.__vscodeApi) signals.push('host:extension-api');
  for (const f of files ?? []) {
    if (f.path.includes('.vscode/')) signals.push(`marker:${f.path}`);
    if (f.path.endsWith('.code-workspace')) signals.push(`marker:${f.path}`);
    if (f.path.includes('vscodium') || /vscodium/i.test(f.content ?? '')) signals.push('marker:vscodium');
    if (/Visual Studio Community/i.test(f.content ?? '')) signals.push('marker:vs-community');
    if (/Visual Studio.*Preview|Insiders/i.test(f.content ?? '')) signals.push('marker:vs-dev');
  }
  const join = signals.join(' ');
  const flavor: IdeEnvironment['flavor'] = /vscodium/i.test(join)
    ? 'VSCodium'
    : /vs-community/i.test(join)
    ? 'VS Community'
    : /vs-dev|insiders/i.test(join)
    ? 'VS Dev'
    : /vscode|extension-api|\.code-workspace/.test(join)
    ? 'VS Code'
    : 'Plain Browser';
  return { flavor, signals };
}

// ── RULE 3 · PROACTIVE SAFEGUARDS (advisory channel — never security) ───────

export interface AdvisoryFinding {
  id: string;
  label: string;
  concern: string;
  alternative: string;
}

const ADVISORY_PATTERNS: Array<[AdvisoryFinding['id'], RegExp, string, string, string]> = [
  ['ADV-SQL-CONCAT', /(?:select|insert|update|delete)\s+[^;]*\+\s*(?:req\.|input|user|params)/i,
    'String-concatenated SQL', 'Injection-prone query built by concatenation.', 'Parameterized statements (placeholders), so values never parse as SQL.'],
  ['ADV-EVAL-USE', /\beval\s*\(|new\s+Function\s*\(/,
    'Dynamic code evaluation', 'eval / new Function widens the attack surface and blocks static analysis.', 'Precompiled handler map or JSON.parse with schema clamping.'],
  ['ADV-INNERHTML', /\.innerHTML\s*=/,
    'Raw innerHTML assignment', 'Unescaped markup injection route into the DOM.', 'textContent or an allowlisted sanitizer before insertion.'],
  ['ADV-LOCALSTORAGE-SECRET', /localStorage\.[A-Za-z]+Item\s*\(\s*['"][^'"]*(?:token|secret|apikey|api_key|password)/i,
    'Secret in web storage', 'Bearer material sitting readable to any injected script on origin.', 'Keep secrets in the kernel config only; store a non-sensitive display hint instead.'],
  ['ADV-HTTP-PLAIN', /\bhttp:\/\/(?!localhost|127\.0\.0\.1)/i,
    'Plaintext http endpoint', 'Credentials or payloads crossing an unencrypted link.', 'https-only targets (the egress pin already enforces this).'],
  ['ADV-UNBOUNDED-WHILE', /while\s*\(\s*(?:true|1)\s*\)(?![\s\S]{0,80}\bbreak\b)/,
    'Unbounded loop', 'Hangs the enclave tab and starves the audit writer.', 'Loop with explicit iteration cap and yield point.'],
  ['ADV-IGNORES-GUARDRAIL-PROSE', /\bignore (?:all |the )?(?:previous |prior )?(?:rules|instructions)\b/i,
    'Guardrail-override phrasing', 'Harmless in prose today; becomes an attack template if echoed into generated docs.', 'Name the target policy explicitly instead of an override idiom.'],
];

/**
 * Advisory triage for the prompt/answer surface. CRITICAL security findings
 * never appear here — those were already denied by the shield upstream and
 * are NOT overridable. What lands here is future-bug / vulnerability-smell
 * guidance that deserves a professional heads-up plus an insist path.
 */
export function advisoryForPrompt(
  prompt: string,
  extra: { criticalRuleIds?: string[] } = {},
): { findings: AdvisoryFinding[]; message: string } {
  void extra; // criticals are enforced upstream; intentionally not advisory-izable
  const findings: AdvisoryFinding[] = [];
  for (const [id, re, label, concern, alternative] of ADVISORY_PATTERNS) {
    if (re.test(prompt)) {
      findings.push({ id, label, concern, alternative });
    }
  }
  if (findings.length === 0) return { findings: [], message: '' };
  const f = findings[0];
  const message = [
    `Boss, I can build it your way — but ${f.label.toLowerCase()} might cause an issue down the road.`,
    `> ${f.concern}`,
    `**Alternative:** ${f.alternative}`,
    findings.length > 1 ? `(+${findings.length - 1} more flag(s) on this request)` : '',
    'If you like the alternative, click **Adopt alternative**. If you insist on the original, click **Execute it my way** and I will run it exactly as asked.',
  ].filter(Boolean).join('\n\n');
  return { findings, message };
}

// ── RULE 2 · MACHINE-LOCAL VAULT (zero-server privacy) ──────────────────────

export type VaultKind = 'PROMPT' | 'ADVISORY' | 'ADVISORY_OVERRIDE' | 'REWRITE' | 'GATEWAY' | 'RUN' | 'COMMIT' | 'ENV';

export interface VaultRecord {
  id: string;
  at: string;
  kind: VaultKind;
  detail: string;
}

const VAULT_PREFIX = 'aeg**;v1';
const VAULT_MAX_RECORDS = 200;
const VAULT_MAX_DETAIL = 400;

function vaultStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Isolated local store. In the packaged desktop shell this lives inside the
 * app's userData folder on this machine; in the browser it is origin-local
 * storage. Either way: nothing leaves the device, nothing is mirrored to any
 * server — that is Rule 2, enforced by construction (there is no write path
 * to anywhere else).
 */
export function appendVaultRecord(kind: VaultKind, detail: string): VaultRecord | null {
  const st = vaultStorage();
  if (!st) return null;
  const rec: VaultRecord = {
    id: `vlt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    at: new Date().toISOString(),
    kind,
    detail: detail.replace(/[\u0000-\u0008]/g, '').slice(0, VAULT_MAX_DETAIL),
  };
  let records = readVaultRecords();
  records.push(rec);
  if (records.length > VAULT_MAX_RECORDS) records = records.slice(-VAULT_MAX_RECORDS);
  try {
    st.setItem(VAULT_PREFIX, JSON.stringify(records));
  } catch {
    return null;
  }
  return rec;
}

export function readVaultRecords(): VaultRecord[] {
  const st = vaultStorage();
  if (!st) return [];
  try {
    const parsed = JSON.parse(st.getItem(VAULT_PREFIX) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-VAULT_MAX_RECORDS).filter((r: VaultRecord) => r && typeof r.detail === 'string' && typeof r.kind === 'string');
  } catch {
    return [];
  }
}

export function clearVault(): void {
  try {
    vaultStorage()?.removeItem(VAULT_PREFIX);
  } catch {
    // local-only best effort
  }
}

// ── RULE 4 · EPHEMERAL GATEWAY TICKET ───────────────────────────────────────

export interface GatewayTicket {
  id: string;
  purpose: string;
  issuedAt: string;
  consumed: boolean;
}

/**
 * The network stays closed by default. A utility run (web asset, git,
 * deploy-push) may borrow the gateway for exactly ONE request: the ticket is
 * single-use, hash-dated, and release() hard-closes regardless of outcome.
 * The pinned egress list still decides WHAT the gateway may reach.
 */
export function issueGatewayTicket(purpose: string): GatewayTicket {
  const t = {
    id: `gw-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    purpose: purpose.slice(0, 120),
    issuedAt: new Date().toISOString(),
    consumed: false,
  };
  appendVaultRecord('GATEWAY', `OPEN one-shot ticket ${t.id} · purpose: ${t.purpose}`);
  return t;
}

export function releaseGatewayTicket(ticket: GatewayTicket): string {
  ticket.consumed = true;
  appendVaultRecord('GATEWAY', `CLOSE ticket ${ticket.id} consumed · gateway returned to AIRGAP`);
  return `gateway closed (ticket ${ticket.id} retired · airgap re-armed)`;
}

// ── BRAIN MODE · GUIDED ARCHITECT INTERVIEW (Rule 5) ────────────────────────

/**
 * Folds raw operator notes into rigorous layer blocks, chronologically:
 * observation verbs → PARSE, obligations → PLAN, action verbs → EXECUTE,
 * QA verbs → VERIFY. Nothing is invented — every block body is the operator's
 * own line, staged.
 */
export function conceptsToBlocks(rawNotes: string): LogicBlock[] {
  const out: LogicBlock[] = [];
  const lines = rawNotes.split(/\r?\n/).map((l) => l.trim().replace(/^[-*•\d.)\s]+/, '')).filter((l) => l.length > 2);
  for (const line of lines.slice(0, 24)) {
    let stage: LogicStage = 'EXECUTE';
    if (/^(?:when|if|parse|read|scan|recogni[sz]e|detect|extract)\b/i.test(line)) stage = 'PARSE';
    else if (/\b(?:must|should|never|always|map|architect|design|structure|plan)\b/i.test(line)) stage = 'PLAN';
    else if (/^(?:test|verify|check|validate|review|audit)\b/i.test(line)) stage = 'VERIFY';
    out.push({
      id: newBlockId(),
      stage,
      title: line.split(/\s+/).slice(0, 5).join(' '),
      body: line.slice(0, MAX_BLOCK_CHARS),
      enabled: true,
    });
  }
  return out;
}

// ── OPERATOR VOICE (Rule 3 tone) ─────────────────────────────────────────────

export function hubVoice(map: MentalMap, env: IdeEnvironment, evalResult: SelfEvalResult): string {
  const state = evalResult.rewrote ? `self-eval rewrote ${evalResult.fixes.length} issue(s) before show` : 'self-eval clean';
  return `> Boss — ${map.summary} · env ${env.flavor} · ${state}.`;
}

// ============================================================================
// PHASE 3 — BRAIN MODE COMPLETE SCAFFOLDING (strict 4-layer pipeline)
// ----------------------------------------------------------------------------
// Deterministic guide flow, driven by the operator's own words at every step:
//   L1 Concept Parsing      raw notes → classified conceptual blueprint
//   L2 Structural Breakdown blueprint → strict core operational modules
//   L3 Logic Injection        per-module constraints, asked chronologically
//   L4 Scaffolding & Lock     synthesized mathematical/logical meta-algorithm
// The engine never jumps ahead: each layer validates against the previous one,
// and only a completed Layer 4 can LOCK & DEPLOY the sovereign template file.
// ============================================================================

export type ConceptKind = 'GOAL' | 'CONSTRAINT' | 'CAPABILITY' | 'DATA' | 'RISK';

export interface BlueprintConcept {
  n: number;
  statement: string;
  kind: ConceptKind;
  keywords: string[];
  included: boolean;
}

export interface ConceptBlueprint {
  concepts: BlueprintConcept[];
  ambiguities: string[];
  summary: string;
}

const KIND_PATTERNS: Array<[ConceptKind, RegExp]> = [
  ['CONSTRAINT', /\b(?:must|never|always|only|forbid|restrict|shall|require[d]?|not allowed)\b/i],
  ['RISK', /\b(?:risk|vulnerab|attack|inject|leak|breach|malware|exfil|abuse|spoof)\b/i],
  ['DATA', /\b(?:data|store|storage|file|database|record|log|vault|persist|state|cache|history)\b/i],
  ['CAPABILITY', /\b(?:pars|scan|detect|generat|compil|render|sync|validat|index|transform|execut|analyz|recogni[sz]e|isolat)\w*/i],
  ['GOAL', /\b(?:build|create|add|implement|support|deliver|achieve|design|construct|set ?up)\b/i],
];

const STOPWORDS = new Set(['with','from','this','that','them','they','your','mine','into','onto','when','then','than','have','has','will','shall','must','need','want','like','just','also','each','all','any','are','was','were','been','being','for','and','not','but','you','our','its','the','a','an','of','to','in','on','at','by','it','is','be','do','so','if','or','as','we','i']);

/** L1 · parse raw notes into a classified, per-line conceptual blueprint. */
export function parseConceptBlueprint(rawNotes: string): ConceptBlueprint {
  const lines = rawNotes
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-*•\d.)\s]+/, ''))
    .filter((l) => l.length > 2);
  const concepts: BlueprintConcept[] = [];
  const ambiguities: string[] = [];

  lines.slice(0, 40).forEach((statement, i) => {
    const kind = KIND_PATTERNS.find(([, re]) => re.test(statement))?.[0] ?? 'GOAL';
    const words = statement
      .toLowerCase()
      .replace(/[^a-z0-9\s.-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const keywords = [...new Set(words)].slice(0, 6);
    concepts.push({ n: i + 1, statement: statement.slice(0, 400), kind, keywords, included: true });
    if (/\b(?:maybe|might|perhaps|TBD|TODO|idk|figure out|somehow|etc\.?)\b/i.test(statement)) {
      ambiguities.push(`Line ${i + 1} is tentative ("${statement.slice(0, 60)}") — confirm or sharpen before Layer 2.`);
    }
    if (words.length < 2) {
      ambiguities.push(`Line ${i + 1} is thin on keywords — add what it operates on.`);
    }
  });
  if (concepts.length < 2) {
    ambiguities.push('Fewer than 2 concepts — the scaffold will be minimal; drop another note if you can, boss.');
  }

  const kinds = concepts.reduce<Record<string, number>>((acc, c) => ((acc[c.kind] = (acc[c.kind] ?? 0) + 1), acc), {});
  const summary = `${concepts.length} concept(s) · ${Object.entries(kinds).map(([k, v]) => `${k}×${v}`).join(' ')}${ambiguities.length ? ` · ${ambiguities.length} ambiguity flag(s)` : ''}`;
  return { concepts, ambiguities, summary };
}

export interface ScaffoldModule {
  id: string;
  name: string;
  responsibility: string;
  inputs: string[];
  outputs: string[];
  dependsOn: string[];
  conceptNs: number[];
}

const MODULE_TAXONOMY: Array<{
  id: string;
  name: string;
  responsibility: string;
  inputs: string[];
  outputs: string[];
  match: RegExp;
  bookend?: 'head' | 'tail';
}> = [
  { id: 'intake', name: 'Intake & Parsing', responsibility: 'Tokenize operator input line-by-line; classify intents; normalize before anything consumes it.', inputs: ['raw operator notes', 'prompt stream'], outputs: ['classified concept set'], match: /\b(?:pars|read|scan|input|tokeni[sz]e|prompt|transcri|intake|recogni[sz]e)\w*/i, bookend: 'head' },
  { id: 'logic', name: 'Logic Core', responsibility: 'Hold the plan: map concepts to decisions, route work, enforce operator constraints.', inputs: ['classified concepts', 'armed constraints'], outputs: ['ordered execution plan'], match: /\b(?:rule|logic|constraint|plan|map|match|score|route|policy|architect|design|orchestrat|decid)\w*/i },
  { id: 'vault', name: 'Local Vault', responsibility: 'Machine-only persistence: session history, records, blueprints. Zero cloud path.', inputs: ['state transitions', 'records'], outputs: ['durable local history'], match: /\b(?:store|persist|vault|history|record|log|file|database|memory|cache|state)\w*/i },
  { id: 'exec', name: 'Execution Engine', responsibility: 'Build/generate/heal under the sandbox realm; never bypasses permits.', inputs: ['ordered plan', 'workspace files'], outputs: ['code artifacts', 'run results'], match: /\b(?:execut|run|build|generat|compil|render|deploy|sandbox|heal|implement|create)\w*/i },
  { id: 'egress', name: 'Egress Gateway', responsibility: 'Airgapped by default; one-shot tickets against the pinned endpoint list only.', inputs: ['utility request', 'ticket'], outputs: ['sanctioned responses'], match: /\b(?:network|gateway|fetch|http|download|upload|git|push|pull|api|web|asset|cloud)\w*/i },
  { id: 'verify', name: 'Verification', responsibility: 'Self-eval every output pre-presentation; re-check invariants; sign the ledger.', inputs: ['artifacts', 'constraint set'], outputs: ['verdict + fix log'], match: /\b(?:test|verif|check|audit|validate|review|scan|guard|assur|eval)\w*/i, bookend: 'tail' },
];

/** L2 · slice the validated blueprint into strict core operational modules. */
export function sliceBlueprintToModules(blueprint: ConceptBlueprint): ScaffoldModule[] {
  const included = blueprint.concepts.filter((c) => c.included);
  const scored = MODULE_TAXONOMY.map((t) => {
    const hits = included.filter((c) => t.match.test(c.statement) || c.keywords.some((k) => t.match.test(k)));
    return { t, hits };
  });
  const active = scored.filter(({ t, hits }) => hits.length > 0 || t.bookend);
  const chosen = active.length > 0 ? active : scored.filter(({ t }) => t.id === 'logic');

  const modules: ScaffoldModule[] = chosen.map(({ t, hits }) => ({
    id: t.id,
    name: t.name,
    responsibility: t.responsibility,
    inputs: [...t.inputs],
    outputs: [...t.outputs],
    dependsOn: [],
    conceptNs: hits.map((h) => h.n),
  }));

  const ids = new Set(modules.map((m) => m.id));
  const order = ['intake', 'logic', 'vault', 'exec', 'egress', 'verify'];
  for (const m of modules) {
    const mi = order.indexOf(m.id);
    const deps: string[] = [];
    if (m.id !== 'intake' && ids.has('intake')) deps.push('intake');
    for (const cand of order) {
      const ci = order.indexOf(cand);
      if (ci < mi && ids.has(cand) && cand !== 'intake' && !deps.includes(cand)) deps.push(cand);
    }
    m.dependsOn = deps;
  }
  return order.filter((id) => ids.has(id)).map((id) => modules.find((m) => m.id === id)!);
}

export type ModuleConstraints = Record<string, { texts: string[]; permissive: boolean }>;

export interface MetaStep {
  order: number;
  stage: LogicStage;
  moduleId: string;
  formal: string;
  constraints: string[];
}

const STAGE_BY_MODULE: Record<string, LogicStage> = {
  intake: 'PARSE',
  logic: 'PLAN',
  vault: 'EXECUTE',
  exec: 'EXECUTE',
  egress: 'EXECUTE',
  verify: 'VERIFY',
};

/** JSON-safe single-line literal for embedding operator text in TS output. */
/**
 * One-line, comment-safe form of a statement: strips every character that
 * could terminate a block comment or open a template literal, so raw operator
 * notes can be echoed into generated headers without corrupting the file.
 */
export function toCommentSafe(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[*\/]/g, '\u00b7')
    .replace(/[`"'`]/g, '\u00b4')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 110);
}

function tsLit(raw: string): string {
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  return JSON.stringify(cleaned);
}

/**
 * L4 · synthesize everything into a solid, deployable meta-algorithm.
 * Formal form per step:  Sₖ = ⟨stage, module | ⋀Cₖ⟩ , ctxₖ₊₁ = Sₖ(ctxₖ)
 * The emitted template is strict TypeScript, sandbox-runnable (runTask hook)
 * and deterministic: identical inputs → byte-identical file.
 */
export function synthesizeMetaAlgorithm(
  blueprint: ConceptBlueprint,
  modules: ScaffoldModule[],
  constraints: ModuleConstraints,
): { steps: MetaStep[]; template: string } {
  const steps: MetaStep[] = modules.map((m, i) => {
    const c = constraints[m.id];
    // A module answered at Layer 3 with no live text (or an explicit skip) is
    // recorded as permissive — never silently constraint-less.
    const texts =
      c === undefined ? [] : c.texts.length > 0 ? c.texts : ['permissive — shield remains authoritative'];
    return {
      order: i + 1,
      stage: STAGE_BY_MODULE[m.id] ?? 'EXECUTE',
      moduleId: m.id,
      formal: `S${i + 1} = \u27e8${STAGE_BY_MODULE[m.id] ?? 'EXECUTE'}(${m.id}) | \u22c0 C_${m.id}[${texts.length}]\u27e9 : ctx${i + 1} = S${i + 1}(ctx${i})`,
      constraints: texts,
    };
  });

  const totalConstraints = steps.reduce((n, s) => n + s.constraints.length, 0);
  // Template grammar is deliberately sandbox-executable: the engine's TS
  // cleaner strips `export interface`/`export type`/`export <decl>` and
  // nothing else — so types live exclusively in interfaces, aliases and
  // JSDoc; no `as const`, no inline annotations, no bare `export { }`.
  // The file is strict-TS in shape, real TypeScript in the editor, and
  // returns SCAFFOLD_ARMED when run through the L3 permit-gated sandbox.
  const L: string[] = [];
  L.push('/**');
  L.push(' * \u2550\u2550\u2550 SOVEREIGN MASTER ALGORITHM TEMPLATE \u2550\u2550\u2550');
  L.push(' * Generated by BRAIN MODE Phase 3 — strict 4-layer chronological scaffold.');
  L.push(` * L1 blueprint: ${blueprint.concepts.filter((c) => c.included).length} concept(s) \u00b7 L2 modules: ${modules.length} \u00b7 L3 constraints: ${totalConstraints} \u00b7 L4: this file.`);
  L.push(' * DO NOT edit by hand — re-deploy from Brain Mode to regenerate (lock + push).');
  L.push(' */');
  L.push('');
  L.push('/** @typedef {\'PARSE\'|\'PLAN\'|\'EXECUTE\'|\'VERIFY\'} SovereignStage */');
  L.push("export type SovereignStage = 'PARSE' | 'PLAN' | 'EXECUTE' | 'VERIFY';");
  L.push('');
  L.push('export interface SovereignModule {');
  L.push('  readonly id: string;');
  L.push('  readonly name: string;');
  L.push('  readonly responsibility: string;');
  L.push('  readonly inputs: readonly string[];');
  L.push('  readonly outputs: readonly string[];');
  L.push('  readonly dependsOn: readonly string[];');
  L.push('}');
  L.push('');
  L.push('export interface SovereignStep {');
  L.push('  readonly order: number;');
  L.push('  readonly stage: SovereignStage;');
  L.push('  readonly moduleId: string;');
  L.push('  readonly formal: string;');
  L.push('  readonly constraints: readonly string[];');
  L.push('}');
  L.push('');
  L.push('/** Provenance of this lock — consumed by the vault and the audit trail. */');
  L.push('');
  L.push('/**');
  L.push(' * \u2550\u2550\u2550 OPERATOR LAYER — raw transcript accepted at INTENT receipt \u2550\u2550\u2550');
  for (const c of blueprint.concepts) {
    const flag = c.included ? '' : ' [excluded from scaffold]';
    L.push(` * ${String(c.n).padStart(2, '0')} [${c.kind}] ${toCommentSafe(c.statement)}${flag}`);
  }
  if (blueprint.ambiguities.length > 0) {
    L.push(' *');
    for (const a of blueprint.ambiguities) L.push(` * NOTE: ${toCommentSafe(a)}`);
  }
  L.push(' * \u2550\u2550\u2550 end operator layer \u2550\u2550\u2550');
  L.push(' */');
  L.push('export const SOVEREIGN_TEMPLATE_META = {');
  L.push("  generatedFrom: 'BRAIN_MODE_PHASE_3',");
  L.push(`  conceptCount: ${blueprint.concepts.filter((c) => c.included).length},`);
  L.push(`  moduleCount: ${modules.length},`);
  L.push(`  constraintCount: ${totalConstraints},`);
  L.push("  path: 'src/workspace/sovereignTemplate.ts',");
  L.push('};');
  L.push('');
  L.push('/** @type {readonly SovereignModule[]} */');
  L.push('export const CORE_MODULES = [');
  for (const m of modules) {
    L.push('  {');
    L.push(`    id: ${tsLit(m.id)},`);
    L.push(`    name: ${tsLit(m.name)},`);
    L.push(`    responsibility: ${tsLit(m.responsibility)},`);
    L.push(`    inputs: [${m.inputs.map(tsLit).join(', ')}],`);
    L.push(`    outputs: [${m.outputs.map(tsLit).join(', ')}],`);
    L.push(`    dependsOn: [${m.dependsOn.map(tsLit).join(', ')}],`);
    L.push('  },');
  }
  L.push('];');
  L.push('');
  L.push('/** The meta-algorithm: ctx(k+1) = S(k)(ctx(k)), S(k) = <stage(module) | AND C(module)>. */');
  L.push('/** @type {readonly SovereignStep[]} */');
  L.push('export const META_ALGORITHM = [');
  for (const st of steps) {
    L.push('  {');
    L.push(`    order: ${st.order},`);
    L.push(`    stage: ${tsLit(st.stage)},`);
    L.push(`    moduleId: ${tsLit(st.moduleId)},`);
    L.push(`    formal: ${tsLit(st.formal)},`);
    L.push(`    constraints: [${st.constraints.map(tsLit).join(', ')}],`);
    L.push('  },');
  }
  L.push('];');
  L.push('');
  L.push('/** Concept ledger distilled from the operator notes (Layer 1). */');
  L.push('export const BLUEPRINT_CONCEPTS = [');
  for (const c of blueprint.concepts.filter((x) => x.included)) {
    L.push(`  { n: ${c.n}, kind: ${tsLit(c.kind)}, statement: ${tsLit(c.statement)} },`);
  }
  L.push('];');
  L.push('');
  L.push('/**');
  L.push(' * Resolve a module by id.');
  L.push(' * @param {string} id');
  L.push(' * @returns {SovereignModule|undefined}');
  L.push(' */');
  L.push('export function moduleById(id) {');
  L.push('  return CORE_MODULES.find(function (m) { return m.id === id; });');
  L.push('}');
  L.push('');
  L.push('/** @returns {readonly string[]} human-readable ordered step sequence */');
  L.push('export function stepSequence() {');
  L.push('  return META_ALGORITHM.map(function (s) { return \'[S\' + s.order + \'] \' + s.stage + \' :: \' + s.moduleId; });');
  L.push('}');
  L.push('');
  L.push('/**');
  L.push(' * Sandbox entrypoint — verifies the scaffold is internally consistent');
  L.push(' * (every step resolves, every dependency exists, constraints landed).');
  L.push(' * @returns {{ status: string, steps: number, constraints: number }}');
  L.push(' */');
  L.push('export function runTask() {');
  L.push('  META_ALGORITHM.forEach(function (s) {');
  L.push('    var mod = moduleById(s.moduleId);');
  L.push('    if (!mod) { throw new TypeError(\'step \'+ s.order +\' references unknown module \' + s.moduleId); }');
  L.push('    mod.dependsOn.forEach(function (dep) {');
  L.push('      if (!moduleById(dep)) { throw new TypeError(\'module \' + mod.id + \' depends on missing \' + dep); }');
  L.push('    });');
  L.push('  });');
  L.push('  if (META_ALGORITHM.length === 0) { throw new TypeError(\'empty meta-algorithm — re-run Layer 2\'); }');
  L.push('  var constraints = META_ALGORITHM.reduce(function (n, s) { return n + s.constraints.length; }, 0);');
  L.push('  if (constraints === 0) { throw new TypeError(\'scaffold has zero armed constraints — re-run Layer 3 logic injection\'); }');
  L.push('  return { status: \'SCAFFOLD_ARMED\', steps: META_ALGORITHM.length, constraints: constraints };');
  L.push('}');
  L.push('');
  return { steps, template: L.join('\n') };
}
