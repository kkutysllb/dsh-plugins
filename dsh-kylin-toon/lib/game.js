/**
 * 互动游戏工作台：入口识别、工程骨架与阶段投影。
 *
 * 文件契约沿用随包 novel-to-game 技能的目录，不另造一套：
 *   PRODUCT_BRIEF.md → analysis/SOURCE_BIBLE.md → concepts/CONCEPT.md
 *   → design/GAME_DESIGN.md → build/app/（灰盒）→ design/ART_DIRECTION.md
 *   → build/BUILD_BRIEF.md → qa/verification.json
 *
 * 这里只做确定性读写与投影：不生成美术、不跑构建、不替创作者签收 QA。
 * 阶段判断只认文件里的证据；没写就是没做，占位词（待定 / TBD）不算完成。
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { actionLabel, classifyCreativeIntent, mediumLabel } from './intent.js';

export const GAME_DIRECTORY = 'game-adaptations';
export const GAME_FILES = {
  brief: 'PRODUCT_BRIEF.md',
  sourceBible: 'analysis/SOURCE_BIBLE.md',
  concept: 'concepts/CONCEPT.md',
  design: 'design/GAME_DESIGN.md',
  art: 'design/ART_DIRECTION.md',
  preview: 'build/app/index.html',
  buildBrief: 'build/BUILD_BRIEF.md',
  verification: 'qa/verification.json',
  playtest: 'qa/playtest-report.md',
  qaBrief: 'qa/盲测任务.md',
  qaPlan: 'qa/blind-plan.json',
  qaSession: 'qa/session.json',
  progress: '_progress.md'
};

export const TARGET_FINISHES = ['graybox', 'playable-prototype', 'polished-vertical-slice', 'showcase'];
export const EXPERIENCE_PROFILES = ['system-led', 'narrative-led', 'hybrid'];
export const TARGET_LABELS = { graybox: '灰盒', 'playable-prototype': '可玩原型', 'polished-vertical-slice': '精修切片', showcase: '展示版' };
export const PROFILE_LABELS = { 'system-led': '系统驱动', 'narrative-led': '叙事驱动', hybrid: '混合' };

const ACTIVE_POINTER = 'game-active';
const STATE_DIRECTORY = '.kylin-toon';
const PLACEHOLDER = /^(待定|未定|未知|n\/a|na|tbd|todo|none)$/i;
const QA_CHECKS = ['launch', 'render', 'input', 'coreLoop', 'outcome', 'restart'];

/** 阶段定义：status 由文件证据算出；action 是「下一步让 Agent 做什么」的可执行说明。 */
export const GAME_STAGE_DEFS = [
  {
    id: 'brief',
    label: '立项',
    file: GAME_FILES.brief,
    action: '读用户原话，把 PRODUCT_BRIEF.md 里的平台与运行时、玩法方向、experienceProfile、targetFinish、核心代入感、明确不做填成可执行的决定；不确定的写进「未确认假设」，不要默认填值。'
  },
  {
    id: 'analysis',
    label: '拆书',
    file: GAME_FILES.sourceBible,
    optional: true,
    action: '调 novel-game-analyze，产出 analysis/SOURCE_BIBLE.md：可玩冲突、关键场面、人物欲望与信息差、世界规则、改编边界；结论带原文出处。'
  },
  {
    id: 'concept',
    label: '概念',
    file: GAME_FILES.concept,
    action: '调 game-design 阶段一，产出 concepts/CONCEPT.md：选定一个可玩概念，写清玩家扮演谁、追求什么、核心循环、失败与重开、与原著的关系。'
  },
  {
    id: 'design',
    label: '设计',
    file: GAME_FILES.design,
    action: '调 game-design 阶段二，产出 design/GAME_DESIGN.md：世界规则、关卡与分支、玩家选择如何改变结果、数值与结局条件。'
  },
  {
    id: 'graybox',
    label: '灰盒',
    file: GAME_FILES.preview,
    action: '调 game-build 做可跑通的灰盒到 build/app/index.html：先保住主界面、主角交互与核心循环，再交给没读过设计的人从头试玩。'
  },
  {
    id: 'art',
    label: '美术方向',
    file: GAME_FILES.art,
    optional: true,
    action: '调 game-design 阶段三，产出 design/ART_DIRECTION.md：色板、造型、界面与镜头语言；先定方向，再决定是否做视觉目标图。'
  },
  {
    id: 'build',
    label: '构建',
    file: GAME_FILES.buildBrief,
    action: '继续 game-build 完成构建，并写 build/BUILD_BRIEF.md：运行方式、复现路径、端到端 verify 命令与限制；不要写通关剧透。'
  },
  {
    id: 'qa',
    label: '验收',
    file: GAME_FILES.verification,
    action: '在没参与编码的新会话里调 game-qa，先盲玩到至少一个设计结局，再生成 qa/verification.json 与 qa/playtest-report.md；六项必须是实跑 PASS。'
  }
];

function readText(root, relativePath) {
  const file = join(root, relativePath);
  if (!existsSync(file)) return undefined;
  try { return readFileSync(file, 'utf8'); } catch { return undefined; }
}

function firstHeading(text) {
  const match = /^#\s+(.+)$/m.exec(text ?? '');
  return match === null ? undefined : match[1].trim().slice(0, 80);
}

/** 读 Markdown 里 `- 字段：值` 形式的字段，去掉加粗标记；空值与占位词都算没填。 */
export function fieldOf(text, labels) {
  const wanted = Array.isArray(labels) ? labels : [labels];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.replace(/^\s*[-*+]\s+/, '').trim();
    if (line === '' || line.startsWith('#')) continue;
    const at = line.search(/[：:]/);
    if (at <= 0) continue;
    const key = line.slice(0, at).replace(/\*\*/g, '').trim();
    if (!wanted.includes(key)) continue;
    const value = line.slice(at + 1).replace(/\*\*/g, '').trim();
    if (value === '') continue;
    return value;
  }
  return '';
}

