/** 七段词汇表单一事实源（修 M2 审查遗留：stage 自由字符串散落）。 */
export const STAGES = ['story', 'script', 'storyboard', 'master-asset', 'shot-assets', 'video', 'final-cut'];
export function isStage(s) {
    return STAGES.includes(s);
}
