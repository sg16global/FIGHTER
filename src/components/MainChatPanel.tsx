import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Cpu,
  ShieldAlert,
  Bug,
  Zap,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Terminal as TerminalIcon,
  PanelLeftClose,
} from 'lucide-react';
import { CodeBite, parseCodeIntoBites } from '../engine/sovereignBiteEngine';
import { MistralModelId, MISTRAL_MODELS } from '../engine/mistralClient';
import {
  AGENTS,
  AgentId,
  AgentResponse,
  KaliReport,
  Severity,
  ShellTranslation,
  TerminalRun,
} from '../agents/agents';

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'SOVEREIGN_AI' | 'SHIELD_SYSTEM';
  timestamp: string;
  text: string;
  agentId?: AgentId;
  bites?: CodeBite[];
  agentResponse?: AgentResponse;
  securityBlocked?: boolean;
  blockedReason?: string;
  /** RULE 3 proactive-safeguard channel (advisory only — never a security verdict). */
  advisory?: {
    prompt: string;
    alternative: string;
    gateway?: boolean;
  };
  targetFileId?: string;
  targetFilePath?: string;
  tokenMetrics?: {
    prompt: number;
    completion: number;
    total: number;
    latencyMs?: number;
  };
}

interface MainChatPanelProps {
  activeModel: MistralModelId;
  activeAgent: AgentId;
  activeFilePath: string;
  activeFileContent: string;
  messages: ChatMessage[];
  onSendMessage: (userText: string) => void;
  onApplyBiteToEditor: (bite: CodeBite) => void;
  onApplyAllBites: (bites: CodeBite[]) => void;
  onTriggerAutoHealLoop: () => void;
  isStreaming: boolean;
  onCollapse?: () => void;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICAL: '#ff3b30',
  HIGH: '#ff9f1c',
  MEDIUM: '#ffb020',
  LOW: '#00f2fe',
  INFO: '#9699a3',
};

