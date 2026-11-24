/**
 * 工作台 HTTP 面：只服务本机回环，所有路径都限制在工作区内。
 *
 * 端点：
 *   GET  /kylin-toon/workspace?sessionId=...        工作区文件树与工程识别
 *   GET  /kylin-toon/file?sessionId=...&path=...    读可编辑文本（带版本）
 *   PUT  /kylin-toon/file?sessionId=...&path=...    乐观并发保存
 *   GET  /kylin-toon/media?sessionId=...&path=...   媒体字节流（Range）
 *   GET  /kylin-toon/drama?sessionId=...&episode=... 本集投影与诊断
 *   GET  /kylin-toon/gates?sessionId=...&episode=... 交付闸门
 *   GET  /kylin-toon/game?sessionId=...&project=...  互动游戏工程阶段投影
 *   GET  /kylin-toon/game-preview/<id>/...          可玩构建沙箱
 *   GET  /kylin-toon/intents?sessionId=...&since=... 生产意图
 *   GET  /kylin-toon/health                         健康检查
 */
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, realpath, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { scanWorkspace } from './projects.js';
import {
  DRAMA_DIRECTORY,
  GAME_DIRECTORY,
  STATE_DIRECTORY,
  isCreativePath,
  isEditablePath,
  isMediaPath,
  mediaMimeType,
  safeRelativePath
} from './paths.js';
import { projectEpisode } from './drama.js';
import { motionTemplate, validateMotion } from './motion.js';
import { createDramaVersion, listDramaVersions, restoreDramaVersion } from './drama-versions.js';
import { applyRecipe, describeRecipes, getRecipe, listRecipes } from './drama-recipes.js';
import { applyTemplate, createTemplate, getTemplate, listTemplates } from './drama-templates.js';
import { readRecreatePlan, writeRecreatePlan } from './recreate.js';
import { parseEditList } from './timeline.js';
import { compositionStatus, renderComposition, repairComposition, scaffoldComposition, startStudio, stopStudio } from './hyperframes.js';
import { evaluateGates } from './video/gates.js';
import { listIntents } from './intents.js';
import { buildAdaptation, buildChapterTask, buildPublish, chapterContext, createChapter, finalizeChapter, importNovel, initNovel, listNovelProjects, novelProjection, removeCharacter, removeWorldEntry, reviewChapter, scanChapters, setActiveNovel, upsertCharacter, upsertWorldEntry } from './novel.js';
import { analyzeReference, choosePlan, confirmRights, discoverReferenceVideos, exportReference, fetchReferenceUrl, intakeReference, readReference, referenceReadiness, resetReference } from './reference.js';
import { gameProjection, initGameProject, listGameProjects, readBriefForm, saveBriefFields, setActiveGame } from './game.js';
import { applyStageTemplate, chooseConcept, listConceptOptions, stageTemplate } from './game-stage.js';
import { createSnapshot, deleteSnapshot, listSnapshots, restoreSnapshot } from './game-snapshots.js';
import { qaIsolationOf, readQaBrief, recordQaSession, writeQaBrief } from './game-qa.js';

const MAX_BODY = 8 * 1024 * 1024;
const clientStatuses = new Map();

function errorPayload(message) {
  return JSON.stringify({ error: message });
}

function send(response, status, payload) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(body);
}

function isLoopbackHost(host) {
  const value = String(host ?? '').toLowerCase().replace(/^\[|\]$/g, '').replace(/:\d+$/, '');
  return value === '127.0.0.1' || value === 'localhost' || value === '::1';
}

/** 回环 + 同源 + 非跨站；跨站页面拿不到工作区。 */
export function isTrustedRequest(request, trustedHosts = []) {
  const host = request.headers.host;
  if (typeof host !== 'string') return false;
  const hostname = host.toLowerCase().replace(/^\[|\]$/g, '').replace(/:\d+$/, '');
  if (!isLoopbackHost(host) && !trustedHosts.includes(hostname) && !trustedHosts.includes(host)) return false;
  const site = request.headers['sec-fetch-site'];
  if (typeof site === 'string' && site === 'cross-site') return false;
  const origin = request.headers.origin;
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    try {
      if (new URL(origin).host !== host) return false;
    } catch { return false; }
  }
  return true;
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function bodyJson(request, limit = MAX_BODY) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > limit) throw new HttpError(413, '请求体过大');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw new HttpError(400, '请求体不是合法 JSON'); }
}

