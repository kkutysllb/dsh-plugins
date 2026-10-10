/** DashScope 原生透传视频适配器（wan/happyhorse 家族；契约：规格附录 B.4，实测端到端）。 */
import { type Provider } from '../provider.ts';
export interface DashscopeChannel {
    baseUrl: string;
    apiKey: string;
    model: string;
    estimate?: (model: string) => number | null;
    /** i2v 模态能力位（槽位绑定声明；缺省 = 仅 t2v——不按模型名猜测，规格 §3）。 */
    imageToVideo?: boolean;
}
export declare function createDashscopeRelayProvider(ch: DashscopeChannel, fetchImpl?: typeof fetch): Provider;
