/** 通道保险库 v2：凭证层（Channel）+ 用途槽层（每槽恰好一条 SlotBinding）。
 *  0700/0600 + tmp+rename 原子写 + 损坏备份/形状守卫 + 全出口脱敏。
 *  v1（models[] 模型池 + defaultChannelId）在 load() 时经 migrate-vault 一次性迁移。
 */
import { type MusicTemplate, type ProtocolFamily, type SlotBinding, type SlotId } from './slots.ts';
export { capabilityFlag, capabilityOf, isProtocolFamily, isSlotId, parseMusicTemplate, parseSlotBinding, sanitizeCapabilities, sanitizeMusicMapping, slotUnavailableMessage, PROTOCOL_FAMILIES, SLOT_IDS, SLOT_META, type CapabilityValue, type GenericMusicMapping, type MusicTemplate, type ProtocolFamily, type SlotBinding, type SlotId, type SlotKind, type SlotMeta, } from './slots.ts';
export interface ChannelConfig {
    id: string;
    label: string;
    kind: 'openai-compat';
    baseUrl: string;
    apiKey: string;
    /** 实测/用户声明的协议族集合（信息性：供槽位绑定时的下拉提示；真实验证在槽位「测试」）。 */
    protocols: ProtocolFamily[];
    enabled: boolean;
    createdAt: string;
    verifiedAt?: string;
    verifyNote?: string;
}
export type GateMode = 'auto' | 'ask' | 'manual';
export interface VaultData {
    version: 2;
    channels: ChannelConfig[];
    /** 每槽恰好一条绑定；结构性排除多候选（规格 §2.1）。 */
    slots: Partial<Record<SlotId, SlotBinding>>;
    /** 用户另存的音乐映射模板（内置模板随插件数据提供，不落库，随版本刷新）。 */
    musicTemplates: MusicTemplate[];
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
    enabled?: boolean;
    protocols?: ProtocolFamily[];
}
/** 解析成功后的逐字段形状守卫：损坏但合法的 JSON 不带类型谎言入库。 */
export declare function sanitize(parsed: unknown): VaultData;
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
    updateChannel(id: string, patch: Partial<Pick<ChannelConfig, 'label' | 'baseUrl' | 'enabled' | 'protocols'>> & {
        apiKey?: string;
    }): MaskedChannel;
    /** 删除通道：引用它的槽位绑定一并清除（避免悬挂绑定），返回清除的槽位数。 */
    deleteChannel(id: string): {
        clearedSlots: SlotId[];
    };
    markChannelVerified(id: string, note: string): MaskedChannel;
    listSlotBindings(): SlotBinding[];
    getSlotBinding(slot: SlotId): SlotBinding | null;
    setSlotBinding(input: {
        slot: SlotId;
    } & Record<string, unknown>): SlotBinding;
    clearSlotBinding(slot: SlotId): {
        cleared: boolean;
    };
    listUserMusicTemplates(): MusicTemplate[];
    saveMusicTemplate(input: {
        id?: unknown;
        label: unknown;
        fields: unknown;
        note?: unknown;
    }): MusicTemplate;
    deleteMusicTemplate(id: string): void;
    getBudget(): VaultData['budget'];
    setBudget(confirmThresholdCny: number): void;
    getGateDefaults(): Record<string, GateMode>;
    setGateDefault(stage: string, mode: GateMode): void;
}
