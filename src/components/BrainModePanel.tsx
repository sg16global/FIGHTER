// ============================================================================
// BRAIN MODE PANEL — strict conversational architecture guide (Phase 3)
// ----------------------------------------------------------------------------//
// Deterministic flow, one layer at a time — the guide never jumps ahead:
//   INTENT  →  L1 Concept Parsing  →  L2 Structural Breakdown
//           →  L3 Logic Injection  →  L4 Scaffolding & LOCK/DEPLOY
// Every layer ends on the operator's validation click. Only Layer 4 may lock
// the synthesized meta-algorithm and push it to the Code Mode workspace at the
// fixed path src/workspace/sovereignTemplate.ts — through the same L1 patch
// gate + L2 filename policy as any other write (see App.handleDeployTemplate).
// ============================================================================

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  MessageSquareQuote,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ConceptBlueprint,
  ModuleConstraints,
  ScaffoldModule,
  parseConceptBlueprint,
  sliceBlueprintToModules,
  synthesizeMetaAlgorithm,
} from '../engine/masterAlgorithm';

export const SOVEREIGN_TEMPLATE_PATH = 'src/workspace/sovereignTemplate.ts';

interface BrainModePanelProps {
  /** Lock & push to Code Mode — App gates, writes, tracks and switches mode. */
  onDeploy: (content: string) => { ok: boolean; reason?: string };
}

type Phase = 'INTENT' | 'L1' | 'L2' | 'L3' | 'L4' | 'DEPLOYED';

const PHASE_STEPS: Array<{ key: Phase; label: string }> = [
  { key: 'INTENT', label: 'Intent' },
  { key: 'L1', label: 'L1 · Parse' },
  { key: 'L2', label: 'L2 · Structure' },
  { key: 'L3', label: 'L3 · Logic' },
  { key: 'L4', label: 'L4 · Scaffold' },
];

const KIND_TONE: Record<string, string> = {
  GOAL: '#0EA5E9',
  CONSTRAINT: '#8B5CF6',
  CAPABILITY: '#10B981',
  DATA: '#F59E0B',
  RISK: '#DC2626',
};

