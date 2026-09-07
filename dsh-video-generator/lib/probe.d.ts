/** 通道探测：/models 枚举 + 鉴权校验。开发前置（M0 实测）与产品"测试通道"共用。 */
export interface ProbeTarget {
    baseUrl: string;
    apiKey: string;
}
export interface ProbeResult {
    ok: boolean;
    baseUrl: string;
    models: string[];
    status: number | null;
    error?: 'auth-failed' | 'no-models' | 'bad-json' | 'network' | 'timeout' | `http-${number}`;
}
export declare function probeChannel(target: ProbeTarget, fetchImpl?: typeof fetch, timeoutMs?: number): Promise<ProbeResult>;