function isPlaceholder(value) {
  const text = String(value ?? '').trim();
  return text === '' || PLACEHOLDER.test(text) || text.includes('待定');
}

export function parseBrief(text) {
  return {
    source: fieldOf(text, ['原著', '原著来源']),
    platform: fieldOf(text, ['平台与运行时', '平台']),
    language: fieldOf(text, ['市场与界面语言', '界面语言']),
    audience: fieldOf(text, ['受众', '目标受众']),
    play: fieldOf(text, ['玩法方向', '核心玩法']),
    reference: fieldOf(text, ['对标先例', '对标']),
    profile: fieldOf(text, ['experienceProfile', '体验主线']),
    finish: fieldOf(text, ['targetFinish', '制作完成度', '完成度']),
    immersion: fieldOf(text, ['核心代入感', '代入感']),
    budget: fieldOf(text, ['时长与预算', '预算']),
    notDoing: fieldOf(text, ['明确不做', '不做的事']),
    rating: fieldOf(text, ['版权与分级', '内容分级']),
    mode: fieldOf(text, ['模式'])
  };
}

function parseJsonText(text) {
  if (typeof text !== 'string' || text.trim() === '') return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

export function sourceKind(value) {
  const text = String(value ?? '').trim();
  if (isPlaceholder(text)) return 'unspecified';
  if (/原创|无原著|非改编|没有原著|无\s*$/.test(text)) return 'original';
  return 'novel';
}

function readVerification(text) {
  if (text === undefined) return { status: 'missing', checks: {}, passed: 0, total: QA_CHECKS.length };
  let data;
  try { data = JSON.parse(text); } catch { return { status: 'invalid', checks: {}, passed: 0, total: QA_CHECKS.length, reason: '不是合法 JSON' }; }
  const checks = data !== null && typeof data === 'object' && typeof data.checks === 'object' && data.checks !== null ? data.checks : {};
  const passed = QA_CHECKS.filter((key) => checks[key] === 'PASS').length;
  let status;
  if (data?.status === 'PASS' && passed === QA_CHECKS.length) status = 'PASS';
  else if (data?.status === 'PASS') status = 'FAIL';
  else if (data?.status === 'FAIL') status = 'FAIL';
  else status = 'NOT_RUN';
  return { status, checks, passed, total: QA_CHECKS.length };
}

/** 项目名要能当目录名：显式项目名拒绝路径分隔符，标题派生的名字做安全清洗。 */
export function projectIdOf(raw, fallback = '新游戏') {
  let value = String(raw ?? '').trim().replace(/^game-adaptations[\\/]/, '');
  if (value === '' || value === '.' || value === '..') return fallback;
  if (/[\\/\u0000]/.test(value) || value.includes('..')) throw new Error('项目名不能包含路径分隔符：' + value);
  value = value.replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_\-·]/gu, '').slice(0, 64);
  return value === '' ? fallback : value;
}

function deriveId(title) {
  // 标题派生的目录名做清洗；显式 project 名仍走 projectIdOf 的严格校验。
  const cleaned = String(title ?? '').replace(/[\\/\u0000]/g, '-').replace(/\.\./g, '').trim();
  return projectIdOf(cleaned, '新游戏');
}

function uniqueId(cwd, base) {
  const ids = new Set(listGameIds(cwd));
  if (!ids.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = base + '-' + String(index);
    if (!ids.has(candidate)) return candidate;
  }
  return base + '-' + Date.now().toString(36);
}

function gameBase(cwd) {
  return resolve(cwd, GAME_DIRECTORY);
}

function projectRoot(cwd, id) {
  const base = gameBase(cwd);
  const root = resolve(base, id);
  if (root !== base && !root.startsWith(base + sep)) throw new Error('游戏工程目录越界');
  return root;
}

export function gameProjectRoot(cwd, project) {
  const ids = listGameIds(cwd);
  const id = typeof project === 'string' && project.trim() !== '' ? projectIdOf(project, '') : (activeGameId(cwd) ?? ids[0]);
  if (id === undefined || id === '' || !ids.includes(id)) throw new Error('游戏工程不存在：' + String(project ?? ''));
  return { id, root: projectRoot(cwd, id) };
}

