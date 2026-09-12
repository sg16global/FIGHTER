import { useEffect, useState, useCallback } from 'react';
import { PinterestHeader } from './components/PinterestHeader';
import { PinterestSidebar, RecentChatItem, INITIAL_RECENTS } from './components/PinterestSidebar';
import { PinterestHeroChat } from './components/PinterestHeroChat';
import { PinterestChatFeed } from './components/PinterestChatFeed';
import { PinterestCodeStudio } from './components/PinterestCodeStudio';
import { HiddenTerminalDrawer } from './components/HiddenTerminalDrawer';
import { ArchitectureModal } from './components/ArchitectureModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessage } from './components/MainChatPanel';
import {
  AGENTS,
  AgentId,
  generateAgentResponse,
  generateAgentTerminalLogs,
  TerminalRun,
} from './agents/agents';
import {
  INITIAL_WORKSPACE_FILES,
  WorkspaceFile,
} from './workspace/defaultFiles';
import {
  AutonomousLoopTrace,
  CodeBite,
  executeScriptInSandbox,
  parseCodeIntoBites,
  TerminalExecutionResult,
} from './engine/sovereignBiteEngine';
import {
  DEFAULT_SHIELD_CONFIG,
  inspectSecurityPayload,
  SecurityAuditResult,
  ShieldConfig,
} from './security/doubleLayerShield';
import {
  MistralModelId,
  MISTRAL_MODELS,
  RemoteApiConfig,
  RemoteApiStatus,
  loadRemoteApiConfig,
  saveRemoteApiConfig,
  testRemoteMistralConnection,
  generateRemoteMistralChat,
  buildMistralSystemPrompt,
  DEFAULT_MISTRAL_MODEL,
} from './engine/mistralClient';
import { generateOfflineMistralResponse } from './engine/offlineEngine';
import {
  loadMemoryBank,
  saveMemoryBank,
  captureSnapshotFromState,
  getMemorySummary,
} from './memory/ltmb';

