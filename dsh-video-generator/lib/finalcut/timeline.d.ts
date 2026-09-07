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
export interface TimelineData {
    canvas: CanvasSpec;
    clips: TimelineClip[];
    subtitles: TimelineSubtitle[];
    audio: TimelineAudio[];
    totalDurationUs: number;
}
export declare class Timeline {
    readonly canvas: CanvasSpec;
    readonly clips: TimelineClip[];
    readonly subtitles: TimelineSubtitle[];
    readonly audio: TimelineAudio[];
    constructor(canvas: CanvasSpec);
    get totalDurationUs(): number;
    addClip(src: string, durationUs: number, volume?: number): TimelineClip;
    addSubtitle(text: string, startUs: number, endUs: number): void;
    addAudio(src: string, startUs: number, durationUs?: number, volume?: number): void;
}
export interface TimelineShotInput {
    video: string;
    durationUs: number;
    subtitle?: string;
    audio?: string;
    audioDurationUs?: number;
}
/** 镜头数组 → 时间线：每镜 clip；有台词给 subtitle（覆盖该镜区间）；有配音给 audio。镜头时长 = max(视频, 配音+400ms)。 */
export declare function buildTimeline(input: {
    canvas: CanvasSpec;
    shots: TimelineShotInput[];
}): TimelineData;
/** 微秒 → SRT 时码 HH:MM:SS,mmm。 */
export declare function formatSrtTime(us: number): string;
export declare function writeSrt(subtitles: TimelineSubtitle[]): string;
