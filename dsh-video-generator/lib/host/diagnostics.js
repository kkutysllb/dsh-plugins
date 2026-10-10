/** 设置页「环境与诊断」（规格 §8）：ffmpeg/drawtext 检测、TTS 能力、产物根目录、插件版本。 */
import { execFile } from 'node:child_process';
import { locateFfmpeg } from "../finalcut/render-ffmpeg.js";
function run(ffmpeg, args, timeoutMs) {
    return new Promise((resolve) => {
        execFile(ffmpeg, args, { timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err)
                resolve({ stdout: String(stdout ?? ''), stderr: String(stderr ?? ''), error: err.message });
            else
                resolve({ stdout: String(stdout ?? ''), stderr: String(stderr ?? '') });
        });
    });
}
export async function collectDiagnostics(opts) {
    const ffmpeg = locateFfmpeg() ?? 'ffmpeg';
    const [version, filters] = await Promise.all([
        run(ffmpeg, ['-version'], 10_000),
        run(ffmpeg, ['-filters', '-hide_banner'], 15_000),
    ]);
    const versionLine = version.stdout.split('\n')[0]?.trim() ?? null;
    const ffmpegOut = {
        path: ffmpeg,
        version: version.error ? null : versionLine,
        drawtext: !filters.error && /drawtext/i.test(filters.stdout),
        ...(filters.error && version.error ? { error: version.error } : {}),
    };
    const data = opts.vault.load();
    const ttsBinding = data.slots['tts'];
    const ttsChannel = ttsBinding ? data.channels.find((c) => c.id === ttsBinding.channelId) : null;
    return {
        version: opts.version,
        platform: `${process.platform}-${process.arch}`,
        ffmpeg: ffmpegOut,
        tts: ttsBinding && ttsChannel
            ? { available: true, model: ttsBinding.model }
            : {
                available: false,
                hint: ttsBinding
                    ? 'tts 槽绑定的通道不存在或已删除：成片旁白将回退本地系统语音，请在「用途槽」重新绑定'
                    : '未绑定 tts 槽：成片旁白将回退本地系统语音（质量有限），可在设置页「用途槽 → 配音」配置云端 TTS',
            },
        runsRoot: opts.runs.rootDir,
        projectsRoots: [`<workspace>/.dsh-drama`],
    };
}
