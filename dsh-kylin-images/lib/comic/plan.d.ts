/**
 * 分镜 → ImagePrompt v1 编译。
 *
 * 这是知识漫画管线的核心交接点：会话模型产出「分镜」（结构化 JSON 或 Markdown 表格），
 * 插件把它翻译成每页可执行的 ImagePrompt 契约，并在这里落实三锁的两条：
 *   - 文字锁：出场角色的角色表逐字注入 characters[].sheet；
 *   - 风格锁：项目级 artStyle/tone/layout/宽高比 + 全篇同一句风格前言（进 constraints.must）。
 * 第三条图像锁（角色三视图作参考图）由 render 阶段注入。
 */
import type { ImagePrompt } from '../prompt/schema.ts';
import type { AspectRatio } from '../prompt/vocab.ts';
import type { VisualPlan } from './select.ts';
import type { ComicCharacter } from './project.ts';
export interface StoryboardDialogue {
    speaker?: string;
    text: string;
}
export interface StoryboardPage {
    title: string;
    /** 该页核心信息（一句话）。 */
    core?: string;
    /** 场景描述（地点/时间/氛围）。 */
    scene?: string;
    /** 出场角色名，需能在项目 characters 里找到。 */
    characters?: string[];
    /** 覆盖项目布局。 */
    layout?: string;
    shot?: string;
    panels?: string[];
    focus?: string;
    dialogue?: StoryboardDialogue[];
    narration?: string;
}
export interface Storyboard {
    pages: StoryboardPage[];
}
export interface StoryboardParseResult {
    ok: boolean;
    errors: string[];
    value: Storyboard;
}
/** 解析分镜：容错但严格校验必填项（页码顺序由数组顺序决定）。 */
export declare function parseStoryboard(raw: unknown): StoryboardParseResult;
export declare function parseCharacters(raw: unknown): {
    ok: boolean;
    errors: string[];
    value: ComicCharacter[];
};
/** 全篇同一句风格前言：风格锁的可测锚点。 */
export declare function stylePreambleOf(plan: VisualPlan): string;
export interface BuildPageInput {
    page: StoryboardPage;
    index: number;
    projectId: string;
    plan: VisualPlan;
    characters: readonly ComicCharacter[];
    aspectRatio?: AspectRatio | undefined;
    resolution?: string | undefined;
    /** 语言提示：画面内文字必须与源语言一致，这里只标注。 */
    language?: string | undefined;
}
/** 把一页分镜编译成 ImagePrompt v1。纯函数，可 golden 测试。 */
export declare function buildPagePrompt(input: BuildPageInput): ImagePrompt;
/** 项目视觉方案 → 一句话说明（给 status / 卡片用）。 */
export declare function describePlan(plan: VisualPlan): string;
