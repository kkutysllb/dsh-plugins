/** 单镜视频片段生成序列（machine video 段与 vgen_review 重拍共用，DRY）。
 *  职责边界：只做 submit→poll→fetch→save；成本确认/记账/事件由调用方负责。
 *  imageUrl 缺省 = 文生视频降级路径（槽位能力位 textToVideo 声明后由调用方决策）。 */
import type { Provider } from '../provider.ts';
/** i2v 通用运动提示词（重拍时在其后追加负面要求）。 */
export declare const SHOT_MOTION_PROMPT = "\u955C\u5934\u7F13\u6162\u63A8\u8FDB\uFF0C\u4E3B\u4F53\u81EA\u7136\u8FD0\u52A8\uFF0C\u7535\u5F71\u611F\u5149\u5F71";
/** 下载 URL 到本地（0600）；120s 超时（对偶发慢 CDN 的实测收紧值）。headers 供需鉴权的下载端点透传。 */
export declare function saveUrl(fetchImpl: typeof fetch, url: string, file: string, headers?: Record<string, string>): Promise<void>;
export interface ShotClipOptions {
    provider: Provider;
    fetchImpl: typeof fetch;
    /** i2v 参考图；缺省走 t2v（上游不支持时会以原始错误失败，调用方已按能力位门控）。 */
    imageUrl?: string | null;
    prompt: string;
    durationSec: number;
    outFile: string;
    pollDelayMs?: number;
    maxPollMs?: number;
    /** 取消信号：中止轮询立即抛 PollAbortedError（调用方转中断语义）。 */
    signal?: AbortSignal;
    /** submit 成功即回调（调用方在此落 spend 事件，保持与原 machine 相同的事件顺序）。 */
    onSubmit?: (jobId: string) => void;
}
export declare function generateShotClip(o: ShotClipOptions): Promise<string>;
