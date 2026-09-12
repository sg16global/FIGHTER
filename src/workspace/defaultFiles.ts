// ============================================================================
// SOVEREIGN AEGIS-IDE // WORKSPACE VIRTUAL FILESYSTEM (OUTSIDE BOUNDARY JAIL)
// ============================================================================

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;           // e.g. "src/paymentProcessor.js"
  language: 'javascript' | 'typescript' | 'json' | 'python';
  content: string;
  isModified?: boolean;
  hasKnownBug?: boolean;
  lastRunStatus?: 'PASSED' | 'CRASHED' | 'HEALED' | 'IDLE';
}

export const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    id: 'file-payment-processor',
    name: 'paymentProcessor.js',
    path: 'src/paymentProcessor.js',
    language: 'javascript',
    hasKnownBug: true,
    lastRunStatus: 'IDLE',
    content: `/**
 * Sovereign Airgapped Payment Ledger Processor
 * Model Target: Codestral-22B // Mistral-Large-2
 * NOTE: Try clicking "Run node paymentProcessor.js" or "Trigger Autonomous Auto-Heal Loop"!
 */

const SOVEREIGN_LEDGER_CURRENCY = 'SOV';

/**
 * Validates cryptographic signature inside airgapped enclave
 */
function verifySovereignSignature(walletAddress) {
  if (!walletAddress || !walletAddress.startsWith('sov1')) {
    return { verified: false, enclave: 'NONE' };
  }
  return { verified: true, enclave: 'HSM-AIRGAP-CHAMBER-4' };
}

/**
 * Executes a payment transaction against the local ledger
 * WARNING: Missing null/NaN safety check on payload.amount (intentionally crashes on malformed tx)
 */
function processPayment(payload) {
  // BUG: Direct unchecked property read on payload.amount throws when amount is undefined
  const total = payload.amount * payload.rate;
  const settlementFee = total * 0.0015;
  const netAmount = total - settlementFee;

  const recipient = payload.user.wallet.address;
  const sig = verifySovereignSignature(recipient);

  console.log(\`[LEDGER COMMITTED] TX:\${payload.id} | Net: \${netAmount.toFixed(4)} \${SOVEREIGN_LEDGER_CURRENCY}\`);
  return {
    txId: payload.id,
    netAmount,
    settlementFee,
    signatureVerified: sig.verified,
    timestamp: new Date().toISOString()
  };
}

module.exports = { processPayment, verifySovereignSignature };
`,
  },
  {
    id: 'file-auth-gateway',
    name: 'authGateway.ts',
    path: 'src/authGateway.ts',
    language: 'typescript',
    hasKnownBug: false,
    lastRunStatus: 'PASSED',
    content: `/**
 * Zero-Trust Sovereign Auth Gateway
 * Double-Layer Shield Boundary Verified
 */

export interface SovereignSessionToken {
  sessionId: string;
  fingerprint: string;
  clearanceLevel: 'OPERATOR' | 'SYSTEM_ROOT' | 'AIRGAP_AUDITOR';
  expiresAt: number;
}

export function issueAirgapSession(operatorKey: string): SovereignSessionToken {
  if (operatorKey.length < 32) {
    throw new Error('Sovereign Operator key must be at least 256 bits (32 chars).');
  }

  const sessionToken: SovereignSessionToken = {
    sessionId: \`SES-\${Math.random().toString(36).substring(2, 10).toUpperCase()}\`,
    fingerprint: 'SHA256:8f4c0a21d5e3c79011be4f9d2a6a8b79',
    clearanceLevel: 'SYSTEM_ROOT',
    expiresAt: Date.now() + 3600_000,
  };

  console.log(\`[AUTH GATEWAY] Issued sovereign airgapped session: \${sessionToken.sessionId}\`);
  return sessionToken;
}
`,
  },
  {
    id: 'file-security-monitor',
    name: 'securityMonitor.js',
    path: 'src/securityMonitor.js',
    language: 'javascript',
    hasKnownBug: false,
    lastRunStatus: 'PASSED',
    content: `/**
 * Outside Boundary Syscall Interceptor Daemon
 * Enforces Option 3 Sandbox Protection (/workspace/sovereign-project)
 */

function runSelfTest() {
  const sandboxJailRoot = '/workspace/sovereign-project';
  const blockedCommands = ['rm -rf /', 'mkfs.ext4 /dev/sda1', 'curl https://api.meta.ai/telemetry'];

  console.log(\`[AEGIS LAYER-1] Virtual Sandbox Root Locked: \${sandboxJailRoot}\`);
  console.log(\`[AEGIS LAYER-2] Intercepted & Blocked \${blockedCommands.length} destructive syscall vectors.\`);
  return {
    shieldActive: true,
    sandboxRoot: sandboxJailRoot,
    airgapped: true,
    blockedAttempts: 0
  };
}

module.exports = { runSelfTest };
`,
  },
  {
    id: 'file-config',
    name: 'sovereign.config.json',
    path: 'sovereign.config.json',
    language: 'json',
    hasKnownBug: false,
    lastRunStatus: 'PASSED',
    content: JSON.stringify(
      {
        studio: 'AEGIS Sovereign AI Desktop Workstation',
        version: '3.4.0-SOVEREIGN',
        mistralSuite: {
          supportedModels: [
            'open-mistral-7b',
            'mistral-large-latest',
            'codestral-latest',
            'open-mistral-nemo'
          ],
          defaultModel: 'codestral-latest',
          remoteEndpoint: 'https://api.mistral.ai/v1',
          operationModes: ['online', 'offline-airgapped'],
          telemetryBlockedHosts: ['meta.ai', 'deepseek.com', 'grok.x.ai', 'openai.com']
        },
        biteEngine: {
          autoDecomposeOnCrash: true,
          maxAutoHealRetries: 3,
          requireDoubleLayerShieldVerification: true
        },
        securityShield: {
          outsideBoundaryRoot: '/workspace/sovereign-project',
          blockDestructiveSyscalls: true
        }
      },
      null,
      2
    ),
  },
];
