export interface PythonCommand {
    cmd: string;
    args: string[];
}
export interface PythonRunResult {
    ok: boolean;
    stdout: string;
    stderr: string;
}
export declare const PYTHON_CANDIDATES: readonly PythonCommand[];
export declare function runOne(cmd: string, args: readonly string[], timeoutMs: number): Promise<PythonRunResult>;
/** 依次探测候选 Python，返回第一个可执行者。 */
export declare function findPython(): Promise<PythonCommand | null>;
/**
 * 找第一个「能 import 指定模块」的解释器（如质检脚本需要 pptx）。
 * 与 findPython 分开：生成/渲染有自己的 venv 回落逻辑，质检门只认能跑脚本的解释器。
 */
export declare function findPythonFor(modules: readonly string[]): Promise<PythonCommand | null>;
/** 用已解析的解释器执行脚本（args 不含解释器自身）。 */
export declare function runPython(python: PythonCommand, args: readonly string[], timeoutMs: number): Promise<PythonRunResult>;
