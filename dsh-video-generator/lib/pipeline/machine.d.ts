/** 七段流水线状态机：run.json 事实源推进 + 断点续跑 + gate(auto/ask/manual) + 并发泵 + 记账（规格 §5）。
 *  已知限制：断点续跑从事件流恢复的 shot 参考图为签名 URL（7 天有效）；过期导致 video 段失败时，
 *  将 run.json 中 shot-assets 段状态改回 pending 重推即可重新生成。
 */
import type { RunStore } from '../store/runs.ts';
import type { ChannelRef } from '../registry.ts';
import type { Provider } from '../provider.ts';
import { type PricingTable } from '../pricing.ts';
import { type StageId } from '../stages.ts';
import { type CloudTtsConfig } from '../finalcut/voice.ts';
export interface MachineDeps {
    runs: RunStore;
    runId: string;
    target: StageId;
    channel: ChannelRef;
    /** 模型 -> Provider 工厂（registry.providerForModel 的注入形态；测试可替换）。 */
    providers: {
        forModel: (model: string, opts?: {
            fetchImpl?: typeof fetch;
        }) => Provider;
    };
    pricing: PricingTable | null;
    confirmer: (est: number | null, kind: string) => Promise<boolean>;
    ffmpeg: string | null;
    concurrency?: number;
    fetchImpl?: typeof fetch;
    videoModel?: string;
    imageModel?: string;
    gates?: Partial<Record<StageId, 'auto' | 'ask' | 'manual'>>;
    ask?: (stage: StageId, info: string) => Promise<boolean>;
    /** 云端 TTS（配置即启用，自然度优先；失败自动回退本地 say/SAPI）。 */
    tts?: CloudTtsConfig;
    /** 状态轮询基础间隔（ms），默认 1000。 */
    pollDelayMs?: number;
}
/** manual gate 拦截（工具层转 manual-gate 信封，指引 vgen_provide）。 */
export declare class ManualGateError extends Error {
}
/** ask gate 被拒（工具层转 gate-approval 信封，指引 gateApprovals 重调）。 */
export declare class AskGateRejectedError extends Error {
}
export interface AdvanceResult {
    runId: string;
    stages: Partial<Record<StageId, 'pending' | 'running' | 'done' | 'failed'>>;
    shotImages?: Array<{
        index: number;
        url: string;
        file: string;
    }>;
    clipFiles?: string[];
    finalOutput?: string;
}
export declare function advanceRun(deps: MachineDeps): Promise<AdvanceResult>;
