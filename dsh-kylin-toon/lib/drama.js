/**
 * 短剧漫剧投影：把本集已有的五份创作文档解析成内存投影。
 *
 * 原则（与参考项目一致）：只读作者写下的 Markdown，不预建空文件、不补未要求的阶段；
 * 诊断必须指到具体行号，不猜测作者意图。
 */
import { DRAMA_FILES } from './paths.js';
import { validateMotion } from './motion.js';

const SHOT_KEYS = {
  入场: 'entryState',
  出场: 'exitState',
  转场: 'transitionOut',
  时长: 'duration',
  画面: 'visual',
  台词: 'dialogue',
  声音: 'sound',
  景别: 'framing',
  运镜: 'camera',
  情绪: 'emotion'
};

const ENTRY_KEYS = {
  entry: 'entryState',
  exit: 'exitState',
  transition: 'transitionOut',
  duration: 'duration'
};

const TRANSITIONS = new Set(['cut', 'fade', 'dissolve', 'wipeleft', 'slideup', 'flash']);

function stripMarker(line) {
  return line.replace(/^\s*(?:[-*+]\s+|>\s*)/, '').trim();
}

function fieldLine(line) {
  const clean = stripMarker(line);
  const match = /^([\u4e00-\u9fa5A-Za-z_]{1,12})\s*[:：]\s*(.*)$/.exec(clean);
  if (match === null) return undefined;
  const key = SHOT_KEYS[match[1]] ?? ENTRY_KEYS[match[1].toLowerCase()];
  if (key === undefined) return undefined;
  return { key, value: match[2].trim() };
}

