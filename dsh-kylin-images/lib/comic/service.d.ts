import type { PluginRuntime } from '../host/registry.ts';
import type { VisualPlan } from './select.ts';
import type { ComicProject } from './project.ts';
export declare const SHEET_FILE = "images/sheet-character.png";
export interface ComicActionInput {
    action: string;
    id?: string | undefined;
    topic?: string | undefined;
    source?: string | undefined;
    analysis?: string | undefined;
    keywords?: string[] | undefined;
    plan?: Partial<VisualPlan> | undefined;
    channelId?: string | undefined;
    model?: string | undefined;
    dir?: string | undefined;
    imageLock?: boolean | undefined;
    characters?: unknown;
    storyboard?: unknown;
    pages?: number[] | undefined;
    concurrency?: number | undefined;
    confirm?: boolean | undefined;
}
export interface ComicOutcome {
    ok: boolean;
    message: string;
    project?: ComicProject | undefined;
    /** 本动作直接产出或引用的绝对路径。 */
    artifacts: string[];
    /** 需要用户确认时给出（成本护栏）。 */
    pendingConfirm?: number | undefined;
}
/** 行动作分发。永不抛异常（错误转成 ok:false 的可读消息）。 */
export declare function runComicAction(runtime: PluginRuntime, input: ComicActionInput): Promise<ComicOutcome>;
/** 不带 id 的列表（status 的通用形态）。 */
export declare function listProjects(runtime: PluginRuntime, dir?: string): ComicProject[];
