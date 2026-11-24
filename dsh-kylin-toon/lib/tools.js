/**
 * 工具面：生产意图、镜头质检、时间线装配、配音质检、模型择优、交付闸门。
 *
 * 分工：工具做确定性计算与落盘；技能负责「什么时候用哪种能力」；
 * 媒体生成不在插件里实现，由多媒体网关插件（media_*）提供。
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { projectEpisode } from './drama.js';
import { DRAMA_DIRECTORY, DRAMA_FILES } from './paths.js';
import { pushIntent } from './intents.js';
import { analyzeSegments, parseSubtitle } from './video/audio-qc.js';
import { evaluateGates } from './video/gates.js';
import { assembleTimeline, findClipForShot, probeMedia, resolveFfmpeg, TIMELINE_TRANSITIONS } from './video/timeline.js';
import { planSlot, recordOutcome, setPin } from './video/routing.js';
import { createReferenceTools, readReference } from './reference.js';
import { describeMotion, motionTemplate, validateMotion } from './motion.js';
import { parseEditList } from './timeline.js';
import { createDramaVersion, describeDramaVersions, listDramaVersions, restoreDramaVersion } from './drama-versions.js';
import { applyRecipe, describeRecipes, getRecipe } from './drama-recipes.js';
import { applyTemplate, createTemplate, describeTemplates, getTemplate, listTemplates } from './drama-templates.js';
import { readRecreatePlan, writeRecreatePlan } from './recreate.js';
import { compositionStatus, renderComposition, repairComposition, scaffoldComposition, startStudio, stopStudio } from './hyperframes.js';
import { buildAdaptation, buildChapterTask, buildPublish, chapterContext, createChapter, describeNovel, finalizeChapter, importNovel, initNovel, listNovelProjects, novelProjection, removeCharacter, removeWorldEntry, reviewChapter, scanChapters, setActiveNovel, upsertCharacter, upsertWorldEntry } from './novel.js';
import { classifyCreativeIntent, describeIntent } from './intent.js';
import { describeGameIntake, describeGameList, describeGameProjection, gameIntake, gameProjection, initGameProject, listGameProjects, readBriefForm, saveBriefFields, setActiveGame } from './game.js';
import { applyStageTemplate, chooseConcept, listConceptOptions, stageTemplate } from './game-stage.js';
import { createSnapshot, deleteSnapshot, describeSnapshots, listSnapshots, restoreSnapshot } from './game-snapshots.js';
import { describeQaBrief, describeQaStatus, qaIsolationOf, recordQaSession, writeQaBrief } from './game-qa.js';

function textOutput(title) {
  return {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: String(value) }],
    presentationMeta: () => ({ title })
  };
}

async function cwdOf(exec, workingDirectory) {
  try {
    if (workingDirectory !== undefined && workingDirectory !== null && exec?.agent?.session !== undefined) {
      if (typeof workingDirectory.get === 'function') return resolve(workingDirectory.get(exec.agent.session));
      if (typeof workingDirectory.ensure === 'function') return resolve(await workingDirectory.ensure(exec.agent, exec.signal));
    }
  } catch { /* 目录服务异常时退回进程目录 */ }
  return process.cwd();
}

function stateDir(cwd) {
  return join(cwd, '.kylin-toon');
}

