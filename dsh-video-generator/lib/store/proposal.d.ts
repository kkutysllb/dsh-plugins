/** 提案持久化与审核闭环（规格 §7）：Agent 的一切内容产出先落 Proposal，
 * 用户在页面审核（可编辑）并显式「应用」后才写入权威文件。
 *
 * - 提案文件不删除：applied/rejected + 时间 + 备注留痕，供版本历史追溯；
 * - pending 上限 20/项目，超出拒绝新提案；
 * - 应用时的 revision 检查以目标资产**当前 revision** 为准：当前 revision ≠ 提案
 *   baseRevision → 置 stale 并拒绝（proposal-stale），需重新生成或基于最新重审。
 */
import { ProjectStore, type Revision } from './project.ts';
export type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'stale';
export interface ProposalRecord {
    proposalId: string;
    projectId: string;
    taskId?: string;
    assetRef: string;
    baseRevision: Revision;
    /** 提案正文：json 资产为对象，markdown 资产为字符串。 */
    replacement: unknown;
    summary: string;
    /** 由 assetRef 派生的提案类别（premise / architecture / … / chapter-draft / chapter-final）。 */
    kind: string;
    status: ProposalStatus;
    createdBy: string;
    createdAt: string;
    decidedAt?: string;
    note?: string;
    /** 应用后的新版本号（留痕）。 */
    appliedRevision?: Revision;
}
export interface ProposalSummary {
    proposalId: string;
    assetRef: string;
    kind: string;
    status: ProposalStatus;
    summary: string;
    baseRevision: Revision;
    /** 目标资产当前 revision 与提案 baseRevision 是否一致（false = 已过期）。 */
    fresh: boolean;
    createdBy: string;
    createdAt: string;
    decidedAt?: string;
    note?: string;
    taskId?: string;
}
export declare class ProposalStore {
    private projects;
    constructor(projects: ProjectStore);
    private fileOf;
    private read;
    private write;
    list(projectId: string, status?: ProposalStatus): ProposalRecord[];
    get(projectId: string, proposalId: string): ProposalRecord | null;
    requireProposal(projectId: string, proposalId: string): ProposalRecord;
    pendingCount(projectId: string): number;
    /** 落提案（Agent / 页面共用）：绝不写权威文件；形状校验与写入同契约。 */
    create(projectId: string, input: {
        assetRef: string;
        baseRevision: Revision;
        replacement: unknown;
        summary: string;
        taskId?: string;
        createdBy?: string;
    }): ProposalRecord;
    /** 应用提案（可选携带用户编辑后的 replacement）：revision 以目标资产当前值为准。 */
    apply(projectId: string, proposalId: string, replacement?: unknown): {
        revision: Revision;
    };
    reject(projectId: string, proposalId: string, note?: string): void;
    /** 详情投影：fresh 标记供页面在应用前暴露「提案已过期」。 */
    summarize(projectId: string, record: ProposalRecord): ProposalSummary;
}
