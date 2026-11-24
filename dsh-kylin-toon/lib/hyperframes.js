/**
 * Hyperframes 渲染栈接入：用官方 HTML→MP4 引擎替换自研 ffmpeg 装配（新工程默认走这里）。
 *
 * - 工程在 剧集/<EP>/composition/：index.html + compositions/ + assets/；Studio 编辑同一组文件。
 * - render 调 hyperframes render，输出后用 ffprobe 与技术验证对账。
 * - preview 启动官方 Studio，并通过本地反代剥掉 frame-ancestors/X-Frame-Options，
 *   让麒麟引擎自带的浏览器（右栏 Browser）能直接嵌入，不再打开系统浏览器。
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, copyFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { connect as netConnect, createServer as netServer } from 'node:net';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeMedia } from './video/timeline.js';
import { STUDIO_LOCALE_SCRIPT } from './studio-i18n.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_DIRECTORY = '.kylin-toon';
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1920;
const DEFAULT_FPS = 30;

function chromePath() {
  const candidates = [
    process.env.HYPERFRAMES_BROWSER_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate !== '' && existsSync(candidate));
}

export function resolveHyperframesCli(cwd) {
  const candidates = [
    process.env.HYPERFRAMES_CLI,
    join(HERE, '..', 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs'),
    join(cwd, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs'),
    join(process.cwd(), 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs')
  ];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate !== '' && existsSync(candidate));
}

function envWithChrome() {
  const chrome = chromePath();
  return { ...process.env, ...(chrome === undefined ? {} : { HYPERFRAMES_BROWSER_PATH: chrome }) };
}

function runCli(cli, args, { cwd, timeoutMs = 1_800_000 } = {}) {
  return new Promise((fulfil, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd, env: envWithChrome(), stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('hyperframes 超时（' + String(timeoutMs) + 'ms）')); }, timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); fulfil({ code, stdout, stderr }); });
  });
}

function parseJsonOutput(stdout) {
  const text = String(stdout ?? '').trim();
  const start = text.indexOf('{');
  if (start < 0) return undefined;
  try { return JSON.parse(text.slice(start)); } catch { return undefined; }
}

function projectDirOf(cwd, episode) {
  return episode.projectDir ?? (episode.directory === '.' ? cwd : join(cwd, episode.directory));
}

export function compositionDir(cwd, episode) {
  return join(projectDirOf(cwd, episode), 'composition');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function safeId(value, fallback) {
  const cleaned = String(value ?? '').replace(/[^A-Za-z0-9_-]/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return cleaned === '' ? fallback : cleaned;
}

function shotText(shot) {
  return shot.fields?.台词 ?? shot.fields?.dialogue ?? shot.title ?? shot.id ?? '';
}

function findGsap(cli) {
  const candidates = [
    join(dirname(cli), '..', 'dist', 'vendor', 'npm', 'gsap@3.15.0', 'dist', 'gsap.min.js'),
    join(dirname(cli), '..', '..', 'gsap', 'dist', 'gsap.min.js'),
    join(process.cwd(), 'node_modules', 'gsap', 'dist', 'gsap.min.js')
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

function sceneHtml(id, shot, duration, { width, height, media }) {
  const title = escapeHtml(shot.title ?? '');
  const line = escapeHtml(shotText(shot));
  const durationText = duration.toFixed(3);
  const mediaTag = media === undefined
    ? ''
    : media.kind === 'video'
      ? `    <video id="${id}-media" class="clip" data-start="0" data-duration="${durationText}" data-media-start="${Number(media.inSec ?? 0).toFixed(3)}" data-track-index="0" src="${media.src}" muted playsinline preload="auto"></video>`
      : `    <img id="${id}-media" class="clip" data-start="0" data-duration="${durationText}" data-track-index="0" src="${media.src}" alt="" />`;
  const scrim = media === undefined ? '' : `    <div id="${id}-scrim"></div>`;
  const stageBackground = media === undefined
    ? 'background: radial-gradient(120% 80% at 50% 20%, #1b2230 0%, #0b0d12 70%); align-items: center; justify-content: center; text-align: center; padding: 140px;'
    : 'background: none; align-items: flex-start; justify-content: flex-end; text-align: left; padding: 120px 96px 160px;';
  return `<template>
  <style>
    #root { position: absolute; inset: 0; overflow: hidden; font-family: sans-serif; }
    #${id}-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    #${id}-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,7,10,.05) 0%, rgba(5,7,10,.15) 55%, rgba(5,7,10,.82) 100%); }
    #${id}-stage { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 22px; color: #f4f1ea; ${stageBackground} }
    #${id}-title { margin: 0; font-size: 64px; line-height: 1.1; letter-spacing: -0.03em; text-wrap: balance; }
    #${id}-line { margin: 0; max-width: 820px; color: #ded6c6; font-size: 32px; line-height: 1.5; text-shadow: 0 2px 18px rgba(0,0,0,.45); }
    #${id}-bar { width: 88px; height: 6px; border-radius: 3px; background: #d8b45a; flex: none; }
  </style>
  <div id="root" data-composition-id="${id}" data-width="${width}" data-height="${height}">
${mediaTag}
${scrim}
    <div id="${id}-stage"${media === undefined ? ` class="clip" data-start="0" data-duration="${durationText}" data-track-index="0"` : ''}>
      <div id="${id}-bar"></div>
      ${title === '' ? '' : `<h1 id="${id}-title">${title}</h1>`}
      ${line === '' ? '' : `<p id="${id}-line">${line}</p>`}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#${id}-stage", { scale: 1.02 }, { scale: 1, duration: 0.35, ease: "power2.out" }, 0);
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

function findShotMedia(mediaPaths, shotId, cwd) {
  const wanted = String(shotId ?? '').toLowerCase();
  if (wanted === '') return undefined;
  for (const candidate of mediaPaths) {
    const name = basename(String(candidate)).toLowerCase();
    if (!name.includes(wanted)) continue;
    if (!/\.(mp4|mov|webm|m4v|png|jpe?g|webp)$/i.test(name)) continue;
    const absolute = resolve(cwd, candidate);
    if (!existsSync(absolute)) continue;
    try {
      if (statSync(absolute).size > 200 * 1024 * 1024) continue;
    } catch { continue; }
    return { absolute, kind: VIDEO_EXT.test(name) ? 'video' : 'image' };
  }
  return undefined;
}

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg)$/i;

function copyAudioAssets(cwd, mediaPaths, dir) {
  const audio = [];
  const used = new Set();
  for (const candidate of mediaPaths) {
    const path = String(candidate ?? '');
    if (!AUDIO_EXT.test(path)) continue;
    const absolute = resolve(cwd, path);
    if (!existsSync(absolute)) continue;
    try { if (statSync(absolute).size > 200 * 1024 * 1024) continue; } catch { continue; }
    const base = basename(absolute).replace(/[^\p{L}\p{N}_.-]/gu, '-');
    let name = base;
    for (let suffix = 2; used.has(name); suffix += 1) name = base.replace(/(\.[^.]+)$/, '-' + String(suffix) + '$1');
    used.add(name);
    const target = join(dir, 'assets', 'audio', name);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(absolute, target);
    audio.push({ id: 'audio-' + String(audio.length + 1), src: 'assets/audio/' + name, source: absolute });
  }
  return audio;
}

function resolveSource(cwd, episode, source) {
  const candidates = [resolve(projectDirOf(cwd, episode), source), resolve(cwd, source)];
  return candidates.find((candidate) => existsSync(candidate));
}

/** 从分镜生成一个可被 Hyperframes Studio 打开、可 render 的最小工程。 */
export function scaffoldComposition(cwd, episode, projection, options = {}) {
  const cli = resolveHyperframesCli(cwd);
  if (cli === undefined) throw new Error('找不到 hyperframes CLI：安装 hyperframes@0.9.81，或设置 HYPERFRAMES_CLI');
  const dir = compositionDir(cwd, episode);
  const indexFile = join(dir, 'index.html');
  if (existsSync(indexFile) && options.force !== true) {
    return { created: false, path: (episode.directory === '.' ? '' : episode.directory + '/') + 'composition', dir };
  }
  const shots = projection?.shots ?? [];
  if (shots.length === 0) throw new Error('分镜里没有镜头，不能生成 HTML 工程');
  const width = Number(options.width) > 0 ? Number(options.width) : DEFAULT_WIDTH;
  const height = Number(options.height) > 0 ? Number(options.height) : DEFAULT_HEIGHT;
  const fps = Number(options.fps) > 0 ? Number(options.fps) : DEFAULT_FPS;
  mkdirSync(join(dir, 'compositions'), { recursive: true });
  mkdirSync(join(dir, 'assets'), { recursive: true });
  const mediaPaths = Array.isArray(options.media) ? options.media : [];
  const clips = Array.isArray(options.clips) ? options.clips : [];
  const clipById = new Map();
  for (const clip of clips) if (clip !== null && typeof clip === 'object' && clip.shotId !== undefined) clipById.set(clip.shotId, clip);
  const gsap = findGsap(cli);
  let gsapTag;
  if (gsap !== undefined) {
    copyFileSync(gsap, join(dir, 'assets', 'gsap.min.js'));
    gsapTag = '<script src="assets/gsap.min.js"></script>';
  } else {
    gsapTag = '<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>';
  }
  const audio = copyAudioAssets(cwd, mediaPaths, dir);
  let cursor = 0;
  const hosts = [];
  const scenes = [];
  const used = new Set();
  for (const [index, shot] of shots.entries()) {
    const base = safeId(shot.id, 'scene-' + String(index + 1));
    let id = base;
    for (let suffix = 2; used.has(id); suffix += 1) id = base + '-' + String(suffix);
    used.add(id);
    const clip = clipById.get(shot.id);
    const clipDuration = clip !== undefined && Number.isFinite(clip.outSec) && Number.isFinite(clip.inSec)
      ? Math.max(0, Number(clip.outSec) - Number(clip.inSec))
      : undefined;
    const duration = clipDuration !== undefined && clipDuration > 0
      ? clipDuration
      : (Number.isFinite(shot.duration) && shot.duration > 0 ? shot.duration : 3);
    const start = clip !== undefined && Number.isFinite(clip.start) ? Math.max(0, Number(clip.start)) : cursor;
    let found;
    if (clip !== undefined && typeof clip.source === 'string' && clip.source !== '') {
      const source = resolveSource(cwd, episode, clip.source);
      if (source !== undefined) found = { absolute: source, kind: VIDEO_EXT.test(source) ? 'video' : 'image' };
    }
    if (found === undefined) found = findShotMedia(mediaPaths, shot.id, cwd);
    let media;
    if (found !== undefined) {
      const extension = extname(found.absolute).toLowerCase();
      const target = join(dir, 'assets', 'media', id + extension);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(found.absolute, target);
      media = { src: 'assets/media/' + id + extension, kind: found.kind, source: found.absolute, inSec: clip !== undefined && Number.isFinite(clip.inSec) ? Number(clip.inSec) : 0 };
    }
    writeFileSync(join(dir, 'compositions', id + '.html'), sceneHtml(id, shot, duration, { width, height, media }), 'utf8');
    hosts.push('      <div id="' + id + '" data-composition-id="' + id + '" data-composition-src="compositions/' + id + '.html" data-start="' + start.toFixed(3) + '" data-duration="' + duration.toFixed(3) + '" data-track-index="1" data-track-kind="graphics" data-width="' + String(width) + '" data-height="' + String(height) + '"></div>');
    scenes.push({ id, shot: shot.id, start, duration, ...(media === undefined ? {} : { media: media.src }) });
    cursor = start + duration;
  }
  const total = Math.max(0.1, cursor);
  const index = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${width}, height=${height}" />
    ${gsapTag}
    <style>
      html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; background: #0b0d12; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total.toFixed(3)}" data-width="${String(width)}" data-height="${String(height)}" data-fps="${String(fps)}">
${hosts.join('\n')}
${audio.map((track) => '      <audio id="' + track.id + '" src="' + track.src + '" class="clip" data-start="0" data-duration="' + total.toFixed(3) + '" data-volume="1"></audio>').join('\n')}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
  writeFileSync(indexFile, index, 'utf8');
  writeFileSync(join(dir, 'hyperframes.json'), JSON.stringify({ registry: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry', paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' }, media: { autoProxy: false } }, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ id: safeId(episode.id, 'episode'), name: episode.id, createdAt: new Date().toISOString() }, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: safeId(episode.id, 'episode'), private: true, type: 'module', scripts: { dev: 'npx --yes hyperframes preview', check: 'npx --yes hyperframes check', render: 'npx --yes hyperframes render' } }, null, 2) + '\n', 'utf8');
  return { created: true, path: (episode.directory === '.' ? '' : episode.directory + '/') + 'composition', dir, scenes, audio, duration: total, width, height, fps, gsap: gsap === undefined ? 'cdn' : 'local' };
}

