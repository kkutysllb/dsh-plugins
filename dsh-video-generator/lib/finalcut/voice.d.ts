/** 配音：voiceFile 外挂优先（云 TTS/真人录音）；否则 macOS say / Windows SAPI 本地合成。 */
export interface VoiceIntent {
    voiceFile?: string;
    voiceHint?: string;
}
export type VoiceResolution = {
    kind: 'file';
    src: string;
} | {
    kind: 'say';
    text: string;
} | {
    kind: 'sapi';
    text: string;
} | null;
export declare function resolveVoice(intent: VoiceIntent, platform: NodeJS.Platform): VoiceResolution;
export declare function buildMacSayCommand(text: string, outAiff: string, voice?: string): {
    cmd: string;
    args: string[];
    file: string;
};
export declare function buildSapiScript(text: string, outWav: string): string;
export interface CloudTtsConfig {
    /** 站点根或 /v1 根均可（内部归一）。 */
    baseUrl: string;
    apiKey: string;
    /** 如 gpt-4o-mini-tts / qwen-tts 等（以站点 /v1/models 实测为准）。 */
    model: string;
    /** 如 alloy / shimmer；中文旁白任意音色均可，配合 instructions 定语气。 */
    voice?: string;
    /** 语气指令（gpt-4o-mini-tts 支持），如 "温柔的中文女声旁白，语速平缓"。 */
    instructions?: string;
    /** mp3 之外的格式（缺省 mp3）。 */
    responseFormat?: string;
}
export declare function buildCloudSpeechRequest(cfg: CloudTtsConfig, text: string): {
    url: string;
    init: RequestInit;
};
/** 云端合成：返回 mp3 字节（调用方落盘）。非 200 抛 RelayError（复用 relay-http 的错误归一）。 */
export declare function synthesizeCloudSpeech(cfg: CloudTtsConfig, text: string, fetchImpl?: typeof fetch, timeoutMs?: number): Promise<Buffer>;
