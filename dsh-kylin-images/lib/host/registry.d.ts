import { ResultCache } from '../store/cache.ts';
import { effectiveSizeStyle } from '../provider/catalog.ts';
import type { ChannelKind, ChannelRecord, GenerateRequest, ImageProvider } from '../provider/types.ts';
import { Vault } from '../store/vault.ts';
export interface PluginRuntime {
    home: string;
    vault: Vault;
    cache: ResultCache;
    providers: Map<ChannelKind, ImageProvider>;
    providerFor(channel: ChannelRecord): ImageProvider;
    /** 通道显式 sizeStyle 优先，其次按通道类型/模型名推断。 */
    sizeStyleFor(channel: ChannelRecord, model?: string): ReturnType<typeof effectiveSizeStyle>;
    /** 把请求尺寸按通道 sizeStyle 归一（provider 内部也会做，这里给工具面预检用）。 */
    decoratesRequest(channel: ChannelRecord, request: GenerateRequest): GenerateRequest;
}
export declare function createRuntime(home?: string): PluginRuntime;
