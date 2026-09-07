/** ffmpeg 渲染通道：归一化（scale 覆盖 + crop 中心裁切/fps）→ concat → drawtext 字幕 → 混音（规格 §5 成片链路）。 */
import type { Timeline } from './timeline.ts';
export declare function locateFfmpeg(env?: NodeJS.ProcessEnv): string | null;
export interface RenderPlan {
    normalize: Array<{
        src: string;
        out: string;
        args: string[];
    }>;
    composite: {
        args: string[];
    };
    workDir: string;
}
/** 探测常见 CJK 字体（macOS 优先，回退 Linux 常见路径）；找不到返回 null。 */
export declare function pickFontFile(): string | null;
/** drawtext 缺失检测：Homebrew 精简构建等场景 ffmpeg 会报 `No such filter: 'drawtext'`。 */
export declare function drawtextMissing(stderr: string): boolean;
export declare function buildRenderPlan(t: Timeline, outPath: string, opts: {
    ffmpeg: string;
    workDir: string;
    subtitles?: boolean;
    fontFile?: string | null;
}): RenderPlan;
export declare function renderTimeline(t: Timeline, outPath: string, opts?: {
    subtitles?: boolean;
    ffmpeg?: string;
    fontFile?: string | null;
}): Promise<{
    ok: boolean;
    output?: string;
    error?: string;
}>;
export declare function probeDurationSec(file: string, ffmpeg?: string): Promise<number | null>;
