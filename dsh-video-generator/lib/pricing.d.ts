/** 站点价目（规格附录 B.5）：/api/pricing 公开可读；quota_type=1 按次（model_price），0 按量（离线不可估）。 */
export interface PricingRow {
    model_name: string;
    model_type?: string;
    quota_type: number;
    model_ratio: number;
    model_price: number;
}
export type PricingTable = Map<string, PricingRow>;
export declare function fetchPricing(target: {
    baseUrl: string;
    apiKey: string;
}, fetchImpl?: typeof fetch, timeoutMs?: number): Promise<PricingTable>;
/** 按次模型返回单次成本原始值（计价单位口径见附录 B.5）；按量/未知返回 null（调用方走确认）。 */
export declare function estimateCny(model: string, table: PricingTable): number | null;
