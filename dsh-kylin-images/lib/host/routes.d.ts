import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PluginRuntime } from './registry.ts';
export declare const PLUGIN_NAME = "dsh-kylin-images";
export declare const API_PREFIX = "/dsh-kylin-images/api";
export declare const ARTIFACT_PATH = "/dsh-kylin-images/artifact";
export declare const ARTIFACT_TYPES: Record<string, string>;
/**
 * 把请求里的相对路径解析成插件数据目录内的绝对路径。
 *
 * 安全边界：只允许插件自有目录内的文件（realpath 归一后仍须以根目录为前缀），
 * 拒绝绝对路径、`..` 穿越与超出根目录的符号链接目标。
 */
export declare function resolveArtifact(root: string, relative: string): string | undefined;
export declare const HEALTH_PATH = "/dsh-kylin-images/health";
export interface RouteRequest {
    method: string;
    pathname: string;
    host: string;
    headers: Record<string, string | string[] | undefined>;
    query?: Record<string, string> | undefined;
}
export interface RouteResponse {
    status: number;
    payload: unknown;
}
export declare function isLoopbackHost(headers: Record<string, string | string[] | undefined>): boolean;
/** 纯函数路由：不碰 req/res，便于单测直接调用。 */
export declare function handleRequest(runtime: PluginRuntime, request: RouteRequest, body: unknown): Promise<RouteResponse | undefined>;
export interface WebServerLike {
    register(options: {
        kind: string;
        path: string;
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
    }): () => void;
}
export declare function createHandler(runtime: PluginRuntime): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
export declare function registerRoutes(webServer: WebServerLike, runtime: PluginRuntime): () => void;
