/**
 * 内置模型目录：按模型名推断能力与价目。
 *
 * 定位（对齐 dsh-video-generator §4.2 的两层查表）：**用户覆盖 > 内置缺省 > unknown**。
 * 这里只提供缺省值，任何一项都能被通道级配置覆盖；不内置任何站点信息。
 *
 * 价目快照：2026-08 / 2026-10 上游与实测公开数据，人民币口径，仅作预估；
 * 真实计费以通道方为准（confidence 因此标 estimated）。
 */
import type { SizeStyle } from '../prompt/sizes.ts';
export interface ModelPriceTable {
    currency: string;
    /** 按分辨率档位；缺失时回落 default。 */
    byResolution?: Record<string, number>;
    default?: number;
}
export interface ModelSpec {
    /** 小写子串匹配；按目录顺序首个命中生效。 */
    match: readonly string[];
    /** 建议的尺寸风格（通道显式配置优先）。 */
    sizeStyle: SizeStyle;
    /** 是否有原生负向字段（当前主流图像 API 都没有，负向要折进提示词）。 */
    supportsNegative: boolean;
    supportsReferenceImage: boolean;
    supportsSeed: boolean;
    price: ModelPriceTable | null;
    note: string;
}
/** 顺序敏感：越具体的家族越靠前。 */
export declare const BUILTIN_MODELS: readonly ModelSpec[];
export declare const UNKNOWN_MODEL_SPEC: ModelSpec;
export declare function inferModel(model: string | undefined): ModelSpec | undefined;
export declare function resolveModelSpec(model: string | undefined): ModelSpec;
/**
 * 通道未声明模型、用户也没选默认模型时的兜底模型名。
 *
 * 没有这层兜底，mock 通道会因为 model='' 查不到价目而每次都要用户确认——
 * 这是 M2 联调时抓到的真实体验缺陷。
 */
export declare function defaultModelForKind(kind: string): string;
/** 通道类型给出的尺寸风格缺省（优先于模型建议）。 */
export declare function defaultSizeStyleForKind(kind: string): SizeStyle;
export declare function effectiveSizeStyle(channelSizeStyle: SizeStyle | undefined, kind: string, model: string | undefined): SizeStyle;
/** 给设置页/文档用的一行摘要。 */
export declare function modelCatalogText(): string;
