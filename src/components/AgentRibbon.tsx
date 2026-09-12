import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { AGENTS, AgentId } from '../agents/agents';

interface AgentRibbonProps {
  activeAgent: AgentId;
  onSelectAgent: (agentId: AgentId) => void;
  shieldBlockedCount: number;
  onOpenSecurityModal: () => void;
}

export const AgentRibbon: React.FC<AgentRibbonProps> = ({
  activeAgent,
  onSelectAgent,
  shieldBlockedCount,
  onOpenSecurityModal,
}) => {
  const agents = Object.values(AGENTS);
  const active = AGENTS[activeAgent];

  return (
    <div className="glass-bar h-10 w-full border-b border-[#2d2d2d] flex items-center justify-between px-2 select-none shrink-0 relative z-20">
      {/* Agent selector tabs */}
      <div className="flex items-center space-x-1">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = agent.id === activeAgent;
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-mono font-bold tracking-wide transition-all duration-150 border ${
                isActive
                  ? 'bg-[#202020] border-transparent'
                  : 'bg-transparent border-transparent text-[#9699a3] hover:bg-[#202020] hover:text-[#f3f4f6]'
              }`}
              style={
                isActive
                  ? {
                      color: agent.accent,
                      borderColor: agent.accent + '55',
                      boxShadow: `0 0 16px ${agent.accent}22`,
                    }
                  : undefined
              }
              title={`${agent.name} — ${agent.tagline}`}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: isActive ? agent.accent : undefined }}
              />
              <span>{agent.name}</span>
              <span
                className={`hidden lg:inline text-[10px] font-normal uppercase ${
                  isActive ? '' : 'text-[#666b78]'
                }`}
                style={isActive ? { color: agent.accent + 'aa' } : undefined}
              >
                {agent.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: active agent tagline + security layer indicators */}
      <div className="flex items-center space-x-3">
        <div className="hidden xl:flex items-center space-x-2 text-[11px] font-mono text-[#9699a3]">
          <Sparkles className="w-3.5 h-3.5" style={{ color: active.accent }} />
          <span className="truncate max-w-[280px]">{active.tagline}</span>
        </div>

        <div className="hidden md:flex items-center space-x-1.5">
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1a2326] border border-[#00f2fe]/25 text-[10px] font-mono text-[#00f2fe]">
            <Lock className="w-3 h-3" />
            <span>INSIDE: LOCKED</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1a2119] border border-[#10b981]/25 text-[10px] font-mono text-[#10b981]">
            <CheckCircle2 className="w-3 h-3" />
            <span>OUTSIDE: JAILED</span>
          </span>
        </div>

        <button
          onClick={onOpenSecurityModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#202020] hover:bg-[#2d2d2d] border border-[#2d2d2d] text-xs font-mono transition-colors"
          title="Inspect Double-Layer Security Shield"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" />
          <span className="text-[#f3f4f6] hidden sm:inline">SECURITY LAYER</span>
          {shieldBlockedCount > 0 && (
            <span className="px-1 py-0.2 rounded bg-[#ff3b30]/20 border border-[#ff3b30] text-[#ff3b30] text-[10px] font-bold">
              {shieldBlockedCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
