/** 单镜视频片段生成序列（machine video 段与 vgen_review 重拍共用，DRY）。
 *  职责边界：只做 submit→poll→fetch→save；成本确认/记账/事件由调用方负责。 */
import type { Provider } from '../provider.ts';
/** i2v 通用运动提示词（重拍时在其后追加负面要求）。 */
export declare const SHOT_MOTION_PROMPT = "\u955C\u5934\u7F13\u6162\u63A8\u8FDB\uFF0C\u4E3B\u4F53\u81EA\u7136\u8FD0\u52A8\uFF0C\u7535\u5F71\u611F\u5149\u5F71";
/** 下载 URL 到本地（0600）；120s 超时（对偶发慢 CDN 的实测收紧值）。 */
export declare function saveUrl(fetchImpl: typeof fetch, url: string, file: string): Promise<void>;
export interface ShotClipOptions {
    provider: Provider;
    fetchImpl: typeof fetch;
    imageUrl: string;
    prompt: string;
    durationSec: number;
    outFile: string;
    pollDelayMs?: number;
    maxPollMs?: number;
    /** submit 成功即回调（调用方在此落 spend 事件，保持与原 machine 相同的事件顺序）。 */
    onSubmit?: (jobId: string) => void;
}
export declare function generateShotClip(o: ShotClipOptions): Promise<string>;
