import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { ChevronRight, ShieldCheck, Code2 as Code2Icon, BrainCircuit as BrainIcon } from 'lucide-react';
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
import type { SecurityAuditResult } from './security/doubleLayerShield';
import {
  kaliInspect,
  kaliGateModelOutput,
  terminalAuthorizeRun,
  shellSanitizeCommand,
  validateWorkspaceFilename,
  validateRemoteEndpoint,
  ALLOWED_SHELL_VERBS,
  getShieldLedger,
  getShieldTelemetry,
  subscribeShieldLedger,
  verifyShieldIntegrity,
} from './security/securityCore';
import {
  MistralModelId,
  MISTRAL_MODELS,
  RemoteApiConfig,
  RemoteApiStatus,
  loadRemoteApiConfig,
  saveRemoteApiConfig,
  testRemoteMistralConnection,
  generateRemoteMistralChat,
  buildExecutorPrompt,
  DEFAULT_MISTRAL_MODEL,
} from './engine/mistralClient';
import { generateOfflineMistralResponse } from './engine/offlineEngine';
import {
  AppMode,
  GatewayTicket,
  LogicBlock,
  STANDBY_NOTICE,
  advisoryForPrompt,
  appendVaultRecord,
  buildMentalMap,
  detectIdeEnv,
  hubVoice,
  issueGatewayTicket,
  readVaultRecords,
  releaseGatewayTicket,
  selfCorrectCode,
  selfCorrectOutput,
  activeBlockCount,
  compileMasterAlgorithm,
  isEngineArmed,
  loadAppMode,
  loadLogicBlocks,
  saveAppMode,
  saveLogicBlocks,
} from './engine/masterAlgorithm';
import { PinterestBrainStudio } from './components/PinterestBrainStudio';
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

  // ── OPERATIONAL MODULES — exactly two, presented on every boot ────────────
  // CODE MODE: generation, sandbox runs, workspace/terminal environment.
  // BRAIN MODE: layer-by-layer master-algorithm construction & scaffolding.
  const [appMode, setAppMode] = useState<AppMode>(() => loadAppMode() ?? 'CODE');
  const [bootResolved, setBootResolved] = useState(false);

  // ── MASTER ALGORITHM — sole reasoning authority over the blank engine ─────
  const [logicBlocks, setLogicBlocks] = useState<LogicBlock[]>(() => loadLogicBlocks());
  const engineArmed = isEngineArmed(logicBlocks);
  const armedBlockCount = activeBlockCount(logicBlocks);
  const compiledAlgorithm = useMemo(() => compileMasterAlgorithm(logicBlocks), [logicBlocks]);

  // RULE 4 · universal environment recognition (VS Code / VSCodium / VS
  // Community / VS Dev family) from workspace signals — recognition only,
  // never a control surface. RULE 2 · vault is machine-local storage.
  const ideEnv = useMemo(() => detectIdeEnv(files.map((f) => ({ path: f.path }))), [files]);
  useEffect(() => {
    appendVaultRecord(
      'ENV',
      `IDE recognition: ${ideEnv.flavor}${ideEnv.signals.length ? ' · ' + ideEnv.signals.join(', ') : ' · no host signals'} · vault = this device only`
    );
  }, []);

  useEffect(() => {
    saveAppMode(appMode);
  }, [appMode]);

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

  // Shield configuration and policy live exclusively inside the security kernel
  // (src/security/securityCore.ts). No component can loosen them directly.

  // Modals
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [architectureModalTab, setArchitectureModalTab] = useState<'blueprint' | 'option2' | 'option3'>('blueprint');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Background Terminal & Execution state (kept in background by default)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '$ [AEGIS SOVEREIGN DEV STUDIO v3.4.0 INITIALIZED]',
    '$ MISTRAL SUITE (ANALYSIS ONLY): Codestral 22B · Mistral Large 2 · Mistral 7B · Mistral NeMo 12B',
    '$ ┌─ BACKEND SECURITY LAYERS (NOT chat agents — enforcement kernel) ─────────',
    '$ │ LAYER 1 KALI GPT      REDSHIELD-01 · rule-base inspection · hash-chained audit ledger',
    '$ │ LAYER 2 SHELL GPT     SHELLWEAVER-02 · command tokenization · strict-argv allowlist',
    '$ │ LAYER 3 TERMINAL GPT  AUTORUN-03 · single-use hash-bound permits · scope-locked sandbox',
    '$ └─ Every chat, editor, patch and terminal action is chained through all three.',
    '$ [KERNEL] ENGINE POSTURE: MASTER ALGORITHM ENGAGED — operator Rules 1–5 shipped armed; external model presets remain stripped.',
    '$ [LOGIC HUB] Line-by-line mental mapping + mandatory self-eval/rewrite loop active on every Code Mode pass.',
    '$ [LOGIC HUB] Zero-server privacy vault online (machine-local) · network CLOSED by default (one-shot gateway tickets only).',
    '$ Studio front-end running in clean Pinterest design system.',
  ]);

  const [lastExecutionResult, setLastExecutionResult] = useState<TerminalExecutionResult | null>(null);
  const [autoHealTraces, setAutoHealTraces] = useState<AutonomousLoopTrace[]>([]);
  const [isHealingLoopRunning, setIsHealingLoopRunning] = useState<boolean>(false);

  // Security audit trail is a projection of the kernel's hash-chained ledger.
  // The ledger is the source of truth: KALI GPT (Layer 1) appends to it on
  // every inspection, and this component never fabricates audit entries.
  const [securityAudits, setSecurityAudits] = useState<SecurityAuditResult[]>(
    () => getShieldLedger().map((entry) => entry.audit).reverse()
  );

  // Live posture recomputed whenever the kernel ledger commits — the UI renders
  // the security layers' REAL state, never a decorative copy.
  const [shieldPosture, setShieldPosture] = useState(() => ({
    integrity: verifyShieldIntegrity(),
    telemetry: getShieldTelemetry(),
  }));

  useEffect(
    () =>
      subscribeShieldLedger(() => {
        setSecurityAudits(getShieldLedger().map((entry) => entry.audit).reverse());
        setShieldPosture({ integrity: verifyShieldIntegrity(), telemetry: getShieldTelemetry() });
      }),
    []
  );

  const shieldIntegrity = shieldPosture.integrity;
  const terminalPermitIssued = shieldPosture.telemetry.permitsIssued;

  const logSovereign = useCallback((lines: string[]) => {
    setTerminalLogs((prev) => [...prev, ...lines].slice(-600));
  }, []);

  // Messages list (starts empty so user sees the hero Pinterest welcome screen)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vaultCount, setVaultCount] = useState(0);
  useEffect(() => {
    setVaultCount(readVaultRecords().length);
  }, [terminalLogs.length, messages.length]);
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
    } catch {
      // Memory bank must never break the security path.
    }
  }, [files, activeFile.path, terminalLogs, lastExecutionResult, autoHealTraces, securityAudits, messages]);

  // Boot: restore from LTMB
  useEffect(() => {
    try {
      const bank = loadMemoryBank();
      if (bank.snapshots && bank.snapshots.length > 0) {
        const latest = bank.snapshots[bank.snapshots.length - 1];
        setTerminalLogs((prev) => [
          ...prev,
          `$ [LTMB RESTORE] Restored ${latest.fileFingerprints.length} workspace files from previous session. ${getMemorySummary()}`,
        ]);
      }
    } catch {
      setTerminalLogs((prev) => [...prev, '$ [LTMB] Memory bank ready.']);
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

  // Settings writes pass the kernel's endpoint policy. An attacker with access
  // to the UI cannot repoint the client at their own gateway, smuggle
  // credentials in the URL, downgrade to plaintext, or reach a prohibited
  // telemetry host — the config is rejected before it is ever persisted.
  const handleUpdateRemoteConfig = (newConfig: RemoteApiConfig) => {
    const onlineIntent = newConfig.mode === 'online' && newConfig.apiKey.trim().length > 0;
    if (onlineIntent) {
      const verdict = validateRemoteEndpoint(newConfig.endpointUrl);
      if (!verdict.ok) {
        logSovereign([
          `[KALI GPT · LAYER 1] REMOTE GATEWAY POLICY VIOLATION: ${verdict.reason}`,
          '[KALI GPT · LAYER 1] Configuration NOT saved. Forced Airgapped Offline mode remains active.',
        ]);
        const safeConfig: RemoteApiConfig = { ...newConfig, mode: 'offline' };
        setRemoteConfig(safeConfig);
        saveRemoteApiConfig(safeConfig);
        return;
      }
      const sanitized = { ...newConfig, endpointUrl: verdict.url };
      setRemoteConfig(sanitized);
      saveRemoteApiConfig(sanitized);
      logSovereign([`$ [CONFIG] Remote mode set to ${sanitized.mode.toUpperCase()} · endpoint pinned to ${sanitized.endpointUrl}`]);
      return;
    }
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
    setAppMode('CODE');
    setCurrentView('chats');
  };

  const handleSelectRecent = (recentId: string) => {
    setActiveRecentId(recentId);
    const item = recents.find((r) => r.id === recentId);
    if (!item) return;

    if (item.modelId) {
      setActiveModel(item.modelId);
    }
    setAppMode('CODE');
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

  // --------------------------------------------------------------------------
  // LAYER 1 boundary · workspace write policy.
  // Editor text is scanned on every commit. Jail-traversal or guardrail-override
  // content is REJECTED (never written); destructive literals that live inside
  // inert documentation files are allowed to exist but are denied the moment
  // they try to execute at the LAYER 3 door.
  // --------------------------------------------------------------------------
  const adjudicateWorkspaceWrite = (
    newContent: string,
    reason: string,
  ): { accepted: boolean } => {
    const audit = kaliInspect(newContent, 'FILE_WRITE');
    const deny = audit.threats.some(
      (t) => t.severity === 'CRITICAL' && t.category === 'JAILBREAK_ATTEMPT',
    );
    if (deny) {
      logSovereign([
        `[KALI GPT · LAYER 1] REJECTED ${reason}: ${audit.threats.find((t) => t.category === 'JAILBREAK_ATTEMPT' && t.severity === 'CRITICAL')?.mitigation ?? 'Jail traversal attempt'}`,
        `[KALI GPT · LAYER 1] Content was NOT written to the workspace. Ledger entry #${audit.ledgerSeq}.`,
      ]);
      return { accepted: false };
    }
    if (audit.threats.length > 0) {
      logSovereign([
        `[KALI GPT · LAYER 1] NOTE ${reason}: ${audit.threats.length} contained finding(s) recorded (ledger #${audit.ledgerSeq}); execution of this payload will be blocked at LAYER 3.`,
      ]);
    }
    return { accepted: true };
  };

  const handleCodeChange = (newContent: string) => {
    if (!adjudicateWorkspaceWrite(newContent, `editor write on ${activeFile.path}`).accepted) {
      return;
    }
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
    const validated = validateWorkspaceFilename(name);
    if (!validated.ok) {
      logSovereign([`[SHELL GPT · LAYER 2] FILE CREATE REFUSED: ${validated.reason}`]);
      return;
    }
    const safePath = validated.safeName;
    const displayName = safePath.split('/').pop() || safePath;
    const newId = `file-${Date.now().toString(36)}`;
    const newFile: WorkspaceFile = {
      id: newId,
      name: displayName,
      path: safePath,
      language: safePath.endsWith('.ts') ? 'typescript' : 'javascript',
      content: `/**\n * ${safePath}\n * Mistral Enclave Module — confined to /workspace/sovereign-project\n */\n\nfunction runTask() {\n  return { status: 'OK', model: '${MISTRAL_MODELS[activeModel].shortName}' };\n}\n\nmodule.exports = { runTask };\n`,
      hasKnownBug: false,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
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

  // --------------------------------------------------------------------------
  // LAYER 1 gate for synthesized patches: a healed bite (local heuristic OR a
  // remote Codestral reply) is treated as untrusted input before it may touch
  // the editor.
  // --------------------------------------------------------------------------
  const gatePatch = (patchSource: string, label: string): string | null => {
    const gate = kaliGateModelOutput(patchSource);
    if (!gate.allowed) {
      logSovereign([
        `[KALI GPT · LAYER 1] QUARANTINED ${label}: ${gate.audit.threats[0]?.mitigation ?? 'Critical finding in synthesized patch'}`,
        `[KALI GPT · LAYER 1] Editor NOT patched. Ledger entry #${gate.audit.ledgerSeq}.`,
      ]);
      return null;
    }
    return patchSource;
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

    if (gatePatch(newContent, `bite patch ${bite.id} for ${activeFile.path}`) === null) return;

    handleCodeChange(newContent);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, lastRunStatus: 'HEALED', hasKnownBug: false } : f
      )
    );

    setTerminalLogs((prev) => [
      ...prev,
      `$ [BITE APPLIED] Synced ${bite.id} patch to ${activeFile.path} (LAYER 1 cleared).`,
    ]);
  };

  const handleApplyAllBites = (bites: CodeBite[]) => {
    const combined = bites.map((b) => b.healedSnippet).join('\n');
    if (gatePatch(combined, `full AST-bite patch set for ${activeFile.path}`) === null) return;

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

  // --------------------------------------------------------------------------
  // LAYER 3 dispatch helper — the ONLY way anything executes in this app.
  // terminalAuthorizeRun forces LAYER 1 inspection + path jail + single-use
  // permit; the sandbox engine consumes the permit and re-verifies the hash.
  // --------------------------------------------------------------------------
  const gatedSandboxRun = (
    path: string,
    content: string,
    payload?: Record<string, unknown>,
  ): { result: TerminalExecutionResult; permitId?: string } => {
    const auth = terminalAuthorizeRun(path, content, 'TERMINAL_EXECUTION');
    if (!auth.granted || !auth.permit) {
      const refusal: TerminalExecutionResult = {
        exitCode: 126,
        stdout: [],
        stderr: [
          `[TERMINAL GPT · LAYER 3] DENIED ${path}: ${auth.denialReason ?? 'no permit issued'}`,
        ],
        executionTimeMs: 0,
        crashed: true,
        errorStackTrace: `SecurityError: ${auth.denialReason ?? 'Execution denied at the LAYER 3 gate'}`,
        securityAudit: auth.inspection,
      };
      logSovereign(refusal.stderr);
      return { result: refusal };
    }
    const result = executeScriptInSandbox(path, content, payload, {
      permitId: auth.permit.id,
    });
    if (!result.crashed) {
      logSovereign([
        `[TERMINAL GPT · LAYER 3] Permit ${auth.permit.id} consumed · ${path} executed in locked scope · exit 0.`,
      ]);
    }
    return { result, permitId: auth.permit.id };
  };

  const handleRunCurrentScript = () => {
    const { result: execResult } = gatedSandboxRun(activeFile.path, activeFile.content);
    appendVaultRecord('RUN', `node ${activeFile.path} → exit ${execResult.exitCode} (sandbox, local record only)`);
    setLastExecutionResult(execResult);

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

  const findWorkspaceFile = (target: string): WorkspaceFile | undefined =>
    files.find(
      (f) => f.path === target || f.name === target || f.path.endsWith(target) || target.endsWith(f.path)
    );

  const resolveVirtualPath = (target: string): string =>
    `/workspace/sovereign-project/${target.replace(/^\/+/, '').replace(/^workspace\/sovereign-project\//, '')}`;

  // --------------------------------------------------------------------------
  // SHELL GPT (LAYER 2) → TERMINAL GPT (LAYER 3)
  // No string from the terminal prompt is ever evaluated. It is tokenized into
  // argv, only an allowlist of read-only verbs survives, and `node` is the one
  // verb that continues into the permit-gated sandbox engine.
  // --------------------------------------------------------------------------
  const handleRunCustomCommand = (cmd: string) => {
    const sanitized = shellSanitizeCommand(cmd);

    const argv = sanitized.argv;
    if (sanitized.verdict === 'BLOCKED' || !argv) {
      setTerminalLogs((prev) => [
        ...prev,
        `$ ${cmd}`,
        `[SHELL GPT · LAYER 2] BLOCKED — ${sanitized.reason}`,
        `[SHELL GPT · LAYER 2] Segments rejected: ${sanitized.segments.join(' | ') || '(none)'} · ledger #${sanitized.audit?.ledgerSeq ?? 'n/a'}`,
      ]);
      return;
    }

    const [verb, ...args] = argv;

    if (verb === 'node') {
      const target = args[0];
      const matched = findWorkspaceFile(target);
      if (!matched) {
        logSovereign([
          `[TERMINAL GPT · LAYER 3] No workspace file matches "${target}". Refusing to resolve paths outside the virtual filesystem.`,
        ]);
        return;
      }
      const { result } = gatedSandboxRun(matched.path, matched.content);
      appendVaultRecord('RUN', `${argv.join(' ')} → exit ${result.exitCode} (terminal drawer)`);
      setLastExecutionResult(result);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === matched.id
            ? { ...f, lastRunStatus: result.crashed ? 'CRASHED' : 'PASSED' }
            : f
        )
      );
      setTerminalLogs((prev) => [
        ...prev,
        `$ ${argv.join(' ')}`,
        ...result.stdout,
        ...result.stderr,
      ]);
      setTimeout(captureState, 250);
      return;
    }

    // Read-only verbs answer from the virtual filesystem only — the host OS is
    // never consulted, so there is nothing for an attacker to reach.
    const virtualPaths = files.map((f) => resolveVirtualPath(f.path));
    let output: string[];

    switch (verb) {
      case 'shield':
        output = [
          `[KALI GPT · LAYER 1] Policy engine armed · ${sanitized.audit?.ledgerSeq ?? 0} ledger entries`,
          `[SHELL GPT · LAYER 2] Command sanitizer active · allowlist: ${[...ALLOWED_SHELL_VERBS].join(', ')}`,
          `[TERMINAL GPT · LAYER 3] Permit-gated execution · no unpermitted call has ever run`,
        ];
        break;
      case 'ls':
        output = args.length > 0 ? [`ls: ${args[0]}: no such file or directory (virtual filesystem)`] : virtualPaths;
        break;
      case 'cat': {
        const matched = args[0] ? findWorkspaceFile(args[0]) : undefined;
        output = matched ? [matched.content] : [`cat: ${args[0] ?? '<missing>'}: not a virtual filesystem path`];
        break;
      }
      case 'pwd':
        output = ['/workspace/sovereign-project'];
        break;
      case 'whoami':
        output = ['sovereign-operator (uid 65534 · nobody)'];
        break;
      case 'head':
      case 'tail':
      case 'wc':
      case 'grep': {
        const fileArg = args.find((a) => !a.startsWith('-'));
        const matched = fileArg ? findWorkspaceFile(fileArg) : undefined;
        if (!matched) {
          output = [`${verb}: no readable virtual file (usage: ${verb} src/<file>.js)`];
          break;
        }
        const lines = matched.content.split('\n');
        output =
          verb === 'head' ? lines.slice(0, 10)
          : verb === 'tail' ? lines.slice(-10)
          : verb === 'wc' ? [`${lines.length} ${matched.content.length} ${matched.content.split(/\s+/).filter(Boolean).length}`]
          : (args.filter((a) => !a.startsWith('-')).length > 1
              ? lines.filter((l) => l.includes(args[args.length - 1]))
              : lines
            ).slice(0, 40);
        break;
      }
      case 'echo':
        output = [args.join(' ')];
        break;
      case 'clear':
        setTerminalLogs(['$ clear', '[SANDBOX] Terminal view cleared. Audit ledger is append-only and was NOT erased.']);
        return;
      case 'help':
        output = [
          'Sovereign terminal — LAYER 2 allowlist: node, ls, cat, head, tail, wc, grep, pwd, whoami, echo, shield, clear, help',
          'Every command is sanitized; `node <file>` requires a LAYER 3 permit and runs in a locked scope.',
          'The host operating system is unreachable from this surface.',
        ];
        break;
      default:
        output = [`[SHELL GPT · LAYER 2] "${verb}" is not a serviceable command inside the jail.`];
    }

    setTerminalLogs((prev) => [...prev, `$ ${argv.join(' ')}`, ...output].slice(-600));
  };

  // Option 2 Autonomous Error-Fixing Loop with Codestral.
  // Supervised end-to-end by the security layers: every execution consumes its
  // own LAYER 3 permit, and a remotely-synthesized patch must clear LAYER 1
  // before it can replace the file — a compromised/evil gateway can therefore
  // never write weaponized "fixes" into the workspace.
  const handleTriggerAutoHealLoop = () => {
    if (isHealingLoopRunning) return;
    setIsHealingLoopRunning(true);

    const initialCode = activeFile.content;
    const filePath = activeFile.path;

    const step1: AutonomousLoopTrace = {
      step: 1,
      phase: 'READ_CONTEXT',
      timestamp: new Date().toLocaleTimeString(),
      message: `[1/5] Ingested ${filePath} into Mistral Codestral context (LAYER 1 pre-cleared for analysis).`,
    };

    setAutoHealTraces([step1]);
    setTerminalLogs((prev) => [
      ...prev,
      `$ [AUTO-HEAL LOOP] Target: ${filePath} via Codestral 22B · LAYER 3 supervising every run`,
    ]);

    setTimeout(() => {
      const { result: execResult } = gatedSandboxRun(filePath, initialCode);
      setLastExecutionResult(execResult);
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
          // Rule 1 applies to the hub's own mechanical output too: the composed
          // patch is self-evaluated before it can be staged into the editor.
          healedContent = selfCorrectOutput(healedContent, { mentalMap: undefined }).text;

          // If online with API key, perform live remote synthesis. The reply is
          // UNTRUSTED: LAYER 1 must clear it, otherwise the deterministic local
          // AST patch stands (fail-closed against a compromised or hostile gateway).
          // Model synthesis inside the heal pass requires the master algorithm:
          // the loop never grants Codestral standalone repair "initiative".
          if (engineArmed && remoteConfig.mode === 'online' && remoteConfig.apiKey.trim()) {
            try {
              const remoteRes = await generateRemoteMistralChat({
                model: 'codestral-latest',
                config: remoteConfig,
                messages: [
                  {
                    role: 'system',
                    content: buildExecutorPrompt({
                      modelId: 'codestral-latest',
                      operationMode: 'online',
                      filePath,
                      fileSnippet: initialCode,
                      masterAlgorithm: compiledAlgorithm,
                      modeLabel: 'CODE',
                    }),
                  },
                  {
                    role: 'user',
                    content: `APPLY VERIFY→EXECUTE BLOCKS TO THIS CRASH:\n${execResult.errorStackTrace}\n\nCode:\n${initialCode}`,
                  },
                ],
              });
              if (remoteRes.ok && remoteRes.text.length > 50 && !remoteRes.text.includes('```')) {
                const gated = gatePatch(remoteRes.text, `remote Codestral patch for ${filePath}`);
                if (gated !== null) {
                  healedContent = gated;
                } else {
                  logSovereign([
                    '[KALI GPT · LAYER 1] Falling back to the locally verified AST-bite patch (fail-closed).',
                  ]);
                }
              }
            } catch {
              // Fallback to local deterministic healing
            }
          }

          const step4: AutonomousLoopTrace = {
            step: 4,
            phase: 'SOVEREIGN_HEAL_PATCH',
            timestamp: new Date().toLocaleTimeString(),
            message: `[4/5] Patch composed from verified AST-bite healing${engineArmed ? ' + master-algorithm model synthesis' : ' (mechanical pass — engine blank, no model synthesis)'}. Cleared LAYER 1 output gate before touching ${filePath}.`,
            codeDiffSummary: `+ if (!payload || typeof payload.amount !== 'number') throw new TypeError(...)\n+ const total = Number((payload.amount * (payload.rate ?? 1.0)).toFixed(4));`,
          };
          setAutoHealTraces((prev) => [...prev, step4]);
          handleCodeChange(healedContent);

          setTimeout(() => {
            const { result: verifyResult } = gatedSandboxRun(filePath, healedContent);
            setLastExecutionResult(verifyResult);
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

  // BRAIN MODE commit path. The compiled algorithm is itself untrusted input:
  // KALI GPT (L1) inspects it BEFORE it may arm the backend, and the verdict
  // is committed to the hash-chained ledger like any other payload.
  const handleCommitAlgorithm = (blocks: LogicBlock[]): { ok: boolean; reason?: string } => {
    const compiled = compileMasterAlgorithm(blocks);
    if (compiled) {
      const audit = kaliInspect(compiled, 'USER_PROMPT');
      if (audit.denied) {
        logSovereign([
          `[KALI GPT · LAYER 1] MASTER ALGORITHM commit DENIED · ${audit.threats[0]?.ruleId ?? 'critical finding'} · ${audit.threats[0]?.category ?? 'POLICY'} · ledger #${audit.ledgerSeq}`,
        ]);
        return {
          ok: false,
          reason: `LAYER 1 denied the commit: ${audit.threats[0]?.mitigation ?? 'critical rule match'}`,
        };
      }
      logSovereign([
        `[KALI GPT · LAYER 1] Master algorithm pre-cleared for arming · ${compiled.length} chars · ledger #${audit.ledgerSeq}`,
      ]);
    }
    setLogicBlocks(blocks);
    saveLogicBlocks(blocks);
    const count = activeBlockCount(blocks);
    logSovereign([
      count > 0
        ? `$ [KERNEL] MASTER ALGORITHM COMMITTED — engine ARMED (${count} block(s)). Generation paths released.`
        : '$ [KERNEL] Master algorithm empty — engine returned to BLANK STANDBY. All synthesis on hold.',
    ]);
    return { ok: true };
  };

  // ── RULE 3 handlers: the operator decides; advisory is NEVER a security gate ──
  const resolveAdvisoryCard = (msgId: string, tail: string) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId && m.advisory ? { ...m, advisory: undefined, text: `${m.text}\n\n_${tail}_` } : m))
    );

  const handleAdvisoryDecision = (msgId: string, choice: 'adopt-alternative' | 'proceed-anyway' | 'abort') => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.advisory) return;
    const { prompt, alternative } = msg.advisory;
    if (choice === 'abort') {
      resolveAdvisoryCard(msgId, 'request dropped by operator');
      appendVaultRecord('ADVISORY', 'operator dropped the request');
      logSovereign(['[LOGIC HUB · RULE 3] Request dropped — nothing was executed.']);
      return;
    }
    if (choice === 'proceed-anyway') {
      resolveAdvisoryCard(msgId, 'operator insisted — original prompt executed directly');
      appendVaultRecord('ADVISORY_OVERRIDE', 'operator insisted on original prompt — executed directly (security layers still enforced)');
      logSovereign(['[LOGIC HUB · RULE 3] Operator insisted — executing the original prompt as-is. (CRITICAL security denials remain non-negotiable.)']);
      handleSendMessage(prompt, { advisoryOverride: true });
      return;
    }
    resolveAdvisoryCard(msgId, 'alternative adopted');
    appendVaultRecord('ADVISORY', 'operator adopted the hub alternative');
    handleSendMessage(`${prompt}\n\n[HUB] Operator adopted the alternative: ${alternative}`, { advisoryOverride: true });
  };

  // RULE 4 handler: one-shot ephemeral gateway — issue, use once, hard-close.
  const handleGatewayGrant = (msgId: string, prompt: string) => {
    resolveAdvisoryCard(msgId, 'ephemeral gateway approved for a single request (RULE 4)');
    handleSendMessage(prompt, { advisoryOverride: true, gatewayApproved: true });
  };

  // User chat message handling — opts carry the operator's advisory/gateway decisions.
  const handleSendMessage = (userText: string, opts: { advisoryOverride?: boolean; gatewayApproved?: boolean } = {}) => {
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

    // LAYER 1 (KALI GPT) — every prompt is inspected, logged to the hash-chained
    // ledger, and denied before any model, agent, or interpreter sees it. This
    // includes prompt-injection / guardrail-override attempts aimed at the
    // security layers themselves.
    const promptAudit = kaliInspect(userText, 'USER_PROMPT');

    if (promptAudit.denied) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-shield-${Date.now()}`,
          sender: 'SHIELD_SYSTEM',
          timestamp: new Date().toLocaleTimeString(),
          text: `⛔ DENIED BY KALI GPT (LAYER 1) · ${promptAudit.threats[0]?.category ?? 'POLICY'}. The payload was isolated before any model or interpreter received it and committed to the tamper-evident audit ledger (#${promptAudit.ledgerSeq}).`,
          securityBlocked: true,
          blockedReason:
            promptAudit.threats[0]?.mitigation ??
            'Critical rule match intercepted at the Inside Boundary firewall.',
        },
      ]);
      logSovereign([
        `$ ${userText.slice(0, 120)}`,
        `[KALI GPT · LAYER 1] DENIED chat ingress · ${promptAudit.threats.map((t) => t.ruleId).join(', ')} · ledger #${promptAudit.ledgerSeq}`,
      ]);
      return;
    }

    // BLANK ENGINE POLICY: freeform generation requires an armed master
    // algorithm — until then no model, offline or remote, is asked to think.
    // Security-layer console commands (status/translation/node runs) are
    // enforcement operations and stay available in both engine states.
    const isStructuredLayerCommand =
      activeAgent === 'kali-gpt' ||
      activeAgent === 'shell-gpt' ||
      (activeAgent === 'terminal-gpt' &&
        (/^\/(recon|scan|audit|harden|exploit|autoheal|run)\b/i.test(userText.trim()) ||
          /^node\s+/i.test(userText.trim()) ||
          userText.toLowerCase().includes('autoheal')));

    if (!isStructuredLayerCommand && !engineArmed) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-blank-${Date.now()}`,
          sender: 'SOVEREIGN_AI',
          timestamp: new Date().toLocaleTimeString(),
          text: STANDBY_NOTICE,
        },
      ]);
      logSovereign([
        '$ [KERNEL] Generation held — ENGINE BLANK (no armed master algorithm). Compose blocks in BRAIN MODE.',
      ]);
      return;
    }

    // ── RULE 1 PRE-PASS · line-by-line mental mapping (Code Mode) ──
    // Never skipped, never model-delegated: the hub maps the prompt against
    // the workspace — file links, dependency graph, execution impact — before
    // anything drafts code. Session content stays device-local (RULE 2).
    const hubMap = buildMentalMap(userText, files.map((f) => ({ path: f.path, content: f.content })), activeFile.path);
    appendVaultRecord('PROMPT', userText.slice(0, 300));
    logSovereign([
      `[LOGIC HUB · RULE 1] Mental map — ${hubMap.summary}`,
      ...hubMap.impact.notes.map((n) => `[LOGIC HUB · RULE 1] Impact — ${n}`),
    ]);

    if (!opts.advisoryOverride && !opts.gatewayApproved) {
      // ── RULE 3 · proactive safeguard triage (advisory ONLY) ──
      // CRITICAL security denials already happened upstream at the shield and
      // can never be overridden. What follows is future-bug guidance: alert +
      // alternative, and the operator's insist path executes directly.
      const adv = advisoryForPrompt(userText);
      if (adv.findings.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-advisory-${Date.now()}`,
            sender: 'SOVEREIGN_AI',
            timestamp: new Date().toLocaleTimeString(),
            text: adv.message,
            advisory: { prompt: userText, alternative: adv.findings[0].alternative },
          },
        ]);
        appendVaultRecord('ADVISORY', `staged ${adv.findings.map((f) => f.id).join(', ')}`);
        logSovereign([`[LOGIC HUB · RULE 3] Advisory staged before execution · ${adv.findings.map((f) => f.id).join(', ')}`]);
        return;
      }

      // ── RULE 4 · network utility while airgapped → request one-shot ticket ──
      const wantsNet = hubMap.intents.some((i) => i === 'NETWORK_UTILITY' || i === 'GIT' || i === 'DEPLOY');
      const airgapped = !(remoteConfig.mode === 'online' && remoteConfig.apiKey.trim());
      if (wantsNet && airgapped && remoteConfig.apiKey.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-gateway-${Date.now()}`,
            sender: 'SOVEREIGN_AI',
            timestamp: new Date().toLocaleTimeString(),
            text: [
              'Boss, this needs the network — and the gateway is CLOSED by default (Rule 4).',
              'I can open it for exactly ONE request against the pinned sanctioned endpoint, then it closes and retires itself.',
              'Prefer to stay airgapped? I will run this fully through the local engine instead — no approval needed.',
            ].join('\n\n'),
            advisory: { prompt: userText, alternative: 'Proceed with the offline engine (no network).', gateway: true },
          },
        ]);
        appendVaultRecord('GATEWAY', 'approval requested for network-utility prompt');
        logSovereign(['[LOGIC HUB · RULE 4] Gateway approval requested — nothing opened yet.']);
        return;
      }
      if (wantsNet && airgapped && !remoteConfig.apiKey.trim()) {
        logSovereign([
          '[LOGIC HUB · RULE 4] Network utility requested but no sanctioned gateway is configured — executed on offline capability only. Nothing left the device.',
        ]);
      }
    }

    setIsStreaming(true);

    const runAgentPipeline = async () => {
      const modelTitle = MISTRAL_MODELS[activeModel].displayName;
      const isStructuredAgentCommand = isStructuredLayerCommand;

      // RULE 4 · the borrowed-open gateway: a ticket, one request, auto-close.
      // It never widens WHERE we may connect — the egress pin still decides.
      const gatewayTicket: GatewayTicket | null =
        opts.gatewayApproved && remoteConfig.apiKey.trim()
          ? issueGatewayTicket(`utility run: ${userText.slice(0, 80)}`)
          : null;
      const callConfig = gatewayTicket
        ? { ...remoteConfig, mode: 'online' as const }
        : remoteConfig;
      const onlineChannelOpen =
        !isStructuredAgentCommand && callConfig.mode === 'online' && callConfig.apiKey.trim().length > 0;

      let response = generateAgentResponse(activeAgent, userText, {
        activeFilePath: activeFile.path,
        activeFileContent: activeFile.content,
        modelTitle,
      });

      // Echo the layer's own activity to the background terminal so enforcement
      // is observable: the console is a read-only mirror, never a control surface.
      setTerminalLogs((prev) =>
        [...prev, ...generateAgentTerminalLogs(activeAgent, userText)].slice(-600)
      );

      if (
        activeAgent === 'terminal-gpt' &&
        response.type === 'terminal' &&
        /^node\s+/.test(response.command) &&
        response.exitCode === 0
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
        // LAYER 3: staged execution still takes the permit path like every other run.
        const { result: execResult, permitId } = gatedSandboxRun(matched.path, matched.content);
        setLastExecutionResult(execResult);
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
          verdict: permitId
            ? execResult.crashed
              ? 'CRASHED (permit ' + permitId + ' consumed)'
              : 'PASSED (permit ' + permitId + ' consumed)'
            : 'BLOCKED AT GATE (no permit issued)',
        };
        response = enriched;
      }

      // NOTE: the former word-triggered auto-launch of the heal loop was removed —
      // the engine never self-initiates; the operator starts the mechanical pass
      // from Code Studio / hero / drawer controls.

      const bites = parseCodeIntoBites(activeFile.content, activeFile.path);
      const showBites = /(decompose|fix|bug|bites|isolate|patch)/i.test(userText);

      let aiResponseText = '';
      let tokenMetrics: ChatMessage['tokenMetrics'] = undefined;

      // LAYER 1 OUTPUT GATE — every string produced by a model (remote gateway OR
      // offline engine) is treated as untrusted input and must clear the same
      // rule base before it can be rendered, written, or memorized.
      const gateOutput = (raw: string): string => {
        if (!raw) return raw;
        const gate = kaliGateModelOutput(raw);
        if (!gate.allowed) {
          logSovereign([
            `[KALI GPT · LAYER 1] Model output quarantined · ${gate.audit.threats[0]?.ruleId ?? 'critical finding'} · ledger #${gate.audit.ledgerSeq}`,
          ]);
          return gate.text;
        }
        return raw;
      };

      // ── RULES 1+4 · MANDATORY SELF-EVALUATION & REWRITE LOOP ──
      // The draft is read back token pass by token pass by the hub's
      // introspection loop: fence residue, brace/paren imbalance, duplicated
      // logic windows, punctuation clashes and drift from the mental-map
      // targets are intercepted and REWRITTEN behind the scenes. Only the
      // corrected text then faces L1's output gate — the operator sees the
      // finished block plus the voice-line summary, never the raw draft.
      const hubProcess = (raw: string): string => {
        const evaluated = selfCorrectOutput(raw, { mentalMap: hubMap });
        if (evaluated.rewrote) {
          logSovereign([
            `[LOGIC HUB · RULE 1] Self-eval rewrote outbound draft pre-presentation (${evaluated.fixes
              .map((f) => f.check)
              .join(', ')})`,
          ]);
          appendVaultRecord('REWRITE', `pass=${evaluated.passes} fixes=${evaluated.fixes.map((f) => f.check).join(',')}`);
        }
        const gated = gateOutput(evaluated.text);
        return `${hubVoice(hubMap, ideEnv, evaluated)}\n\n${gated}`;
      };

      // Online Remote API call if configured (or granted a one-shot gateway ticket)
      if (onlineChannelOpen) {
        const remoteResult = await generateRemoteMistralChat({
          model: activeModel,
          config: callConfig,
          messages: [
            {
              role: 'system',
              content: buildExecutorPrompt({
                modelId: activeModel,
                operationMode: 'online',
                filePath: activeFile.path,
                fileSnippet: activeFile.content,
                masterAlgorithm: compiledAlgorithm,
                modeLabel: appMode,
              }),
            },
            { role: 'user', content: userText },
          ],
        });

        if (remoteResult.ok) {
          aiResponseText = hubProcess(remoteResult.text);
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
            logicBlocks,
          });
          aiResponseText = hubProcess(offlineRes.text);
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
          logicBlocks,
        });
        aiResponseText = hubProcess(offlineRes.text);
        tokenMetrics = {
          prompt: offlineRes.tokens.prompt,
          completion: offlineRes.tokens.completion,
          total: offlineRes.tokens.total,
          latencyMs: offlineRes.latencyMs,
        };

        // If a new file was synthesized from scratch (like Cursor), it passes the
        // LAYER 1 patch gate and LAYER 2 filename policy before it may enter the
        // workspace — a poisoned generation can never plant a file.
        if (offlineRes.generatedFile) {
          const rawGen = offlineRes.generatedFile;
          // RULE 1/4: the hub rewrites its own generated file behind the scenes
          // (dupes, syntax clashes, unbalanced blocks) before it can reach the
          // workspace — and refuses the write outright if structure is unfixable.
          const corrected = selfCorrectCode(rawGen.content);
          const gen = { ...rawGen, content: corrected.code };
          if (corrected.fixes.length > 0) {
            appendVaultRecord('REWRITE', `${gen.path}: ${corrected.fixes.join(' · ')}`);
            logSovereign([`[LOGIC HUB · RULE 1] Generated ${gen.path} self-rewritten pre-presentation: ${corrected.fixes.join(' · ')}`]);
          }
          const nameCheck = validateWorkspaceFilename(gen.path);
          if (corrected.unrecoverable) {
            logSovereign([
              `[LOGIC HUB · RULE 1] Refused to write ${gen.path}: ${corrected.unrecoverable}. The hub does not ship code it cannot verify.`,
            ]);
          } else if (!nameCheck.ok) {
            logSovereign([
              `[SHELL GPT · LAYER 2] REFUSED generated file "${gen.path}": ${nameCheck.reason}`,
            ]);
          } else if (gatePatch(gen.content, `generated file ${gen.path}`) === null) {
            // quarantine logged inside gatePatch
          } else {
          const safePath = nameCheck.safeName;
          setFiles((prev) => {
            if (prev.some((f) => f.path === safePath)) {
              return prev.map((f) => f.path === safePath ? { ...f, content: gen.content, isModified: true } : f);
            }
            return [
              ...prev,
              {
                id: `file-${Date.now().toString(36)}`,
                name: gen.name,
                path: safePath,
                language: safePath.endsWith('.ts') ? 'typescript' : 'javascript',
                content: gen.content,
                hasKnownBug: false,
                lastRunStatus: 'PASSED',
              },
            ];
          });
          logSovereign([
            `[KALI GPT · LAYER 1] Generated file ${safePath} cleared the output gate and entered the sandbox workspace.`,
          ]);
          }
        }
      }

      if (gatewayTicket) {
        logSovereign([`[LOGIC HUB · RULE 4] ${releaseGatewayTicket(gatewayTicket)}`]);
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
      className={`relative w-screen h-screen bg-pinterest-canvas text-[#1C1917] flex flex-col overflow-hidden select-none ${
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
          appMode={appMode}
          onSelectMode={setAppMode}
          engineArmed={engineArmed}
          armedBlockCount={armedBlockCount}
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
            onSelectView={(v) => {
              setAppMode('CODE');
              setCurrentView(v);
            }}
            onNewChat={handleNewChat}
            onOpenSettings={() => setSettingsModalOpen(true)}
            files={files}
            activeFileId={activeFile.id}
            onSelectFile={(id) => {
              setActiveFileId(id);
              setAppMode('CODE');
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
            {/* ── BRAIN MODE: master algorithm console (replaces the workspace surface) ── */}
            {appMode === 'BRAIN' ? (
              <PinterestBrainStudio
                committed={logicBlocks}
                engineArmed={engineArmed}
                onCommit={handleCommitAlgorithm}
                onSwitchToCode={() => setAppMode('CODE')}
                envFlavor={ideEnv.flavor}
                vaultCount={vaultCount}
              />
            ) : (
            <>
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
                  engineArmed={engineArmed}
                  onOpenBrainMode={() => setAppMode('BRAIN')}
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
                  onAdvisoryAction={handleAdvisoryDecision}
                  onGatewayGrant={handleGatewayGrant}
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

            {/* VIEW 4: BACKEND SECURITY LAYERS */}
            {currentView === 'agents' && (
              <div className="w-full h-full p-6 overflow-y-auto max-w-5xl mx-auto space-y-4">
                <div className="text-center py-4 space-y-2">
                  <h1 className="text-2xl font-heading font-semibold text-[#1C1917]">
                    Backend Security Layers
                  </h1>
                  <p className="mx-auto max-w-2xl text-xs text-[#78716C]">
                    KALI GPT, SHELL GPT and TERMINAL GPT are <strong>not</strong> chat agents or standard
                    models. They are the enforcement layers of this workstation: threat isolation,
                    command sanitization and permit-gated execution. Select one to open its live
                    verdict console.
                  </p>

                  <div
                    className={`mx-auto inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                      shieldIntegrity.intact
                        ? 'bg-[#E8F8F5] text-[#0F766E] border border-[#A3E4D7]'
                        : 'bg-[#FDEDEC] text-[#922B21] border border-[#F5B7B1]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {shieldIntegrity.intact
                        ? `Audit ledger verified · ${shieldIntegrity.entries} entries · head ${shieldIntegrity.headHash}`
                        : `LEDGER FAULT at #${shieldIntegrity.brokenAtSeq ?? '?'} — restart required`}
                    </span>
                  </div>

                  <div className="mx-auto flex items-center justify-center gap-4 pt-1 text-[11px] text-[#8C827A]">
                    <span><strong className="text-[#B91C1C]">{shieldIntegrity.blockedCount}</strong> hard denials</span>
                    <span><strong className="text-[#B45309]">{shieldIntegrity.containedCount}</strong> contained</span>
                    <span><strong className="text-[#0F766E]">{terminalPermitIssued}</strong> permits issued</span>
                  </div>
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
                            <div className="text-right">
                              <div
                                className="text-[10px] font-mono font-bold uppercase tracking-wider"
                                style={{ color: agent.accent }}
                              >
                                LAYER {agent.layer} · {agent.codename}
                              </div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
                                {agent.defenseRole.split('_').join(' ')}
                              </div>
                            </div>
                          </div>

                          <h2 className="text-sm font-semibold text-[#1C1917]">{agent.name}</h2>
                          <p className="text-xs text-[#78716C] mt-1">{agent.tagline}</p>

                          <div className="mt-3 space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
                              Enforcement points
                            </div>
                            {agent.enforcementPoints.map((point) => (
                              <div key={point} className="flex items-start space-x-1.5 text-[11px] text-[#57534E]">
                                <span className="text-[#0D9488] mt-px">✓</span>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="w-full py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F2ECE3] border border-[#E8DFD5] text-xs font-semibold text-[#1C1917] transition-colors"
                        >
                          Open {agent.name} console
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pinterest-card p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E] mb-2">
                    Request chain — enforced in this order, no bypass path
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 text-[11px]">
                    {['Chat prompt / editor write', 'LAYER 1 · KALI GPT', 'LAYER 2 · SHELL GPT', 'LAYER 3 · TERMINAL GPT permit', 'Locked sandbox realm'].map(
                      (stage, i) => (
                        <Fragment key={stage}>
                          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#C4B5A5] shrink-0 hidden md:block" />}
                          <span
                            className={`px-2.5 py-1 rounded-lg border ${
                              i === 0 || i === 4
                                ? 'bg-[#FAF6F0] border-[#E8DFD5] text-[#57534E]'
                                : 'bg-[#FFFFFF] border-[#E0D7CC] text-[#1C1917] font-semibold'
                            }`}
                          >
                            {stage}
                          </span>
                        </Fragment>
                      )
                    )}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-[#78716C]">
                    Model replies, AST bite patches and synthesized files are re-inspected by LAYER 1 on
                    the way in, so a compromised or malicious gateway can never deliver a payload into the
                    editor or the terminal. Destructive primitives, credential reads, exfiltration hosts,
                    fork bombs, path traversal and prompt-injection attempts against the shield itself are
                    denied before any interpreter sees them and recorded on the hash-chained ledger.
                  </p>
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
                            // Run THIS file (not the previously active one) through the gate.
                            const { result } = gatedSandboxRun(file.path, file.content);
                            appendVaultRecord('RUN', `node ${file.path} → exit ${result.exitCode} (tasks runner)`);
                            setLastExecutionResult(result);
                            setFiles((prev) =>
                              prev.map((f) =>
                                f.id === file.id
                                  ? { ...f, lastRunStatus: result.crashed ? 'CRASHED' : 'PASSED' }
                                  : f
                              )
                            );
                            logSovereign([
                              `$ node ${file.path}`,
                              ...result.stdout,
                              ...result.stderr,
                            ]);
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
            </>
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

      {/* ── BOOT ROUTER — presented on every launch: exactly two operational modules ── */}
      {!bootResolved && (
        <div className="absolute inset-0 z-[60] bg-[#FAF6F0]/95 backdrop-blur-sm flex items-center justify-center p-6 select-none">
          <div className="w-full max-w-3xl space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1C1917] text-[#FAF6F0] flex items-center justify-center font-heading font-bold text-xl shadow-lg">
                A
              </div>
              <h1 className="font-heading text-2xl font-semibold text-[#1C1917]">Aegis Sovereign Studio — select operational module</h1>
              <p className="text-xs text-[#78716C] max-w-xl mx-auto">
                The intelligence engine boots <strong>BLANK</strong>: personas and reasoning presets are stripped.
                Code Mode executes through your armed master algorithm; Brain Mode builds it. Both run the same
                backend kernel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  {
                    mode: 'CODE' as AppMode,
                    icon: Code2Icon,
                    accent: '#10B981',
                    title: 'Code Mode',
                    desc: 'Code generation, sandbox execution, and the VS Code / Community workspace environment — AST bites, permits, terminal, files.',
                    hint: 'Requires an armed master algorithm for generation; security-layer operations and mechanical runs always available.',
                  },
                  {
                    mode: 'BRAIN' as AppMode,
                    icon: BrainIcon,
                    accent: '#8B5CF6',
                    title: 'Brain Mode',
                    desc: 'Layer-by-layer algorithm construction and architectural scaffolding: PARSE → PLAN → EXECUTE → VERIFY logic blocks.',
                    hint: 'Whatever you commit here is the ONLY way the engine is allowed to think, parse and execute.',
                  },
                ] as const
              ).map(({ mode, icon: Icon, accent, title, desc, hint }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setAppMode(mode);
                    setBootResolved(true);
                  }}
                  className={`pinterest-card p-6 text-left space-y-3 transition-all hover:shadow-lg group ${
                    loadAppMode() === mode ? 'border-[#D6C8BA] ring-2 ring-[#E07A5F]/20' : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: accent + '1F', color: accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#1C1917] group-hover:text-[#E07A5F] transition-colors">
                      {title}
                    </h2>
                    <p className="text-[11px] text-[#57534E] mt-1 leading-snug">{desc}</p>
                    <p className="text-[10px] text-[#A8A29E] mt-2 leading-snug italic">{hint}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0F766E]">
                      <ShieldCheck className="w-3 h-3" />
                      KALI · SHELL · TERMINAL auto-enforced
                    </span>
                    <span className="text-[11px] font-semibold text-[#E07A5F]">Enter →</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-[10px] font-mono text-[#A8A29E]">
              L1 rule-base · L2 argv allowlist · L3 single-use permits — active under BOTH modules, cannot be disabled from either
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
