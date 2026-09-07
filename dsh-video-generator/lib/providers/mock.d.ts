/** 零 key mock 供应商：内存任务状态机，两次 poll 后 done。 */
import { type Provider } from '../provider.ts';
export interface MockOptions {
    /** 前 N 次 submit 注入失败（测退避/换道逻辑）。 */
    failFirst?: number;
    seq?: () => number;
}
export declare function createMockProvider(options?: MockOptions): Provider;
