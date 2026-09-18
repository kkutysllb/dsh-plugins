/** 漫剧工坊 RPC 面（规格 §5）：`/dsh-video-generator/drama` POST JSON，
 * {ok,value}/{ok,error:{code,message}} 信封。handler 不碰 node:http，便于无宿主测试。
 *
 * 指令组装（drama.task.create / drama.adaptation.create）在本层完成：页面只提交
 * kind/params/用户要求，「有限上下文」裁剪是 Host 纯函数（见 drama/instruction.ts，
 * 验收 10 对指令文本单测断言）。
 */
import { type ProjectDetail } from '../store/project.ts';
import type { DramaHost, ResolvedWorkspace } from '../drama/gateway.ts';
import { type TaskKind } from '../drama/instruction.ts';
import type { Envelope } from './routes.ts';
type Args = Record<string, unknown>;
export declare function handleDramaApi(host: DramaHost, name: string, args: Args): Envelope;
/** 按 kind 组装任务指令（§6.3）：Host 侧完成有限上下文裁剪；导出供单测直调。 */
export declare function assembleTaskInstruction(ws: ResolvedWorkspace, projectId: string, kind: TaskKind, params: Record<string, unknown>, userRequest: string | undefined, detail: ProjectDetail): {
    instruction: string;
    inputRefs: string[];
};
export {};
