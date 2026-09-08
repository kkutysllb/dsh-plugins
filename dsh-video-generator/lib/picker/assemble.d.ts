import type { MaskedChannel, ModelKind } from '../store/vault.ts';
export interface PickerRow {
    model: string;
    kind: ModelKind;
    isConfigured: boolean;
    isNew: boolean;
}
export declare function assemblePickerRows(ch: MaskedChannel, enumerated: string[]): PickerRow[];