function idFromHeading(text) {
  const match = /(?:^|[\s（(\[【])([A-Za-z]{0,4}[-_]?\d{1,3}(?:[._-]\d{1,3}){0,2})(?![A-Za-z0-9])/.exec(text);
  return match === null ? undefined : match[1];
}

/** 解析分镜.md 的镜头块；支持标题块与表格行两种常见写法。 */
export function parseShotBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const shots = [];
  let current;
  let sectionToken = '';
  const push = () => {
    if (current !== undefined && (current.id !== undefined || current.title !== '')) shots.push(current);
  };
  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index] ?? '';
    const heading = /^(#{2,4})\s+(.+?)\s*$/.exec(raw);
    const tableRow = /^\s*\|\s*([^|]+?)\s*\|(.+)\|\s*$/.exec(raw);
    const numbered = /^\s*(\d{1,3}[.、])\s*(.+?)\s*$/.exec(raw);
    const section = /^#{1,4}\s+.*?\b(S\d{1,3})\b/.exec(raw);
    if (section !== null) sectionToken = section[1];
    const startsShot = (heading !== null && (/(镜|shot|S\d|分镜)/i.test(heading[2]) || idFromHeading(heading[2]) !== undefined))
      || (numbered !== null && /(镜|shot)/i.test(numbered[2]));
    if (startsShot) {
      push();
      const title = heading !== null ? heading[2] : numbered !== null ? numbered[2] : '';
      const id = heading !== null ? idFromHeading(heading[2]) : idFromHeading(title);
      current = {
        ...(id === undefined ? {} : { id }),
        title,
        line: index + 1,
        entryState: '',
        exitState: '',
        transitionOut: '',
        duration: 0,
        fields: {}
      };
      continue;
    }
    if (tableRow !== null && tableRow[1] !== undefined) {
      // 表格写法（MV/短片常用）：| 镜 | 时间 | 时长 | 字幕 | 描述 |
      const cell = tableRow[1].replace(/[*`\s]/g, '');
      const bare = /^\d{1,3}$/.test(cell) ? cell : undefined;
      const id = /^[A-Za-z]{0,4}[-_]?\d{1,3}(?:[._-]\d{1,3}){0,2}$/.test(cell)
        ? (bare !== undefined && sectionToken !== '' ? sectionToken + '-' + bare : cell)
        : undefined;
      if (id !== undefined) {
        push();
        const rest = tableRow[2] ?? '';
        const durationMatch = /(\d+(?:\.\d+)?)\s*s(?:ec)?(?:\b|\|)/.exec(rest) ?? /\|\s*(\d+(?:\.\d+)?)s\s*\|/.exec(rest);
        const duration = durationMatch === null ? 0 : Number.parseFloat(durationMatch[1]);
        current = { id, title: id, line: index + 1, entryState: '', exitState: '', transitionOut: '', duration: Number.isFinite(duration) ? duration : 0, fields: {}, row: rest };
        continue;
      }
    }
    if (current === undefined) continue;
    if (/^#{1,6}\s+/.test(raw) && heading === null) { push(); current = undefined; continue; }
    const field = fieldLine(raw);
    if (field !== undefined) {
      if (field.key === 'duration') {
        const seconds = Number.parseFloat(field.value);
        current.duration = Number.isFinite(seconds) ? seconds : 0;
      } else {
        current[field.key] = field.value;
        current.fields[field.key] = field.value;
      }
    }
  }
  push();
  return shots;
}

function normalizeState(value) {
  return value.replace(/[\s，,。.;；]/g, '').toLowerCase();
}

/** 相邻镜头的入场/出场状态对账；转场归前镜（与 KToon 镜头叙事契约一致）。 */
export function auditShotContinuity(shots) {
  const blockers = [];
  const warnings = [];
  for (let index = 0; index < shots.length; index++) {
    const shot = shots[index];
    const label = shot.id ?? ('第' + String(shot.line) + '行');
    if (shot.id === undefined) warnings.push({ code: 'shot-id-missing', line: shot.line, message: label + ' 缺少镜头 ID' });
    if (!(shot.duration > 0)) warnings.push({ code: 'shot-duration-missing', line: shot.line, message: label + ' 缺少时长（秒）' });
    if (shot.transitionOut !== '' && !TRANSITIONS.has(shot.transitionOut) && shot.transitionOut !== 'cut') {
      warnings.push({ code: 'shot-transition-unknown', line: shot.line, message: label + ' 的转场「' + shot.transitionOut + '」不在白名单（cut/fade/dissolve/wipeleft/slideup/flash）' });
    }
    const next = shots[index + 1];
    if (next === undefined) continue;
    if (shot.exitState !== '' && next.entryState !== '' && normalizeState(shot.exitState) !== normalizeState(next.entryState)) {
      blockers.push({
        code: 'shot-state-discontinuous',
        line: next.line,
        message: label + ' 出场「' + shot.exitState + '」与下一镜 ' + (next.id ?? '第' + String(next.line) + '行') + ' 入场「' + next.entryState + '」不一致'
      });
    }
  }
  return { blockers, warnings };
}

/** 重复 ID、提示词与镜头断链：都给出可定位的行号。 */
export function auditDocumentLinks(documents) {
  const diagnostics = [];
  const seen = new Map();
  for (const document of documents) {
    const lines = document.content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index] ?? '';
      const match = /(?:^|[\s|（(\[【])([A-Za-z]{0,4}[-_]?\d{1,3}(?:[._-]\d{1,3}){0,2})(?![A-Za-z0-9])/.exec(line);
      if (match === null) continue;
      const id = match[1];
      if (!/^[A-Za-z]{0,4}[-_]?\d/.test(id)) continue;
      // 纯数字是分场内的局部编号（S1 用 01-12，S2 再从 01 开始），不能当全局重复。
      if (/^\d{1,3}$/.test(id)) continue;
      const key = document.kind + ':' + id;
      const previous = seen.get(key);
      if (previous !== undefined) {
        diagnostics.push({
          code: 'duplicate-id',
          kind: document.kind,
          line: index + 1,
          message: document.kind + ' 中 ID「' + id + '」重复（首次出现在第 ' + String(previous) + ' 行）'
        });
      } else {
        seen.set(key, index + 1);
      }
    }
  }
  return diagnostics;
}

function sectionsOf(markdown, pattern) {
  const lines = markdown.split(/\r?\n/);
  const result = [];
  for (let index = 0; index < lines.length; index++) {
    const match = pattern.exec(lines[index] ?? '');
    if (match === null) continue;
    result.push({ title: match[1].trim().replace(/[：:]$/, ''), line: index + 1 });
  }
  return result;
}

/** 本集投影：场景、角色、镜头、提示词与诊断。 */
export function projectEpisode(episode, documents) {
  const byKind = new Map(documents.map((document) => [document.kind, document.content]));
  const script = byKind.get('剧本.md') ?? '';
  const visual = byKind.get('视觉设定.md') ?? '';
  const storyboard = byKind.get('分镜.md') ?? '';
  const imagePrompts = byKind.get('图片提示词.md') ?? '';
  const videoPrompts = byKind.get('视频提示词.md') ?? '';
  const editList = byKind.get('剪辑单.md') ?? '';
  const motionText = byKind.get('MOTION.md') ?? '';

  const shots = parseShotBlocks(storyboard);
  const continuity = auditShotContinuity(shots);
  const motion = validateMotion(motionText, { shots, reference: /参考|复刻|拍同款/.test(motionText) });
  const diagnostics = [
    ...auditDocumentLinks(documents),
    ...continuity.blockers,
    ...continuity.warnings,
    ...motion.diagnostics.filter((item) => item.severity === 'blocker').map((item) => ({ severity: item.severity, ...item }))
  ];
  const shotIds = new Set(shots.map((shot) => shot.id).filter((id) => id !== undefined));
  const promptIds = new Set();
  for (const content of [imagePrompts, videoPrompts]) {
    for (const line of content.split(/\r?\n/)) {
      const match = /(?:^|[\s|（(\[【])([A-Za-z]{0,4}[-_]?\d{1,3}(?:[._-]\d{1,3}){0,2})(?![A-Za-z0-9])/.exec(line);
      if (match !== null) promptIds.add(match[1]);
    }
  }
  // 只有工程里真的有提示词文档时才做提示词对账，避免把「没写提示词」重复报成几十条噪音。
  if (promptIds.size > 0) {
    for (const id of promptIds) {
      if (!shotIds.has(id)) diagnostics.push({ code: 'prompt-without-shot', message: '提示词里的「' + id + '」在分镜中没有对应镜头' });
    }
    for (const id of shotIds) {
      if (!promptIds.has(id)) diagnostics.push({ code: 'shot-without-prompt', message: '镜头「' + id + '」还没有图片/视频提示词' });
    }
  }
  return {
    episode: episode.id,
    directory: episode.directory,
    documents: DRAMA_FILES.filter((kind) => byKind.has(kind)),
    additionalDocuments: episode.additionalDocuments ?? [],
    assets: episode.assets ?? [],
    scenes: sectionsOf(script, /^#{2,4}\s*(?:场次?\s*[：:]?\s*)?(.+?)\s*$/),
    characters: sectionsOf(visual, /^#{2,4}\s*(?:角色|人物)\s*[：:]?\s*(.+?)\s*$/),
    shots: shots.map((shot) => ({
      id: shot.id,
      title: shot.title,
      line: shot.line,
      duration: shot.duration,
      entryState: shot.entryState,
      exitState: shot.exitState,
      transitionOut: shot.transitionOut,
      fields: shot.fields
    })),
    prompts: {
      image: promptIds.size,
      video: videoPrompts === '' ? 0 : 1,
      ids: [...promptIds]
    },
    edit: editList === '' ? undefined : { lines: editList.split(/\r?\n/).length },
    motion: {
      present: motion.motion.present,
      ok: motion.ok,
      timeline: motion.motion.timeline,
      keep: motion.motion.keep,
      replace: motion.motion.replace,
      evidence: motion.motion.evidence,
      diagnostics: motion.diagnostics
    },
    media: episode.media ?? [],
    outputs: episode.outputs ?? [],
    diagnostics,
    ok: !diagnostics.some((item) => ['duplicate-id', 'prompt-without-shot', 'motion-timeline-missing', 'motion-shot-unknown', 'motion-duration-mismatch', 'motion-shot-missing', 'motion-shot-order', 'motion-duplicate-shot', 'motion-time-invalid'].includes(item.code))
  };
}