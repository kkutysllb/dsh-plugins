/**
 * 「视觉模型」配置的非敏感字段（对应设计规格 §11.3 分区 1-5）。
 *
 * 凭据不在这里：API Key 只存在于 vault 的通道记录里。
 * 这些字段会被插件自己的 API 读写，并镜像到宿主设置命名空间（供 configForms 渲染）。
 */
import { ASPECT_RATIOS, RESOLUTIONS, isAspectRatio, isResolution } from "../prompt/vocab.js";
import { IMAGE_FORMATS } from "../prompt/schema.js";
export const QUALITIES = ['low', 'medium', 'high', 'auto'];
export const DEFAULT_SETTINGS = {
    defaultChannelId: '',
    defaultModel: '',
    defaultAspectRatio: '3:4',
    defaultResolution: '2k',
    defaultFormat: 'png',
    defaultQuality: 'auto',
    defaultCount: 1,
    concurrency: 2,
    globalNegative: [],
    includeTemplatePitfalls: true,
    budgetConfirmCny: 1,
    confirmUnknownPrice: true,
    cacheEnabled: true,
    cacheDir: '',
    cacheMaxEntries: 200,
};
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function clampInt(value, min, max, fallback) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    return Math.max(min, Math.min(max, Math.round(parsed)));
}
function readString(value, fallback, maxLength = 200) {
    if (typeof value !== 'string')
        return fallback;
    const trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed.slice(0, maxLength);
}
function readStringList(value, fallback) {
    if (!Array.isArray(value))
        return fallback;
    const out = [];
    for (const item of value) {
        if (typeof item !== 'string')
            continue;
        const trimmed = item.trim();
        if (trimmed !== '' && !out.includes(trimmed))
            out.push(trimmed.slice(0, 200));
        if (out.length >= 64)
            break;
    }
    return out;
}
function readBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
/** 规范化任意输入为完整设置（容错：坏字段回落默认值，永不抛异常）。 */
export function normalizeSettings(input) {
    if (!isRecord(input))
        return { ...DEFAULT_SETTINGS, globalNegative: [] };
    const ratio = input['defaultAspectRatio'];
    const resolution = input['defaultResolution'];
    const format = input['defaultFormat'];
    const quality = input['defaultQuality'];
    return {
        defaultChannelId: readString(input['defaultChannelId'], DEFAULT_SETTINGS.defaultChannelId, 32),
        defaultModel: readString(input['defaultModel'], DEFAULT_SETTINGS.defaultModel, 128),
        defaultAspectRatio: isAspectRatio(ratio) ? ratio : DEFAULT_SETTINGS.defaultAspectRatio,
        defaultResolution: isResolution(resolution) ? resolution : DEFAULT_SETTINGS.defaultResolution,
        defaultFormat: typeof format === 'string' && IMAGE_FORMATS.includes(format)
            ? format
            : DEFAULT_SETTINGS.defaultFormat,
        defaultQuality: typeof quality === 'string' && QUALITIES.includes(quality)
            ? quality
            : DEFAULT_SETTINGS.defaultQuality,
        defaultCount: clampInt(input['defaultCount'], 1, 4, DEFAULT_SETTINGS.defaultCount),
        concurrency: clampInt(input['concurrency'], 1, 8, DEFAULT_SETTINGS.concurrency),
        globalNegative: readStringList(input['globalNegative'], []),
        includeTemplatePitfalls: readBoolean(input['includeTemplatePitfalls'], DEFAULT_SETTINGS.includeTemplatePitfalls),
        budgetConfirmCny: Math.max(0, Number.isFinite(Number(input['budgetConfirmCny'])) ? Number(input['budgetConfirmCny']) : DEFAULT_SETTINGS.budgetConfirmCny),
        confirmUnknownPrice: readBoolean(input['confirmUnknownPrice'], DEFAULT_SETTINGS.confirmUnknownPrice),
        cacheEnabled: readBoolean(input['cacheEnabled'], DEFAULT_SETTINGS.cacheEnabled),
        cacheDir: readString(input['cacheDir'], DEFAULT_SETTINGS.cacheDir, 400),
        cacheMaxEntries: clampInt(input['cacheMaxEntries'], 0, 5000, DEFAULT_SETTINGS.cacheMaxEntries),
    };
}
export const ASPECT_RATIO_CHOICES = ASPECT_RATIOS;
export const RESOLUTION_CHOICES = RESOLUTIONS;
export const FORMAT_CHOICES = IMAGE_FORMATS;
