/** 四层提示词（规格 §5：dna/模板/手写顺序即权重；injections 负向）+ 移植鲸影模板精华。 */
export interface PromptLayers {
    dna?: string;
    shotTemplate?: string;
    manual?: string;
    injections?: string[];
}
export interface MergedPrompt {
    positive: string;
    negative: string;
}
export declare const GENERIC_NEGATIVE: string[];
export declare const CHARACTER_NEGATIVE: string[];
/** 前三层顺序拼接（顺序即权重），injections 独立为负向（空则 GENERIC_NEGATIVE）。 */
export declare function mergePromptLayers(layers: PromptLayers): MergedPrompt;
export interface CharacterSheetInput {
    name: string;
    appearance: string;
    style?: string;
}
/** 角色三视图卡（一致性锚：版式 + 度量 + 一致性锁，移植鲸影 character-sheet 精华）。 */
export declare function buildCharacterSheetPrompt(input: CharacterSheetInput): MergedPrompt;
export interface SceneInput {
    name: string;
    description: string;
    style?: string;
}
/** 场景主图（无人物入镜约束）。 */
export declare function buildScenePrompt(input: SceneInput): MergedPrompt;
export interface ShotInput {
    line: string;
    characterAnchors: string[];
    camera?: string;
    style?: string;
    referenceHint?: string;
}
/** 单镜画面（分镜行 + 角色锚定 + 景别运镜 + 参考图提示）。 */
export declare function buildShotPrompt(input: ShotInput): MergedPrompt;
