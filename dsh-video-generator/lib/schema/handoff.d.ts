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
export declare function validateStory(v: unknown, pathPrefix?: string): Story;
export declare function validateScript(v: unknown): Script;
export declare function validateStoryboard(v: unknown): Storyboard;
