export declare const SPEND_FILE = "spend.jsonl";
export declare const SPEND_MAX_BYTES: number;
export declare const SPEND_KEEP_LINES = 500;
export interface SpendRecord {
    at: string;
    channelId: string;
    model: string;
    count: number;
    amount: number;
    currency: string;
    confidence: string;
    promptChars: number;
    durationMs: number;
}
export interface SpendSummary {
    entries: number;
    images: number;
    total: number;
    currency: string;
    byChannel: Record<string, number>;
}
export declare function appendSpend(dir: string, record: SpendRecord): void;
export declare function readSpend(dir: string, limit?: number): SpendRecord[];
export declare function summarizeSpend(records: readonly SpendRecord[]): SpendSummary;
