// Node-side stub for lucide-react so the security bundle never pulls React
// into the self-test harness. Icons are decorative at runtime, irrelevant to policy.
const stub = new Proxy({}, { get: () => function Icon() { return null; } });
export default stub;
export const __icons = stub;
export const Zap = stub.Any;
export const ShieldCheck = stub.Any;
export const Terminal = stub.Any;
export const Bug = stub.Any;
export const Code = stub.Any;
export const Activity = stub.Any;
export const FileCode = stub.Any;
export const BrainCircuit = stub.Any;
export const Cpu = stub.Any;
export const Layers = stub.Any;
export const Sparkles = stub.Any;
export const Shield = stub.Any;
export const Globe = stub.Any;
export const Radio = stub.Any;
