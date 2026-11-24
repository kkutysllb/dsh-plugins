/**
 * 视频参考（拍同款）：把参考片拆成可复用的结构骨架。
 *
 * 口径沿用 KToon 0.5.0：
 * - 只提取结构事实（切点、每镜时长、节奏、画幅/帧率、开场钩子），不做画面复用；
 * - 关键帧只落在 .kylin-toon/reference/frames/，作为分析与审阅依据，不进成片；
 * - 参考片是 G0 的前置条件：有参考片就必须分析、出 2–3 张方案、用户选定、版权确认。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { stateFile } from './video/routing.js';
import { probeMedia, resolveFfmpeg } from './video/timeline.js';
import { parseSubtitle } from './video/audio-qc.js';

export const PLAN_MIN = 2;
export const PLAN_MAX = 3;
export const RIGHTS_BASES = ['self', 'licensed', 'structure-only'];
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;
const REFERENCE_DIRS = ['参考视频', '参考片', 'reference', 'refs'];

export function referenceFile(cwd) {
  return stateFile(cwd, 'reference/analysis.json');
}

export function framesDir(cwd) {
  return stateFile(cwd, 'reference/frames');
}

export function readReference(cwd) {
  const file = referenceFile(cwd);
  if (!existsSync(file)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (parsed === null || typeof parsed !== 'object' || parsed.schemaVersion !== 1) return undefined;
    return parsed;
  } catch { return undefined; }
}

function writeReference(cwd, record) {
  const file = referenceFile(cwd);
  mkdirSync(join(cwd, '.kylin-toon', 'reference'), { recursive: true });
  const next = { ...record, revision: (record.revision ?? 0) + 1, updatedAt: new Date().toISOString() };
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return next;
}

/** ffmpeg showinfo 的 pts_time 行取切点。 */
export function parseCutTimes(stderr) {
  const times = [];
  for (const line of String(stderr ?? '').split('\n')) {
    const match = /pts_time:\s*([0-9]+(?:\.[0-9]+)?)/.exec(line);
    if (match === null) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 0) times.push(Math.round(value * 1000) / 1000);
  }
  return [...new Set(times)].sort((a, b) => a - b);
}

/** 切点 → 镜窗：首镜从 0，末镜到片尾，过短丢弃。 */
export function shotsFromCuts(cuts, durationSec) {
  const total = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : undefined;
  const points = cuts.filter((time) => time > 0.05 && (total === undefined || time < total - 0.1));
  const windows = [];
  let start = 0;
  for (const cut of points) {
    if (cut - start <= 0.05) continue;
    windows.push({ startSec: start, endSec: cut });
    start = cut;
  }
  if (total !== undefined && total - start > 0.05) windows.push({ startSec: start, endSec: total });
  else if (total === undefined && points.length === 0) windows.push({ startSec: 0, endSec: 0 });
  return windows;
}

/** 节奏：平均镜长、最长镜、每分钟切数、开场钩子。 */
export function pacingOf(shots, durationSec) {
  if (shots.length === 0) return { shotCount: 0, avgShotSec: 0, longestShotSec: 0, cutsPerMinute: 0 };
  const durations = shots.map((shot) => Math.max(0, shot.endSec - shot.startSec));
  const total = durations.reduce((sum, value) => sum + value, 0);
  const span = durationSec > 0 ? durationSec : total;
  const opening = shots[0]?.endSec;
  return {
    shotCount: shots.length,
    avgShotSec: Math.round((total / shots.length) * 1000) / 1000,
    longestShotSec: Math.round(Math.max(...durations) * 1000) / 1000,
    cutsPerMinute: span > 0 ? Math.round((Math.max(0, shots.length - 1) / span) * 60 * 100) / 100 : 0,
    ...(opening === undefined || opening <= 0 ? {} : { openingHookSec: opening })
  };
}

/** 结构启发式标签：只写体检与节奏能直接判定的说法，不编题材/情绪。 */
export function styleTags(probe, pacing) {
  const tags = [];
  if (Number.isFinite(probe.width) && Number.isFinite(probe.height) && probe.height > 0) {
    const ratio = probe.width / probe.height;
    tags.push(ratio > 1.2 ? '横屏' : ratio < 0.85 ? '竖屏' : '方形');
  }
  if (Number.isFinite(probe.fps) && probe.fps >= 50) tags.push('高帧率');
  if (Number.isFinite(probe.durationSec) && probe.durationSec <= 61) tags.push('短视频');
  if (pacing.avgShotSec > 0 && pacing.avgShotSec < 2.5) tags.push('快切');
  if (pacing.avgShotSec >= 6) tags.push('长镜头');
  if (pacing.openingHookSec !== undefined && pacing.openingHookSec <= 3) tags.push('开场3秒内切');
  return tags;
}

