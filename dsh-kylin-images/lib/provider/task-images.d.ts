import type { HttpOptions } from './http.ts';
import type { ChannelRecord, GenerateRequest, GenerateResult, ImageProvider, ProbeResult, ProviderHealth } from './types.ts';
export declare const TASK_SUBMIT_PATH = "/v1/images/generations";
export declare const TASK_STATUS_PATH = "/v1/tasks/{id}";
export declare const DEFAULT_POLL_INTERVAL_MS = 2000;
export declare const DEFAULT_POLL_TIMEOUT_MS: number;
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unknown';
/** 任务查询地址：statusPath 支持 {id} 占位符。 */
export declare function taskStatusUrl(baseUrl: string, statusPath: string | undefined, taskId: string): string;
export declare function extractTaskId(body: unknown): string;
/** 状态归一：in_progress -> processing；未知状态保持 unknown（轮询继续，由超时兜底）。 */
export declare function normalizeTaskStatus(body: unknown): TaskStatus;
/** 从任务响应里取产物 URL（容忍 url 为数组、images 为对象数组两种形态）。 */
export declare function extractImageUrls(body: unknown): string[];
export declare function extractTaskError(body: unknown): string;
export declare class TaskImagesProvider implements ImageProvider {
    readonly kind: "task-images";
    private headers;
    health(channel: ChannelRecord, http?: HttpOptions): Promise<ProviderHealth>;
    probe(channel: ChannelRecord, options?: {
        realRun?: boolean;
        http?: HttpOptions;
        outputDir?: string;
    }): Promise<ProbeResult>;
    generate(channel: ChannelRecord, request: GenerateRequest): Promise<GenerateResult>;
}