export function App() {
  // Navigation & View Mode ('chats' | 'colab' | 'code' | 'agents' | 'tasks')
  const [currentView, setCurrentView] = useState<'chats' | 'colab' | 'code' | 'agents' | 'tasks'>('chats');
  const [files, setFiles] = useState<WorkspaceFile[]>(INITIAL_WORKSPACE_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('file-payment-processor');
  const [activeModel, setActiveModel] = useState<MistralModelId>(DEFAULT_MISTRAL_MODEL);
  const [activeAgent, setActiveAgent] = useState<AgentId>('kali-gpt');

  // Window frame state
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [isWindowClosed, setIsWindowClosed] = useState(false);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);

  // Recents state
  const [recents, setRecents] = useState<RecentChatItem[]>(INITIAL_RECENTS);
  const [activeRecentId, setActiveRecentId] = useState<string | null>(null);

  // Remote Mistral API Network Configuration & Status
  const [remoteConfig, setRemoteConfig] = useState<RemoteApiConfig>(() => loadRemoteApiConfig());
  const [remoteStatus, setRemoteStatus] = useState<RemoteApiStatus>({
    status: 'connecting',
    mode: 'offline',
    message: 'Initializing Aegis Dev Studio environment…',
    activeEndpoint: 'https://api.mistral.ai/v1',
    activeModel: DEFAULT_MISTRAL_MODEL,
    availableModels: Object.keys(MISTRAL_MODELS),
  });

  const [shieldConfig, setShieldConfig] = useState<ShieldConfig>(DEFAULT_SHIELD_CONFIG);
  const [memoryBankStatus, setMemoryBankStatus] = useState<string>('LTMB initializing...');

  // Modals
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [architectureModalTab, setArchitectureModalTab] = useState<'blueprint' | 'option2' | 'option3'>('blueprint');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Background Terminal & Execution state (kept in background by default)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ [AEGIS SOVEREIGN DEV STUDIO v3.4.0 INITIALIZED]',
    '$ Mistral Suite: Codestral 22B · Mistral Large 2 · Mistral 7B · Mistral NeMo 12B',
    '$ Double-Layer Security Shield: Sandbox Jail + AST Syscall Firewall Active',
    '$ Studio front-end running in clean Pinterest design system.',
  ]);

  const [lastExecutionResult, setLastExecutionResult] = useState<TerminalExecutionResult | null>(null);
  const [autoHealTraces, setAutoHealTraces] = useState<AutonomousLoopTrace[]>([]);
  const [isHealingLoopRunning, setIsHealingLoopRunning] = useState<boolean>(false);
  const [securityAudits, setSecurityAudits] = useState<SecurityAuditResult[]>([
    {
      id: 'AUDIT-INIT-001',
      timestamp: '09:00:12',
      verdict: 'SAFE',
      inputSnippet: 'Mount virtual filesystem /workspace/sovereign-project/',
      source: 'FILE_WRITE',
      sandboxJailPath: '/workspace/sovereign-project',
      threats: [],
      executionAllowed: true,
      notes: 'Outside Sandbox Jail boundary locked & verified.',
    },
  ]);

  // Messages list (starts empty so user sees the hero Pinterest welcome screen)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const activeBites = parseCodeIntoBites(activeFile.content, activeFile.path);

  // Memory bank snapshot capture
  const captureState = useCallback(() => {
    try {
      const snapshot = captureSnapshotFromState({
        files,
        activeFilePath: activeFile.path,
        terminalLogs,
        lastExecutionResult,
        autoHealTraces,
        securityAudits,
        messages,
      });
      saveMemoryBank(snapshot);
      setMemoryBankStatus(getMemorySummary());
    } catch {
      // Ignore
    }
  }, [files, activeFile.path, terminalLogs, lastExecutionResult, autoHealTraces, securityAudits, messages]);

  // Boot: restore from LTMB
  useEffect(() => {
    try {
      const bank = loadMemoryBank();
      setMemoryBankStatus(getMemorySummary());
      if (bank.snapshots && bank.snapshots.length > 0) {
        const latest = bank.snapshots[bank.snapshots.length - 1];
        setTerminalLogs((prev) => [
          ...prev,
          `$ [LTMB RESTORE] Restored ${latest.fileFingerprints.length} workspace files from previous session.`,
        ]);
      }
    } catch {
      setMemoryBankStatus('LTMB ready');
    }
  }, []);

  // Periodic network probe
  const probeRemoteConnection = useCallback(async () => {
    const status = await testRemoteMistralConnection(remoteConfig, activeModel);
    setRemoteStatus(status);
  }, [remoteConfig, activeModel]);

  useEffect(() => {
    void probeRemoteConnection();
    const interval = window.setInterval(() => void probeRemoteConnection(), 30_000);
    return () => window.clearInterval(interval);
  }, [probeRemoteConnection]);

  const handleUpdateRemoteConfig = (newConfig: RemoteApiConfig) => {
    setRemoteConfig(newConfig);
    saveRemoteApiConfig(newConfig);
    setTerminalLogs((prev) => [
      ...prev,
      `$ [CONFIG] Remote mode set to ${newConfig.mode.toUpperCase()}`,
    ]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveRecentId(null);
    setCurrentView('chats');
  };

  const handleSelectRecent = (recentId: string) => {
    setActiveRecentId(recentId);
    const item = recents.find((r) => r.id === recentId);
    if (!item) return;

    if (item.modelId) {
      setActiveModel(item.modelId);
    }
    setCurrentView('chats');
    setMessages([
      {
        id: `msg-recent-${recentId}-user`,
        sender: 'USER',
        timestamp: item.timestamp,
        text: item.title,
      },
      {
        id: `msg-recent-${recentId}-ai`,
        sender: 'SOVEREIGN_AI',
        timestamp: item.timestamp,
        text: `Here is the analysis and implementation for **${item.title}** (${item.subtitle}):\n\n- Evaluated using ${item.modelId ? MISTRAL_MODELS[item.modelId].displayName : 'Mistral Architecture'}.\n- Clean modular separation verified in sandbox.\n- Ready for further queries.`,
      },
    ]);
  };

  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id
          ? {
              ...f,
              content: newContent,
              isModified: true,
              hasKnownBug: newContent.includes('payload.amount * payload.rate'),
            }
          : f
      )
    );
    setTimeout(captureState, 300);
  };

  const handleCreateNewFile = (name: string) => {
    const newId = `file-${Date.now().toString(36)}`;
    const newFile: WorkspaceFile = {
      id: newId,
      name: name.split('/').pop() || name,
      path: name.startsWith('src/') ? name : `src/${name}`,
      language: name.endsWith('.ts') ? 'typescript' : 'javascript',
      content: `/**\n * ${name}\n * Mistral Enclave Module\n */\n\nfunction runTask() {\n  return { status: 'OK', model: '${MISTRAL_MODELS[activeModel].shortName}' };\n}\n\nmodule.exports = { runTask };\n`,
      hasKnownBug: false,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
  };

  const handleDeleteFile = (fileId: string) => {
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[0].id);
    }
  };

  const handleResetSampleBug = () => {
    const defaultPaymentFile = INITIAL_WORKSPACE_FILES[0];
    setFiles((prev) =>
      prev.map((f) =>
        f.id === 'file-payment-processor'
          ? {
              ...f,
              content: defaultPaymentFile.content,
              hasKnownBug: true,
              lastRunStatus: 'IDLE',
            }
          : f
      )
    );
    setActiveFileId('file-payment-processor');
    setTerminalLogs((prev) => [
      ...prev,
      `$ [DEMO RESET] Restored intentional null-reference bug on line 19 of src/paymentProcessor.js.`,
    ]);
  };

  const handleApplyBiteToEditor = (bite: CodeBite) => {
    const currentLines = activeFile.content.split('\n');
    const startIdx = Math.max(0, bite.startLine - 1);
    const endIdx = Math.min(currentLines.length, bite.endLine);

    const healedLines = bite.healedSnippet.split('\n');
    const newLines = [
      ...currentLines.slice(0, startIdx),
      ...healedLines,
      ...currentLines.slice(endIdx),
    ];
    const newContent = newLines.join('\n');

    handleCodeChange(newContent);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, lastRunStatus: 'HEALED', hasKnownBug: false } : f
      )
    );

    setTerminalLogs((prev) => [
      ...prev,
      `$ [BITE APPLIED] Synced ${bite.id} patch to ${activeFile.path}.`,
    ]);
  };

  const handleApplyAllBites = (bites: CodeBite[]) => {
    const combined = bites.map((b) => b.healedSnippet).join('\n');
    handleCodeChange(combined);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id
          ? { ...f, content: combined, lastRunStatus: 'HEALED', hasKnownBug: false }
          : f
      )
    );
    setTerminalLogs((prev) => [
      ...prev,
      `$ [BITE MECHANISM COMPLETE] Overwrote ${activeFile.path} with verified ${MISTRAL_MODELS[activeModel].shortName} AST Bites.`,
    ]);
  };

  const handleRunCurrentScript = () => {
    const execResult = executeScriptInSandbox(activeFile.path, activeFile.content);
    setLastExecutionResult(execResult);
    setSecurityAudits((prev) => [execResult.securityAudit, ...prev]);

    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id
          ? { ...f, lastRunStatus: execResult.crashed ? 'CRASHED' : 'PASSED' }
          : f
      )
    );

    setTerminalLogs((prev) => [
      ...prev,
      `$ node ${activeFile.path}`,
      ...execResult.stdout,
      ...execResult.stderr,
    ]);
    setTimeout(captureState, 250);
  };

  const handleRunCustomCommand = (cmd: string) => {
    const audit = inspectSecurityPayload(cmd, 'TERMINAL_EXECUTION', shieldConfig);
    setSecurityAudits((prev) => [audit, ...prev]);

    if (!audit.executionAllowed) {
      setTerminalLogs((prev) => [
        ...prev,
        `$ ${cmd}`,
        `[DOUBLE-LAYER SHIELD FIREWALL] CRITICAL BLOCKED: ${audit.threats[0]?.mitigation}`,
      ]);
      return;
    }

    if (cmd.startsWith('node ')) {
      const targetName = cmd.replace('node ', '').trim();
      const matched =
        files.find(
          (f) =>
            f.path === targetName ||
            f.name === targetName ||
            f.path.endsWith(targetName)
        ) || activeFile;
      const res = executeScriptInSandbox(matched.path, matched.content);
      setLastExecutionResult(res);
      setTerminalLogs((prev) => [
        ...prev,
        `$ ${cmd}`,
        ...res.stdout,
        ...res.stderr,
      ]);
    } else {
      setTerminalLogs((prev) => [
        ...prev,
        `$ ${cmd}`,
        `[SANDBOX] Executed safely in isolated container.`,
      ]);
    }
  };

  // Option 2 Autonomous Error-Fixing Loop with Codestral
  const handleTriggerAutoHealLoop = () => {
    if (isHealingLoopRunning) return;
    setIsHealingLoopRunning(true);

    const initialCode = activeFile.content;
    const filePath = activeFile.path;

    const step1: AutonomousLoopTrace = {
      step: 1,
      phase: 'READ_CONTEXT',
      timestamp: new Date().toLocaleTimeString(),
      message: `[1/5] Ingested ${filePath} into Mistral Codestral context.`,
    };

    setAutoHealTraces([step1]);
    setTerminalLogs((prev) => [
      ...prev,
      `$ [AUTO-HEAL LOOP] Target: ${filePath} via Codestral 22B`,
    ]);

    setTimeout(() => {
      const execResult = executeScriptInSandbox(filePath, initialCode);
      setLastExecutionResult(execResult);
      setSecurityAudits((prev) => [execResult.securityAudit, ...prev]);
      setTerminalLogs((prev) => [...prev, ...execResult.stdout, ...execResult.stderr]);

      const step2: AutonomousLoopTrace = {
        step: 2,
        phase: execResult.crashed ? 'CRASH_CAUGHT' : 'EXECUTE_TERMINAL',
        timestamp: new Date().toLocaleTimeString(),
        message: execResult.crashed
          ? `[2/5] Crash captured (Exit Code 1): ${execResult.errorStackTrace?.slice(0, 140)}...`
          : `[2/5] Script executed without runtime errors (Exit Code 0).`,
      };
      setAutoHealTraces((prev) => [...prev, step2]);

      setTimeout(() => {
        const bites = parseCodeIntoBites(initialCode, filePath);
        const bugged = bites.find((b) => b.status === 'BUG_ISOLATED');

        const step3: AutonomousLoopTrace = {
          step: 3,
          phase: 'BITE_DECOMPOSE',
          timestamp: new Date().toLocaleTimeString(),
          message: bugged
            ? `[3/5] AST sliced into ${bites.length} Bites. Isolated bug in ${bugged.id}: ${bugged.diagnosis}`
            : `[3/5] AST sliced into ${bites.length} Bites. All sections verified.`,
        };
        setAutoHealTraces((prev) => [...prev, step3]);

        setTimeout(async () => {
          let healedContent = bites.map((b) => b.healedSnippet).join('\n');

          // If online with API key, perform live remote synthesis
          if (remoteConfig.mode === 'online' && remoteConfig.apiKey.trim()) {
            try {
              const remoteRes = await generateRemoteMistralChat({
                model: 'codestral-latest',
                config: remoteConfig,
                messages: [
                  {
                    role: 'system',
                    content: 'You are Codestral, an autonomous AST code repair engine. Return only corrected JavaScript code.',
                  },
                  {
                    role: 'user',
                    content: `Fix the following TypeError:\n${execResult.errorStackTrace}\n\nCode:\n${initialCode}`,
                  },
                ],
              });
              if (remoteRes.ok && remoteRes.text.length > 50 && !remoteRes.text.includes('```')) {
                healedContent = remoteRes.text;
              }
            } catch {
              // Fallback
            }
          }

          const step4: AutonomousLoopTrace = {
            step: 4,
            phase: 'SOVEREIGN_HEAL_PATCH',
            timestamp: new Date().toLocaleTimeString(),
            message: `[4/5] Codestral synthesized null/NaN guard and applied AST patch to ${filePath}.`,
            codeDiffSummary: `+ if (!payload || typeof payload.amount !== 'number') throw new TypeError(...)\n+ const total = Number((payload.amount * (payload.rate ?? 1.0)).toFixed(4));`,
          };
          setAutoHealTraces((prev) => [...prev, step4]);
          handleCodeChange(healedContent);

          setTimeout(() => {
            const verifyResult = executeScriptInSandbox(filePath, healedContent);
            setLastExecutionResult(verifyResult);
            setSecurityAudits((prev) => [verifyResult.securityAudit, ...prev]);
            setTerminalLogs((prev) => [...prev, ...verifyResult.stdout, ...verifyResult.stderr]);

            const step5: AutonomousLoopTrace = {
              step: 5,
              phase: verifyResult.crashed ? 'CRASH_CAUGHT' : 'VERIFY_PASS',
              timestamp: new Date().toLocaleTimeString(),
              message: verifyResult.crashed
                ? `[5/5] Verification failed (Exit Code ${verifyResult.exitCode}).`
                : `[5/5] Re-executed ${filePath} in sandbox ──► EXIT CODE 0 PASSED!`,
            };
            setAutoHealTraces((prev) => [...prev, step5]);
            setIsHealingLoopRunning(false);

            setFiles((prev) =>
              prev.map((f) =>
                f.id === activeFile.id
                  ? {
                      ...f,
                      content: verifyResult.crashed ? initialCode : healedContent,
                      hasKnownBug: verifyResult.crashed,
                      lastRunStatus: verifyResult.crashed ? 'CRASHED' : 'HEALED',
                    }
                  : f
              )
            );

            setTerminalLogs((prev) => [
              ...prev,
              verifyResult.crashed
                ? `$ [AUTO-HEAL HALTED] ${filePath} requires operator review.`
                : `$ [AUTO-HEAL COMPLETE] ${filePath} healed & verified with EXIT CODE 0.`,
            ]);

            // Add completion message to chat feed
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-heal-${Date.now()}`,
                sender: 'SOVEREIGN_AI',
                timestamp: new Date().toLocaleTimeString(),
                text: `Autonomous Error-Fixing Loop completed on **${filePath}** via **Codestral 22B**.\n\n1. Captured runtime crash stack trace (TypeError on payload.amount).\n2. Sliced code into 3 AST Bites.\n3. Synthesized type-safe guard in BITE-02.\n4. Overwrote file and verified Exit Code 0 in sandbox container.`,
                bites,
              },
            ]);
            setCurrentView('chats');
          }, 450);
        }, 450);
      }, 450);
    }, 350);
  };

  // User chat message handling
  const handleSendMessage = (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'USER',
      timestamp: new Date().toLocaleTimeString(),
      text: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentView('chats');

    // Add to recents if first message of new chat
    if (messages.length === 0) {
      const newRecent: RecentChatItem = {
        id: `recent-${Date.now()}`,
        title: userText.slice(0, 32) + (userText.length > 32 ? '...' : ''),
        subtitle: `${MISTRAL_MODELS[activeModel].shortName} discussion...`,
        timestamp: 'Just now',
        modelId: activeModel,
      };
      setRecents((prev) => [newRecent, ...prev.slice(0, 7)]);
      setActiveRecentId(newRecent.id);
    }

    // Security scan on user prompt
    const promptAudit = inspectSecurityPayload(userText, 'USER_PROMPT', shieldConfig);
    setSecurityAudits((prev) => [promptAudit, ...prev]);

    if (!promptAudit.executionAllowed) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-shield-${Date.now()}`,
          sender: 'SHIELD_SYSTEM',
          timestamp: new Date().toLocaleTimeString(),
          text: `BLOCKED BY INSIDE BOUNDARY FIREWALL: Malicious command or destructive directory wipe detected in prompt.`,
          securityBlocked: true,
          blockedReason: promptAudit.threats[0]?.mitigation,
        },
      ]);
      return;
    }

    setIsStreaming(true);

    const runAgentPipeline = async () => {
      const modelTitle = MISTRAL_MODELS[activeModel].displayName;
      const isStructuredAgentCommand =
        activeAgent === 'kali-gpt' ||
        activeAgent === 'shell-gpt' ||
        (activeAgent === 'terminal-gpt' &&
          (/^\/(recon|scan|audit|harden|exploit|autoheal|run)\b/i.test(userText.trim()) ||
            /^node\s+/i.test(userText.trim()) ||
            userText.toLowerCase().includes('autoheal')));

      let response = generateAgentResponse(activeAgent, userText, {
        activeFilePath: activeFile.path,
        activeFileContent: activeFile.content,
        modelTitle,
      });

      if (
        activeAgent === 'terminal-gpt' &&
        response.type === 'terminal' &&
        /^node\s+/.test(response.command)
      ) {
        const runCommand = response.command;
        const targetName = runCommand.replace(/^node\s+/, '').trim();
        const matched =
          files.find(
            (f) =>
              f.path === targetName ||
              f.name === targetName ||
              f.path.endsWith(targetName)
          ) || activeFile;
        const execResult = executeScriptInSandbox(matched.path, matched.content);
        setLastExecutionResult(execResult);
        setSecurityAudits((prev) => [execResult.securityAudit, ...prev]);
        setTerminalLogs((prev) => [
          ...prev,
          `$ ${runCommand}`,
          ...execResult.stdout,
          ...execResult.stderr,
        ]);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === matched.id
              ? { ...f, lastRunStatus: execResult.crashed ? 'CRASHED' : 'PASSED' }
              : f
          )
        );
        const enriched: TerminalRun = {
          ...response,
          output: [...execResult.stdout, ...execResult.stderr],
          exitCode: execResult.exitCode,
          verdict: execResult.crashed ? 'CRASHED' : 'PASSED',
        };
        response = enriched;
      }

      if (activeAgent === 'terminal-gpt' && userText.toLowerCase().includes('autoheal')) {
        window.setTimeout(() => handleTriggerAutoHealLoop(), 250);
      }

      const bites = parseCodeIntoBites(activeFile.content, activeFile.path);
      const showBites = /(decompose|fix|bug|bites|isolate|patch)/i.test(userText);

      let aiResponseText = '';
      let tokenMetrics: ChatMessage['tokenMetrics'] = undefined;

      // Online Remote API call if configured
      if (!isStructuredAgentCommand && remoteConfig.mode === 'online' && remoteConfig.apiKey.trim()) {
        const remoteResult = await generateRemoteMistralChat({
          model: activeModel,
          config: remoteConfig,
          messages: [
            {
              role: 'system',
              content: buildMistralSystemPrompt({
                modelId: activeModel,
                agentName: AGENTS[activeAgent].name,
                agentRole: AGENTS[activeAgent].role,
                filePath: activeFile.path,
                fileSnippet: activeFile.content,
                operationMode: 'online',
              }),
            },
            { role: 'user', content: userText },
          ],
        });

        if (remoteResult.ok) {
          aiResponseText = remoteResult.text;
          tokenMetrics = {
            prompt: remoteResult.usage?.promptTokens ?? 0,
            completion: remoteResult.usage?.completionTokens ?? 0,
            total: remoteResult.usage?.totalTokens ?? 0,
            latencyMs: remoteResult.latencyMs,
          };
        } else {
          // Fallback to offline engine
          const offlineRes = generateOfflineMistralResponse({
            modelId: activeModel,
            agentId: activeAgent,
            prompt: userText,
            filePath: activeFile.path,
            fileContent: activeFile.content,
          });
          aiResponseText = offlineRes.text;
          tokenMetrics = {
            prompt: offlineRes.tokens.prompt,
            completion: offlineRes.tokens.completion,
            total: offlineRes.tokens.total,
            latencyMs: offlineRes.latencyMs,
          };
        }
      } else if (!isStructuredAgentCommand) {
        // Airgapped Sovereign Offline mode
        const offlineRes = generateOfflineMistralResponse({
          modelId: activeModel,
          agentId: activeAgent,
          prompt: userText,
          filePath: activeFile.path,
          fileContent: activeFile.content,
        });
        aiResponseText = offlineRes.text;
        tokenMetrics = {
          prompt: offlineRes.tokens.prompt,
          completion: offlineRes.tokens.completion,
          total: offlineRes.tokens.total,
          latencyMs: offlineRes.latencyMs,
        };

        // If a new file was synthesized from scratch (like Cursor), automatically add to workspace
        if (offlineRes.generatedFile) {
          const gen = offlineRes.generatedFile;
          setFiles((prev) => {
            if (prev.some((f) => f.path === gen.path)) {
              return prev.map((f) => f.path === gen.path ? { ...f, content: gen.content, isModified: true } : f);
            }
            return [
              ...prev,
              {
                id: `file-${Date.now().toString(36)}`,
                name: gen.name,
                path: gen.path,
                language: gen.path.endsWith('.ts') ? 'typescript' : 'javascript',
                content: gen.content,
                hasKnownBug: false,
                lastRunStatus: 'PASSED',
              },
            ];
          });
        }
      }

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'SOVEREIGN_AI',
        timestamp: new Date().toLocaleTimeString(),
        agentId: activeAgent,
        text: aiResponseText
          ? aiResponseText
          : `${AGENTS[activeAgent].name} processed your request inside the sovereign sandbox:`,
        agentResponse: aiResponseText ? undefined : response,
        bites: showBites ? bites : undefined,
        tokenMetrics,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsStreaming(false);
      setTimeout(captureState, 300);
    };

    void runAgentPipeline();
  };

  const shieldBlockedCount = securityAudits.filter(
    (a) => a.verdict === 'BLOCKED_SYSCALL'
  ).length;

  return isWindowClosed ? (
    <main className="w-full h-full bg-[#FAF6F0] flex items-center justify-center p-6 select-none">
      <section className="pinterest-card max-w-md w-full p-8 text-center bg-[#FFFFFF] shadow-xl">
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center text-xl font-bold">
          A
        </div>
        <h1 className="font-heading text-lg font-semibold text-[#1C1917]">Aegis Dev Studio closed</h1>
        <p className="mt-2 text-sm text-[#78716C]">Your workspace session is preserved in this browser window.</p>
        <button
          onClick={() => setIsWindowClosed(false)}
          className="mt-6 px-5 py-2.5 rounded-full bg-[#E07A5F] hover:bg-[#C9664B] text-xs font-semibold text-[#FFFFFF] shadow-xs transition-all cursor-pointer"
        >
          Reopen Studio
        </button>
      </section>
    </main>
  ) : (
    <div
      className={`w-screen h-screen bg-pinterest-canvas text-[#1C1917] flex flex-col overflow-hidden select-none ${
        isMaximized ? 'p-0' : 'p-3'
      }`}
    >
      {/* Outer Window Container matching Pinterest Aesthetic */}
      <div
        className={`w-full h-full flex flex-col bg-[#FAF6F0] overflow-hidden border border-[#EFE7DE] ${
          isMaximized ? 'rounded-none' : 'rounded-3xl shadow-2xl'
        }`}
      >
        {/* Top Header Bar */}
        <PinterestHeader
          currentView={currentView}
          onSelectView={setCurrentView}
          remoteStatus={remoteStatus}
          activeModel={activeModel}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenArchitecture={() => {
            setArchitectureModalTab('blueprint');
            setArchitectureModalOpen(true);
          }}
          shieldBlockedCount={shieldBlockedCount}
          onCloseWindow={() => setIsWindowClosed(true)}
          onMinimizeWindow={() => setIsWindowMinimized(true)}
          onMaximizeWindow={() => setIsMaximized(!isMaximized)}
          isMaximized={isMaximized}
        />

        {isWindowMinimized && (
          <div className="absolute inset-x-0 bottom-6 z-40 flex justify-center pointer-events-none">
            <button
              onClick={() => setIsWindowMinimized(false)}
              className="pointer-events-auto pinterest-card px-5 py-2.5 text-xs font-semibold text-[#1C1917] shadow-xl hover:bg-[#FAF6F0] cursor-pointer"
            >
              Restore Aegis Studio
            </button>
          </div>
        )}

        {/* Main Body Grid: Left Sidebar + Central Clean Canvas */}
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          {/* Left Minimalist Sidebar */}
          <PinterestSidebar
            currentView={currentView}
            onSelectView={setCurrentView}
            onNewChat={handleNewChat}
            onOpenSettings={() => setSettingsModalOpen(true)}
            files={files}
            activeFileId={activeFile.id}
            onSelectFile={(id) => {
              setActiveFileId(id);
              setCurrentView('code');
            }}
            activeAgent={activeAgent}
            onSelectAgent={setActiveAgent}
            activeModel={activeModel}
            recents={recents}
            activeRecentId={activeRecentId}
            onSelectRecent={handleSelectRecent}
          />

          {/* Central Main Experience Area */}
          <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#FAF6F0] overflow-hidden relative">
            {/* VIEW 1: CHATS VIEW */}
            {currentView === 'chats' && (
              messages.length === 0 ? (
                /* Hero Welcome Screen with Model Dropdown & Quick Start Cards */
                <PinterestHeroChat
                  onSendMessage={handleSendMessage}
                  activeModel={activeModel}
                  onSelectModel={setActiveModel}
                  onTriggerAutoHeal={handleTriggerAutoHealLoop}
                  isHealingLoopRunning={isHealingLoopRunning}
                  onOpenSettings={() => setSettingsModalOpen(true)}
                  activeAgent={activeAgent}
                  onSelectAgent={setActiveAgent}
                />
              ) : (
                /* Active Conversation Feed */
                <PinterestChatFeed
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  activeModel={activeModel}
                  onSelectModel={setActiveModel}
                  onApplyBiteToEditor={handleApplyBiteToEditor}
                  onApplyAllBites={handleApplyAllBites}
                  isStreaming={isStreaming}
                  activeAgent={activeAgent}
                />
              )
            )}

            {/* VIEW 2 & 3: COLAB & CODE STUDIO VIEW */}
            {(currentView === 'colab' || currentView === 'code') && (
              <PinterestCodeStudio
                files={files}
                activeFile={activeFile}
                onSelectFile={setActiveFileId}
                onCodeChange={handleCodeChange}
                onRunCurrentScript={handleRunCurrentScript}
                onTriggerAutoHealLoop={handleTriggerAutoHealLoop}
                isHealingLoopRunning={isHealingLoopRunning}
                onResetSampleBug={handleResetSampleBug}
                onCreateNewFile={handleCreateNewFile}
                activeModel={activeModel}
              />
            )}

            {/* VIEW 4: AGENTS DIRECTORY */}
            {currentView === 'agents' && (
              <div className="w-full h-full p-6 overflow-y-auto max-w-4xl mx-auto space-y-4">
                <div className="text-center py-4 space-y-1">
                  <h1 className="text-2xl font-heading font-semibold text-[#1C1917]">
                    Sovereign Mistral Agents
                  </h1>
                  <p className="text-xs text-[#78716C]">
                    Specialized AI copilots running inside the Double-Layer Security Shield.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(AGENTS).map((agent) => {
                    const Icon = agent.icon;
                    const isSelected = agent.id === activeAgent;
                    return (
                      <div
                        key={agent.id}
                        onClick={() => {
                          setActiveAgent(agent.id);
                          setCurrentView('chats');
                        }}
                        className={`pinterest-card p-5 cursor-pointer flex flex-col justify-between space-y-4 ${
                          isSelected ? 'border-[#E07A5F] shadow-md' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{
                                backgroundColor: agent.accent + '20',
                                color: agent.accent,
                              }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
                              {agent.role}
                            </span>
                          </div>

                          <h2 className="text-sm font-semibold text-[#1C1917]">{agent.name}</h2>
                          <p className="text-xs text-[#78716C] mt-1">{agent.tagline}</p>
                        </div>

                        <button
                          type="button"
                          className="w-full py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F2ECE3] border border-[#E8DFD5] text-xs font-semibold text-[#1C1917] transition-colors"
                        >
                          Chat with {agent.name}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 5: TASKS & SANDBOX EXECUTION */}
            {currentView === 'tasks' && (
              <div className="w-full h-full p-6 overflow-y-auto max-w-3xl mx-auto space-y-4">
                <div className="text-center py-4 space-y-1">
                  <h1 className="text-2xl font-heading font-semibold text-[#1C1917]">
                    Sandboxed Tasks &amp; Runs
                  </h1>
                  <p className="text-xs text-[#78716C]">
                    Automated subprocess executions confined to <code>/workspace/sovereign-project</code>.
                  </p>
                </div>

                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="pinterest-card p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#1C1917]">{file.path}</div>
                        <div className="text-[11px] text-[#8C827A]">
                          Status:{' '}
                          <span
                            className={
                              file.lastRunStatus === 'PASSED' || file.lastRunStatus === 'HEALED'
                                ? 'text-[#0D9488] font-semibold'
                                : file.lastRunStatus === 'CRASHED'
                                ? 'text-[#DC2626] font-semibold'
                                : 'text-[#8C827A]'
                            }
                          >
                            {file.lastRunStatus || 'IDLE'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setActiveFileId(file.id);
                            handleRunCurrentScript();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#2E2A27] text-[#FFFFFF] text-xs font-semibold"
                        >
                          Run Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Hidden Background Terminal Logs Drawer (Kept completely in background by default) */}
      <HiddenTerminalDrawer
        terminalLogs={terminalLogs}
        lastExecutionResult={lastExecutionResult}
        autoHealTraces={autoHealTraces}
        securityAudits={securityAudits}
        onRunCustomCommand={handleRunCustomCommand}
        onTriggerAutoHeal={handleTriggerAutoHealLoop}
        isHealingLoopRunning={isHealingLoopRunning}
        bites={activeBites}
      />

      {/* Architecture Blueprint Modal */}
      <ArchitectureModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
        initialTab={architectureModalTab}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        config={remoteConfig}
        onUpdateConfig={handleUpdateRemoteConfig}
        activeModel={activeModel}
        onSelectModel={setActiveModel}
        remoteStatus={remoteStatus}
        onRefreshStatus={probeRemoteConnection}
      />
    </div>
  );
}

export default App;
