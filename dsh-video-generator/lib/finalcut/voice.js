/** 配音：voiceFile 外挂优先（云 TTS/真人录音）；否则 macOS say / Windows SAPI 本地合成。 */
// voiceFile 的存在性由调用方探测；SAPI 脚本必须写临时 .ps1 后用 powershell -File 执行（不得 -Command 内联，防引号剥离重开解析面）；say 的 text 以 - 开头时执行层需自行防护。
export function resolveVoice(intent, platform) {
    if (intent.voiceFile)
        return { kind: 'file', src: intent.voiceFile };
    const text = (intent.voiceHint ?? '').trim();
    if (!text)
        return null;
    if (platform === 'darwin')
        return { kind: 'say', text };
    if (platform === 'win32')
        return { kind: 'sapi', text };
    return null;
}
export function buildMacSayCommand(text, outAiff, voice = 'Tingting') {
    return { cmd: 'say', args: ['-v', voice, '-o', outAiff, text], file: outAiff };
}
export function buildSapiScript(text, outWav) {
    const escaped = text.replace(/'/g, "''");
    return [
        'Add-Type -AssemblyName System.Speech',
        '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
        `$s.SetOutputToWaveFile('${outWav.replace(/'/g, "''")}')`,
        `$s.Speak('${escaped}')`,
        '$s.Dispose()',
    ].join('\n');
}
export function buildCloudSpeechRequest(cfg, text) {
    const base = cfg.baseUrl.trim().replace(/\/+$/, '');
    const body = { model: cfg.model, voice: cfg.voice ?? 'alloy', input: text, response_format: cfg.responseFormat ?? 'mp3' };
    if (cfg.instructions)
        body['instructions'] = cfg.instructions;
    return {
        url: `${base}/v1/audio/speech`,
        init: {
            method: 'POST',
            headers: { Authorization: `Bearer ${cfg.apiKey}`, 'content-type': 'application/json' },
            body: JSON.stringify(body),
        },
    };
}
/** 云端合成：返回 mp3 字节（调用方落盘）。非 200 抛 RelayError（复用 relay-http 的错误归一）。 */
export async function synthesizeCloudSpeech(cfg, text, fetchImpl = fetch, timeoutMs = 120000) {
    const { url, init } = buildCloudSpeechRequest(cfg, text);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
        const res = await fetchImpl(url, { ...init, signal: ac.signal });
        if (!res.ok) {
            let msg = `http-${res.status}`;
            try {
                const j = (await res.json());
                msg = j?.error?.message ?? (typeof j?.message === 'string' ? j.message : msg);
            }
            catch { /* 非 JSON 错误体 */ }
            throw new Error(`云端 TTS 失败: ${msg}`);
        }
        return Buffer.from(await res.arrayBuffer());
    }
    catch (err) {
        if (err instanceof Error && err.name === 'AbortError')
            throw new Error('云端 TTS 超时');
        throw err;
    }
    finally {
        clearTimeout(timer);
    }
}
