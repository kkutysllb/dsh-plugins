/**
 * 时间线装配（KToon 保留项）：按入出点重排/裁剪镜头，逐切点转场，统一画幅与帧率。
 *
 * 与 KToon renderTimeline 保持同一语义：
 * - cut 直接 concat，其余走 ffmpeg xfade；
 * - 转场是切点决策，未逐切点给出时回落全局；
 * - settb=AVTB + fps + setsar=1 先归一化再链式处理，避免混合分辨率下 xfade 失败；
 * - 转场时长不得吃掉任何一侧素材（夹到前链时长与后段时长）。
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const TIMELINE_TRANSITIONS = {
  fade: 'fade',
  dissolve: 'dissolve',
  wipeleft: 'wipeleft',
  slideup: 'slideup',
  flash: 'fadewhite'
};

export function resolveFfmpeg() {
  const candidates = [process.env.KTOON_FFMPEG, process.env.KYLIN_FFMPEG, process.env.FFMPEG_PATH, 'ffmpeg'];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate !== '') ?? 'ffmpeg';
}

export function resolveFfprobe() {
  const explicit = process.env.KTOON_FFPROBE ?? process.env.KYLIN_FFPROBE;
  if (typeof explicit === 'string' && explicit !== '') return explicit;
  const ffmpeg = resolveFfmpeg();
  return ffmpeg.includes('/') ? join(dirname(ffmpeg), 'ffprobe') : 'ffprobe';
}

function run(binary, args, timeoutMs = 900_000) {
  return new Promise((fulfil, reject) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('ffmpeg 超时（' + String(timeoutMs) + 'ms）'));
    }, timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) fulfil({ stdout, stderr });
      else reject(new Error('ffmpeg 退出码 ' + String(code) + '：' + stderr.slice(-1200)));
    });
  });
}

export async function probeMedia(path) {
  const probe = resolveFfprobe();
  const { stdout } = await run(probe, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path], 60_000);
  const payload = JSON.parse(stdout);
  const streams = Array.isArray(payload.streams) ? payload.streams : [];
  const video = streams.find((stream) => stream.codec_type === 'video');
  const audio = streams.find((stream) => stream.codec_type === 'audio');
  const rate = typeof video?.r_frame_rate === 'string' ? video.r_frame_rate.split('/') : [];
  const fps = rate.length === 2 && Number(rate[1]) > 0 ? Number(rate[0]) / Number(rate[1]) : 0;
  return {
    durationSec: Number(payload.format?.duration ?? video?.duration ?? 0),
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    fps: Number.isFinite(fps) ? Math.round(fps * 100) / 100 : 0,
    hasVideo: video !== undefined,
    hasAudio: audio !== undefined
  };
}

function even(value) {
  return Math.max(2, Math.round(value / 2) * 2);
}

function clampNumber(value, min, max, fallback) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

/** 生成 ffmpeg 参数并执行；返回成片信息。 */
export async function assembleTimeline(input, options = {}) {
  const projectPath = resolve(typeof input.projectPath === 'string' && input.projectPath !== '' ? input.projectPath : options.cwd ?? '.');
  const rawClips = Array.isArray(input.clips) ? input.clips : [];
  if (rawClips.length === 0) throw new Error('clips 不能为空');
  if (rawClips.length > 200) throw new Error('clips 最多 200 个片段');
  const width = even(clampNumber(input.width, 320, 4096, 1920));
  const height = even(clampNumber(input.height, 320, 4096, 1080));
  const fps = clampNumber(input.fps, 1, 60, 30);
  const crf = clampNumber(input.crf, 14, 32, 20);
  const fit = input.fit === 'cover' ? 'cover' : 'contain';
  const globalTransition = typeof input.transition === 'string' && input.transition !== '' ? input.transition : 'fade';
  const globalTransitionSec = clampNumber(input.transitionSec, 0, 1, 0);
  if (globalTransition !== 'cut' && TIMELINE_TRANSITIONS[globalTransition] === undefined) {
    throw new Error('transition 必须是 cut | ' + Object.keys(TIMELINE_TRANSITIONS).join(' | '));
  }
  const clips = rawClips.map((row, index) => {
    if (row === null || typeof row !== 'object') throw new Error('clips[' + String(index) + '] 必须是对象');
    const path = typeof row.path === 'string' ? resolve(projectPath, row.path) : '';
    if (path === '' || !existsSync(path)) throw new Error('片段不存在：' + String(row.path ?? ''));
    const inSec = clampNumber(row.inSec, 0, 300, 0);
    const outSec = clampNumber(row.outSec, 0.1, 300, 5);
    if (outSec <= inSec) throw new Error('clips[' + String(index) + '] 的 outSec 必须大于 inSec');
    const transition = typeof row.transition === 'string' && row.transition !== '' ? row.transition : undefined;
    if (transition !== undefined && transition !== 'cut' && TIMELINE_TRANSITIONS[transition] === undefined) {
      throw new Error('clips[' + String(index) + '].transition 不合法');
    }
    return {
      path,
      inSec,
      outSec,
      ...(transition === undefined ? {} : { transition }),
      ...(row.transitionSec === undefined || row.transitionSec === null ? {} : { transitionSec: clampNumber(row.transitionSec, 0, 1, 0) })
    };
  });
  const audioPath = typeof input.audioPath === 'string' && input.audioPath !== '' ? resolve(projectPath, input.audioPath) : '';
  if (audioPath !== '' && !existsSync(audioPath)) throw new Error('音轨不存在：' + input.audioPath);
  const audioStartSec = clampNumber(input.audioStartSec, 0, 600, 0);
  const audioVolume = clampNumber(input.audioVolume, 0, 2, 1);

  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  for (const clip of clips) args.push('-i', clip.path);
  if (audioPath !== '') args.push('-i', audioPath);

  const fitFilter = fit === 'cover'
    ? 'scale=' + String(width) + ':' + String(height) + ':force_original_aspect_ratio=increase,crop=' + String(width) + ':' + String(height)
    : 'scale=' + String(width) + ':' + String(height) + ':force_original_aspect_ratio=decrease,pad=' + String(width) + ':' + String(height) + ':(ow-iw)/2:(oh-ih)/2';
  const chain = fitFilter + ',fps=' + String(fps) + ',setsar=1,settb=AVTB';
  const filters = [];
  const durations = [];
  for (let index = 0; index < clips.length; index++) {
    const clip = clips[index];
    durations.push(clip.outSec - clip.inSec);
    filters.push('[' + String(index) + ':v]trim=start=' + String(clip.inSec) + ':end=' + String(clip.outSec)
      + ',setpts=PTS-STARTPTS,' + chain + '[v' + String(index) + ']');
  }
  let total = durations.reduce((sum, value) => sum + value, 0);
  const perCut = [];
  if (clips.length === 1) {
    filters.push('[v0]null[vout]');
  } else {
    let outputDuration = durations[0];
    let last = '[v0]';
    for (let index = 1; index < clips.length; index++) {
      const incoming = clips[index];
      const cutName = incoming.transition ?? globalTransition;
      const requested = incoming.transitionSec ?? globalTransitionSec;
      const xfade = cutName === 'cut' ? undefined : TIMELINE_TRANSITIONS[cutName];
      let duration = xfade === undefined ? 0 : requested;
      if (duration > 0) duration = Math.min(round3(duration), round3(outputDuration), round3(durations[index]));
      if (duration <= 0) {
        filters.push(last + '[v' + String(index) + ']concat=n=2:v=1:a=0[c' + String(index) + ']');
        last = '[c' + String(index) + ']';
        outputDuration = round3(outputDuration + durations[index]);
        perCut.push({ after: index, transition: 'cut', transitionSec: 0 });
      } else {
        const offset = Math.max(0, round3(outputDuration - duration));
        filters.push(last + '[v' + String(index) + ']xfade=transition=' + xfade + ':duration=' + String(duration) + ':offset=' + String(offset) + '[x' + String(index) + ']');
        last = '[x' + String(index) + ']';
        outputDuration = round3(outputDuration + durations[index] - duration);
        perCut.push({ after: index, transition: cutName, transitionSec: duration });
      }
    }
    filters.push(last + 'null[vout]');
    total = outputDuration;
  }
  if (audioPath !== '') {
    filters.push('[' + String(clips.length) + ':a]atrim=start=' + String(audioStartSec) + ',asetpts=PTS-STARTPTS,volume=' + String(audioVolume) + ',apad[aout]');
  }
  args.push('-filter_complex', filters.join(';'), '-map', '[vout]');
  if (audioPath === '') {
    args.push('-an');
  } else {
    args.push('-map', '[aout]', '-shortest', '-c:a', 'aac', '-b:a', '192k');
  }
  args.push('-r', String(fps), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p');

  const outputRelative = typeof input.output === 'string' && input.output !== '' ? input.output : '成片.mp4';
  const output = resolve(projectPath, outputRelative);
  if (!output.startsWith(projectPath)) throw new Error('输出路径必须在本集目录内');
  mkdirSync(dirname(output), { recursive: true });
  args.push(output);
  await run(resolveFfmpeg(), args);
  const size = statSync(output).size;
  return {
    output,
    relative: outputRelative,
    bytes: size,
    durationSec: round3(total),
    clips: clips.length,
    width,
    height,
    fps,
    transitions: perCut
  };
}

/** 在本集目录里按镜头 ID 找可用片段：优先 制作成果/片段，其次 素材。 */
export function findClipForShot(directory, id) {
  const roots = ['制作成果/片段', '制作成果', '素材/片段', '素材', '.'];
  for (const root of roots) {
    const absolute = join(directory, root);
    if (!existsSync(absolute)) continue;
    let entries;
    try { entries = readdirSync(absolute); } catch { continue; }
    const match = entries.find((name) => name.includes(id) && /\.(mp4|webm|mov|m4v)$/i.test(name));
    if (match !== undefined) return join(root, match);
  }
  return undefined;
}