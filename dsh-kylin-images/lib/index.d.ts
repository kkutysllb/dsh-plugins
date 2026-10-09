import type { WebServerLike } from './host/routes.ts';
import { CONFIG_FIELD_NAMES, Config } from './host/config-schema.ts';
export declare const name = "dsh-kylin-images";
export declare const inject: readonly ["tools", "webServer"];
export declare const VERSION = "0.1.0";
/** 设置命名空间：与宿主的 plugins.bundle.config 座席 key 一致。 */
export declare const SETTINGS_NAMESPACE = "dsh-kylin-images";
export { Config };
export { CONFIG_FIELD_NAMES as CONFIG_FIELDS };
export declare const CONFIG_FIELD_SPECS: Record<string, import("./host/config-schema.ts").ConfigFieldSpec>;
interface ToolRegistry {
    register(definition: unknown): unknown;
}
export interface CordisContext {
    tools?: ToolRegistry | undefined;
    webServer?: WebServerLike | undefined;
    logger?: {
        warn(message: string): void;
        info?(message: string): void;
    } | undefined;
    effect?(register: () => unknown, label?: string): unknown;
    inject?(dependencies: string[], callback: (scoped: unknown) => void): void;
}
export interface SkillMetadata {
    meta: Record<string, string>;
    body: string;
}
/** 极简 frontmatter 解析：只取 name/description 这类单行标量，不引 YAML 解析器。 */
export declare function parseFrontmatter(raw: string): SkillMetadata;
export declare function apply(ctx: CordisContext, rawConfig?: unknown): void;
