/**
 * 互动游戏盲测交接：把「谁来验收、读什么、禁止读什么、交什么」落成可执行任务书。
 *
 * 插件不能替宿主新建会话，但能把隔离要求变成文件与仓库内记录：
 * 创作会话写 blind-plan.json（记 authorSessionId），盲测会话用 toon_game_qa action=record 记自己的 id；
 * 两者不同才算隔离。投影据此把「同会话自审」判为未完成。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_DIRECTORY, GAME_FILES, gameProjectRoot, gameProjection } from './game.js';

function readText(root, relativePath) {
  const file = join(root, relativePath);
  if (!existsSync(file)) return undefined;
  try { return readFileSync(file, 'utf8'); } catch { return undefined; }
}

function readJson(root, relativePath) {
  const text = readText(root, relativePath);
  if (text === undefined) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

function writeJson(file, payload) {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function runtimeOf(buildBrief) {
  const section = /#\s*运行([\s\S]*?)(?=\n#\s|$)/.exec(buildBrief ?? '')?.[1] ?? '';
  const field = (key) => new RegExp('^\\s*' + key + '\\s*:\\s*(.+)$', 'm').exec(section)?.[1]?.trim() ?? '';
  return {
    targetRuntime: field('targetRuntime'),
    testedRuntime: field('testedRuntime'),
    engine: field('engine'),
    install: field('install'),
    start: field('start'),
    test: field('test'),
    verify: field('verify')
  };
}

export function qaIsolationOf(cwd, project) {
  const { id, root } = gameProjectRoot(cwd, project);
  const plan = readJson(root, GAME_FILES.qaPlan);
  const session = readJson(root, GAME_FILES.qaSession);
  const authorSessionId = typeof plan?.authorSessionId === 'string' && plan.authorSessionId !== '' ? plan.authorSessionId : undefined;
  const qaSessionId = typeof session?.sessionId === 'string' && session.sessionId !== '' ? session.sessionId : undefined;
  const status = authorSessionId === undefined || qaSessionId === undefined
    ? 'unknown'
    : (authorSessionId === qaSessionId ? 'same-session' : 'isolated');
  return { project: id, status, authorSessionId, qaSessionId, plan, session };
}

function isolationText(status) {
  if (status === 'isolated') return '已隔离：盲测会话与创作会话不同。';
  if (status === 'same-session') return '未隔离：当前记录的盲测会话就是创作会话；结论不可信，请换新会话重跑。';
  return '未记录：盲测会话需要用 toon_game_qa action=record 登记自己的会话 id。';
}

export function readQaBrief(cwd, project) {
  const { id, root } = gameProjectRoot(cwd, project);
  return {
    project: id,
    plan: readJson(root, GAME_FILES.qaPlan),
    session: readJson(root, GAME_FILES.qaSession),
    brief: readText(root, GAME_FILES.qaBrief) ?? '',
    prompt: (() => {
      const plan = readJson(root, GAME_FILES.qaPlan);
      return plan === undefined ? '' : buildQaPrompt(id, plan.runtime ?? {});
    })(),
    isolation: qaIsolationOf(cwd, id)
  };
}

export function buildQaPrompt(project, runtime) {
  const start = runtime.start === '' ? '按 BUILD_BRIEF「# 运行」启动' : runtime.start;
  return '你是一个没读过源码和设计文档的盲测玩家。先只读 game-adaptations/' + project + '/qa/盲测任务.md 与 BUILD_BRIEF.md 的「# 运行」一节，按「' + start + '」启动游戏，从标题页开始玩到至少一个设计结局；首轮结束前不要读游戏源码、剧本文档、SOURCE_BIBLE/CONCEPT/GAME_DESIGN/ART_DIRECTION/_progress 或历史验收报告。盲玩结束后再核对设计并运行 verify 命令，最后生成 qa/playtest-report.md 与 qa/verification.json（schema v3，六项实跑 PASS/FAIL/NOT_RUN），并运行 toon_game_qa action=record 记录本会话 id。';
}

/** 生成盲测任务书与交接记录；不包含任何设计/剧情细节，避免污染盲玩。 */
export function writeQaBrief(cwd, { project, authorSessionId, note } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  const buildBrief = readText(root, GAME_FILES.buildBrief);
  const runtime = runtimeOf(buildBrief);
  const plan = {
    schemaVersion: 1,
    project: id,
    authorSessionId: typeof authorSessionId === 'string' ? authorSessionId : '',
    createdAt: new Date().toISOString(),
    status: 'planned',
    ...(typeof note === 'string' && note.trim() !== '' ? { note: note.trim() } : {}),
    runtime
  };
  const brief = [
    '# 盲测任务 · ' + id,
    '',
    '> 本文件只写给盲测会话。不要在这里补设计说明；设计细节留在 design/，首轮盲玩结束前不许读。',
    '',
    '## 隔离规则',
    '',
    '- 在未参与编码的新会话执行；不要在创作会话里自审。',
    '- 首轮盲玩结束前，禁止阅读：游戏源码、剧本/分支数据、测试脚本、`analysis/SOURCE_BIBLE.md`、`concepts/CONCEPT.md`、`design/GAME_DESIGN.md`、`design/ART_DIRECTION.md`、`_progress.md`、历史 `qa/playtest-report.md` 与提交历史。',
    '- 只允许读：`build/BUILD_BRIEF.md` 的「# 运行」一节，以及 `PRODUCT_BRIEF.md` 的视口与分级边界；两者矛盾时报错退回，不自行猜。',
    '- 不注入存档、不调内部接口、不看隐藏 DOM 或内存变量；只用屏幕画面、声音与正常输入。',
    '',
    '## 启动',
    '',
    '- 目标运行环境：' + (runtime.targetRuntime || '未写（先补 BUILD_BRIEF # 运行）'),
    '- 本次实际环境：' + (runtime.testedRuntime || '待记录'),
    '- 引擎：' + (runtime.engine || '待记录'),
    '- 启动：`' + (runtime.start || '待填') + '`',
    '- 测试：`' + (runtime.test || '待填') + '`',
    '- 端到端验证：`' + (runtime.verify || '待填') + '`',
    '',
    '## 六项必测',
    '',
    '- `launch`：在本次实际环境启动，无阻断报错。',
    '- `render`：画面非空，并随时间或操作发生看得见的变化。',
    '- `input`：真实输入触发可观察的状态变化。',
    '- `coreLoop`：核心循环完整跑通。',
    '- `outcome`：到达至少一个设计结局。',
    '- `restart`：重开后干净回到初态；刷新后存档能恢复。',
    '',
    '盲玩结束后再读设计文档做第二轮核对；把困惑分成「实现/引导缺陷」与「设计有意的边界」。',
    '',
    '## 交付',
    '',
    '- `qa/playtest-report.md`：盲玩诊断、P0/P1 问题、体验与视口问题、无法覆盖项。',
    '- `qa/verification.json`：schema v3，`checks` 恰好六个键，状态只取 `NOT_RUN` / `FAIL` / `PASS`；没跑过不算通过。',
    '- 运行 `toon_game_qa action=record`：把本盲测会话 id 写入 `qa/session.json`，让投影确认隔离。',
    '',
    '## 禁止',
    '',
    '- 不用占位图、假数据或历史截图冒充当前构建。',
    '- 不把「流程跑通」说成「好玩 / 数值平衡 / 已达上线水准」。',
    '- 不为了过检查绕过界面；盲玩证实的 P0 必须记 FAIL。',
    ''
  ].join('\n');
  const briefFile = join(root, GAME_FILES.qaBrief);
  mkdirSync(join(briefFile, '..'), { recursive: true });
  writeFileSync(briefFile, brief, 'utf8');
  writeJson(join(root, GAME_FILES.qaPlan), plan);
  return {
    project: id,
    path: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.qaBrief,
    planPath: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.qaPlan,
    plan,
    prompt: buildQaPrompt(id, runtime),
    isolation: qaIsolationOf(cwd, id),
    projection: gameProjection(cwd, id)
  };
}

