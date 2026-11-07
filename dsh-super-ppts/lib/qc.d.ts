import { type PythonCommand } from './python.js';
import type { TemplateContract } from './contracts.js';
export declare const VALIDATE_SCRIPT: string;
export declare const TYPOGRAPHY_SCRIPT: string;
export declare const CONFORMANCE_SCRIPT: string;
export type QcCheckStatus = 'PASS' | 'FAIL' | 'UNVERIFIED' | 'WARN' | 'ERROR';
export interface QcCheck {
    id: string;
    status: QcCheckStatus;
    reportPath: string;
    detail?: string;
}
export interface QcResult {
    ok: boolean;
    checks: QcCheck[];
    blockers: unknown[];
    reports: string[];
    error?: string;
}
export interface QcRunDeps {
    python?: PythonCommand;
    runCheck?: (python: PythonCommand, script: string, args: string[], timeoutMs: number) => Promise<{
        ok: boolean;
        stdout: string;
        stderr: string;
    }>;
}
/**
 * 对一个 PPTX 跑三道机器门。qcDir 由调用方给出（task 或 job 的证据目录）。
 * 任何脚本失败/报告不可读 → ERROR，不静默 PASS。
 */
export declare function runPptxQc(input: {
    deckPath: string;
    contract: TemplateContract;
    qcDir: string;
    deps?: QcRunDeps;
}): Promise<QcResult>;