function sceneHostsOf(indexHtml) {
  const hosts = [];
  for (const tag of String(indexHtml).match(/<div[^>]*data-composition-src="[^"]+"[^>]*>/g) ?? []) {
    const attr = (name) => new RegExp(name + '="([^"]*)"').exec(tag)?.[1];
    hosts.push({ id: attr('data-composition-id'), src: attr('data-composition-src'), start: Number(attr('data-start')), duration: Number(attr('data-duration')) });
  }
  return hosts;
}

function repairSceneHtml(html) {
  const hasMediaClip = /<(?:video|img)[^>]*class="[^"]*\bclip\b[^"]*"/i.test(html);
  let changed = false;
  const repaired = String(html).replace(/<(div|p|h1|h2|h3|span|section|video|img)([^>]*)>/gi, (tag, name, attrs) => {
    if (!/\bclass="[^"]*\bclip\b[^"]*"/.test(attrs)) return tag;
    const idMatch = /id="([^"]+)"/.exec(attrs);
    const id = idMatch?.[1] ?? '';
    const isMedia = /^(video|img)$/i.test(name);
    const isStage = /-stage$/.test(id);
    const isGeneratedChild = /-(bar|title|line|scrim)$/.test(id);
    const drop = isGeneratedChild || (isStage && hasMediaClip);
    if (!drop || isMedia) return tag;
    changed = true;
    const next = attrs
      .replace(/\sclass="clip"/, '')
      .replace(/\sdata-start="[^"]*"/, '')
      .replace(/\sdata-duration="[^"]*"/, '')
      .replace(/\sdata-track-index="[^"]*"/, '');
    return '<' + name + next + '>';
  });
  return { html: repaired, changed };
}

