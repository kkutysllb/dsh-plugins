import type { ChannelRecord, PublicChannel } from '../provider/types.ts';
import type { PluginSettings } from './settings.ts';
export declare const VAULT_FILE = "vault.json";
export declare const VAULT_VERSION = 1;
export declare const CHANNEL_ID_PATTERN: RegExp;
export declare const MAX_SECRET_LENGTH = 512;
export interface VaultData {
    version: number;
    channels: ChannelRecord[];
    settings: PluginSettings;
}
export interface PublicVault {
    version: number;
    channels: PublicChannel[];
    settings: PluginSettings;
}
/** 脱敏：前 3 + •••• + 后 3；短串一律全掩。 */
export declare function maskCredential(secret: unknown): string;
export declare function toPublicChannel(channel: ChannelRecord): PublicChannel;
/** 允许 https，以及指向本机回环的 http（本地网关/自建中转的常见形态）。 */
export declare function isAllowedBaseUrl(value: string): boolean;
export interface ChannelUpsertResult {
    ok: boolean;
    errors: string[];
    channel?: PublicChannel;
}
export declare class Vault {
    readonly dir: string;
    readonly path: string;
    data: VaultData;
    constructor(dir?: string);
    private read;
    /** 原子落盘：tmp + rename；目录 0700、文件 0600。 */
    save(): void;
    /** vault 文件是否已存在：用于判断「首次激活」（宿主配置只在那时播种）。 */
    exists(): boolean;
    list(): ChannelRecord[];
    publicList(): PublicChannel[];
    publicData(): PublicVault;
    find(id: string): ChannelRecord | undefined;
    settings(): PluginSettings;
    updateSettings(patch: unknown): PluginSettings;
    upsert(input: unknown): ChannelUpsertResult;
    remove(id: string): boolean;
    /** 由 label 生成合法 id（冲突时追加序号）。 */
    slugFrom(label: string): string;
}
/** 测试与清理用：删除 vault 文件。 */
export declare function removeVault(dir: string): void;