/** 盲测会话登记自己的 session id；重复调用只更新记录。 */
export function recordQaSession(cwd, { project, sessionId, note } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  const value = String(sessionId ?? '').trim();
  if (value === '') throw new Error('缺少 sessionId：在盲测会话里运行，或显式传入会话 id');
  const payload = {
    schemaVersion: 1,
    project: id,
    sessionId: value,
    recordedAt: new Date().toISOString(),
    ...(typeof note === 'string' && note.trim() !== '' ? { note: note.trim() } : {})
  };
  writeJson(join(root, GAME_FILES.qaSession), payload);
  return { project: id, path: GAME_DIRECTORY + '/' + id + '/' + GAME_FILES.qaSession, session: payload, isolation: qaIsolationOf(cwd, id), projection: gameProjection(cwd, id) };
}

export function describeQaBrief(state) {
  const lines = [
    '# 盲测交接 · ' + state.project,
    '',
    '任务书：' + state.path,
    '交接记录：' + state.planPath,
    '隔离：' + isolationText(state.isolation.status),
    '',
    '在未参与编码的新会话里发送下面这段：',
    '',
    state.prompt,
    '',
    '盲测会话产出 `qa/playtest-report.md` 与 `qa/verification.json`，再运行 `toon_game_qa action=record`。'
  ];
  return lines.join('\n');
}

export function describeQaStatus(state) {
  return [
    '# 盲测状态 · ' + state.project,
    '',
    '隔离：' + isolationText(state.status),
    state.authorSessionId === undefined ? '' : '创作会话：' + state.authorSessionId,
    state.qaSessionId === undefined ? '' : '盲测会话：' + state.qaSessionId
  ].filter((line) => line !== '').join('\n');
}
