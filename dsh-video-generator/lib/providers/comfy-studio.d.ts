/** 本地画布工作室适配器（protocol = comfy-studio）。
 *
 * 职责：把本插件的「能力 + 档位」请求转给本机 dsh-short-video-studio 的能力注册表，
 * 由它按自己的配置面解析到具体实现（FLUX 文生图 / MiniMax H3 音视频…）。本适配器
 * **不认识任何工作流或模型名**——这正是接入的意义：换实现是那边配置面的事。
 *
 * 为什么是进程内直调（而不是 HTTP）：
 * dsh-short-video-studio 只注册 webServer 前缀路由与 Agent 工具，不 provide cordis service；
 * 它的 HTTP 面又需要知道宿主端口，插件侧没有可靠来源。故只能 import 其 _internals——
 * 那是对方自述的「内部通道」。因此这里做**形状守卫**：缺 runRender 立即报明确错误，
 * 绝不静默降级成别的通道（静默降级会让用户以为在用本地，实际在花钱）。
 *
 * 两条提交路径的形状差异（跟随既有 Provider 纪律）：
 * - image 段：本插件对同步图像实现的约定是「submit 返回的 jobId 就是 URL」
 *   （见 pipeline/machine.ts 的 submitImageWithSize）⇒ 本适配器在 submit 内跑完整渲染，
 *   返回 file://<abs>；
 * - video 段：异步作业（submit → status 轮询 → fetch 取输出），与 openai-video 同形。
 * 两者最终都交给 shot-clip.saveUrl，由它识别 file:// 走本地拷贝。
 */
import type { Provider } from '../provider.ts';
import { type SlotBinding } from '../store/slots.ts';
/** 工作室内部面：只声明我们真用的成员；studio 改形状时守卫会拦下（见 loadStudio）。 */
interface StudioInternals {
    runRender: (ctx: unknown, opts: Record<string, unknown>) => Promise<StudioRenderResult>;
    importManualImage?: (root: string, sessionId: string, item: {
        dataUrl: string;
        filename?: string;
        title?: string;
    }, group?: string) => Promise<{
        id: string;
    }>;
    getCfg?: () => {
        baseUrl?: string;
    };
}
interface StudioRenderResult {
    ok?: boolean;
    node?: {
        id?: string;
        media?: string;
    };
    absPath?: string;
    mediaType?: string;
    bytes?: number;
    tier?: string;
    implementation?: string;
    resolution?: string;
    warnings?: string[];
}
/** 工作室桥：由工具层从 vgen_generate 的 execute(args, exec) 透传下来（缺省只有测试会省略）。 */
export interface StudioBridge {
    /** 宿主 ctx：工作室的 resolveSessionRoot 读 workspaceRegistry（我们只用得到这一个面）。 */
    hostCtx?: unknown;
    /** 宿主工具 exec：带 agent（会话 id / cwd）与 signal；原样透传给工作室。 */
    exec?: unknown;
    /** 测试注入：替换模块加载（默认 import('dsh-short-video-studio')）。 */
    loadModule?: () => Promise<{
        _internals?: Partial<StudioInternals>;
    }>;
}
export declare class StudioUnavailableError extends Error {
    constructor(message: string);
}
export declare function createComfyStudioProvider(binding: SlotBinding, bridge: StudioBridge, fetchImpl?: typeof fetch): Provider;
/** 设置页「本地画布工作室」可用性探测（零成本、零渲染）：模块可否加载 + 内部面齐不齐 + ComfyUI 可达性。 */
export interface StudioProbeResult {
    available: boolean;
    runRender: boolean;
    importManualImage: boolean;
    comfyUrl: string;
    comfyOk: boolean;
    comfyVersion?: string;
    reason?: string;
}
export declare function probeStudio(bridge?: StudioBridge, fetchImpl?: typeof fetch): Promise<StudioProbeResult>;
export {};
