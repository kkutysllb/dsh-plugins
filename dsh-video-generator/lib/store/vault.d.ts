/** 多通道三要素保险库：0700/0600 + tmp+rename 原子写 + 损坏备份/形状守卫 + 全出口脱敏。 */
export type ModelKind = 'image' | 'video' | 'tts';
export interface ChannelModel {
    model: string;
    kind: ModelKind;
    endpointProfile?: string;
    pricingCny?: number;
    qualityTier?: number;
}
export interface ChannelConfig {
    id: string;
    label: string;
    kind: 'openai-compat';
    baseUrl: string;
    apiKey: string;
    models: ChannelModel[];
    enabled: boolean;
    createdAt: string;
}
export type GateMode = 'auto' | 'ask' | 'manual';
export interface VaultData {
    version: 1;
    channels: ChannelConfig[];
    defaultChannelId: string | null;
    budget: {
        confirmThresholdCny: number;
    };
    gateDefaults: Record<string, GateMode>;
}
export declare function defaultVaultData(): VaultData;
export declare function resolveVaultPath(env?: NodeJS.ProcessEnv): string;
export declare function maskCredential(s: string): string;
/** 显式声明字段 + 构造器体内赋值（Node strip-only 禁参数属性）。 */
export declare class VaultError extends Error {
    readonly code: 'bad-request' | 'not-found' | 'conflict';
    constructor(code: 'bad-request' | 'not-found' | 'conflict', message: string);
}
export type MaskedChannel = Omit<ChannelConfig, 'apiKey'> & {
    apiKeyMasked: string;
};
export interface ChannelInput {
    id: string;
    baseUrl: string;
    apiKey: string;
    label?: string;
    models?: ChannelModel[];
    enabled?: boolean;
}
/** 显式声明字段 + 构造器体内赋值（Node strip-only 禁参数属性）。 */
export declare class VaultStore {
    readonly file: string;
    constructor(file: string);
    static open(opts?: {
        file?: string;
        env?: NodeJS.ProcessEnv;
    }): VaultStore;
    load(): VaultData;
    save(data: VaultData): void;
    private mutate;
    listChannels(): MaskedChannel[];
    getChannel(id: string): ChannelConfig | null;
    createChannel(input: ChannelInput): MaskedChannel;
    updateChannel(id: string, patch: Partial<Pick<ChannelConfig, 'label' | 'baseUrl' | 'enabled' | 'models'>> & {
        apiKey?: string;
    }): MaskedChannel;
    deleteChannel(id: string): void;
    setDefaultChannel(id: string | null): void;
    getBudget(): VaultData['budget'];
    setBudget(confirmThresholdCny: number): void;
    getGateDefaults(): Record<string, GateMode>;
    setGateDefault(stage: string, mode: GateMode): void;
}
