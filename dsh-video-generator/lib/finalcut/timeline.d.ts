/** 中性时间线模型：微秒单位、线性首尾相接（M3 范围）；与渲染通道解耦（规格 §5 成片链路）。 */
export interface CanvasSpec {
    width: number;
    height: number;
    fps: number;
}
export interface TimelineClip {
    src: string;
    startUs: number;
    durationUs: number;
    volume?: number;
    /** 源素材实际时长（探测值）：MV 对点时渲染端据此对超长素材 -t 修剪（只裁不撑）。 */
    srcDurationUs?: number;
}
export interface TimelineSubtitle {
    text: string;
    startUs: number;
    endUs: number;
}
export interface TimelineAudio {
    src: string;
    startUs: number;
    durationUs?: number;
    volume?: number;
}
export interface TimelineMusic {
    src: string;
    /** 缺省 = 渲染端按 totalDurationUs 循环补长/裁切。 */
    durationUs?: number;
    /** 缺省 0.22（规格 §6.3：0.18–0.25）。 */
    volume?: number;
}
export interface TimelineData {
    canvas: CanvasSpec;
    clips: TimelineClip[];
    subtitles: TimelineSubtitle[];
    audio: TimelineAudio[];
    /** BGM 轨（至多一条）：渲染端循环补长/裁切 + 淡入淡出 + 人声 ducking。 */
    music?: TimelineMusic | null;
    totalDurationUs: number;
}
export declare class Timeline {
    readonly canvas: CanvasSpec;
    readonly clips: TimelineClip[];
    readonly subtitles: TimelineSubtitle[];
    readonly audio: TimelineAudio[];
    music: TimelineMusic | null;
    constructor(canvas: CanvasSpec);
    get totalDurationUs(): number;
    addClip(src: string, durationUs: number, volume?: number, srcDurationUs?: number): TimelineClip;
    addSubtitle(text: string, startUs: number, endUs: number): void;
    addAudio(src: string, startUs: number, durationUs?: number, volume?: number): void;
    addMusic(src: string, durationUs?: number, volume?: number): void;
}
export interface TimelineShotInput {
    video: string;
    durationUs: number;
    subtitle?: string;
    audio?: string;
    audioDurationUs?: number;
    /** 源素材探测时长（秒）——MV 修剪判定用。 */
    srcDurationSec?: number;
}
/** 镜头数组 → 时间线：每镜 clip；有台词给 subtitle（覆盖该镜区间）；有配音给 audio。镜头时长 = max(视频, 配音+400ms)。 */
export declare function buildTimeline(input: {
    canvas: CanvasSpec;
    shots: TimelineShotInput[];
}): Timeline;
/** 微秒 → SRT 时码 HH:MM:SS,mmm。 */
export declare function formatSrtTime(us: number): string;
export declare function writeSrt(subtitles: TimelineSubtitle[]): string;
