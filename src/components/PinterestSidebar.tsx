import React, { useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  MessageSquare,
  FolderKanban,
  CheckSquare,
  ShieldHalf,
  ChevronDown,
  Download,
  FileCode,
} from 'lucide-react';
import { WorkspaceFile } from '../workspace/defaultFiles';
import { MistralModelId, MISTRAL_MODELS } from '../engine/mistralClient';
import { AgentId, AGENTS } from '../agents/agents';

export interface RecentChatItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  agentId?: AgentId;
  modelId?: MistralModelId;
}

export const INITIAL_RECENTS: RecentChatItem[] = [
  {
    id: 'recent-1',
    title: 'Neural architecture analysis',
    subtitle: 'Comparing transformer variants for seq...',
    timestamp: '10m ago',
    modelId: 'mistral-large-latest',
  },
  {
    id: 'recent-2',
    title: 'Build a React dashboard',
    subtitle: 'Full analytics dashboard with real-time...',
    timestamp: '1h ago',
    modelId: 'codestral-latest',
  },
  {
    id: 'recent-3',
    title: 'Explain quantum entanglement',
    subtitle: 'A simplified explanation for software...',
    timestamp: '3h ago',
    modelId: 'open-mistral-7b',
  },
  {
    id: 'recent-4',
    title: 'Product copy generator',
    subtitle: 'AI-powered marketing copy for SaaS...',
    timestamp: 'Yesterday',
    modelId: 'open-mistral-nemo',
  },
  {
    id: 'recent-5',
    title: 'Analyze my design aesthetic',
    subtitle: 'Visual analysis and recommendations...',
    timestamp: '2d ago',
    modelId: 'mistral-large-latest',
  },
];

interface PinterestSidebarProps {
  currentView: 'chats' | 'colab' | 'code' | 'agents' | 'tasks';
  onSelectView: (view: 'chats' | 'colab' | 'code' | 'agents' | 'tasks') => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  activeAgent: AgentId;
  onSelectAgent: (agentId: AgentId) => void;
  activeModel: MistralModelId;
  recents: RecentChatItem[];
  activeRecentId: string | null;
  onSelectRecent: (id: string) => void;
}

export const PinterestSidebar: React.FC<PinterestSidebarProps> = ({
  currentView,
  onSelectView,
  onNewChat,
  onOpenSettings,
  files,
  activeFileId,
  onSelectFile,
  activeAgent,
  onSelectAgent,
  activeModel,
  recents,
  activeRecentId,
  onSelectRecent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const filteredRecents = searchQuery
    ? recents.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recents;

  const NAV_ITEMS = [
    { key: 'chats' as const, label: 'Chats', icon: MessageSquare },
    { key: 'colab' as const, label: 'Projects', icon: FolderKanban },
    { key: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { key: 'agents' as const, label: 'Security Layers', icon: ShieldHalf },
    { key: 'code' as const, label: 'Code Studio', icon: FileCode },
  ];

  return (
    <aside className="w-[260px] h-full bg-[#FCFAF7] border-r border-[#EFE7DE] flex flex-col justify-between select-none shrink-0 transition-all duration-200">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col p-3 space-y-1">
        {/* + New chat button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#1C1917] hover:bg-[#F2ECE3] transition-colors"
        >
          <Plus className="w-4 h-4 text-[#78716C]" />
          <span>New chat</span>
        </button>

        {/* Search */}
        {isSearchActive ? (
          <div className="px-2 py-1">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setIsSearchActive(false)}
              placeholder="Search chats..."
              className="w-full bg-[#FFFFFF] border border-[#E0D7CC] rounded-lg px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none focus:border-[#E07A5F]"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsSearchActive(true)}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F2ECE3] hover:text-[#1C1917] transition-colors"
          >
            <Search className="w-4 h-4 text-[#78716C]" />
            <span>Search</span>
          </button>
        )}

        {/* Customize / Settings */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F2ECE3] hover:text-[#1C1917] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#78716C]" />
          <span>Customize</span>
        </button>

        <div className="h-px bg-[#EFE7DE] my-2" />

        {/* Navigation Categories */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectView(item.key)}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EFE7DC] text-[#1C1917] font-semibold shadow-xs'
                    : 'text-[#78716C] hover:bg-[#F5EFE8] hover:text-[#1C1917]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1C1917]' : 'text-[#8C827A]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-[#EFE7DE] my-2" />

        {/* BACKEND SECURITY LAYERS — chat console selector (these are enforcement
            layers, not conversational agents; picking one opens its verdict
            console, it does not change a model's persona) */}
        <div>
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A8A29E]">
              Security Layers
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#E8F8F5] text-[#0F766E] border border-[#A3E4D7]">
              {MISTRAL_MODELS[activeModel].shortName}
            </span>
          </div>
          <div className="space-y-0.5 mt-1">
            {Object.values(AGENTS).map((agent) => {
              const isActiveLayer = agent.id === activeAgent;
              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center space-x-2 transition-all ${
                    isActiveLayer
                      ? 'bg-[#FFFFFF] border border-[#E8DFD5] shadow-xs'
                      : 'hover:bg-[#F2ECE3] border border-transparent'
                  }`}
                  title={agent.tagline}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: agent.accent }}
                  />
                  <span className="text-xs font-medium text-[#1C1917]">{agent.name}</span>
                  <span className="ml-auto text-[9px] font-mono text-[#A8A29E]">
                    L{agent.layer}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[#EFE7DE] my-2" />

        {/* SANDBOX FILES — read-only listing; select to open in Code Studio */}
        <div>
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#A8A29E]">
            Sandbox Files
          </div>
          <div className="space-y-0.5 mt-1 max-h-[132px] overflow-y-auto pr-1">
            {files.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFile(f.id)}
                className={`w-full text-left px-3 py-1 rounded-lg text-[11px] font-mono truncate transition-colors ${
                  f.id === activeFileId
                    ? 'bg-[#EFE7DC] text-[#1C1917] font-semibold'
                    : 'text-[#78716C] hover:bg-[#F2ECE3] hover:text-[#1C1917]'
                }`}
                title={f.path}
              >
                {f.path}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#EFE7DE] my-2" />

        {/* RECENTS Section */}
        <div className="pt-1">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#A8A29E]">
            RECENTS
          </div>

          <div className="space-y-0.5 mt-1 overflow-y-auto max-h-[calc(100vh-420px)] pr-1">
            {filteredRecents.map((item) => {
              const isSelected = activeRecentId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectRecent(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#FFFFFF] border border-[#E8DFD5] shadow-xs text-[#1C1917]'
                      : 'hover:bg-[#F2ECE3] text-[#44403C]'
                  }`}
                >
                  <div className="text-xs font-medium truncate text-[#1C1917]">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#A8A29E] truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom User Profile Card */}
      <div className="p-3 border-t border-[#EFE7DE] bg-[#FAF6F1]">
        <div className="flex items-center justify-between p-1 rounded-xl hover:bg-[#F0E8DD] transition-colors cursor-pointer">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Dark Avatar Circle with 'SG' */}
            <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#FFFFFF] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              SG
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#1C1917] truncate">SG16 Developer</div>
              <div className="text-[10px] text-[#8C827A] truncate">developer@sg16.ai</div>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-[#8C827A]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="p-1 hover:text-[#1C1917]"
              title="Settings"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </aside>
  );
};
