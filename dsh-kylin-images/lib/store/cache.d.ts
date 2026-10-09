export declare const CACHE_INDEX_FILE = "cache.json";
export declare const CACHE_DIR_NAME = "cache";
export interface CacheEntry {
    key: string;
    channelId: string;
    model: string;
    size: string;
    resolution: string;
    count: number;
    seed?: number;
    /** 缓存目录内的相对文件名。 */
    files: string[];
    createdAt: string;
    hits: number;
}
export interface CacheIndex {
    version: 1;
    entries: Record<string, CacheEntry>;
}
export interface CacheKeyInput {
    channelId: string;
    model: string;
    prompt: string;
    negative: string;
    size: string;
    resolution: string;
    count: number;
    seed?: number | undefined;
}
/** 内容寻址：同输入恒同键，改分辨率/张数/种子都会变键。 */
export declare function cacheKey(input: CacheKeyInput): string;
export declare class ResultCache {
    readonly dir: string;
    readonly indexPath: string;
    constructor(home: string, dir?: string);
    private readIndex;
    private writeIndex;
    lookup(key: string): CacheEntry | undefined;
    /** 把产物复制进缓存并登记（命中计数 +1 由 lookup 之后调用者决定）。 */
    store(key: string, meta: Omit<CacheEntry, 'key' | 'files' | 'createdAt' | 'hits'>, files: readonly string[]): CacheEntry | undefined;
    /** 命中：把缓存文件复制到本次产物目录，返回新路径。 */
    materialize(key: string, outputDir: string, fileStem: string): string[] | undefined;
    stats(): {
        entries: number;
        bytes: number;
        hits: number;
    };
    /** 超出上限时按创建时间淘汰最旧条目（含文件）。 */
    prune(maxEntries: number): number;
    /** 清空缓存（文件 + 索引）。 */
    clear(): number;
}
