/** 音乐网格本地分析（规格 §6.4 二级来源）：ffmpeg 抽裸 PCM（s16le 单声道 22050Hz）
 *  → RMS 包络 → onset 检测 → 自相关估 BPM → 段落边界（能量谷）。零运行时依赖。
 *
 *  精度口径：够"切镜/对点"级，不做科研级节拍跟踪；grid.source 必须如实标
 *  'local-analysis'（规格 §6.4：不许假装是 API 给的）。
 */
export interface RmsFrame {
    /** 帧中心时间（秒）。 */
    t: number;
    /** 帧内样本 RMS（0..1 近似，int16 满幅=1）。 */
    rms: number;
}
export interface MusicSection {
    label: string;
    startSec: number;
    endSec: number;
}
export interface MusicAnalysis {
    /** 估计 BPM（拍/分钟）；onset 不足时 null。 */
    bpm: number | null;
    /** 第一强 onset（秒），BPM 网格相位。 */
    offsetSec: number | null;
    /** 段落边界切出的段落（label 为 S1..Sn 的匿名段）。 */
    sections: MusicSection[];
    /** onset 时刻（秒，升序）。 */
    onsets: number[];
}
/** ffmpeg 抽裸 PCM 到内存（s16le mono）。上限 120s 源（防护：异常长音频截断分析）。 */
export declare function extractPcm(file: string, ffmpeg: string, maxSeconds?: number): Promise<Buffer>;
/** PCM → RMS 包络（窗口 1024 样本、步进 512 → ≈23ms/帧 @22.05k）。 */
export declare function pcmEnvelope(pcm: Buffer, sampleRate?: number, hop?: number, win?: number): RmsFrame[];
/** onset 检测：能量显著上跳（当前帧 > factor × 前向局部均值）且过绝对门限。 */
export declare function onsetTimes(frames: RmsFrame[], opts?: {
    factor?: number;
    floor?: number;
    minGapSec?: number;
}): number[];
/** 节拍估计：onset 脉冲串自相关，lag ∈ [0.3, 1.0]s（60–200 BPM）取峰。 */
export declare function estimateTempo(onsets: number[], durationSec: number): {
    bpm: number;
    offsetSec: number;
} | null;
/** 段落边界：平滑 RMS 的显著能量谷（静默/过渡），相邻边界 ≥ minGapSec。 */
export declare function sectionBoundaries(frames: RmsFrame[], opts?: {
    minGapSec?: number;
    smooth?: number;
}): number[];
export declare function sectionsFromBoundaries(boundaries: readonly number[], durationSec: number): MusicSection[];
/** 一站式：文件 → 分析结果（供 music 段 grid 组装）。 */
export declare function analyzeMusicFile(file: string, ffmpeg: string): Promise<MusicAnalysis>;
