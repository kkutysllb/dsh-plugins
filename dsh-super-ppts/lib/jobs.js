/**
 * Job 流水线存储层（host 侧，零 npm 依赖）。
 *
 * Job = 一次演示制作：Brief + 6 段阶段 + 6 个闸门 + 工件 revision + 工单队列。
 * 与旧 tasks 存储分离：旧 status 是 Agent 自述，Job 的 gate 由宿主验收。
 *
 * 纪律：
 * - 全部写盘 tmp + rename；单 Job 损坏不阻断列表；
 * - id 白名单后才拼路径；事件 append-only；
 * - 机器门通过/失败由 checks 计算；用户门只能 approve/reject；
 * - 同 Job 串行工单；重复派单按 stage+title 去重；
 * - G3 失败自动生成修复工单，3 轮后 blocked（严格阻断，无 override）。
 */
import { createHash, randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { STORE_ROOT } from './templates.js';
export const JOBS_ROOT = join(STORE_ROOT, 'jobs');
const JOB_ID_RE = /^job-[0-9a-f]{6,16}$/;
const MAX_WORKORDERS = 200;
export class JobStoreError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
const GATE_SPECS = {
    G0: { kind: 'user', stage: 'brief', order: 0 },
    G1: { kind: 'user', stage: 'plan', order: 1 },
    G2: { kind: 'machine', stage: 'build', order: 2 },
    G3: { kind: 'machine', stage: 'conformance', order: 3 },
    G4: { kind: 'user', stage: 'visual', order: 4 },
    G5: { kind: 'user', stage: 'delivery', order: 5 },
};
const GATE_ORDER = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5'];
const STAGE_AFTER_GATE = {
    G0: 'plan', G1: 'build', G2: 'conformance', G3: 'visual', G4: 'delivery', G5: 'delivery',
};
const MACHINE_FAIL = ['FAIL', 'UNVERIFIED', 'ERROR'];
const WORKORDER_ROLES = ['planner', 'builder', 'user'];
const ARTIFACT_KINDS = ['pptx', 'pdf', 'html', 'png', 'report', 'script'];
function nowIso() {
    return new Date().toISOString();
}
function assertJobId(id) {
    const value = String(id ?? '').trim();
    if (!JOB_ID_RE.test(value))
        throw new JobStoreError('bad-request', '非法 Job id：' + value);
    return value;
}
export function jobDir(id) {
    return join(JOBS_ROOT, assertJobId(id));
}
export function jobFile(id) {
    return join(jobDir(id), 'job.json');
}
function writeJsonAtomic(file, value) {
    mkdirSync(dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
    renameSync(tmp, file);
}
function appendEvent(job, type, data = {}) {
    try {
        mkdirSync(jobDir(job.id), { recursive: true });
        appendFileSync(join(jobDir(job.id), 'events.jsonl'), JSON.stringify({ at: nowIso(), type, jobId: job.id, ...data }) + '\n', 'utf8');
    }
    catch {
        // 事件失败不阻断主流程（与 KToon project-events 同纪律）
    }
}
function emptyGates() {
    const gates = {};
    for (const id of GATE_ORDER) {
        const spec = GATE_SPECS[id];
        gates[id] = { id, kind: spec.kind, stage: spec.stage, status: 'pending', checks: [], blockers: [] };
    }
    return gates;
}
function isJobShape(value) {
    if (value === null || typeof value !== 'object')
        return false;
    const job = value;
    return job.schemaVersion === 1
        && typeof job.id === 'string' && JOB_ID_RE.test(job.id)
        && typeof job.title === 'string'
        && typeof job.stage === 'string'
        && typeof job.status === 'string'
        && job.gates !== undefined && typeof job.gates === 'object'
        && Array.isArray(job.artifacts) && Array.isArray(job.workorders);
}
export function loadJob(id) {
    let file;
    try {
        file = jobFile(id);
    }
    catch {
        return null;
    }
    try {
        const parsed = JSON.parse(readFileSync(file, 'utf8'));
        if (!isJobShape(parsed))
            return null;
        const job = parsed;
        if (!Array.isArray(job.materials))
            job.materials = [];
        job.nextAction = computeNextAction(job);
        return job;
    }
    catch {
        return null;
    }
}
export function saveJob(job) {
    job.updatedAt = nowIso();
    job.nextAction = computeNextAction(job);
    writeJsonAtomic(jobFile(job.id), job);
    return job;
}
export function listJobs() {
    let names;
    try {
        names = readdirSync(JOBS_ROOT);
    }
    catch {
        return [];
    }
    const out = [];
    for (const name of names) {
        if (!JOB_ID_RE.test(name))
            continue;
        const job = loadJob(name);
        if (job !== null)
            out.push(job);
    }
    return out.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
export function createJob(input) {
    const title = String(input.title ?? '').trim();
    if (title === '')
        throw new JobStoreError('bad-request', 'Job 标题不能为空');
    const topic = String(input.brief?.topic ?? '').trim();
    if (topic === '')
        throw new JobStoreError('bad-request', 'Job 主题不能为空');
    const format = input.brief?.format;
    if (format !== 'pptx' && format !== 'html')
        throw new JobStoreError('bad-request', '未知交付形态：' + String(format));
    const now = nowIso();
    const job = {
        schemaVersion: 1,
        id: 'job-' + randomBytes(4).toString('hex'),
        title,
        format,
        stage: 'brief',
        status: 'active',
        brief: { ...input.brief, topic },
        workspace: {
            id: String(input.workspace?.id ?? ''),
            name: String(input.workspace?.name ?? ''),
            path: String(input.workspace?.path ?? ''),
        },
        sessionId: input.sessionId,
        ...(input.model !== undefined ? { model: input.model } : {}),
        gates: emptyGates(),
        artifacts: [],
        materials: [],
        workorders: [],
        repairCycles: 0,
        nextAction: { kind: 'gate', gateId: 'G0' },
        createdAt: now,
        updatedAt: now,
    };
    mkdirSync(jobDir(job.id), { recursive: true });
    appendEvent(job, 'job.created', { title, format });
    return saveJob(job);
}
export function requireJob(id) {
    const job = loadJob(id);
    if (job === null)
        throw new JobStoreError('not-found', 'Job 不存在：' + String(id));
    return job;
}
export function setJobStatus(jobId, status, reason) {
    const job = requireJob(jobId);
    job.status = status;
    if (status === 'blocked')
        job.stage = 'blocked';
    appendEvent(job, 'job.status', { status, reason });
    return saveJob(job);
}
export function setJobStage(jobId, stage) {
    const job = requireJob(jobId);
    job.stage = stage;
    appendEvent(job, 'job.stage', { stage });
    return saveJob(job);
}
/* ── 素材 ── */
export function addJobMaterial(jobId, input) {
    const job = requireJob(jobId);
    const name = String(input.name ?? '').trim();
    if (name === '')
        throw new JobStoreError('bad-request', '素材名称不能为空');
    const material = {
        id: 'mat-' + randomBytes(4).toString('hex'),
        name,
        size: Number(input.size ?? 0),
        status: input.status ?? 'ready',
        path: input.path,
        createdAt: nowIso(),
    };
    job.materials.push(material);
    appendEvent(job, 'material.added', { materialId: material.id, name });
    return saveJob(job);
}
/* ── 工件 ── */
export function addJobArtifact(jobId, input) {
    const job = requireJob(jobId);
    const kind = input.kind;
    if (!ARTIFACT_KINDS.includes(kind))
        throw new JobStoreError('bad-request', '未知工件类型：' + String(kind));
    const path = String(input.path ?? '').trim();
    if (path === '')
        throw new JobStoreError('bad-request', '工件路径不能为空');
    const revision = job.artifacts.filter(item => item.kind === kind).length + 1;
    for (const item of job.artifacts)
        if (item.kind === kind && item.status === 'ready')
            item.status = 'stale';
    const artifact = {
        id: 'art-' + randomBytes(4).toString('hex'),
        kind,
        path,
        revision,
        status: 'ready',
        producedBy: input.producedBy ?? 'builder',
        createdAt: nowIso(),
    };
    try {
        if (existsSync(path) && statSync(path).isFile()) {
            artifact.size = statSync(path).size;
            artifact.sha256 = 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');
        }
    }
    catch { /* 读取失败保留空 hash；门会拒绝 */ }
    job.artifacts.push(artifact);
    // 新工件让后续机器/视觉/交付证据失效
    for (const gateId of ['G3', 'G4', 'G5']) {
        job.gates[gateId].status = 'pending';
        job.gates[gateId].checks = [];
        delete job.gates[gateId].approvedAt;
        delete job.gates[gateId].approvedBy;
    }
    if (job.status === 'delivered') {
        job.status = 'active';
        job.stage = 'build';
    }
    appendEvent(job, 'artifact.registered', { kind, revision, path });
    return saveJob(job);
}
export function listJobArtifacts(jobId) {
    return requireJob(jobId).artifacts.slice();
}
/* ── 闸门 ── */
function nextGate(gateId) {
    const index = GATE_ORDER.indexOf(gateId);
    return index >= 0 && index < GATE_ORDER.length - 1 ? GATE_ORDER[index + 1] : null;
}
/** 记录机器门检查结果（G2/G3）；全通过 → passed，任一失败 → rejected。 */
export function recordGateChecks(jobId, gateId, checks, blockers = []) {
    const job = requireJob(jobId);
    const gate = job.gates[gateId];
    if (gate === undefined)
        throw new JobStoreError('bad-request', '未知闸门：' + gateId);
    if (gate.kind !== 'machine')
        throw new JobStoreError('bad-request', '用户闸门不能由机器记录：' + gateId);
    gate.checks = checks;
    gate.blockers = blockers;
    const failed = checks.some(item => MACHINE_FAIL.includes(item.status));
    gate.status = failed ? 'rejected' : 'passed';
    if (failed) {
        if (gateId === 'G3')
            return scheduleRepair(job, gate);
        job.status = 'waiting-user';
    }
    else {
        if (gateId === 'G2')
            closeStageWorkOrders(job, ['build'], 'artifact passed G2');
        if (gateId === 'G3')
            closeRepairWorkOrders(job, 'corrected artifact passed conformance');
        job.stage = STAGE_AFTER_GATE[gateId];
        job.status = 'active';
        appendEvent(job, 'gate.passed', { gateId });
    }
    return saveJob(job);
}
function closeRepairWorkOrders(job, reason) {
    for (const workorder of job.workorders) {
        if ((workorder.status === 'queued' || workorder.status === 'running') && workorder.title.startsWith('修复模板一致性问题')) {
            workorder.status = 'cancelled';
            workorder.finishedAt = nowIso();
            workorder.result = { summary: reason };
        }
    }
}
function closeStageWorkOrders(job, stages, reason) {
    for (const workorder of job.workorders) {
        if ((workorder.status === 'queued' || workorder.status === 'running') && stages.includes(workorder.stage)) {
            workorder.status = 'done';
            workorder.finishedAt = nowIso();
            workorder.result = { summary: reason };
        }
    }
}
/** 模板提示：内置模板不走 ppts_contract；用户模板才要求读契约。 */
function templateInstruction(job) {
    const templateId = job.brief.templateId;
    const templateName = job.brief.templateName || (typeof templateId === 'string' ? templateId : '');
    if (job.brief.templateSource === 'builtin' || (typeof templateId === 'string' && templateId.startsWith('builtin-'))) {
        return '使用内置模板「' + templateName + '」的视觉风格生成；内置模板没有用户 .pptx 排版契约，不要调用 ppts_contract。';
    }
    if (typeof templateId === 'string' && templateId !== '') {
        return '先调用 ppts_contract 读取用户模板「' + templateName + '」的契约，按 levelRules 的字体/字号生成，并给每个文本 shape 打 sp:<role> 标签。';
    }
    return '未选择模板，按默认视觉规范生成。';
}
/** G0 批准后派规划工单；G1 批准后派生成工单（已有则不重复）。 */
function ensureStageWorkOrder(job, gateId) {
    if (gateId === 'G0') {
        const existing = job.workorders.find(item => item.stage === 'plan' && item.role === 'planner' && item.status !== 'cancelled');
        if (existing !== undefined)
            return existing;
        return createWorkOrderInternal(job, {
            role: 'planner',
            stage: 'plan',
            title: '立项与页面规划',
            prompt: '【流水线工单】请基于 Brief 产出：1) 确认的受众/场景/页数/风格；2) 逐页大纲（title/purpose/bullets/pageType）；3) 视觉方向。' + templateInstruction(job) + ' 不要开始生成 PPTX。\n\nBrief:\n' + JSON.stringify(job.brief, null, 2) + '\\n\\n素材:\\n' + JSON.stringify(job.materials, null, 2),
            acceptance: ['Brief 要素齐全', '逐页大纲完整', '视觉方向可执行'],
        });
    }
    if (gateId === 'G1') {
        const existing = job.workorders.find(item => item.stage === 'build' && item.role === 'builder' && item.status !== 'cancelled');
        if (existing !== undefined)
            return existing;
        return createWorkOrderInternal(job, {
            role: 'builder',
            stage: 'build',
            title: '按大纲生成演示文稿',
            prompt: '【流水线工单】按已确认的页面规划生成演示文稿。' + templateInstruction(job) + ' 产物用 ppts_job action=artifact 登记，然后用 action=complete 回执。机器闸门由宿主判定。',
            acceptance: ['产物已登记', '结构/排版/模板一致性门由宿主执行'],
        });
    }
    return null;
}
function scheduleRepair(job, gate) {
    const running = job.workorders.find(item => item.status === 'running' || item.status === 'queued');
    if (running !== undefined) {
        appendEvent(job, 'repair.reused', { workOrderId: running.id });
        return saveJob(job);
    }
    if (job.repairCycles >= 3) {
        job.status = 'blocked';
        job.stage = 'blocked';
        gate.status = 'blocked';
        appendEvent(job, 'repair.exhausted', { cycles: job.repairCycles });
        return saveJob(job);
    }
    job.repairCycles += 1;
    const blockers = gate.blockers.length > 0 ? gate.blockers : gate.checks.filter(item => MACHINE_FAIL.includes(item.status));
    const workorder = createWorkOrderInternal(job, {
        role: 'builder',
        stage: 'build',
        title: '修复模板一致性问题 #' + String(job.repairCycles),
        prompt: '模板一致性门未通过。请按 blockers 修生成脚本（不要只改导出的 pptx），重新生成并登记新 revision。\n\nblockers:\n' + JSON.stringify(blockers, null, 2),
        acceptance: ['模板一致性门 PASS', '结构/排版门 PASS'],
        dependsOn: [],
    });
    job.stage = 'build';
    job.status = 'active';
    appendEvent(job, 'repair.dispatched', { workOrderId: workorder.id, cycle: job.repairCycles });
    return saveJob(job);
}
export function resetRepairCycles(jobId) {
    const job = requireJob(jobId);
    job.repairCycles = 0;
    appendEvent(job, 'repair.reset');
    return saveJob(job);
}
export function approveGate(jobId, gateId, actor = 'user', note) {
    const job = requireJob(jobId);
    const gate = job.gates[gateId];
    if (gate === undefined)
        throw new JobStoreError('bad-request', '未知闸门：' + gateId);
    if (gate.kind !== 'user')
        throw new JobStoreError('bad-request', '机器闸门只能由宿主通过：' + gateId);
    gate.status = 'approved';
    gate.approvedBy = actor;
    gate.approvedAt = nowIso();
    if (note !== undefined)
        gate.note = note;
    appendEvent(job, 'gate.approved', { gateId, actor });
    if (gateId === 'G5') {
        job.status = 'delivered';
        job.stage = 'delivery';
    }
    else {
        if (gateId === 'G1')
            closeStageWorkOrders(job, ['plan'], 'plan approved');
        job.status = 'active';
        job.stage = STAGE_AFTER_GATE[gateId];
        if (gateId === 'G0' || gateId === 'G1')
            ensureStageWorkOrder(job, gateId);
    }
    return saveJob(job);
}
/** 用户驳回后的修改工单：G4/G5 回到 build，G1 回到 plan；G0 只等用户补 Brief。 */
function scheduleUserRevision(job, gateId, note) {
    const reason = note.trim() === '' ? '用户未填写具体原因，请按 Brief 与验收标准自查后修改。' : note.trim();
    const isPlan = gateId === 'G1';
    const title = isPlan ? '按 G1 驳回意见修订规划' : '按 ' + gateId + ' 驳回意见修改';
    const artifacts = job.artifacts.map(item => '- ' + item.kind + ' v' + item.revision + '：' + item.path).join('\n');
    const prompt = [
        '【流水线工单】用户在 ' + gateId + ' 驳回了当前交付。',
        '',
        '驳回原因 / 修改要求：',
        reason,
        '',
        '当前产物：',
        artifacts === '' ? '（暂无）' : artifacts,
        '',
        'Brief：',
        JSON.stringify(job.brief, null, 2),
        '',
        isPlan
            ? '请按驳回意见修订页面规划/大纲，提交新版本后停下等待用户确认；不要直接生成 PPTX。'
            : '请基于现有产物按意见修改，不要整份重做；修改后重新生成并登记新 revision（ppts_job action=artifact），再 action=complete。' + templateInstruction(job),
    ].join('\n');
    const existing = job.workorders.find(item => item.status !== 'done' && item.status !== 'cancelled' && item.stage === (isPlan ? 'plan' : 'build') && item.title === title);
    if (existing === undefined) {
        createWorkOrderInternal(job, {
            role: isPlan ? 'planner' : 'builder',
            stage: isPlan ? 'plan' : 'build',
            title,
            prompt,
            acceptance: isPlan ? ['规划修订已提交', '等待用户再次确认'] : ['按驳回意见修改完成', '新 revision 已登记', '结构/规范门由宿主复跑'],
        });
    }
    job.status = 'active';
    job.stage = isPlan ? 'plan' : 'build';
    appendEvent(job, 'revision.requested', { gateId, note: reason });
}
export function rejectGate(jobId, gateId, note) {
    const job = requireJob(jobId);
    const gate = job.gates[gateId];
    if (gate === undefined)
        throw new JobStoreError('bad-request', '未知闸门：' + gateId);
    if (gate.kind !== 'user')
        throw new JobStoreError('bad-request', '机器闸门只能由宿主拒绝：' + gateId);
    const reason = String(note ?? '').trim();
    gate.status = 'rejected';
    if (reason !== '')
        gate.note = reason;
    appendEvent(job, 'gate.rejected', { gateId, note: reason || undefined });
    if (gateId === 'G4' || gateId === 'G5' || gateId === 'G1') {
        scheduleUserRevision(job, gateId, reason);
    }
    else {
        job.status = 'waiting-user';
    }
    return saveJob(job);
}
function createWorkOrderInternal(job, input) {
    if (!WORKORDER_ROLES.includes(input.role))
        throw new JobStoreError('bad-request', '未知工单角色：' + String(input.role));
    const title = String(input.title ?? '').trim();
    if (title === '')
        throw new JobStoreError('bad-request', '工单标题不能为空');
    const existing = job.workorders.find(item => item.status !== 'done' && item.status !== 'cancelled' && item.stage === input.stage && item.title === title);
    if (existing !== undefined)
        return existing;
    if (job.workorders.length >= MAX_WORKORDERS)
        throw new JobStoreError('conflict', '工单数已达上限 ' + String(MAX_WORKORDERS));
    const dependsOn = Array.isArray(input.dependsOn) ? input.dependsOn.map(String) : [];
    for (const id of dependsOn) {
        if (!job.workorders.some(item => item.id === id))
            throw new JobStoreError('bad-request', '依赖工单不存在：' + id);
    }
    const workorder = {
        id: 'wo-' + randomBytes(4).toString('hex'),
        jobId: job.id,
        role: input.role,
        stage: input.stage,
        title,
        prompt: String(input.prompt ?? ''),
        acceptance: Array.isArray(input.acceptance) ? input.acceptance.map(String) : [],
        dependsOn,
        status: 'queued',
        attempt: 1,
        handoffId: input.handoffId,
        sessionId: input.sessionId,
        createdAt: nowIso(),
    };
    job.workorders.push(workorder);
    appendEvent(job, 'workorder.created', { workOrderId: workorder.id, role: workorder.role, stage: workorder.stage });
    return workorder;
}
export function createWorkOrder(jobId, input) {
    const job = requireJob(jobId);
    const workorder = createWorkOrderInternal(job, input);
    saveJob(job);
    return workorder;
}
export function listWorkOrders(jobId) {
    return requireJob(jobId).workorders.slice();
}
/** 就绪工单：依赖全部 done、且同 Job 没有 running（v1 串行）。 */
export function readyWorkOrders(job) {
    if (job.workorders.some(item => item.status === 'running'))
        return [];
    const done = new Set(job.workorders.filter(item => item.status === 'done').map(item => item.id));
    return job.workorders.filter(item => item.status === 'queued' && item.dependsOn.every(id => done.has(id)));
}
export function claimWorkOrder(jobId, workOrderId, sessionId) {
    const job = requireJob(jobId);
    const workorder = job.workorders.find(item => item.id === workOrderId);
    if (workorder === undefined)
        throw new JobStoreError('not-found', '工单不存在：' + workOrderId);
    if (workorder.status !== 'queued')
        throw new JobStoreError('conflict', '工单状态为 ' + workorder.status + '，不能开工');
    if (job.workorders.some(item => item.status === 'running'))
        throw new JobStoreError('conflict', '同 Job 已有运行中工单（v1 串行）');
    const done = new Set(job.workorders.filter(item => item.status === 'done').map(item => item.id));
    const missing = workorder.dependsOn.filter(id => !done.has(id));
    if (missing.length > 0)
        throw new JobStoreError('conflict', '依赖工单未完成：' + missing.join(', '));
    workorder.status = 'running';
    workorder.startedAt = nowIso();
    if (sessionId !== undefined)
        workorder.sessionId = sessionId;
    appendEvent(job, 'workorder.claimed', { workOrderId, sessionId });
    return saveJob(job);
}
export function completeWorkOrder(jobId, workOrderId, result) {
    const job = requireJob(jobId);
    const workorder = job.workorders.find(item => item.id === workOrderId);
    if (workorder === undefined)
        throw new JobStoreError('not-found', '工单不存在：' + workOrderId);
    if (workorder.status !== 'running')
        throw new JobStoreError('conflict', '只有 running 工单能完成，当前 ' + workorder.status);
    workorder.status = 'done';
    workorder.finishedAt = nowIso();
    workorder.result = result;
    appendEvent(job, 'workorder.done', { workOrderId });
    return saveJob(job);
}
export function failWorkOrder(jobId, workOrderId, reason) {
    const job = requireJob(jobId);
    const workorder = job.workorders.find(item => item.id === workOrderId);
    if (workorder === undefined)
        throw new JobStoreError('not-found', '工单不存在：' + workOrderId);
    workorder.status = 'failed';
    workorder.finishedAt = nowIso();
    workorder.result = { summary: String(reason ?? '') };
    appendEvent(job, 'workorder.failed', { workOrderId, reason: String(reason ?? '') });
    return saveJob(job);
}
export function cancelWorkOrder(jobId, workOrderId) {
    const job = requireJob(jobId);
    const workorder = job.workorders.find(item => item.id === workOrderId);
    if (workorder === undefined)
        throw new JobStoreError('not-found', '工单不存在：' + workOrderId);
    workorder.status = 'cancelled';
    workorder.finishedAt = nowIso();
    appendEvent(job, 'workorder.cancelled', { workOrderId });
    return saveJob(job);
}
/* ── 下一步 ── */
export function computeNextAction(job) {
    if (job.status === 'delivered')
        return { kind: 'none' };
    if (job.status === 'cancelled')
        return { kind: 'none' };
    if (job.status === 'blocked')
        return { kind: 'blocked', reason: 'Job blocked' };
    const running = job.workorders.find(item => item.status === 'running');
    if (running !== undefined)
        return { kind: 'workorder', workOrderId: running.id };
    const ready = readyWorkOrders(job)[0];
    if (ready !== undefined)
        return { kind: 'workorder', workOrderId: ready.id };
    for (const gateId of GATE_ORDER) {
        const gate = job.gates[gateId];
        if (gate.status === 'approved' || gate.status === 'passed')
            continue;
        return { kind: 'gate', gateId };
    }
    return { kind: 'none' };
}
export function getNextAction(jobId) {
    return computeNextAction(requireJob(jobId));
}
