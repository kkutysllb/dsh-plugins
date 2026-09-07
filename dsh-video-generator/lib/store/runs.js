/** run 持久化：每个 run 一个目录，run.json 即事实源（修鲸影内存 runs 之坑）。 */
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
export function resolveRunsDir(env = process.env) {
    const base = env['DSH_HOME'] ? join(env['DSH_HOME'], '.dsh-video-generator') : join(homedir(), '.dsh-video-generator');
    return join(base, 'runs');
}
/** 解析成功后的最小形状守卫：id 必须与目录一致，核心字段缺失/类型不符的记录按损坏处理（对齐 vault）。 */
function sanitizeRun(raw, id) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const r = raw;
    if (typeof r.id !== 'string' || r.id !== id)
        return null;
    if (r.status !== 'running' && r.status !== 'done' && r.status !== 'failed')
        return null;
    if (typeof r.stages !== 'object' || r.stages === null || Array.isArray(r.stages))
        return null;
    // stages 值必须为合法四态：值损坏与形状损坏同路径（备份 .broken-* 后按不存在返回）
    for (const state of Object.values(r.stages)) {
        if (state !== 'pending' && state !== 'running' && state !== 'done' && state !== 'failed')
            return null;
    }
    if (!Array.isArray(r.events))
        return null;
    const reviews = sanitizeReviews(r.reviews);
    const gates = sanitizeGates(r.gates);
    return {
        id: r.id,
        title: typeof r.title === 'string' ? r.title : 'untitled',
        status: r.status,
        stages: r.stages,
        events: r.events,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
        ...(reviews ? { reviews } : {}),
        ...(gates ? { gates } : {}),
    };
}
/** reviews 形状守卫：任一条目非法则整体丢弃（undefined）。 */
function sanitizeReviews(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (typeof v !== 'object' || v === null)
            return undefined;
        const e = v;
        if (!Array.isArray(e.scores) || !e.scores.every((s) => typeof s === 'number' && Number.isFinite(s)))
            return undefined;
        if (typeof e.retries !== 'number' || !Number.isInteger(e.retries) || e.retries < 0)
            return undefined;
        if (typeof e.passed !== 'boolean')
            return undefined;
        out[k] = { scores: e.scores, retries: e.retries, passed: e.passed };
    }
    return out;
}
/** gates 形状守卫：任一值非 GateMode 则整体丢弃（undefined）。 */
function sanitizeGates(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
        return undefined;
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (v !== 'auto' && v !== 'ask' && v !== 'manual')
            return undefined;
        out[k] = v;
    }
    return out;
}
/** 约束：单进程使用（同步 API 串行化），跨进程并发写同一 runs 目录不在保障范围。 */
export class RunStore {
    rootDir;
    lastStampMs = 0;
    brokenBackedUp = new Set();
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    /** 单调逻辑时钟：同实例内每次取号严格递增，毫秒粒度墙钟抖动下排序仍确定。
     * 单调性为实例级；跨实例/墙钟回拨窗口内 updatedAt 排序可能错位（仅影响列表顺序，不损数据）。 */
    stamp() {
        const now = Date.now();
        this.lastStampMs = now > this.lastStampMs ? now : this.lastStampMs + 1;
        return new Date(this.lastStampMs).toISOString();
    }
    static open(opts = {}) {
        return new RunStore(opts.rootDir ?? resolveRunsDir(opts.env));
    }
    dirOf(id) {
        return join(this.rootDir, id);
    }
    fileOf(id) {
        return join(this.dirOf(id), 'run.json');
    }
    create(title) {
        const now = this.stamp();
        const id = `run-${Date.now()}-${randomBytes(3).toString('hex')}`;
        const record = {
            id,
            title: String(title ?? '').slice(0, 120) || 'untitled',
            status: 'running',
            stages: {},
            events: [],
            createdAt: now,
            updatedAt: now,
        };
        mkdirSync(this.dirOf(id), { recursive: true, mode: 0o700 });
        this.persist(record);
        return record;
    }
    get(id) {
        let raw;
        try {
            raw = readFileSync(this.fileOf(id), 'utf8');
        }
        catch (err) {
            // 仅 ENOENT 视为正常不存在；EACCES 等权限/IO 故障原样抛出，明确失败好过静默丢数据（对齐 vault）。
            if (err.code === 'ENOENT')
                return null;
            throw err;
        }
        try {
            const record = sanitizeRun(JSON.parse(raw), id);
            if (record)
                return record;
        }
        catch {
            // JSON.parse 抛错与形状不符同路径处理：备份后按不存在返回。
        }
        this.backupBroken(id, raw);
        return null;
    }
    /** 损坏现场备份原字节（复用已读入的 raw 避免重复读盘，0600 落盘）；同实例内同一 id 只备份一次，
     *  避免 get/list 连续读同一损坏文件时 .broken-* 跨毫秒重复堆积；备份失败不阻塞按不存在处理。 */
    backupBroken(id, raw) {
        if (this.brokenBackedUp.has(id))
            return;
        this.brokenBackedUp.add(id);
        try {
            writeFileSync(`${this.fileOf(id)}.broken-${Date.now()}`, raw, { mode: 0o600 });
        }
        catch {
            // 备份失败不阻塞
        }
    }
    list() {
        let ids = [];
        try {
            // withFileTypes 直接区分目录与杂散文件（.DS_Store 等），非目录条目跳过，避免 get() 触发 ENOTDIR 放大为整体失败。
            ids = readdirSync(this.rootDir, { withFileTypes: true })
                .filter((e) => e.isDirectory())
                .map((e) => e.name);
        }
        catch {
            return [];
        }
        return ids
            .map((id) => this.get(id))
            .filter((r) => r !== null)
            .sort((a, b) => (a.updatedAt === b.updatedAt ? (a.id < b.id ? 1 : -1) : a.updatedAt < b.updatedAt ? 1 : -1));
    }
    mutate(id, fn) {
        const record = this.get(id);
        if (!record)
            return null;
        fn(record);
        record.updatedAt = this.stamp();
        this.persist(record);
        return record;
    }
    appendEvent(id, type, detail) {
        this.mutate(id, (r) => {
            r.events.push({ at: this.stamp(), type, detail });
        });
    }
    setStage(id, stage, state) {
        this.mutate(id, (r) => {
            r.stages[stage] = state;
        });
    }
    setStatus(id, status) {
        this.mutate(id, (r) => {
            r.status = status;
        });
    }
    setReview(id, key, entry) {
        this.mutate(id, (r) => {
            if (!r.reviews)
                r.reviews = {};
            r.reviews[key] = entry;
        });
    }
    /** 增量合并 gate 覆盖（undefined 值不清空既有键）。 */
    setGates(id, gates) {
        this.mutate(id, (r) => {
            r.gates = { ...(r.gates ?? {}), ...gates };
        });
    }
    prune(keep = 50) {
        const all = this.list();
        let removed = 0;
        for (const r of all.slice(keep)) {
            rmSync(this.dirOf(r.id), { recursive: true, force: true });
            removed++;
        }
        return removed;
    }
    persist(record) {
        mkdirSync(this.dirOf(record.id), { recursive: true, mode: 0o700 });
        const tmp = `${this.fileOf(record.id)}.tmp-${process.pid}`;
        writeFileSync(tmp, JSON.stringify(record, null, 2), { mode: 0o600 });
        renameSync(tmp, this.fileOf(record.id));
    }
}