async function resolveCwd(ctx, url) {
  const sessionId = url.searchParams.get('sessionId');
  if (typeof sessionId === 'string' && sessionId !== '') {
    try {
      const sessions = ctx.get('sessions');
      const session = sessions !== undefined && typeof sessions.get === 'function' ? sessions.get(sessionId) : undefined;
      if (session !== undefined) {
        try {
          const workingDirectory = ctx.get('workingDirectory');
          const value = workingDirectory !== undefined && typeof workingDirectory.get === 'function' ? workingDirectory.get(session) : undefined;
          if (typeof value === 'string' && value !== '') return resolve(value);
        } catch { /* 目录服务不可用时退回会话头 */ }
        const header = session.header;
        if (header !== undefined && typeof header.cwd === 'string' && header.cwd !== '') return resolve(header.cwd);
      }
    } catch { /* 会话不存在时退回显式 cwd */ }
  }
  const explicit = url.searchParams.get('cwd');
  if (typeof explicit === 'string' && explicit !== '') {
    const resolved = resolve(explicit);
    const info = await stat(resolved).catch(() => undefined);
    if (info !== undefined && info.isDirectory()) return resolved;
  }
  throw new HttpError(409, '找不到这个会话的工作区目录。请在已打开工作区的会话里使用创作台。');
}

function versionOf(info) {
  return Math.floor(info.mtimeMs).toString(36) + '-' + info.size.toString(36);
}

async function textPayload(root, relPath) {
  const safe = safeRelativePath(relPath);
  if (safe === undefined) throw new HttpError(400, '路径不合法');
  if (!isEditablePath(safe)) throw new HttpError(403, '只能编辑创作目录里的文本文件');
  const absolute = resolve(root, safe);
  if (!absolute.startsWith(root)) throw new HttpError(403, '路径越界');
  const info = await stat(absolute).catch(() => undefined);
  if (info === undefined || !info.isFile()) throw new HttpError(404, '文件不存在');
  const content = await readFile(absolute, 'utf8');
  return { path: safe, content, bytes: Buffer.byteLength(content), version: versionOf(info) };
}

async function saveText(root, relPath, body, maxBytes) {
  const safe = safeRelativePath(relPath);
  if (safe === undefined) throw new HttpError(400, '路径不合法');
  if (!isEditablePath(safe)) throw new HttpError(403, '只能编辑创作目录里的文本文件');
  if (typeof body.content !== 'string') throw new HttpError(400, 'content 必须是字符串');
  if (Buffer.byteLength(body.content) > maxBytes) throw new HttpError(413, '文件超过大小限制');
  if (typeof body.baseVersion !== 'string' || body.baseVersion === '') throw new HttpError(400, 'baseVersion 必须是有效版本');
  const absolute = resolve(root, safe);
  if (!absolute.startsWith(root)) throw new HttpError(403, '路径越界');
  const info = await stat(absolute).catch(() => undefined);
  if (info === undefined) throw new HttpError(404, '文件不存在');
  const current = versionOf(info);
  if (current !== body.baseVersion) {
    const content = await readFile(absolute, 'utf8');
    const payload = JSON.stringify({ error: '文件已在磁盘上更新，请处理冲突后再保存', conflict: true, path: safe, content, version: current, bytes: Buffer.byteLength(content) });
    responseConflict(payload);
    return undefined;
  }
  const temp = join(dirname(absolute), '.' + String(process.pid) + '.' + Date.now().toString(36) + '.tmp');
  await writeFile(temp, body.content, 'utf8');
  await rename(temp, absolute);
  const after = await stat(absolute);
  return { path: safe, content: body.content, bytes: Buffer.byteLength(body.content), version: versionOf(after) };
}

// 冲突要走带状态的响应，但 saveText 不持有 response；用异常携带 payload。
class ConflictError extends HttpError {
  constructor(payload) { super(412, payload); this.payload = payload; }
}
function responseConflict(payload) { throw new ConflictError(payload); }

