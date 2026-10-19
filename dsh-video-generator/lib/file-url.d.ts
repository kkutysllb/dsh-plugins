/** 本地产物以 `file://` 交付时的路径归一（跨平台，含 Windows）。
 *
 * 为什么单独一个模块：生产方（comfy-studio 适配器）与消费方（shot-clip.saveUrl 落盘）必须用
 * **同一套**归一规则——三槽都选本地时，图槽产出的 `file://<abs>` 会被当 url 落进 shot-urls，
 * 再由 video 段原样回灌成首帧，两处规则不一致就会算错路径。
 *
 * 支持的三种形态：
 * - `file:///Users/x/a.png`（POSIX 标准）→ `/Users/x/a.png`
 * - `file:///C:/Users/x/a.png`（Windows 标准）→ `C:/Users/x/a.png`（去掉多余的根斜杠）
 * - `file://C:\Users\x\a.png`（本插件在 Windows 上 `'file://' + absPath` 拼出的形态）→ 原样
 * 裸路径（POSIX 绝对 / Windows 盘符 / UNC）原样返回。
 */
export declare function localPathOf(url: string): string;