const AgentResponseView: React.FC<{ response: AgentResponse }> = ({ response }) => {
  if (response.type === 'kali') {
    const report = response as KaliReport;
    return (
      <div className="mt-3 space-y-2 pt-2 border-t border-[#2d2d2d]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ff4d5e]">
            KALI GPT // SECURITY REPORT
          </span>
          <span className="text-[10px] font-mono text-[#9699a3]">SCOPE: {report.scope}</span>
        </div>
        <p className="text-[11px] text-[#9699a3]">{report.summary}</p>

        {report.findings.map((finding, idx) => (
          <div
            key={idx}
            className="rounded border bg-[#121212] p-2.5"
            style={{ borderColor: SEVERITY_COLOR[finding.severity] + '44' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-[#f3f4f6]">{finding.title}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                style={{
                  color: SEVERITY_COLOR[finding.severity],
                  background: SEVERITY_COLOR[finding.severity] + '1f',
                }}
              >
                {finding.severity}
              </span>
            </div>
            <p className="text-[11px] text-[#9699a3]">{finding.description}</p>
            <p className="text-[11px] text-[#00f2fe] mt-1 font-mono">
              ▸ {finding.remediation}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (response.type === 'shell') {
    const shell = response as ShellTranslation;
    return (
      <div className="mt-3 space-y-2 pt-2 border-t border-[#2d2d2d]">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ffb020]">
          SHELL GPT // TRANSLATION
        </span>
        <div className="text-[11px] text-[#9699a3]">
          <span className="text-[#f3f4f6] font-semibold">Intent:</span> {shell.intent}
        </div>
        <pre className="p-2.5 rounded bg-[#0d0d0e] border border-[#2d2d2d] text-[11px] font-mono text-[#b8e986] overflow-x-auto whitespace-pre-wrap">
          {shell.command}
        </pre>
        <p className="text-[11px] text-[#9699a3] leading-relaxed">{shell.explanation}</p>
        <div className="flex items-start space-x-1.5 p-2 rounded bg-[#1a2119] border border-[#10b981]/25">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0 mt-0.5" />
          <span className="text-[11px] text-[#10b981] font-mono">{shell.securityNote}</span>
        </div>
      </div>
    );
  }

  const run = response as TerminalRun;
  const crashed = run.exitCode !== 0;
  return (
    <div className="mt-3 space-y-2 pt-2 border-t border-[#2d2d2d]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00f2fe]">
          TERMINAL GPT // EXECUTION
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
          style={{
            color: crashed ? '#ff3b30' : '#10b981',
            background: crashed ? '#ff3b301f' : '#10b9811f',
          }}
        >
          EXIT {run.exitCode}
        </span>
      </div>
      <pre className="p-2.5 rounded bg-[#0d0d0e] border border-[#2d2d2d] text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
        <span className="text-[#00f2fe]">$ {run.command}</span>
        {'\n'}
        {run.output.map((line, i) => (
          <div
            key={i}
            className={line.includes('TypeError') || line.includes('CRASH') ? 'text-[#ff3b30]' : 'text-[#f3f4f6]'}
          >
            {line}
          </div>
        ))}
      </pre>
      <div className="flex items-center space-x-1.5">
        <TerminalIcon className="w-3.5 h-3.5 text-[#00f2fe]" />
        <span className="text-[11px] font-mono text-[#9699a3]">Verdict: {run.verdict}</span>
      </div>
    </div>
  );
};

export const MainChatPanel: React.FC<MainChatPanelProps> = ({
  activeModel,
  activeAgent,
  activeFilePath,
  activeFileContent,
  messages,
  onSendMessage,
  onApplyBiteToEditor,
  onApplyAllBites,
  onTriggerAutoHealLoop,
  isStreaming,
  onCollapse,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const agent = AGENTS[activeAgent];
  const modelSpec = MISTRAL_MODELS[activeModel] || MISTRAL_MODELS['codestral-latest'];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isStreaming) return;
    onSendMessage(inputPrompt);
    setInputPrompt('');
  };

  const currentBitesPreview = parseCodeIntoBites(activeFileContent, activeFilePath);

  const QUICK_PROMPTS = [
    ...agent.quickPrompts,
    {
      label: 'TEST DOUBLE-LAYER SHIELD (rm -rf /)',
      prompt: 'rm -rf / --no-preserve-root',
    },
  ];

  return (
    <section className="workspace-chat h-full border-r border-[#2d2d2d] flex flex-col select-text">
      {/* Header Bar */}
      <div className="glass-bar h-10 px-3 border-b border-[#2d2d2d] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-2 min-w-0">
          <agent.icon className="w-3.5 h-3.5 shrink-0" style={{ color: agent.accent }} />
          <span
            className="font-heading font-bold text-xs tracking-wider uppercase whitespace-nowrap"
            style={{ color: agent.accent }}
          >
            {agent.name}
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-[#666b78] truncate">
            {agent.codename}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#202020] border border-[#2d2d2d] text-[#00f2fe]">
            CTX: {activeFilePath.split('/').pop()}
          </span>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1 rounded text-[#9699a3] hover:text-[#00f2fe] hover:bg-[#202020] transition-all duration-200"
              title="Hide Conversation panel"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Model Spec & Bite Inspector Live Banner */}
      <div className="px-3 py-2 bg-[#202020] border-b border-[#2d2d2d] flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          <Bug className="w-3.5 h-3.5 text-[#ff9f1c]" />
          <span className="text-xs font-mono text-[#9699a3]">
            ACTIVE AST BITES: <strong className="text-[#00f2fe]">{currentBitesPreview.length} CHUNKS</strong>
          </span>
          <span className="hidden xl:inline text-[10px] font-mono text-[#666b78]">
            ({modelSpec.shortName} · {modelSpec.parameters})
          </span>
        </div>

        <button
          onClick={onTriggerAutoHealLoop}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-[#00f2fe]/15 hover:bg-[#00f2fe]/25 border border-[#00f2fe]/40 text-[#00f2fe] text-[11px] font-mono font-bold transition-colors"
        >
          <Zap className="w-3 h-3" />
          <span>RUN AUTO-HEAL LOOP</span>
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';
          const isShieldBlocked = msg.securityBlocked || msg.sender === 'SHIELD_SYSTEM';
          const msgAgent = msg.agentId ? AGENTS[msg.agentId] : null;

          return (
            <div
              key={msg.id}
              className={`bubble-enter flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Sender label */}
              <div className="flex items-center space-x-2 text-[11px] font-mono text-[#9699a3] px-1">
                {isUser ? (
                  <span>OPERATOR PROMPT // {msg.timestamp}</span>
                ) : isShieldBlocked ? (
                  <span className="text-[#ff3b30] font-bold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>DOUBLE-LAYER SECURITY SHIELD FIREWALL</span>
                  </span>
                ) : msgAgent ? (
                  <span
                    className="font-bold flex items-center space-x-1"
                    style={{ color: msgAgent.accent }}
                  >
                    <msgAgent.icon className="w-3 h-3" />
                    <span>{msgAgent.name} // {modelSpec.displayName}</span>
                  </span>
                ) : (
                  <span className="text-[#00f2fe] font-bold flex items-center space-x-1">
                    <Cpu className="w-3 h-3" />
                    <span>{modelSpec.displayName}</span>
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[94%] rounded-xl p-3 text-xs leading-relaxed shadow-[0_4px_16px_rgba(0,0,0,0.45)] ${
                  isUser
                    ? 'bg-gradient-to-b from-[#233047] to-[#1b2233] border border-[#00f2fe]/30 text-[#f3f4f6]'
                    : isShieldBlocked
                    ? 'bg-gradient-to-b from-[#26141a] to-[#1c1013] border border-[#ff3b30]/70 text-[#f3f4f6] shadow-[0_0_24px_rgba(255,59,48,0.18)]'
                    : 'bg-gradient-to-b from-[#1e2029] to-[#181a21] border border-white/[0.07] text-[#f3f4f6]'
                }`}
              >
                {/* Security Block Alert Banner if triggered */}
                {isShieldBlocked && (
                  <div className="mb-2 p-2 rounded bg-[#ff3b30]/15 border border-[#ff3b30]/40 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-[#ff3b30] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-[#ff3b30] text-xs">
                        INSIDE BOUNDARY SYSCALL INTERCEPTED
                      </p>
                      <p className="text-[11px] text-[#9699a3] mt-0.5">
                        {msg.blockedReason ||
                          'Malicious destructive command or directory wipe blocked before host kernel access.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>

                {/* Token usage metric pill */}
                {msg.tokenMetrics && (
                  <div className="mt-2 pt-1 border-t border-white/[0.06] flex items-center space-x-2 text-[10px] font-mono text-[#666b78]">
                    <span>Tokens: {msg.tokenMetrics.total}</span>
                    {msg.tokenMetrics.latencyMs ? <span>· Latency: {msg.tokenMetrics.latencyMs}ms</span> : null}
                  </div>
                )}

                {/* Agent-specific response payload */}
                {msg.agentResponse && <AgentResponseView response={msg.agentResponse} />}

                {/* Bite Mechanism AST Deconstruction Cards */}
                {msg.bites && msg.bites.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-[#2d2d2d]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[#00f2fe] font-bold uppercase tracking-wider">
                        BITE / PROCESSING MECHANISM DECOMPOSITION
                      </span>
                      <button
                        onClick={() => onApplyAllBites(msg.bites!)}
                        className="px-2 py-0.5 rounded bg-[#00f2fe] text-[#0d0e12] text-[10px] font-mono font-bold hover:bg-[#4facfe] transition-colors"
                      >
                        APPLY ALL HEALED BITES
                      </button>
                    </div>

                    {msg.bites.map((bite) => {
                      const isBugged = bite.status === 'BUG_ISOLATED';
                      return (
                        <div
                          key={bite.id}
                          className={`rounded p-2.5 border transition-all ${
                            isBugged
                              ? 'bg-[#1f171a] border-[#ff9f1c] glow-amber'
                              : 'bg-[#121212] border-[#2d2d2d]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2d2d2d] text-[#00f2fe]">
                                {bite.id}
                              </span>
                              <span className="font-mono text-xs font-semibold text-[#f3f4f6]">
                                Lines {bite.startLine}–{bite.endLine}
                              </span>
                            </div>

                            {isBugged ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff9f1c]/20 text-[#ff9f1c]">
                                CRASH ISOLATED
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10b981]/20 text-[#10b981]">
                                VERIFIED SAFE
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#9699a3] mb-2">{bite.diagnosis}</p>

                          {isBugged && (
                            <div className="mb-2 p-2 rounded bg-[#0d0d0e] border border-[#2d2d2d] font-mono text-[11px] overflow-x-auto">
                              <div className="text-[#ff3b30] line-through opacity-80">
                                - const total = payload.amount * payload.rate;
                              </div>
                              <div className="text-[#10b981] mt-1">
                                + if (!payload || typeof payload.amount !== &apos;number&apos;) throw new TypeError(...)
                              </div>
                              <div className="text-[#10b981]">
                                + const total = Number((payload.amount * (payload.rate ?? 1.0)).toFixed(4));
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-mono text-[#9699a3]">
                              Complexity Score: {bite.complexityScore}/100
                            </span>
                            {bite.originalSnippet !== bite.healedSnippet && (
                              <button
                                onClick={() => onApplyBiteToEditor(bite)}
                                className="flex items-center space-x-1 px-2 py-1 rounded bg-[#ff9f1c]/20 hover:bg-[#ff9f1c]/30 border border-[#ff9f1c]/50 text-[#ff9f1c] text-[11px] font-mono font-bold transition-colors"
                              >
                                <span>SYNC BITE TO EDITOR</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="shimmer rounded-lg border border-white/[0.06] flex items-center space-x-2 text-xs font-mono text-[#00f2fe] p-2.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span style={{ color: agent.accent }}>
              {agent.name} DECOMPOSING BITES &amp; RUNNING {modelSpec.shortName.toUpperCase()} INFERENCE...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Sovereign Prompt Chips */}
      <div className="px-3 py-2 border-t border-[#2d2d2d] bg-[#181818] space-y-1.5 select-none">
        <span className="text-[10px] font-mono text-[#9699a3] uppercase block">
          {agent.name} COMMANDS:
        </span>
        <div className="flex flex-col space-y-1">
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(item.prompt)}
              className="text-left px-2.5 py-1.5 rounded bg-[#202020] hover:bg-[#2d2d2d] border border-[#2d2d2d] text-xs font-mono text-[#f3f4f6] transition-colors truncate"
            >
              <span style={{ color: agent.accent }}>▸ </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Prompt Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#2d2d2d] bg-[#18191b]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask ${agent.name} or type a command... (${modelSpec.shortName})`}
            className="w-full bg-[#121212] border border-[#2d2d2d] focus:border-[#00f2fe] focus:shadow-[0_0_0_2px_rgba(0,242,254,0.12),0_0_18px_rgba(0,242,254,0.12)] rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-[#f3f4f6] placeholder-[#9699a3] focus:outline-none transition-all duration-150"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isStreaming}
            className="absolute right-1.5 p-1.5 rounded-md text-[#0d0e12] disabled:opacity-40 transition-colors"
            style={{ background: agent.accent }}
            title={`Send ${agent.name} prompt`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </section>
  );
};