/** 修复旧 scaffold 生成的 4 个计时元素：只保留 stage 或 media 一个 clip。 */
export function repairCompositionDir(dir) {
  const comps = join(dir, 'compositions');
  if (!existsSync(comps)) return { changed: [], scanned: 0 };
  const changed = [];
  let scanned = 0;
  for (const name of readdirSync(comps)) {
    if (!name.endsWith('.html')) continue;
    scanned += 1;
    const file = join(comps, name);
    const before = readFileSync(file, 'utf8');
    const result = repairSceneHtml(before);
    if (result.changed) {
      writeFileSync(file, result.html, 'utf8');
      changed.push(name);
    }
  }
  return { changed, scanned };
}

export function repairComposition(cwd, episode) {
  return repairCompositionDir(compositionDir(cwd, episode));
}

export async function compositionStatus(cwd, episode, options = {}) {
  const dir = compositionDir(cwd, episode);
  if (!existsSync(join(dir, 'index.html'))) return { present: false, dir, path: (episode.directory === '.' ? '' : episode.directory + '/') + 'composition' };
  const cli = resolveHyperframesCli(cwd);
  if (cli === undefined) return { present: true, cli: false, dir, path: (episode.directory === '.' ? '' : episode.directory + '/') + 'composition', error: '找不到 hyperframes CLI' };
  const result = await runCli(cli, ['lint', dir, '--json'], { cwd: dir, timeoutMs: 60_000 });
  const lint = parseJsonOutput(result.stdout);
  const hosts = sceneHostsOf(readFileSync(join(dir, 'index.html'), 'utf8'));
  const expected = (options.projection?.shots ?? []).map((shot) => safeId(shot.id, '')).filter((id) => id !== '');
  const hosted = hosts.map((host) => host.id).filter((id) => id !== undefined);
  const missing = expected.filter((id) => !hosted.includes(id));
  const extra = hosted.filter((id) => expected.length > 0 && !expected.includes(id));
  return {
    present: true,
    cli: true,
    dir,
    path: (episode.directory === '.' ? '' : episode.directory + '/') + 'composition',
    hosts,
    coverage: { expected: expected.length, hosted: hosted.length, missing, extra, ok: expected.length === 0 || (missing.length === 0 && extra.length === 0) },
    ok: lint?.ok === true,
    errorCount: lint?.errorCount ?? 0,
    warningCount: lint?.warningCount ?? 0,
    findings: lint?.findings ?? [],
    ...(result.code === 0 ? {} : { error: result.stderr.slice(-800) || ('lint 退出码 ' + String(result.code)) })
  };
}

