/** 通用音乐适配器：声明式端点映射，零 provider 绑定（规格 2026-09-28 §4）。
 *
 *  请求体 = { model, [promptField]: prompt, ...用户映射的歌词/器乐/时长/参考音频字段 }
 *  响应   = sync：直接读 audioPath（URL 或 base64）；async：jobIdPath 取任务 id →
 *           GET endpoint.statusPath（{id} 占位）→ statusValuePath 判态 → audioPath 取音频。
 *  路径求值只认 点号 + [n] 下标（与 slots.ts 的守卫一致）。
 */
import { type Provider } from '../provider.ts';
import type { SlotBinding } from '../store/slots.ts';
export interface GenericMusicChannel {
    baseUrl: string;
    apiKey: string;
}
export interface MusicSubmitSpec {
    prompt: string;
    lyrics?: string;
    instrumental?: boolean;
    durationSec?: number;
    referenceAudioUrl?: string;
}
/** 点号 + [n] 下标的最小路径求值；任何一步缺失返回 undefined（不计正则/通配）。 */
export declare function readPath(value: unknown, path: string): unknown;
export declare function createGenericMusicProvider(channel: GenericMusicChannel, binding: SlotBinding, fetchImpl?: typeof fetch): Provider;
