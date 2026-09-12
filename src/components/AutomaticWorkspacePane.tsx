import React, { useRef, useState } from 'react';
import {
  Play,
  Terminal as TerminalIcon,
  ShieldAlert,
  ShieldCheck,
  Split,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  FileCode,
  AlertOctagon,
  Layers,
  PanelRightClose,
} from 'lucide-react';
import { WorkspaceFile } from '../workspace/defaultFiles';
import {
  AutonomousLoopTrace,
  parseCodeIntoBites,
  TerminalExecutionResult,
} from '../engine/sovereignBiteEngine';
import { SecurityAuditResult } from '../security/doubleLayerShield';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const highlightCode = (source: string) => {
  const tokenPattern = /(\/\/.*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:const|let|function|return|if|else|throw|new|typeof|export|interface|true|false|null|undefined|async|await)\b|\b\d+(?:\.\d+)?\b)/g;
  const keywordPattern = /^(const|let|function|return|if|else|throw|new|typeof|export|interface|true|false|null|undefined|async|await)$/;

  return source
    .split('\n')
    .map((line) => {
      let output = '';
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = tokenPattern.exec(line)) !== null) {
        output += escapeHtml(line.slice(cursor, match.index));
        const token = match[0];
        const className = token.startsWith('//') || token.startsWith('/*')
          ? 'syntax-comment'
          : token.startsWith('"') || token.startsWith("'") || token.startsWith('`')
          ? 'syntax-string'
          : /^\d/.test(token)
          ? 'syntax-number'
          : keywordPattern.test(token)
          ? 'syntax-keyword'
          : '';
        output += className
          ? `<span class="${className}">${escapeHtml(token)}</span>`
          : escapeHtml(token);
        cursor = match.index + token.length;
      }

      return output + escapeHtml(line.slice(cursor));
    })
    .join('\n');
};

interface AutomaticWorkspacePaneProps {
  files: WorkspaceFile[];
  activeFile: WorkspaceFile;
  onSelectFile: (fileId: string) => void;
  onCodeChange: (newContent: string) => void;
  onRunCurrentScript: () => void;
  onRunCustomCommand: (command: string) => void;
  terminalLogs: string[];
  lastExecutionResult: TerminalExecutionResult | null;
  autoHealTraces: AutonomousLoopTrace[];
  securityAudits: SecurityAuditResult[];
  onTriggerAutoHealLoop: () => void;
  isHealingLoopRunning: boolean;
  onResetSampleBug: () => void;
  onCollapse?: () => void;
}