function parseRange(header, size) {
  if (typeof header !== 'string') return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (match === null) return undefined;
  let start = match[1] === '' ? undefined : Number(match[1]);
  let end = match[2] === '' ? undefined : Number(match[2]);
  if (start === undefined) {
    if (end === undefined) return undefined;
    start = Math.max(0, size - end);
    end = size - 1;
  } else if (end === undefined || end >= size) {
    end = size - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return undefined;
  return { start, end };
}

async function sendMedia(request, response, root, relPath) {
  const safe = safeRelativePath(relPath);
  if (safe === undefined || !isMediaPath(safe)) throw new HttpError(400, '不是可预览的媒体路径');
  const absolute = resolve(root, safe);
  if (!absolute.startsWith(root)) throw new HttpError(403, '路径越界');
  const info = await stat(absolute).catch(() => undefined);
  if (info === undefined || !info.isFile()) throw new HttpError(404, '文件不存在');
  const mime = mediaMimeType(safe);
  const range = parseRange(request.headers.range, info.size);
  if (request.method === 'HEAD') {
    response.writeHead(200, { 'content-type': mime, 'content-length': info.size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
    response.end();
    return;
  }
  if (request.headers.range !== undefined && range === undefined) {
    response.writeHead(416, { 'content-range': 'bytes */' + String(info.size) });
    response.end();
    return;
  }
  if (range === undefined) {
    response.writeHead(200, { 'content-type': mime, 'content-length': info.size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' });
    createReadStream(absolute).pipe(response);
    return;
  }
  response.writeHead(206, {
    'content-type': mime,
    'content-range': 'bytes ' + String(range.start) + '-' + String(range.end) + '/' + String(info.size),
    'content-length': range.end - range.start + 1,
    'accept-ranges': 'bytes',
    'cache-control': 'no-store'
  });
  createReadStream(absolute, { start: range.start, end: range.end }).pipe(response);
}

async function sendGamePreview(ctx, response, pathname) {
  const rest = pathname.slice('/kylin-toon/game-preview/'.length);
  const slash = rest.indexOf('/');
  if (slash <= 0) throw new HttpError(404, '缺少游戏构建路径');
  const id = rest.slice(0, slash);
  const inner = safeRelativePath(rest.slice(slash + 1));
  if (inner === undefined) throw new HttpError(400, '构建路径不合法');
  const sessions = ctx.get('sessions');
  const workingDirectory = ctx.get('workingDirectory');
  let cwd;
  for (const session of typeof sessions?.list === 'function' ? sessions.list() : []) {
    try {
      const value = typeof workingDirectory?.get === 'function' ? workingDirectory.get(session) : undefined;
      if (typeof value === 'string' && existsSync(join(value, GAME_DIRECTORY, id, 'build', 'app', 'index.html'))) { cwd = value; break; }
    } catch { /* 跳过不可用会话 */ }
  }
  if (cwd === undefined) throw new HttpError(404, '找不到游戏构建；先在当前工作区生成 build/app/index.html');
  const root = join(cwd, GAME_DIRECTORY, id, 'build', 'app');
  const absolute = resolve(root, inner);
  if (!absolute.startsWith(root)) throw new HttpError(403, '构建路径越界');
  const info = await stat(absolute).catch(() => undefined);
  if (info === undefined || !info.isFile()) throw new HttpError(404, '构建文件不存在');
  const ext = inner.slice(inner.lastIndexOf('.')).toLowerCase();
  const mime = ext === '.html' ? 'text/html; charset=utf-8'
    : ext === '.js' || ext === '.mjs' ? 'text/javascript; charset=utf-8'
    : ext === '.css' ? 'text/css; charset=utf-8'
    : ext === '.json' ? 'application/json; charset=utf-8'
    : mediaMimeType(inner);
  response.writeHead(200, {
    'content-type': mime,
    'content-length': info.size,
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self'"
  });
  createReadStream(absolute).pipe(response);
}

async function readEpisodeDocuments(root, episode) {
  // 按本集实际登记的文档路径读取：MV/短片工程会把 02-故事大纲.md 映射成剧本、03-镜头表.md 映射成分镜。
  const documents = new Map();
  if (episode === undefined) return documents;
  if (Array.isArray(episode.documents)) {
    for (const document of episode.documents) {
      const absolute = resolve(root, document.path);
      if (!existsSync(absolute)) continue;
      try { documents.set(document.kind, await readFile(absolute, 'utf8')); } catch { /* 读不出的文档跳过 */ }
    }
    return documents;
  }
  const directory = episode.directory === '.' ? '' : episode.directory;
  const { DRAMA_FILES } = await import('./paths.js');
  for (const kind of DRAMA_FILES) {
    const rel = directory === '' ? kind : directory + '/' + kind;
    const absolute = resolve(root, rel);
    if (!existsSync(absolute)) continue;
    try { documents.set(kind, await readFile(absolute, 'utf8')); } catch { /* 读不出的文档跳过 */ }
  }
  return documents;
}


const VIDEO_UPLOAD_EXT = /\.(mp4|mov|mkv|webm|m4v|avi|flv|ts)$/i;

function safeUploadName(raw) {
  const base = String(raw ?? '').split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f:*?"<>|]/g, '_').trim().slice(0, 100);
  if (cleaned === '') return 'reference-' + Date.now().toString(36) + '.mp4';
  return VIDEO_UPLOAD_EXT.test(cleaned) ? cleaned : cleaned + '.mp4';
}

function freeName(directory, name) {
  if (!existsSync(join(directory, name))) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let index = 2; index < 1000; index += 1) {
    const candidate = stem + '-' + String(index) + ext;
    if (!existsSync(join(directory, candidate))) return candidate;
  }
  return 'reference-' + Date.now().toString(36) + ext;
}

/** 把上传流写进 参考视频/：限制体积，失败清掉半截文件。 */
async function saveReferenceUpload(cwd, request, rawName, maxBytes) {
  const directory = join(cwd, '参考视频');
  await mkdir(directory, { recursive: true });
  const target = join(directory, freeName(directory, safeUploadName(rawName)));
  const output = createWriteStream(target);
  let total = 0;
  try {
    for await (const chunk of request) {
      total += chunk.length;
      if (total > maxBytes) throw new HttpError(413, '视频超过上传上限');
      if (!output.write(chunk)) await new Promise((done) => output.once('drain', done));
    }
    await new Promise((done, fail) => output.end((error) => error ? fail(error) : done()));
  } catch (error) {
    output.destroy();
    await unlink(target).catch(() => {});
    throw error;
  }
  if (total === 0) {
    await unlink(target).catch(() => {});
    throw new HttpError(400, '上传内容为空');
  }
  return target;
}

async function handle(ctx, request, response, options) {
  try {
    if (!isTrustedRequest(request, options.trustedHosts ?? [])) throw new HttpError(403, '请求来源不受信任');
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === '/kylin-toon/health') {
      send(response, 200, { ok: true, name: 'dsh-kylin-toon', version: options.version });
      return;
    }
    if (url.pathname.startsWith('/kylin-toon/game-preview/') && request.method === 'GET') {
      await sendGamePreview(ctx, response, url.pathname);
      return;
    }
    if (url.pathname === '/kylin-toon/client-status' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      clientStatuses.set(String(body.sessionId ?? 'unknown'), { at: new Date().toISOString(), ...body });
      send(response, 200, { ok: true });
      return;
    }
    if (url.pathname === '/kylin-toon/client-status' && request.method === 'GET') {
      send(response, 200, { statuses: [...clientStatuses.entries()].map(([sessionId, value]) => ({ sessionId, ...value })) });
      return;
    }
    const cwd = await resolveCwd(ctx, url);
    if (url.pathname === '/kylin-toon/workspace' && request.method === 'GET') {
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      send(response, 200, { ...scanned, welcomeGuide: options.welcomeGuide() });
      return;
    }
    if (url.pathname === '/kylin-toon/file' && request.method === 'GET') {
      send(response, 200, await textPayload(cwd, url.searchParams.get('path')));
      return;
    }
    if (url.pathname === '/kylin-toon/file' && request.method === 'PUT') {
      const body = await bodyJson(request, options.maxFileBytes * 6 + 1024);
      send(response, 200, await saveText(cwd, url.searchParams.get('path'), body, options.maxFileBytes));
      return;
    }
    if (url.pathname === '/kylin-toon/media' && (request.method === 'GET' || request.method === 'HEAD')) {
      await sendMedia(request, response, cwd, url.searchParams.get('path'));
      return;
    }
    if (url.pathname === '/kylin-toon/drama' && request.method === 'GET') {
      const directory = url.searchParams.get('episode');
      if (typeof directory !== 'string' || directory === '') throw new HttpError(400, '缺少 episode');
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      // 剧集 ID 可以是任意目录名（如 原故事第一集_白衣入宫），不能用 第N集 正则限制。
      const episode = scanned.drama.episodes.find((item) => item.directory === directory || item.id === directory);
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      const documents = await readEpisodeDocuments(cwd, episode);
      const projection = projectEpisode(episode, [...documents].map(([kind, content]) => ({ kind, content })));
      send(response, 200, { ...projection, gates: evaluateGates(projection, documents, readReference(cwd)) });
      return;
    }
    if (url.pathname === '/kylin-toon/drama/composition' && (request.method === 'GET' || request.method === 'POST')) {
      const body = request.method === 'POST' ? await bodyJson(request, 64 * 1024) : undefined;
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const requested = url.searchParams.get('episode') ?? body?.episode;
      const episode = requested === undefined || requested === ''
        ? scanned.drama.episodes[0]
        : scanned.drama.episodes.find((item) => item.directory === requested || item.id === requested);
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      if (request.method === 'GET') {
        const documents = await readEpisodeDocuments(cwd, episode);
        const projection = projectEpisode(episode, [...documents].map(([kind, content]) => ({ kind, content })));
        send(response, 200, await compositionStatus(cwd, episode, { projection }));
        return;
      }
      try {
        if (body.action === 'scaffold') {
          const documents = await readEpisodeDocuments(cwd, episode);
          const projection = projectEpisode(episode, [...documents].map(([kind, content]) => ({ kind, content })));
          const clips = parseEditList(documents.get('剪辑单.md') ?? '').filter((row) => row.source !== '');
          send(response, 200, scaffoldComposition(cwd, episode, projection, { width: body.width, height: body.height, fps: body.fps, media: episode.media ?? [], clips }));
        } else if (body.action === 'studio') {
          send(response, 200, await startStudio(cwd, episode));
        } else if (body.action === 'stop') {
          send(response, 200, await stopStudio(cwd, episode));
        } else if (body.action === 'repair') {
          send(response, 200, repairComposition(cwd, episode));
        } else if (body.action === 'render') {
          send(response, 200, await renderComposition(cwd, episode, { output: body.output }));
        } else {
          throw new HttpError(400, 'action 必须是 scaffold/studio/stop/repair/render');
        }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/drama/recreate' && (request.method === 'GET' || request.method === 'POST')) {
      const body = request.method === 'POST' ? await bodyJson(request, 64 * 1024) : undefined;
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const requested = url.searchParams.get('episode') ?? body?.episode;
      const episode = requested === undefined || requested === ''
        ? scanned.drama.episodes[0]
        : scanned.drama.episodes.find((item) => item.directory === requested || item.id === requested);
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      if (request.method === 'GET') {
        const plan = readRecreatePlan(cwd, episode);
        send(response, 200, plan === undefined ? { present: false } : { present: true, ...plan });
        return;
      }
      const documents = await readEpisodeDocuments(cwd, episode);
      const projection = projectEpisode(episode, [...documents].map(([kind, content]) => ({ kind, content })));
      try {
        send(response, 200, writeRecreatePlan(cwd, episode, projection, readReference(cwd)));
      } catch (error) {
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/drama/templates' && (request.method === 'GET' || request.method === 'POST')) {
      if (request.method === 'GET') {
        const id = url.searchParams.get('id');
        if (id === null || id === '') {
          send(response, 200, listTemplates(cwd));
          return;
        }
        try {
          send(response, 200, getTemplate(cwd, id));
        } catch (error) {
          throw new HttpError(404, error instanceof Error ? error.message : String(error));
        }
        return;
      }
      const body = await bodyJson(request, 64 * 1024);
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const episode = scanned.drama.episodes.find((item) => item.directory === body.episode || item.id === body.episode) ?? scanned.drama.episodes[0];
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      try {
        if (body.action === 'create') send(response, 200, createTemplate(cwd, episode, { name: body.name, description: body.description }));
        else if (body.action === 'apply') send(response, 200, applyTemplate(cwd, episode, body.id));
        else throw new HttpError(400, 'action 必须是 create 或 apply');
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/drama/recipes' && (request.method === 'GET' || request.method === 'POST')) {
      if (request.method === 'GET') {
        const id = url.searchParams.get('id');
        if (id === null || id === '') {
          send(response, 200, { recipes: describeRecipes(), items: listRecipes() });
          return;
        }
        const recipe = getRecipe(id);
        if (recipe === undefined) throw new HttpError(404, '配方不存在：' + id);
        send(response, 200, recipe);
        return;
      }
      const body = await bodyJson(request, 64 * 1024);
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const episode = scanned.drama.episodes.find((item) => item.directory === body.episode || item.id === body.episode) ?? scanned.drama.episodes[0];
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      try {
        send(response, 200, applyRecipe(cwd, episode, body.id));
      } catch (error) {
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/drama/versions' && (request.method === 'GET' || request.method === 'POST')) {
      const body = request.method === 'POST' ? await bodyJson(request, 64 * 1024) : undefined;
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const requested = url.searchParams.get('episode') ?? body?.episode;
      const episode = requested === undefined || requested === ''
        ? scanned.drama.episodes[0]
        : scanned.drama.episodes.find((item) => item.directory === requested || item.id === requested);
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      if (request.method === 'GET') {
        send(response, 200, listDramaVersions(cwd, episode));
        return;
      }
      if (body.action === 'create') {
        const result = createDramaVersion(cwd, episode, { summary: body.summary });
        send(response, 200, { ...result, ...listDramaVersions(cwd, episode) });
        return;
      }
      if (body.action === 'restore') {
        try {
          const result = restoreDramaVersion(cwd, episode, body.id);
          send(response, 200, { ...result, ...listDramaVersions(cwd, episode) });
        } catch (error) {
          throw new HttpError(400, error instanceof Error ? error.message : String(error));
        }
        return;
      }
      throw new HttpError(400, 'action 必须是 create 或 restore');
    }
    if (url.pathname === '/kylin-toon/drama/motion' && (request.method === 'GET' || request.method === 'POST')) {
      const body = request.method === 'POST' ? await bodyJson(request, 256 * 1024) : undefined;
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const requested = url.searchParams.get('episode') ?? body?.episode;
      const episode = requested === undefined || requested === ''
        ? scanned.drama.episodes[0]
        : scanned.drama.episodes.find((item) => item.directory === requested || item.id === requested);
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      const documents = await readEpisodeDocuments(cwd, episode);
      const projection = projectEpisode(episode, [...documents].map(([kind, content]) => ({ kind, content })));
      const directory = episode.directory === '.' ? '' : episode.directory;
      const file = join(cwd, directory, 'MOTION.md');
      if (request.method === 'GET') {
        send(response, 200, {
          episode: episode.id,
          directory: episode.directory,
          path: (directory === '' ? '' : directory + '/') + 'MOTION.md',
          present: projection.motion.present,
          ok: projection.motion.ok,
          timeline: projection.motion.timeline,
          keep: projection.motion.keep,
          replace: projection.motion.replace,
          evidence: projection.motion.evidence,
          diagnostics: projection.motion.diagnostics,
          text: existsSync(file) ? await readFile(file, 'utf8') : ''
        });
        return;
      }
      const referencePath = readReference(cwd)?.source?.path;
      if (body.action === 'apply') {
        if (existsSync(file)) {
          const text = await readFile(file, 'utf8');
          send(response, 200, { created: false, path: (directory === '' ? '' : directory + '/') + 'MOTION.md', text, ...validateMotion(text, { shots: projection.shots }) });
          return;
        }
        const text = motionTemplate({ title: episode.id, episode: episode.id, shots: projection.shots, ...(referencePath === undefined ? {} : { referencePath }) });
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, text, 'utf8');
        send(response, 200, { created: true, path: (directory === '' ? '' : directory + '/') + 'MOTION.md', text, ...validateMotion(text, { shots: projection.shots }) });
        return;
      }
      const text = existsSync(file) ? await readFile(file, 'utf8') : '';
      send(response, 200, { created: false, text, ...validateMotion(text, { shots: projection.shots, reference: /参考|复刻|拍同款/.test(text) }) });
      return;
    }
    if (url.pathname === '/kylin-toon/gates' && request.method === 'GET') {
      const directory = url.searchParams.get('episode') ?? '';
      const scanned = await scanWorkspace(cwd, { maxFiles: options.maxWorkspaceFiles, maxFileBytes: options.maxFileBytes });
      const episode = scanned.drama.episodes.find((item) => item.directory === directory);
      if (episode === undefined) throw new HttpError(404, '本集不存在');
      const documents = await readEpisodeDocuments(cwd, episode);
      const projection = projectEpisode(episode, [...documents].map(([kind, content]) => ({ kind, content })));
      send(response, 200, evaluateGates(projection, documents, readReference(cwd)));
      return;
    }
    if (url.pathname === '/kylin-toon/game' && request.method === 'GET') {
      const project = url.searchParams.get('project') ?? undefined;
      const list = listGameProjects(cwd);
      send(response, 200, { ...list, projection: gameProjection(cwd, project) ?? null });
      return;
    }
    if (url.pathname === '/kylin-toon/game' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (body.action === 'init') {
        let result;
        try { result = initGameProject(cwd, body); } catch (error) { throw new HttpError(400, error instanceof Error ? error.message : String(error)); }
        send(response, 200, { ...result, ...listGameProjects(cwd), projection: result.projection });
        return;
      }
      if (body.action === 'switch') {
        let result;
        try { result = setActiveGame(cwd, body.project); } catch (error) { throw new HttpError(400, error instanceof Error ? error.message : String(error)); }
        send(response, 200, { ...result, ...listGameProjects(cwd), projection: gameProjection(cwd, result.project) });
        return;
      }
      throw new HttpError(400, 'action 必须是 init 或 switch');
    }
    if (url.pathname === '/kylin-toon/game/brief' && request.method === 'GET') {
      send(response, 200, readBriefForm(cwd, url.searchParams.get('project') ?? undefined));
      return;
    }
    if (url.pathname === '/kylin-toon/game/brief' && request.method === 'POST') {
      const body = await bodyJson(request, 256 * 1024);
      try {
        send(response, 200, saveBriefFields(cwd, body.project, body.fields ?? {}));
      } catch (error) {
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/game/stage' && request.method === 'GET') {
      const project = url.searchParams.get('project') ?? undefined;
      if (url.searchParams.get('action') === 'options') {
        try {
          send(response, 200, listConceptOptions(cwd, project));
        } catch (error) {
          throw new HttpError(400, error instanceof Error ? error.message : String(error));
        }
        return;
      }
      const stage = url.searchParams.get('stage') ?? '';
      if (stage === '') throw new HttpError(400, '缺少 stage');
      try {
        send(response, 200, stageTemplate(cwd, { stage, project }));
      } catch (error) {
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/game/stage' && request.method === 'POST') {
      const body = await bodyJson(request, 256 * 1024);
      try {
        if (body.action === 'apply') send(response, 200, applyStageTemplate(cwd, { stage: body.stage, project: body.project }));
        else if (body.action === 'options') send(response, 200, listConceptOptions(cwd, body.project));
        else if (body.action === 'choose') send(response, 200, chooseConcept(cwd, { project: body.project, option: body.option }));
        else if (body.action === 'template') send(response, 200, stageTemplate(cwd, { stage: body.stage, project: body.project }));
        else throw new HttpError(400, 'action 必须是 template/apply/options/choose');
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/game/snapshots' && request.method === 'GET') {
      send(response, 200, listSnapshots(cwd, url.searchParams.get('project') ?? undefined));
      return;
    }
    if (url.pathname === '/kylin-toon/game/snapshots' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      try {
        if (body.action === 'create') send(response, 200, createSnapshot(cwd, { project: body.project, label: body.label }));
        else if (body.action === 'restore') send(response, 200, restoreSnapshot(cwd, { project: body.project, id: body.id }));
        else if (body.action === 'delete') send(response, 200, deleteSnapshot(cwd, { project: body.project, id: body.id }));
        else throw new HttpError(400, 'action 必须是 create/restore/delete');
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/game/qa' && request.method === 'GET') {
      send(response, 200, readQaBrief(cwd, url.searchParams.get('project') ?? undefined));
      return;
    }
    if (url.pathname === '/kylin-toon/game/qa' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      try {
        if (body.action === 'brief') send(response, 200, writeQaBrief(cwd, { project: body.project, authorSessionId: body.authorSessionId, note: body.note }));
        else if (body.action === 'record') send(response, 200, recordQaSession(cwd, { project: body.project, sessionId: body.sessionId, note: body.note }));
        else if (body.action === 'status') send(response, 200, qaIsolationOf(cwd, body.project));
        else throw new HttpError(400, 'action 必须是 brief/record/status');
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(400, error instanceof Error ? error.message : String(error));
      }
      return;
    }
    if (url.pathname === '/kylin-toon/novel/world' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (body.action === 'remove') {
        send(response, 200, removeWorldEntry(cwd, body));
        return;
      }
      send(response, 200, upsertWorldEntry(cwd, { ...body, index: body.action === 'update' ? body.index : undefined }));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/character' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (body.action === 'remove') {
        send(response, 200, removeCharacter(cwd, body));
        return;
      }
      send(response, 200, upsertCharacter(cwd, body));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/task' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      send(response, 200, buildChapterTask(cwd, body.number, body));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/finalize' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      send(response, 200, finalizeChapter(cwd, body.number, body));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/review' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      send(response, 200, reviewChapter(cwd, body.number, body));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/publish' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      send(response, 200, buildPublish(cwd, body ?? {}));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/adapt' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      send(response, 200, buildAdaptation(cwd, body ?? {}));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/chapters' && request.method === 'GET') {
      send(response, 200, { chapters: scanChapters(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/novel/chapter' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (body.action === 'create') {
        const result = createChapter(cwd, body);
        send(response, 200, { ...result, chapters: scanChapters(cwd) });
        return;
      }
      if (body.action === 'context') {
        send(response, 200, chapterContext(cwd, body.number));
        return;
      }
      throw new HttpError(400, 'action 必须是 create 或 context');
    }
    if (url.pathname === '/kylin-toon/novel' && request.method === 'GET') {
      const projection = novelProjection(cwd);
      send(response, 200, { ...projection, projects: listNovelProjects(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/novel/projects' && request.method === 'GET') {
      send(response, 200, listNovelProjects(cwd));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/project' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      const result = setActiveNovel(cwd, body.project);
      send(response, 200, { ...result, projects: listNovelProjects(cwd), projection: novelProjection(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/novel/import' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      send(response, 200, importNovel(cwd, body ?? {}));
      return;
    }
    if (url.pathname === '/kylin-toon/novel/init' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      const result = initNovel(cwd, body ?? {});
      send(response, 200, { ...result.projection, created: result.created, skipped: result.skipped });
      return;
    }
    if (url.pathname === '/kylin-toon/reference' && request.method === 'GET') {
      const state = readReference(cwd);
      send(response, 200, { state: state ?? null, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/upload' && request.method === 'POST') {
      const target = await saveReferenceUpload(cwd, request, url.searchParams.get('name'), options.maxUploadBytes ?? 4 * 1024 * 1024 * 1024);
      const state = await intakeReference(cwd, { path: relative(cwd, target), note: '上传' });
      send(response, 200, { state, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/intake' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (typeof body.path !== 'string' || body.path === '') throw new HttpError(400, '缺少 path');
      const state = await intakeReference(cwd, { path: body.path, note: typeof body.note === 'string' ? body.note : undefined });
      send(response, 200, { state, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/export' && request.method === 'POST') {
      const exported = exportReference(cwd);
      send(response, 200, { ok: true, path: exported.path });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/reset' && request.method === 'POST') {
      const result = resetReference(cwd);
      send(response, 200, { ...result, state: readReference(cwd) ?? null, readiness: referenceReadiness(readReference(cwd)), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/analyze' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      const state = await analyzeReference(cwd, body ?? {});
      send(response, 200, { state, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/choose' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (typeof body.planId !== 'string' || body.planId === '') throw new HttpError(400, '缺少 planId');
      const state = choosePlan(cwd, body.planId);
      send(response, 200, { state, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/rights' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      const state = confirmRights(cwd, body.basis);
      send(response, 200, { state, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/reference/fetch' && request.method === 'POST') {
      const body = await bodyJson(request, 64 * 1024);
      if (typeof body.url !== 'string' || body.url === '') throw new HttpError(400, '缺少 url');
      if (!/^https?:\/\//i.test(body.url)) throw new HttpError(400, '只支持 http/https 链接');
      const state = await fetchReferenceUrl(cwd, body.url, { cookiesFromBrowser: body.cookiesFromBrowser });
      send(response, 200, { state, readiness: referenceReadiness(state), videos: discoverReferenceVideos(cwd) });
      return;
    }
    if (url.pathname === '/kylin-toon/intents' && request.method === 'GET') {
      const since = Number(url.searchParams.get('since') ?? 0);
      const sessionId = url.searchParams.get('sessionId') ?? '';
      send(response, 200, { intents: listIntents(sessionId, Number.isFinite(since) ? since : 0) });
      return;
    }
    send(response, 404, { error: 'KToon 路由不存在' });
  } catch (error) {
    if (error instanceof ConflictError) {
      response.writeHead(412, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      response.end(error.payload);
      return;
    }
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) options.logger?.error?.('kylin-toon route failed', error);
    send(response, status, { error: error instanceof Error ? error.message : String(error) });
  }
}

export function registerRoutes(ctx, options) {
  const disposers = [
    ctx.webServer.register({ kind: 'prefix', path: '/kylin-toon', handler: (request, response) => handle(ctx, request, response, options) })
  ];
  return function () {
    for (const dispose of disposers.reverse()) {
      try { dispose(); } catch { /* 卸载期异常忽略 */ }
    }
  };
}