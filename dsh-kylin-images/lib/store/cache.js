/**
 * 结果缓存：同（通道 × 模型 × 提示词 × 负面 × 尺寸 × 张数 × 种子）命中即复用。
 *
 * 动机很实际：漫画重渲染只应该补失败页，而不是把 20 页全部重画一遍。
 * 缓存键是内容哈希，不含时间与路径；命中时把缓存文件**复制**到本次产物目录，
 * 调用方拿到的路径语义与真生成完全一致。
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
export const CACHE_INDEX_FILE = 'cache.json';
export const CACHE_DIR_NAME = 'cache';
/** 内容寻址：同输入恒同键，改分辨率/张数/种子都会变键。 */
export function cacheKey(input) {
    const canonical = JSON.stringify([
        input.channelId,
        input.model,
        input.prompt,
        input.negative,
        input.size,
        input.resolution,
        input.count,
        input.seed ?? null,
    ]);
    return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 32);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export class ResultCache {
    dir;
    indexPath;
    constructor(home, dir = join(home, CACHE_DIR_NAME)) {
        this.dir = dir;
        this.indexPath = join(dir, CACHE_INDEX_FILE);
    }
    readIndex() {
        try {
            const raw = JSON.parse(readFileSync(this.indexPath, 'utf8'));
            if (!isRecord(raw) || !isRecord(raw['entries']))
                return { version: 1, entries: {} };
            return { version: 1, entries: raw['entries'] };
        }
        catch {
            return { version: 1, entries: {} };
        }
    }
    writeIndex(index) {
        mkdirSync(this.dir, { recursive: true, mode: 0o700 });
        const tmp = this.indexPath + '.tmp';
        writeFileSync(tmp, JSON.stringify(index, null, 2) + String.fromCharCode(10), { encoding: 'utf8', mode: 0o600 });
        renameSync(tmp, this.indexPath);
    }
    lookup(key) {
        const entry = this.readIndex().entries[key];
        if (entry === undefined)
            return undefined;
        for (const file of entry.files) {
            if (!existsSync(join(this.dir, file)))
                return undefined;
        }
        return entry;
    }
    /** 把产物复制进缓存并登记（命中计数 +1 由 lookup 之后调用者决定）。 */
    store(key, meta, files) {
        if (files.length === 0)
            return undefined;
        mkdirSync(this.dir, { recursive: true, mode: 0o700 });
        const stored = [];
        for (let index = 0; index < files.length; index += 1) {
            const source = files[index];
            if (source === undefined || !existsSync(source))
                continue;
            const extension = basename(source).includes('.') ? basename(source).slice(basename(source).lastIndexOf('.')) : '.png';
            const target = key + '-' + String(index + 1) + extension;
            copyFileSync(source, join(this.dir, target));
            stored.push(target);
        }
        if (stored.length === 0)
            return undefined;
        const entry = { key, ...meta, files: stored, createdAt: new Date().toISOString(), hits: 0 };
        const index = this.readIndex();
        index.entries[key] = entry;
        this.writeIndex(index);
        return entry;
    }
    /** 命中：把缓存文件复制到本次产物目录，返回新路径。 */
    materialize(key, outputDir, fileStem) {
        const index = this.readIndex();
        const entry = index.entries[key];
        if (entry === undefined)
            return undefined;
        mkdirSync(outputDir, { recursive: true, mode: 0o700 });
        const paths = [];
        entry.files.forEach((file, position) => {
            const source = join(this.dir, file);
            if (!existsSync(source))
                return;
            const extension = file.slice(file.lastIndexOf('.'));
            const suffix = entry.files.length === 1 ? '' : '-' + String(position + 1);
            const target = join(outputDir, fileStem + suffix + extension);
            copyFileSync(source, target);
            paths.push(target);
        });
        if (paths.length !== entry.files.length)
            return undefined;
        entry.hits += 1;
        index.entries[key] = entry;
        this.writeIndex(index);
        return paths;
    }
    stats() {
        const index = this.readIndex();
        let bytes = 0;
        let hits = 0;
        for (const entry of Object.values(index.entries)) {
            hits += entry.hits;
            for (const file of entry.files) {
                try {
                    bytes += statSync(join(this.dir, file)).size;
                }
                catch {
                    // 文件已被清理：忽略
                }
            }
        }
        return { entries: Object.keys(index.entries).length, bytes, hits };
    }
    /** 超出上限时按创建时间淘汰最旧条目（含文件）。 */
    prune(maxEntries) {
        if (maxEntries <= 0)
            return 0;
        const index = this.readIndex();
        const entries = Object.values(index.entries);
        if (entries.length <= maxEntries)
            return 0;
        entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const dropped = entries.slice(0, entries.length - maxEntries);
        for (const entry of dropped) {
            for (const file of entry.files) {
                try {
                    unlinkSync(join(this.dir, file));
                }
                catch { /* 已被删除 */ }
            }
            delete index.entries[entry.key];
        }
        this.writeIndex(index);
        return dropped.length;
    }
    /** 清空缓存（文件 + 索引）。 */
    clear() {
        const index = this.readIndex();
        const count = Object.keys(index.entries).length;
        try {
            for (const file of readdirSync(this.dir)) {
                if (file === CACHE_INDEX_FILE)
                    continue;
                try {
                    unlinkSync(join(this.dir, file));
                }
                catch { /* 忽略 */ }
            }
        }
        catch {
            // 目录不存在
        }
        this.writeIndex({ version: 1, entries: {} });
        return count;
    }
}
