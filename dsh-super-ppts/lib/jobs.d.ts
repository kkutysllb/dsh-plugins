import type { TaskBrief, TaskWorkspace } from './tasks.js';
export declare const JOBS_ROOT: string;
export type JobFormat = 'pptx' | 'html';
export type JobStage = 'brief' | 'plan' | 'build' | 'conformance' | 'visual' | 'delivery' | 'blocked';
export type JobStatus = 'active' | 'waiting-user' | 'blocked' | 'delivered' | 'cancelled';
export type GateId = 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
export type GateKind = 'machine' | 'user';
export type GateStatus = 'pending' | 'ready' | 'passed' | 'approved' | 'rejected' | 'blocked';
export type CheckStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNVERIFIED' | 'ERROR';
export type WorkOrderStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled' | 'blocked';
export type WorkOrderRole = 'planner' | 'builder' | 'user';
export type ArtifactKind = 'pptx' | 'pdf' | 'html' | 'png' | 'report' | 'script';
export interface JobGateCheck {
    id: string;
    status: CheckStatus;
    reportPath?: string;
    detail?: string;
}
export interface JobGate {
    id: GateId;
    kind: GateKind;
    stage: JobStage;
    status: GateStatus;
    checks: JobGateCheck[];
    blockers: unknown[];
    approvedBy?: string;
    approvedAt?: string;
    note?: string;
}
export interface JobModel {
    provider: string;
    model: string;
    reasoningEffort?: string;
    label?: string;
}
export interface JobMaterial {
    id: string;
    name: string;
    size: number;
    status: 'pending' | 'ready' | 'error';
    path?: string;
    createdAt: string;
}
export interface JobArtifact {
    id: string;
    kind: ArtifactKind;
    path: string;
    revision: number;
    sha256?: string;
    size?: number;
    status: 'ready' | 'stale' | 'missing';
    producedBy: 'builder' | 'host' | 'user';
    createdAt: string;
}
export interface WorkOrder {
    id: string;
    jobId: string;
    role: WorkOrderRole;
    stage: JobStage;
    title: string;
    prompt: string;
    acceptance: string[];
    dependsOn: string[];
    status: WorkOrderStatus;
    attempt: number;
    handoffId?: string;
    sessionId?: string;
    result?: {
        summary?: string;
        artifacts?: string[];
    };
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
}
export interface NextAction {
    kind: 'gate' | 'workorder' | 'manual' | 'blocked' | 'none';
    gateId?: GateId;
    workOrderId?: string;
    reason?: string;
}
export interface Job {
    schemaVersion: 1;
    id: string;
    title: string;
    format: JobFormat;
    stage: JobStage;
    status: JobStatus;
    brief: TaskBrief;
    workspace: TaskWorkspace;
    model?: JobModel;
    sessionId?: string;
    gates: Record<GateId, JobGate>;
    artifacts: JobArtifact[];
    materials: JobMaterial[];
    workorders: WorkOrder[];
    repairCycles: number;
    nextAction: NextAction;
    createdAt: string;
    updatedAt: string;
}
export declare class JobStoreError extends Error {
    readonly code: 'bad-request' | 'not-found' | 'conflict' | 'fs-error';
    constructor(code: 'bad-request' | 'not-found' | 'conflict' | 'fs-error', message: string);
}
export declare function jobDir(id: string): string;
export declare function jobFile(id: string): string;
export declare function loadJob(id: string): Job | null;
export declare function saveJob(job: Job): Job;
export declare function listJobs(): Job[];
export interface CreateJobInput {
    title: string;
    brief: TaskBrief;
    workspace?: Partial<TaskWorkspace>;
    model?: JobModel;
    sessionId?: string;
}
export declare function createJob(input: CreateJobInput): Job;
export declare function requireJob(id: string): Job;
export declare function setJobStatus(jobId: string, status: JobStatus, reason?: string): Job;
export declare function setJobStage(jobId: string, stage: JobStage): Job;
export declare function addJobMaterial(jobId: string, input: {
    name: string;
    size?: number;
    path?: string;
    status?: JobMaterial['status'];
}): Job;
export declare function addJobArtifact(jobId: string, input: {
    kind: ArtifactKind;
    path: string;
    producedBy?: JobArtifact['producedBy'];
}): Job;
export declare function listJobArtifacts(jobId: string): JobArtifact[];
/** 记录机器门检查结果（G2/G3）；全通过 → passed，任一失败 → rejected。 */
export declare function recordGateChecks(jobId: string, gateId: GateId, checks: JobGateCheck[], blockers?: unknown[]): Job;
export declare function resetRepairCycles(jobId: string): Job;
export declare function approveGate(jobId: string, gateId: GateId, actor?: string, note?: string): Job;
export declare function rejectGate(jobId: string, gateId: GateId, note?: string): Job;
export interface CreateWorkOrderInput {
    role: WorkOrderRole;
    stage: JobStage;
    title: string;
    prompt: string;
    acceptance?: string[];
    dependsOn?: string[];
    handoffId?: string;
    sessionId?: string;
}
export declare function createWorkOrder(jobId: string, input: CreateWorkOrderInput): WorkOrder;
export declare function listWorkOrders(jobId: string): WorkOrder[];
/** 就绪工单：依赖全部 done、且同 Job 没有 running（v1 串行）。 */
export declare function readyWorkOrders(job: Job): WorkOrder[];
export declare function claimWorkOrder(jobId: string, workOrderId: string, sessionId?: string): Job;
export declare function completeWorkOrder(jobId: string, workOrderId: string, result?: WorkOrder['result']): Job;
export declare function failWorkOrder(jobId: string, workOrderId: string, reason: string): Job;
export declare function cancelWorkOrder(jobId: string, workOrderId: string): Job;
export declare function computeNextAction(job: Job): NextAction;
export declare function getNextAction(jobId: string): NextAction;
