/** 通道 + 模型 -> Provider 工厂。路由依据 model-catalog 的 kind + 附录 B.4 的协议地图。
 *  成本估算唯一来源是站点价目表（pricing.ts）；model-catalog 的 pricingCny 仅作展示元数据，不参与护栏。
 *  estimate 注入链：M3b 流水线接 PricingTable 后 quote() 才有真实报价。
 */
import type { Provider } from './provider.ts';
export interface ChannelRef {
    id: string;
    baseUrl: string;
    apiKey: string;
}
export declare function providerForModel(channel: ChannelRef, model: string, opts?: {
    fetchImpl?: typeof fetch;
    estimate?: (model: string) => number | null;
}): Provider;
