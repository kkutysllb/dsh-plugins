/** Agent 创作工具（规格 §6.1）：drama_read / drama_propose。
 *
 * 纪律（写进工具描述与能力通告）：先 drama_read 取最新 revision → 产出建议 →
 * drama_propose 一次性提交完整替换内容 → 在收到「用户已应用」前不得声称已保存。
 * drama_propose 绝不直接写权威文件；baseRevision 失配 → stale-revision，
 * Agent 须重读后再提案。
 */
import type { DramaHost } from '../drama/gateway.ts';
import type { DshToolDefinition } from './handoff.ts';
export interface DramaTools {
    read: {
        execute: (args: Record<string, unknown>) => Promise<unknown>;
    };
    propose: {
        execute: (args: Record<string, unknown>) => Promise<unknown>;
    };
}
export interface DramaToolResult {
    ok: true;
    value: unknown;
}
/** 单资产读取上限（§6.1）：超过截断并报告。 */
export declare const DRAMA_READ_LIMIT_BYTES: number;
/** 读取有界化：内容超限截断，返回 truncated 标记与原始大小。 */
export declare function boundedContent(content: string): {
    content: string;
    truncated: boolean;
    originalBytes: number;
};
export declare function buildDramaTools(host: DramaHost): DramaTools;
export declare function dramaToolDefs(tools: DramaTools): DshToolDefinition[];
