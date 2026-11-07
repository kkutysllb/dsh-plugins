/**
 * Python 解释器探测与执行（host 侧，零 npm 依赖）。
 *
 * 从 tools.ts 抽出：契约解析、模板一致性门、渲染都走同一套解释器解析，
 * 避免「Agent 能跑、宿主不能跑」。所有进程调用一律 execFile 参数数组、
 * 固定 cwd 到插件包根、显式 timeout 与 maxBuffer。
 */
import { execFile } from 'node:child_process';
import { packageRoot } from './paths.js';
export const PYTHON_CANDIDATES = [
    { cmd: 'python3', args: [] },
    { cmd: '/usr/bin/python3', args: [] },
    { cmd: 'python', args: [] },
    { cmd: 'py', args: ['-3'] },
];
export function runOne(cmd, args, timeoutMs) {
    return new Promise((resolvePromise) => {
        // maxBuffer 显式放宽（默认 1MB）：--check / 渲染 / 契约解析输出超长时不至于误判失败
        execFile(cmd, [...args], { timeout: timeoutMs, cwd: packageRoot, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            resolvePromise({ ok: !error, stdout: String(stdout ?? ''), stderr: String(stderr ?? error?.message ?? '') });
        });
    });
}
/** 依次探测候选 Python，返回第一个可执行者。 */
export async function findPython() {
    for (const candidate of PYTHON_CANDIDATES) {
        const probe = await runOne(candidate.cmd, [...candidate.args, '--version'], 10_000);
        if (probe.ok && /python/i.test(probe.stdout + probe.stderr))
            return candidate;
    }
    return null;
}
/**
 * 找第一个「能 import 指定模块」的解释器（如质检脚本需要 pptx）。
 * 与 findPython 分开：生成/渲染有自己的 venv 回落逻辑，质检门只认能跑脚本的解释器。
 */
export async function findPythonFor(modules) {
    const probeCode = modules.map(module => 'import ' + module).join('; ');
    for (const candidate of PYTHON_CANDIDATES) {
        const version = await runOne(candidate.cmd, [...candidate.args, '--version'], 10_000);
        if (!version.ok)
            continue;
        const probe = await runOne(candidate.cmd, [...candidate.args, '-c', probeCode], 20_000);
        if (probe.ok)
            return candidate;
    }
    return null;
}
/** 用已解析的解释器执行脚本（args 不含解释器自身）。 */
export function runPython(python, args, timeoutMs) {
    return runOne(python.cmd, [...python.args, ...args], timeoutMs);
}
