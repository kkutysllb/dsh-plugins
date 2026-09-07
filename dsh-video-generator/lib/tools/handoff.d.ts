/** LLM 三段交接工具（规格 §5 表）：会话模型产出结构化 JSON → 校验 + 落盘 + run 推进。 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
export interface HandoffContext {
    vault: VaultStore;
    runs: RunStore;
}
export type ToolResult = {
    ok: true;
    value: unknown;
} | {
    ok: false;
    error: {
        code: string;
        message: string;
    };
};
export interface HandoffTools {
    story: {
        execute: (args: {
            story: unknown;
        }) => Promise<ToolResult>;
    };
    script: {
        execute: (args: {
            runId: string;
            script: unknown;
        }) => Promise<ToolResult>;
    };
    storyboard: {
        execute: (args: {
            runId: string;
            shots: unknown;
            style?: string;
        }) => Promise<ToolResult>;
    };
}
export declare function buildHandoffTools(ctx: HandoffContext): HandoffTools;
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
    execute: (args: unknown) => Promise<unknown>;
}
/** 三工具定义（照 super-ppts 契约：plain object + JSON Schema + JSON render）。 */
export declare function handoffToolDefs(handoff: HandoffTools): DshToolDefinition[];
