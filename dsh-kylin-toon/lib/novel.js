/**
 * 小说工作台：从零创建 → 世界观/人物/大纲/正文/追踪 的文件级投影。
 *
 * 口径：
 * - Markdown 是权威，JSON 只是投影；不引入数据库；
 * - 一个工作区一套小说文件，目录/分卷由文件内容表达；
 * - 初始化只补缺失文件，绝不覆盖已有正文；
 * - 阶段判断只看可核对的事实（字段、条目、章节、字数），不评价文笔。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const NOVEL_FILES = {
  premise: '灵感.md',
  architecture: '故事架构.md',
  world: '设定.md',
  characters: '人物.md',
  outline: '大纲.md',
  body: '正文.md',
  tracking: '追踪.md'
};

export const OUTLINE_ALIASES = ['大纲.md', '小节大纲.md'];
export const WORLD_CATEGORIES = [
  { id: 'rule', label: '世界规则', hint: '这个世界什么能做、什么不能做' },
  { id: 'geography', label: '地理', hint: '地图、气候、交通与边界' },
  { id: 'power', label: '势力', hint: '组织、阵营、利益与冲突' },
  { id: 'system', label: '能力体系', hint: '修炼/异能/科技等级与代价' },
  { id: 'era', label: '时代与文化', hint: '技术、货币、礼俗、语言' },
  { id: 'taboo', label: '禁忌', hint: '不能碰的底线与后果' }
];

function readText(cwd, name) {
  const file = join(cwd, name);
  if (!existsSync(file)) return undefined;
  try { return readFileSync(file, 'utf8'); } catch { return undefined; }
}

/** 读字段：支持「- 标题：值」「**标题**：值」「标题: 值」。 */
export function fieldOf(markdown, label) {
  if (typeof markdown !== 'string') return '';
  const escaped = label.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('^[ \\t]*(?:[-*+]\\s*)?(?:\\*\\*)?' + escaped + '(?:\\*\\*)?[ \\t]*[:：][ \\t]*(.*)$', 'm');
  const match = pattern.exec(markdown);
  return match === null ? '' : match[1].trim();
}

/** 取某个二级标题下的正文，直到下一个同级或更高级标题。 */
export function sectionOf(markdown, title) {
  if (typeof markdown !== 'string') return '';
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp('^##\\s+' + title.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&') + '\\s*$').test(line));
  if (start < 0) return '';
  const out = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#{1,2}\s+/.test(lines[index])) break;
    out.push(lines[index]);
  }
  return out.join('\n').trim();
}

function bullets(text) {
  return String(text ?? '').split(/\r?\n/).map((line) => line.replace(/^[-*+]\s*/, '').trim()).filter((line) => line !== '' && !line.startsWith('<!--') && !line.startsWith('#'));
}

function countChars(text) {
  return String(text ?? '').replace(/\s/g, '').length;
}

export function parseWorld(markdown) {
  const categories = [];
  for (const category of WORLD_CATEGORIES) {
    const content = sectionOf(markdown, category.label);
    const entries = bullets(content).filter((line) => !line.startsWith('###'));
    categories.push({ ...category, entries: entries.length, lines: entries, empty: entries.length === 0 });
  }
  return { categories, totalEntries: categories.reduce((sum, item) => sum + item.entries, 0) };
}

export function parseCharacters(markdown) {
  const cards = [];
  if (typeof markdown !== 'string') return cards;
  const lines = markdown.split(/\r?\n/);
  let current;
  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading !== null && !/^#/.test(line.replace(/^##/, ''))) {
      if (current !== undefined) cards.push(current);
      current = { name: heading[1].trim(), fields: {} };
      continue;
    }
    if (current === undefined) continue;
    const field = /^[-*+]\s*(?:\*\*)?([^:：*]+)(?:\*\*)?[:：]\s*(.*)$/.exec(line);
    if (field !== null) current.fields[field[1].trim()] = field[2].trim();
  }
  if (current !== undefined) cards.push(current);
  return cards.filter((card) => card.name !== '');
}