async function writeReport(cwd, name, payload) {
  const dir = join(stateDir(cwd), 'qc');
  await mkdir(dir, { recursive: true });
  const file = join(dir, name);
  await writeFile(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return file;
}

async function loadEpisode(cwd, requested) {
  const episodes = [];
  const base = join(cwd, DRAMA_DIRECTORY);
  if (existsSync(base)) {
    const { readdir } = await import('node:fs/promises');
    for (const entry of await readdir(base, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      episodes.push({ id: entry.name, directory: DRAMA_DIRECTORY + '/' + entry.name });
    }
  }
  const rootDocuments = DRAMA_FILES.filter((kind) => existsSync(join(cwd, kind)));
  if (rootDocuments.length > 0) episodes.unshift({ id: '本集', directory: '.' });
  const picked = requested !== undefined && requested !== '' ? episodes.find((item) => item.id === requested || item.directory === requested) : episodes[0];
  if (picked === undefined) throw new Error('找不到剧集；先写 剧集/<EP>/剧本.md，或在项目根写 剧本.md');
  const documents = new Map();
  for (const kind of DRAMA_FILES) {
    const file = picked.directory === '.' ? join(cwd, kind) : join(cwd, picked.directory, kind);
    if (!existsSync(file)) continue;
    documents.set(kind, await readFile(file, 'utf8'));
  }
  const projectDir = picked.directory === '.' ? cwd : join(cwd, picked.directory);
  const media = [];
  const { readdir } = await import('node:fs/promises');
  async function walk(current, depth) {
    if (depth > 3) return;
    let entries = [];
    try { entries = await readdir(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute, depth + 1);
      else if (/\.(png|jpe?g|webp|gif|mp4|webm|mov|mp3|wav|m4a)$/i.test(entry.name)) media.push(absolute);
    }
  }
  await walk(projectDir, 0);
  const projection = projectEpisode({ id: picked.id, directory: picked.directory, media: media.map((path) => path.slice(cwd.length + 1)), outputs: media.filter((path) => path.includes('制作成果')).map((path) => path.slice(cwd.length + 1)) }, [...documents].map(([kind, content]) => ({ kind, content })));
  return { ...picked, projectDir, documents, projection };
}

function describeDiagnostics(projection) {
  const lines = [];
  if (projection.shots.length === 0) lines.push('- 分镜.md 里没有识别到镜头块（用 ## S01-01 或表格行）');
  const blockers = projection.diagnostics.filter((item) => ['shot-state-discontinuous', 'duplicate-id', 'prompt-without-shot', 'segment-overlap'].includes(item.code));
  const warnings = projection.diagnostics.filter((item) => !blockers.includes(item));
  for (const item of blockers) lines.push('- 阻断 ' + (item.line === undefined ? '' : '第 ' + String(item.line) + ' 行 ') + item.message);
  for (const item of warnings.slice(0, 12)) lines.push('- 提示 ' + (item.line === undefined ? '' : '第 ' + String(item.line) + ' 行 ') + item.message);
  if (warnings.length > 12) lines.push('- 另有 ' + String(warnings.length - 12) + ' 条提示，见质检报告');
  return lines;
}

export function createTools(options) {
  const { workingDirectory, version } = options;
  const tools = [
    {
      name: 'toon_production',
      output: textOutput('KToon 生产投影'),
      description: '只更新创作台的生产投影：打开某个区块、聚焦某个镜头、设定成片顺序、登记正在跑的任务。没有文件、网络或计费副作用；付费生成仍然必须由创作者在对话里确认。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['open_section', 'focus_target', 'set_sequence', 'track_job', 'focus_workspace'], description: '投影动作' },
          episode: { type: 'string', description: '剧集目录，如 剧集/EP001；缺省用当前集' },
          kind: { type: 'string', enum: ['story', 'drama', 'game', 'video'], description: 'focus_workspace：切到哪个工作台' },
          section: { type: 'string', enum: ['shots', 'assets', 'tasks', 'sequence', 'canvas', 'reference'], description: 'open_section 的目标区块' },
          targetId: { type: 'string', description: 'focus_target 的镜头/素材/任务 ID' },
          shotIds: { type: 'array', items: { type: 'string' }, description: 'set_sequence：明确的镜头顺序，写全量' },
          jobId: { type: 'string', description: 'track_job：本轮 Agent 实际提交的任务 ID' },
          jobKind: { type: 'string', enum: ['image', 'video', 'composition'], description: 'track_job：任务类型' },
          expectedOutputs: { type: 'number', description: 'track_job：预计产物数；再次登记时省略即沿用' },
          prompt: { type: 'string', description: 'track_job：本任务的确切提示词/规格（不是付费授权）' }
        },
        additionalProperties: false
      },
      timeoutMs: 15000,
      execute: async (args, exec) => {
        const sessionId = exec?.agent?.session?.id ?? '';
        const entry = pushIntent(sessionId, {
          action: args.action,
          ...(args.episode === undefined ? {} : { episode: args.episode }),
          ...(args.section === undefined ? {} : { section: args.section }),
          ...(args.targetId === undefined ? {} : { targetId: args.targetId }),
          ...(args.shotIds === undefined ? {} : { shotIds: args.shotIds }),
          ...(args.jobId === undefined ? {} : { jobId: args.jobId }),
          ...(args.jobKind === undefined ? {} : { jobKind: args.jobKind }),
          ...(args.expectedOutputs === undefined ? {} : { expectedOutputs: args.expectedOutputs }),
          ...(args.prompt === undefined ? {} : { prompt: args.prompt }),
          ...(args.kind === undefined ? {} : { kind: args.kind })
        });
        return '已更新创作台投影：' + args.action + (args.episode === undefined ? '' : ' · ' + args.episode) + '（意图 #' + String(entry.id) + '）。';
      }
    },
    {
      name: 'toon_shot_qc',
      output: textOutput('镜头质检'),
      description: '按 KToon 镜头叙事契约检查本集分镜：镜头 ID、时长、入场/出场状态跨镜衔接、转场白名单，以及提示词与镜头的断链。返回阻断与提示清单，并把报告写到 .kylin-toon/qc/。',
      parameters: {
        type: 'object',
        properties: {
          episode: { type: 'string', description: '剧集目录或剧集 ID；缺省用第一集' }
        },
        additionalProperties: false
      },
      timeoutMs: 60000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        const report = {
          schemaVersion: 1,
          episode: episode.id,
          at: new Date().toISOString(),
          shots: episode.projection.shots,
          diagnostics: episode.projection.diagnostics,
          ok: !episode.projection.diagnostics.some((item) => ['shot-state-discontinuous', 'duplicate-id', 'prompt-without-shot'].includes(item.code))
        };
        const file = await writeReport(cwd, episode.id + '-shots.json', report);
        const header = ['# 镜头质检 · ' + episode.id, '', '镜头：' + String(episode.projection.shots.length) + ' 个 · 阻断 ' + (report.ok ? '0' : '有') + ' · 报告 ' + file, ''];
        const lines = describeDiagnostics(episode.projection);
        if (lines.length === 0) lines.push('- 没有发现契约问题');
        return [...header, ...lines].join('\n');
      }
    },
    {
      name: 'toon_composition',
      output: textOutput('HTML 工程'),
      description: 'Hyperframes HTML 工程：status 检查 composition/index.html 与 lint；scaffold 从分镜生成可编辑工程（优先读剪辑单的源/入出点/输出起点，嵌入分镜视频与配音/音乐）；repair 清理旧场景里重复的计时元素；studio 启动官方 Studio 并返回引擎浏览器可嵌入的反代地址；render 用 Hyperframes 渲染 MP4 并做 ffprobe 技术验证；stop 停止 Studio。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['status', 'scaffold', 'repair', 'render', 'studio', 'stop'] },
          episode: { type: 'string', description: '剧集目录或 ID；缺省用第一集' },
          width: { type: 'number', description: 'scaffold：画宽，缺省 1080' },
          height: { type: 'number', description: 'scaffold：画高，缺省 1920' },
          fps: { type: 'number', description: 'scaffold：帧率，缺省 30' },
          output: { type: 'string', description: 'render：输出路径，缺省 制作成果/成片/<EP>-html.mp4' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 900000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        if (args.action === 'status') {
          const status = await compositionStatus(cwd, episode, { projection: episode.projection });
          return JSON.stringify(status, null, 2);
        }
        if (args.action === 'scaffold') {
          const clips = parseEditList(episode.documents.get('剪辑单.md') ?? '').filter((row) => row.source !== '');
          const result = scaffoldComposition(cwd, episode, episode.projection, { width: args.width, height: args.height, fps: args.fps, media: episode.media ?? [], clips });
          return (result.created ? '已生成 ' : '已存在，未覆盖 ') + result.path + '\n\n镜头 ' + String(result.scenes?.length ?? 0) + ' 个 · ' + String(result.duration?.toFixed?.(2) ?? '?') + 's · GSAP ' + String(result.gsap ?? 'local') + '\n\n下一步：用引擎自带浏览器打开 Studio 编辑，或直接 render。';
        }
        if (args.action === 'studio') {
          const result = await startStudio(cwd, episode);
          return 'Studio 反代已启动：' + result.proxyUrl + '\n官方地址：' + result.studioUrl + '\n\n用本次会话的引擎浏览器打开反代地址（不要开系统浏览器）；反代已剥掉 frame-ancestors/X-Frame-Options。';
        }
        if (args.action === 'stop') {
          const result = await stopStudio(cwd, episode);
          return result.stopped ? 'Studio 已停止。' : 'Studio 未在运行。';
        }
        if (args.action === 'repair') {
          const result = repairComposition(cwd, episode);
          return '已扫描 ' + String(result.scanned) + ' 个场景，修复 ' + String(result.changed.length) + ' 个：' + (result.changed.join('、') || '无') + '\n\n现在每个场景只保留 stage 或 media 一个计时元素。';
        }
        const result = await renderComposition(cwd, episode, { output: args.output });
        const lines = ['# Hyperframes 渲染 · ' + episode.id, '', '成片：' + result.output, '技术验证：' + (result.ok ? '通过' : '未通过'), '源哈希：' + String(result.sourceHash), '成片哈希：' + String(result.outputSha256), '报告：' + result.report];
        for (const check of result.checks) if (!check.ok) lines.push('- 未通过 ' + check.id + '：期望 ' + String(check.expected) + '，实际 ' + String(check.actual));
        return lines.join('\n');
      }
    },
    {
      name: 'toon_recreate',
      output: textOutput('复刻计划'),
      description: '参考复刻计划：plan 读取参考片分析/已选方案/版权，结合本集分镜生成「保持/替换/可编辑表示/声音/4 个同刻比对/交付口径」的 复刻计划.md；read 只读。只写计划，不改分镜。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['plan', 'read'] },
          episode: { type: 'string', description: '剧集目录或 ID；缺省用第一集' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        if (args.action === 'read') {
          const plan = readRecreatePlan(cwd, episode);
          return plan === undefined ? '还没有 复刻计划.md：先 toon_recreate action=plan。' : plan.text;
        }
        const record = readReference(cwd);
        const result = writeRecreatePlan(cwd, episode, episode.projection, record);
        return '已写入 ' + result.path + '\n\n' + result.text;
      }
    },
    {
      name: 'toon_template',
      output: textOutput('短剧模板包'),
      description: '短剧模板包：create 把一集已验证的结构固化成 kt-template.json + TEMPLATE.md + preset.json（含 sha256；结构支持 分镜.md / 镜头表.md / 03-镜头表.md 等）；list/get 查看；apply 生成本集「模板改编计划」，不覆盖分镜。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get', 'create', 'apply'] },
          id: { type: 'string', description: '模板 id' },
          name: { type: 'string', description: 'create：模板名，缺省用剧集 ID' },
          description: { type: 'string', description: 'create：模板说明' },
          episode: { type: 'string', description: 'create/apply：剧集目录或 ID' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'list') return describeTemplates(listTemplates(cwd));
        if (args.action === 'get') {
          if (args.id === undefined) throw new Error('get 需要 id');
          const template = getTemplate(cwd, args.id);
          return ['# ' + template.manifest.name + ' v' + template.manifest.version, '', '模板：' + template.path, '校验：' + (template.ok ? '通过' : '失败 ' + template.invalid.map((item) => item.path + '（' + item.reason + '）').join('、')), '', '## TEMPLATE.md', '', template.template, '', '## preset.json', '```json', JSON.stringify(template.preset, null, 2), '```'].join('\n');
        }
        const episode = await loadEpisode(cwd, args.episode);
        if (args.action === 'create') {
          const result = createTemplate(cwd, episode, { name: args.name, description: args.description });
          return '已创建模板 ' + result.path + '\n\n' + describeTemplates(listTemplates(cwd));
        }
        if (args.id === undefined) throw new Error('apply 需要 id');
        const result = applyTemplate(cwd, episode, args.id);
        return '已生成 ' + result.path + '\n\n' + result.text;
      }
    },
    {
      name: 'toon_recipe',
      output: textOutput('节奏配方'),
      description: '短剧/漫剧节奏配方：list 列出内置镜头结构（冷开场/反转/竖屏正反打/蒙太奇/回忆/悬念/打斗/集尾/情绪/线索），get 读单个配方，apply 在本集 recipes/ 生成镜头骨架建议（不改分镜）。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get', 'apply'] },
          id: { type: 'string', description: '配方 id，如 cold-open-hook' },
          episode: { type: 'string', description: 'apply：剧集目录或 ID' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        if (args.action === 'list') return describeRecipes();
        if (args.id === undefined) throw new Error('get/apply 需要 id');
        const recipe = getRecipe(args.id);
        if (recipe === undefined) throw new Error('配方不存在：' + args.id);
        if (args.action === 'get') {
          return ['# ' + recipe.name, '', '- 类型：' + recipe.kind, '- 时长：' + recipe.durationHint, '- 用途：' + recipe.summary, '', '## 镜头骨架', '', '| # | 作用 | 时长(s) | 机位 | 声音 | 画面提示 |', '| --- | --- | --- | --- | --- | --- |', ...recipe.beats.map((beat, index) => '| ' + String(index + 1) + ' | ' + beat.role + ' | ' + String(beat.seconds) + ' | ' + beat.camera + ' | ' + beat.sound + ' | ' + beat.prompt + ' |'), '', '## 保持', '', ...recipe.keep.map((item) => '- ' + item), '', '## 检查', '', ...recipe.checks.map((item) => '- ' + item)].join('\n');
        }
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        const result = applyRecipe(cwd, episode, args.id);
        return '已生成 ' + result.path + '\n\n' + result.text;
      }
    },
    {
      name: 'toon_drama_version',
      output: textOutput('本集版本'),
      description: '短剧/漫剧源文件版本：create 冻结本集创作文档（含 MOTION.md）与 composition 的 HTML/JSON（不含 assets）、list 列版本、restore 恢复；恢复前自动快照，恢复后生成新 vN，不删除后续历史。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['create', 'list', 'restore'] },
          episode: { type: 'string', description: '剧集目录或 ID；缺省用第一集' },
          id: { type: 'string', description: 'restore：目标版本，如 v2' },
          summary: { type: 'string', description: 'create：版本说明' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        if (args.action === 'list') return describeDramaVersions(listDramaVersions(cwd, episode));
        if (args.action === 'create') {
          const result = createDramaVersion(cwd, episode, { summary: args.summary });
          return '已创建 v' + String(result.version.versionNumber) + '（' + String(result.version.files.length) + ' 文件）\n\n' + describeDramaVersions(listDramaVersions(cwd, episode));
        }
        if (args.id === undefined) throw new Error('restore 需要 id，例如 v2');
        const result = restoreDramaVersion(cwd, episode, args.id);
        return '已恢复 ' + result.restored + '；恢复前快照 ' + (result.backupVersion ?? '无') + '，新版本 v' + String(result.version.versionNumber) + '\n\n' + describeDramaVersions(listDramaVersions(cwd, episode));
      }
    },
    {
      name: 'toon_motion',
      output: textOutput('Motion 契约'),
      description: 'Motion.md 契约：template 从分镜生成镜头时间轴骨架；apply 落盘（已有不覆盖）；validate 校验镜头集合/顺序/时长/转场与证据；read 只读摘要。阻断项会进入本集诊断与 G1 闸门。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['template', 'apply', 'validate', 'read'], description: 'template=生成文本；apply=写入 MOTION.md；validate=校验；read=只读' },
          episode: { type: 'string', description: '剧集目录或 ID；缺省用第一集' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        const file = join(episode.projectDir, 'MOTION.md');
        const generate = () => motionTemplate({
          title: episode.id,
          episode: episode.id,
          shots: episode.projection.shots,
          ...(readReference(cwd)?.source?.path === undefined ? {} : { referencePath: readReference(cwd).source.path })
        });
        if (args.action === 'template') return generate();
        if (args.action === 'apply') {
          if (existsSync(file)) return '已有 ' + episode.directory + '/MOTION.md，不覆盖。先用 toon_motion action=validate 检查，或直接改文件。';
          const text = generate();
          await writeFile(file, text, 'utf8');
          return '已写入 ' + episode.directory + '/MOTION.md\n\n' + describeMotion(validateMotion(text, { shots: episode.projection.shots }));
        }
        const text = existsSync(file) ? await readFile(file, 'utf8') : '';
        const result = validateMotion(text, { shots: episode.projection.shots, reference: /参考|复刻|拍同款/.test(text) });
        return describeMotion(result);
      }
    },
    {
      name: 'toon_assemble',
      output: textOutput('时间线装配'),
      description: '把本集镜头按入出点装配成样片或成片：可指定画幅、帧率、逐切点转场（cut/fade/dissolve/wipeleft/slideup/flash），按镜头 ID 自动找 制作成果/片段 或 素材/ 里的视频。需要本机 ffmpeg。',
      parameters: {
        type: 'object',
        properties: {
          episode: { type: 'string', description: '剧集目录或 ID' },
          output: { type: 'string', description: '相对本集的输出路径；缺省 制作成果/成片/成片.mp4' },
          width: { type: 'number' },
          height: { type: 'number' },
          fps: { type: 'number' },
          transition: { type: 'string', description: '全局默认转场' },
          transitionSec: { type: 'number' },
          clips: {
            type: 'array',
            description: '显式片段；省略时按分镜镜头 + 素材文件自动匹配',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' }, inSec: { type: 'number' }, outSec: { type: 'number' },
                transition: { type: 'string' }, transitionSec: { type: 'number' }
              },
              required: ['path'],
              additionalProperties: false
            }
          },
          audioPath: { type: 'string', description: '成片音轨（相对本集）' }
        },
        additionalProperties: false
      },
      timeoutMs: 900000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        let clips = args.clips;
        if (clips === undefined) {
          const editRows = parseEditList(episode.documents.get('剪辑单.md') ?? '').filter((row) => row.source !== '');
          if (editRows.length > 0) {
            clips = editRows.map((row) => {
              let source = row.source;
              if (episode.directory !== '.' && source.startsWith(episode.directory + '/')) source = source.slice(episode.directory.length + 1);
              return {
                path: source,
                inSec: Number.isFinite(row.inSec) ? row.inSec : 0,
                outSec: Number.isFinite(row.outSec) ? row.outSec : (Number.isFinite(row.duration) ? row.duration : 5),
                ...(row.transition === '' ? {} : { transition: row.transition })
              };
            });
          } else {
            clips = [];
          }
        }
        if (clips === undefined || (clips.length === 0 && args.clips === undefined)) {
          for (const shot of episode.projection.shots) {
            if (shot.id === undefined) continue;
            const found = findClipForShot(episode.projectDir, shot.id);
            if (found === undefined) continue;
            let duration = shot.duration > 0 ? shot.duration : 0;
            if (duration === 0) {
              try { duration = (await probeMedia(join(episode.projectDir, found))).durationSec; } catch { duration = 5; }
            }
            clips.push({ path: found, inSec: 0, outSec: Math.max(0.2, duration), ...(shot.transitionOut === '' ? {} : { transition: shot.transitionOut }) });
          }
        }
        if (clips.length === 0) throw new Error('没有可用片段：先把镜头视频生成到 制作成果/片段/（文件名带镜头 ID），或用 clips 显式指定');
        const output = args.output ?? '制作成果/成片/成片.mp4';
        const result = await assembleTimeline({
          projectPath: episode.projectDir,
          clips,
          output,
          ...(args.width === undefined ? {} : { width: args.width }),
          ...(args.height === undefined ? {} : { height: args.height }),
          ...(args.fps === undefined ? {} : { fps: args.fps }),
          ...(args.transition === undefined ? {} : { transition: args.transition }),
          ...(args.transitionSec === undefined ? {} : { transitionSec: args.transitionSec }),
          ...(args.audioPath === undefined ? {} : { audioPath: args.audioPath })
        });
        const actual = await probeMedia(join(episode.projectDir, output));
        const checks = [
          { id: 'video', ok: actual.hasVideo, expected: '有视频流', actual: actual.hasVideo ? '有' : '无' },
          { id: 'width', ok: actual.width === result.width, expected: result.width, actual: actual.width },
          { id: 'height', ok: actual.height === result.height, expected: result.height, actual: actual.height },
          { id: 'fps', ok: Math.abs(actual.fps - result.fps) <= 0.05, expected: result.fps, actual: actual.fps },
          { id: 'duration', ok: Math.abs(actual.durationSec - result.durationSec) <= Math.max(0.5, result.durationSec * 0.02), expected: result.durationSec, actual: actual.durationSec },
          ...(args.audioPath === undefined ? [] : [{ id: 'audio', ok: actual.hasAudio, expected: '有音轨', actual: actual.hasAudio ? '有' : '无' }])
        ];
        const verification = { ok: checks.every((check) => check.ok), expected: { width: result.width, height: result.height, fps: result.fps, durationSec: result.durationSec, audio: args.audioPath !== undefined }, actual, checks };
        const report = await writeReport(cwd, episode.id + '-assemble.json', { schemaVersion: 1, episode: episode.id, at: new Date().toISOString(), result, verification });
        const lines = ['# 时间线装配 · ' + episode.id, '', '片段 ' + String(result.clips) + ' 个 · ' + String(result.width) + '×' + String(result.height) + ' · ' + String(result.fps) + 'fps · 约 ' + String(result.durationSec) + 's', '输出：' + result.output, '技术验证：' + (verification.ok ? '通过' : '未通过'), '报告：' + report];
        for (const check of checks) {
          if (!check.ok) lines.push('- 未通过 ' + check.id + '：期望 ' + String(check.expected) + '，实际 ' + String(check.actual));
        }
        if (!verification.ok) lines.push('结论：成片已生成，但规格/解码验证未通过；不要宣称交付通过。');
        return lines.join('\n');
      }
    },
    {
      name: 'toon_audio_qc',
      output: textOutput('配音质检'),
      description: '检查配音表演：逐段语速、停顿、重叠，以及语速变异系数（低于 0.18 判定接近念课文），并核对表演风格是否真的接线到 TTS。可传字幕路径或直接给分段。',
      parameters: {
        type: 'object',
        properties: {
          episode: { type: 'string' },
          subtitlePath: { type: 'string', description: '相对本集的 SRT/VTT 路径' },
          segments: {
            type: 'array',
            items: {
              type: 'object',
              properties: { text: { type: 'string' }, startSec: { type: 'number' }, endSec: { type: 'number' }, style: { type: 'string' }, styleSource: { type: 'string' } },
              required: ['text', 'startSec', 'endSec'],
              additionalProperties: false
            }
          }
        },
        additionalProperties: false
      },
      timeoutMs: 60000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        let segments = args.segments ?? [];
        let subtitlePath = args.subtitlePath;
        if (segments.length === 0) {
          const candidates = ['制作成果/字幕/成片.srt', '制作成果/字幕/成片.vtt', '成片.srt', '字幕.srt'];
          subtitlePath = subtitlePath ?? candidates.find((path) => existsSync(join(episode.projectDir, path)));
          if (subtitlePath !== undefined && existsSync(join(episode.projectDir, subtitlePath))) {
            segments = parseSubtitle(await readFile(join(episode.projectDir, subtitlePath), 'utf8'));
          }
        }
        if (segments.length === 0) throw new Error('没有可分析的分段：给 segments，或把字幕放在 制作成果/字幕/成片.srt');
        const analysis = analyzeSegments(segments);
        const report = { schemaVersion: 1, episode: episode.id, at: new Date().toISOString(), subtitlePath, ...analysis };
        const file = await writeReport(cwd, episode.id + '-audio.json', report);
        const lines = ['# 配音质检 · ' + episode.id, '', '段数 ' + String(analysis.metrics.count) + ' · 平均语速 ' + String(analysis.metrics.meanRate) + ' 字/秒 · 变异系数 ' + String(analysis.metrics.rateCv), '报告：' + file, ''];
        for (const blocker of analysis.blockers) lines.push('- 阻断 ' + blocker.message);
        for (const warning of analysis.warnings.slice(0, 12)) lines.push('- 提示 ' + warning.message);
        if (analysis.blockers.length === 0 && analysis.warnings.length === 0) lines.push('- 没有发现表演问题');
        return lines.join('\n');
      }
    },
    {
      name: 'toon_route',
      output: textOutput('模型择优'),
      description: '媒体模型路由：auto 按实测成功率/延迟给候选池打分择优并解释理由，pin 由作者指定。插件不调用任何供应商；候选池来自多媒体网关的 media_models，实测结果用 record 回写。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['plan', 'set', 'record'], description: 'plan=择优选模；set=auto/pin；record=回写实测' },
          slot: { type: 'string', description: '槽位：image/video/tts/music/lipsync 或自定义名' },
          mode: { type: 'string', enum: ['auto', 'pin'], description: 'set 用' },
          model: { type: 'string' },
          candidates: { type: 'array', description: 'plan：来自 media_models 的候选 {id,label,tier,available}', items: { type: 'object', additionalProperties: true } },
          outcome: { type: 'string', enum: ['success', 'failure'] },
          elapsedMs: { type: 'number' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const slot = args.slot ?? 'image';
        if (args.action === 'set') {
          if (args.mode === undefined) throw new Error('set 需要 mode=auto|pin');
          if (args.mode === 'pin' && (args.model === undefined || args.model === '')) throw new Error('pin 需要 model');
          const result = setPin(cwd, slot, args.mode, args.model ?? '');
          return '槽位 ' + slot + ' 已设为 ' + result.mode + (result.model === undefined ? '' : '：' + result.model) + '。';
        }
        if (args.action === 'record') {
          if (args.model === undefined || args.outcome === undefined) throw new Error('record 需要 model 与 outcome');
          const stat = recordOutcome(cwd, args.model, { outcome: args.outcome, elapsedMs: args.elapsedMs });
          return '已回写 ' + args.model + '：成功 ' + String(stat.success) + ' / 失败 ' + String(stat.failure) + '，累计 ' + String(stat.totalMs) + 'ms。';
        }
        const candidates = Array.isArray(args.candidates) ? args.candidates : [];
        if (candidates.length === 0) throw new Error('plan 需要 candidates（先用 media_models 拉取该类型的可用模型）');
        const plan = planSlot(cwd, slot, candidates);
        const lines = ['# 路由 · ' + slot, '', '模式：' + plan.mode + (plan.model === undefined ? '' : ' → ' + plan.model), '理由：' + plan.reason];
        for (const candidate of plan.candidates) {
          lines.push('- ' + candidate.id + '：得分 ' + String(candidate.score) + ' · 成功率 ' + String(candidate.successRate) + ' · 实测 ' + String(candidate.samples) + ' 次 · 平均 ' + String(candidate.latencySec) + 's');
        }
        return lines.join('\n');
      }
    },
    {
      name: 'toon_gate',
      output: textOutput('交付闸门'),
      description: '核对 P0 之后的交付闸门：G0 立项/版权、G1 分镜完整、G2 关键帧齐备、G3 样片可审、G4 成片交付。只读项目文件，不代签审批。',
      parameters: {
        type: 'object',
        properties: { episode: { type: 'string', description: '剧集目录或 ID' } },
        additionalProperties: false
      },
      timeoutMs: 60000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const episode = await loadEpisode(cwd, args.episode);
        const result = evaluateGates(episode.projection, episode.documents, readReference(cwd));
        const report = await writeReport(cwd, episode.id + '-gates.json', { episode: episode.id, at: new Date().toISOString(), ...result });
        const lines = ['# 交付闸门 · ' + episode.id, '', '下一个闸门：' + (result.nextGate ?? '全部通过') + ' · 报告 ' + report, ''];
        for (const gate of result.gates) {
          const icon = gate.status === 'pass' ? '通过' : gate.status === 'blocked' ? '阻断' : '待办';
          lines.push('- ' + gate.id + ' ' + gate.label + '：' + icon + (gate.reasons.length === 0 ? '' : ' — ' + gate.reasons.join('；')));
        }
        return lines.join('\n');
      }
    },
    {
      name: 'toon_novel_project',
      output: textOutput('小说项目'),
      description: '多书管理：列出工作区内的小说项目，或切换当前激活项目（小说/<名字>）。所有小说工具与界面都跟随激活项目。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'switch'] },
          project: { type: 'string', description: '项目目录，如 小说/长夜行；switch 必填' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'switch') {
          const result = setActiveNovel(cwd, args.project);
          return '已切换到 ' + result.project + '。';
        }
        const list = listNovelProjects(cwd);
        return ['# 小说项目', '', '当前：' + list.active, '', ...list.projects.map((item) => '- ' + item.id + ' · ' + item.title + ' · ' + String(item.chapters) + ' 章 / ' + String(item.chars) + ' 字' + (item.active ? '（激活）' : ''))].join('\n');
      }
    },
    {
      name: 'toon_novel_import',
      output: textOutput('导入现成小说'),
      description: '把 .txt/.md 现成小说导入成结构：识别章节，写入 正文.md 与 大纲.md，并在缺省时补 灵感.md；已有正文默认不覆盖。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '相对工作区或绝对路径的 .txt/.md 文件' },
          title: { type: 'string', description: '书名（缺省用文件名）' },
          force: { type: 'boolean', description: '正文已有内容时是否覆盖' }
        },
        required: ['path'],
        additionalProperties: false
      },
      timeoutMs: 60000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = importNovel(cwd, args);
        return '已导入《' + result.title + '》：' + String(result.chapters) + ' 章 / ' + String(result.chars) + ' 字，写入 ' + result.path + (result.outlinePath === undefined ? '' : ' 与 ' + result.outlinePath) + '。';
      }
    },
    {
      name: 'toon_novel_init',
      output: textOutput('小说结构初始化'),
      description: '从零创建小说结构：灵感.md、故事架构.md、设定.md（世界观六类）、人物.md、大纲.md、正文.md、追踪.md。只补缺失文件，不覆盖已有正文。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '书名' },
          genre: { type: 'string', description: '题材' },
          platform: { type: 'string', description: '平台（起点/番茄/晋江等）' },
          length: { type: 'string', description: '篇幅，如 长篇（120 章 / 每章 3000 字）' },
          logline: { type: 'string', description: '一句话故事' },
          audience: { type: 'string', description: '目标读者' },
          tone: { type: 'string', description: '基调' },
          protagonist: { type: 'string', description: '主角名' },
          project: { type: 'string', description: '多书：项目目录，如 小说/长夜行（缺省用当前激活项目）' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = initNovel(cwd, args ?? {});
        const head = result.created.length === 0 ? '结构已存在，没有覆盖任何文件。' : '已创建：' + result.created.join('、');
        const tail = result.skipped.length === 0 ? '' : '\n跳过已有：' + result.skipped.join('、');
        return head + tail + '\n\n' + describeNovel(result.projection);
      }
    },
    {
      name: 'toon_novel_status',
      output: textOutput('小说阶段与缺口'),
      description: '只读查看小说工作台：灵感/架构/世界观/人物/大纲/正文/追踪的阶段完成度、下一阶段与缺口。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      timeoutMs: 15000,
      execute: async (_args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        return describeNovel(novelProjection(cwd));
      }
    },
    {
      name: 'toon_novel_chapter',
      output: textOutput('章节工作台'),
      description: '小说章节工作台：列出章节四态（蓝图/草稿/审稿/定稿）、从大纲新建一章、按本章蓝图装配有限上下文（出场人物/相关世界观/上一章结尾/连续性）。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create', 'context'], description: 'list=列章节；create=新建一章；context=装配本章上下文' },
          number: { type: 'number', description: '章节号（create 缺省为下一章）' },
          title: { type: 'string', description: '章节标题（可选，缺省取大纲）' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'list') {
          const chapters = scanChapters(cwd);
          if (chapters.length === 0) return '还没有章节。先用 toon_novel_chapter action=create 建第一章。';
          return ['# 章节工作台', '', ...chapters.map((chapter) => '- 第' + String(chapter.number) + '章 ' + chapter.title + '：' + chapter.status + '（' + chapter.dir + '）')].join('\n');
        }
        if (args.action === 'create') {
          const result = createChapter(cwd, args);
          if (!result.created) return result.message;
          return '已创建 ' + result.chapter.dir + '：蓝图.md 已从大纲填入目标/冲突/钩子。下一步填出场人物与引用设定，再写草稿。';
        }
        const context = chapterContext(cwd, args.number);
        return context.text;
      }
    },
    {
      name: 'toon_novel_world',
      output: textOutput('世界观条目'),
      description: '结构化编辑世界观：按类目（rule/geography/power/system/era/taboo）新增、修改或删除条目，写入 设定.md，不改正文。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['add', 'update', 'remove'] },
          category: { type: 'string', description: '类目 id 或中文名：rule/geography/power/system/era/taboo' },
          text: { type: 'string', description: '条目内容（add/update 必填）' },
          index: { type: 'number', description: '条目序号（1 起；update/remove 必填）' }
        },
        required: ['action', 'category'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'remove') {
          const result = removeWorldEntry(cwd, args);
          return '已删除 ' + result.label + ' 第 ' + String(args.index) + ' 条，剩余 ' + String(result.entries) + ' 条。';
        }
        const result = upsertWorldEntry(cwd, { ...args, index: args.action === 'update' ? args.index : undefined });
        return '已写入 ' + result.label + ' 第 ' + String(result.index) + ' 条，共 ' + String(result.entries) + ' 条。';
      }
    },
    {
      name: 'toon_novel_character',
      output: textOutput('人物卡'),
      description: '结构化编辑人物卡：按姓名新增或合并字段（身份/欲望/目标/创伤/弧光/关系/口吻/首次出场），或删除人物；写入 人物.md。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['upsert', 'remove'] },
          name: { type: 'string' },
          fields: { type: 'object', additionalProperties: true, description: '人物字段（upsert 用）' }
        },
        required: ['action', 'name'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'remove') {
          const result = removeCharacter(cwd, args);
          return '已删除人物 ' + result.name + '，剩余 ' + String(result.count) + ' 张卡。';
        }
        const result = upsertCharacter(cwd, args);
        return '已保存人物 ' + result.name + '，共 ' + String(result.count) + ' 张卡。';
      }
    },
    {
      name: 'toon_novel_task',
      output: textOutput('本章写作任务'),
      description: '为指定章节生成写作任务书（有限上下文 + 字数目标 + 人物口吻 + 连续性 + 交付要求），写入 章节/第N章/写作任务.md，可直接交给写作 Agent。',
      parameters: {
        type: 'object',
        properties: {
          number: { type: 'number', description: '章节号；缺省取第一章有草稿/蓝图的章节' },
          minWords: { type: 'number' },
          maxWords: { type: 'number' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = buildChapterTask(cwd, args.number, args);
        return '已生成 ' + result.path + '（' + String(result.chars) + ' 字任务书）。让 Agent 按任务书写入 草稿.md，再跑审稿。';
      }
    },
    {
      name: 'toon_novel_finalize',
      output: textOutput('章节定稿'),
      description: '定稿门：要求已有审稿单且无阻断，把 草稿.md 复制为 定稿.md；默认不覆盖已有定稿。',
      parameters: {
        type: 'object',
        properties: {
          number: { type: 'number', description: '章节号；缺省取最后一章有草稿的章节' },
          force: { type: 'boolean', description: '已有定稿时是否覆盖' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = finalizeChapter(cwd, args.number, args);
        return '已定稿：' + result.path + '（审稿结论：' + result.verdict + '）';
      }
    },
    {
      name: 'toon_novel_review',
      output: textOutput('章节审稿单'),
      description: '按规则自动生成章节审稿单：蓝图目标/冲突/钩子是否落地、字数、出场人物、设定引用、连续性、段落/对白/套话密度、重复段落。输出到 章节/第N章/审稿.md，不改正文。',
      parameters: {
        type: 'object',
        properties: {
          number: { type: 'number', description: '章节号；缺省取最后一章有草稿的章节' },
          minWords: { type: 'number', description: '最少字数（可选）' },
          maxWords: { type: 'number', description: '最多字数（可选）' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = reviewChapter(cwd, args.number, args);
        return '已生成 ' + result.path + '：' + result.verdict + '（阻断 ' + String(result.counts.block) + ' / 提醒 ' + String(result.counts.warn) + ' / 提示 ' + String(result.counts.note) + '）';
      }
    },
    {
      name: 'toon_novel_publish',
      output: textOutput('小说发布资料'),
      description: '汇总发布资料（书名/笔名/分类/标签/简介/字数/状态）到 发布资料.md；缺的字段留空并列出，不编造。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string', description: '笔名' },
          tags: { type: 'array', items: { type: 'string' } },
          intro: { type: 'string', description: '简介（不传则取灵感.md 的简介）' },
          status: { type: 'string', description: '连载中/已完结' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = buildPublish(cwd, args ?? {});
        return '已写入 ' + result.path + (result.missing.length === 0 ? '' : '；待补：' + result.missing.join('、'));
      }
    },
    {
      name: 'toon_novel_adapt',
      output: textOutput('改编交接'),
      description: '小说改编交接：把已写章节/大纲映射成集数，输出 改编计划.md（人物、世界观、章节→集数），交给短剧/漫剧/游戏/解说线。只给计划，不伪造剧本。',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', enum: ['短剧', '漫剧', '互动游戏', '视频解说'] },
          episodes: { type: 'number', description: '计划集数；缺省按每 4 章一集估算' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = buildAdaptation(cwd, args ?? {});
        const head = '已写入 ' + result.path + '：' + result.target + ' · ' + String(result.episodes) + ' 集 · 来源 ' + String(result.chapters) + ' 章。';
        if (result.target === '互动游戏') return head + ' 下一步跑 toon_game_intake 确认改编方向，再 toon_game_project action=init 建 game-adaptations/<项目>/，并在 PRODUCT_BRIEF.md 的「原著：」写清来源。';
        if (result.target === '视频解说') return head + ' 下一步跑 toon_project 看原片与成片，再按视频解说流程写解说稿。';
        return head + ' 下一步在 剧集/EP001/ 写剧本与分镜。';
      }
    },
    {
      name: 'toon_game_intake',
      output: textOutput('互动游戏入口'),
      description: '互动游戏需求入口：判断用户这句话是不是游戏需求、原创还是改编、该接哪个工程；给出阶段证据清单与下一步工具。只读，不写文件；会把工作台切到互动游戏页签。游戏类需求先跑它，再决定建工程还是继续现有工程。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '用户原话，尽量原样传入' },
          project: { type: 'string', description: '明确指定工程名（可选；缺省从原话或当前激活工程匹配）' },
          workspace: { type: 'string', enum: ['story', 'drama', 'game', 'video'], description: '当前工作区已识别的工程类型（可选）' }
        },
        required: ['text'],
        additionalProperties: false
      },
      timeoutMs: 15000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const result = gameIntake(cwd, args.text, { project: args.project, workspaceKind: args.workspace });
        if (result.routed === true) {
          const sessionId = exec?.agent?.session?.id ?? '';
          pushIntent(sessionId, {
            action: 'focus_workspace',
            kind: 'game',
            ...(result.existing === true ? { project: result.project } : {}),
            ...(result.nextStage === undefined ? {} : { stage: result.nextStage.id })
          });
        }
        return describeGameIntake(result);
      }
    },
    {
      name: 'toon_game_project',
      output: textOutput('互动游戏工程'),
      description: '互动游戏工程管理：list 列工程、status 看阶段与缺口、init 建 game-adaptations/<项目>/ 骨架（只补 PRODUCT_BRIEF.md 与 _progress.md，不预建空文档）、switch 切换激活工程。阶段判断只认文件证据，占位词不算完成。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'status', 'init', 'switch'], description: 'list=列工程；status=阶段投影；init=建骨架；switch=切换激活工程' },
          project: { type: 'string', description: '工程名或目录，如 长夜行 或 game-adaptations/长夜行；init 不传时用标题派生' },
          title: { type: 'string', description: 'init：作品标题' },
          sourceNovel: { type: 'string', description: 'init：原著来源（改编时必填；原创写「无（原创）」）' },
          platform: { type: 'string', description: 'init：平台与运行时' },
          playDirection: { type: 'string', description: 'init：玩法方向' },
          immersion: { type: 'string', description: 'init：核心代入感（玩家扮演谁、追求什么）' },
          targetFinish: { type: 'string', enum: ['graybox', 'playable-prototype', 'polished-vertical-slice', 'showcase'], description: 'init：制作完成度' },
          experienceProfile: { type: 'string', enum: ['system-led', 'narrative-led', 'hybrid'], description: 'init：体验主线' },
          audience: { type: 'string' },
          language: { type: 'string' },
          notDoing: { type: 'string', description: 'init：明确不做的事' },
          mode: { type: 'string', enum: ['quick', 'director', 'resume'], description: 'init：NovelToGame 模式' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const sessionId = exec?.agent?.session?.id ?? '';
        if (args.action === 'list') return describeGameList(listGameProjects(cwd));
        if (args.action === 'switch') {
          const result = setActiveGame(cwd, args.project);
          pushIntent(sessionId, { action: 'focus_workspace', kind: 'game', project: result.project });
          return '已切换到 ' + result.root + '。\n\n' + describeGameProjection(gameProjection(cwd, result.project));
        }
        if (args.action === 'init') {
          const result = initGameProject(cwd, args);
          pushIntent(sessionId, { action: 'focus_workspace', kind: 'game', project: result.id });
          const head = result.created.length === 0 ? '工程已存在，没有覆盖任何文件。' : '已创建：' + result.created.join('、');
          const skipped = result.skipped.length === 0 ? '' : '\n跳过已有：' + result.skipped.join('、');
          return head + skipped + '\n\n' + describeGameProjection(result.projection);
        }
        const projection = gameProjection(cwd, args.project);
        if (projection !== undefined) return describeGameProjection(projection);
        const list = listGameProjects(cwd);
        if (list.projects.length > 0) {
          return '找不到工程「' + String(args.project ?? '') + '」。\n\n' + describeGameList(list);
        }
        return describeGameProjection(undefined);
      }
    },
    {
      name: 'toon_game_stage',
      output: textOutput('互动游戏阶段模板'),
      description: '互动游戏阶段写作：template 取阶段骨架、apply 落盘（不覆盖已有文件）、options 读概念三选一、choose 选定方案生成 CONCEPT.md、brief 读 PRODUCT_BRIEF 表单、save_brief 保存表单字段（保留作者其他段落）。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['template', 'apply', 'options', 'choose', 'brief', 'save_brief'], description: 'template=读模板；apply=落盘；options=列概念方案；choose=选定；brief=读表单；save_brief=保存表单' },
          stage: { type: 'string', enum: ['brief', 'analysis', 'concept', 'design', 'art', 'build', 'qa'], description: 'template/apply 的阶段；qa 的阶段模板由 toon_game_qa 生成' },
          project: { type: 'string', description: '工程名；缺省用激活工程' },
          option: { type: 'string', description: 'choose：A/B/C' },
          fields: { type: 'object', additionalProperties: true, description: 'save_brief：PRODUCT_BRIEF 字段（sourceNovel/platform/playDirection/immersion/targetFinish/experienceProfile/notDoing/title 等）' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'template') {
          if (args.stage === undefined) throw new Error('template 需要 stage');
          const template = stageTemplate(cwd, { stage: args.stage, project: args.project });
          return ['# 阶段模板 · ' + args.stage, '', '文件：' + template.file, template.note === undefined ? '' : '说明：' + template.note, '', '```md', template.text, '```'].filter((line) => line !== '').join('\n');
        }
        if (args.action === 'apply') {
          if (args.stage === undefined) throw new Error('apply 需要 stage');
          const result = applyStageTemplate(cwd, { stage: args.stage, project: args.project });
          return (result.created ? '已创建 ' : '已存在，未覆盖 ') + result.path + (result.projection === undefined ? '' : '\n\n' + describeGameProjection(result.projection));
        }
        if (args.action === 'options') {
          const result = listConceptOptions(cwd, args.project);
          if (result.options.length === 0) return '还没有 ' + result.file + '：先运行 toon_game_stage action=apply stage=concept。';
          return ['# 概念三选一 · ' + result.project, '', '文件：' + result.file, result.chosen === undefined ? '' : '已选定：' + result.chosen, '', ...result.options.map((option) => '- ' + option.id + ' · ' + option.title + ' — ' + option.summary)].filter((line) => line !== '').join('\n');
        }
        if (args.action === 'choose') {
          if (args.option === undefined) throw new Error('choose 需要 option（A/B/C）');
          const result = chooseConcept(cwd, { project: args.project, option: args.option });
          return '已选定方案 ' + result.option + '：' + result.path + '\n\n' + describeGameProjection(result.projection);
        }
        if (args.action === 'brief') {
          const form = readBriefForm(cwd, args.project);
          const lines = ['# PRODUCT_BRIEF 表单 · ' + form.title, '', '项目：' + form.project, ''];
          for (const [key, value] of Object.entries(form.fields)) lines.push('- ' + key + '：' + (value === '' ? '（待填）' : value));
          lines.push('', '可选值：targetFinish=' + form.enums.targetFinish.join(' / ') + '；experienceProfile=' + form.enums.experienceProfile.join(' / '));
          return lines.join('\n');
        }
        const result = saveBriefFields(cwd, args.project, args.fields ?? {});
        return '已保存 ' + result.path + '\n\n' + describeGameProjection(result.projection);
      }
    },
    {
      name: 'toon_game_snapshot',
      output: textOutput('构建快照'),
      description: '构建版本快照：把 game-adaptations/<项目>/build/app 复制到 .kylin-toon/game-snapshots，支持 list/create/restore/delete；回滚前自动备份当前构建。默认保留最近 10 个。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create', 'restore', 'delete'] },
          project: { type: 'string', description: '工程名；缺省用激活工程' },
          id: { type: 'string', description: 'restore/delete 的快照 id' },
          label: { type: 'string', description: 'create：快照说明' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 120000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        if (args.action === 'list') return describeSnapshots(listSnapshots(cwd, args.project));
        if (args.action === 'create') {
          const result = createSnapshot(cwd, { project: args.project, label: args.label });
          return '已创建快照 ' + result.snapshot.id + '（' + String(result.snapshot.files) + ' 文件）。\n\n' + describeSnapshots(result.list);
        }
        if (args.action === 'restore') {
          if (args.id === undefined) throw new Error('restore 需要 id');
          const result = restoreSnapshot(cwd, { project: args.project, id: args.id });
          return '已回滚到 ' + result.restored + (result.backup === undefined ? '' : '；回滚前构建备份在 ' + result.backup) + '。\n\n' + describeGameProjection(result.projection);
        }
        if (args.action === 'delete') {
          if (args.id === undefined) throw new Error('delete 需要 id');
          const result = deleteSnapshot(cwd, { project: args.project, id: args.id });
          return '已删除快照 ' + result.deleted + '。\n\n' + describeSnapshots(result.list);
        }
        throw new Error('未知 action');
      }
    },
    {
      name: 'toon_game_qa',
      output: textOutput('盲测交接'),
      description: '盲玩会话隔离：brief 生成 qa/盲测任务.md 与 blind-plan.json（记录创作会话 id，不含设计细节）；record 由盲测会话登记自己的 session id；status 查看隔离状态。投影会把「同会话自审」判为未完成。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['brief', 'record', 'status'] },
          project: { type: 'string', description: '工程名；缺省用激活工程' },
          sessionId: { type: 'string', description: 'record：盲测会话 id；缺省用当前会话' },
          note: { type: 'string' }
        },
        required: ['action'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const sessionId = exec?.agent?.session?.id ?? '';
        if (args.action === 'status') return describeQaStatus(qaIsolationOf(cwd, args.project));
        if (args.action === 'record') {
          const result = recordQaSession(cwd, { project: args.project, sessionId: args.sessionId ?? sessionId, note: args.note });
          return '已记录盲测会话：' + result.session.sessionId + '\n\n' + describeQaStatus(result.isolation) + '\n\n' + describeGameProjection(result.projection);
        }
        const result = writeQaBrief(cwd, { project: args.project, authorSessionId: sessionId, note: args.note });
        return describeQaBrief(result);
      }
    },
    {
      name: 'toon_intent',
      output: textOutput('创作意图识别'),
      description: '判断用户这句话是要创作什么：小说 / 短剧漫剧 / 互动游戏 / 视频解说 / 参考片，以及动作（新建、续写、修改、拆解、发布、改编）。纯规则、只读；新需求进来时先调用，再决定打开哪个工作台。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '用户原话，尽量原样传入' },
          workspace: { type: 'string', enum: ['story', 'drama', 'game', 'video'], description: '当前工作区已识别的工程类型（可选，用于消解「继续写」这类含糊说法）' }
        },
        required: ['text'],
        additionalProperties: false
      },
      timeoutMs: 15000,
      execute: async (args) => {
        const result = classifyCreativeIntent(args.text, { workspaceKind: args.workspace });
        return describeIntent(result);
      }
    },
    {
      name: 'toon_project',
      output: textOutput('创作台状态'),
      description: '读取当前工作区识别到的四类创作工程、剧集与可用工具状态（ffmpeg 是否就绪），用来决定下一步。只读。',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (_args, exec) => {
        const cwd = await cwdOf(exec, workingDirectory);
        const { scanWorkspace } = await import('./projects.js');
        const scanned = await scanWorkspace(cwd);
        const ffmpeg = resolveFfmpeg();
        const lines = ['# 创作台状态', '', '工作区：' + scanned.cwd, '识别：' + (scanned.creative ? Object.entries(scanned.kinds).filter(([, value]) => value).map(([key]) => key).join(' / ') : '还没有创作文件'), 'ffmpeg：' + (existsSync(ffmpeg) || !ffmpeg.includes('/') ? ffmpeg : '未找到（' + ffmpeg + '）')];
        if (scanned.drama.episodes.length > 0) {
          lines.push('', '剧集：');
          for (const episode of scanned.drama.episodes) {
            lines.push('- ' + episode.id + '：' + episode.documents.map((document) => document.kind).join('、'));
          }
        }
        if (scanned.games.length > 0) {
          lines.push('', '游戏：');
          for (const game of scanned.games) {
            const projection = gameProjection(cwd, game.id);
            const stage = projection?.nextStage === undefined ? (projection === undefined ? '阶段未知' : '全部阶段已完成') : '下一步 ' + projection.nextStage.label;
            lines.push('- ' + game.id + (game.previewReady ? '（可试玩）' : '（未构建）') + ' · ' + stage);
          }
        }
        if (scanned.videos.length > 0) lines.push('', '视频解说：' + scanned.videos.map((video) => video.id + '（成片 ' + String(video.outputs.length) + '）').join('、'));
        return lines.join('\n');
      }
    }
  ];
  return [...tools, ...createReferenceTools(workingDirectory)];
}