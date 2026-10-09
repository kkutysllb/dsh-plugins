import type { ComicProject } from './project.ts';
export declare const CONTACT_SHEET_FILE = "contact-sheet.html";
export declare function escapeHtml(value: string): string;
export interface ContactSheetOptions {
    /** 相对项目目录的图片路径前缀（默认空，即与 HTML 同目录）。 */
    imagePrefix?: string | undefined;
    /** 生成时间戳（注入便于测试）。 */
    now?: string | undefined;
}
/** 渲染联系表 HTML。纯函数。 */
export declare function renderContactSheet(project: ComicProject, options?: ContactSheetOptions): string;
export declare function writeContactSheet(dir: string, project: ComicProject, options?: ContactSheetOptions): string;
