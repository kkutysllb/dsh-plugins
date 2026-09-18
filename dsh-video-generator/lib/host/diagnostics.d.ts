/** 设置页「环境与诊断」（规格 §8）：ffmpeg/drawtext 检测、TTS 能力、产物根目录、插件版本。 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
export interface Diagnostics {
    version: string;
    platform: string;
    ffmpeg: {
        path: string;
        version: string | null;
        drawtext: boolean;
        error?: string;
    };
    tts: {
        available: boolean;
        model?: string;
        hint?: string;
    };
    runsRoot: string;
    projectsRoots: string[];
}
export declare function collectDiagnostics(opts: {
    vault: VaultStore;
    runs: RunStore;
    version: string;
}): Promise<Diagnostics>;