/** G0 前就绪口径：闸门与工具共用。 */
export function referenceReadiness(record) {
  if (record === undefined || record === null) return { ready: true, blockers: [] };
  const blockers = [];
  if (record.analysis === undefined) blockers.push('还没有参考分析（toon_reference_analyze）');
  if (!Array.isArray(record.plans) || record.plans.length < PLAN_MIN) blockers.push('还没有 ' + PLAN_MIN + '–' + PLAN_MAX + ' 张同款方案（toon_reference_plans）');
  if (record.chosenPlanId === undefined || record.chosenPlanId === '') blockers.push('用户还没选定同款方案（toon_reference_choose）');
  if (record.rights?.status !== 'confirmed') blockers.push('版权/来源还没确认（toon_reference_rights）');
  return { ready: blockers.length === 0, blockers };
}

/** 校验 agent 交上来的方案：2–3 张、id 唯一、keep/replace 各至少一条。 */
export function normalizePlans(raw) {
  if (!Array.isArray(raw)) throw new Error('plans 必须是数组');
  if (raw.length < PLAN_MIN || raw.length > PLAN_MAX) throw new Error('plans 必须是 ' + PLAN_MIN + '–' + PLAN_MAX + ' 张');
  const seen = new Set();
  return raw.map((item, index) => {
    if (item === null || typeof item !== 'object') throw new Error('plans[' + String(index) + '] 必须是对象');
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    if (id === '' || seen.has(id)) throw new Error('plans[' + String(index) + '] 的 id 缺失或重复');
    seen.add(id);
    const title = typeof item.title === 'string' ? item.title.trim().slice(0, 60) : '';
    const summary = typeof item.summary === 'string' ? item.summary.trim().slice(0, 400) : '';
    const keep = Array.isArray(item.keep) ? item.keep.filter((value) => typeof value === 'string' && value.trim() !== '').map((value) => value.trim().slice(0, 80)) : [];
    const replace = Array.isArray(item.replace) ? item.replace.filter((value) => typeof value === 'string' && value.trim() !== '').map((value) => value.trim().slice(0, 80)) : [];
    if (title === '' || summary === '') throw new Error('plan ' + id + ' 需要 title 与 summary');
    if (keep.length === 0 || replace.length === 0) throw new Error('plan ' + id + ' 的 keep 与 replace 各至少一条');
    const format = ['horizontal', 'vertical', 'concept', 'other'].includes(item.format) ? item.format : undefined;
    const targetDurationSec = Number.isFinite(Number(item.targetDurationSec)) && Number(item.targetDurationSec) > 0 ? Math.min(7200, Math.round(Number(item.targetDurationSec))) : undefined;
    const episodeCount = Number.isFinite(Number(item.episodeCount)) && Number(item.episodeCount) > 0 ? Math.min(500, Math.round(Number(item.episodeCount))) : undefined;
    const aspectRatio = typeof item.aspectRatio === 'string' && /^\d{1,2}:\d{1,2}$/.test(item.aspectRatio.trim()) ? item.aspectRatio.trim() : undefined;
    const platform = typeof item.platform === 'string' && item.platform.trim() !== '' ? item.platform.trim().slice(0, 40) : undefined;
    return {
      id, title, summary, keep, replace,
      ...(format === undefined ? {} : { format }),
      ...(targetDurationSec === undefined ? {} : { targetDurationSec }),
      ...(episodeCount === undefined ? {} : { episodeCount }),
      ...(aspectRatio === undefined ? {} : { aspectRatio }),
      ...(platform === undefined ? {} : { platform }),
      ...(typeof item.risks === 'string' && item.risks.trim() !== '' ? { risks: item.risks.trim().slice(0, 200) } : {})
    };
  });
}

async function run(binary, args, timeoutMs = 900_000) {
  return new Promise((fulfil, reject) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('ffmpeg 超时')); }, timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) fulfil({ stdout, stderr });
      else reject(new Error('ffmpeg 退出码 ' + String(code) + '：' + stderr.slice(-800)));
    });
  });
}

