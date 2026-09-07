/** vgen_generate / vgen_status：推进非 LLM 段 + run 概览。
 *  确认语义（规格 §4.4）：估价未知/超阈值且未带 confirm → confirm-required 信封（会话模型向用户转述成本后带 confirm 重调）。
 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
import type { ChannelRef } from '../registry.ts';
import type { MachineDeps } from '../pipeline/machine.ts';
import { type PricingTable } from '../pricing.ts';
import type { CloudTtsConfig } from '../finalcut/voice.ts';
import type { ToolResult } from './handoff.ts';
export interface GenerateContext {
    vault: VaultStore;
    runs: RunStore;
    /** 默认通道解析（站点根）。 */
    channel: () => ChannelRef;
    env?: NodeJS.ProcessEnv;
    /** 生产路径不传：内部 fetchPricing（失败容错 null）；测试可传 null 跳过或传表。 */
    pricing?: PricingTable | null;
    /** 测试注入：confirm 判定（注入后 args.confirm 语义失效）。 */
    confirmer?: (est: number | null) => Promise<boolean>;
    /** 测试注入：覆盖 provider 工厂。 */
    providersOverride?: {
        forModel: MachineDeps['providers']['forModel'];
    };
    /** 测试注入：下载用 fetch。 */
    fetchImpl?: typeof fetch;
    /** 测试注入：云端 TTS 配置。生产路径从 env（VGEN_TTS_MODEL/VGEN_TTS_VOICE/VGEN_TTS_INSTRUCTIONS）解析。 */
    tts?: CloudTtsConfig;
}
export interface GenerateArgs {
    runId: string;
    target: 'assets' | 'video' | 'final';
    confirm?: boolean;
    concurrency?: number;
    /** 每段 gate 模式覆盖（持久化进 run.json；优先级 = vault 缺省 < run.json < 本参数）。 */
    gates?: Record<string, 'auto' | 'ask' | 'manual'>;
    /** ask gate 的本次放行清单（用户已在会话中批准后由会话模型带上）。 */
    gateApprovals?: string[];
    /** 把某个媒体段（master-asset/shot-assets/video/final-cut）重置 pending 后重跑。 */
    rerunStage?: string;
}
export declare function buildGenerateTools(ctx: GenerateContext): {
    generate: {
        execute: (args: GenerateArgs) => Promise<ToolResult>;
    };
    status: {
        execute: (args: {
            runId: string;
        }) => Promise<ToolResult>;
    };
};
/** vgen_generate / vgen_status 的 DshToolDefinition（对齐 handoffToolDefs 形态）。 */
export declare function generateToolDefs(tools: ReturnType<typeof buildGenerateTools>): Array<import('./handoff.ts').DshToolDefinition>;
