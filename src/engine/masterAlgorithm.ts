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
    if (!raw) return [];
    return clampLogicBlocks(JSON.parse(raw));
  } catch {
    return [];
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