/** 在工作区里找候选参考片。 */
export function discoverReferenceVideos(cwd) {
  const found = [];
  const add = (absolute) => {
    if (!VIDEO_EXT.test(absolute)) return;
    try {
      const info = statSync(absolute);
      if (!info.isFile()) return;
      found.push({ path: relative(cwd, absolute), bytes: info.size });
    } catch { /* 读不到就跳过 */ }
  };
  for (const directory of REFERENCE_DIRS) {
    const base = join(cwd, directory);
    if (!existsSync(base)) continue;
    const walk = (current, depth) => {
      if (depth > 2) return;
      let entries = [];
      try { entries = readdirSync(current, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const absolute = join(current, entry.name);
        if (entry.isDirectory()) walk(absolute, depth + 1);
        else add(absolute);
      }
    };
    walk(base, 0);
  }
  try {
    for (const entry of readdirSync(cwd, { withFileTypes: true })) {
      if (entry.isFile() && /参考|同款|reference/i.test(entry.name)) add(join(cwd, entry.name));
    }
  } catch { /* 根目录读不到就跳过 */ }
  return found;
}

async function extractFrames(cwd, absolute, shots, limit = 24) {
  const dir = framesDir(cwd);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const indexed = shots.map((shot, index) => ({ ...shot, index: index + 1 }));
  const picked = indexed.length <= limit
    ? indexed
    : Array.from({ length: limit }, (_, index) => indexed[Math.round(index * (indexed.length - 1) / (limit - 1))]);
  for (const shot of picked) {
    const at = shot.startSec + Math.max(0.1, (shot.endSec - shot.startSec) / 2);
    const name = 'shot-' + String(shot.index).padStart(2, '0') + '.jpg';
    const output = join(dir, name);
    try {
      await run(resolveFfmpeg(), ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(Math.max(0, at)), '-i', absolute, '-frames:v', '1', '-vf', 'scale=480:-2', output], 60_000);
      if (existsSync(output)) frames.push(relative(cwd, output));
    } catch { /* 单帧失败不影响整体分析 */ }
  }
  return frames;
}

/** 探测 + 切点检测 + 关键帧 + 节奏，落成档案。 */
export async function analyzeReference(cwd, options = {}) {
  const record = readReference(cwd);
  if (record === undefined || record.source === undefined) throw new Error('还没有登记参考片（toon_reference_intake）');
  const absolute = resolve(cwd, record.source.path);
  if (!existsSync(absolute)) throw new Error('参考片不存在：' + record.source.path);
  const probe = await probeMedia(absolute);
  const maxSeconds = Math.min(1800, Math.max(10, Number(options.maxSeconds) || Math.ceil(probe.durationSec)));
  const sceneThreshold = Math.min(0.9, Math.max(0.1, Number(options.sceneThreshold) || 0.35));
  const { stderr } = await run(resolveFfmpeg(), [
    '-hide_banner', '-nostats', '-t', String(maxSeconds), '-i', absolute,
    '-filter_complex', "select='gt(scene," + String(sceneThreshold) + ")',showinfo", '-an', '-f', 'null', '-'
  ], 900_000);
  const cuts = parseCutTimes(stderr);
  const shots = shotsFromCuts(cuts, probe.durationSec);
  const pacing = pacingOf(shots, probe.durationSec);
  const frames = await extractFrames(cwd, absolute, shots);
  const analysis = {
    durationSec: probe.durationSec,
    width: probe.width,
    height: probe.height,
    fps: probe.fps,
    hasAudio: probe.hasAudio,
    sceneThreshold,
    cutsSec: cuts,
    shots: shots.map((shot, index) => ({ index: index + 1, startSec: shot.startSec, endSec: shot.endSec, durationSec: Math.round((shot.endSec - shot.startSec) * 1000) / 1000 })),
    pacing,
    tags: styleTags({ ...probe, durationSec: probe.durationSec }, pacing),
    frames,
    scannedSec: Math.min(maxSeconds, probe.durationSec),
    engine: 'ffmpeg-scene',
    analyzedAt: new Date().toISOString()
  };
  return writeReference(cwd, { ...record, status: 'analyzed', analysis, plans: undefined, chosenPlanId: undefined });
}

export function intakeReference(cwd, input) {
  const pathInput = typeof input.path === 'string' ? input.path.trim() : '';
  let relativePath = pathInput;
  if (relativePath === '') {
    const candidates = discoverReferenceVideos(cwd);
    if (candidates.length === 0) throw new Error('没有找到参考片：把视频放到 参考视频/ 或在对话里给出路径');
    relativePath = candidates[0].path;
  }
  const absolute = resolve(cwd, relativePath);
  if (!existsSync(absolute) || !statSync(absolute).isFile()) throw new Error('参考片不存在：' + relativePath);
  if (!VIDEO_EXT.test(relativePath)) throw new Error('参考片必须是视频文件');
  const source = {
    kind: 'file',
    path: relative(cwd, absolute),
    title: relativePath.split('/').pop() ?? relativePath,
    bytes: statSync(absolute).size,
    ...(typeof input.note === 'string' && input.note.trim() !== '' ? { note: input.note.trim().slice(0, 200) } : {})
  };
  return writeReference(cwd, { schemaVersion: 1, revision: 0, status: 'intake', source, rights: { status: 'pending' } });
}

export function savePlans(cwd, plans) {
  const record = readReference(cwd);
  if (record === undefined) throw new Error('还没有登记参考片');
  if (record.analysis === undefined) throw new Error('先跑 toon_reference_analyze');
  const normalized = normalizePlans(plans);
  return writeReference(cwd, { ...record, status: 'planned', plans: normalized, chosenPlanId: undefined });
}

