/**
 * 负面清单与约束块。
 *
 * 关键区分（上游最容易被误用的一点）：
 *   constraints.avoid  -> 词条，进 negative_prompt
 *   模板 pitfalls      -> 散文句子，进提示词正文的 CONSTRAINTS 段
 * 二者不混用：把整句散文塞进 negative_prompt 会污染模型对「不要什么」的理解。
 */
/** 通用负面词：任何图像模型都适用的最低限度排除项。 */
export declare const GENERIC_NEGATIVE: readonly string[];
/** 按顺序合并多组负面词：去空白、去重（大小写不敏感）、保持首次出现顺序。 */
export declare function mergeNegatives(groups: ReadonlyArray<readonly string[] | undefined>): string[];
/** 合并负面清单为通道可直接发送的字符串。为空时返回空串。 */
export declare function negativeString(groups: ReadonlyArray<readonly string[] | undefined>): string;
/**
 * 约束块：must（用户硬要求，优先）+ pitfalls（模板避坑指南，散文）。
 * 保持给定顺序，去重（大小写不敏感）。
 */
export declare function buildConstraintLines(input: {
    must?: readonly string[] | undefined;
    pitfalls?: readonly string[] | undefined;
}): string[];
