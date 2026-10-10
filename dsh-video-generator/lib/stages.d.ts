/** 七段词汇表单一事实源（修 M2 审查遗留：stage 自由字符串散落）。 */
export declare const STAGES: readonly ["story", "script", "storyboard", "master-asset", "shot-assets", "video", "music", "final-cut"];
export type StageId = (typeof STAGES)[number];
export declare function isStage(s: string): s is StageId;
