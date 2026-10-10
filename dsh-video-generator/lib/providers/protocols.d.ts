/** 协议族 → 适配器工厂（规格 2026-09-28 §3）：按槽位绑定声明的 protocol 构造，
 *  零模型名猜测。TTS 不经 Provider 抽象（finalcut/voice.ts 直连 /v1/audio/speech）。
 */
import type { Provider } from '../provider.ts';
import { type ProtocolFamily, type SlotBinding } from '../store/slots.ts';
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
}
export declare const PROTOCOL_FAMILY_LIST: readonly ProtocolFamily[];
export declare function providerForSlot(channel: ChannelRef, binding: SlotBinding, opts?: ProviderSlotOptions): Provider;
