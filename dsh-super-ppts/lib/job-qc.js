/**
 * Job 闸门执行器：G2（产物存在）→ G3（结构/排版/模板一致性）。
 *
 * 与 ppts_task done 共用 qc.runPptxQc；结果写回 Job gate（含 blockers/reports），
 * G3 失败由 jobs.scheduleRepair 自动生成修复工单（3 轮后 blocked）。
 */
import { existsSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { ensureContract } from './contracts.js';
import { JobStoreError, jobDir, recordGateChecks, requireJob } from './jobs.js';
import { runPptxQc } from './qc.js';
import { loadRegistry } from './templates.js';
function findTemplateInRegistry(id) {
    return loadRegistry().templates.find(item => item.id === id) ?? null;
}
function latestPptx(job) {
    const artifact = [...job.artifacts].reverse().find(item => item.kind === 'pptx' && item.status === 'ready');
    if (artifact === undefined)
        return null;
    const path = resolve(artifact.path);
    if (!existsSync(path) || !statSync(path).isFile() || extname(path).toLowerCase() !== '.pptx')
        return null;
    const workspace = String(job.workspace?.path ?? '').trim();
    if (workspace !== '') {
        const root = resolve(workspace);
        if (path !== root && !path.startsWith(root + sep))
            return null;
    }
    return { path };
}
function asGateChecks(qc) {
    return qc.checks.map(check => ({ id: check.id, status: check.status, reportPath: check.reportPath, detail: check.detail }));
}
export async function runJobQc(jobId, deps = {}) {
    let job;
    try {
        job = requireJob(jobId);
    }
    catch (error) {
        throw error instanceof JobStoreError ? error : new JobStoreError('not-found', String(error));
    }
    if (job.gates.G0.status !== 'approved' || job.gates.G1.status !== 'approved') {
        return { job, code: 'gate-order', message: '请先通过 G0（Brief）与 G1（规划）闸门' };
    }
    const deck = latestPptx(job);
    if (deck === null) {
        job = recordGateChecks(job.id, 'G2', [{ id: 'artifact', status: 'FAIL' }], [{ check: 'artifact', detail: '没有可读的 .pptx 产物（检查 artifact 路径与 workspace）' }]);
        return { job, code: 'no-artifact', message: '没有可读的 .pptx 产物' };
    }
    job = recordGateChecks(job.id, 'G2', [{ id: 'artifact', status: 'PASS' }]);
    job = requireJob(job.id);
    const templateId = job.brief.templateId;
    if (typeof templateId !== 'string' || templateId === '' || job.brief.templateSource === 'builtin') {
        job = recordGateChecks(job.id, 'G3', [{ id: 'conformance', status: 'PASS' }]);
        return { job: requireJob(job.id) };
    }
    const record = (deps.findTemplate ?? findTemplateInRegistry)(templateId);
    if (record === null) {
        job = recordGateChecks(job.id, 'G3', [{ id: 'contract', status: 'FAIL' }], [{ check: 'contract', detail: '模板不存在或已删除：' + templateId }]);
        return { job, code: 'contract-missing', message: '模板不存在或已删除：' + templateId };
    }
    const contract = await (deps.ensureContract ?? ensureContract)(record);
    if (contract.status !== 'parsed') {
        job = recordGateChecks(job.id, 'G3', [{ id: 'contract', status: 'FAIL' }], [{ check: 'contract', status: contract.status, detail: contract.error ?? '模板契约不可用' }]);
        return { job, code: 'contract-missing', message: '模板契约不可用：' + contract.status };
    }
    const runner = deps.runQc ?? runPptxQc;
    const qc = await runner({
        deckPath: deck.path,
        contract,
        qcDir: join(jobDir(job.id), 'qc'),
        deps: { python: deps.python, runCheck: deps.runCheck },
    });
    if (qc.error !== undefined) {
        job = recordGateChecks(job.id, 'G3', [{ id: 'qc', status: 'ERROR' }], [{ check: 'qc', detail: qc.error }]);
        return { job, qc, code: 'qc-error', message: qc.error };
    }
    job = recordGateChecks(job.id, 'G3', asGateChecks(qc), qc.blockers);
    return { job: requireJob(job.id), qc };
}