function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function hashComposition(dir) {
  const hash = createHash('sha256');
  const files = [join(dir, 'index.html')];
  const comps = join(dir, 'compositions');
  if (existsSync(comps)) {
    for (const name of readdirSync(comps).filter((entry) => entry.endsWith('.html')).sort()) files.push(join(comps, name));
  }
  for (const file of files) {
    if (!existsSync(file)) continue;
    hash.update(file.slice(dir.length));
    hash.update(readFileSync(file));
  }
  return hash.digest('hex');
}

function expectedOf(indexHtml) {
  const attr = (name) => {
    const match = new RegExp(name + '="([^"]+)"').exec(indexHtml);
    return match === null ? undefined : match[1];
  };
  return {
    width: Number(attr('data-width')) || DEFAULT_WIDTH,
    height: Number(attr('data-height')) || DEFAULT_HEIGHT,
    fps: Number(attr('data-fps')) || DEFAULT_FPS,
    duration: Number(attr('data-duration')) || 0
  };
}

export async function renderComposition(cwd, episode, { output } = {}) {
  const cli = resolveHyperframesCli(cwd);
  if (cli === undefined) throw new Error('找不到 hyperframes CLI：安装 hyperframes@0.9.81，或设置 HYPERFRAMES_CLI');
  const dir = compositionDir(cwd, episode);
  if (!existsSync(join(dir, 'index.html'))) throw new Error('还没有 composition/index.html：先 toon_composition action=scaffold');
  const out = resolve(cwd, output ?? join(projectDirOf(cwd, episode), '制作成果', '成片', episode.id + '-html.mp4'));
  mkdirSync(dirname(out), { recursive: true });
  const expected = expectedOf(readFileSync(join(dir, 'index.html'), 'utf8'));
  const sourceHash = hashComposition(dir);
  const result = await runCli(cli, ['render', dir, '-o', out, '--json', '--no-wait', '--strict'], { cwd: dir, timeoutMs: 900_000 });
  if (result.code !== 0) throw new Error('hyperframes render 失败（退出码 ' + String(result.code) + '）：' + result.stderr.slice(-1500));
  const actual = await probeMedia(out);
  const checks = [
    { id: 'video', ok: actual.hasVideo, expected: '有视频流', actual: actual.hasVideo ? '有' : '无' },
    { id: 'width', ok: actual.width === expected.width, expected: expected.width, actual: actual.width },
    { id: 'height', ok: actual.height === expected.height, expected: expected.height, actual: actual.height },
    { id: 'fps', ok: Math.abs(actual.fps - expected.fps) <= 0.05, expected: expected.fps, actual: actual.fps },
    { id: 'duration', ok: expected.duration === 0 || Math.abs(actual.durationSec - expected.duration) <= Math.max(0.5, expected.duration * 0.02), expected: expected.duration, actual: actual.durationSec }
  ];
  const outputSha256 = sha256File(out);
  const verification = { ok: checks.every((check) => check.ok), expected, actual, checks };
  const reportDir = join(cwd, STATE_DIRECTORY, 'qc');
  mkdirSync(reportDir, { recursive: true });
  const report = join(reportDir, episode.id + '-html-render.json');
  writeFileSync(report, JSON.stringify({ schemaVersion: 1, episode: episode.id, at: new Date().toISOString(), output: out, sourceHash, outputSha256, verification }, null, 2) + '\n', 'utf8');
  return { ok: verification.ok, output: out, expected, actual, checks, verification, sourceHash, outputSha256, report: report.slice(cwd.length + 1) };
}