export function choosePlan(cwd, planId) {
  const record = readReference(cwd);
  if (record === undefined || !Array.isArray(record.plans)) throw new Error('还没有同款方案');
  if (!record.plans.some((plan) => plan.id === planId)) throw new Error('方案不存在：' + planId);
  return writeReference(cwd, { ...record, status: 'chosen', chosenPlanId: planId });
}

export function confirmRights(cwd, basis, note) {
  if (!RIGHTS_BASES.includes(basis)) throw new Error('basis 必须是 self | licensed | structure-only');
  const record = readReference(cwd);
  if (record === undefined) throw new Error('还没有登记参考片');
  return writeReference(cwd, {
    ...record,
    rights: { status: 'confirmed', basis, ...(typeof note === 'string' && note.trim() !== '' ? { note: note.trim().slice(0, 200) } : {}), confirmedAt: new Date().toISOString() }
  });
}

function describeRecord(record) {
  if (record === undefined) return '# 参考片\n\n还没有登记参考片。把视频放到 参考视频/，或直接给路径。';
  const readiness = referenceReadiness(record);
  const lines = ['# 参考片 · ' + (record.source?.title ?? '未命名'), '', '来源：' + (record.source?.path ?? '-')];
  if (record.analysis !== undefined) {
    const pacing = record.analysis.pacing ?? {};
    lines.push('时长：' + String(Math.round(record.analysis.durationSec)) + 's · 画幅：' + String(record.analysis.width) + '×' + String(record.analysis.height) + ' · ' + String(record.analysis.fps) + 'fps');
    lines.push('镜头：' + String(pacing.shotCount ?? 0) + ' · 平均 ' + String(pacing.avgShotSec ?? 0) + 's · 最长 ' + String(pacing.longestShotSec ?? 0) + 's · 每分钟切 ' + String(pacing.cutsPerMinute ?? 0) + ' · 开场钩子 ' + (pacing.openingHookSec === undefined ? '无切点' : String(pacing.openingHookSec) + 's'));
    lines.push('结构标签：' + (record.analysis.tags ?? []).join(' / '));
    lines.push('关键帧：' + String((record.analysis.frames ?? []).length) + ' 张（.kylin-toon/reference/frames/）');
    if (Array.isArray(record.analysis.styleRefs) && record.analysis.styleRefs.length > 0) lines.push('定妆照风格参考：' + String(record.analysis.styleRefs.length) + ' 张（' + record.analysis.styleRefs.join('、') + '）');
    if (record.analysis.transcript !== undefined) {
      const segments = record.analysis.transcript.segments ?? [];
      lines.push('转写：' + String(segments.length) + ' 段（' + (record.analysis.transcript.method ?? 'asr') + '）');
      lines.push(...segments.slice(0, 5).map((segment) => '  ' + String(segment.startSec) + 's：' + segment.text.slice(0, 60)));
    }
  }
  if (Array.isArray(record.plans)) {
    lines.push('', '同款方案：');
    for (const plan of record.plans) lines.push('- ' + plan.id + ' ' + plan.title + '：保留 ' + plan.keep.join('、') + '；替换 ' + plan.replace.join('、'));
  }
  if (record.chosenPlanId !== undefined) lines.push('已选方案：' + record.chosenPlanId);
  lines.push('版权：' + (record.rights?.status === 'confirmed' ? '已确认（' + record.rights.basis + '）' : '待确认'));
  lines.push('G0 就绪：' + (readiness.ready ? '是' : '否 — ' + readiness.blockers.join('；')));
  return lines.join('\n');
}

/** 链接识别：只登记平台，不假装分析过在线视频。 */
export function platformOf(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (/youtube|youtu\.be/.test(host)) return 'youtube';
    if (/bilibili|b23\.tv/.test(host)) return 'bilibili';
    if (/douyin|iesdouyin/.test(host)) return 'douyin';
    if (/tiktok/.test(host)) return 'tiktok';
    if (/instagram/.test(host)) return 'instagram';
    if (/vimeo/.test(host)) return 'vimeo';
    return host;
  } catch { return undefined; }
}

/** 找本机 yt-dlp：KTOON_YTDLP / KYLIN_YTDLP → 常见安装位 → PATH。 */
export async function resolveYtDlp() {
  const candidates = [
    process.env.KTOON_YTDLP,
    process.env.KYLIN_YTDLP,
    join(process.env.HOME ?? '', '.ktoon/tools/venv/bin/yt-dlp'),
    join(process.env.HOME ?? '', '.ktoon/tools/yt-dlp'),
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp'
  ].filter((value) => typeof value === 'string' && value !== '');
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  try {
    await run('yt-dlp', ['--version'], 15_000);
    return 'yt-dlp';
  } catch { return undefined; }
}

function sanitizeFileName(name) {
  const cleaned = String(name ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 80) === '' ? 'reference-' + Date.now().toString(36) : cleaned.slice(0, 80);
}

