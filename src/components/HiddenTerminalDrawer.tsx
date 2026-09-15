import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  ChevronUp,
  ChevronDown,
  Zap,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { TerminalExecutionResult, AutonomousLoopTrace, CodeBite } from '../engine/sovereignBiteEngine';
import { SecurityAuditResult } from '../security/doubleLayerShield';
import { getShieldTelemetry, verifyShieldIntegrity } from '../security/securityCore';

interface HiddenTerminalDrawerProps {
  terminalLogs: string[];
  lastExecutionResult: TerminalExecutionResult | null;
  autoHealTraces: AutonomousLoopTrace[];
  securityAudits: SecurityAuditResult[];
  onRunCustomCommand: (cmd: string) => void;
  onTriggerAutoHeal: () => void;
  isHealingLoopRunning: boolean;
  bites: CodeBite[];
}

export const HiddenTerminalDrawer: React.FC<HiddenTerminalDrawerProps> = ({
  terminalLogs,
  lastExecutionResult,
  autoHealTraces,
  securityAudits,
  onRunCustomCommand,
  onTriggerAutoHeal,
  isHealingLoopRunning,
  bites,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'OUTPUT' | 'TRACES' | 'SHIELD' | 'BITES'>('OUTPUT');
  const [customCmd, setCustomCmd] = useState('');
  const [integrity, setIntegrity] = useState(() => verifyShieldIntegrity());
  const telemetry = getShieldTelemetry();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCmd.trim()) return;
    onRunCustomCommand(customCmd.trim());
    setCustomCmd('');
  };

  const hasCrash = lastExecutionResult?.crashed;

  return (
    <div className="fixed bottom-4 right-4 z-40 select-none">
      {/* Floating Pill when closed */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-lg text-xs font-medium transition-all ${
            hasCrash
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#FFFFFF] border-[#E8DFD5] text-[#57534E] hover:border-[#D6C8BA]'
          }`}
          title="Click to view background terminal execution logs"
        >
          <TerminalIcon className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span>Terminal Logs (Background)</span>
          {lastExecutionResult && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                hasCrash
                  ? 'bg-[#EF4444]/20 text-[#B91C1C]'
                  : 'bg-[#10B981]/20 text-[#047857]'
              }`}
            >
              Exit {lastExecutionResult.exitCode}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-[#8C827A]" />
        </button>
      ) : (
        /* Slide-up Background Logs Drawer */
        <div className="w-[580px] max-w-[calc(100vw-32px)] h-[360px] bg-[#FFFFFF] border border-[#E8DFD5] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Drawer Header Bar */}
          <div className="h-10 px-3 bg-[#FAF7F3] border-b border-[#EFE7DE] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setActiveTab('OUTPUT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'OUTPUT'
                    ? 'bg-[#FFFFFF] text-[#1C1917] font-semibold shadow-2xs border border-[#E8DFD5]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Output
              </button>

              <button
                onClick={() => setActiveTab('TRACES')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'TRACES'
                    ? 'bg-[#FFFFFF] text-[#1C1917] font-semibold shadow-2xs border border-[#E8DFD5]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Auto-Heal ({autoHealTraces.length})
              </button>

              <button
                onClick={() => setActiveTab('SHIELD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'SHIELD'
                    ? 'bg-[#FFFFFF] text-[#1C1917] font-semibold shadow-2xs border border-[#E8DFD5]'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Shield Logs
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#EFE8DE] transition-colors"
              title="Minimize drawer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Body Screen */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-[#FAF7F3] select-text">
            {activeTab === 'OUTPUT' && (
              <div className="space-y-1">
                {terminalLogs.map((log, i) => {
                  const isCrash = log.includes('CRASH') || log.includes('TypeError') || log.includes('BLOCKED');
                  const isSuccess = log.includes('EXIT CODE 0') || log.includes('PASSED');
                  return (
                    <div
                      key={i}
                      className={`leading-relaxed whitespace-pre-wrap ${
                        isCrash
                          ? 'text-[#DC2626] font-semibold'
                          : isSuccess
                          ? 'text-[#0D9488] font-semibold'
                          : log.startsWith('$')
                          ? 'text-[#E07A5F] font-bold'
                          : 'text-[#44403C]'
                      }`}
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'TRACES' && (
              <div className="space-y-2">
                {autoHealTraces.length === 0 ? (
                  <div className="text-center py-8 text-[#A8A29E] font-sans text-xs">
                    No auto-heal loop traces recorded yet. Click &quot;Auto-Heal (Codestral)&quot; to trigger.
                  </div>
                ) : (
                  autoHealTraces.map((trace) => (
                    <div key={trace.step} className="p-2 rounded-xl bg-[#FFFFFF] border border-[#EFE7DE]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[#E07A5F]">
                          Step #{trace.step} — {trace.phase}
                        </span>
                        <span className="text-[10px] text-[#A8A29E]">{trace.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#292524]">{trace.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'SHIELD' && (
              <div className="space-y-2">
                {/* Backend security layers — live posture, not decoration */}
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    integrity.intact
                      ? 'bg-[#F0FBF8] border-[#A3E4D7]'
                      : 'bg-[#FDEDEC] border-[#F5B7B1]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 font-semibold text-[#1C1917]">
                      {integrity.intact ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                      ) : (
                        <AlertOctagon className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
                      )}
                      <span>
                        KALI · SHELL · TERMINAL layers ACTIVE — LAYER 1 ledger{' '}
                        {integrity.intact ? 'verified' : 'FAULT'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#57534E] font-mono">
                      entries {integrity.entries} · head {integrity.headHash} · denials{' '}
                      {integrity.blockedCount} · contained {integrity.containedCount} · permits{' '}
                      {telemetry.permitsIssued} · AST bites {bites.length}
                    </p>
                    {integrity.intact ? (
                      <p className="mt-0.5 text-[11px] text-[#0F766E]">
                        Every entry is hash-chained to its predecessor — a bypassed check or a rewritten
                        record breaks this seal.
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-[#B91C1C]">{integrity.reason}</p>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => setIntegrity(verifyShieldIntegrity())}
                      className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E0D7CC] text-[11px] font-semibold text-[#1C1917] hover:bg-[#F2ECE3] transition-colors"
                    >
                      Re-verify chain
                    </button>
                    <button
                      onClick={onTriggerAutoHeal}
                      disabled={isHealingLoopRunning}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E07A5F] disabled:opacity-50 text-[11px] font-semibold text-[#FFFFFF] hover:bg-[#C9664B] transition-colors"
                      title="TERMINAL GPT supervises each run with its own single-use permit"
                    >
                      <Zap className="w-3 h-3" />
                      {isHealingLoopRunning ? 'Healing…' : 'Auto-Heal'}
                    </button>
                  </div>
                </div>

                {securityAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className={`p-2 rounded-xl border text-xs ${
                      audit.verdict === 'BLOCKED_SYSCALL'
                        ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                        : audit.verdict === 'SANDBOX_CONTAINED'
                        ? 'bg-[#FFF9E6] border-[#F9E79F]'
                        : 'bg-[#FFFFFF] border-[#EFE7DE]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1C1917]">
                        {audit.id}
                        <span className="ml-2 font-normal text-[#A8A29E] font-mono text-[10px]">
                          {audit.source} · hash {audit.contentHash}
                        </span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          audit.verdict === 'BLOCKED_SYSCALL'
                            ? 'bg-[#EF4444]/20 text-[#B91C1C]'
                            : audit.verdict === 'SANDBOX_CONTAINED'
                            ? 'bg-[#D97706]/15 text-[#B45309]'
                            : 'bg-[#10B981]/20 text-[#047857]'
                        }`}
                      >
                        {audit.verdict}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#57534E] mt-1">{audit.notes}</p>
                    {audit.threats.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {audit.threats.map((t) => (
                          <li key={t.ruleId} className="text-[10px] font-mono text-[#7C2D12]">
                            ▸ {t.ruleId} · {t.category} · {t.severity}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Command Prompt */}
          <form
            onSubmit={handleSubmit}
            className="h-9 px-3 bg-[#FFFFFF] border-t border-[#EFE7DE] flex items-center"
          >
            <span className="text-[#E07A5F] font-bold mr-2 text-xs font-mono">$</span>
            <input
              type="text"
              value={customCmd}
              onChange={(e) => setCustomCmd(e.target.value)}
              placeholder="node src/paymentProcessor.js"
              className="flex-1 bg-transparent text-[#1C1917] font-mono text-xs focus:outline-none"
            />
          </form>
        </div>
      )}
    </div>
  );
};
