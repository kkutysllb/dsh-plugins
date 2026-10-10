/** music/score.json 组装（规格 §6.4）：段落/节拍网格 + 歌词行时间轴 + 溯源。
 *  grid.source 三级如实标注：api（适配器 sectionsPath 命中）＞ local-analysis（本地
 *  PCM 分析）＞ estimate（按歌词段落均分兜底）——不许把兜底假装成 API 结果。
 */
import type { MusicSection } from './analyze.ts';
export type GridSource = 'api' | 'local-analysis' | 'estimate';
export interface MusicGrid {
    source: GridSource;
    bpm: number | null;
    offsetSec: number | null;
    sections: MusicSection[];
    /** 拍点（秒，升序）；上限截断，网格相位以 bpm/offsetSec 为准。 */
    beats: number[];
}
export interface LyricSection {
    section: string;
    startSec: number;
    endSec: number;
    lines: string[];
}
export interface MusicScore {
    kind: 'bgm' | 'song';
    file: string;
    durationSec: number;
    grid: MusicGrid;
    lyrics: LyricSection[];
    model: string;
    channelId: string;
}
/** 歌词文本 → 段落结构（[Intro]/[Verse]/[Chorus]…；无标签整段作单段）。 */
export declare function parseLyricsSections(text: string): Array<{
    section: string;
    lines: string[];
}>;
/** 拍点网格（bpm+offset 已知时）；上限 beats 输出 512 个，超出以 bpm/offsetSec 表达。 */
export declare function beatsFrom(bpm: number | null, offsetSec: number | null, durationSec: number, cap?: number): number[];
/** 歌词行时间轴：段落网格与歌词段落数一致时 zip 对齐，否则均分（估算）。 */
export declare function alignLyrics(sections: MusicSection[], lyricsText: string, durationSec: number): LyricSection[];
/** 均分段落（无歌词/无信息时的兜底网格）。 */
export declare function evenSections(count: number, durationSec: number, labelPrefix?: string): MusicSection[];
export declare function assembleScore(input: {
    kind: 'bgm' | 'song';
    file: string;
    durationSec: number;
    grid: MusicGrid;
    lyricsText?: string;
    model: string;
    channelId: string;
}): MusicScore;
