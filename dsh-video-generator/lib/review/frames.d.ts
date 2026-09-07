/** 评审抽帧：ffmpeg 按 25/50/75% 抽 3 帧（规格 §5.3）。exec/probe 注入可测，零真 ffmpeg 依赖。 */
export type ExecRunner = (cmd: string, args: string[]) => Promise<void>;
/** 25/50/75% 三个时间点（秒，3 位小数）；时长非法即抛（评审输入必须已核验）。 */
export declare function frameTimestamps(durationSec: number): number[];
/** -ss 放 -i 前 = 输入端快速定位（关键帧精度对评审足够）。 */
export declare function buildFrameArgs(clip: string, atSec: number, out: string): string[];
export interface ExtractOptions {
    probe?: (file: string, ffmpeg: string) => Promise<number | null>;
    exec?: ExecRunner;
}
export declare function extractReviewFrames(clip: string, outDir: string, ffmpeg: string, opts?: ExtractOptions): Promise<string[]>;
