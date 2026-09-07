/** OpenAI 兼容图像适配器（契约：规格附录 B.3）。同步 API → jobId = 图片 URL 短路。 */
import { type Provider } from '../provider.ts';
export interface ImageChannel {
    baseUrl: string;
    apiKey: string;
    model: string;
    /** 可选：注入按次估价（来自 pricing 层）；缺省 0（走调用方确认逻辑）。 */
    estimate?: (model: string) => number | null;
}
export declare function createOpenaiImagesProvider(ch: ImageChannel, fetchImpl?: typeof fetch): Provider;
