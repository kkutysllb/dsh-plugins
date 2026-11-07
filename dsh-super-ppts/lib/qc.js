/**
 * PPTX 机器门执行器（host 侧）：结构 → 排版 → 模板一致性。
 *
 * 从 tools.ts 抽出，供 ppts_task done 与 Job 流水线共用，避免两份脚本参数漂移。
 * 只做「跑固定脚本 + 落报告 + 汇总 checks/blockers」，不读 Agent 自述。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packageRoot } from './paths.js';
import { findPythonFor, runPython } from './python.js';
export const VALIDATE_SCRIPT = join(packageRoot, 'skills', 'ppts-pptx', 'scripts', 'validate_pptx.py');
export const TYPOGRAPHY_SCRIPT = join(packageRoot, 'skills', 'ppts-pptx', 'scripts', 'check_typography.py');
export const CONFORMANCE_SCRIPT = join(packageRoot, 'skills', 'ppts-pptx', 'scripts', 'check_template_conformance.py');
function parseJsonReport(text) {
    try {
        const parsed = JSON.parse(text);
        return parsed !== null && typeof parsed === 'object' ? parsed : null;
    }
    catch {
        return null;
    }
}
function failedItems(report, statuses) {
    const items = report !== null && Array.isArray(report.items) ? report.items : [];
    return items.filter(item => item !== null && typeof item === 'object' && statuses.includes(String(item.status)));
}
/**
 * 对一个 PPTX 跑三道机器门。qcDir 由调用方给出（task 或 job 的证据目录）。
 * 任何脚本失败/报告不可读 → ERROR，不静默 PASS。
 */
export async function runPptxQc(input) {
    const deps = input.deps ?? {};
    const python = deps.python ?? await findPythonFor(['pptx']);
    if (python === null) {
        return { ok: false, checks: [], blockers: [], reports: [], error: '未找到可导入 python-pptx 的 Python 3（已尝试 python3 / /usr/bin/python3 / python / py -3）' };
    }
    mkdirSync(input.qcDir, { recursive: true });
    const contractPath = join(input.qcDir, 'contract.json');
    writeFileSync(contractPath, JSON.stringify(input.contract, null, 2) + '\n', 'utf8');
    const typographySpecPath = join(input.qcDir, 'typography-spec.json');
    writeFileSync(typographySpecPath, JSON.stringify({
        levelRules: input.contract.levels.map(level => ({
            level: level.level, font: level.font, sizePt: level.sizePt,
            lineSpacing: level.lineSpacing, color: level.color,
        })),
    }, null, 2) + '\n', 'utf8');
    const runCheck = deps.runCheck ?? ((cmd, script, args, timeoutMs) => runPython(cmd, [script, ...args], timeoutMs));
    const specs = [
        { id: 'structure', script: VALIDATE_SCRIPT, args: [input.deckPath, '--json'], failStatuses: ['FAIL'] },
        { id: 'typography', script: TYPOGRAPHY_SCRIPT, args: [input.deckPath, '--spec', typographySpecPath, '--json'], failStatuses: ['FAIL'] },
        { id: 'conformance', script: CONFORMANCE_SCRIPT, args: [input.deckPath, '--contract', contractPath, '--json'], failStatuses: ['FAIL', 'UNVERIFIED'] },
    ];
    const reports = [contractPath, typographySpecPath];
    const checks = [];
    const blockers = [];
    for (const spec of specs) {
        const result = await runCheck(python, spec.script, spec.args, 180_000);
        const reportPath = join(input.qcDir, spec.id + '.json');
        writeFileSync(reportPath, result.stdout, 'utf8');
        reports.push(reportPath);
        const parsed = parseJsonReport(result.stdout);
        if (!result.ok || parsed === null || parsed.ok === false) {
            const items = failedItems(parsed, spec.failStatuses);
            if (items.length > 0)
                blockers.push(...items);
            else
                blockers.push({ check: spec.id, detail: (result.stderr || result.stdout || '检查失败').slice(0, 2000) });
            checks.push({ id: spec.id, status: parsed === null ? 'ERROR' : 'FAIL', reportPath });
        }
        else {
            checks.push({ id: spec.id, status: 'PASS', reportPath });
        }
    }
    return { ok: blockers.length === 0, checks, blockers, reports };
}
