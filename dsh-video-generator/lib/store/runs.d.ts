/** run 持久化：每个 run 一个目录，run.json 即事实源（修鲸影内存 runs 之坑）。 */
import type { GateMode } from './vault.ts';
export type StageState = 'pending' | 'running' | 'done' | 'failed';
export type RunStatus = 'running' | 'done' | 'failed';
export interface RunEvent {
    at: string;
    type: string;
    detail?: Record<string, unknown>;
}
/** 单镜评审档案（规格 §5.3：评分与重拍次数记录进 run.json）。key 形如 `shot-3`。 */
export interface ReviewEntry {
    scores: number[];
    retries: number;
    passed: boolean;
}
export interface RunRecord {
    id: string;
    title: string;
    status: RunStatus;
    stages: Record<string, StageState>;
    events: RunEvent[];
    createdAt: string;
    updatedAt: string;
    /** 评审档案（可选：旧 run.json 无此字段仍合法）。 */
    reviews?: Record<string, ReviewEntry>;
    /** 每段 gate 模式覆盖（可选；生效优先级 = vault.gateDefaults < run.gates < 本次调用参数）。 */
    gates?: Record<string, GateMode>;
}
export declare function resolveRunsDir(env?: NodeJS.ProcessEnv): string;
/** 约束：单进程使用（同步 API 串行化），跨进程并发写同一 runs 目录不在保障范围。 */
export declare class RunStore {
    readonly rootDir: string;
    private lastStampMs;
    private brokenBackedUp;
    constructor(rootDir: string);
    /** 单调逻辑时钟：同实例内每次取号严格递增，毫秒粒度墙钟抖动下排序仍确定。
     * 单调性为实例级；跨实例/墙钟回拨窗口内 updatedAt 排序可能错位（仅影响列表顺序，不损数据）。 */
    private stamp;
    static open(opts?: {
        rootDir?: string;
        env?: NodeJS.ProcessEnv;
    }): RunStore;
    private dirOf;
    private fileOf;
    create(title: string): RunRecord;
    get(id: string): RunRecord | null;
    /** 损坏现场备份原字节（复用已读入的 raw 避免重复读盘，0600 落盘）；同实例内同一 id 只备份一次，
     *  避免 get/list 连续读同一损坏文件时 .broken-* 跨毫秒重复堆积；备份失败不阻塞按不存在处理。 */
    private backupBroken;
    list(): RunRecord[];
    mutate(id: string, fn: (r: RunRecord) => void): RunRecord | null;
    appendEvent(id: string, type: string, detail?: Record<string, unknown>): void;
    setStage(id: string, stage: string, state: StageState): void;
    setStatus(id: string, status: RunStatus): void;
    setReview(id: string, key: string, entry: ReviewEntry): void;
    /** 增量合并 gate 覆盖（undefined 值不清空既有键）。 */
    setGates(id: string, gates: Record<string, GateMode>): void;
    prune(keep?: number): number;
    private persist;
}
