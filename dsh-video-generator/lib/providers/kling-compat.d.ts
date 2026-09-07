/** kling-compat 适配器（Kling 原生协议经中转 /kling-compat 前缀；路径已实钉，成功信封按 Kling 原生文档，实钉任务核对字段映射）。 */
import { type Provider } from '../provider.ts';
export interface KlingCompatChannel {
    baseUrl: string;
    apiKey: string;
    model: string;
    estimate?: (model: string) => number | null;
}
export declare function createKlingCompatProvider(ch: KlingCompatChannel, fetchImpl?: typeof fetch): Provider;
