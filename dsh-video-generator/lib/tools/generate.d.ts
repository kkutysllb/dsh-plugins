/** vgen_generate / vgen_status：推进非 LLM 段 + run 概览。
 *  确认语义（规格 §4.4 + 2026-09-28 §9）：估价未知 → 一律确认；估价 ≤ 阈值 → 放行；
 *  超阈值 → confirm-required。模型一律来自用途槽绑定（单槽单模型）。
 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
import type { SlotBinding, SlotId } from '../store/slots.ts';
import type { ChannelRef } from '../providers/protocols.ts';
import type { MachineDeps } from '../pipeline/machine.ts';
import type { CloudTtsConfig } from '../finalcut/voice.ts';
import type { ToolResult } from './handoff.ts';
export interface GenerateContext {
    vault: VaultStore;
    runs: RunStore;
    /** 槽位绑定表（每次执行现取，切配置即时生效）。 */
    slots: () => Partial<Record<SlotId, SlotBinding>>;
    /** 凭证解析：通道不存在时抛 model-unavailable（含槽位上下文）。 */
    channelOf: (channelId: string) => ChannelRef | null;
    env?: NodeJS.ProcessEnv;
    /** 测试注入：confirm 判定（注入后 args.confirm 与阈值语义失效）。 */
    confirmer?: (est: number | null) => Promise<boolean>;
    /** 测试注入：覆盖 provider 工厂。 */
    providersOverride?: {
        forSlot: MachineDeps['providers']['forSlot'];
    };
    /** 测试注入：下载用 fetch。 */
    fetchImpl?: typeof fetch;
    /** 测试注入：云端 TTS 配置；生产路径按 tts 槽绑定动态构造。 */
    tts?: CloudTtsConfig;
    /** 宿主生命周期信号：插件停用/卸载（HMR）时 abort，在飞生成在检查点停下。 */
    signal?: AbortSignal;
}
/** tts 槽绑定 → 云端 TTS 配置（音色/语气：能力位声明优先，env 兜底）。 */
export declare function configuredCloudTts(binding: SlotBinding, channel: ChannelRef, env?: NodeJS.ProcessEnv): CloudTtsConfig;
export interface GenerateArgs {
    runId: string;
    target: 'assets' | 'video' | 'music' | 'final';
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
        execute: (args: GenerateArgs, callSignal?: AbortSignal) => Promise<ToolResult>;
    };
    status: {
        execute: (args: {
            runId: string;
        }) => Promise<ToolResult>;
    };
};
/** vgen_generate / vgen_status 的 DshToolDefinition（对齐 handoffToolDefs 形态）。 */
export declare function generateToolDefs(tools: ReturnType<typeof buildGenerateTools>): Array<import('./handoff.ts').DshToolDefinition>;
