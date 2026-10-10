/** 用途槽选型层：未绑定/能力不匹配统一 model-unavailable（规格 2026-09-28 §2.3）。
 *  单槽单模型——这里没有任何"候选列表/轮询/自动兜底"语义；image.shot 未绑定回落
 *  image.master 是唯一的显式缺省。
 */
import { type SlotBinding, type SlotId } from './store/slots.ts';
export declare class ModelUnavailableError extends Error {
    readonly code: "model-unavailable";
    readonly slot: SlotId;
    readonly channelId: string | null;
    readonly model: string | null;
    constructor(slot: SlotId, opts?: {
        channelId?: string | null;
        model?: string | null;
        reason?: string;
    });
}
/** 槽位未绑定。 */
export declare function slotUnavailable(slot: SlotId): ModelUnavailableError;
/** 槽位已绑定但能力/上游不可用。 */
export declare function bindingUnavailable(binding: SlotBinding, reason: string): ModelUnavailableError;
/**
 * 从槽位表解析绑定；未绑定抛 model-unavailable。
 * image.shot 未绑定时回落 image.master（规格 §2.2 的唯一显式缺省）。
 */
export declare function requireSlotBinding(slots: Partial<Record<SlotId, SlotBinding>>, slot: SlotId): SlotBinding;
/**
 * 判定上游是否明确表示模型或分发渠道不存在。
 * 429、超时、网络异常和 5xx 保持原有重试/失败语义。
 */
export declare function isExplicitModelUnavailable(error: unknown): boolean;
