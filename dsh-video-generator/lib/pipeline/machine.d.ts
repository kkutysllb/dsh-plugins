/** 七段流水线状态机：run.json 事实源推进 + 断点续跑 + gate(auto/ask/manual) + 并发泵 + 记账
 *  （规格 §5；通道层 v2：模型一律来自用途槽绑定，单槽单模型，无候选轮询）。
 *  已知限制：断点续跑从事件流恢复的 shot 参考图为签名 URL（7 天有效）；过期导致 video 段失败时，
 *  用 vgen_generate rerunStage='shot-assets' 显式重做（直接重推属条目级续跑，会跳过已有产物不重新生成）。
 */
import type { RunStore } from '../store/runs.ts';
import type { Provider } from '../provider.ts';
import { type SlotBinding, type SlotId } from '../store/slots.ts';
import { type StageId } from '../stages.ts';
import { type ChannelRef } from '../providers/protocols.ts';
import { type CloudTtsConfig } from '../finalcut/voice.ts';
export interface MachineDeps {
    runs: RunStore;
    runId: string;
    target: StageId;
    /** 槽位绑定表（工具层推进前从 vault 取好；未绑定槽在消费点抛 model-unavailable）。 */
    slots: Partial<Record<SlotId, SlotBinding>>;
    /** 凭证解析：按绑定取通道；通道不存在时抛 model-unavailable（含槽位上下文）。 */
    channelFor: (binding: SlotBinding) => ChannelRef;
    /** Provider 工厂（registry.providerForSlot 的注入形态；测试可替换）。 */
    providers: {
        forSlot: (binding: SlotBinding, channel: ChannelRef, opts?: {
            fetchImpl?: typeof fetch;
        }) => Provider;
    };
    /** 按绑定估价（工具层按各槽通道拉价目后注入；失败为 null → 估价未知走确认）。 */
    estimate: (binding: SlotBinding) => number | null;
    confirmer: (est: number | null, kind: string) => Promise<boolean>;
    ffmpeg: string | null;
    concurrency?: number;
    fetchImpl?: typeof fetch;
    gates?: Partial<Record<StageId, 'auto' | 'ask' | 'manual'>>;
    ask?: (stage: StageId, info: string) => Promise<boolean>;
    /** 云端 TTS（配置即启用，自然度优先；失败自动回退本地 say/SAPI）。 */
    tts?: CloudTtsConfig;
    /** 状态轮询基础间隔（ms），默认 1000。 */
    pollDelayMs?: number;
    /** 宿主生命周期信号：插件停用/卸载（HMR）时 abort，在飞的段执行在下一个
     *  检查点停下并置 run 为 failed(host-interrupted)，不再继续调用通道 API。 */
    signal?: AbortSignal;
    /** 记账回调（submit 成功后落全局账本；工具层注入 SpendLedger.recordSafe）。 */
    recordSpend?: (entry: {
        channel: string;
        model: string;
        kind: 'image' | 'video' | 'music';
        estCny: number | null;
        jobId: string;
    }) => void;
}
/** 宿主停用中断：段执行在检查点抛出，工具层转 interrupted 信封。 */
export declare class RunInterruptedError extends Error {
    readonly runId: string;
    constructor(runId: string);
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