// ── Studio 反代：剥掉 SAMEORIGIN 头，让引擎自带浏览器可嵌入 ──────────────
const proxies = new Map();

function startProxy(targetUrl) {
  const target = new URL(targetUrl);
  const server = createServer((request, response) => {
    const upstream = httpRequest({
      hostname: target.hostname,
      port: target.port,
      path: request.url,
      method: request.method,
      headers: {
        ...request.headers,
        host: target.host,
        origin: target.origin,
        referer: target.origin + request.url,
        'sec-fetch-site': 'same-origin'
      }
    }, (upstreamResponse) => {
      const headers = { ...upstreamResponse.headers };
      delete headers['content-security-policy'];
      delete headers['x-frame-options'];
      delete headers['content-length'];
      const contentType = String(headers['content-type'] ?? '');
      const isStudioRoot = request.url === '/' || request.url.startsWith('/?');
      if (!isStudioRoot || !contentType.includes('text/html') || headers['content-encoding'] !== undefined) {
        response.writeHead(upstreamResponse.statusCode ?? 502, headers);
        upstreamResponse.pipe(response);
        return;
      }
      const chunks = [];
      upstreamResponse.on('data', (chunk) => chunks.push(chunk));
      upstreamResponse.on('end', () => {
        let html = Buffer.concat(chunks).toString('utf8');
        if (!html.includes('ktoon-studio-i18n')) html = html.replace('</body>', STUDIO_LOCALE_SCRIPT + '</body>');
        const body = Buffer.from(html, 'utf8');
        headers['content-length'] = String(body.length);
        response.writeHead(upstreamResponse.statusCode ?? 502, headers);
        response.end(body);
      });
    });
    upstream.on('error', () => { response.writeHead(502); response.end('studio proxy failed'); });
    request.pipe(upstream);
  });
  server.on('upgrade', (request, socket, head) => {
    const upstream = netConnect(Number(target.port), target.hostname, () => {
      upstream.write(request.method + ' ' + request.url + ' HTTP/1.1\r\n');
      for (const [key, value] of Object.entries(request.headers)) {
        if (key.toLowerCase() === 'host') upstream.write('host: ' + target.host + '\r\n');
        else upstream.write(key + ': ' + value + '\r\n');
      }
      upstream.write('\r\n');
      if (head.length > 0) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    upstream.on('error', () => socket.destroy());
  });
  return new Promise((fulfil, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      fulfil({ server, port, url: 'http://127.0.0.1:' + String(port) + '/' });
    });
  });
}

