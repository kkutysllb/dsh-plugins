/**
 * 互动游戏阶段写作模板：把「下一步」变成可填的骨架，而不是让 Agent 每次自由发挥。
 *
 * 三条纪律：
 * 1. 模板只写结构，关键判断留 `<待填：...>`；待填项存在时阶段投影判 partial。
 * 2. 概念阶段是「三选一」：先写 concepts/OPTIONS.md 三个方向，选定后才生成 CONCEPT.md。
 * 3. 不覆盖作者已经写过的文件；只有文件不存在时才落模板。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { GAME_DIRECTORY, GAME_FILES, gameProjectRoot, gameProjection } from './game.js';

export const CONCEPT_OPTIONS_FILE = 'concepts/OPTIONS.md';

function readText(root, relativePath) {
  const file = join(root, relativePath);
  if (!existsSync(file)) return undefined;
  try { return readFileSync(file, 'utf8'); } catch { return undefined; }
}

function firstHeading(text, fallback) {
  const match = /^#\s+(.+)$/m.exec(text ?? '');
  return match === null ? fallback : match[1].trim();
}

function projectTitle(root, id) {
  return firstHeading(readText(root, GAME_FILES.brief), id);
}

function briefSkeleton(title) {
  return [
    '# ' + title,
    '',
    '> 本文件锁定产品边界。用工作台「阶段 → 立项」表单填写，或直接改下面各行。',
    '',
    '- 原著：无（原创）',
    '- 平台与运行时：待定',
    '- 市场与界面语言：中文',
    '- 受众：待定',
    '- 玩法方向：待定',
    '- 对标先例：待定',
    '- experienceProfile：narrative-led',
    '- targetFinish：playable-prototype',
    '- 核心代入感：待定',
    '- 时长与预算：待定',
    '- 明确不做：待定',
    '- 版权与分级：待定',
    '',
    '## 未确认假设',
    '- 平台、玩法与完成度未拍板前，后续阶段只做能撤销的草案。',
    ''
  ].join('\n');
}

function analysisSkeleton(title) {
  return [
    '# 原著拆解 · ' + title,
    '',
    '> 仅改编项目需要。每条判断后写来源，例如 `第 3 章` 或 `原文路径#L42`；没有出处的结论不算拆解。',
    '',
    '## 1. 可玩冲突',
    '',
    '<待填：列出能转成玩家行动的冲突。每条写清「玩家能做什么」「世界如何回应」「失败的代价」。>',
    '',
    '## 2. 关键场面',
    '',
    '<待填：选出 3–7 个必须保留的场面，写清它在游戏里对应什么交互，而不是只做成过场。>',
    '',
    '## 3. 人物欲望与信息差',
    '',
    '<待填：主角/对手/关键配角各自想要什么；谁知道什么、玩家什么时候知道。>',
    '',
    '## 4. 世界规则',
    '',
    '<待填：什么能做、什么不能做、违反规则的后果；哪些规则能直接制造关卡。>',
    '',
    '## 5. 改编边界',
    '',
    '- 必须保留：<待填>',
    '- 可以改写：<待填>',
    '- 明确删去：<待填>',
    ''
  ].join('\n');
}

function conceptOptionsSkeleton(title, source) {
  return [
    '# 概念三选一 · ' + title,
    '',
    '> 先给三个差异明显的方向，再让创作者选定；不要在同一条路上换措辞。',
    '> 选定后运行 `toon_game_stage action=choose option=A|B|C` 生成 concepts/CONCEPT.md。',
    source === '' ? '' : '> 原著来源：' + source,
    '',
    '## 方案 A：<待填：标题>',
    '',
    '- 一句话概念：<待填>',
    '- 玩家扮演：<待填>',
    '- 核心循环：<待填：玩家反复做什么、为什么想做下一次>',
    '- 失败与重开：<待填>',
    '- 与原著关系：<待填：保留什么、改什么>',
    '- 主要风险：<待填>',
    '',
    '## 方案 B：<待填：标题>',
    '',
    '- 一句话概念：<待填>',
    '- 玩家扮演：<待填>',
    '- 核心循环：<待填>',
    '- 失败与重开：<待填>',
    '- 与原著关系：<待填>',
    '- 主要风险：<待填>',
    '',
    '## 方案 C：<待填：标题>',
    '',
    '- 一句话概念：<待填>',
    '- 玩家扮演：<待填>',
    '- 核心循环：<待填>',
    '- 失败与重开：<待填>',
    '- 与原著关系：<待填>',
    '- 主要风险：<待填>',
    ''
  ].filter((line) => line !== undefined).join('\n');
}

function designSkeleton(title) {
  return [
    '# 游戏设计 · ' + title,
    '',
    '## 1. 核心循环',
    '',
    '<待填：玩家每一轮做什么 → 得到什么反馈 → 为什么再来一轮；用动词写，不写氛围。>',
    '',
    '## 2. 世界规则与系统',
    '',
    '<待填：资源、数值、状态与规则；写清玩家能观察到的变化。>',
    '',
    '## 3. 关卡与分支',
    '',
    '<待填：逐关写目标、阻力、可用的选择；每个选择改变什么结果。>',
    '',
    '## 4. 结局条件',
    '',
    '<待填：至少三个结局，写清触发条件与玩家能否预判。>',
    '',
    '## 5. 失败与重开',
    '',
    '<待填：失败后保留什么、重置什么、如何避免重复劳动。>',
    '',
    '## 6. 范围与不做',
    '',
    '<待填：本轮必做、可砍、不做。>',
    ''
  ].join('\n');
}

function artSkeleton(title) {
  return [
    '# 美术方向 · ' + title,
    '',
    '## 1. 视觉一句话',
    '',
    '<待填：观众第一眼应该记住的画面特征。>',
    '',
    '## 2. 色板与光线',
    '',
    '<待填：主色、强调色、夜/日/室内光线规则。>',
    '',
    '## 3. 造型与界面',
    '',
    '<待填：角色剪影、场景质感、HUD 与字体。>',
    '',
    '## 4. 镜头与演出',
    '',
    '<待填：镜头语言、转场、关键演出的优先级。>',
    '',
    '## 5. 资产预算与替代方案',
    '',
    '<待填：先做什么、可以先用占位的地方、哪些资产不外包。>',
    ''
  ].join('\n');
}

function buildSkeleton(title) {
  return [
    '# 构建说明 · ' + title,
    '',
    '# 目标',
    '',
    'targetFinish: <待填：继承 PRODUCT_BRIEF>',
    '平台、交付物、范围、视口与输入、分级、是否联网：<待填>',
    '',
    '# 核心还原要求',
    '',
    'experienceProfile: <待填：继承 GAME_DESIGN>',
    '核心体验与关键画面：<待填>',
    '复现：<待填：初态、输入路径、预期结局；随机时固定 seed>',
    '',
    '# 运行',
    '',
    'targetRuntime: <待填>',
    'testedRuntime: <待填：本次实际启动的环境>',
    'engine: <待填：引擎或框架及版本；拿不到写 NOT_AVAILABLE: 原因>',
    'commands:',
    '  install: <待填>',
    '  start: <待填>',
    '  test: <待填>',
    '  verify: <待填：端到端完整验证命令>',
    '',
    '# 限制',
    '',
    '<待填：与设计的范围差异、未测试项及原因；替代环境跑通不代表目标平台已验证。>',
    ''
  ].join('\n');
}

/** 每个阶段的模板：brief 用表单，concept 落到 OPTIONS，qa 交给 toon_game_qa。 */
export function stageTemplate(cwd, { stage, project } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  const title = projectTitle(root, id);
  const brief = readText(root, GAME_FILES.brief) ?? '';
  const source = /^-\s*原著[：:]\s*(.+)$/m.exec(brief)?.[1]?.trim() ?? '';
  switch (stage) {
    case 'brief': return { stage, file: GAME_FILES.brief, text: briefSkeleton(title) };
    case 'analysis': return { stage, file: GAME_FILES.sourceBible, text: analysisSkeleton(title) };
    case 'concept': return { stage, file: CONCEPT_OPTIONS_FILE, text: conceptOptionsSkeleton(title, /无（原创）/.test(source) ? '' : source) };
    case 'design': return { stage, file: GAME_FILES.design, text: designSkeleton(title) };
    case 'art': return { stage, file: GAME_FILES.art, text: artSkeleton(title) };
    case 'build': return { stage, file: GAME_FILES.buildBrief, text: buildSkeleton(title) };
    case 'qa': return { stage, file: GAME_FILES.qaBrief, text: '', note: '盲测交接单用 toon_game_qa action=brief 生成；它不会泄露设计与源码。' };
    default: throw new Error('未知阶段：' + String(stage));
  }
}

