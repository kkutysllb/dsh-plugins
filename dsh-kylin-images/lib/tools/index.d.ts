import type { PluginRuntime } from '../host/registry.ts';
export interface ToolOutput {
    schema: Record<string, unknown>;
    render: (args: unknown, value: string) => Array<{
        type: string;
        text: string;
    }>;
    presentationMeta: () => {
        title: string;
    };
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    /** DSH 工具契约强制要求：缺 output 会让整条插件行激活失败（真机 boot 实测）。 */
    output: ToolOutput;
    execute: (args: Record<string, unknown>) => Promise<string>;
}
export declare function createTools(runtime: PluginRuntime): ToolDefinition[];
