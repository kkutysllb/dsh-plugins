// src/providers/comfy-studio.ts
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
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { isStudioTier } from "../store/slots.js";
import { localPathOf } from "../file-url.js";
const STUDIO_PACKAGE = 'dsh-short-video-studio';
/** 视频交付帧率与工作室一致（24fps）；durationSec → length 的换算基准。 */
const STUDIO_FPS = 24;
export class StudioUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StudioUnavailableError';
    }
}
async function loadStudio(bridge) {
    let mod;
    try {
        // 变量说明符：comfy-studio 是可选依赖，绝不能进静态解析（否则未装工作室时整个插件加载失败）。
        mod = bridge.loadModule
            ? await bridge.loadModule()
            : await import(__rewriteRelativeImportExtension(STUDIO_PACKAGE));
    }
    catch (err) {
        throw new StudioUnavailableError(`本地画布工作室不可用：无法加载 ${STUDIO_PACKAGE}（${err instanceof Error ? err.message : String(err)}）。` +
            '请确认它已装在同一 profile，或把该槽位改回远端通道');
    }
    const internals = mod?._internals;
    if (!internals || typeof internals.runRender !== 'function') {
        throw new StudioUnavailableError(`本地画布工作室不可用：${STUDIO_PACKAGE} 的 _internals.runRender 缺失（版本不兼容或内部通道已变更）。` +
            '本适配器不做静默降级，请更新工作室或改回远端通道');
    }
    return internals;
}
/** 会话 → 画布根目录。口径与工作室 resolveSessionRoot 一致（cwd 优先，再按 registry 的 sessionIds 命中），
 *  这样「我们自己 importManualImage 的落点」与「工作室 runRender 的落点」必然同一个项目目录。 */
function resolveCanvasRoot(bridge) {
    const exec = bridge.exec;
    const sessionId = typeof exec?.agent?.id === 'string' ? exec.agent.id : '';
    if (!sessionId) {
        throw new StudioUnavailableError('本地画布工作室：工具 exec 未带 agent.id，无法定位当前画布（仅 vgen_generate 主路径支持本地工作室）');
    }
    const cwd = exec?.agent?.session?.meta?.cwd;
    if (cwd)
        return { root: cwd, sessionId };
    const reg = bridge.hostCtx?.workspaceRegistry;
    const hit = reg?.list?.().find((w) => Array.isArray(w.sessionIds) && w.sessionIds.includes(sessionId));
    if (hit?.path)
        return { root: hit.path, sessionId };
    throw new StudioUnavailableError(`本地画布工作室：无法为会话 ${sessionId} 解析 workspace 根目录`);
}
const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
/** 把本地图片送进画布，拿回可作为 first_frame_node 的节点 id。
 *  为什么必须过画布：工作室的首帧/参考图接口只认「画布节点 id 或资产 id」，
 *  而本插件的逐镜参考图是 runs/<id>/shots/*.png 这个本地文件。 */
