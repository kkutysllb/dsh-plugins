/** Drama 宿主网关：workspaceId → 规范目录解析（workspace registry 宿主契约，同
 * dsh-kylin-automation）+ ProjectStore/ProposalStore 每工作区缓存。
 *
 * 安全边界（规格 §4.1）：浏览器与 Agent 都只提交不透明 workspaceId，本地路径
 * 永远由 Host 侧 registry 解析；未知 id 一律 `workspace-unknown`，错误信息不带
 * 本地路径细节。
 */
import { ProjectStore } from '../store/project.ts';
import { ProposalStore } from '../store/proposal.ts';
/** workspace registry 最小面（宿主软探测：缺失时 drama 功能整体降级）。 */
export interface WorkspaceRegistryFace {
    get(id: string): {
        path: string;
        title?: string;
    } | undefined;
    list(): Array<{
        id: string;
        title?: string;
        cwd?: string;
        path?: string;
    }>;
}
export interface WorkspaceBrief {
    id: string;
    title: string;
}
export interface ResolvedWorkspace {
    id: string;
    title: string;
    dir: string;
    projects: ProjectStore;
    proposals: ProposalStore;
}
export declare class DramaHost {
    private registry;
    private cache;
    constructor(opts?: {
        registry?: WorkspaceRegistryFace | null;
    });
    registryAvailable(): boolean;
    /** 已注册工作区列表（只回 id/title，绝不回本地路径）。 */
    workspaceList(): WorkspaceBrief[];
    /** 解析并缓存 workspace 的 stores。未知 id / registry 缺失 → workspace-unknown。 */
    resolve(workspaceId: unknown): ResolvedWorkspace;
    /** 项目必须存在（not-found 语义集中在这里）。 */
    requireProject(workspaceId: unknown, projectId: unknown): ResolvedWorkspace;
}
/** `.dsh-drama` 目录名（供诊断展示）。 */
export declare const DRAMA_DIRNAME = ".dsh-drama";
export declare function dramaRootOf(workspaceDir: string): string;
