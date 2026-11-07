import { packageRoot } from './paths.js';
import { type PptsPrefs, type TemplateRecord } from './templates.js';
import { type BuiltinTemplate } from './builtin-templates.js';
import { type QcRunDeps } from './qc.js';
import { type TemplateContract } from './contracts.js';
import { type TaskRecord, type OutlinePage, type TaskHistoryInsights, type TaskStatus } from './tasks.js';
export { packageRoot };
export { findPython } from './python.js';
export interface PptsCheckResult {
    ok: boolean;
    message: string;
    report?: string;
}
/** 环境自检：委托 compiler/build_pptx.py --check 输出统一报告。 */
export declare function runCheck(): Promise<PptsCheckResult>;
export interface PptsRenderParams {
    /** 待验收的 PPTX 绝对路径或相对当前工作目录的路径。 */
    pptxPath: string;
    /** PNG 输出目录，缺省为 PPTX 同目录下 ./render_review/。 */
    outDir?: string;
}
export interface PptsRenderResult {
    ok: boolean;
    message: string;
    output?: string;
}
/** 渲染验收：PPTX → PDF → PNG，供视觉复核与返工。 */
export declare function runRender(params: PptsRenderParams): Promise<PptsRenderResult>;
/** dsh tools registry 接受的最小定义形态（见 @deepseek-ai/dsh-tools register()）。 */
export interface DshToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    output: {
        schema: Record<string, unknown>;
        render: (args: unknown, value: unknown) => Array<{
            type: string;
            text: string;
        }>;
    };
    timeoutMs?: number;
    execute: (args: any) => Promise<unknown>;
}
export declare const pptsCheckTool: DshToolDefinition;
export declare const pptsRenderTool: DshToolDefinition;
export interface PptsTemplatesParams {
    /** list=全部模板+偏好（默认）；detail=单条模板全量；history=生成画像（任务库聚合）。 */
    action?: 'list' | 'detail' | 'history';
    /** action=detail 时必填：模板 id 或名称（名称精确匹配，不区分大小写）。 */
    id?: string;
}
interface TemplateToolEntry {
    id: string;
    name: string;
    description: string;
    /** .pptx 绝对路径（模板化生成直接用作基底）。 */
    path: string;
    sizeMb: number;
    uploadedAt: string;
    isDefault: boolean;
    /** 逐条硬性约束（模板描述 + 全局风格备注分句）；空数组 = 未声明任何约束。 */
    constraints: string[];
    /** 模板排版契约状态；none = 尚未解析。 */
    contract: {
        status: TemplateContract['status'] | 'none';
        path: string | null;
        hash: string | null;
    };
}
/** 按 id 或名称查用户模板（大小写不敏感；供 detail / ppts_contract 共用）。 */
export declare function findUserTemplate(key: string): TemplateRecord | null;
/** 模板库查询：list 返回全部模板 + 生成偏好 + 内置模板；detail 按 id/名称取单条；history 返回生成画像。 */
export declare function runTemplates(params?: PptsTemplatesParams): {
    ok: true;
    message: string;
    count?: number;
    defaultTemplate?: TemplateToolEntry | null;
    prefs?: PptsPrefs;
    templates?: TemplateToolEntry[];
    builtinTemplates?: readonly BuiltinTemplate[];
    template?: TemplateToolEntry;
    history?: TaskHistoryInsights;
    hint?: string;
} | {
    ok: false;
    message: string;
};
export declare const pptsTemplatesTool: DshToolDefinition;
export interface PptsContractParams {
    /** get=读取（无缓存时物化）；ensure=强制物化；status=只看状态。 */
    action?: 'get' | 'ensure' | 'status';
    /** 模板 id 或名称（精确，不区分大小写）。 */
    id: string;
}
/** 模板契约的 agent 侧读取面：生成前拿结构化层级规则，而不是只看模板名。 */
export declare const pptsContractTool: DshToolDefinition;
export interface PptsTaskParams {
    action: 'stage' | 'outline' | 'artifact' | 'material' | 'needs-input' | 'fail' | 'done' | 'get';
    /** 任务 id（由工作台创建任务时写入 Brief 的「任务 ID」）。 */
    taskId: string;
    /** action=stage：阶段键（analyzing / planning / building / reviewing）。 */
    stageKey?: string;
    stageIndex?: number;
    stageTotal?: number;
    /** action=stage：阶段说明；action=material：读取失败原因（error 文案）。 */
    detail?: string;
    /** action=outline：页面结构（标题必填，其余可选）。 */
    pages?: OutlinePage[];
    /** action=artifact：产物类型与路径。 */
    artifactType?: 'pptx' | 'pdf' | 'html';
    artifactPath?: string;
    /** action=material：素材 id（Brief 内嵌素材清单中的 id）。 */
    materialId?: string;
    /** action=material：读取结果——ready=已读通，error=读失败（原因走 detail）。 */
    materialStatus?: 'ready' | 'error';
    /** action=needs-input：需要用户回答的具体问题。 */
    question?: string;
    /** action=fail：失败阶段与原因。 */
    reason?: string;
}
export interface PptsTaskResult {
    ok: boolean;
    message: string;
    taskId?: string;
    status?: TaskStatus;
    outlineVersion?: number;
    confirmedOutlineVersion?: number;
    pageCount?: number;
    /** action=material：被更新的素材 id 与其新状态（回执，便于 Agent 核对）。 */
    materialId?: string;
    materialStatus?: 'ready' | 'error';
    /** done 门失败时的稳定错误码。 */
    code?: string;
    /** done 门失败时的结构化阻断项（page/shape/role/check/expected/actual）。 */
    blockers?: unknown[];
    /** 本次门生成的报告路径。 */
    reports?: string[];
}
/** 任务状态桥：Agent 上报阶段/大纲/产物/补充/失败，或读取当前确认状态。 */
export declare function runTask(params: PptsTaskParams): PptsTaskResult;
export interface TemplateGateDeps extends QcRunDeps {
    findTemplate?: (id: string) => TemplateRecord | null;
    ensureContract?: (record: TemplateRecord) => Promise<TemplateContract>;
    /** 证据目录；缺省 <taskDir>/qc。 */
    qcDir?: string;
}
export type TemplateGateResult = {
    ok: true;
    skipped: boolean;
    reports: string[];
} | {
    ok: false;
    code: 'contract-missing' | 'no-artifact' | 'invalid-artifact' | 'qc-error' | 'qc-blocked';
    message: string;
    blockers: unknown[];
    reports: string[];
};
/**
 * 对模板任务跑结构 → 排版 → 模板一致性三道机器门。
 * 未使用用户模板 / builtin 模板 → skipped；其余状态一律显式失败，不静默放行。
 */
export declare function runTemplateGate(task: TaskRecord, deps?: TemplateGateDeps): Promise<TemplateGateResult>;
/** action=done 的工具层入口：先过门，再 completed。 */
export declare function runTaskDone(params: PptsTaskParams, deps?: TemplateGateDeps): Promise<PptsTaskResult>;
export interface PptsJobParams {
    action: 'get' | 'claim' | 'complete' | 'fail' | 'artifact';
    jobId: string;
    workOrderId?: string;
    summary?: string;
    reason?: string;
    kind?: 'pptx' | 'pdf' | 'html' | 'png' | 'report' | 'script';
    path?: string;
}
export declare const pptsJobTool: DshToolDefinition;
export declare const pptsTaskTool: DshToolDefinition;
