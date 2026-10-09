export declare const PNG_SIGNATURE: Buffer<ArrayBuffer>;
export interface Rgb {
    r: number;
    g: number;
    b: number;
}
/** 逐像素取色的画布函数：返回 [r,g,b]，越界由调用方保证。 */
export type PixelShader = (x: number, y: number) => Rgb;
/** 把着色函数渲染成 PNG 字节。 */
export declare function encodePng(width: number, height: number, shader: PixelShader): Buffer;
/** 确定性占位图：色相由 seed 决定，叠一层斜纹便于肉眼确认「确实出图了」。 */
export declare function placeholderPng(width: number, height: number, seed: number, label?: string): Buffer;
/** 读 PNG 的 IHDR 宽高（供测试与工具做轻量校验）。 */
export declare function readPngSize(buffer: Buffer): {
    width: number;
    height: number;
} | undefined;
