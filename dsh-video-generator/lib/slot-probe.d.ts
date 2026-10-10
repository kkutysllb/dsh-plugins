/** 槽位「测试」：按槽类型做一次真实最小调用（规格 §5 / 验收 3）。
 *  结论写回槽位 verifiedAt/verifyNote（成败都留痕）；失败透出上游原始错误。
 *  注意：video/music 测试会产生一笔真实小额消费（最短时长），与生成共用确认外的独立路径——
 *  该按钮由用户在设置页显式点击，不再叠加 confirm 交互。
 */
import type { VaultStore } from './store/vault.ts';
import { type SlotBinding } from './store/slots.ts';
export interface SlotTestResult {
    ok: boolean;
    slot: SlotBinding['slot'];
    model: string;
    detail: string;
    error?: string;
}
export declare function testSlotBinding(vault: VaultStore, binding: SlotBinding, opts?: {
    fetchImpl?: typeof fetch;
}): Promise<SlotTestResult>;
