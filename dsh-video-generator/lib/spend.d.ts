/** 消费记账（JSONL 追加，幂等崩溃安全）+ 预算确认判定（规格 §4.4）。 */
export interface SpendEntry {
    at: string;
    channel: string;
    model: string;
    kind: string;
    estCny: number | null;
    jobId: string;
}
export declare class SpendLedger {
    readonly file: string;
    constructor(file: string);
    static open(env?: NodeJS.ProcessEnv): SpendLedger;
    record(entry: Omit<SpendEntry, 'at'>): void;
    totals(): {
        count: number;
        estCny: number;
    };
}
/** 估价未知（null）按规格 §4.4 一律走确认（confirmer 收到 'unknown'）；超阈值走确认；其余放行。 */
export declare function confirmSpend(estCny: number | null, thresholdCny: number, confirmer: (est: number | 'unknown') => boolean): boolean;
