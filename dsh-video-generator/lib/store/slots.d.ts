/** 用途槽（Use-Slot）单一事实源：槽位词汇表、能力位白名单、通用音乐映射与纯函数校验
 *  （规格 2026-09-28 §2）。vault.ts 依赖本模块做形状守卫；Host 与客户端共用同一份
 *  槽位元数据（SLOT_META），杜绝"双份实现漂移"。
 *
 *  核心设计约束：`slots` 在 vault 中是 `SlotId → 单条 SlotBinding` 映射——
 *  结构上无法表达第二候选，"多模型轮询/自动兜底"由此在类型层被排除。
 */
export type SlotId = 'image.master' | 'image.shot' | 'video' | 'tts' | 'music.bgm' | 'music.song';
export declare const SLOT_IDS: readonly SlotId[];
export declare function isSlotId(v: unknown): v is SlotId;
export type SlotKind = 'image' | 'video' | 'tts' | 'music';
/** 协议族：适配器与协议一一对应；绑定级声明（同一中转站可同时提供多族协议）。 */
export type ProtocolFamily = 'openai-images' | 'openai-tts' | 'dashscope-video' | 'kling-video' | 'openai-video' | 'generic-music';
export declare const PROTOCOL_FAMILIES: readonly ProtocolFamily[];
export declare function isProtocolFamily(v: unknown): v is ProtocolFamily;
export type CapabilityValue = boolean | number | string;
/** 通用音乐映射（声明式端点，零 provider 绑定）：必填 4 项 = endpoint.path /
 *  request.promptField / response.audioPath / mode；async 模式另需 endpoint.statusPath
 *  （可含 {id} 占位符）+ response.jobIdPath。 */
export interface GenericMusicMapping {
    endpoint: {
        path: string;
        method?: 'POST';
        /** async 轮询 URL 模板，`{id}` 会替换为提交返回的任务 id，如 '/v1/music/tasks/{id}'。 */
        statusPath?: string;
    };
    mode: 'sync' | 'async';
    request: {
        promptField: string;
        lyricsField?: string;
        instrumentalField?: string;
        durationField?: string;
        referenceAudioField?: string;
        extra?: Record<string, unknown>;
    };
    response: {
        /** 音频取值路径（sync：提交响应；async：轮询响应），如 'data.audio_url' 或 'data[0].url'。 */
        audioPath: string;
        /** async 必填：提交响应里的任务 id 路径。 */
        jobIdPath?: string;
        /** async 必填：轮询响应里的状态值路径（缺省按 'status' 读）。 */
        statusValuePath?: string;
        doneValues?: string[];
        failedValues?: string[];
        pollIntervalMs?: number;
        audioIsBase64?: boolean;
        urlIsSigned?: boolean;
        durationPath?: string;
        /** MV 对点：API 返回段落/时间戳时填写（多数家不返回 → 走本地分析）。 */
        sectionsPath?: string;
        sectionsStartField?: string;
        sectionsEndField?: string;
        sectionsLabelField?: string;
    };
}
export interface SlotBinding {
    slot: SlotId;
    channelId: string;
    model: string;
    protocol: ProtocolFamily;
    capabilities: Record<string, CapabilityValue>;
    music?: GenericMusicMapping;
    verifiedAt?: string;
    verifyNote?: string;
}
export interface MusicTemplate {
    id: string;
    label: string;
    source: 'builtin' | 'user';
    fields: GenericMusicMapping;
    note?: string;
}
export interface SlotMeta {
    slot: SlotId;
    kind: SlotKind;
    label: string;
    purpose: string;
    required: boolean;
    consumer: string;
}
/** 槽位元数据（Host 错误文案与客户端渲染共用）。 */
export declare const SLOT_META: Record<SlotId, SlotMeta>;
/** 未绑定槽被消费时的统一错误文案（含槽位名与指引；spec 验收 2）。 */
export declare function slotUnavailableMessage(slot: SlotId): string;
/** 能力位归一化：白名单过滤 + 类型校正 + 缺省补齐（显式落库）。 */
export declare function sanitizeCapabilities(slot: SlotId, raw: unknown): Record<string, CapabilityValue>;
/** 通用音乐映射守卫：缺任一必填 → null（整条绑定按缺必填丢弃）。 */
export declare function sanitizeMusicMapping(raw: unknown): GenericMusicMapping | null;
/** 槽位绑定守卫：缺必填/非法协议/music 映射错位 → null（调用方整条丢弃，spec §2.1）。 */
export declare function parseSlotBinding(slot: SlotId, raw: unknown): SlotBinding | null;
/** 音乐模板守卫：label 必填；fields 走同一映射守卫；source 只认 builtin|user。 */
export declare function parseMusicTemplate(raw: unknown): MusicTemplate | null;
/** 读侧便捷：能力位取值（带缺省）。 */
export declare function capabilityOf(binding: SlotBinding, key: string): CapabilityValue | undefined;
export declare function capabilityFlag(binding: SlotBinding, key: string, fallback?: boolean): boolean;