export const BrainModePanel: React.FC<BrainModePanelProps> = ({ onDeploy }) => {
  const [phase, setPhase] = useState<Phase>('INTENT');
  const [rawNotes, setRawNotes] = useState('');
  const [blueprint, setBlueprint] = useState<ConceptBlueprint | null>(null);
  const [modules, setModules] = useState<ScaffoldModule[]>([]);
  const [constraints, setConstraints] = useState<ModuleConstraints>({});
  const [l3Index, setL3Index] = useState(0);
  const [draftConstraint, setDraftConstraint] = useState('');
  const [template, setTemplate] = useState('');
  const [deployNote, setDeployNote] = useState<string | null>(null);

  const phaseIdx = PHASE_STEPS.findIndex((p) => p.key === phase);

  const submitIntent = () => {
    const bp = parseConceptBlueprint(rawNotes);
    if (bp.concepts.length === 0) {
      setDeployNote('Boss, I need at least one real line to work with — the intake came back empty.');
      return;
    }
    setBlueprint(bp);
    setDeployNote(null);
    setPhase('L1');
  };

  const confirmL1 = () => {
    if (!blueprint) return;
    setModules(sliceBlueprintToModules(blueprint));
    setPhase('L2');
  };

  const confirmL2 = () => {
    const seeded: ModuleConstraints = {};
    for (const m of modules) seeded[m.id] = { texts: [], permissive: false };
    setConstraints(seeded);
    setL3Index(0);
    setPhase('L3');
  };

  const activeModule = modules[l3Index];

  const addConstraint = () => {
    const text = draftConstraint.trim();
    if (!text || !activeModule) return;
    setConstraints((prev) => ({
      ...prev,
      [activeModule.id]: { texts: [...(prev[activeModule.id]?.texts ?? []), text.slice(0, 240)], permissive: false },
    }));
    setDraftConstraint('');
  };

  const advanceL3 = (skipped: boolean) => {
    if (!activeModule) return;
    if (skipped) {
      setConstraints((prev) => ({ ...prev, [activeModule.id]: { texts: [], permissive: true } }));
    }
    if (l3Index + 1 < modules.length) {
      setL3Index((i) => i + 1);
      return;
    }
    // all modules answered → synthesize Layer 4
    if (blueprint) {
      const synthesized = synthesizeMetaAlgorithm(blueprint, modules, {
        ...constraints,
        ...(skipped ? { [activeModule.id]: { texts: [], permissive: true } } : {}),
      });
      setTemplate(synthesized.template);
    }
    setPhase('L4');
  };

  const removeConstraint = (moduleId: string, idx: number) =>
    setConstraints((prev) => ({
      ...prev,
      [moduleId]: { texts: prev[moduleId].texts.filter((_, i) => i !== idx), permissive: prev[moduleId].permissive },
    }));

  const lockAndDeploy = () => {
    const res = onDeploy(template);
    if (res.ok) {
      setPhase('DEPLOYED');
      setDeployNote(null);
    } else {
      setDeployNote(`⛔ Deploy refused: ${res.reason ?? 'the workspace gates rejected the scaffold.'}`);
    }
  };

  const reopen = () => {
    setPhase('INTENT');
    setBlueprint(null);
    setModules([]);
    setConstraints({});
    setTemplate('');
    setDeployNote(null);
  };

  return (
    <section className="border-b border-[#EFE7DE] bg-[#FCFAF7]">
      {/* progress rail */}
      <div className="mx-auto max-w-5xl px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquareQuote className="w-4 h-4 text-[#8B5CF6]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">Architectural Guide — chronological pipeline</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {PHASE_STEPS.map((p, i) => (
            <div key={p.key} className="flex items-center gap-1.5">
              {i > 0 && <span className={`w-3 h-px ${i <= phaseIdx || (phase === 'DEPLOYED' && true) ? 'bg-[#0D9488]' : 'bg-[#E0D7CC]'}`} />}
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  phase === 'DEPLOYED' || i < phaseIdx
                    ? 'bg-[#E8F8F5] text-[#0F766E]'
                    : i === phaseIdx
                    ? 'bg-[#1C1917] text-[#FAF6F0]'
                    : 'bg-[#F2ECE3] text-[#A8A29E]'
                }`}
              >
                {phase === 'DEPLOYED' || i < phaseIdx ? <Check className="inline w-2.5 h-2.5 -mt-0.5" /> : null} {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-4">
        {phase === 'INTENT' && (
          <div className="pinterest-card p-4 space-y-3">
            <div className="flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#8B5CF6]/15 text-[#7C3AED] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-[#292524] leading-relaxed">
                <strong>Yes boss — input your raw concepts, notes, or voice transcripts here.</strong>
                <span className="block text-[11px] text-[#78716C] mt-0.5">
                  One thought per line. The guide walks you chronologically through 4 layers — parse → structure → logic → scaffold.
                  It will not jump ahead, and it will not invent: every layer is your words, staged.
                </span>
              </p>
            </div>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value.slice(0, 8000))}
              rows={5}
              spellCheck={false}
              placeholder={'e.g.\nbuild a task board with local-only storage\nnever sync to any cloud service\nparse user notes line-by-line into cards\ntest the vault ring buffer before ship'}
              className="w-full text-[11px] font-mono leading-relaxed rounded-xl border border-[#E8DFD5] bg-[#FFFFFF] p-2.5 outline-none resize-y focus:border-[#D6C8BA] text-[#1C1917]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#A8A29E]">{rawNotes.split(/\r?\n/).filter((l) => l.trim().length > 2).length} line(s) · {rawNotes.length}/8000</span>
              <button
                onClick={submitIntent}
                disabled={rawNotes.trim().length < 3}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#1C1917] hover:bg-[#2E2A27] disabled:bg-[#E8DFD5] disabled:text-[#A8A29E] text-[11px] font-semibold text-[#FFFFFF] shadow-2xs"
              >
                <Send className="w-3 h-3" />
                <span>Receive intent → Layer 1</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'L1' && blueprint && (
          <div className="pinterest-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0EA5E9]">LAYER 1 · CONCEPT PARSING — structured conceptual blueprint</h3>
              <span className="text-[10px] font-mono text-[#A8A29E]">{blueprint.summary}</span>
            </div>
            <ul className="space-y-1.5">
              {blueprint.concepts.map((c, i) => (
                <li key={c.n} className="flex items-start gap-2 text-[11px]">
                  <button
                    onClick={() =>
                      setBlueprint((prev) => prev && { ...prev, concepts: prev.concepts.map((x, xi) => (xi === i ? { ...x, included: !x.included } : x)) })
                    }
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      c.included ? 'bg-[#0D9488] border-[#0D9488] text-white' : 'border-[#D6C8BA] bg-white text-transparent'
                    }`}
                    title={c.included ? 'Exclude from scaffold' : 'Include in scaffold'}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[10px] text-[#A8A29E] mt-px">#{c.n}</span>
                  <span className={`flex-1 ${c.included ? 'text-[#1C1917]' : 'text-[#C4B5A5] line-through'}`}>{c.statement}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0" style={{ backgroundColor: KIND_TONE[c.kind] + '18', color: KIND_TONE[c.kind] }}>
                    {c.kind}
                  </span>
                </li>
              ))}
            </ul>
            {blueprint.ambiguities.length > 0 && (
              <div className="rounded-xl border border-[#F9E79F] bg-[#FFFDF5] p-2.5 space-y-1">
                {blueprint.ambiguities.map((a, i) => (
                  <p key={i} className="text-[10px] text-[#7D6608]">⚠ {a}</p>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#57534E]">Boss, blueprint drafted from your notes. Toggle anything out of scope, then validate to proceed — or take it back and edit.</p>
            <div className="flex items-center justify-between">
              <button onClick={() => setPhase('INTENT')} className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-[#E8DFD5] text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF6F0]">
                <ArrowLeft className="w-3 h-3" /><span>Edit raw notes</span>
              </button>
              <button onClick={confirmL1} className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-[11px] font-semibold text-white">
                <Check className="w-3 h-3" /><span>Validated — Layer 2</span><ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {phase === 'L2' && blueprint && (
          <div className="pinterest-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#8B5CF6]">LAYER 2 · STRUCTURAL BREAKDOWN — strict core operational modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {modules.map((m) => (
                <div key={m.id} className="rounded-2xl border border-[#E8DFD5] bg-[#FFFFFF] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1C1917]">{m.name}</span>
                    <span className="text-[9px] font-mono text-[#A8A29E]">{m.id}</span>
                  </div>
                  <p className="text-[10px] text-[#78716C] mt-1 leading-snug">{m.responsibility}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                    <div><span className="text-[#0EA5E9]">IN</span> {m.inputs.join(' · ')}</div>
                    <div><span className="text-[#10B981]">OUT</span> {m.outputs.join(' · ')}</div>
                  </div>
                  <div className="mt-1.5 text-[9px] font-mono text-[#8C827A]">
                    DEPENDS → {m.dependsOn.length ? m.dependsOn.join(', ') : '∅ (entry)'} · CONCEPTS {m.conceptNs.length ? `[${m.conceptNs.join(',')}]` : '—'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#57534E]">
              Boss, the blueprint is sliced into {modules.length} module(s) with a strict dependency order — nothing invented, every module traces back to your concepts. Validate the structure to move to logic injection.
            </p>
            <div className="flex items-center justify-between">
              <button onClick={() => setPhase('L1')} className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-[#E8DFD5] text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF6F0]">
                <ArrowLeft className="w-3 h-3" /><span>Back to blueprint</span>
              </button>
              <button onClick={confirmL2} className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-[11px] font-semibold text-white">
                <Check className="w-3 h-3" /><span>Structure confirmed — Layer 3</span><ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {phase === 'L3' && activeModule && (
          <div className="pinterest-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#10B981]">LAYER 3 · LOGIC INJECTION — module {l3Index + 1}/{modules.length}</h3>
              <span className="text-[10px] font-mono text-[#A8A29E]">{activeModule.name}</span>
            </div>
            <p className="text-[11px] text-[#57534E]">
              Boss, what are the <strong>core logical constraints</strong> for <span className="font-mono">{activeModule.id}</span> — its invariants and must/never rules? Each one is injected into the meta-algorithm as ⋀ C_<span className="font-mono">{activeModule.id}</span>.
            </p>
            <div className="flex items-center gap-2">
              <input
                value={draftConstraint}
                onChange={(e) => setDraftConstraint(e.target.value.slice(0, 240))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addConstraint(); } }}
                placeholder="e.g. must reject any payload containing absolute host paths"
                className="flex-1 text-[11px] font-mono rounded-xl border border-[#E8DFD5] bg-[#FFFFFF] px-2.5 py-2 outline-none focus:border-[#D6C8BA] text-[#1C1917]"
              />
              <button onClick={addConstraint} disabled={!draftConstraint.trim()} className="px-3 py-2 rounded-xl bg-[#1C1917] disabled:bg-[#E8DFD5] disabled:text-[#A8A29E] text-white text-[11px] font-semibold">
                Add
              </button>
            </div>
            <ul className="space-y-1">
              {(constraints[activeModule.id]?.texts ?? []).map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-[#292524]">
                  <span className="w-4 text-right font-mono text-[10px] text-[#A8A29E]">{i + 1}.</span>
                  <span className="flex-1 font-mono">{t}</span>
                  <button onClick={() => removeConstraint(activeModule.id, i)} className="text-[#C4B5A5] hover:text-[#DC2626]" title="Remove constraint">
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
              {constraints[activeModule.id]?.permissive && <li className="text-[10px] text-[#B45309] font-mono">(permissive — shield remains authoritative)</li>}
            </ul>
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setL3Index((i) => Math.max(0, i - 1))}
                disabled={l3Index === 0}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-[#E8DFD5] text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF6F0] disabled:opacity-40"
              >
                <ArrowLeft className="w-3 h-3" /><span>Previous module</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => advanceL3(true)} className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#8C827A] hover:text-[#1C1917]">
                  Skip — keep permissive
                </button>
                <button
                  onClick={() => advanceL3((constraints[activeModule.id]?.texts ?? []).length === 0 && !constraints[activeModule.id]?.permissive)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-[11px] font-semibold text-white"
                >
                  <span>{l3Index + 1 === modules.length ? 'Complete injection — Layer 4' : 'Next module'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 'L4' && (
          <div className="pinterest-card p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#F59E0B]">LAYER 4 · ARCHITECTURAL SCAFFOLDING & CONCLUSION — deployable meta-algorithm</h3>
            <p className="text-[11px] text-[#57534E]">
              Boss, everything is synthesized into one strict structure — steps S₁…S<sub>{modules.length}</sub>, each ⟨stage · module | ⋀ constraints⟩.
              Locking deploys it to <code className="font-mono text-[10px]">{SOVEREIGN_TEMPLATE_PATH}</code> in the Code Mode workspace, tracked by the virtual filesystem, gated like every other write.
            </p>
            <pre className="max-h-64 overflow-y-auto rounded-xl bg-[#1C1917] text-[#EDE9E4] text-[9.5px] leading-relaxed p-3 font-mono whitespace-pre">{template}</pre>
            {deployNote && <p className="text-[11px] font-medium text-[#B91C1C]">{deployNote}</p>}
            <div className="flex items-center justify-between">
              <button onClick={() => setPhase('L3')} className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-[#E8DFD5] text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF6F0]">
                <ArrowLeft className="w-3 h-3" /><span>Adjust constraints</span>
              </button>
              <button onClick={lockAndDeploy} className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#E07A5F] hover:bg-[#C9664B] text-xs font-semibold text-white shadow-xs">
                <Lock className="w-3.5 h-3.5" /><span>Lock &amp; deploy to Code Mode</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'DEPLOYED' && (
          <div className="pinterest-card p-4 space-y-2.5 border-[#A3E4D7]">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-[#E8F8F5] text-[#0F766E] flex items-center justify-center"><Lock className="w-3.5 h-3.5" /></div>
              <h3 className="text-xs font-bold text-[#0F766E]">Brain locked — structure deployed</h3>
            </div>
            <p className="text-[11px] text-[#57534E]">
              Done, boss — the scaffold is live at <code className="font-mono text-[10px]">{SOVEREIGN_TEMPLATE_PATH}</code>, selected in the Code Studio, tracked in the workspace file tree. The file carries a <span className="font-mono">runTask()</span> hook, so one click in Code Mode verifies the whole chain in the permit-gated sandbox.
            </p>
            <button onClick={reopen} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[#E8DFD5] text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF6F0]">
              <RotateCcw className="w-3 h-3" /><span>Re-open the guide for a new concept set</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
