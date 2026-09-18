/** Drama 宿主网关：workspaceId → 规范目录解析（workspace registry 宿主契约，同
 * dsh-kylin-automation）+ ProjectStore/ProposalStore 每工作区缓存。
 *
 * 安全边界（规格 §4.1）：浏览器与 Agent 都只提交不透明 workspaceId，本地路径
 * 永远由 Host 侧 registry 解析；未知 id 一律 `workspace-unknown`，错误信息不带
 * 本地路径细节。
 */
import { join } from 'node:path';
import { ProjectStore, DramaError } from "../store/project.js";
import { ProposalStore } from "../store/proposal.js";
export class DramaHost {
    registry;
    cache = new Map();
    constructor(opts = {}) {
        this.registry = opts.registry ?? null;
    }
    registryAvailable() {
        return this.registry !== null;
    }
    /** 已注册工作区列表（只回 id/title，绝不回本地路径）。 */
    workspaceList() {
        if (!this.registry)
            return [];
        try {
            return this.registry
                .list()
                .map((w) => ({ id: String(w.id), title: String(w.title ?? w.id) }))
                .sort((a, b) => (a.id < b.id ? -1 : 1));
        }
        catch {
            return [];
        }
    }
    /** 解析并缓存 workspace 的 stores。未知 id / registry 缺失 → workspace-unknown。 */
    resolve(workspaceId) {
        if (typeof workspaceId !== 'string' || workspaceId.length === 0 || workspaceId.length > 200) {
            throw new DramaError('workspace-unknown', '缺少有效的 workspaceId');
        }
        if (!this.registry) {
            throw new DramaError('workspace-unknown', '宿主未提供 workspace registry（宿主版本过旧？），漫剧工坊项目存储不可用');
        }
        const cached = this.cache.get(workspaceId);
        if (cached)
            return cached;
        let entry;
        try {
            entry = this.registry.get(workspaceId);
        }
        catch {
            entry = undefined;
        }
        const dir = entry?.path;
        if (!entry || typeof dir !== 'string' || dir.length === 0) {
            throw new DramaError('workspace-unknown', `工作区不存在或已关闭: ${workspaceId}`);
        }
        const projects = ProjectStore.open({ workspaceDir: dir });
        const resolved = {
            id: workspaceId,
            title: String(entry.title ?? workspaceId),
            dir,
            projects,
            proposals: new ProposalStore(projects),
        };
        this.cache.set(workspaceId, resolved);
        return resolved;
    }
    /** 项目必须存在（not-found 语义集中在这里）。 */
    requireProject(workspaceId, projectId) {
        const ws = this.resolve(workspaceId);
        if (typeof projectId !== 'string' || projectId.length === 0) {
            throw new DramaError('bad-request', '缺少 projectId');
        }
        ws.projects.requireProject(projectId);
        return ws;
    }
}
/** `.dsh-drama` 目录名（供诊断展示）。 */
export const DRAMA_DIRNAME = '.dsh-drama';
export function dramaRootOf(workspaceDir) {
    return join(workspaceDir, DRAMA_DIRNAME);
}
