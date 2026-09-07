/** DashScope 原生透传视频适配器（wan/happyhorse 家族；契约：规格附录 B.4，实测端到端）。 */
import { type Provider } from '../provider.ts';
export interface DashscopeChannel {
    baseUrl: string;
    apiKey: string;
    model: string;
    estimate?: (model: string) => number | null;
}
export declare function createDashscopeRelayProvider(ch: DashscopeChannel, fetchImpl?: typeof fetch): Provider;
