// ============================================================================
// BRAIN MODE — MASTER ALGORITHM CONSOLE
// ----------------------------------------------------------------------------
// Layer-by-layer algorithm construction (PARSE → PLAN → EXECUTE → VERIFY) and
// architectural scaffolding for the blank execution engine. Nothing compiled
// here bypasses the security layers: every commit is inspected by KALI GPT
// (L1) before it can arm the backend, and blocks are treated as untrusted
// directive text on every downstream path.
// ============================================================================

import { useState } from 'react';
import {
  BrainCircuit,
  Plus,
  Trash2,
  Power,
  ShieldCheck,
  Code2,
  FileCode2,
  CircleDot,
} from 'lucide-react';
import {
  LogicBlock,
  LogicStage,
  LOGIC_STAGES,
  MAX_BLOCKS,
  MAX_BLOCK_CHARS,
  MAX_TITLE_CHARS,
  clampLogicBlocks,
  compileMasterAlgorithm,
  newBlockId,
} from '../engine/masterAlgorithm';

interface PinterestBrainStudioProps {
  /** Currently COMMITTED blocks — the backend truth. */
  committed: LogicBlock[];
  engineArmed: boolean;
  onCommit: (blocks: LogicBlock[]) => { ok: boolean; reason?: string };
  onSwitchToCode: () => void;
}

const STAGE_ACCENT: Record<LogicStage, string> = {
  PARSE: '#0EA5E9',
  PLAN: '#8B5CF6',
  EXECUTE: '#10B981',
  VERIFY: '#F59E0B',
};

const SAMPLE_SCAFFOLD: LogicBlock[] = [
  { id: newBlockId(), stage: 'PARSE', title: 'Prompt dissection', body: 'EMIT:\nRestate the operator request as a numbered list of intents. No inference beyond stated words.', enabled: true },
  { id: newBlockId(), stage: 'PLAN', title: 'Strict plan gate', body: 'Output a plan of ≤5 steps. If the request is under-specified, output exactly: ALGORITHM_GAP PLAN and stop.', enabled: true },
  { id: newBlockId(), stage: 'EXECUTE', title: 'Code style directive', body: 'TypeScript only, explicit return types, no new dependencies, every exported function null-guarded.', enabled: true },
  { id: newBlockId(), stage: 'VERIFY', title: 'Self-check block', body: 'Re-read the produced diff against each PARSE intent; list any unmet intent as UNMET: <n>.', enabled: true },
];

