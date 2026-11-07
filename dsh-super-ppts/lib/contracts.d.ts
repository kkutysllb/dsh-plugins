import { type TemplateRecord } from './templates.js';
export type ContractStatus = 'pending' | 'parsed' | 'missing' | 'ambiguous' | 'stale';
export interface ContractLevel {
    level: string;
    role: string;
    font?: string;
    sizePt?: number;
    lineSpacing?: number;
    color?: string;
    bold?: boolean;
    enforced: boolean;
    source: 'file' | 'observed' | 'user';
}
export interface ContractConstraint {
    text: string;
    source: 'description' | 'style-notes';
}
export interface TemplateContract {
    schemaVersion: 1;
    templateId: string;
    sourceHash: string;
    parsedAt: string;
    status: ContractStatus;
    levels: ContractLevel[];
    constraints: ContractConstraint[];
    observed: {
        fonts: string[];
        sizesPt: number[];
    };
    tolerances: {
        sizePt: number;
        colorDeltaE: number;
        lineSpacing: number;
    };
    enforcement: {
        declared: 'strict';
        observed: 'advisory';
        exemptRatioWarn: number;
    };
    error?: string;
}
export interface TemplateSpec {
    ok: boolean;
    levelRules: Array<{
        level?: string;
        font?: string;
        sizePt?: number;
        lineSpacing?: number;
        color?: string;
        source?: string;
    }>;
    observed?: {
        fonts?: Record<string, number>;
        sizesPt?: Record<string, number>;
        minSizePt?: number;
    };
    error?: string;
}
export interface EnsureContractDeps {
    runSpec?: (file: string) => Promise<TemplateSpec>;
}
export declare function normalizeFont(value: string | undefined): string | undefined;
export declare function normalizeColor(value: string | undefined): string | undefined;
export declare function contractFile(templateId: string): string;
export declare function readContract(templateId: string): TemplateContract | null;
export declare function normalizeSpec(input: {
    templateId: string;
    sourceHash: string;
    spec: TemplateSpec;
    description?: string;
    styleNotes?: string;
}): TemplateContract;
export declare function ensureContract(record: TemplateRecord, deps?: EnsureContractDeps): Promise<TemplateContract>;