export const AutomaticWorkspacePane: React.FC<AutomaticWorkspacePaneProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCodeChange,
  onRunCurrentScript,
  onRunCustomCommand,
  terminalLogs,
  lastExecutionResult,
  autoHealTraces,
  securityAudits,
  onTriggerAutoHealLoop,
  isHealingLoopRunning,
  onResetSampleBug,
  onCollapse,
}) => {
  const [showDiffView, setShowDiffView] = useState(false);
  const [terminalTab, setTerminalTab] = useState<
    'OUTPUT' | 'AUTO_HEAL_TRACE' | 'SHIELD_LOGS' | 'BITE_CHUNKS'
  >('OUTPUT');
  const [customCmd, setCustomCmd] = useState('');
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const codePreviewRef = useRef<HTMLPreElement>(null);

  const lines = activeFile.content.split('\n');
  const bites = parseCodeIntoBites(activeFile.content, activeFile.path);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    onRunCustomCommand(customCmd.trim());
    setCustomCmd('');
    setTerminalTab('OUTPUT');
  };

  const syncCodeScroll = () => {
    if (!editorRef.current || !codePreviewRef.current) return;
    codePreviewRef.current.scrollTop = editorRef.current.scrollTop;
    codePreviewRef.current.scrollLeft = editorRef.current.scrollLeft;
  };

  return (
    <main className="workspace-automatic h-full flex flex-col min-w-0 bg-[#121212] select-none">
      {/* =====================================================================
          TOP SECTION: LIVE CODE EDITOR (60% VERTICAL HEIGHT)
         ===================================================================== */}
      <div className="flex-[3] flex flex-col min-h-0 border-b border-[#2d2d2d]">
        {/* Editor File Tabs Bar */}
        <div className="glass-bar h-10 border-b border-[#2d2d2d] flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {files.map((f) => {
              const isActive = f.id === activeFile.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFile(f.id)}
                  className={`tab-active-glow flex items-center space-x-2 px-3 py-1.5 rounded-t-md text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-[#1b1d24] to-[#141519] text-[#00F2FE]'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.04] after:hidden'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{f.name}</span>
                  {f.hasKnownBug && f.content.includes('payload.amount * payload.rate') && (
                    <span className="w-2 h-2 rounded-full bg-[#FF9F1C]" title="Bugged demo" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Editor Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowDiffView(!showDiffView)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                showDiffView
                  ? 'bg-[#1A1D27] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'bg-[#161922] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232736]'
              }`}
              title="Toggle Bite Healed vs Original Diff"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{showDiffView ? 'HIDE BITE DIFF' : 'BITE AST DIFF'}</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#161922] hover:bg-[#1C202C] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232736] text-xs font-mono transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY</span>
                </>
              )}
            </button>

            {/* Run script in sandbox terminal button */}
            <button
              onClick={() => {
                onRunCurrentScript();
                setTerminalTab('OUTPUT');
              }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-[#0D0E12] font-mono text-xs font-bold transition-all shadow-sm"
              title="Execute active file in sandboxed subprocess"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN IN SANDBOX</span>
            </button>

            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1.5 rounded text-[#9699a3] hover:text-[#00f2fe] hover:bg-[#202020] border border-transparent hover:border-[#2d2d2d] transition-all duration-200"
                title="Hide Workspace panel"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Code Editor Canvas */}
        <div className="flex-1 flex min-h-0 relative editor-surface">
          {!showDiffView ? (
            <div className="flex-1 flex overflow-hidden bg-[#121212] code-layer">
              {/* Line Numbers Gutter */}
              <div className="gutter-premium w-12 py-3 flex flex-col items-end pr-2.5 text-[#4B526D] select-none">
                {lines.map((_, i) => {
                  const isBugLine =
                    activeFile.path.includes('paymentProcessor') &&
                    lines[i].includes('payload.amount * payload.rate');
                  return (
                    <div
                      key={i}
                      className={`h-5 leading-5 ${
                        isBugLine ? 'text-[#FF3B30] font-bold bg-[#FF3B30]/10 w-full text-right pr-2' : ''
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              {/* Highlighted code preview under a transparent editable layer keeps typing native. */}
              <div className="relative flex-1 min-w-0 overflow-hidden">
                <pre
                  ref={codePreviewRef}
                  aria-hidden="true"
                  className="absolute inset-0 m-0 p-3 bg-[#121212] text-[#F3F4F6] leading-5 pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: highlightCode(activeFile.content) }}
                />
                <textarea
                  ref={editorRef}
                  value={activeFile.content}
                  onChange={(e) => onCodeChange(e.target.value)}
                  onScroll={syncCodeScroll}
                  spellCheck={false}
                  aria-label={`Edit ${activeFile.path}`}
                  className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-[#00F2FE] leading-5 resize-none focus:outline-none select-text overflow-auto font-mono"
                />
              </div>
            </div>
          ) : (
            /* Split Diff View (Original vs Bite Healed) */
            <div className="flex-1 grid grid-cols-2 divide-x divide-[#2d2d2d] overflow-auto bg-[#121212] font-mono text-xs p-3">
              <div>
                <div className="text-[11px] text-[#FF3B30] font-bold mb-2 pb-1 border-b border-[#232736]">
                  ORIGINAL SOURCE (WITH UNCHECKED NULL REFERENCE)
                </div>
                <pre className="text-[#9CA3AF] whitespace-pre-wrap select-text leading-5">
                  {activeFile.content}
                </pre>
              </div>
              <div className="pl-3">
                <div className="text-[11px] text-[#10B981] font-bold mb-2 pb-1 border-b border-[#232736]">
                  SOVEREIGN BITE-HEALED AST CODE (VERIFIED SAFE)
                </div>
                <pre className="text-[#10B981] whitespace-pre-wrap select-text leading-5">
                  {bites.map((b) => b.healedSnippet).join('\n')}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          BOTTOM SECTION: AUTOMATED TERMINAL OUTPUT SCREEN (40% VERTICAL)
         ===================================================================== */}
      <div className="flex-[2] flex flex-col min-h-0 bg-[#0d0d0e]">
        {/* Terminal Tab Bar */}
        <div className="glass-bar h-9 px-3 border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setTerminalTab('OUTPUT')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                terminalTab === 'OUTPUT'
                  ? 'bg-[#1A1D27] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>TERMINAL OUTPUT</span>
              {lastExecutionResult && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    lastExecutionResult.exitCode === 0
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-[#FF3B30]/20 text-[#FF3B30]'
                  }`}
                >
                  EXIT {lastExecutionResult.exitCode}
                </span>
              )}
            </button>

            <button
              onClick={() => setTerminalTab('AUTO_HEAL_TRACE')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                terminalTab === 'AUTO_HEAL_TRACE'
                  ? 'bg-[#1A1D27] text-[#FF9F1C] border border-[#FF9F1C]/40'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF9F1C]" />
              <span>OPTION 2 // AUTO-HEAL TRACE</span>
              {autoHealTraces.length > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#FF9F1C]/20 text-[#FF9F1C] text-[10px]">
                  {autoHealTraces.length} STEPS
                </span>
              )}
            </button>

            <button
              onClick={() => setTerminalTab('SHIELD_LOGS')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                terminalTab === 'SHIELD_LOGS'
                  ? 'bg-[#1A1D27] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00F2FE]" />
              <span>OPTION 3 // DOUBLE-LAYER SHIELD AUDIT</span>
            </button>

            <button
              onClick={() => setTerminalTab('BITE_CHUNKS')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                terminalTab === 'BITE_CHUNKS'
                  ? 'bg-[#1A1D27] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AST BITE DECOMPOSER</span>
            </button>
          </div>

          {/* Quick Auto-Heal Demo Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onResetSampleBug}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1A1D27] hover:bg-[#232736] text-[11px] font-mono text-[#9CA3AF] hover:text-[#FF9F1C] border border-[#282D3E]"
              title="Reset paymentProcessor.js bug to replay Option 2 auto-healing loop"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET BUG DEMO</span>
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="terminal-screen flex-1 overflow-y-auto p-3 font-mono text-xs select-text">
          {/* TAB 1: TERMINAL OUTPUT */}
          {terminalTab === 'OUTPUT' && (
            <div className="space-y-1">
              {terminalLogs.length === 0 ? (
                <div className="text-[#9CA3AF] py-2">
                  [AEGIS AIRGAP CONTAINER READY] Click &apos;RUN IN SANDBOX&apos; or execute a terminal command below.
                </div>
              ) : (
                terminalLogs.map((log, index) => {
                  const isCrash = log.includes('[CRASH LOG CAPTURED]') || log.includes('TypeError') || log.includes('BLOCKED');
                  const isSuccess = log.includes('[EXIT CODE 0]') || log.includes('[SOVEREIGN HEALER]');
                  return (
                    <div
                      key={index}
                      className={`leading-relaxed whitespace-pre-wrap ${
                        isCrash
                          ? 'text-[#FF3B30]'
                          : isSuccess
                          ? 'text-[#10B981]'
                          : log.startsWith('$')
                          ? 'text-[#00F2FE] font-bold'
                          : 'text-[#F3F4F6]'
                      }`}
                    >
                      {log}
                    </div>
                  );
                })
              )}

              {/* If last execution crashed, show Auto-Heal banner CTA */}
              {lastExecutionResult && lastExecutionResult.crashed && (
                <div className="mt-3 p-3 rounded-lg bg-[#1F1317] border border-[#FF3B30]/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertOctagon className="w-4 h-4 text-[#FF3B30]" />
                    <div>
                      <div className="font-bold text-[#FF3B30] text-xs">
                        TERMINAL CRASH DETECTED (EXIT CODE {lastExecutionResult.exitCode})
                      </div>
                      <div className="text-[11px] text-[#9CA3AF]">
                        Option 2 Auto-Heal Loop can bundle crash logs + AST Bites and patch this file automatically.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onTriggerAutoHealLoop}
                    disabled={isHealingLoopRunning}
                    className="px-3 py-1.5 rounded bg-[#00F2FE] hover:bg-[#4FACFE] text-[#0D0E12] font-bold text-xs transition-colors shrink-0"
                  >
                    {isHealingLoopRunning ? 'HEALING IN PROGRESS...' : 'TRIGGER AUTO-HEAL LOOP'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPTION 2 AUTO-HEAL LOOP STEP-BY-STEP TRACES */}
          {terminalTab === 'AUTO_HEAL_TRACE' && (
            <div className="space-y-2">
              {autoHealTraces.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-[#232736] text-[#9CA3AF] text-center">
                  No Auto-Heal loop executed yet. Click &quot;AUTO-HEAL LOOP (OPT. 2)&quot; in the title bar or chat panel to watch step-by-step trace isolation and self-healing.
                </div>
              ) : (
                autoHealTraces.map((trace) => (
                  <div
                    key={trace.step}
                    className="p-2.5 rounded bg-[#14161D] border border-[#232736] flex items-start space-x-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1A1D27] border border-[#00F2FE]/40 text-[#00F2FE] flex items-center justify-center font-bold text-xs shrink-0">
                      #{trace.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#00F2FE] uppercase text-xs">
                          {trace.phase.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">{trace.timestamp}</span>
                      </div>
                      <p className="text-[#F3F4F6] text-xs mt-1">{trace.message}</p>
                      {trace.codeDiffSummary && (
                        <div className="mt-2 p-2 rounded bg-[#0D0E12] border border-[#232736] text-[#10B981] font-mono text-[11px]">
                          {trace.codeDiffSummary}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: OPTION 3 DOUBLE-LAYER SECURITY SHIELD AUDIT LOG */}
          {terminalTab === 'SHIELD_LOGS' && (
            <div className="space-y-2">
              {securityAudits.map((audit) => (
                <div
                  key={audit.id}
                  className={`p-2.5 rounded border ${
                    audit.verdict === 'BLOCKED_SYSCALL'
                      ? 'bg-[#1D1115] border-[#FF3B30]'
                      : 'bg-[#14161D] border-[#232736]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {audit.verdict === 'BLOCKED_SYSCALL' ? (
                        <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      )}
                      <span className="font-bold text-xs">
                        {audit.id} // SOURCE: {audit.source}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        audit.verdict === 'BLOCKED_SYSCALL'
                          ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                          : 'bg-[#10B981]/20 text-[#10B981]'
                      }`}
                    >
                      {audit.verdict}
                    </span>
                  </div>

                  <p className="text-[#9CA3AF] text-xs mt-1.5">{audit.notes}</p>
                  <div className="mt-1 text-[11px] font-mono text-[#F3F4F6] bg-[#0D0E12] p-1.5 rounded truncate">
                    Target: {audit.inputSnippet}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: AST BITE DECOMPOSER */}
          {terminalTab === 'BITE_CHUNKS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {bites.map((bite) => (
                <div
                  key={bite.id}
                  className="p-2.5 rounded bg-[#14161D] border border-[#232736] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#00F2FE]/20 text-[#00F2FE] font-bold text-[10px]">
                        {bite.id}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        L{bite.startLine}–L{bite.endLine}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-[#F3F4F6]">{bite.label}</div>
                    <div className="text-[11px] text-[#9CA3AF] mt-1">{bite.diagnosis}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#232736] flex items-center justify-between">
                    <span className="text-[10px] text-[#9CA3AF]">Status</span>
                    <span
                      className={`text-[10px] font-bold ${
                        bite.status === 'BUG_ISOLATED' ? 'text-[#FF9F1C]' : 'text-[#10B981]'
                      }`}
                    >
                      {bite.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive CLI Prompt Command Input */}
        <form
          onSubmit={handleCommandSubmit}
          className="h-9 px-3 bg-[#181818] border-t border-[#2d2d2d] flex items-center shrink-0"
        >
          <span className="text-[#00F2FE] font-bold mr-2 text-xs select-none">
            sovereign@airgap-sandbox:~/workspace/sovereign-project$
          </span>
          <input
            type="text"
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            placeholder="Try: node src/paymentProcessor.js  OR  rm -rf /  (to test Double-Layer Security Shield)"
            className="flex-1 bg-transparent text-[#F3F4F6] font-mono text-xs focus:outline-none"
          />
        </form>
      </div>
    </main>
  );
};
