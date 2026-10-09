import type { VisualPlan } from './select.ts';
export declare const COMIC_DIR = "comics";
export declare const COMIC_STATE_FILE = "comic.json";
export declare const COMIC_STAGES: readonly ["open", "planned", "rendering", "rendered", "assembled"];
export type ComicStage = (typeof COMIC_STAGES)[number];
export declare const PAGE_STATUSES: readonly ["pending", "rendered", "failed"];
export type PageStatus = (typeof PAGE_STATUSES)[number];
export interface ComicCharacter {
    name: string;
    sheet: string;
}
export interface ComicPage {
    /** 0 = 封面。 */
    index: number;
    title: string;
    /** 相对项目目录的提示词文件路径。 */
    promptFile: string;
    status: PageStatus;
    imagePath?: string | undefined;
    error?: string | undefined;
    durationMs?: number | undefined;
}
export interface ComicProject {
    version: 1;
    id: string;
    topic: string;
    createdAt: string;
    updatedAt: string;
    stage: ComicStage;
    plan: VisualPlan;
    selection: {
        priority: number;
        matchedRule: string;
        reason: string;
    };
    channelId: string;
    model: string;
    characters: ComicCharacter[];
    pages: ComicPage[];
    /** 是否用角色三视图做图像锁（需要通道支持参考图）。 */
    imageLock: boolean;
    spend: {
        images: number;
        amount: number;
        currency: string;
    };
}
/**
 * 由主题生成 2-4 个关键词的 kebab-case slug。
 * 中文按「连续汉字片段」保留（至少 2 字），英文按单词。
 */
export declare function slugify(topic: string): string;
export declare function comicRoot(home: string, override?: string): string;
export declare function promptPathFor(index: number): string;
export declare function imagePathFor(index: number): string;
export declare class ComicStore {
    readonly root: string;
    constructor(root: string);
    dirOf(id: string): string;
    /** 冲突时追加时间戳（沿用 KSkills 技能的约定）。 */
    allocateId(topic: string, now?: Date): string;
    create(topic: string, init: {
        plan: VisualPlan;
        selection: ComicProject['selection'];
        channelId: string;
        model: string;
        imageLock: boolean;
    }): ComicProject;
    read(id: string): ComicProject | undefined;
    write(project: ComicProject): void;
    list(): ComicProject[];
}