/** 下载在线视频到 参考视频/ 并登记；没有 yt-dlp 时明确报安装方式，不伪造成功。 */
export async function fetchReferenceUrl(cwd, url, options = {}) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('链接不合法'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('只支持 http/https 链接');
  const binary = await resolveYtDlp();
  if (binary === undefined) {
    throw new Error('本机没有 yt-dlp：brew install yt-dlp，或 python3 -m venv ~/.ktoon/tools/venv && ~/.ktoon/tools/venv/bin/pip install yt-dlp；也可以先手动下载视频再登记。');
  }
  const directory = join(cwd, '参考视频');
  mkdirSync(directory, { recursive: true });
  const template = join(directory, '%(title).60s-%(id)s.%(ext)s');
  const args = ['--no-playlist', '--no-simulate', '--print', 'after_move:filepath', '-f', 'bv*[vcodec^=avc1]+ba/b[ext=mp4]/b', '--merge-output-format', 'mp4', '-o', template];
  const browser = typeof options.cookiesFromBrowser === 'string' ? options.cookiesFromBrowser.trim() : '';
  if (browser !== '') args.push('--cookies-from-browser', browser);
  args.push(url);
  const { stdout } = await run(binary, args, 1_800_000);
  const lines = stdout.split('\n').map((line) => line.trim()).filter((line) => line !== '');
  let downloaded = lines.reverse().find((line) => VIDEO_EXT.test(line) && existsSync(line));
  if (downloaded === undefined) {
    // 老版本 yt-dlp 不支持 after_move:filepath：退化为找参考视频目录里最新的视频。
    const entries = readdirSync(directory).filter((name) => VIDEO_EXT.test(name)).map((name) => ({ name, at: statSync(join(directory, name)).mtimeMs })).sort((a, b) => b.at - a.at);
    if (entries.length === 0) throw new Error('下载完成但没有找到视频文件');
    downloaded = join(directory, entries[0].name);
  }
  const relativePath = relative(cwd, downloaded);
  return intakeReference(cwd, { path: relativePath, note: '来源：' + url });
}

/** 链接只登记（不下载）：status=intake，source.kind=url。 */
export function registerReferenceUrl(cwd, url, note) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('链接不合法'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('只支持 http/https 链接');
  return writeReference(cwd, {
    schemaVersion: 1, revision: 0, status: 'intake',
    source: { kind: 'url', url, platform: platformOf(url), title: url, ...(typeof note === 'string' && note.trim() !== '' ? { note: note.trim().slice(0, 200) } : {}) },
    rights: { status: 'pending' }
  });
}

/** 写入转写分段（来自多媒体网关 ASR 或字幕文件）；不在这里跑 ASR。 */
export function saveTranscript(cwd, input) {
  const record = readReference(cwd);
  if (record === undefined || record.analysis === undefined) throw new Error('先跑 toon_reference_analyze');
  let segments = Array.isArray(input.segments) ? input.segments : [];
  let origin = 'tool';
  if (segments.length === 0 && typeof input.srtPath === 'string' && input.srtPath !== '') {
    const file = resolve(cwd, input.srtPath);
    if (!existsSync(file)) throw new Error('字幕不存在：' + input.srtPath);
    segments = parseSubtitle(readFileSync(file, 'utf8'));
    origin = input.srtPath;
  }
  if (segments.length === 0) throw new Error('没有可写入的分段：给 segments 或 srtPath');
  const normalized = [];
  for (const [index, segment] of segments.slice(0, 2000).entries()) {
    const start = Number(segment.startSec ?? segment.start);
    const end = Number(segment.endSec ?? segment.end);
    const text = typeof segment.text === 'string' ? segment.text.trim() : '';
    if (!Number.isFinite(start) || text === '') continue;
    normalized.push({ index: index + 1, startSec: Math.round(start * 1000) / 1000, endSec: Math.round((Number.isFinite(end) ? end : start) * 1000) / 1000, text: text.slice(0, 500) });
  }
  if (normalized.length === 0) throw new Error('分段都无效（需要 startSec 与 text）');
  return writeReference(cwd, {
    ...record,
    analysis: {
      ...record.analysis,
      transcript: {
        method: typeof input.method === 'string' ? input.method : 'asr',
        ...(typeof input.language === 'string' && input.language !== '' ? { language: input.language } : {}),
        source: origin,
        segments: normalized,
        transcribedAt: new Date().toISOString()
      }
    }
  });
}

