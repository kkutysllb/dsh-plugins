/** vgen_provide：manual gate 产物注入（规格 §5.2）。用户在会话中给出本地文件路径，
 *  插件按段校验（存在/非空/命名/全镜覆盖/时长）后拷贝进 run 目录并置段 done，管线接管。
 *  约束：注入 shot-assets 后 video 段自动 i2v 不可用（无公网 URL），响应内显式警示。 */
import type { RunStore } from '../store/runs.ts';
import type { ToolResult, DshToolDefinition } from './handoff.ts';
export type ProvideStage = 'master-asset' | 'shot-assets' | 'video' | 'final-cut';
export interface ProvideFile {
    path: string;
    shot?: number;
    name?: string;
}
export interface ProvideArgs {
    runId: string;
    stage: ProvideStage;
    files: ProvideFile[];
}
export interface ProvideContext {
    runs: RunStore;
    env?: NodeJS.ProcessEnv;
    /** undefined → locateFfmpeg(env)；null = 无 ffmpeg（video 段时长校验拒绝）。测试注入。 */
    ffmpeg?: string | null;
    /** 测试注入：时长探测。 */
    probe?: (file: string, ffmpeg: string) => Promise<number | null>;
}
export declare function buildProvideTools(ctx: ProvideContext): {
    provide: {
        execute: (args: ProvideArgs) => Promise<ToolResult>;
    };
};
export declare function provideToolDefs(tools: ReturnType<typeof buildProvideTools>): DshToolDefinition[];