function freePort() {
  return new Promise((fulfil, reject) => {
    const server = netServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => fulfil(port));
    });
  });
}

export async function startStudio(cwd, episode) {
  const cli = resolveHyperframesCli(cwd);
  if (cli === undefined) throw new Error('找不到 hyperframes CLI：安装 hyperframes@0.9.81，或设置 HYPERFRAMES_CLI');
  const dir = compositionDir(cwd, episode);
  if (!existsSync(join(dir, 'index.html'))) throw new Error('还没有 composition/index.html：先 toon_composition action=scaffold');
  const port = await freePort();
  const result = await runCli(cli, ['preview', '--background', '--json', '--no-open', '--port', String(port)], { cwd: dir, timeoutMs: 60_000 });
  const payload = parseJsonOutput(result.stdout);
  const studioUrl = payload?.result?.studioUrl;
  if (studioUrl === undefined) throw new Error('preview 没有返回 studioUrl：' + result.stderr.slice(-800));
  const previous = proxies.get(dir);
  if (previous !== undefined) previous.server.close();
  const proxy = await startProxy(studioUrl);
  proxies.set(dir, proxy);
  const hash = new URL(studioUrl).hash;
  return { studioUrl, proxyUrl: proxy.url + hash, port: proxy.port, path: (episode.directory === '.' ? '' : episode.directory + '/') + 'composition' };
}

export async function stopStudio(cwd, episode) {
  const cli = resolveHyperframesCli(cwd);
  const dir = compositionDir(cwd, episode);
  const proxy = proxies.get(dir);
  if (proxy !== undefined) { proxy.server.close(); proxies.delete(dir); }
  if (cli === undefined) return { stopped: proxy !== undefined };
  const result = await runCli(cli, ['preview', '--stop', '--json'], { cwd: dir, timeoutMs: 30_000 });
  return { stopped: true, code: result.code };
}
