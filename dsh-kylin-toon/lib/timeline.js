/**
 * 短剧/漫剧时间线投影：把分镜与剪辑单变成可编辑的镜头块，写回 剪辑单.md。
 *
 * 语义对齐 OpenMotion Studio：
 * - 画面轨的每个块有源、入点、出点、输出起点、转场；
 * - 剪辑单是权威文件，时间线只是投影；保存只写剪辑单，不改分镜；
 * - 装配时若有剪辑单行，toon_assemble 优先按剪辑单裁切。
 */
const TRANSITIONS = new Set(['cut', 'fade', 'dissolve', 'wipeleft', 'slideup', 'flash']);

function numeric(value) {
  const match = /-?\d+(?:\.\d+)?/.exec(String(value ?? ''));
  return match === null ? undefined : Number.parseFloat(match[0]);
}

function cellsOf(line) {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((cell) => cell.trim());
}

function isSeparator(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

function basename(path) {
  return String(path ?? '').split('/').pop() ?? '';
}

function shotIdOfPath(path) {
  const match = /([A-Za-z]{0,4}[-_]?\d{1,3}(?:[._-]\d{1,3}){0,2})/.exec(basename(path));
  return match === null ? undefined : match[1];
}

/** 解析剪辑单表格；没有表头或不是剪辑表时返回空 rows。 */
export function parseEditList(markdown) {
  const rows = [];
  const lines = String(markdown ?? '').split(/\r?\n/);
  let header;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!/^\s*\|/.test(line)) continue;
    const cells = cellsOf(line);
    if (isSeparator(cells)) continue;
    if (header === undefined) {
      if (cells.some((cell) => /镜头|shot|^id$/i.test(cell)) && cells.some((cell) => /源|素材|source|path/i.test(cell))) {
        header = cells;
      }
      continue;
    }
    const record = {};
    header.forEach((key, column) => { record[key] = cells[column] ?? ''; });
    const id = (record['镜头'] ?? record.shot ?? record.id ?? '').replace(/[`*]/g, '').trim();
    const source = (record['源'] ?? record['素材'] ?? record.source ?? record.path ?? '').replace(/[`*]/g, '').trim();
    if (id === '' && source === '') continue;
    rows.push({
      id,
      line: index + 1,
      source,
      inSec: numeric(record['入点'] ?? record['入点(s)'] ?? record.in ?? record.inSec),
      outSec: numeric(record['出点'] ?? record['出点(s)'] ?? record.out ?? record.outSec),
      start: numeric(record['输出起点'] ?? record['输出起点(s)'] ?? record.start ?? record.startSec),
      duration: numeric(record['时长'] ?? record['时长(s)'] ?? record.duration),
      transition: (record['转场'] ?? record.transition ?? 'cut').trim() || 'cut',
      note: (record['备注'] ?? record.note ?? '').trim()
    });
  }
  return rows;
}

