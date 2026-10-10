/** LLM 三段交接 Schema：story / script / storyboard 手写校验器（零依赖，规格 §5）。 */
export declare class HandoffError extends Error {
    readonly code: 'bad-request' | 'not-found';
    constructor(code: 'bad-request' | 'not-found', message: string);
}
export interface StoryCharacter {
    id: string;
    name: string;
    appearance: string;
    voiceHint?: string;
}
export interface Story {
    title: string;
    logline: string;
    style?: string;
    characters: StoryCharacter[];
    chapters: string[];
}
export interface ScriptScene {
    id: string;
    name: string;
    description: string;
    characters: string[];
}
export interface DialogLine {
    sceneId: string;
    characterId: string;
    line: string;
}
export interface Script extends Story {
    /** 歌词（可选）：会话模型产出，段落标签体系；供 music.song（P2）与成片字幕。 */
    lyrics?: string;
    scenes: ScriptScene[];
    dialog: DialogLine[];
}
export interface StoryboardShot {
    index: number;
    line: string;
    prompt: string;
    characterIds: string[];
    sceneId?: string;
    camera?: string;
    durationSec: number;
    voiceHint?: string;
}
export interface Storyboard {
    shots: StoryboardShot[];
    characters: StoryCharacter[];
    scenes: ScriptScene[];
}
/** 歌词段落标签白名单（规格 §6.2，14 标签体系；校验大小写不敏感，允许 ≤16 字符序号/重复后缀如 [Verse 1]）。 */
export declare const LYRICS_SECTION_TAGS: readonly ["Intro", "Verse", "Pre-Chorus", "Chorus", "Post-Chorus", "Bridge", "Hook", "Refrain", "Interlude", "Break", "Instrumental", "Solo", "Drop", "Outro"];
export declare function validateStory(v: unknown, pathPrefix?: string): Story;
export declare function validateScript(v: unknown): Script;
export declare function validateStoryboard(v: unknown): Storyboard;
