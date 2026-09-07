/** vgen_channels：通道健康 / 价目估算 / 累计消耗（规格 §7.1）。全出口脱敏（vault.listChannels 已脱敏）。 */
import type { VaultStore } from '../store/vault.ts';
import type { RunStore } from '../store/runs.ts';
import { probeChannel } from '../probe.ts';
import { fetchPricing } from '../pricing.ts';
import type { ToolResult, DshToolDefinition } from './handoff.ts';
export interface ChannelsContext {
    vault: VaultStore;
    runs: RunStore;
    env?: NodeJS.ProcessEnv;
    /** 测试注入：探测实现。 */
    probe?: typeof probeChannel;
    /** 测试注入：定价表拉取。 */
    fetchPricingImpl?: typeof fetchPricing;
}
export interface ChannelsArgs {
    action?: 'list' | 'health' | 'spend';
    channelId?: string;
}
export declare function buildChannelsTools(ctx: ChannelsContext): {
    channels: {
        execute: (args: ChannelsArgs) => Promise<ToolResult>;
    };
};
export declare function channelsToolDefs(tools: ReturnType<typeof buildChannelsTools>): DshToolDefinition[];
