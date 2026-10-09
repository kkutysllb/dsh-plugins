export const SIZE_STYLES = ['pixels', 'ratio-resolution', 'ignore'];
/** 像素形态的比例表（与 KSkills image-generation 脚本的映射保持一致并补全）。 */
const PIXEL_TABLE = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1536, height: 1024 },
    '3:2': { width: 1536, height: 1024 },
    '4:3': { width: 1536, height: 1024 },
    '9:16': { width: 1024, height: 1536 },
    '2:3': { width: 1024, height: 1536 },
    '3:4': { width: 1024, height: 1536 },
};
export function pixelSize(aspectRatio) {
    return PIXEL_TABLE[aspectRatio];
}
export function isSizeStyle(value) {
    return typeof value === 'string' && SIZE_STYLES.includes(value);
}
/** 中性尺寸请求 -> 通道请求字段。纯函数，同输入恒同输出。 */
export function toProviderSize(request) {
    if (request.sizeStyle === 'ignore')
        return {};
    if (request.sizeStyle === 'ratio-resolution') {
        return { size: request.aspectRatio, resolution: request.resolution };
    }
    const px = pixelSize(request.aspectRatio);
    return { size: px.width + 'x' + px.height, width: px.width, height: px.height };
}
