/** 协议族 → 适配器工厂（规格 2026-09-28 §3）：按槽位绑定声明的 protocol 构造，
 *  零模型名猜测。TTS 不经 Provider 抽象（finalcut/voice.ts 直连 /v1/audio/speech）。
 */
import { bindingUnavailable } from "../model-selection.js";
import { capabilityFlag } from "../store/slots.js";
import { createOpenaiImagesProvider } from "./openai-images.js";
import { createDashscopeRelayProvider } from "./dashscope-relay.js";
import { createKlingCompatProvider } from "./kling-compat.js";
import { createOpenaiVideoProvider } from "./openai-video.js";
import { createGenericMusicProvider } from "./generic-music.js";
export const PROTOCOL_FAMILY_LIST = [
    'openai-images', 'openai-tts', 'dashscope-video', 'kling-video', 'openai-video', 'generic-music',
];
export function providerForSlot(channel, binding, opts = {}) {
    const fetchImpl = opts.fetchImpl ?? fetch;
    const base = { baseUrl: channel.baseUrl, apiKey: channel.apiKey, model: binding.model, estimate: opts.estimate };
    switch (binding.protocol) {
        case 'openai-images':
            return createOpenaiImagesProvider(base, fetchImpl);
        case 'dashscope-video':
            // DashScope i2v 模态由槽位能力位声明决定（t2v-only 模型 imageToVideo=false → textToVideo=true）
            return createDashscopeRelayProvider({ ...base, imageToVideo: capabilityFlag(binding, 'imageToVideo', true) }, fetchImpl);
        case 'kling-video':
            return createKlingCompatProvider(base, fetchImpl);
        case 'openai-video':
            return createOpenaiVideoProvider(base, fetchImpl);
        case 'generic-music':
            return createGenericMusicProvider(channel, binding, fetchImpl);
        case 'openai-tts':
            // 配音不走 Provider 抽象（voice.ts 直连）；此分支仅在误配时触达
            throw bindingUnavailable(binding, 'openai-tts 协议不经 Provider 抽象：配音由 finalcut/voice 直连 /v1/audio/speech');
        default: {
            const never = binding.protocol;
            throw bindingUnavailable(binding, `未知协议族: ${String(never)}`);
        }
    }
}