/** 选定关键帧作为定妆照/视觉定调的风格参考（只用风格，不复用构图）。 */
export function setStyleRefs(cwd, input) {
  const record = readReference(cwd);
  if (record === undefined || record.analysis === undefined) throw new Error('先跑 toon_reference_analyze');
  const frames = Array.isArray(record.analysis.frames) ? record.analysis.frames : [];
  if (frames.length === 0) throw new Error('没有关键帧可作风格参考');
  let picked = [];
  if (input.all === true) picked = [...frames];
  else {
    const raw = Array.isArray(input.frames) ? input.frames : [];
    for (const item of raw) {
      if (typeof item === 'number') {
        const frame = frames[item - 1] ?? frames[item];
        if (frame !== undefined) picked.push(frame);
      } else if (typeof item === 'string' && frames.includes(item)) picked.push(item);
    }
  }
  picked = [...new Set(picked)];
  if (picked.length === 0) throw new Error('没有选到有效关键帧（用帧序号或 analysis.frames 里的路径）');
  return writeReference(cwd, {
    ...record,
    analysis: {
      ...record.analysis,
      styleRefs: picked,
      styleNote: typeof input.note === 'string' && input.note.trim() !== '' ? input.note.trim().slice(0, 300) : '定妆照/视觉定调风格参考，不复用构图与人物身份',
      styleRefsAt: new Date().toISOString()
    }
  });
}

const FORMAT_LABELS = { horizontal: '横屏', vertical: '竖屏', concept: '概念片', other: '其他' };

/** 导出人能读的参考拆解与方案，给下游技能或创作者直接引用。 */
export function exportReference(cwd) {
  const record = readReference(cwd);
  if (record === undefined || record.analysis === undefined) throw new Error('先跑 toon_reference_analyze');
  const analysis = record.analysis;
  const plans = Array.isArray(record.plans) ? record.plans : [];
  const lines = [];
  lines.push('# 参考拆解：' + (record.source?.title ?? '参考片'));
  lines.push('');
  lines.push('- 来源：' + (record.source?.path ?? record.source?.url ?? '未知'));
  if (record.source?.url !== undefined) lines.push('- 链接：' + record.source.url);
  lines.push('- 时长：' + String(analysis.durationSec) + 's（扫描 ' + String(analysis.scannedSec ?? analysis.durationSec) + 's）');
  lines.push('- 画幅：' + String(analysis.width) + '×' + String(analysis.height) + '，' + String(analysis.fps) + 'fps，' + (analysis.hasAudio ? '有音轨' : '无音轨'));
  lines.push('- 节奏：' + String(analysis.pacing?.shotCount ?? 0) + ' 镜，平均 ' + String(analysis.pacing?.avgShotSec ?? 0) + 's，最长 ' + String(analysis.pacing?.longestShotSec ?? 0) + 's，每分钟 ' + String(analysis.pacing?.cutsPerMinute ?? 0) + ' 刀，开场钩子 ' + (analysis.pacing?.openingHookSec === undefined ? '无切点' : String(analysis.pacing.openingHookSec) + 's'));
  lines.push('- 标签：' + (analysis.tags ?? []).join('、'));
  lines.push('- 版权：' + (record.rights?.status === 'confirmed' ? ({ self: '自有', licensed: '已授权', 'structure-only': '只学结构不复用画面' }[record.rights.basis] ?? record.rights.basis) : '未确认'));
  if (Array.isArray(analysis.styleRefs) && analysis.styleRefs.length > 0) lines.push('- 定妆照风格参考：' + analysis.styleRefs.join('、'));
  if (analysis.transcript !== undefined) lines.push('- 转写：' + String((analysis.transcript.segments ?? []).length) + ' 段（' + (analysis.transcript.method ?? 'asr') + '）');
  lines.push('');
  lines.push('## 镜头表');
  lines.push('');
  lines.push('| # | 入点 | 出点 | 时长 |');
  lines.push('| --- | --- | --- | --- |');
  for (const shot of analysis.shots ?? []) lines.push('| ' + String(shot.index) + ' | ' + String(shot.startSec) + 's | ' + String(shot.endSec) + 's | ' + String(shot.durationSec) + 's |');
  if (plans.length > 0) {
    lines.push('');
    lines.push('## 同款方案');
    for (const plan of plans) {
      lines.push('');
      lines.push('### ' + plan.id + ' · ' + plan.title + (record.chosenPlanId === plan.id ? '（已选）' : ''));
      lines.push('');
      const spec = [];
      if (plan.format !== undefined) spec.push('形态：' + (FORMAT_LABELS[plan.format] ?? plan.format));
      if (plan.aspectRatio !== undefined) spec.push('画幅：' + plan.aspectRatio);
      if (plan.targetDurationSec !== undefined) spec.push('目标时长：' + (plan.targetDurationSec < 120 ? String(plan.targetDurationSec) + ' 秒' : String(Math.round(plan.targetDurationSec / 60)) + ' 分钟'));
      if (plan.episodeCount !== undefined) spec.push('集数：' + String(plan.episodeCount));
      if (plan.platform !== undefined) spec.push('平台：' + plan.platform);
      if (spec.length > 0) lines.push(spec.join('；'));
      lines.push('');
      lines.push(plan.summary);
      lines.push('');
      lines.push('- 保留：' + (plan.keep ?? []).join('、'));
      lines.push('- 替换：' + (plan.replace ?? []).join('、'));
      if (plan.risks !== undefined) lines.push('- 风险：' + plan.risks);
    }
  }
  lines.push('');
  const directory = join(cwd, '参考视频');
  mkdirSync(directory, { recursive: true });
  const target = join(directory, '参考拆解.md');
  writeFileSync(target, lines.join('\n'), 'utf8');
  return { path: relative(cwd, target), markdown: lines.join('\n') };
}