export function parseOutline(markdown) {
  const volumes = [];
  let volume;
  let chapter;
  for (const line of (markdown ?? '').split(/\r?\n/)) {
    const volumeMatch = /^##\s+(第[一二三四五六七八九十百零0-9]+卷|卷[一二三四五六七八九十0-9]+)\s*(.*)$/.exec(line);
    if (volumeMatch !== null) {
      if (chapter !== undefined && volume !== undefined) volume.chapters.push(chapter);
      if (volume !== undefined) volumes.push(volume);
      volume = { title: line.replace(/^##\s+/, '').trim(), chapters: [] };
      chapter = undefined;
      continue;
    }
    const chapterMatch = /^###\s+(第[一二三四五六七八九十百零0-9]+章)\s*(.*)$/.exec(line);
    if (chapterMatch !== null) {
      if (chapter !== undefined && volume !== undefined) volume.chapters.push(chapter);
      if (volume === undefined) { volume = { title: '未分卷', chapters: [] }; volumes.push(volume); }
      chapter = { title: line.replace(/^###\s+/, '').trim(), goal: '', hook: '' };
      continue;
    }
    if (chapter !== undefined) {
      const field = /^[-*+]\s*(目标|钩子|冲突|状态)[:：]\s*(.*)$/.exec(line);
      if (field !== null) {
        if (field[1] === '目标') chapter.goal = field[2].trim();
        if (field[1] === '钩子') chapter.hook = field[2].trim();
      }
    }
  }
  if (chapter !== undefined && volume !== undefined) volume.chapters.push(chapter);
  if (volume !== undefined) volumes.push(volume);
  return volumes;
}

export function parseBodyChapters(markdown) {
  const chapters = [];
  let current;
  for (const line of (markdown ?? '').split(/\r?\n/)) {
    const match = /^##\s+(第[一二三四五六七八九十百零0-9]+章.*)$/.exec(line);
    if (match !== null) {
      if (current !== undefined) chapters.push(current);
      current = { title: match[1].trim(), chars: 0 };
      continue;
    }
    if (current !== undefined) current.chars += countChars(line);
  }
  if (current !== undefined) chapters.push(current);
  return chapters;
}

function stage(id, label, status, detail, file) {
  return { id, label, status, detail, file };
}

export function novelProjection(cwd) {
  cwd = activeNovelRoot(cwd);
  const files = {};
  for (const [key, name] of Object.entries(NOVEL_FILES)) files[key] = readText(cwd, name);
  const outlineFile = OUTLINE_ALIASES.find((name) => existsSync(join(cwd, name))) ?? NOVEL_FILES.outline;
  const outline = readText(cwd, outlineFile);
  const present = (key) => files[key] !== undefined;
  const premise = files.premise ?? '';
  const architecture = files.architecture ?? '';
  const world = parseWorld(files.world ?? '');
  const characters = parseCharacters(files.characters ?? '');
  const volumes = parseOutline(outline ?? '');
  const chapters = volumes.reduce((sum, item) => sum + item.chapters.length, 0);
  const bodyChapters = parseBodyChapters(files.body ?? '');
  const bodyChars = bodyChapters.reduce((sum, item) => sum + item.chars, 0);
  const tracking = files.tracking ?? '';

  const stages = [];
  const logline = fieldOf(premise, '一句话故事');
  const genre = fieldOf(premise, '题材');
  const platform = fieldOf(premise, '平台');
  stages.push(stage('premise', '灵感与前提', present('premise') && logline !== '' && genre !== '' ? 'done' : present('premise') ? 'partial' : 'missing', present('premise') ? (logline === '' ? '缺一句话故事' : genre === '' ? '缺题材' : '已立项') : '还没有 灵感.md', NOVEL_FILES.premise));

  const archFields = ['主线冲突', '主角目标', '对手', '代价', '中点转折', '高潮', '结局'];
  const archFilled = archFields.filter((label) => fieldOf(architecture, label) !== '').length;
  stages.push(stage('architecture', '故事架构', present('architecture') && archFilled >= 5 ? 'done' : present('architecture') ? 'partial' : 'missing', present('architecture') ? archFilled + '/' + archFields.length + ' 个骨架字段' : '还没有 故事架构.md', NOVEL_FILES.architecture));

  const worldDone = world.categories.filter((item) => !item.empty).length;
  stages.push(stage('world', '世界观', present('world') && worldDone >= 4 && world.totalEntries >= 6 ? 'done' : present('world') ? 'partial' : 'missing', present('world') ? worldDone + '/6 类目有内容，共 ' + world.totalEntries + ' 条' : '还没有 设定.md', NOVEL_FILES.world));

  const coreChars = characters.filter((card) => (card.fields['欲望'] ?? card.fields['目标'] ?? '') !== '');
  stages.push(stage('characters', '人物', present('characters') && coreChars.length >= 1 ? 'done' : present('characters') ? 'partial' : 'missing', present('characters') ? characters.length + ' 张人物卡，' + coreChars.length + ' 张有欲望/目标' : '还没有 人物.md', NOVEL_FILES.characters));

  const hooked = volumes.reduce((sum, volume) => sum + volume.chapters.filter((chapter) => chapter.goal !== '').length, 0);
  stages.push(stage('outline', '大纲', present('outline') && chapters >= 3 && hooked >= 3 ? 'done' : present('outline') ? 'partial' : 'missing', present('outline') ? volumes.length + ' 卷 / ' + chapters + ' 章，' + hooked + ' 章有目标' : '还没有 大纲.md', outlineFile));

  stages.push(stage('body', '正文', bodyChars >= 1000 ? 'done' : present('body') && bodyChars > 0 ? 'partial' : 'missing', present('body') ? bodyChapters.length + ' 章 / ' + bodyChars + ' 字' : '还没有 正文.md', NOVEL_FILES.body));

  stages.push(stage('tracking', '追踪', present('tracking') && bullets(tracking).length >= 2 ? 'done' : present('tracking') ? 'partial' : 'missing', present('tracking') ? bullets(tracking).length + ' 条连续性记录' : '还没有 追踪.md', NOVEL_FILES.tracking));

  const diagnostics = [];
  if (!present('premise')) diagnostics.push({ code: 'premise-missing', message: '缺 灵感.md：先定题材、平台、篇幅与一句话故事' });
  else if (logline === '') diagnostics.push({ code: 'logline-missing', message: '一句话故事还没填' });
  if (present('world')) {
    for (const category of world.categories) {
      if (category.empty) diagnostics.push({ code: 'world-empty', message: '世界观缺「' + category.label + '」' });
    }
  } else diagnostics.push({ code: 'world-missing', message: '缺 设定.md：至少写世界规则、地理、势力、能力体系' });
  if (characters.length === 0 && present('characters')) diagnostics.push({ code: 'character-empty', message: '人物.md 还没有人物卡' });
  const missingGoal = characters.filter((card) => (card.fields['欲望'] ?? card.fields['目标'] ?? '') === '');
  if (missingGoal.length > 0) diagnostics.push({ code: 'character-goal-missing', message: '这些人物卡缺欲望/目标：' + missingGoal.slice(0, 5).map((card) => card.name).join('、') });
  if (chapters === 0 && present('outline')) diagnostics.push({ code: 'outline-empty', message: '大纲还没有章节' });
  if (chapters > 0) {
    const noHook = volumes.flatMap((volume) => volume.chapters).filter((chapter) => chapter.hook === '');
    if (noHook.length === chapters) diagnostics.push({ code: 'outline-hook-missing', message: '所有章节都还没写钩子' });
  }
  if (bodyChapters.length > 0 && chapters > 0 && bodyChapters.length < chapters) diagnostics.push({ code: 'body-ahead-of-outline', message: '正文 ' + bodyChapters.length + ' 章，大纲 ' + chapters + ' 章（正常）' });
  if (bodyChars === 0 && chapters > 0) diagnostics.push({ code: 'body-not-started', message: '大纲已有 ' + chapters + ' 章，正文还没开始' });

  const next = stages.find((item) => item.status !== 'done') ?? undefined;
  return {
    cwd,
    files: Object.fromEntries(Object.entries(NOVEL_FILES).map(([key, name]) => [key, { name, present: present(key), chars: countChars(files[key] ?? '') }])),
    outlineFile,
    stages,
    nextStage: next === undefined ? undefined : { id: next.id, label: next.label, file: next.file },
    diagnostics,
    chapters: scanChapters(cwd),
    counts: { volumes: volumes.length, chapters, bodyChapters: bodyChapters.length, bodyChars, characters: characters.length, worldEntries: world.totalEntries, chapterDirs: scanChapters(cwd).length, finalChapters: scanChapters(cwd).filter((chapter) => chapter.status === 'final').length },
    world,
    characters: characters.map((card) => ({ name: card.name, fields: card.fields })),
    volumes
  };
}

export const CHAPTER_DIRECTORY = '章节';
export const CHAPTER_PARTS = [
  { id: 'blueprint', label: '蓝图', file: '蓝图.md' },
  { id: 'draft', label: '草稿', file: '草稿.md' },
  { id: 'review', label: '审稿', file: '审稿.md' },
  { id: 'final', label: '定稿', file: '定稿.md' }
];

const CN_DIGITS = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

/** 章节号：支持 1 / 第1章 / 第一章 / 第十二章。 */
export function chapterNumberFromText(text) {
  if (typeof text !== 'string') return undefined;
  const arabic = /(?:第)?\s*(\d{1,4})\s*章?/.exec(text);
  if (arabic !== null) {
    const value = Number(arabic[1]);
    return Number.isInteger(value) && value > 0 ? value : undefined;
  }
  const chinese = /第?([零一二两三四五六七八九十百]+)章/.exec(text);
  if (chinese === null) return undefined;
  const raw = chinese[1];
  if (raw === '十') return 10;
  if (raw.includes('百')) {
    const [before, after] = raw.split('百');
    const hundreds = (CN_DIGITS[before] ?? 1) * 100;
    const rest = after === undefined || after === '' ? 0 : chapterNumberFromText('第' + after + '章');
    return hundreds + (rest ?? 0);
  }
  if (raw.includes('十')) {
    const [before, after] = raw.split('十');
    const tens = (CN_DIGITS[before] ?? 1) * 10;
    const ones = after === undefined || after === '' ? 0 : (CN_DIGITS[after] ?? 0);
    return tens + ones;
  }
  const value = CN_DIGITS[raw];
  return value === undefined ? undefined : value;
}

function chapterDirName(number) {
  return '第' + String(number).padStart(4, '0') + '章';
}

function readPart(cwd, number, part) {
  return readText(cwd, join(CHAPTER_DIRECTORY, chapterDirName(number), part.file));
}

export function scanChapters(cwd) {
  cwd = activeNovelRoot(cwd);
  const root = join(cwd, CHAPTER_DIRECTORY);
  if (!existsSync(root)) return [];
  const chapters = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const match = /(?:第)?(\d{1,4})(?:章)?/.exec(entry.name);
    if (match === null) continue;
    const number = Number(match[1]);
    if (!Number.isInteger(number) || number <= 0) continue;
    const dir = join(root, entry.name);
    const parts = {};
    for (const part of CHAPTER_PARTS) {
      const file = join(dir, part.file);
      if (existsSync(file)) {
        let content = '';
        try { content = readFileSync(file, 'utf8'); } catch { content = ''; }
        parts[part.id] = { present: true, chars: countChars(content), file: join(CHAPTER_DIRECTORY, entry.name, part.file) };
      } else {
        parts[part.id] = { present: false, chars: 0, file: join(CHAPTER_DIRECTORY, entry.name, part.file) };
      }
    }
    const blueprint = readPart(cwd, number, CHAPTER_PARTS[0]);
    const titleLine = (blueprint ?? '').split(/\r?\n/).find((line) => line.startsWith('# ')) ?? '';
    const status = parts.final.present ? 'final' : parts.review.present ? 'review' : parts.draft.present ? 'draft' : parts.blueprint.present ? 'blueprint' : 'empty';
    chapters.push({
      number,
      dir: join(CHAPTER_DIRECTORY, entry.name),
      title: titleLine.replace(/^#\s+/, '').trim() || ('第' + String(number) + '章'),
      status,
      parts
    });
  }
  return chapters.sort((a, b) => a.number - b.number);
}

function outlineChapterAt(volumes, number) {
  for (const volume of volumes) {
    for (const chapter of volume.chapters) {
      if (chapterNumberFromText(chapter.title) === number) return chapter;
    }
  }
  return undefined;
}

export function createChapter(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const projection = novelProjection(cwd);
  const chapters = scanChapters(cwd);
  const nextNumber = chapters.reduce((max, chapter) => Math.max(max, chapter.number), 0) + 1;
  const requested = Number(input.number);
  const chapterNumber = Number.isInteger(requested) && requested > 0 ? requested : nextNumber;
  const outline = parseOutline(readText(cwd, projection.outlineFile) ?? '');
  const source = outlineChapterAt(outline, chapterNumber);
  const dir = join(cwd, CHAPTER_DIRECTORY, chapterDirName(chapterNumber));
  if (existsSync(dir)) {
    return { created: false, chapter: chapters.find((chapter) => chapter.number === chapterNumber), message: '章节已存在：' + CHAPTER_DIRECTORY + '/' + chapterDirName(chapterNumber) };
  }
  mkdirSync(dir, { recursive: true });
  const title = source?.title ?? ('第' + String(chapterNumber) + '章');
  const blueprint = [
    '# ' + title,
    '',
    '- 目标：' + (source?.goal ?? ''),
    '- 冲突：' + (source?.conflict ?? ''),
    '- 钩子：' + (source?.hook ?? ''),
    '- 出场人物：',
    '- 引用设定：',
    '- 连续性：',
    '',
    '## 本章备注',
    '',
    '- ',
    ''
  ].join('\n');
  writeFileSync(join(dir, CHAPTER_PARTS[0].file), blueprint, 'utf8');
  return { created: true, chapter: scanChapters(cwd).find((chapter) => chapter.number === chapterNumber) ?? { number: chapterNumber, title, status: 'blueprint' } };
}

/** 本章上下文：只装这一章需要的东西，不把全书塞进来。 */
export function chapterContext(cwd, numberInput) {
  cwd = activeNovelRoot(cwd);
  const chapters = scanChapters(cwd);
  const number = Number(numberInput);
  const target = Number.isInteger(number) && number > 0 ? chapters.find((chapter) => chapter.number === number) : chapters[0];
  if (target === undefined) throw new Error('章节不存在');
  const blueprint = readPart(cwd, target.number, CHAPTER_PARTS[0]) ?? '';
  const goal = fieldOf(blueprint, '目标');
  const conflict = fieldOf(blueprint, '冲突');
  const hook = fieldOf(blueprint, '钩子');
  const cast = fieldOf(blueprint, '出场人物').split(/[、,，;；]/).map((name) => name.trim()).filter((name) => name !== '');
  const quote = fieldOf(blueprint, '引用设定');

  const characterMarkdown = readText(cwd, NOVEL_FILES.characters) ?? '';
  const characters = parseCharacters(characterMarkdown)
    .filter((card) => cast.length === 0 || cast.includes(card.name) || cast.includes(card.name.replace(/（.*?）/g, '')))
    .slice(0, 8)
    .map((card) => ({ name: card.name, fields: card.fields }));

  const worldMarkdown = readText(cwd, NOVEL_FILES.world) ?? '';
  const world = parseWorld(worldMarkdown);
  const wanted = quote === '' ? [] : WORLD_CATEGORIES.filter((category) => quote.includes(category.label)).map((category) => category.id);
  const worldEntries = world.categories
    .filter((category) => wanted.length === 0 || wanted.includes(category.id))
    .map((category) => ({
      label: category.label,
      lines: bullets(sectionOf(worldMarkdown, category.label)).slice(0, 6).map((line) => line.slice(0, 300))
    }))
    .filter((category) => category.lines.length > 0);

  let previousTail = '';
  const before = chapters.filter((chapter) => chapter.number < target.number).sort((a, b) => b.number - a.number);
  for (const chapter of before) {
    const text = readPart(cwd, chapter.number, CHAPTER_PARTS[3]) ?? readPart(cwd, chapter.number, CHAPTER_PARTS[1]);
    if (text !== undefined && text.trim() !== '') {
      previousTail = text.trim().slice(-800);
      break;
    }
  }

  const tracking = bullets(readText(cwd, NOVEL_FILES.tracking) ?? '').slice(0, 12);
  const lines = [
    '# 本章创作上下文：' + target.title,
    '',
    '## 本章蓝图',
    '- 目标：' + (goal || '（未填）'),
    '- 冲突：' + (conflict || '（未填）'),
    '- 钩子：' + (hook || '（未填）'),
    '- 出场人物：' + (cast.length === 0 ? '（未填）' : cast.join('、')),
    '- 引用设定：' + (quote || '（未指定）'),
    '',
    '## 出场人物摘要',
    ...(characters.length === 0 ? ['- （没有匹配到人物卡）'] : characters.map((card) => '- ' + card.name + '：' + Object.entries(card.fields).slice(0, 5).map(([key, value]) => key + '=' + value).join('；'))),
    '',
    '## 相关世界观',
    ...(worldEntries.length === 0 ? ['- （没有设定条目）'] : worldEntries.flatMap((category) => ['### ' + category.label, ...category.lines.map((line) => '- ' + line)])),
    '',
    '## 上一章结尾',
    previousTail === '' ? '（这是第一章，或上一章还没有正文）' : previousTail,
    '',
    '## 连续性事实',
    ...(tracking.length === 0 ? ['- （追踪为空）'] : tracking.map((line) => '- ' + line)),
    ''
  ];
  const text = lines.join('\n');
  return {
    number: target.number,
    title: target.title,
    status: target.status,
    blueprint: { goal, conflict, hook, cast, quote },
    characters,
    world: worldEntries,
    previousTail,
    tracking,
    text,
    chars: countChars(text)
  };
}

const PLACEHOLDER = '（待填）';

function premiseTemplate(input) {
  return [
    '# 灵感与前提',
    '',
    '- 书名：' + (input.title ?? PLACEHOLDER),
    '- 题材：' + (input.genre ?? PLACEHOLDER),
    '- 平台：' + (input.platform ?? PLACEHOLDER),
    '- 篇幅：' + (input.length ?? '长篇（预计 100–150 章，每章 2500–3500 字）'),
    '- 读者：' + (input.audience ?? PLACEHOLDER),
    '- 基调：' + (input.tone ?? PLACEHOLDER),
    '- 一句话故事：' + (input.logline ?? PLACEHOLDER),
    '- 核心卖点：' + PLACEHOLDER,
    '- 主角：' + (input.protagonist ?? PLACEHOLDER),
    '',
    '## 开篇钩子',
    '',
    '- ' + PLACEHOLDER,
    ''
  ].join('\n');
}

function architectureTemplate() {
  return [
    '# 故事架构',
    '',
    '- 主线冲突：',
    '- 主角目标：',
    '- 对手：',
    '- 代价：',
    '- 起点：',
    '- 中点转折：',
    '- 高潮：',
    '- 结局：',
    '- 主题：',
    '- 主线：',
    '',
    '## 支线',
    '',
    '- ',
    '',
    '## 伏笔',
    '',
    '- ',
    ''
  ].join('\n');
}

function worldTemplate() {
  const lines = ['# 设定', ''];
  for (const category of WORLD_CATEGORIES) {
    lines.push('## ' + category.label, '', '<!-- ' + category.hint + ' -->', '', '- ', '');
  }
  return lines.join('\n');
}

function characterTemplate(name) {
  return [
    '# 人物',
    '',
    '## ' + (name ?? '主角'),
    '',
    '- 身份：',
    '- 欲望：',
    '- 目标：',
    '- 创伤：',
    '- 弧光：',
    '- 关系：',
    '- 口吻：',
    '- 首次出场：第1章',
    ''
  ].join('\n');
}

function outlineTemplate() {
  return [
    '# 大纲',
    '',
    '## 第一卷',
    '',
    '### 第1章',
    '',
    '- 目标：',
    '- 钩子：',
    '- 冲突：',
    '',
    '### 第2章',
    '',
    '- 目标：',
    '- 钩子：',
    ''
  ].join('\n');
}

function bodyTemplate() {
  return ['# 正文', '', '<!-- 每章用「## 第N章 标题」开头；正文从这里往下写。 -->', ''].join('\n');
}

function trackingTemplate() {
  return [
    '# 追踪',
    '',
    '## 未回收伏笔',
    '',
    '- ',
    '',
    '## 人物状态',
    '',
    '- ',
    '',
    '## 时间线',
    '',
    '- ',
    ''
  ].join('\n');
}

/** 初始化小说结构：只写缺失文件，不覆盖已有内容。 */
export function initNovel(cwd, input = {}) {
  if (typeof input.project === 'string' && input.project.trim() !== '' && input.project.trim() !== '.') {
    const root = novelProjectRoot(cwd, input.project);
    mkdirSync(root, { recursive: true });
    setActiveNovel(cwd, input.project);
    cwd = root;
  } else {
    cwd = activeNovelRoot(cwd);
  }
  const created = [];
  const skipped = [];
  const files = [
    [NOVEL_FILES.premise, premiseTemplate(input)],
    [NOVEL_FILES.architecture, architectureTemplate()],
    [NOVEL_FILES.world, worldTemplate()],
    [NOVEL_FILES.characters, characterTemplate(input.protagonist)],
    [NOVEL_FILES.outline, outlineTemplate()],
    [NOVEL_FILES.body, bodyTemplate()],
    [NOVEL_FILES.tracking, trackingTemplate()]
  ];
  for (const [name, content] of files) {
    const file = join(cwd, name);
    if (existsSync(file)) { skipped.push(name); continue; }
    writeFileSync(file, content, 'utf8');
    created.push(name);
  }
  return { created, skipped, projection: novelProjection(cwd) };
}

export function describeNovel(projection) {
  if (projection === undefined) return '还没有小说项目';
  const lines = ['# 小说工作台', ''];
  for (const item of projection.stages) {
    const mark = item.status === 'done' ? '✓' : item.status === 'partial' ? '·' : '✗';
    lines.push(mark + ' ' + item.label + '：' + item.detail + '（' + item.file + '）');
  }
  lines.push('', '下一阶段：' + (projection.nextStage === undefined ? '全部完成' : projection.nextStage.label));
  if (projection.diagnostics.length > 0) {
    lines.push('', '待处理：');
    for (const item of projection.diagnostics) lines.push('- ' + item.message);
  }
  return lines.join('\n');
}

/** 发布资料：只汇总已有事实，缺的字段留空，不编造。 */
export function buildPublish(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const projection = novelProjection(cwd);
  const premise = readText(cwd, NOVEL_FILES.premise) ?? '';
  const title = String(input.title ?? fieldOf(premise, '书名') ?? '').trim();
  const author = String(input.author ?? fieldOf(premise, '笔名') ?? '').trim();
  const platform = String(input.platform ?? fieldOf(premise, '平台') ?? '').trim();
  const genre = String(input.genre ?? fieldOf(premise, '题材') ?? '').trim();
  const audience = String(input.audience ?? fieldOf(premise, '读者') ?? '').trim();
  const tone = String(input.tone ?? fieldOf(premise, '基调') ?? '').trim();
  const logline = String(input.logline ?? fieldOf(premise, '一句话故事') ?? '').trim();
  const intro = String(input.intro ?? fieldOf(premise, '简介') ?? '').trim();
  const status = String(input.status ?? fieldOf(premise, '状态') ?? '连载中').trim();
  const rawTags = input.tags ?? fieldOf(premise, '标签');
  const tags = (Array.isArray(rawTags) ? rawTags : String(rawTags ?? '').split(/[、,，;；]/)).map((tag) => String(tag).trim()).filter((tag) => tag !== '');
  const missing = [];
  if (title === '') missing.push('书名');
  if (author === '') missing.push('笔名');
  if (genre === '') missing.push('分类');
  if (intro === '') missing.push('简介');
  if (tags.length === 0) missing.push('标签');
  const lines = [
    '# 发布资料',
    '',
    '- 书名：' + (title || '（待填）'),
    '- 笔名：' + (author || '（待填）'),
    '- 平台：' + (platform || '（待填）'),
    '- 分类：' + (genre || '（待填）'),
    '- 标签：' + (tags.length === 0 ? '（待填）' : tags.join('、')),
    '- 目标读者：' + (audience || '（待填）'),
    '- 基调：' + (tone || '（待填）'),
    '- 状态：' + status,
    '- 一句话故事：' + (logline || '（待填）'),
    '- 正文：' + String(projection.counts.bodyChars ?? 0) + ' 字 / ' + String(projection.counts.chapters ?? 0) + ' 章大纲 / ' + String(projection.counts.finalChapters ?? 0) + ' 章定稿',
    '',
    '## 简介',
    '',
    intro || '（待填：按平台要求控制在 100–300 字，先给冲突与钩子，不剧透结局）',
    '',
    '## 平台检查',
    '',
    '- 书名与分类是否符合平台命名习惯',
    '- 简介字数是否在平台上限内',
    '- 标签是否覆盖题材、主角关系、核心卖点',
    '- 前 3 章是否已定稿（黄金三章）',
    ''
  ];
  const file = join(cwd, '发布资料.md');
  writeFileSync(file, lines.join('\n'), 'utf8');
  return { path: '发布资料.md', missing, counts: projection.counts, title, tags };
}

/** 小说 → 短剧/漫剧/游戏/解说的改编交接：只给计划与映射，不伪造剧本。 */
export function buildAdaptation(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const projection = novelProjection(cwd);
  const target = ['短剧', '漫剧', '互动游戏', '视频解说'].includes(input.target) ? input.target : '短剧';
  const chapters = scanChapters(cwd);
  const usable = chapters.filter((chapter) => chapter.parts.final.present || chapter.parts.draft.present);
  const outlineChapters = projection.volumes.flatMap((volume) => volume.chapters.map((chapter) => ({ title: chapter.title, goal: chapter.goal, hook: chapter.hook })));
  const source = usable.length > 0
    ? usable.map((chapter) => ({ label: '第' + String(chapter.number) + '章 ' + chapter.title, chars: (chapter.parts.final.chars || chapter.parts.draft.chars || 0) }))
    : outlineChapters.map((chapter) => ({ label: chapter.title, chars: 0 }));
  if (source.length === 0) throw new Error('还没有可改编的章节或大纲：先写大纲或正文');
  const requested = Number(input.episodes);
  const episodes = Number.isInteger(requested) && requested > 0 ? Math.min(100, requested) : Math.max(3, Math.ceil(source.length / 4));
  const characters = parseCharacters(readText(cwd, NOVEL_FILES.characters) ?? '').map((card) => card.name).slice(0, 20);
  const world = parseWorld(readText(cwd, NOVEL_FILES.world) ?? '').categories.filter((category) => !category.empty).map((category) => category.label);
  const per = Math.ceil(source.length / episodes);
  const mapping = [];
  for (let index = 0; index < episodes; index += 1) {
    const slice = source.slice(index * per, (index + 1) * per);
    if (slice.length === 0) break;
    mapping.push({ episode: index + 1, chapters: slice.map((item) => item.label), chars: slice.reduce((sum, item) => sum + item.chars, 0) });
  }
  const lines = [
    '# 改编计划：' + (fieldOf(readText(cwd, NOVEL_FILES.premise) ?? '', '书名') || '未命名小说') + ' → ' + target,
    '',
    '- 来源：' + String(source.length) + ' 个章节/条目，正文 ' + String(projection.counts.bodyChars ?? 0) + ' 字',
    '- 目标形态：' + target,
    '- 计划集数：' + String(mapping.length),
    '',
    '## 保留',
    '',
    '- 人物：' + (characters.length === 0 ? '（人物卡为空，先补主要角色）' : characters.join('、')),
    '- 世界观：' + (world.length === 0 ? '（设定为空）' : world.join('、')),
    '',
    '## 章节 → 集数映射',
    '',
    '| 集 | 来源章节 | 正文量 |',
    '| --- | --- | --- |',
    ...mapping.map((item) => '| 第' + String(item.episode) + '集 | ' + item.chapters.join('、') + ' | ' + String(item.chars) + ' 字 |'),
    '',
    '## 下一步',
    '',
    '- 在 剧集/EP001/ 写 剧本.md、视觉设定.md、分镜.md（短剧线）或做玩法灰盒（游戏线）',
    '- 每集只取对应章节的冲突与钩子，不逐字搬运旁白',
    '- 改编不改变原著人物欲望与核心冲突；需要改剧情时回到小说大纲',
    ''
  ];
  const file = join(cwd, '改编计划.md');
  writeFileSync(file, lines.join('\n'), 'utf8');
  return { path: '改编计划.md', target, episodes: mapping.length, chapters: source.length, characters: characters.length, world: world.length };
}

export const REVIEW_MARKER = '<!-- kylin-toon:review generated -->';

const CLICHES = ['不禁', '仿佛', '缓缓', '淡淡', '微微', '嘴角', '瞳孔', '深吸一口气', '心中一惊', '与此同时', '然而', '似乎', '彷佛'];

function reviewFinding(rule, severity, message, evidence) {
  return { rule, severity, message, ...(evidence === undefined ? {} : { evidence }) };
}

function longestCommonLength(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  if (left === '' || right === '') return 0;
  let previous = new Array(right.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= left.length; i += 1) {
    const current = new Array(right.length + 1).fill(0);
    for (let j = 1; j <= right.length; j += 1) {
      if (left[i - 1] === right[j - 1]) {
        current[j] = previous[j - 1] + 1;
        if (current[j] > best) best = current[j];
      }
    }
    previous = current;
  }
  return best;
}

function keywordHits(text, phrase) {
  const raw = String(phrase ?? '').trim();
  if (raw === '') return [];
  const tokens = raw.split(/[、,，。；;：:\s（）()《》「」“”"'—…]+/).map((token) => token.trim()).filter((token) => token.length >= 2);
  const hits = tokens.filter((token) => text.includes(token));
  if (hits.length > 0) return hits;
  const threshold = raw.length <= 4 ? 2 : 3;
  if (longestCommonLength(text, raw) >= threshold) return ['≈' + raw];
  return [];
}

function wordTargetOf(premise, options) {
  if (Number.isFinite(Number(options.minWords)) && Number.isFinite(Number(options.maxWords))) {
    return { min: Math.max(100, Number(options.minWords)), max: Math.max(Number(options.minWords) + 100, Number(options.maxWords)) };
  }
  const match = /每章\s*(\d{2,6})\s*[-–—~至到]\s*(\d{2,6})\s*字/.exec(premise ?? '');
  if (match !== null) {
    const min = Number(match[1]);
    const max = Number(match[2]);
    if (min > 0 && max > min) return { min, max };
  }
  return { min: 2000, max: 4000 };
}

function dialogueRatio(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '');
  if (lines.length === 0) return 0;
  const withDialogue = lines.filter((line) => /[“”「」]/.test(line) || /^["'].*["']$/.test(line)).length;
  return withDialogue / lines.length;
}

/** 章节审稿：规则可解释、可复跑；只读正文与设定，写审稿.md。 */
export function reviewChapter(cwd, numberInput, options = {}) {
  cwd = activeNovelRoot(cwd);
  const chapters = scanChapters(cwd);
  const requested = Number(numberInput);
  const target = Number.isInteger(requested) && requested > 0
    ? chapters.find((chapter) => chapter.number === requested)
    : [...chapters].reverse().find((chapter) => chapter.parts.draft.present || chapter.parts.final.present);
  if (target === undefined) throw new Error('没有可审的章节：先建蓝图并写草稿');
  const blueprint = readPart(cwd, target.number, CHAPTER_PARTS[0]) ?? '';
  const draft = readPart(cwd, target.number, CHAPTER_PARTS[1]) ?? readPart(cwd, target.number, CHAPTER_PARTS[3]) ?? '';
  const premise = readText(cwd, NOVEL_FILES.premise) ?? '';
  const goal = fieldOf(blueprint, '目标');
  const conflict = fieldOf(blueprint, '冲突');
  const hook = fieldOf(blueprint, '钩子');
  const cast = fieldOf(blueprint, '出场人物').split(/[、,，;；]/).map((name) => name.trim()).filter((name) => name !== '');
  const quote = fieldOf(blueprint, '引用设定');
  const continuity = fieldOf(blueprint, '连续性');
  const findings = [];

  if (draft.trim() === '') {
    findings.push(reviewFinding('draft-empty', 'block', '这一章还没有草稿', '草稿.md 为空或不存在'));
  } else {
    const words = countChars(draft);
    const targetWords = wordTargetOf(premise, options);
    if (words < targetWords.min) findings.push(reviewFinding('word-count-low', 'warn', '字数偏少：' + String(words) + ' 字，目标 ' + String(targetWords.min) + '–' + String(targetWords.max), '正文 ' + String(words) + ' 字'));
    if (words > targetWords.max) findings.push(reviewFinding('word-count-high', 'warn', '字数偏多：' + String(words) + ' 字，目标 ' + String(targetWords.min) + '–' + String(targetWords.max), '正文 ' + String(words) + ' 字'));

    if (goal === '') findings.push(reviewFinding('blueprint-goal-empty', 'block', '蓝图没有写本章目标', '蓝图.md 目标为空'));
    else if (keywordHits(draft, goal).length === 0) findings.push(reviewFinding('blueprint-goal-missing', 'warn', '本章目标没有在草稿中落地：' + goal, '未命中目标关键词'));
    if (conflict === '') findings.push(reviewFinding('blueprint-conflict-empty', 'note', '蓝图没有写冲突：本章可能缺少对抗', '蓝图.md 冲突为空'));
    else if (keywordHits(draft, conflict).length === 0) findings.push(reviewFinding('blueprint-conflict-missing', 'note', '冲突关键词没有出现在草稿：' + conflict, '未命中冲突关键词'));
    if (hook === '') findings.push(reviewFinding('blueprint-hook-empty', 'warn', '蓝图没有写章末钩子', '蓝图.md 钩子为空'));
    else {
      const tail = draft.slice(-400);
      if (keywordHits(tail, hook).length === 0) findings.push(reviewFinding('hook-not-at-tail', 'warn', '钩子没有落在章末 400 字内：' + hook, '章末未命中钩子关键词'));
    }

    for (const name of cast) {
      if (!draft.includes(name)) findings.push(reviewFinding('cast-missing', 'warn', '出场人物未在草稿出现：' + name, '蓝图出场人物：' + name));
    }
    if (cast.length > 0) {
      const known = new Set(parseCharacters(readText(cwd, NOVEL_FILES.characters) ?? '').map((card) => card.name));
      for (const name of cast) if (!known.has(name)) findings.push(reviewFinding('cast-unknown', 'note', '出场人物没有人物卡：' + name, '人物.md 中找不到'));
    }
    if (quote !== '') {
      const world = parseWorld(readText(cwd, NOVEL_FILES.world) ?? '');
      const labels = world.categories.filter((category) => quote.includes(category.label));
      if (labels.length === 0) findings.push(reviewFinding('setting-ref-unknown', 'note', '引用设定没有匹配到世界观类目：' + quote, '设定.md 六类：' + world.categories.map((item) => item.label).join('、')));
      else {
        for (const category of labels) if (category.empty) findings.push(reviewFinding('setting-ref-empty', 'warn', '引用的世界观类目还是空的：' + category.label, '设定.md · ' + category.label));
      }
    }
    if (continuity === '') findings.push(reviewFinding('continuity-empty', 'note', '蓝图没有写连续性事实：跨章状态可能漏掉', '蓝图.md 连续性为空'));

    const paragraphs = draft.split(/\r?\n\s*\r?\n/).map((line) => line.trim()).filter((line) => line !== '');
    const longest = paragraphs.reduce((max, paragraph) => Math.max(max, countChars(paragraph)), 0);
    if (longest > 800) findings.push(reviewFinding('paragraph-too-long', 'note', '有段落超过 800 字：' + String(longest) + ' 字', '检查信息密度与换气点'));
    const ratio = dialogueRatio(draft);
    if (ratio < 0.05) findings.push(reviewFinding('dialogue-too-low', 'note', '对白占比过低（' + String(Math.round(ratio * 100)) + '%）：可能是纯叙述', '对白行占比'));
    if (ratio > 0.8) findings.push(reviewFinding('dialogue-too-high', 'note', '对白占比过高（' + String(Math.round(ratio * 100)) + '%）：动作与环境可能不足', '对白行占比'));

    const clicheCounts = CLICHES.map((word) => ({ word, count: (draft.match(new RegExp(word, 'g')) ?? []).length })).filter((item) => item.count > 0);
    const totalCliche = clicheCounts.reduce((sum, item) => sum + item.count, 0);
    if (totalCliche >= 8) findings.push(reviewFinding('cliche-density', 'note', '套话密度偏高：' + String(totalCliche) + ' 处', clicheCounts.slice(0, 5).map((item) => item.word + '×' + String(item.count)).join('、')));

    const duplicate = paragraphs.find((paragraph, index) => paragraph.length > 20 && paragraphs.indexOf(paragraph) !== index);
    if (duplicate !== undefined) findings.push(reviewFinding('duplicate-paragraph', 'warn', '出现重复段落', duplicate.slice(0, 40)));
  }

  const blocks = findings.filter((item) => item.severity === 'block');
  const warns = findings.filter((item) => item.severity === 'warn');
  const notes = findings.filter((item) => item.severity === 'note');
  const verdict = blocks.length > 0 ? '需修改（有阻断）' : warns.length > 0 ? '可复审（有提醒）' : '可进入定稿';
  const markdown = [
    REVIEW_MARKER,
    '# 审稿单：' + target.title,
    '',
    '- 章节：第' + String(target.number) + '章',
    '- 草稿字数：' + String(countChars(draft)),
    '- 结论：' + verdict,
    '- 统计：阻断 ' + String(blocks.length) + ' / 提醒 ' + String(warns.length) + ' / 提示 ' + String(notes.length),
    '',
    '## 阻断',
    '',
    ...(blocks.length === 0 ? ['- 无'] : blocks.map((item) => '- [' + item.rule + '] ' + item.message)),
    '',
    '## 提醒',
    '',
    ...(warns.length === 0 ? ['- 无'] : warns.map((item) => '- [' + item.rule + '] ' + item.message)),
    '',
    '## 提示',
    '',
    ...(notes.length === 0 ? ['- 无'] : notes.map((item) => '- [' + item.rule + '] ' + item.message)),
    '',
    '## 人工复审',
    '',
    '- 视角是否统一，有没有跳视角',
    '- 对话是否像这个人说的（对照人物卡口吻）',
    '- 场景空间是否成立（谁在哪、看向谁）',
    '- 本章是否推动了主线，而不只是过渡',
    ''
  ].join('\n');
  const dir = join(cwd, CHAPTER_DIRECTORY, chapterDirName(target.number));
  mkdirSync(dir, { recursive: true });
  const preferred = join(dir, '审稿.md');
  let path = '审稿.md';
  if (existsSync(preferred)) {
    let existing = '';
    try { existing = readFileSync(preferred, 'utf8'); } catch { existing = ''; }
    if (!existing.includes(REVIEW_MARKER)) path = '审稿-自动.md';
  }
  writeFileSync(join(dir, path), markdown, 'utf8');
  return {
    number: target.number,
    title: target.title,
    path: join(CHAPTER_DIRECTORY, chapterDirName(target.number), path),
    verdict,
    counts: { block: blocks.length, warn: warns.length, note: notes.length },
    findings,
    markdown
  };
}

function reviewFileOf(cwd, number) {
  const dir = join(cwd, CHAPTER_DIRECTORY, chapterDirName(number));
  for (const name of ['审稿.md', '审稿-自动.md']) {
    const file = join(dir, name);
    if (existsSync(file)) {
      let text = '';
      try { text = readFileSync(file, 'utf8'); } catch { text = ''; }
      const verdict = fieldOf(text, '结论');
      const section = /## 阻断\s*\n([\s\S]*?)(?:\n## |$)/.exec(text);
      const blockers = section === null ? [] : section[1].split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith('- [')).map((line) => line.replace(/^- \[/, '').replace(/\] .*$/, ''));
      return { exists: true, path: join(CHAPTER_DIRECTORY, chapterDirName(number), name), verdict, blockers };
    }
  }
  return { exists: false, path: undefined, verdict: '', blockers: [] };
}

/** 本章写作任务：把有限上下文与硬约束组装成一份可直接交给 Agent 的任务书。 */
export function buildChapterTask(cwd, numberInput, options = {}) {
  cwd = activeNovelRoot(cwd);
  const context = chapterContext(cwd, numberInput);
  const target = wordTargetOf(readText(cwd, NOVEL_FILES.premise) ?? '', options);
  const voices = context.characters.map((card) => card.name + '：' + (card.fields['口吻'] ?? card.fields['说话方式'] ?? '未写口吻')).join('；');
  const lines = [
    '# 写作任务：' + context.title,
    '',
    '## 任务',
    '',
    '- 写第' + String(context.number) + '章，目标 ' + String(target.min) + '–' + String(target.max) + ' 字；',
    '- 只写本章：不提前写下一章，不在正文里解释设定；',
    '- 目标、冲突、钩子必须落地，章末留下一个未解问题；',
    '- 出场人物保持各自口吻，不替角色说作者想说的话；',
    '- 结果写入 章节/第' + String(context.number).padStart(4, '0') + '章/草稿.md，不改蓝图、大纲、设定与追踪。',
    '',
    '## 硬约束',
    '',
    '- 视角：沿用上一章，不跳视角；',
    '- 人物口吻：' + (voices === '' ? '（人物卡未写口吻，保守处理）' : voices),
    '- 引用设定：' + (context.blueprint.quote === '' ? '（未指定，只用上下文里的世界观）' : context.blueprint.quote),
    '- 连续性：只使用下方「连续性事实」，不要自行新增未登记设定；',
    '- 结尾：钩子要能接上下一章，不用总结句收尾。',
    '',
    '## 本章上下文',
    '',
    context.text,
    '',
    '## 交付与验收',
    '',
    '- 写完后调用 toon_novel_review 生成审稿单；',
    '- 出现阻断先修，再谈定稿；',
    '- 定稿由 toon_novel_finalize 复制草稿到 定稿.md，不手改状态。',
    ''
  ];
  const dir = join(cwd, CHAPTER_DIRECTORY, chapterDirName(context.number));
  mkdirSync(dir, { recursive: true });
  const file = join(dir, '写作任务.md');
  writeFileSync(file, lines.join('\n'), 'utf8');
  return { path: join(CHAPTER_DIRECTORY, chapterDirName(context.number), '写作任务.md'), number: context.number, title: context.title, chars: countChars(lines.join('\n')), markdown: lines.join('\n') };
}

/** 定稿门：必须有审稿单且无阻断；默认不覆盖已有定稿。 */
export function finalizeChapter(cwd, numberInput, options = {}) {
  cwd = activeNovelRoot(cwd);
  const chapters = scanChapters(cwd);
  const requested = Number(numberInput);
  const target = Number.isInteger(requested) && requested > 0
    ? chapters.find((chapter) => chapter.number === requested)
    : [...chapters].reverse().find((chapter) => chapter.parts.draft.present || chapter.parts.final.present);
  if (target === undefined) throw new Error('没有可定稿的章节：先写草稿');
  if (!target.parts.draft.present) throw new Error('还没有草稿：先写 草稿.md');
  if (target.parts.final.present && options.force !== true) throw new Error('定稿已存在；确需覆盖时传 force=true');
  const review = reviewFileOf(cwd, target.number);
  if (!review.exists) throw new Error('还没有审稿单：先跑 toon_novel_review');
  if (review.blockers.length > 0) throw new Error('审稿有 ' + String(review.blockers.length) + ' 个阻断：' + review.blockers.join('、'));
  const dir = join(cwd, CHAPTER_DIRECTORY, chapterDirName(target.number));
  const draft = readFileSync(join(dir, '草稿.md'), 'utf8');
  writeFileSync(join(dir, '定稿.md'), draft, 'utf8');
  return { path: join(CHAPTER_DIRECTORY, chapterDirName(target.number), '定稿.md'), reviewPath: review.path, verdict: review.verdict, chars: countChars(draft) };
}

function replaceSection(markdown, label, body) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const start = lines.findIndex((line) => line === '## ' + label);
  if (start < 0) {
    return (lines.length === 0 ? '' : lines.join('\n') + '\n\n') + '## ' + label + '\n\n' + body + '\n';
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) { end = index; break; }
  }
  const head = lines.slice(0, start + 1);
  const tail = lines.slice(end);
  return [...head, '', ...String(body).split(/\r?\n/), '', ...tail].join('\n').replace(/\n{3,}/g, '\n\n');
}

export function upsertWorldEntry(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const category = WORLD_CATEGORIES.find((item) => item.id === input.category || item.label === input.category);
  if (category === undefined) throw new Error('未知世界观类目：' + String(input.category));
  const text = String(input.text ?? '').trim();
  if (text === '') throw new Error('条目内容为空');
  let markdown = readText(cwd, NOVEL_FILES.world);
  if (markdown === undefined) markdown = worldTemplate();
  const current = bullets(sectionOf(markdown, category.label));
  const index = Number(input.index);
  if (Number.isInteger(index) && index >= 1 && index <= current.length) current[index - 1] = text;
  else current.push(text);
  const next = replaceSection(markdown, category.label, current.map((line) => '- ' + line).join('\n'));
  writeFileSync(join(cwd, NOVEL_FILES.world), next, 'utf8');
  return { category: category.id, label: category.label, entries: current.length, index: Number.isInteger(index) && index >= 1 ? index : current.length };
}

export function removeWorldEntry(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const category = WORLD_CATEGORIES.find((item) => item.id === input.category || item.label === input.category);
  if (category === undefined) throw new Error('未知世界观类目：' + String(input.category));
  const markdown = readText(cwd, NOVEL_FILES.world);
  if (markdown === undefined) throw new Error('还没有 设定.md');
  const current = bullets(sectionOf(markdown, category.label));
  const index = Number(input.index);
  if (!Number.isInteger(index) || index < 1 || index > current.length) throw new Error('条目序号越界');
  current.splice(index - 1, 1);
  const next = replaceSection(markdown, category.label, current.map((line) => '- ' + line).join('\n'));
  writeFileSync(join(cwd, NOVEL_FILES.world), next, 'utf8');
  return { category: category.id, label: category.label, entries: current.length };
}

function serializeCharacters(cards) {
  const lines = ['# 人物', ''];
  for (const card of cards) {
    lines.push('## ' + card.name, '');
    for (const [key, value] of Object.entries(card.fields)) {
      if (String(value ?? '').trim() === '') continue;
      lines.push('- ' + key + '：' + String(value).trim());
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function upsertCharacter(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const name = String(input.name ?? '').trim();
  if (name === '') throw new Error('人物名不能为空');
  const fields = input.fields !== null && typeof input.fields === 'object' ? input.fields : {};
  let markdown = readText(cwd, NOVEL_FILES.characters);
  if (markdown === undefined) markdown = characterTemplate();
  const cards = parseCharacters(markdown);
  const existing = cards.find((card) => card.name === name);
  if (existing === undefined) {
    cards.push({ name, fields: { ...fields } });
  } else {
    existing.fields = { ...existing.fields, ...fields };
  }
  writeFileSync(join(cwd, NOVEL_FILES.characters), serializeCharacters(cards), 'utf8');
  return { name, fields: (cards.find((card) => card.name === name) ?? { fields: {} }).fields, count: cards.length };
}

export function removeCharacter(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const name = String(input.name ?? '').trim();
  if (name === '') throw new Error('人物名不能为空');
  const markdown = readText(cwd, NOVEL_FILES.characters);
  if (markdown === undefined) throw new Error('还没有 人物.md');
  const cards = parseCharacters(markdown);
  const next = cards.filter((card) => card.name !== name);
  if (next.length === cards.length) throw new Error('没有这个人物：' + name);
  writeFileSync(join(cwd, NOVEL_FILES.characters), serializeCharacters(next), 'utf8');
  return { name, count: next.length };
}

/** 把现成小说导入成结构：识别章节 → 正文.md + 大纲.md + 灵感.md（不覆盖已有正文，除非 force）。 */
export function importNovel(cwd, input = {}) {
  cwd = activeNovelRoot(cwd);
  const rawPath = String(input.path ?? '').trim();
  if (rawPath === '') throw new Error('缺少导入文件路径');
  const absolute = resolve(cwd, rawPath);
  if (!existsSync(absolute)) throw new Error('文件不存在：' + rawPath);
  if (!/\.(txt|md|markdown)$/i.test(absolute)) throw new Error('只支持导入 .txt / .md 文本');
  const buffer = readFileSync(absolute);
  if (buffer.length > 20 * 1024 * 1024) throw new Error('文件超过 20MB');
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n');
  const chapterRe = /^(?:#{1,3}\s*)?(第[零一二三四五六七八九十百千万0-9]+章[^\n]*|Chapter\s+\d+[^\n]*)\s*$/gim;
  const matches = [...text.matchAll(chapterRe)];
  const chapters = [];
  if (matches.length === 0) {
    chapters.push({ title: '第1章', content: text.trim() });
  } else {
    const preface = text.slice(0, matches[0].index).trim();
    if (preface !== '' && preface.length >= 80) chapters.push({ title: '序章', content: preface });
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const start = match.index + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
      const content = text.slice(start, end).trim();
      if (content === '') continue;
      chapters.push({ title: match[1].trim().replace(/^#+\s*/, ''), content });
    }
  }
  if (chapters.length === 0) throw new Error('没有识别到正文内容');
  const title = String(input.title ?? '').trim() || (rawPath.split('/').pop() ?? '').replace(/\.(txt|md|markdown)$/i, '') || '未命名小说';
  const existingBody = readText(cwd, NOVEL_FILES.body);
  if (existingBody !== undefined && existingBody.trim() !== '' && input.force !== true) throw new Error('正文.md 已有内容；确需覆盖时传 force=true');

  const bodyLines = ['# 正文', ''];
  for (const chapter of chapters) {
    bodyLines.push('## ' + chapter.title, '', chapter.content, '');
  }
  if (input.force === true && existingBody !== undefined) {
    writeFileSync(join(cwd, '正文-导入前.md'), existingBody, 'utf8');
  }
  writeFileSync(join(cwd, NOVEL_FILES.body), bodyLines.join('\n'), 'utf8');

  let outlinePath;
  if (!existsSync(join(cwd, NOVEL_FILES.outline))) {
    const outlineLines = ['# 大纲', '', '## 第一卷', ''];
    for (const chapter of chapters) {
      outlineLines.push('### ' + chapter.title, '', '- 目标：', '- 冲突：', '- 钩子：', '');
    }
    writeFileSync(join(cwd, NOVEL_FILES.outline), outlineLines.join('\n'), 'utf8');
    outlinePath = NOVEL_FILES.outline;
  }

  if (!existsSync(join(cwd, NOVEL_FILES.premise))) {
    const total = chapters.reduce((sum, chapter) => sum + countChars(chapter.content), 0);
    initNovel(cwd, { title, length: '导入：' + String(chapters.length) + ' 章 / ' + String(total) + ' 字' });
  }
  const chars = chapters.reduce((sum, chapter) => sum + countChars(chapter.content), 0);
  return { path: NOVEL_FILES.body, title, chapters: chapters.length, chars, outlinePath, source: absolute };
}

/** 多书支持：项目指针 + 目录解析。当前工作区一次激活一本，避免旧接口全部改签名。 */
export const NOVEL_PROJECT_DIR = '小说';
const ACTIVE_POINTER = 'novel-active';

export function novelProjectRoot(cwd, project) {
  const value = String(project ?? '').trim();
  if (value === '' || value === '.') return cwd;
  const root = resolve(cwd, value);
  const base = resolve(cwd);
  if (!root.startsWith(base + '/') && root !== base) throw new Error('项目目录越界');
  return root;
}

export function activeNovelRoot(cwd) {
  try {
    const pointer = join(cwd, '.kylin-toon', ACTIVE_POINTER);
    if (!existsSync(pointer)) return cwd;
    const value = readFileSync(pointer, 'utf8').trim();
    if (value === '' || value === '.') return cwd;
    const root = novelProjectRoot(cwd, value);
    return existsSync(root) ? root : cwd;
  } catch { return cwd; }
}

export function setActiveNovel(cwd, project) {
  const value = String(project ?? '').trim() || '.';
  const root = novelProjectRoot(cwd, value);
  if (value !== '.' && !existsSync(root)) throw new Error('项目不存在：' + value);
  mkdirSync(join(cwd, '.kylin-toon'), { recursive: true });
  writeFileSync(join(cwd, '.kylin-toon', ACTIVE_POINTER), value + '\n', 'utf8');
  return { project: value, root };
}

export function listNovelProjects(cwd) {
  const active = activeNovelRoot(cwd);
  const projects = [];
  const add = (id, root) => {
    const premise = readText(root, NOVEL_FILES.premise) ?? '';
    const title = fieldOf(premise, '书名') || (id === '.' ? '当前工作区小说' : id.split('/').pop());
    const chapters = scanChapters(root).length;
    const body = countChars(readText(root, NOVEL_FILES.body) ?? '');
    projects.push({ id, title, chapters, chars: body, active: resolve(root) === resolve(active) });
  };
  if ([NOVEL_FILES.premise, NOVEL_FILES.body, NOVEL_FILES.world].some((name) => existsSync(join(cwd, name)))) add('.', cwd);
  const dir = join(cwd, NOVEL_PROJECT_DIR);
  if (existsSync(dir)) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const root = join(dir, entry.name);
      if ([NOVEL_FILES.premise, NOVEL_FILES.body].some((name) => existsSync(join(root, name)))) add(NOVEL_PROJECT_DIR + '/' + entry.name, root);
    }
  }
  return { active: resolve(active) === resolve(cwd) ? '.' : relative(cwd, active), projects };
}
