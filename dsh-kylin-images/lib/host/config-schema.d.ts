export interface ConfigFieldSpec {
    type: 'string' | 'number' | 'boolean' | 'string[]';
    description: string;
    enum?: readonly string[];
    minimum?: number;
    maximum?: number;
}
/** 字段元数据：供文档、客户端卡片与设置命名空间注册使用。 */
export declare const CONFIG_FIELDS: Record<string, ConfigFieldSpec>;
export declare const CONFIG_FIELD_NAMES: readonly string[];
/** 解析后的配置：归一化字段 + 原样保留的未知键。 */
export declare function resolvePluginConfig(raw: unknown): Record<string, unknown>;
export declare const Config: {
    '~standard': {
        version: 1;
        vendor: string;
        validate(raw: unknown): {
            value: Record<string, unknown>;
        };
    };
    /** 非标准扩展字段：cordis 会忽略，供本插件文档与客户端读取。 */
    fields: Record<string, ConfigFieldSpec>;
    defaults: import("../store/settings.ts").PluginSettings;
};
/** 从宿主配置里取出我们关心的字段（用于首次激活时播种 vault）。 */
export declare function pickConfigFields(raw: unknown): Record<string, unknown>;