function listGameIds(cwd) {
  const base = gameBase(cwd);
  if (!existsSync(base)) return [];
  let entries;
  try { entries = readdirSync(base, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh'));
}

export function activeGameId(cwd) {
  try {
    const pointer = join(cwd, STATE_DIRECTORY, ACTIVE_POINTER);
    if (!existsSync(pointer)) return undefined;
    const value = readFileSync(pointer, 'utf8').trim();
    if (value === '' || value === '.') return undefined;
    return existsSync(projectRoot(cwd, value)) ? value : undefined;
  } catch { return undefined; }
}

export function setActiveGame(cwd, project) {
  const id = projectIdOf(project, '');
  if (id === '') throw new Error('缺少项目名');
  const root = projectRoot(cwd, id);
  if (!existsSync(root)) throw new Error('游戏工程不存在：' + id);
  mkdirSync(join(cwd, STATE_DIRECTORY), { recursive: true });
  writeFileSync(join(cwd, STATE_DIRECTORY, ACTIVE_POINTER), id + '\n', 'utf8');
  return { project: id, root: GAME_DIRECTORY + '/' + id };
}

function stageStatus(id, status, detail, file, extra = {}) {
  return { id, status, detail, file, ...extra };
}

/** 由文档文本算阶段：纯函数，供真实工程与「新建工程提案」共用。 */
export function projectionFromTexts({ id, title, root, cwd, texts = {}, previewReady = false }) {
  const briefText = texts[GAME_FILES.brief];
  const brief = parseBrief(briefText ?? '');
  const finish = TARGET_FINISHES.includes(brief.finish) ? brief.finish : 'playable-prototype';
  const profile = EXPERIENCE_PROFILES.includes(brief.profile) ? brief.profile : 'narrative-led';
  const source = sourceKind(brief.source);
  const verification = readVerification(texts[GAME_FILES.verification]);
  const playtest = texts[GAME_FILES.playtest] !== undefined;

  const stages = [];
  const add = (def, status, detail, extra) => stages.push(stageStatus(def.id, status, detail, def.file, { label: def.label, optional: def.optional === true, action: def.action, ...extra }));

  // 立项：五个必填项都填了才算完成；targetFinish / experienceProfile 必须是合法枚举。
  const required = [
    ['平台与运行时', brief.platform],
    ['玩法方向', brief.play],
    ['核心代入感', brief.immersion],
    ['experienceProfile', brief.profile],
    ['targetFinish', brief.finish]
  ];
  const missingFields = required.filter(([, value]) => isPlaceholder(value)).map(([label]) => label);
  const invalidProfile = brief.profile !== '' && !isPlaceholder(brief.profile) && !EXPERIENCE_PROFILES.includes(brief.profile);
  const invalidFinish = brief.finish !== '' && !isPlaceholder(brief.finish) && !TARGET_FINISHES.includes(brief.finish);
  if (briefText === undefined) add(GAME_STAGE_DEFS[0], 'pending', '缺 ' + GAME_FILES.brief + '：先写平台、玩法、完成度与不做的事');
  else if (missingFields.length === 0 && !invalidProfile && !invalidFinish) add(GAME_STAGE_DEFS[0], 'done', '已立项（' + TARGET_LABELS[finish] + ' · ' + PROFILE_LABELS[profile] + '）');
  else {
    const reasons = [];
    if (missingFields.length > 0) reasons.push('还缺 ' + missingFields.join('、'));
    if (invalidFinish) reasons.push('targetFinish 取值不合法');
    if (invalidProfile) reasons.push('experienceProfile 取值不合法');
    add(GAME_STAGE_DEFS[0], 'partial', '立项未完成：' + reasons.join('；'));
  }

  // 拆书：原创项目跳过；只说「改编」但没写原著来源时标记可选，不挡后续阶段。
  const bibleText = texts[GAME_FILES.sourceBible];
  if (source === 'original') add(GAME_STAGE_DEFS[1], 'skipped', '原创项目，不需要拆书');
  else if (source === 'unspecified') add(GAME_STAGE_DEFS[1], 'optional', '只有改编才需要：在 PRODUCT_BRIEF 里写「原著：」后再拆书');
  else if (bibleText === undefined) add(GAME_STAGE_DEFS[1], 'pending', '缺 ' + GAME_FILES.sourceBible + '：改编要先做带原文出处的原著拆解');
  else if (bibleText.includes('待填') || bibleText.trim().length < 200) add(GAME_STAGE_DEFS[1], 'partial', '拆解内容太少：写清可玩冲突、关键场面与改编边界');
  else add(GAME_STAGE_DEFS[1], 'done', '已拆书（' + String(bibleText.trim().length) + ' 字）');

  const conceptText = texts[GAME_FILES.concept];
  if (conceptText === undefined) add(GAME_STAGE_DEFS[2], 'pending', '缺 ' + GAME_FILES.concept + '：先选定一个可玩概念');
  else if (conceptText.includes('待填') || conceptText.trim().length < 200 || !/核心(循环|玩法)|玩家扮演|失败|重开|concept/i.test(conceptText)) add(GAME_STAGE_DEFS[2], 'partial', '概念还不够可执行：写清玩家扮演谁、核心循环、失败与重开');
  else add(GAME_STAGE_DEFS[2], 'done', '已选概念');

  const designText = texts[GAME_FILES.design];
  if (designText === undefined) add(GAME_STAGE_DEFS[3], 'pending', '缺 ' + GAME_FILES.design + '：世界规则、关卡、分支与结局');
  else if (designText.includes('待填') || designText.trim().length < 400 || !/(关卡|分支|规则|系统|结局)/.test(designText)) add(GAME_STAGE_DEFS[3], 'partial', '设计还不够落地：补关卡/分支/规则/结局');
  else add(GAME_STAGE_DEFS[3], 'done', '已设计');

  if (previewReady) add(GAME_STAGE_DEFS[4], 'done', '已有可跑构建（build/app/index.html）');
  else add(GAME_STAGE_DEFS[4], 'pending', '还没有可跑构建：先把核心循环做成灰盒');

  const artText = texts[GAME_FILES.art];
  if (finish === 'graybox') add(GAME_STAGE_DEFS[5], 'skipped', 'targetFinish=graybox，不做美术方向');
  else if (artText === undefined) add(GAME_STAGE_DEFS[5], 'pending', '缺 ' + GAME_FILES.art + '：灰盒过关后再定美术方向');
  else if (artText.includes('待填') || artText.trim().length < 200) add(GAME_STAGE_DEFS[5], 'partial', '美术方向内容太少：补色板、造型、界面与镜头语言');
  else add(GAME_STAGE_DEFS[5], 'done', '已定美术方向');

  const buildText = texts[GAME_FILES.buildBrief];
  if (!previewReady) add(GAME_STAGE_DEFS[6], buildText === undefined ? 'pending' : 'partial', buildText === undefined ? '还没有构建：先做灰盒' : '有构建说明但还没有可运行构建');
  else if (buildText === undefined) add(GAME_STAGE_DEFS[6], 'partial', '可运行，但缺 ' + GAME_FILES.buildBrief + '：写运行方式与 verify 命令');
  else if (buildText.includes('待填') || !/#\s*运行/.test(buildText)) add(GAME_STAGE_DEFS[6], 'partial', 'BUILD_BRIEF 缺「# 运行」一节或仍有待填项');
  else add(GAME_STAGE_DEFS[6], 'done', '构建说明齐全');

  const plan = parseJsonText(texts[GAME_FILES.qaPlan]);
  const qaSession = parseJsonText(texts[GAME_FILES.qaSession]);
  const authorSessionId = typeof plan?.authorSessionId === 'string' && plan.authorSessionId !== '' ? plan.authorSessionId : undefined;
  const qaSessionId = typeof qaSession?.sessionId === 'string' && qaSession.sessionId !== '' ? qaSession.sessionId : undefined;
  const qaIsolation = authorSessionId === undefined || qaSessionId === undefined
    ? 'unknown'
    : (authorSessionId === qaSessionId ? 'same-session' : 'isolated');

  if (verification.status === 'missing') add(GAME_STAGE_DEFS[7], 'pending', '还没有验收记录：盲玩后生成 qa/verification.json');
  else if (verification.status === 'invalid') add(GAME_STAGE_DEFS[7], 'partial', 'qa/verification.json 不是合法 JSON');
  else if (verification.status === 'FAIL') add(GAME_STAGE_DEFS[7], 'partial', '验收未通过（六项 ' + String(verification.passed) + '/' + String(verification.total) + '）');
  else if (verification.status === 'PASS' && !playtest) add(GAME_STAGE_DEFS[7], 'partial', '验收记录 PASS，但缺 qa/playtest-report.md');
  else if (verification.status === 'PASS' && qaIsolation === 'same-session') add(GAME_STAGE_DEFS[7], 'partial', '验收 PASS，但验收与创作是同一个会话：盲玩不隔离，结论不可信');
  else if (verification.status === 'PASS') add(GAME_STAGE_DEFS[7], 'done', '验收 PASS（六项实跑' + (qaIsolation === 'isolated' ? ' · 会话已隔离' : '') + '）');
  else add(GAME_STAGE_DEFS[7], 'pending', '验收还没跑：盲玩后生成 qa/verification.json');

  const nextStage = stages.find((stage) => stage.status !== 'done' && stage.status !== 'skipped' && stage.status !== 'optional');
  const done = stages.filter((stage) => stage.status === 'done').length;
  const total = stages.filter((stage) => stage.status !== 'skipped').length;

  const diagnostics = [];
  if (briefText === undefined) diagnostics.push({ code: 'brief-missing', message: '缺 PRODUCT_BRIEF.md：产品边界没有锁定' });
  else if (missingFields.length > 0) diagnostics.push({ code: 'brief-incomplete', message: '立项还缺：' + missingFields.join('、') });
  if (invalidFinish) diagnostics.push({ code: 'finish-invalid', message: 'targetFinish 必须是 ' + TARGET_FINISHES.join(' / ') });
  if (invalidProfile) diagnostics.push({ code: 'profile-invalid', message: 'experienceProfile 必须是 ' + EXPERIENCE_PROFILES.join(' / ') });
  if (source === 'novel' && bibleText === undefined) diagnostics.push({ code: 'source-bible-missing', message: '写了原著来源，但缺 analysis/SOURCE_BIBLE.md' });
  if (previewReady && buildText === undefined) diagnostics.push({ code: 'build-brief-missing', message: '已有构建，但缺 build/BUILD_BRIEF.md' });
  if (verification.status === 'FAIL') diagnostics.push({ code: 'qa-failed', message: 'qa/verification.json 未通过；不要宣称已验收' });
  if (verification.status === 'PASS' && !playtest) diagnostics.push({ code: 'playtest-report-missing', message: '验收 PASS，但缺 qa/playtest-report.md' });
  if (verification.status === 'PASS' && qaIsolation === 'same-session') diagnostics.push({ code: 'qa-session-same', message: '验收与创作是同一个会话：请在未读过设计与源码的新会话重跑盲玩' });
  if (verification.status === 'PASS' && qaIsolation === 'unknown') diagnostics.push({ code: 'qa-session-unknown', message: '验收 PASS，但没有记录盲测会话 id；用 toon_game_qa action=brief 生成交接单并在盲测会话记录' });
  if (finish === 'graybox' && artText !== undefined) diagnostics.push({ code: 'art-out-of-scope', message: 'targetFinish=graybox，但已经有 ART_DIRECTION.md；确认是否要升级完成度' });

  const documents = [];
  for (const def of GAME_STAGE_DEFS) {
    if (texts[def.file] === undefined) continue;
    documents.push({ path: GAME_DIRECTORY + '/' + id + '/' + def.file, stage: def.id, label: def.label, file: def.file });
  }
  if (texts[GAME_FILES.progress] !== undefined) documents.push({ path: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.progress, stage: 'meta', label: '进度', file: GAME_FILES.progress });
  for (const [file, label] of [[GAME_FILES.qaBrief, '盲测任务'], [GAME_FILES.qaPlan, '盲测交接'], [GAME_FILES.qaSession, '验收会话']]) {
    if (texts[file] !== undefined) documents.push({ path: GAME_DIRECTORY + '/' + id + '/' + file, stage: 'qa', label, file });
  }

  return {
    id,
    title: title === undefined || title === '' ? id : title,
    root: GAME_DIRECTORY + '/' + id,
    ...(root === undefined ? {} : { directory: root }),
    stages,
    nextStage: nextStage === undefined ? undefined : { id: nextStage.id, label: nextStage.label, file: nextStage.file, status: nextStage.status, detail: nextStage.detail, action: nextStage.action },
    previewReady,
    previewPath: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.preview,
    verification: { status: verification.status, passed: verification.passed, total: verification.total },
    qaIsolation,
    ...(authorSessionId === undefined ? {} : { qaAuthorSessionId: authorSessionId }),
    ...(qaSessionId === undefined ? {} : { qaSessionId }),
    targetFinish: finish,
    targetFinishLabel: TARGET_LABELS[finish],
    experienceProfile: profile,
    experienceProfileLabel: PROFILE_LABELS[profile],
    source,
    sourceValue: brief.source,
    mode: brief.mode === '' ? 'quick' : brief.mode,
    documents,
    counts: { done, total },
    diagnostics
  };
}

function readProjectTexts(root) {
  const texts = {};
  for (const file of Object.values(GAME_FILES)) {
    const text = readText(root, file);
    if (text !== undefined) texts[file] = text;
  }
  return texts;
}

/** 读单个游戏工程的阶段投影；不存在的工程返回 undefined。 */
export function gameProjection(cwd, project) {
  const ids = listGameIds(cwd);
  if (ids.length === 0) return undefined;
  let id;
  if (typeof project === 'string' && project.trim() !== '') id = projectIdOf(project, '');
  else id = activeGameId(cwd) ?? ids[0];
  if (id === '' || !ids.includes(id)) return undefined;
  const root = projectRoot(cwd, id);
  const texts = readProjectTexts(root);
  const title = firstHeading(texts[GAME_FILES.brief]) ?? id;
  return projectionFromTexts({ id, title, root, cwd, texts, previewReady: existsSync(join(root, GAME_FILES.preview)) });
}

export function listGameProjects(cwd) {
  const active = activeGameId(cwd);
  const projects = [];
  for (const id of listGameIds(cwd)) {
    const root = projectRoot(cwd, id);
    const texts = readProjectTexts(root);
    const hasCreative = [GAME_FILES.brief, GAME_FILES.progress, GAME_FILES.preview, GAME_FILES.design].some((file) => texts[file] !== undefined) || existsSync(join(root, GAME_FILES.preview));
    if (!hasCreative) continue;
    const title = firstHeading(texts[GAME_FILES.brief]) ?? id;
    const projection = projectionFromTexts({ id, title, root, cwd, texts, previewReady: existsSync(join(root, GAME_FILES.preview)) });
    projects.push({
      id,
      title,
      root: GAME_DIRECTORY + '/' + id,
      previewReady: projection.previewReady,
      verification: projection.verification.status,
      targetFinish: projection.targetFinish,
      counts: projection.counts,
      nextStage: projection.nextStage === undefined ? undefined : { id: projection.nextStage.id, label: projection.nextStage.label },
      active: active === id
    });
  }
  return { active: active ?? (projects[0]?.id ?? '.'), projects };
}

function progressTemplate(title, brief) {
  return [
    '# 制作进度',
    '',
    '- 项目：' + title,
    '- 原著：' + (brief.source === '' ? '无（原创）' : brief.source),
    '- 模式：' + (brief.mode === '' ? 'quick' : brief.mode),
    '- targetFinish：' + brief.finish,
    '- experienceProfile：' + brief.profile,
    '- 当前阶段：需求确认（立项）',
    '- 更新时间：' + new Date().toISOString(),
    '',
    '## 未确认假设',
    ...['平台与运行时', '玩法方向', '核心代入感', '时长与预算'].map((label) => '- ' + label + '：待确认'),
    '',
    '## 返工与范围',
    '- 暂无',
    ''
  ].join('\n');
}

function briefTemplate(title, brief) {
  const value = (input, fallback) => (isPlaceholder(input) ? fallback : input);
  return [
    '# ' + title,
    '',
    '> 本文件锁定产品边界。标「待定」的项需要创作者拍板；在它们填完之前不要把工程算作已立项。',
    '',
    '- 原著：' + value(brief.source, '无（原创）'),
    '- 平台与运行时：' + value(brief.platform, '待定'),
    '- 市场与界面语言：' + value(brief.language, '中文'),
    '- 受众：' + value(brief.audience, '待定'),
    '- 玩法方向：' + value(brief.play, '待定'),
    '- 对标先例：' + value(brief.reference, '待定'),
    '- experienceProfile：' + brief.profile,
    '- targetFinish：' + brief.finish,
    '- 核心代入感：' + value(brief.immersion, '待定'),
    '- 时长与预算：' + value(brief.budget, '待定'),
    '- 明确不做：' + value(brief.notDoing, '待定'),
    '- 版权与分级：' + value(brief.rating, '待定'),
    '- 模式：' + brief.mode,
    '',
    '## 未确认假设',
    '- 平台、玩法与完成度未拍板前，后续阶段只做能撤销的草案。',
    '',
    '## 起源',
    '- 由 KToon 互动游戏入口初始化；剧本、关卡与实现细节留给后续阶段。',
    ''
  ].join('\n');
}

/**
 * 建游戏工程骨架：只补缺失文件，不覆盖已有正文；不预建空的设计文档（空文件会被误读成已完成）。
 */
export function initGameProject(cwd, input = {}) {
  const title = String(input.title ?? '').trim();
  const explicit = input.project ?? input.id;
  const id = explicit === undefined || String(explicit).trim() === '' ? deriveId(title) : projectIdOf(explicit, '');
  if (id === '') throw new Error('缺少项目名');
  const finish = String(input.targetFinish ?? 'playable-prototype');
  if (!TARGET_FINISHES.includes(finish)) throw new Error('targetFinish 必须是 ' + TARGET_FINISHES.join(' / '));
  const profile = String(input.experienceProfile ?? 'narrative-led');
  if (!EXPERIENCE_PROFILES.includes(profile)) throw new Error('experienceProfile 必须是 ' + EXPERIENCE_PROFILES.join(' / '));

  const root = projectRoot(cwd, id);
  const created = [];
  const skipped = [];
  mkdirSync(root, { recursive: true });
  for (const directory of ['analysis', 'concepts', 'design', 'build', 'qa']) mkdirSync(join(root, directory), { recursive: true });

  const brief = {
    source: String(input.sourceNovel ?? '').trim(),
    platform: String(input.platform ?? '').trim(),
    language: String(input.language ?? '').trim(),
    audience: String(input.audience ?? '').trim(),
    play: String(input.playDirection ?? '').trim(),
    reference: String(input.reference ?? '').trim(),
    profile,
    finish,
    immersion: String(input.immersion ?? '').trim(),
    budget: String(input.budget ?? '').trim(),
    notDoing: String(input.notDoing ?? '').trim(),
    rating: String(input.rating ?? '').trim(),
    mode: String(input.mode ?? 'quick').trim() || 'quick'
  };

  const briefFile = join(root, GAME_FILES.brief);
  if (!existsSync(briefFile)) {
    writeFileSync(briefFile, briefTemplate(title === '' ? id : title, brief), 'utf8');
    created.push(GAME_FILES.brief);
  } else skipped.push(GAME_FILES.brief);

  const progressFile = join(root, GAME_FILES.progress);
  if (!existsSync(progressFile)) {
    writeFileSync(progressFile, progressTemplate(title === '' ? id : title, brief), 'utf8');
    created.push(GAME_FILES.progress);
  } else skipped.push(GAME_FILES.progress);

  setActiveGame(cwd, id);
  return {
    id,
    title: title === '' ? id : title,
    root: GAME_DIRECTORY + '/' + id,
    created,
    skipped,
    projection: gameProjection(cwd, id)
  };
}

function findMentioned(cwd, text, projects, explicit) {
  if (typeof explicit === 'string' && explicit.trim() !== '') {
    const id = projectIdOf(explicit, '');
    const existing = projects.find((project) => project.id === id);
    return existing === undefined ? { id, existing: false } : { id: existing.id, existing: true, project: existing };
  }
  const lower = text.toLowerCase();
  const mentioned = projects.find((project) => lower.includes(project.title.toLowerCase()) || lower.includes(project.id.toLowerCase()));
  if (mentioned !== undefined) return { id: mentioned.id, existing: true, project: mentioned };
  return undefined;
}

function titleFromText(text) {
  const quoted = /《([^》]{1,40})》/.exec(text);
  if (quoted !== null) return quoted[1].trim();
  const named = /(?:叫做|名叫|名字叫|项目名[：:])\s*([^\s，。；！？]{1,24})/.exec(text);
  if (named !== null) return named[1].trim();
  return '';
}

/**
 * 互动游戏需求入口：判断这句话是不是游戏需求、接哪个工程、下一步做什么。
 * 只读；不建目录、不写简报。创建动作留给 toon_game_project action=init。
 */
export function gameIntake(cwd, text, options = {}) {
  const input = String(text ?? '').trim();
  const list = listGameProjects(cwd);
  let intent = classifyCreativeIntent(input, { workspaceKind: options.workspaceKind });
  // 明确提到已有游戏工程时，工程上下文足以消解「继续 / 改一下」这类没有媒介词的句子。
  const mentionsProject = typeof options.project === 'string' && options.project.trim() !== ''
    || list.projects.some((project) => input.includes(project.title) || input.includes(project.id));
  if (intent.medium !== 'game' && mentionsProject) {
    intent = classifyCreativeIntent(input, { workspaceKind: 'game' });
  }

  if (input === '') {
    return {
      routed: false,
      intent,
      projects: list.projects,
      reason: '用户还没有说要做什么',
      suggestion: '先问一个澄清问题：要做原创游戏，还是把已有小说改编成游戏？'
    };
  }
  if (intent.medium !== 'game') {
    return {
      routed: false,
      intent,
      projects: list.projects,
      reason: '这句话更像' + mediumLabel(intent.medium) + '·' + actionLabel(intent.action),
      suggestion: '不要走游戏流程；按「' + mediumLabel(intent.medium) + '」工作台处理，入口工具 ' + (intent.route?.tool ?? 'toon_project') + '。'
    };
  }

  const explicit = options.project;
  const matched = findMentioned(cwd, input, list.projects, explicit);
  const quotedTitle = titleFromText(input);
  const activeProject = list.projects.find((project) => project.active);
  let id;
  let title;
  let existing = false;
  let matchedProject;
  if (matched !== undefined) {
    id = matched.id;
    existing = matched.existing;
    matchedProject = matched.project;
    title = matchedProject?.title ?? (quotedTitle === '' ? id : quotedTitle);
  } else if ((intent.action === 'continue' || intent.action === 'revise') && list.projects.length > 0) {
    const target = activeProject ?? list.projects[0];
    id = target.id;
    title = target.title;
    existing = true;
    matchedProject = target;
  } else {
    title = quotedTitle === '' ? (input.slice(0, 24) || '新游戏') : quotedTitle;
    id = uniqueId(cwd, deriveId(title));
  }

  const adapting = intent.action === 'adapt';
  const hintedSource = intent.sourceMedium === 'novel'
    || /(小说|原著|这本书|剧本|漫画|故事)/.test(input)
    || (adapting && /《[^》]+》/.test(input))
    ? 'novel'
    : undefined;
  // 新建工程时给投影一个最小「原著」提示，让拆书阶段正确显示为待办而不是可选。
  const texts = hintedSource === 'novel' ? { [GAME_FILES.brief]: '- 原著：' + (quotedTitle === '' ? '改编' : '《' + quotedTitle + '》') } : {};
  const projection = existing ? gameProjection(cwd, id) : projectionFromTexts({ id, title, cwd, texts, previewReady: false });
  const source = hintedSource ?? projection?.source ?? 'unspecified';
  const finish = projection?.targetFinish ?? 'playable-prototype';
  const profile = projection?.experienceProfile ?? 'narrative-led';
  const nextStage = projection?.nextStage ?? { id: 'brief', label: '立项', file: GAME_FILES.brief, action: GAME_STAGE_DEFS[0].action };

  const actions = [];
  if (!existing) {
    actions.push({
      tool: 'toon_game_project',
      args: {
        action: 'init',
        project: id,
        title,
        ...(source === 'novel' && quotedTitle !== '' ? { sourceNovel: '《' + quotedTitle + '》' } : {}),
        targetFinish: finish,
        experienceProfile: profile
      },
      label: '建 game-adaptations/' + id + '/ 骨架与 PRODUCT_BRIEF.md'
    });
  } else if (projection === undefined) {
    actions.push({ tool: 'toon_game_project', args: { action: 'status', project: id }, label: '读取工程阶段与缺口' });
  }
  actions.push({ label: '写 ' + (nextStage.file ?? GAME_FILES.brief) + '：' + nextStage.action });
  if (source === 'novel' && nextStage.id !== 'analysis') {
    actions.push({ tool: 'novel-game-analyze', label: '改编前先产出 analysis/SOURCE_BIBLE.md（带原文出处）' });
  }
  actions.push({ tool: 'toon_game_project', args: { action: 'status', project: id }, label: '每完成一个阶段就回来看投影，再从最早缺口继续' });

  return {
    routed: true,
    intent,
    project: id,
    title,
    existing,
    source,
    targetFinish: finish,
    experienceProfile: profile,
    projection,
    nextStage,
    actions,
    route: { tab: 'game', open: true },
    reminders: [
      '先灰盒后美术：核心循环没跑通前不做美术量产。',
      '验收只能由没参与编码的会话盲玩得出；没有 qa/verification.json 不算通过。',
      '不要用占位图、假数据或历史截图冒充当前构建。'
    ]
  };
}

const BRIEF_LABELS = {
  sourceNovel: '原著',
  platform: '平台与运行时',
  language: '市场与界面语言',
  audience: '受众',
  playDirection: '玩法方向',
  reference: '对标先例',
  experienceProfile: 'experienceProfile',
  targetFinish: 'targetFinish',
  immersion: '核心代入感',
  budget: '时长与预算',
  notDoing: '明确不做',
  rating: '版权与分级',
  mode: '模式'
};

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setBriefLine(text, label, value) {
  if (value === undefined) return text;
  const pattern = new RegExp('^(\\s*[-*+]\\s+)(\\*\\*)?' + escapeRegExp(label) + '(\\*\\*)?\\s*[：:].*$', 'm');
  if (pattern.test(text)) {
    return text.replace(pattern, (_match, prefix, boldStart, boldEnd) => prefix + (boldStart ?? '') + label + (boldEnd ?? '') + '：' + value);
  }
  const lines = text.split(/\r?\n/);
  let insert = lines.findIndex((line) => line.startsWith('## '));
  if (insert < 0) insert = lines.length;
  lines.splice(insert, 0, '- ' + label + '：' + value);
  return lines.join('\n');
}

function setBriefTitle(text, title) {
  if (typeof title !== 'string' || title.trim() === '') return text;
  if (/^#\s+/m.test(text)) return text.replace(/^#\s+.*$/m, '# ' + title.trim());
  return '# ' + title.trim() + '\n\n' + text;
}

export function briefFieldsOf(brief) {
  // 表单里「待定」显示为空，避免创作者把占位词当成已填内容。
  const value = (input) => (isPlaceholder(input) ? '' : input);
  return {
    sourceNovel: value(brief.source),
    platform: value(brief.platform),
    language: value(brief.language),
    audience: value(brief.audience),
    playDirection: value(brief.play),
    reference: value(brief.reference),
    experienceProfile: brief.profile || 'narrative-led',
    targetFinish: brief.finish || 'playable-prototype',
    immersion: value(brief.immersion),
    budget: value(brief.budget),
    notDoing: value(brief.notDoing),
    rating: value(brief.rating),
    mode: brief.mode || 'quick'
  };
}

/** 读 PRODUCT_BRIEF 表单：字段、枚举与投影一起给客户端，避免界面自己解析 Markdown。 */
export function readBriefForm(cwd, project) {
  const { id, root } = gameProjectRoot(cwd, project);
  const text = readText(root, GAME_FILES.brief) ?? '';
  const brief = parseBrief(text);
  return {
    project: id,
    title: firstHeading(text) ?? id,
    fields: briefFieldsOf(brief),
    enums: { targetFinish: TARGET_FINISHES, experienceProfile: EXPERIENCE_PROFILES },
    projection: gameProjection(cwd, id)
  };
}

/**
 * 保存 PRODUCT_BRIEF 表单：只改对应字段行，保留作者写在文件里的其他段落。
 * 枚举值不合法时拒绝写入，避免界面把工程推进到非法状态。
 */
export function saveBriefFields(cwd, project, fields = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  if (fields.targetFinish !== undefined && fields.targetFinish !== '' && !TARGET_FINISHES.includes(fields.targetFinish)) {
    throw new Error('targetFinish 必须是 ' + TARGET_FINISHES.join(' / '));
  }
  if (fields.experienceProfile !== undefined && fields.experienceProfile !== '' && !EXPERIENCE_PROFILES.includes(fields.experienceProfile)) {
    throw new Error('experienceProfile 必须是 ' + EXPERIENCE_PROFILES.join(' / '));
  }
  const file = join(root, GAME_FILES.brief);
  let text;
  if (existsSync(file)) {
    text = readFileSync(file, 'utf8');
  } else {
    const seed = {
      source: String(fields.sourceNovel ?? ''),
      platform: String(fields.platform ?? ''),
      language: String(fields.language ?? ''),
      audience: String(fields.audience ?? ''),
      play: String(fields.playDirection ?? ''),
      reference: String(fields.reference ?? ''),
      profile: String(fields.experienceProfile ?? 'narrative-led'),
      finish: String(fields.targetFinish ?? 'playable-prototype'),
      immersion: String(fields.immersion ?? ''),
      budget: String(fields.budget ?? ''),
      notDoing: String(fields.notDoing ?? ''),
      rating: String(fields.rating ?? ''),
      mode: String(fields.mode ?? 'quick')
    };
    text = briefTemplate(String(fields.title ?? id), seed);
  }
  text = setBriefTitle(text, fields.title);
  for (const [key, label] of Object.entries(BRIEF_LABELS)) {
    if (fields[key] === undefined) continue;
    const value = String(fields[key]).trim() === '' ? '待定' : String(fields[key]).trim();
    text = setBriefLine(text, label, value);
  }
  writeFileSync(file, text, 'utf8');
  return { project: id, path: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.brief, projection: gameProjection(cwd, id), form: readBriefForm(cwd, id) };
}

const STATUS_ICON = { done: '✓', partial: '△', pending: '·', skipped: '—', optional: '◇' };
const QA_ISOLATION_LABEL = { isolated: '已隔离', 'same-session': '同会话自审', unknown: '未记录' };

export function describeGameProjection(projection) {
  if (projection === undefined) {
    return [
      '# 互动游戏',
      '',
      '工作区里还没有互动游戏工程。',
      '',
      '下一步：',
      '1. 先跑 `toon_game_intake`，用用户原话确认是原创还是改编、目标平台与玩法；',
      '2. 再跑 `toon_game_project action=init` 建 `game-adaptations/<项目>/`；',
      '3. 先写 PRODUCT_BRIEF.md，再进入概念与设计，不要直接做美术或可玩构建。'
    ].join('\n');
  }
  const lines = [
    '# 互动游戏 · ' + projection.title,
    '',
    '项目：' + projection.root + ' · 阶段 ' + String(projection.counts.done) + '/' + String(projection.counts.total) + ' 完成',
    '完成度：' + projection.targetFinishLabel + ' · 体验主线：' + projection.experienceProfileLabel + ' · 来源：' + (projection.source === 'novel' ? '改编（' + projection.sourceValue + '）' : projection.source === 'original' ? '原创' : '未指定'),
    '可玩构建：' + (projection.previewReady ? '有（' + projection.previewPath + '）' : '无'),
    '验收：' + projection.verification.status + (projection.verification.status === 'PASS' || projection.verification.status === 'FAIL' ? '（六项 ' + String(projection.verification.passed) + '/' + String(projection.verification.total) + '）' : ''),
    '盲测隔离：' + (QA_ISOLATION_LABEL[projection.qaIsolation] ?? projection.qaIsolation),
    '',
    '阶段：',
    ...projection.stages.map((stage) => '- ' + (STATUS_ICON[stage.status] ?? '·') + ' ' + stage.label + ' · ' + stage.file + ' — ' + stage.detail),
    ''
  ];
  if (projection.nextStage === undefined) {
    lines.push('下一步：全部阶段已完成。最后核对 qa/verification.json 的六项是否都是实跑 PASS，并确认 BUILD_BRIEF 的限制项已写清。');
  } else {
    lines.push('下一步：' + projection.nextStage.label + '（' + projection.nextStage.file + '）', projection.nextStage.action);
  }
  if (projection.diagnostics.length > 0) {
    lines.push('', '诊断：', ...projection.diagnostics.map((item) => '- ' + item.message));
  }
  return lines.join('\n');
}

export function describeGameList(list) {
  if (list.projects.length === 0) {
    return [
      '# 互动游戏项目',
      '',
      '还没有游戏工程。先跑 `toon_game_intake` 识别需求，再跑 `toon_game_project action=init`。'
    ].join('\n');
  }
  return [
    '# 互动游戏项目',
    '',
    '当前：' + (list.active === '.' ? '未指定' : list.active),
    '',
    ...list.projects.map((project) => '- ' + project.id + ' · ' + project.title + ' · ' + String(project.counts.done) + '/' + String(project.counts.total) + ' 阶段' + (project.nextStage === undefined ? ' · 已完成' : ' · 下一步 ' + project.nextStage.label) + (project.previewReady ? ' · 可试玩' : '') + (project.active ? '（激活）' : ''))
  ].join('\n');
}

function describeStageList(stages) {
  return stages.map((stage) => '- ' + (STATUS_ICON[stage.status] ?? '·') + ' ' + stage.label + ' · ' + stage.file + (stage.status === 'skipped' ? '（跳过）' : '') + ' — ' + stage.detail);
}

export function describeGameIntake(result) {
  if (result.routed === false) {
    return [
      '# 互动游戏入口',
      '',
      '没有走游戏流程：' + result.reason + '。',
      '',
      '建议：' + result.suggestion,
      result.route === undefined ? '' : '工作台：' + result.route.tab + ' · 入口：' + result.route.tool
    ].filter((line) => line !== '').join('\n');
  }
  const intent = result.intent;
  const lines = [
    '# 互动游戏入口 · ' + (result.existing ? '继续现有工程' : '新工程提案'),
    '',
    '识别：互动游戏 · ' + actionLabel(intent.action) + '（置信度 ' + String(intent.confidence) + '）' + (intent.sourceMedium === undefined ? '' : ' · 来源媒介 ' + mediumLabel(intent.sourceMedium)),
    '项目：' + result.project + ' · ' + result.title + (result.existing ? '（已存在）' : '（待创建）'),
    '来源：' + (result.source === 'novel' ? '改编（先拆书）' : result.source === 'original' ? '原创' : '未指定') + ' · 完成度：' + (TARGET_LABELS[result.targetFinish] ?? result.targetFinish) + ' · 体验主线：' + (PROFILE_LABELS[result.experienceProfile] ?? result.experienceProfile),
    '',
    '阶段与证据文件：',
    ...describeStageList(result.projection.stages),
    '',
    '下一步：',
    ...result.actions.map((action, index) => String(index + 1) + '. ' + action.label + (typeof action.tool === 'string' && action.tool.startsWith('toon_') ? '（' + action.tool + '）' : '')),
    '',
    '提醒：',
    ...result.reminders.map((item) => '- ' + item)
  ];
  if (result.existing === false) {
    lines.push('', '用户确认后先建骨架：`toon_game_project action=init`，再只写 PRODUCT_BRIEF.md；不要一次铺满所有文档。');
  }
  return lines.join('\n');
}
