/**
 * 尺寸映射：把中性的「比例 + 分辨率」翻译成具体通道的请求字段。
 *
 * 上游与本地实测确认存在三种模型行为，必须分别覆盖：
 *   pixels            —— OpenAI 原生：size 是像素串（1024x1536）
 *   ratio-resolution  —— 聚合站（Apimart 形态）：size 是比例串 + 独立 resolution
 *   ignore            —— 模型自己决定（如 seedream 忽略 size）
 */
import type { AspectRatio, Resolution } from './vocab.ts';
export type SizeStyle = 'pixels' | 'ratio-resolution' | 'ignore';
export declare const SIZE_STYLES: readonly SizeStyle[];
export interface SizeRequest {
    aspectRatio: AspectRatio;
    resolution: Resolution;
    sizeStyle: SizeStyle;
}
export interface ProviderSize {
    size?: string;
    resolution?: string;
    width?: number;
    height?: number;
}
export declare function pixelSize(aspectRatio: AspectRatio): {
    width: number;
    height: number;
};
export declare function isSizeStyle(value: unknown): value is SizeStyle;
/** 中性尺寸请求 -> 通道请求字段。纯函数，同输入恒同输出。 */
export declare function toProviderSize(request: SizeRequest): ProviderSize;
