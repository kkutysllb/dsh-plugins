/** 两层模型目录：内置缺省（按名字模式）+ 用户覆盖。查表：user > builtin > unknown。 */
import type { ModelKind } from './store/vault.ts';
import type { ProviderCapabilities } from './provider.ts';
export interface CatalogEntry {
    kind: ModelKind;
    capabilities: ProviderCapabilities;
    pricingCny?: number;
    qualityTier: number;
}
interface BuiltinRule extends CatalogEntry {
    patterns: string[];
}
export declare const BUILTIN_CATALOG: BuiltinRule[];
export interface ResolvedModel {
    model: string;
    entry: CatalogEntry;
    source: 'user' | 'builtin' | 'unknown';
}
export declare function resolveModel(model: string, override?: Partial<CatalogEntry>, builtin?: BuiltinRule[]): ResolvedModel;
export {};
