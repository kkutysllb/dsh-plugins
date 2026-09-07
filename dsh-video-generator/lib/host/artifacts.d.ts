/** run 产物清单（设置页「视频工坊」数据源；rel 为 run 目录内 POSIX 风格相对路径，供 media URL 拼接）。 */
import type { RunStore } from '../store/runs.ts';
export interface ArtifactFile {
    name: string;
    rel: string;
    size: number;
}
export interface RunArtifacts {
    handoff: {
        story: boolean;
        script: boolean;
        storyboard: boolean;
    };
    assets: ArtifactFile[];
    shots: ArtifactFile[];
    clips: ArtifactFile[];
    review: ArtifactFile[];
    final: {
        mp4: ArtifactFile | null;
        srt: ArtifactFile | null;
    };
}
export declare function collectArtifacts(runs: RunStore, runId: string): RunArtifacts;
