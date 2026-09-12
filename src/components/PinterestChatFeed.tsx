import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Globe,
  Mic,
  Plus,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Code2,
  Bug,
} from 'lucide-react';
import { ChatMessage } from './MainChatPanel';
import { MistralModelId, MISTRAL_MODELS } from '../engine/mistralClient';
import { CodeBite } from '../engine/sovereignBiteEngine';
import { AGENTS, AgentId } from '../agents/agents';

interface PinterestChatFeedProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  activeModel: MistralModelId;
  onSelectModel: (model: MistralModelId) => void;
  onApplyBiteToEditor: (bite: CodeBite) => void;
  onApplyAllBites: (bites: CodeBite[]) => void;
  isStreaming: boolean;
  activeAgent: AgentId;
}

export const PinterestChatFeed: React.FC<PinterestChatFeedProps> = ({
  messages,
  onSendMessage,
  activeModel,
  onSelectModel,
  onApplyBiteToEditor,
  onApplyAllBites,
  isStreaming,
  activeAgent,
}) => {
  const [inputText, setInputText] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeSpec = MISTRAL_MODELS[activeModel] || MISTRAL_MODELS['codestral-latest'];
  const agent = AGENTS[activeAgent];

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden select-text">
      {/* Scrollable Conversation History */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl w-full mx-auto">
        {messages.map((msg) => {
          const isUser = msg.sender === 'USER';
          const isShield = msg.securityBlocked || msg.sender === 'SHIELD_SYSTEM';

          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'} animate-fade-in-up`}
            >
              {/* Sender label */}
              <div className="text-[11px] font-medium text-[#8C827A] px-2 flex items-center space-x-1.5">
                {isUser ? (
                  <span>You · {msg.timestamp}</span>
                ) : isShield ? (
                  <span className="text-[#FF3B30] font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Security Shield Firewall</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 font-semibold text-[#1C1917]">
                    <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                    <span>{activeSpec.displayName}</span>
                  </span>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[92%] shadow-xs transition-all ${
                  isUser
                    ? 'bg-[#EFE7DC] text-[#1C1917] font-medium'
                    : isShield
                    ? 'bg-[#FDF2F2] border border-[#F8D7DA] text-[#721C24]'
                    : 'bg-[#FFFFFF] border border-[#EFE7DE] text-[#292524] shadow-sm'
                }`}
              >
                {/* Shield Warning Banner if blocked */}
                {isShield && (
                  <div className="mb-2 p-2 rounded-xl bg-[#F8D7DA]/60 text-xs font-medium flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-[#721C24] shrink-0" />
                    <span>{msg.blockedReason || 'Destructive syscall or directory wipe blocked.'}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>

                {/* Token stats badge */}
                {msg.tokenMetrics && (
                  <div className="mt-2 pt-2 border-t border-[#F0EAE4] flex items-center space-x-3 text-[10px] text-[#A8A29E] font-mono">
                    <span>Tokens: {msg.tokenMetrics.total}</span>
                    {msg.tokenMetrics.latencyMs ? <span>· Latency: {msg.tokenMetrics.latencyMs}ms</span> : null}
                  </div>
                )}

                {/* AST Bites Decomposition Card if present */}
                {msg.bites && msg.bites.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#EFE7DE] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1C1917] flex items-center space-x-1.5">
                        <Bug className="w-3.5 h-3.5 text-[#E07A5F]" />
                        <span>AST Bite Decomposition ({msg.bites.length} Blocks)</span>
                      </span>
                      <button
                        onClick={() => onApplyAllBites(msg.bites!)}
                        className="px-2.5 py-1 rounded-full bg-[#E07A5F] text-[#FFFFFF] text-[10px] font-semibold hover:bg-[#C9664B] transition-colors"
                      >
                        Apply All Patches
                      </button>
                    </div>

                    {msg.bites.map((bite) => {
                      const isBugged = bite.status === 'BUG_ISOLATED';
                      return (
                        <div
                          key={bite.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isBugged
                              ? 'bg-[#FEF9E7] border-[#F9E79F]'
                              : 'bg-[#FAF6F1] border-[#EFE8DE]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[#1C1917]">
                              {bite.id} — Lines {bite.startLine}–{bite.endLine}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isBugged
                                  ? 'bg-[#D97706]/15 text-[#B45309]'
                                  : 'bg-[#0D9488]/15 text-[#0F766E]'
                              }`}
                            >
                              {bite.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#57534E]">{bite.diagnosis}</p>

                          {isBugged && (
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => onApplyBiteToEditor(bite)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E0D7CC] text-xs font-medium text-[#1C1917] hover:bg-[#F5EFE8]"
                              >
                                <span>Sync Patch to Editor</span>
                                <ArrowRight className="w-3 h-3 text-[#E07A5F]" />
                              </button>
                            </div>
                          )}
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
          <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EFE7DE] shadow-xs flex items-center space-x-2 text-xs text-[#E07A5F] font-medium max-w-sm animate-pulse-subtle">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{activeSpec.shortName} generating response…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sticky Bottom Floating Chat Input matching Pinterest Style */}
      <div className="p-4 bg-[#FAF6F0]/80 backdrop-blur-md border-t border-[#EFE7DE]">
        <div className="max-w-3xl mx-auto pinterest-hero-box p-3 bg-[#FFFFFF] flex flex-col space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={`Ask ${activeSpec.shortName}...`}
            className="w-full bg-transparent resize-none border-none text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none select-text"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1 text-[#8C827A]">
              <button
                type="button"
                onClick={() => onSendMessage('Analyze active code file')}
                className="p-1.5 rounded-full hover:bg-[#F5EFE8] hover:text-[#1C1917]"
                title="Attach workspace file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSendMessage('/scan dependencies')}
                className="p-1.5 rounded-full hover:bg-[#F5EFE8] hover:text-[#1C1917]"
                title="Scan dependencies"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Model Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#FAF6F0] hover:bg-[#F2ECE3] border border-[#E8DFD5] text-xs font-medium text-[#44403C]"
                >
                  <span>{activeSpec.shortName}</span>
                  <ChevronDown className="w-3 h-3 text-[#8C827A]" />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-60 bg-[#FFFFFF] border border-[#E8DFD5] rounded-2xl shadow-xl p-2 z-50 animate-fade-in-up">
                    <div className="space-y-1">
                      {Object.values(MISTRAL_MODELS).map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            onSelectModel(model.id);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl text-xs transition-colors ${
                            model.id === activeModel
                              ? 'bg-[#FAF6F0] font-semibold text-[#1C1917]'
                              : 'hover:bg-[#F5EFE8] text-[#57534E]'
                          }`}
                        >
                          {model.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!inputText.trim() || isStreaming}
                className="w-7 h-7 rounded-full bg-[#E07A5F] hover:bg-[#C9664B] disabled:bg-[#E8DFD5] text-[#FFFFFF] disabled:text-[#A8A29E] flex items-center justify-center transition-all disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
