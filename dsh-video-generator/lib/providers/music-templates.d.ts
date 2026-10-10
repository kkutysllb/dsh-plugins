/** 内置音乐映射模板（规格 §4.2）：按**协议形态**命名，不是 provider 预设。
 *  纯数据——不含 baseUrl/apiKey/模型名/provider 名；仅作设置页表单初始值，
 *  套用后仍须「测试」真实验证。用户另存的模板落 vault（source=user）。
 */
import type { MusicTemplate } from '../store/slots.ts';
export declare const BUILTIN_MUSIC_TEMPLATES: readonly MusicTemplate[];
