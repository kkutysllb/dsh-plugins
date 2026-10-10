/** 通用 OpenAI 风格异步视频适配器（/v1/videos 系）。
 *
 *  契约取 OpenAI Sora 风格（POST /v1/videos → {id,status}；GET /v1/videos/{id} →
 *  {status}；成片在 GET /v1/videos/{id}/content，需 Bearer 下载）。该家族在中转站
 *  的真实信封差异较大（附录 B.4 当时"成功信封待补"），本适配器按此契约实现，
 *  真机钉契约后如有出入以实测附录为准修正，不做模型名猜测。
 */
import { type Provider } from '../provider.ts';
export interface OpenaiVideoChannel {
    baseUrl: string;
    apiKey: string;
    model: string;
    estimate?: (model: string) => number | null;
}
export declare function createOpenaiVideoProvider(ch: OpenaiVideoChannel, fetchImpl?: typeof fetch): Provider;
