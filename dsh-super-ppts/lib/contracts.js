/**
 * 模板排版契约（host 侧，零 npm 依赖）。
 *
 * 真源是 template_spec.py 从模板 .pptx 文字里解析出的 levelRules；本模块负责：
 * - 归一化：层级→role、字体别名、中文色名→hex、声明级/观察级；
 * - 缓存：<STORE_ROOT>/template-contracts/<templateId>.json（含源文件 hash）；
 * - 失效：模板文件 hash 变化即重新解析；
 * - 语义：状态 parsed / pending / missing / ambiguous / stale，缺失不静默回落。
 *
 * 业务门（ppts_task done）只接受 parsed 契约；其余状态必须给用户可执行的错误。
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packageRoot } from './paths.js';
import { STORE_ROOT } from './templates.js';
import { findPythonFor, runPython } from './python.js';
const TEMPLATE_SPEC_SCRIPT = join(packageRoot, 'skills', 'ppts-pptx', 'scripts', 'template_spec.py');
const CONTRACTS_DIR = join(STORE_ROOT, 'template-contracts');
const TEMPLATE_ID_RE = /^[a-z0-9]{3,64}$/i;
const FONT_ALIASES = {
    '雅黑': '微软雅黑',
    '微软雅黑': '微软雅黑',
    'microsoft yahei': '微软雅黑',
    'msyh': '微软雅黑',
    '宋体': '宋体',
    'simsun': '宋体',
    'arial': 'Arial',
    'calibri': 'Calibri',
    '等线': '等线',
    'dengxian': '等线',
};
const COLOR_NAMES = {
    '黑色': '#000000',
    '白色': '#FFFFFF',
    '深红': '#8B0000',
    '红色': '#FF0000',
    '深蓝': '#00008B',
    '蓝色': '#0000FF',
    '绿色': '#00B050',
    '黄色': '#FFFF00',
    '橙色': '#FFA500',
    '紫色': '#800080',
    '灰色': '#808080',
    '深灰': '#404040',
    '浅灰': '#D9D9D9',
};
const ROLE_BY_LABEL = {
    '顶部标题': 'title',
    '标题': 'title',
    '一级标题': 'title',
    '副标题': 'subtitle',
    '正文': 'body',
    '内容': 'body',
    '综述内容': 'body',
    '注释': 'footnote',
    '页脚': 'footnote',
    '来源': 'footnote',
    '页码': 'page-number',
    '图表标签': 'chart-label',
};
export function normalizeFont(value) {
    if (typeof value !== 'string')
        return undefined;
    const key = value.trim();
    if (key === '')
        return undefined;
    return FONT_ALIASES[key] ?? FONT_ALIASES[key.toLowerCase()] ?? key;
}
export function normalizeColor(value) {
    if (typeof value !== 'string')
        return undefined;
    const key = value.trim();
    if (key === '')
        return undefined;
    const named = COLOR_NAMES[key];
    if (named !== undefined)
        return named;
    const hex = key.startsWith('#') ? key.slice(1) : key;
    return /^[0-9a-f]{6}$/i.test(hex) ? '#' + hex.toUpperCase() : undefined;
}
function roleFor(level, index) {
    const label = typeof level === 'string' ? level.trim() : '';
    const mapped = ROLE_BY_LABEL[label];
    if (mapped !== undefined)
        return mapped;
    if (label !== '')
        return 'custom:' + label.replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').slice(0, 40);
    return 'custom:level-' + String(index + 1);
}
function constraintsFrom(description, styleNotes) {
    const out = [];
    for (const [source, text] of [['description', description], ['style-notes', styleNotes]]) {
        if (typeof text !== 'string')
            continue;
        for (const piece of text.split(/[。；;\n]+/)) {
            const item = piece.trim().replace(/^[，,、:：\s]+/, '');
            if (item.length >= 2)
                out.push({ text: item, source });
        }
    }
    return out;
}
export function contractFile(templateId) {
    const id = String(templateId ?? '').trim();
    if (!TEMPLATE_ID_RE.test(id))
        throw new Error('非法模板 id：' + id);
    return join(CONTRACTS_DIR, id + '.json');
}
export function readContract(templateId) {
    let file;
    try {
        file = contractFile(templateId);
    }
    catch {
        return null;
    }
    try {
        const raw = JSON.parse(readFileSync(file, 'utf8'));
        if (raw === null || typeof raw !== 'object')
            return null;
        if (raw.schemaVersion !== 1 || typeof raw.status !== 'string' || !Array.isArray(raw.levels))
            return null;
        return raw;
    }
    catch {
        return null;
    }
}
function writeContract(contract) {
    mkdirSync(CONTRACTS_DIR, { recursive: true });
    const file = contractFile(contract.templateId);
    const tmp = file + '.tmp';
    writeFileSync(tmp, JSON.stringify(contract, null, 2) + '\n', 'utf8');
    renameSync(tmp, file);
}
function sourceHashOf(file) {
    return 'sha256:' + createHash('sha256').update(readFileSync(file)).digest('hex');
}
export function normalizeSpec(input) {
    const base = {
        schemaVersion: 1,
        templateId: input.templateId,
        sourceHash: input.sourceHash,
        parsedAt: new Date().toISOString(),
        status: 'parsed',
        levels: [],
        constraints: constraintsFrom(input.description, input.styleNotes),
        observed: {
            fonts: Object.keys(input.spec?.observed?.fonts ?? {}),
            sizesPt: Object.keys(input.spec?.observed?.sizesPt ?? {})
                .map((key) => Number(key))
                .filter((value) => Number.isFinite(value)),
        },
        tolerances: { sizePt: 0.5, colorDeltaE: 3, lineSpacing: 0.05 },
        enforcement: { declared: 'strict', observed: 'advisory', exemptRatioWarn: 0.15 },
    };
    const rules = Array.isArray(input.spec?.levelRules) ? input.spec.levelRules : [];
    if (input.spec?.ok === false || rules.length === 0) {
        base.status = 'missing';
        base.error = input.spec?.error ?? '模板没有可读的分层排版规则';
        return base;
    }
    const seen = new Map();
    const levels = [];
    rules.forEach((rule, index) => {
        const role = roleFor(rule.level, index);
        const sizePt = typeof rule.sizePt === 'number' && Number.isFinite(rule.sizePt) ? rule.sizePt : undefined;
        const previous = seen.get(role);
        if (previous !== undefined && sizePt !== undefined && Math.abs(previous - sizePt) > 0.01) {
            base.status = 'ambiguous';
            base.error = '层级「' + String(rule.level ?? role) + '」出现冲突字号：' + previous + ' / ' + sizePt;
        }
        if (sizePt !== undefined)
            seen.set(role, sizePt);
        levels.push({
            level: String(rule.level ?? role),
            role,
            font: normalizeFont(rule.font),
            sizePt,
            lineSpacing: typeof rule.lineSpacing === 'number' ? rule.lineSpacing : undefined,
            color: normalizeColor(rule.color),
            enforced: true,
            source: 'file',
        });
    });
    if (levels.every((level) => level.sizePt === undefined && level.font === undefined && level.color === undefined)) {
        base.status = 'missing';
        base.error = '模板规则没有可判定的字体/字号/颜色';
        return base;
    }
    base.levels = levels;
    return base;
}
async function defaultRunSpec(file) {
    const python = await findPythonFor(['pptx']);
    if (python === null)
        throw new Error('未找到可导入 python-pptx 的 Python 3（已尝试 python3 / /usr/bin/python3 / python / py -3）');
    const result = await runPython(python, [TEMPLATE_SPEC_SCRIPT, file, '--json'], 120_000);
    if (!result.ok)
        throw new Error('template_spec 失败：' + (result.stderr || result.stdout).slice(0, 2000));
    try {
        return JSON.parse(result.stdout);
    }
    catch (error) {
        throw new Error('template_spec 输出不是 JSON：' + String(error?.message ?? error));
    }
}
export async function ensureContract(record, deps = {}) {
    if (!existsSync(record.file)) {
        const missing = {
            schemaVersion: 1,
            templateId: record.id,
            sourceHash: '',
            parsedAt: new Date().toISOString(),
            status: 'missing',
            levels: [],
            constraints: constraintsFrom(record.description),
            observed: { fonts: [], sizesPt: [] },
            tolerances: { sizePt: 0.5, colorDeltaE: 3, lineSpacing: 0.05 },
            enforcement: { declared: 'strict', observed: 'advisory', exemptRatioWarn: 0.15 },
            error: '模板文件不存在：' + record.file,
        };
        writeContract(missing);
        return missing;
    }
    const sourceHash = sourceHashOf(record.file);
    const cached = readContract(record.id);
    if (cached !== null && cached.status === 'parsed' && cached.sourceHash === sourceHash)
        return cached;
    let spec;
    try {
        spec = await (deps.runSpec ?? defaultRunSpec)(record.file);
    }
    catch (error) {
        const failed = {
            schemaVersion: 1,
            templateId: record.id,
            sourceHash,
            parsedAt: new Date().toISOString(),
            status: 'missing',
            levels: [],
            constraints: constraintsFrom(record.description),
            observed: { fonts: [], sizesPt: [] },
            tolerances: { sizePt: 0.5, colorDeltaE: 3, lineSpacing: 0.05 },
            enforcement: { declared: 'strict', observed: 'advisory', exemptRatioWarn: 0.15 },
            error: String(error?.message ?? error),
        };
        writeContract(failed);
        return failed;
    }
    const contract = normalizeSpec({
        templateId: record.id,
        sourceHash,
        spec,
        description: record.description,
    });
    writeContract(contract);
    return contract;
}
