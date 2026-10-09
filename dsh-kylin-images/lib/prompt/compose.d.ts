import type { ProviderSize, SizeStyle } from './sizes.ts';
export interface ComposeOptions {
    /** 待编译的 ImagePrompt（未知输入，内部走校验器）。 */
    prompt: unknown;
    /** 所选模板的避坑指南（已按语言取出；进 CONSTRAINTS 段，不进 negative）。 */
    templatePitfalls?: readonly string[] | undefined;
    /** 用户全局追加的负面词（来自「视觉模型」配置菜单）。 */
    globalNegative?: readonly string[] | undefined;
    /** 通道尺寸风格；缺省 ratio-resolution（聚合站最常见）。 */
    sizeStyle?: SizeStyle | undefined;
    /** 是否并入通用负面词，默认并入。 */
    includeGenericNegative?: boolean | undefined;
}
export interface ComposedPrompt {
    /** 最终发给通道的提示词正文。 */
    prompt: string;
    /** 最终负面清单（逗号分隔，可为空串）。 */
    negative: string;
    /** 按通道尺寸风格翻译出的请求字段。 */
    size: ProviderSize;
    /** 分段结果，顺序即注入顺序（便于测试与人工预览）。 */
    sections: string[];
    /** 校验与降级提示；非致命，不阻断生成。 */
    warnings: string[];
}
/** 编译一个 ImagePrompt。永不抛异常：校验错误降级为 warnings。 */
export declare function composePrompt(options: ComposeOptions): ComposedPrompt;
