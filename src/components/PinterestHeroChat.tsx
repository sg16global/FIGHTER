import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Globe,
  Mic,
  Plus,
  ArrowUp,
  ChevronDown,
  Code2,
  FileText,
  Zap,
  Sparkles,
  Search,
  Check,
  Shield,
  Bot,
  Play,
  RotateCcw,
} from 'lucide-react';
import { MistralModelId, MISTRAL_MODELS } from '../engine/mistralClient';
import { AgentId, AGENTS } from '../agents/agents';

interface PinterestHeroChatProps {
  onSendMessage: (prompt: string) => void;
  activeModel: MistralModelId;
  onSelectModel: (model: MistralModelId) => void;
  onTriggerAutoHeal: () => void;
  isHealingLoopRunning: boolean;
  onOpenSettings: () => void;
  activeAgent: AgentId;
  onSelectAgent: (agentId: AgentId) => void;
}

export const PinterestHeroChat: React.FC<PinterestHeroChatProps> = ({
  onSendMessage,
  activeModel,
  onSelectModel,
  onTriggerAutoHeal,
  isHealingLoopRunning,
  onOpenSettings,
  activeAgent,
  onSelectAgent,
}) => {
  const [inputText, setInputText] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, SG16 Developer';
    if (hour < 18) return 'Good afternoon, SG16 Developer';
    return 'Good evening, SG16 Developer';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
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

  const QUICK_START_CARDS = [
    {
      id: 'script',
      icon: Code2,
      iconColor: '#E07A5F',
      title: 'Write a script',
      description: 'Write a TypeScript script that fetches data from an API and processes it.',
      prompt: 'Write a complete TypeScript script that fetches transactions from a remote API, verifies signatures, and formats a clean summary ledger.',
    },
    {
      id: 'doc',
      icon: FileText,
      iconColor: '#D97706',
      title: 'Analyze document',
      description: 'Analyze this document and provide a comprehensive summary with key insights.',
      prompt: 'Analyze the current workspace files (paymentProcessor.js & authGateway.ts) and provide a comprehensive architectural security summary.',
    },
    {
      id: 'ideas',
      icon: Zap,
      iconColor: '#8B5CF6',
      title: 'Brainstorm ideas',
      description: 'Brainstorm 10 innovative product ideas for AI-powered tools in 2026.',
      prompt: 'Brainstorm 10 innovative product features for autonomous developer studios powered by Mistral Large and Codestral.',
    },
    {
      id: 'research',
      icon: Globe,
      iconColor: '#0D9488',
      title: 'Research topic',
      description: 'Provide a comprehensive research overview on quantum computing and its applications.',
      prompt: 'Provide a comprehensive technical overview of sliding window attention and Tekken tokenization across the Mistral family.',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-8 overflow-y-auto select-none">
      <div className="w-full max-w-2xl flex flex-col items-center space-y-6 animate-fade-in-up">
        {/* Pro Plan / Mistral Suite Pill */}
        <button
          onClick={onOpenSettings}
          className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8DFD5] text-xs font-medium text-[#78716C] shadow-2xs hover:border-[#D6C8BA] transition-all flex items-center space-x-1.5"
        >
          <span className="font-semibold text-[#1C1917]">Pro Plan</span>
          <span className="text-[#A8A29E]">·</span>
          <span className="text-[#E07A5F] font-semibold">Upgrade</span>
        </button>

        {/* Hero Greeting Typography */}
        <h1 className="text-3xl md:text-4xl font-heading font-semibold text-[#1C1917] tracking-tight text-center">
          {getGreeting()}
        </h1>

        {/* Central Floating White Chat Input Card */}
        <div className="w-full pinterest-hero-box p-4 flex flex-col space-y-3 bg-[#FFFFFF] relative">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="How can I help you today?"
            className="w-full bg-transparent resize-none border-none text-base text-[#1C1917] placeholder-[#A8A29E] focus:outline-none select-text leading-relaxed"
          />

          {/* Bottom Toolbar of Chat Box */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Action Icons (+, attachment, web, mic) */}
            <div className="flex items-center space-x-1 text-[#8C827A]">
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                className="p-1.5 rounded-full hover:bg-[#F5EFE8] hover:text-[#1C1917] transition-colors"
                title="Add context or file"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSendMessage('Analyze active workspace files')}
                className="p-1.5 rounded-full hover:bg-[#F5EFE8] hover:text-[#1C1917] transition-colors"
                title="Attach workspace context"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSendMessage('/recon workspace')}
                className="p-1.5 rounded-full hover:bg-[#F5EFE8] hover:text-[#1C1917] transition-colors"
                title="Run network recon / security check"
              >
                <Globe className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setInputText('How do the four Mistral models compare for software development?')}
                className="p-1.5 rounded-full hover:bg-[#F5EFE8] hover:text-[#1C1917] transition-colors"
                title="Voice input simulation"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Model Dropdown Selector & Send Arrow Button */}
            <div className="flex items-center space-x-2">
              {/* Premium Model Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#FAF6F0] hover:bg-[#F2ECE3] border border-[#E8DFD5] text-xs font-medium text-[#44403C] transition-all"
                >
                  <span>{activeSpec.shortName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8C827A]" />
                </button>

                {/* Dropdown Menu Popup */}
                {isModelDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-[#FFFFFF] border border-[#E8DFD5] rounded-2xl shadow-xl p-2 z-50 animate-fade-in-up">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
                      SELECT MISTRAL BRAIN
                    </div>
                    <div className="space-y-1 mt-1">
                      {Object.values(MISTRAL_MODELS).map((model) => {
                        const isSelected = model.id === activeModel;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              onSelectModel(model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-[#FAF6F0] text-[#1C1917] font-semibold'
                                : 'hover:bg-[#F5EFE8] text-[#57534E]'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-medium">{model.displayName}</div>
                              <div className="text-[10px] text-[#8C827A]">
                                {model.parameters} · {model.contextWindow}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#E07A5F]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Send Arrow Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-full bg-[#E07A5F] hover:bg-[#C9664B] disabled:bg-[#E8DFD5] text-[#FFFFFF] disabled:text-[#A8A29E] flex items-center justify-center transition-all shadow-xs disabled:cursor-not-allowed"
                title="Send Prompt"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* QUICK START 2x2 Grid matching Pinterest design */}
        <div className="w-full space-y-3 pt-2">
          <div className="text-left text-[11px] font-semibold uppercase tracking-wider text-[#A8A29E]">
            QUICK START
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {QUICK_START_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => onSendMessage(card.prompt)}
                  className="pinterest-card p-4 text-left flex items-start space-x-3.5 group cursor-pointer hover:border-[#D6C8BA] transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: card.iconColor + '18',
                      color: card.iconColor,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-semibold text-[#1C1917] group-hover:text-[#E07A5F] transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-[11px] text-[#78716C] leading-snug mt-1 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Autonomous Option 2 Auto-Heal Quick Card */}
          <div className="pt-1">
            <button
              onClick={onTriggerAutoHeal}
              disabled={isHealingLoopRunning}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#FAF0E6] to-[#F7EBE1] border border-[#ECDCCF] hover:border-[#DECBB9] text-left flex items-center justify-between transition-all group shadow-2xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1C1917] group-hover:text-[#E07A5F] transition-colors">
                    {isHealingLoopRunning ? 'Auto-Healer Running...' : 'Option 2: Autonomous AST Auto-Heal Loop'}
                  </div>
                  <div className="text-[11px] text-[#8C827A]">
                    Slices paymentProcessor.js into AST Bites and repairs null pointers with Codestral.
                  </div>
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E8DFD5] text-xs font-semibold text-[#E07A5F]">
                {isHealingLoopRunning ? 'Healing...' : 'Run Auto-Heal'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
