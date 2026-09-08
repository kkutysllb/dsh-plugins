/**
 * /dsh-video-generator API 面：纯函数 handler + {ok,value}/{ok,error} 信封 + loopback 信任围栏。
 * 对齐 dsh-super-ppts 路由模式；handler 不碰 node:http，便于无宿主测试。
 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
import type { probeChannel } from '../probe.ts';
export declare const PLUGIN_ID = "dsh-video-generator";
export declare const PLUGIN_VERSION = "1.0.2";
export interface ApiContext {
    vault: VaultStore;
    runs: RunStore;
    probe: typeof probeChannel;
}
export type Envelope = {
    ok: true;
    value: unknown;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
    };
};
export type MaybePromise<T> = T | Promise<T>;
export declare function isLoopbackRequest(host: string | string[] | undefined, remote: string | undefined, trustedHosts?: readonly string[]): boolean;
export declare function healthPayload(ctx: {
    vault: VaultStore;
    runs: RunStore;
}): Record<string, unknown>;
export declare function handleApi(ctx: ApiContext, name: string, args: Record<string, unknown>): MaybePromise<Envelope>;
/** '/media/<runId>/<rel...>' → run 目录内绝对路径；任何穿越/畸形 → null（调用方 404）。
 *  入参 urlPath 必须已 decodeURIComponent。防线三层：runId 白名单正则、rel 段级拒绝 '.'/'..'/空段、
 *  resolve 后前缀核验（endsWith 兜底不做——前缀 + sep 即充分）。 */
export declare function resolveMediaPath(runsRoot: string, urlPath: string): string | null;
export declare function mediaContentType(filename: string): string;
