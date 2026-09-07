/** 中性时间线模型：微秒单位、线性首尾相接（M3 范围）；与渲染通道解耦（规格 §5 成片链路）。 */
export class Timeline {
    canvas;
    clips = [];
    subtitles = [];
    audio = [];
    constructor(canvas) {
        this.canvas = canvas;
    }
    get totalDurationUs() {
        return this.clips.reduce((acc, c) => Math.max(acc, c.startUs + c.durationUs), 0);
    }
    addClip(src, durationUs, volume) {
        const startUs = this.clips.reduce((acc, c) => acc + c.durationUs, 0);
        const clip = { src, startUs, durationUs, ...(volume !== undefined ? { volume } : {}) };
        this.clips.push(clip);
        return clip;
    }
    addSubtitle(text, startUs, endUs) {
        this.subtitles.push({ text, startUs, endUs });
    }
    addAudio(src, startUs, durationUs, volume) {
        this.audio.push({ src, startUs, durationUs, ...(volume !== undefined ? { volume } : {}) });
    }
}
/** 镜头数组 → 时间线：每镜 clip；有台词给 subtitle（覆盖该镜区间）；有配音给 audio。镜头时长 = max(视频, 配音+400ms)。 */
export function buildTimeline(input) {
    const t = new Timeline(input.canvas);
    for (const shot of input.shots) {
        const audioPadUs = shot.audio ? 400_000 : 0;
        const durationUs = Math.max(shot.durationUs, (shot.audioDurationUs ?? 0) + audioPadUs);
        t.addClip(shot.video, durationUs);
        const startUs = t.clips[t.clips.length - 1].startUs;
        if (shot.subtitle)
            t.addSubtitle(shot.subtitle, startUs, startUs + durationUs);
        if (shot.audio)
            t.addAudio(shot.audio, startUs + 200_000, shot.audioDurationUs);
    }
    return t;
}
/** 微秒 → SRT 时码 HH:MM:SS,mmm。 */
export function formatSrtTime(us) {
    const totalMs = Math.max(0, Math.round(us / 1000));
    const ms = totalMs % 1000;
    const totalSec = Math.floor(totalMs / 1000);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60) % 60;
    const hour = Math.floor(totalSec / 3600);
    const p = (n, w = 2) => String(n).padStart(w, '0');
    return `${p(hour)}:${p(min)}:${p(sec)},${p(ms, 3)}`;
}
export function writeSrt(subtitles) {
    return subtitles
        .map((s, i) => `${i + 1}\n${formatSrtTime(s.startUs)} --> ${formatSrtTime(s.endUs)}\n${s.text}`)
        .join('\n\n') + '\n';
}