export function applyStageTemplate(cwd, { stage, project } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  const template = stageTemplate(cwd, { stage, project: id });
  if (template.text === '') throw new Error(template.note ?? '这个阶段没有可落盘的模板');
  const file = join(root, template.file);
  if (existsSync(file)) {
    return { project: id, stage, path: GAME_DIRECTORY + '/' + id + '/' + template.file, created: false, skipped: true };
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, template.text, 'utf8');
  return { project: id, stage, path: GAME_DIRECTORY + '/' + id + '/' + template.file, created: true, skipped: false, projection: gameProjection(cwd, id) };
}

function fieldIn(body, label) {
  const match = new RegExp('^\\s*[-*+]\\s+' + label + '\\s*[：:]\\s*(.+)$', 'm').exec(body);
  return match === null ? '' : match[1].trim();
}

/** 解析 OPTIONS.md 的三个方案；没有文件时返回空数组，让界面引导先生成模板。 */
export function listConceptOptions(cwd, project) {
  const { id, root } = gameProjectRoot(cwd, project);
  const text = readText(root, CONCEPT_OPTIONS_FILE);
  const options = [];
  if (text !== undefined) {
    const matches = [...text.matchAll(/^##\s+方案\s*([A-Za-z0-9一二三])\s*[：:]\s*(.*)$/gm)];
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const start = match.index + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
      const body = text.slice(start, end).trim();
      options.push({
        id: match[1].toUpperCase(),
        title: match[2].trim(),
        summary: fieldIn(body, '一句话概念') || body.split(/\r?\n/).find((line) => line.trim() !== '') || '',
        body
      });
    }
  }
  const conceptText = readText(root, GAME_FILES.concept);
  const chosen = conceptText === undefined ? undefined : (/^>\s*选定方案\s*([A-Za-z0-9一二三])/m.exec(conceptText)?.[1]?.toUpperCase());
  return { project: id, file: GAME_DIRECTORY + '/' + id + '/' + CONCEPT_OPTIONS_FILE, options, chosen };
}

/** 选定一个方案，生成 concepts/CONCEPT.md；保留方案正文，不覆盖已有概念。 */
export function chooseConcept(cwd, { project, option } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  const wanted = String(option ?? '').trim().toUpperCase();
  if (wanted === '') throw new Error('缺少 option（A/B/C）');
  const { options, chosen } = listConceptOptions(cwd, id);
  if (options.length === 0) throw new Error('还没有 concepts/OPTIONS.md：先运行 toon_game_stage action=apply stage=concept');
  if (chosen !== undefined) throw new Error('已选定方案 ' + chosen + '；要换方向就改 concepts/CONCEPT.md 或先移走它');
  const picked = options.find((item) => item.id === wanted);
  if (picked === undefined) throw new Error('找不到方案 ' + wanted + '；可选：' + options.map((item) => item.id).join(' / '));
  const file = join(root, GAME_FILES.concept);
  if (existsSync(file)) throw new Error('concepts/CONCEPT.md 已存在，不覆盖作者内容');
  mkdirSync(dirname(file), { recursive: true });
  const text = [
    '# 概念 · ' + (picked.title === '' ? picked.id : picked.title),
    '',
    '> 选定方案 ' + picked.id + '（来自 concepts/OPTIONS.md）。',
    '',
    picked.body,
    '',
    '## 为什么是它',
    '',
    '- 与另外两个方案相比，这个方向更能让玩家的选择改变结果。',
    '- 若后续验证失败，回 concepts/OPTIONS.md 换方案，而不是在 CONCEPT.md 里打补丁。',
    ''
  ].join('\n');
  writeFileSync(file, text, 'utf8');
  return { project: id, path: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.concept, option: picked.id, projection: gameProjection(cwd, id) };
}
