/** 协议族 → 适配器工厂（规格 2026-09-28 §3）：按槽位绑定声明的 protocol 构造，
 *  零模型名猜测。TTS 不经 Provider 抽象（finalcut/voice.ts 直连 /v1/audio/speech）。
 */
import type { Provider } from '../provider.ts';
import { type ProtocolFamily, type SlotBinding } from '../store/slots.ts';
import { type StudioBridge } from './comfy-studio.ts';
/** 凭证面：一个 baseUrl + 一把 key（不再携带模型清单）。 */
export interface ChannelRef {
    id: string;
    label?: string;
    baseUrl: string;
    apiKey: string;
}
export interface ProviderSlotOptions {
    fetchImpl?: typeof fetch;
    estimate?: (model: string) => number | null;
    /** 本地画布工作室桥（仅 comfy-studio 协议消费）：工具层把 hostCtx 与 exec 透传下来。 */
    studio?: StudioBridge;
}
export declare const PROTOCOL_FAMILY_LIST: readonly ProtocolFamily[];
export declare function providerForSlot(channel: ChannelRef, binding: SlotBinding, opts?: ProviderSlotOptions): Provider;