/** 清除当前参考片档案（归档旧状态并删关键帧），方便换一条参考片。 */
export function resetReference(cwd) {
  const record = readReference(cwd);
  if (record === undefined) return { cleared: false, message: '还没有登记参考片' };
  const file = referenceFile(cwd);
  const archive = stateFile(cwd, 'reference/archive');
  mkdirSync(archive, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  try { renameSync(file, join(archive, stamp + '.json')); } catch { /* 归档失败就继续删 */ }
  try { rmSync(framesDir(cwd), { recursive: true, force: true }); } catch { /* 清帧失败不影响清状态 */ }
  return { cleared: true, message: '已清除参考片档案（旧状态归档到 .kylin-toon/reference/archive）' };
}

/** 工具集：cwd 解析与其它 toon_* 工具一致。 */
export function createReferenceTools(workingDirectory) {
  const cwdOf = async (exec) => {
    try {
      if (workingDirectory !== undefined && workingDirectory !== null && exec?.agent?.session !== undefined) {
        if (typeof workingDirectory.get === 'function') return resolve(workingDirectory.get(exec.agent.session));
        if (typeof workingDirectory.ensure === 'function') return resolve(await workingDirectory.ensure(exec.agent, exec.signal));
      }
    } catch { /* 目录服务不可用 */ }
    return process.cwd();
  };
  const out = (title) => ({
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: String(value) }],
    presentationMeta: () => ({ title })
  });
  return [
    {
      name: 'toon_reference_intake',
      output: out('参考片登记'),
      description: '登记参考视频（本地文件）：体检、记录来源。参考片是拍同款的前置条件；只学结构，不复用画面。',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '相对工作区的视频路径；省略时自动在 参考视频/ 里找' },
          note: { type: 'string', description: '来源备注（可选）' }
        },
        additionalProperties: false
      },
      timeoutMs: 60000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec);
        const record = intakeReference(cwd, args ?? {});
        return '已登记参考片：' + record.source.path + '（' + String(Math.round(record.source.bytes / 1024 / 1024)) + 'MB）。下一步：toon_reference_analyze。';
      }
    },
    {
      name: 'toon_reference_analyze',
      output: out('参考片拆解'),
      description: '拆参考片结构：ffmpeg 场景切点 → 镜窗 → 节奏（平均/最长镜、每分钟切数、开场钩子）→ 结构标签 → 全片均匀取关键帧。需要本机 ffmpeg。不做画面复用。',
      parameters: {
        type: 'object',
        properties: {
          sceneThreshold: { type: 'number', description: '场景阈值 0.1–0.9，越大切点越少；缺省 0.35' },
          maxSeconds: { type: 'number', description: '最多分析前 N 秒；缺省全片（上限 1800）' }
        },
        additionalProperties: false
      },
      timeoutMs: 900000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec);
        const record = await analyzeReference(cwd, args ?? {});
        return describeRecord(record);
      }
    },
    {
      name: 'toon_reference_plans',
      output: out('同款方案'),
      description: '提交 2–3 张差异化同款方案：keep=保留的结构，replace=要换掉的内容。必须已有分析；新方案会作废之前的选择。',
      parameters: {
        type: 'object',
        properties: {
          plans: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string' },
                keep: { type: 'array', items: { type: 'string' } },
                replace: { type: 'array', items: { type: 'string' } },
                risks: { type: 'string' }
              },
              required: ['id', 'title', 'summary', 'keep', 'replace'],
              additionalProperties: false
            }
          }
        },
        required: ['plans'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec);
        const record = savePlans(cwd, args.plans);
        return '已保存 ' + String(record.plans.length) + ' 张同款方案：' + record.plans.map((plan) => plan.id + ' ' + plan.title).join('；') + '。等创作者选定后再进入 G0。';
      }
    },
    {
      name: 'toon_reference_choose',
      output: out('选定方案'),
      description: '记录创作者选定的同款方案。必须是在对话里得到创作者明确选择之后调用，不能代选。',
      parameters: {
        type: 'object',
        properties: { planId: { type: 'string' }, confirmed: { type: 'boolean', description: '创作者已明确选定' } },
        required: ['planId', 'confirmed'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        if (args.confirmed !== true) throw new Error('必须得到创作者确认后才能选定方案');
        const cwd = await cwdOf(exec);
        const record = choosePlan(cwd, args.planId);
        return '已选定方案 ' + record.chosenPlanId + '。下一步：确认版权（toon_reference_rights）。';
      }
    },
    {
      name: 'toon_reference_rights',
      output: out('版权确认'),
      description: '确认参考片版权口径：self=自有 / licensed=已授权 / structure-only=只学结构不复用画面。必须在创作者明确确认后调用。',
      parameters: {
        type: 'object',
        properties: {
          basis: { type: 'string', enum: RIGHTS_BASES },
          note: { type: 'string' },
          confirmed: { type: 'boolean', description: '创作者已明确确认' }
        },
        required: ['basis', 'confirmed'],
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        if (args.confirmed !== true) throw new Error('必须得到创作者确认后才能登记版权');
        const cwd = await cwdOf(exec);
        const record = confirmRights(cwd, args.basis, args.note);
        return describeRecord(record);
      }
    },
    {
      name: 'toon_reference_status',
      output: out('参考片状态'),
      description: '只读查看参考片档案：来源、分析、方案、选定、版权与 G0 就绪情况。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      timeoutMs: 15000,
      execute: async (_args, exec) => {
        const cwd = await cwdOf(exec);
        return describeRecord(readReference(cwd));
      }
    },
    {
      name: 'toon_reference_fetch',
      output: out('参考片下载'),
      description: '用本机 yt-dlp 把在线参考视频下载到 参考视频/ 并登记。没有 yt-dlp 时返回安装方式，不伪造成功。仅 http/https。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '视频链接（YouTube / Bilibili / 抖音等，取决于 yt-dlp）' },
          cookiesFromBrowser: { type: 'string', description: '可选：chrome / safari / edge，给需要登录态的站点' },
          note: { type: 'string' }
        },
        required: ['url'],
        additionalProperties: false
      },
      timeoutMs: 1800000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec);
        const record = await fetchReferenceUrl(cwd, args.url, { cookiesFromBrowser: args.cookiesFromBrowser });
        return '已下载并登记参考片：' + record.source.path + '。下一步：toon_reference_analyze。';
      }
    },
    {
      name: 'toon_reference_transcript',
      output: out('参考片转写'),
      description: '把已经拿到的转写分段（来自多媒体网关 media_audio action=transcribe，或字幕文件）写进参考档案。插件不自己跑 ASR。',
      parameters: {
        type: 'object',
        properties: {
          segments: { type: 'array', items: { type: 'object', additionalProperties: true }, description: '分段 [{startSec,endSec,text}]；也接受 start/end' },
          srtPath: { type: 'string', description: '或给相对工作区的 SRT/VTT 路径' },
          language: { type: 'string' },
          method: { type: 'string', description: '缺省 asr' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec);
        const record = saveTranscript(cwd, args ?? {});
        return describeRecord(record);
      }
    },
    {
      name: 'toon_reference_style_refs',
      output: out('定妆照风格参考'),
      description: '把选定的参考片关键帧标记为定妆照/视觉定调的风格参考：只用风格（色调、光线、质感），不复用构图与人物身份。返回可用于 media_upload 的图片路径。',
      parameters: {
        type: 'object',
        properties: {
          frames: { type: 'array', items: { type: ['string', 'number'] }, description: '帧序号（从 1 起）或 analysis.frames 里的相对路径' },
          all: { type: 'boolean', description: '全部关键帧都作风格参考' },
          note: { type: 'string', description: '风格说明（可选）' }
        },
        additionalProperties: false
      },
      timeoutMs: 30000,
      execute: async (args, exec) => {
        const cwd = await cwdOf(exec);
        const record = setStyleRefs(cwd, args ?? {});
        const refs = record.analysis.styleRefs;
        return ['已标记 ' + String(refs.length) + ' 张定妆照风格参考：', ...refs.map((ref) => '- ' + ref), '', '出定妆照时：先用 media_upload 上传这些图，再 media_generate（图片改图/参考生图）并写明「只用光线、色调、质感，不复用构图与人物身份」。'].join('\n');
      }
    },
    {
      name: 'toon_reference_export',
      output: out('参考拆解导出'),
      description: '把参考片的拆解、镜头表、同款方案、版权与风格参考导出成人能读的 Markdown（参考视频/参考拆解.md），供下游技能或创作者直接使用。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      timeoutMs: 30000,
      execute: async (_args, exec) => {
        const cwd = await cwdOf(exec);
        const exported = exportReference(cwd);
        return '已导出：' + exported.path;
      }
    },
    {
      name: 'toon_reference_reset',
      output: out('清除参考片'),
      description: '清除当前参考片档案（旧状态归档到 .kylin-toon/reference/archive，关键帧一并删除），用于换一条参考片。',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      timeoutMs: 30000,
      execute: async (_args, exec) => {
        const cwd = await cwdOf(exec);
        return resetReference(cwd).message;
      }
    }
  ];
}