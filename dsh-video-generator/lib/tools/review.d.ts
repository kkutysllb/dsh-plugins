/** vgen_review：两阶段质量评审闭环（规格 §5.3）。
 *  阶段A（无 score）：抽该镜成片 25/50/75% 三帧，返回路径 + 评分指引（会话模型用读图工具查看）。
 *  阶段B（带 score）：1-5 clamp 记录进 run.json；≤2 自动追加负面词重拍（每镜 ≤2 次，花费走 confirm 语义）；
 *  非法 score 兜底不重拍（review-invalid 事件留痕）。重拍后自动重新抽帧，闭环回阶段B。 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
import type { ChannelRef } from '../registry.ts';
import type { Provider } from '../provider.ts';
import { type PricingTable } from '../pricing.ts';
import { extractReviewFrames } from '../review/frames.ts';
import type { ToolResult, DshToolDefinition } from './handoff.ts';
export interface ReviewContext {
    vault: VaultStore;
    runs: RunStore;
    /** 默认通道解析（与 vgen_generate 同一注入形态）。 */
    channel: () => ChannelRef;
    env?: NodeJS.ProcessEnv;
    /** undefined → 按需 fetchPricing（失败容错 null）；测试传 null 跳过。 */
    pricing?: PricingTable | null;
    /** 测试注入：重拍花费确认。生产 = args.confirm 语义。 */
    confirmer?: (est: number | null) => Promise<boolean>;
    providersOverride?: {
        forModel: (model: string, opts?: {
            fetchImpl?: typeof fetch;
        }) => Provider;
    };
    fetchImpl?: typeof fetch;
    /** 测试注入：抽帧实现。 */
    extract?: typeof extractReviewFrames;
    /** undefined → locateFfmpeg(env)。 */
    ffmpeg?: string | null;
    videoModel?: string;
}
export interface ReviewArgs {
    runId: string;
    shot: number;
    score?: number;
    negativeHint?: string;
    confirm?: boolean;
}
export declare function buildReviewTools(ctx: ReviewContext): {
    review: {
        execute: (args: ReviewArgs) => Promise<ToolResult>;
    };
};
export declare function reviewToolDefs(tools: ReturnType<typeof buildReviewTools>): DshToolDefinition[];
