/** 任务指令组装（规格 §5/§6.3）：Host 按 kind 模板在服务端组装任务指令。
 *
 * 「有限上下文」铁律在这里成为可单测断言的纯函数：章节草稿任务只携带
 * 本章蓝图 + 出场角色摘要 + 相关世界观条目 + 上一章相邻定稿末段 + 连续性事实
 * + 用户本次要求，绝不携带整本书。页面只提交 kind/params/用户要求。
 */
import type { AdaptationParams, ArchitectureAsset, ChapterBlueprint, CharacterRecord, OutlineRow, PremiseAsset, ReviewProblem, WorldEntry } from '../store/project.ts';
export type TaskKind = 'generate-architecture' | 'generate-worldbuilding' | 'complete-characters' | 'generate-outline' | 'generate-chapter-blueprint' | 'generate-chapter-draft' | 'review-chapter' | 'revise-chapter' | 'adapt-chapter';
export declare const TASK_KINDS: readonly TaskKind[];
export declare function isTaskKind(v: unknown): v is TaskKind;
/** 各 kind 的提案目标资产（产出行的 drama_propose 落点）。 */
export declare function proposeTarget(kind: TaskKind, chapterNumber?: number): string;
/** 相关世界观条目：「供正文引用」优先；一个都没标时回退全部；截断到上限。 */
export declare function relevantWorldEntries(entries: WorldEntry[]): WorldEntry[];
/** 出场角色摘要：指定 ids 时过滤；超长截断。改编任务保留视觉提示词全文。 */
export declare function characterSummaries(characters: CharacterRecord[], ids: string[] | null, withVisualPrompt: boolean): CharacterRecord[];
/** 上一章相邻定稿末段 + 连续性事实（承接上下文只有这一点）。 */
export declare function prevChapterContext(prevFinal: string | null, prevBlueprint: ChapterBlueprint | null): {
    excerpt: string;
    facts: string[];
};
export interface InstructionContext {
    projectId: string;
    workspaceId: string;
    premise: PremiseAsset | null;
    architecture: ArchitectureAsset | null;
    outlineRow: OutlineRow | null;
    blueprint: ChapterBlueprint | null;
    /** 相关性挑选后的世界观条目（调用方用 relevantWorldEntries 裁剪）。 */
    worldEntries: WorldEntry[];
    /** 出场挑选后的角色（调用方用 characterSummaries 裁剪）。 */
    characters: CharacterRecord[];
    chapterNumber?: number;
    prevFinalExcerpt?: string;
    continuityFacts?: string[];
    /** review/revise 的对象草稿全文（上限内）。 */
    draft?: string;
    /** revise 的选中审稿问题。 */
    problems?: ReviewProblem[];
    /** adapt-chapter 专用。 */
    adaptation?: {
        adaptationId: string;
        params: AdaptationParams;
        chapterText: string;
    };
    userRequest?: string;
}
/** 渲染 §6.3 模板。所有字段都来自 Host 组装的有限上下文。 */
export declare function assembleInstruction(kind: TaskKind, ctx: InstructionContext): {
    instruction: string;
    inputRefs: string[];
};
