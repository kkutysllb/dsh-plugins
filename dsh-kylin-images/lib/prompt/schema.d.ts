import type { AspectRatio, Resolution } from './vocab.ts';
export declare const IMAGE_INTENTS: readonly ["single-image", "comic-page", "variant-set", "edit"];
export type ImageIntent = (typeof IMAGE_INTENTS)[number];
export declare const IMAGE_FORMATS: readonly ["png", "jpeg", "webp"];
export type ImageFormat = (typeof IMAGE_FORMATS)[number];
export interface ImagePromptTextBlock {
    content: string;
    kind?: string;
    speaker?: string;
    mustRenderExactly?: boolean;
}
export interface ImagePromptCharacter {
    name: string;
    sheet: string;
    refImage?: string;
}
export interface ImagePromptComposition {
    layout?: string;
    shot?: string;
    panels?: string[];
    hierarchy?: string[];
}
export interface ImagePromptStyle {
    artStyle?: string;
    tone?: string;
    tags?: string[];
    materials?: string[];
}
export interface ImagePromptTechnical {
    aspectRatio?: AspectRatio;
    resolution?: Resolution;
    format?: ImageFormat;
    seed?: number;
}
export interface ImagePromptConstraints {
    must?: string[];
    avoid?: string[];
}
export interface ImagePrompt {
    schemaVersion: 1;
    id?: string;
    intent: ImageIntent;
    templateId?: string;
    subject: string;
    composition?: ImagePromptComposition;
    style?: ImagePromptStyle;
    text?: ImagePromptTextBlock[];
    characters?: ImagePromptCharacter[];
    technical?: ImagePromptTechnical;
    constraints?: ImagePromptConstraints;
    language?: string;
    meta?: {
        source?: string;
        notes?: string;
    };
}
export interface ValidationResult {
    ok: boolean;
    errors: string[];
    value: ImagePrompt;
}
/** 校验并规范化一个 ImagePrompt。永不抛异常。 */
export declare function validateImagePrompt(input: unknown): ValidationResult;