export function serializeEditList(rows, { title } = {}) {
  const lines = [
    '# 剪辑单' + (title === undefined ? '' : ' · ' + title),
    '',
    '> 由工作台时间线保存。入点/出点相对于源片段；输出起点是成片时间；转场归前一个切点。',
    '',
    '| 镜头 | 源 | 入点(s) | 出点(s) | 输出起点(s) | 时长(s) | 转场 | 备注 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |'
  ];
  for (const row of rows) {
    lines.push('| ' + [row.shotId ?? row.id ?? '', row.source ?? '', fmt(row.inSec), fmt(row.outSec), fmt(row.start), fmt(row.duration), row.transition ?? 'cut', row.note ?? ''].join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}

function fmt(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '';
}

/**
 * 构建时间线：默认按分镜时长顺排；剪辑单有对应镜头行时，用剪辑单的源/入出点/输出起点覆盖。
 */
export function buildTimeline({ projection, media = [], editMarkdown = '', projectDir } = {}) {
  const shots = projection?.shots ?? [];
  const videoMedia = media.filter((path) => /\.(mp4|webm|mov|m4v)$/i.test(path));
  const audioMedia = media.filter((path) => /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(path));
  const edits = parseEditList(editMarkdown);
  const editById = new Map();
  for (const edit of edits) {
    if (!editById.has(edit.id)) editById.set(edit.id, edit);
  }
  const clips = [];
  let cursor = 0;
  for (const shot of shots) {
    const edit = shot.id === undefined ? undefined : editById.get(shot.id);
    const mediaPath = edit?.source !== undefined && edit.source !== ''
      ? edit.source
      : videoMedia.find((path) => shotIdOfPath(path) === shot.id);
    const duration = Number.isFinite(edit?.outSec) && Number.isFinite(edit?.inSec)
      ? Math.max(0, edit.outSec - edit.inSec)
      : (Number.isFinite(edit?.duration) ? edit.duration : shot.duration);
    const start = Number.isFinite(edit?.start) ? edit.start : cursor;
    const seconds = Number.isFinite(duration) && duration > 0 ? duration : 0;
    clips.push({
      id: shot.id ?? ('line-' + String(shot.line)),
      shotId: shot.id,
      source: mediaPath ?? '',
      inSec: Number.isFinite(edit?.inSec) ? edit.inSec : 0,
      outSec: Number.isFinite(edit?.outSec) ? edit.outSec : seconds,
      duration: seconds,
      start,
      end: start + seconds,
      transition: edit?.transition ?? shot.transitionOut ?? 'cut',
      note: edit?.note ?? '',
      line: shot.line
    });
    cursor = start + seconds;
  }
  const diagnostics = [];
  const known = new Set(shots.map((shot) => shot.id).filter(Boolean));
  for (const edit of edits) {
    if (edit.id !== '' && !known.has(edit.id)) diagnostics.push({ severity: 'warning', code: 'timeline-shot-unknown', line: edit.line, message: '剪辑单里的「' + edit.id + '」在分镜中不存在' });
    if (Number.isFinite(edit.inSec) && Number.isFinite(edit.outSec) && edit.outSec <= edit.inSec) diagnostics.push({ severity: 'blocker', code: 'timeline-range-invalid', line: edit.line, message: '「' + edit.id + '」出点不大于入点' });
    if (!TRANSITIONS.has(edit.transition)) diagnostics.push({ severity: 'warning', code: 'timeline-transition-unknown', line: edit.line, message: '「' + edit.id + '」转场「' + edit.transition + '」不在白名单' });
  }
  const duration = clips.reduce((max, clip) => Math.max(max, clip.end), 0);
  return {
    episode: projection?.episode,
    fps: 24,
    duration,
    shots: shots.length,
    clips,
    audio: audioMedia,
    edits,
    diagnostics,
    tracks: [
      { id: 'video', label: '画面', clips },
      { id: 'audio', label: '声音', clips: audioMedia.map((path, index) => ({ id: 'audio-' + String(index), source: path, start: 0, duration: 0, kind: 'audio' })) }
    ],
    ...(projectDir === undefined ? {} : { projectDir })
  };
}

export function describeTimeline(timeline) {
  const lines = ['# 时间线 · ' + (timeline.episode ?? '本集'), '', '时长 ' + timeline.duration.toFixed(2) + 's · ' + String(timeline.clips.length) + ' 个镜头块 · 声音素材 ' + String(timeline.audio.length) + ' 个', ''];
  for (const clip of timeline.clips) {
    lines.push('- ' + clip.shotId + ' · ' + clip.start.toFixed(2) + '–' + clip.end.toFixed(2) + 's · ' + clip.duration.toFixed(2) + 's · ' + clip.transition + (clip.source === '' ? ' · 缺源' : ' · ' + clip.source));
  }
  for (const item of timeline.diagnostics) lines.push('- ' + (item.severity === 'blocker' ? '阻断 ' : '提示 ') + (item.line === undefined ? '' : '第 ' + String(item.line) + ' 行 ') + item.message);
  return lines.join('\n');
}