async function ensureCanvasImage(internals, bridge, file, title) {
    const importManualImage = internals.importManualImage;
    if (typeof importManualImage !== 'function') {
        throw new StudioUnavailableError('本地画布工作室不可用：_internals.importManualImage 缺失，无法把逐镜参考图作为首帧送进去');
    }
    const path = localPathOf(file);
    const ext = extname(path).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime)
        throw new Error(`本地画布工作室：首帧只支持 png/jpg/webp/gif，当前是 ${ext || '(无扩展名)'}`);
    const dataUrl = `data:${mime};base64,${readFileSync(path).toString('base64')}`;
    const { root, sessionId } = resolveCanvasRoot(bridge);
    const node = await importManualImage(root, sessionId, { dataUrl, filename: basename(path), title }, 'shots');
    if (!node?.id)
        throw new Error('本地画布工作室：首帧导入画布失败（未返回节点 id）');
    return node.id;
}
function parseSize(raw) {
    if (typeof raw !== 'string')
        return {};
    const m = /^(\d{2,5})x(\d{2,5})$/.exec(raw.trim());
    if (!m)
        return {};
    return { width: Number(m[1]), height: Number(m[2]) };
}
/** 一次渲染调用（能力 + 档位 + 参数 → 工作室跑完 → 落盘产物）。 */
async function runRenderOnce(internals, bridge, opts) {
    const exec = bridge.exec;
    const call = { ...opts, exec: bridge.exec };
    // 工具窗口截止 / 宿主停用：原样透传，让工作室的轮询也能被中止（否则 600s 掐断后会留下在跑的图）
    if (exec?.signal)
        call['signal'] = exec.signal;
    const r = await internals.runRender(bridge.hostCtx, call);
    const absPath = typeof r?.absPath === 'string' ? r.absPath : '';
    if (!r?.ok || !absPath) {
        throw new Error(`本地画布工作室渲染失败（无产物路径）${r?.warnings?.length ? '：' + r.warnings.join('；') : ''}`);
    }
    return r;
}
export function createComfyStudioProvider(binding, bridge, fetchImpl = fetch) {
    const jobs = new Map();
    const isVideoSlot = binding.slot === 'video';
    const tier = isStudioTier(binding.capabilities['tier']) ? binding.capabilities['tier'] : undefined;
    const maxDurationSec = typeof binding.capabilities['maxDurationSec'] === 'number' ? binding.capabilities['maxDurationSec'] : 10;
    const capabilities = isVideoSlot
        ? { image: false, imageToVideo: true, textToVideo: true, maxDurationSec }
        : { image: true };
    return {
        id: 'comfy-studio:' + binding.slot,
        capabilities,
        /** 本地生成不产生费用：显式 0 让成本护栏放行（远端 unknown 价必须确认，本地无此必要）。 */
        async quote() {
            return { qualityTier: 0, costEstimate: 0, currency: 'CNY' };
        },
        async submit(stage, spec) {
            const internals = await loadStudio(bridge);
            const prompt = String(spec['prompt'] ?? '').trim();
            if (!prompt)
                throw new Error('本地画布工作室：prompt 为空');
            if (stage === 'master-asset' || stage === 'shot-assets') {
                const size = parseSize(spec['size']);
                const r = await runRenderOnce(internals, bridge, {
                    capability: 'image.text2image',
                    prompt,
                    ...(tier ? { tier } : {}),
                    ...size,
                    title: stage === 'master-asset' ? '主图（本地工作室）' : '逐镜图（本地工作室）',
                });
                // 同步图像约定：jobId 即 URL（saveUrl 认 file://）
                return { jobId: 'file://' + r.absPath };
            }
            if (stage === 'video') {
                const jobId = 'studio:' + randomUUID();
                const rec = { state: 'running' };
                jobs.set(jobId, rec);
                const imageUrl = typeof spec['imageUrl'] === 'string' && spec['imageUrl'] ? spec['imageUrl'] : '';
                const durationSec = Number(spec['durationSec'] ?? 5);
                const length = Math.max(1, Math.round((Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 5) * STUDIO_FPS));
                void (async () => {
                    try {
                        // 有参考图 = i2v（身份/环境由首帧继承）；无 = t2v 降级（能力位已在上游门控）
                        const firstFrame = imageUrl ? await ensureCanvasImage(internals, bridge, imageUrl, '逐镜首帧（本地工作室）') : undefined;
                        rec.result = await runRenderOnce(internals, bridge, {
                            capability: imageUrl ? 'video.image2video' : 'video.text2video',
                            prompt,
                            ...(tier ? { tier } : {}),
                            ...(firstFrame ? { first_frame_node: firstFrame } : {}),
                            length,
                            title: '片段（本地工作室）',
                        });
                        rec.state = 'done';
                    }
                    catch (err) {
                        rec.state = 'failed';
                        rec.error = err instanceof Error ? err.message : String(err);
                    }
                })();
                return { jobId };
            }
            throw new Error(`本地画布工作室：不支持的段 ${stage}（本适配器只服务 master-asset / shot-assets / video）`);
        },
        async status(jobId) {
            const rec = jobs.get(jobId);
            if (!rec)
                return { state: 'unknown', progress: null, error: `未知作业 ${jobId}` };
            if (rec.state === 'done')
                return { state: 'done', progress: 1 };
            if (rec.state === 'failed')
                return { state: 'failed', progress: null, error: rec.error ?? '渲染失败' };
            return { state: 'running', progress: null };
        },
        async fetch(jobId) {
            const rec = jobs.get(jobId);
            if (!rec || rec.state !== 'done' || !rec.result?.absPath) {
                throw new Error(`本地画布工作室：作业未完成或不存在 ${jobId}`);
            }
            const r = rec.result;
            return {
                outputs: ['file://' + r.absPath],
                meta: {
                    mediaType: r.mediaType || (isVideoSlot ? 'video' : 'image'),
                    bytes: r.bytes ?? 0,
                    studioNodeId: r.node?.id ?? '',
                    tier: r.tier ?? '',
                    implementation: r.implementation ?? '',
                    resolution: r.resolution ?? '',
                    warnings: r.warnings ?? [],
                },
            };
        },
        /** 健康 = ComfyUI 可达（工作室只是转发层，真正的算力在后端）。 */
        async health() {
            try {
                const internals = await loadStudio(bridge);
                const baseUrl = internals.getCfg?.().baseUrl;
                if (!baseUrl)
                    return { ok: false };
                const res = await fetchImpl(baseUrl.replace(/\/+$/, '') + '/system_stats', { signal: AbortSignal.timeout(8000) });
                return { ok: res.ok };
            }
            catch {
                return { ok: false };
            }
        },
    };
}
export async function probeStudio(bridge = {}, fetchImpl = fetch) {
    let internals;
    try {
        internals = await loadStudio(bridge);
    }
    catch (err) {
        return {
            available: false, runRender: false, importManualImage: false, comfyUrl: '', comfyOk: false,
            reason: err instanceof Error ? err.message : String(err),
        };
    }
    const comfyUrl = internals.getCfg?.().baseUrl ?? '';
    let comfyOk = false;
    let comfyVersion;
    if (comfyUrl) {
        try {
            const res = await fetchImpl(comfyUrl.replace(/\/+$/, '') + '/system_stats', { signal: AbortSignal.timeout(5000) });
            comfyOk = res.ok;
            if (res.ok) {
                const j = (await res.json());
                const v = j?.system?.comfyui_version;
                if (typeof v === 'string' && v)
                    comfyVersion = v;
            }
        }
        catch {
            comfyOk = false;
        }
    }
    return {
        available: true, runRender: true,
        importManualImage: typeof internals.importManualImage === 'function',
        comfyUrl, comfyOk, ...(comfyVersion ? { comfyVersion } : {}),
    };
}