export const PinterestBrainStudio: React.FC<PinterestBrainStudioProps> = ({
  committed,
  engineArmed,
  onCommit,
  onSwitchToCode,
}) => {
  const [draft, setDraft] = useState<LogicBlock[]>(committed);
  const [commitNote, setCommitNote] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(committed);
  const compiled = compileMasterAlgorithm(draft);

  const update = (id: string, patch: Partial<LogicBlock>) =>
    setDraft((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const addBlock = (stage: LogicStage) =>
    setDraft((prev) =>
      prev.length >= MAX_BLOCKS
        ? prev
        : [...prev, { id: newBlockId(), stage, title: '', body: '', enabled: true }]
    );

  const removeBlock = (id: string) => setDraft((prev) => prev.filter((b) => b.id !== id));

  const handleCommit = () => {
    const clean = clampLogicBlocks(draft);
    const res = onCommit(clean);
    setDraft(clean);
    setCommitNote(res.ok ? `Committed ${clean.filter((b) => b.enabled && b.body.trim()).length} block(s) — engine ${clean.some((b) => b.enabled && b.body.trim()) ? 'ARMED' : 'returned to BLANK standby'}.` : `⛔ ${res.reason ?? 'Commit denied.'}`);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl space-y-4 pb-24">
        {/* Console head */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" />
              <h1 className="text-2xl font-heading font-semibold text-[#1C1917]">Brain Mode</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  engineArmed
                    ? 'bg-[#E8F8F5] border-[#A3E4D7] text-[#0E6251]'
                    : 'bg-[#FEF9E7] border-[#F9E79F] text-[#7D6608]'
                }`}
              >
                {engineArmed ? 'BACKEND: ARMED' : 'BACKEND: BLANK STANDBY'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#78716C] max-w-2xl">
              The four Mistral profiles run with personas and reasoning presets stripped. These
              logic blocks are the <strong>only</strong> thing that dictates how the engine thinks,
              parses prompts and executes tasks. Drafts here change nothing until committed.
            </p>
          </div>
          <button
            onClick={onSwitchToCode}
            className="shrink-0 flex items-center space-x-1.5 px-3.5 py-2 rounded-full bg-[#1C1917] hover:bg-[#2E2A27] text-[#FFFFFF] text-xs font-semibold transition-colors"
            title="Switch to Code Mode"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Mode</span>
          </button>
        </div>

        {/* Security strip — layers run automatically under both modules */}
        <div className="pinterest-card px-4 py-2.5 flex items-center justify-between text-[11px]">
          <span className="flex items-center space-x-1.5 text-[#0F766E] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security layers auto-enforced in BRAIN mode:</span>
          </span>
          <span className="flex items-center gap-3 font-mono text-[#57534E]">
            <span>KALI L1 · inspects every commit</span>
            <span>·</span>
            <span>SHELL L2 · argv allowlist</span>
            <span>·</span>
            <span>TERMINAL L3 · permits</span>
          </span>
        </div>

        {/* Scaffolding pipeline */}
        <div className="pinterest-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E] mb-2">
            Architectural scaffolding — execution order the engine must follow
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 text-[11px]">
            {LOGIC_STAGES.map((stage, i) => {
              const count = draft.filter((b) => b.stage === stage && b.enabled && b.body.trim()).length;
              return (
                <div key={stage} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#C4B5A5] hidden md:block">→</span>}
                  <span
                    className="px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-2"
                    style={{ borderColor: STAGE_ACCENT[stage] + '55', color: STAGE_ACCENT[stage] }}
                  >
                    <CircleDot className="w-3 h-3" />
                    {i + 1}. {stage}
                    <span className="font-mono text-[10px] text-[#78716C]">{count}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lane grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {LOGIC_STAGES.map((stage) => {
            const lane = draft.filter((b) => b.stage === stage);
            return (
              <section key={stage} className="pinterest-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_ACCENT[stage] }} />
                    <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: STAGE_ACCENT[stage] }}>
                      {stage} layer
                    </h2>
                    <span className="text-[10px] font-mono text-[#A8A29E]">{lane.length}/{MAX_BLOCKS} shared</span>
                  </div>
                  <button
                    onClick={() => addBlock(stage)}
                    disabled={draft.length >= MAX_BLOCKS}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#FAF6F0] hover:bg-[#F2ECE3] border border-[#E8DFD5] text-[11px] font-semibold text-[#1C1917] disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add block</span>
                  </button>
                </div>

                {lane.length === 0 && (
                  <p className="text-[11px] text-[#A8A29E] italic">No blocks — this layer contributes nothing to the compiled algorithm.</p>
                )}

                {lane.map((block) => (
                  <article key={block.id} className="rounded-2xl border border-[#E8DFD5] bg-[#FFFFFF] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={block.title}
                        onChange={(e) => update(block.id, { title: e.target.value.slice(0, MAX_TITLE_CHARS) })}
                        placeholder="block title"
                        className="flex-1 min-w-0 text-xs font-semibold text-[#1C1917] bg-transparent border-none outline-none placeholder:text-[#C4B5A5]"
                      />
                      <button
                        onClick={() => update(block.id, { enabled: !block.enabled })}
                        title={block.enabled ? 'Disarm block' : 'Arm block'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          block.enabled
                            ? 'bg-[#E8F8F5] border-[#A3E4D7] text-[#0F766E]'
                            : 'bg-[#FAF6F0] border-[#E8DFD5] text-[#A8A29E]'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeBlock(block.id)}
                        title="Delete block"
                        className="p-1.5 rounded-lg border bg-[#FAF6F0] border-[#E8DFD5] text-[#A8A29E] hover:text-[#DC2626] hover:border-[#DC2626]/40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <textarea
                      value={block.body}
                      onChange={(e) => update(block.id, { body: e.target.value.slice(0, MAX_BLOCK_CHARS) })}
                      placeholder={'Directive text. Optional verbs:\nEMIT:\n(literal output)\nFILE src/thing.ts:\n(literal file, staged behind L1/L2 gates)'}
                      rows={4}
                      spellCheck={false}
                      className={`w-full text-[11px] font-mono leading-relaxed rounded-xl border p-2.5 outline-none resize-y bg-[#FCFAF7] focus:border-[#D6C8BA] ${
                        block.enabled ? 'text-[#1C1917] border-[#E8DFD5]' : 'text-[#A8A29E] border-[#EFE7DE]'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#A8A29E]">
                      <span>{block.body.length}/{MAX_BLOCK_CHARS} chars</span>
                      <span className={block.enabled ? 'text-[#0F766E]' : ''}>{block.enabled ? 'ARMED' : 'DISARMED'}</span>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>

        {/* Compiled output preview */}
        <div className="pinterest-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
              <FileCode2 className="w-3.5 h-3.5" />
              Compiled master algorithm (injected verbatim into every model call)
            </div>
            <span className="text-[10px] font-mono text-[#A8A29E]">{compiled.length} chars</span>
          </div>
          <pre className="max-h-56 overflow-y-auto rounded-xl bg-[#1C1917] text-[#EDE9E4] text-[10px] leading-relaxed p-3 font-mono whitespace-pre-wrap">
            {compiled || '— nothing compiled: engine stays blank, all generation paths return STANDBY —'}
          </pre>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setDraft((prev) => (prev.length === 0 ? SAMPLE_SCAFFOLD : prev))}
              className="px-3 py-1.5 rounded-full border border-[#E8DFD5] bg-[#FAF6F0] hover:bg-[#F2ECE3] text-[11px] font-semibold text-[#57534E]"
            >
              Load starter scaffold into empty lanes
            </button>
            <div className="flex items-center space-x-2">
              {dirty && (
                <button
                  onClick={() => { setDraft(committed); setCommitNote(null); }}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917]"
                >
                  Discard draft
                </button>
              )}
              <button
                onClick={handleCommit}
                disabled={!dirty}
                className="px-4 py-2 rounded-full bg-[#E07A5F] hover:bg-[#C9664B] disabled:bg-[#E8DFD5] disabled:text-[#A8A29E] text-xs font-semibold text-[#FFFFFF] shadow-xs transition-all disabled:cursor-not-allowed"
              >
                {dirty ? 'Compile & commit to backend' : 'Nothing to commit'}
              </button>
            </div>
          </div>
          {commitNote && (
            <p className={`text-[11px] font-medium ${commitNote.startsWith('⛔') ? 'text-[#B91C1C]' : 'text-[#0F766E]'}`}>
              {commitNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
