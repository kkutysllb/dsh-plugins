/** MV 时长预算（规格 §6.5）：mode=mv 时把分镜 durationSec 等比缩放到歌曲时长，
 *  单镜夹在 [min,max]；两轮再分配误差；输出偏差供 ±2% 验收断言与事件留痕。
 */
export interface MvBudgetResult {
    /** 调整后的每镜时长（与输入等长、同序）。 */
    durations: number[];
    beforeSec: number;
    afterSec: number;
    deviationSec: number;
    /** 是否有镜头触碰上下限（再分配受限）。 */
    clamped: boolean;
}
export interface MvBudgetLimits {
    min?: number;
    max?: number;
}
/** 等比缩放 + 夹取 + 有限轮再分配。songSec 非法（≤0）时原样返回。 */
export declare function applyMvBudget(durationsSec: number[], songSec: number, limits?: MvBudgetLimits): MvBudgetResult;
