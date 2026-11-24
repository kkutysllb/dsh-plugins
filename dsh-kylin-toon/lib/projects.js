/**
 * 工作区扫描与四类创作工程识别。
 *
 * 作品全在本地文件里：这里只读目录、不建数据库、不预建空文件。
 */
import { readdir, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import {
  DRAMA_DIRECTORY,
  DRAMA_FILES,
  GAME_DIRECTORY,
  NOVEL_DIRECTORIES,
  NOVEL_ROOT_FILES,
  STATE_DIRECTORY,
  VIDEO_DIRECTORY,
  isMediaPath,
  isSkippedName,
  mediaMimeType,
  pathExtension
} from './paths.js';

const DEPTH_LIMIT = 8;

function toPosix(value) {
  return value.split(sep).join('/');
}

function versionOf(info) {
  return Math.floor(info.mtimeMs).toString(36) + '-' + info.size.toString(36);
}

function contains(root, target) {
  const rel = relative(root, target);
  return rel !== '' && !rel.startsWith('..') && !rel.includes(':' + sep);
}

async function walk(root, current, out, options, depth) {
  if (depth > DEPTH_LIMIT || out.length >= options.maxFiles) return;
  let entries;
  try { entries = await readdir(current, { withFileTypes: true }); } catch { return; }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  // 先收当前目录的文件，再下钻：根目录的 正文.md / 设定.md 不会被大仓库的文件上限挤掉。
  const files = entries.filter((entry) => entry.isFile());
  const directories = entries.filter((entry) => entry.isDirectory());
  const prioritized = ['剧集', '成片', '设定图', '配音', '剧照', 'shots', 'assets'];
  const sortedDirs = [...directories].sort((a, b) => {
    const ai = prioritized.indexOf(a.name); const bi = prioritized.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });
  const ordered = depth === 0 ? [...files, ...sortedDirs] : entries;
  for (const entry of ordered) {
    if (out.length >= options.maxFiles) return;
    if (isSkippedName(entry.name)) continue;
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === STATE_DIRECTORY) continue;
      await walk(root, absolute, out, options, depth + 1);
      continue;
    }
    if (!entry.isFile()) continue;
    let info;
    try { info = await stat(absolute); } catch { continue; }
    const media = isMediaPath(entry.name);
    // 媒体只受 maxMediaBytes 限制；成片 MP4 往往远大于文本上限，不能被 maxFileBytes 一起丢掉。
    if (media ? info.size > options.maxMediaBytes : info.size > options.maxFileBytes) continue;
    const path = toPosix(relative(root, absolute));
    if (!media && pathExtension(path) === '') continue;
    out.push({
      path,
      bytes: info.size,
      version: versionOf(info),
      kind: media ? 'media' : 'text',
      ...(media ? { mimeType: mediaMimeType(path) } : {})
    });
  }
}

async function readTitle(root, candidates) {
  for (const candidate of candidates) {
    const file = join(root, candidate);
    if (!existsSync(file)) continue;
    try {
      const raw = await readFile(file, 'utf8');
      const match = /^#\s+(.+)$/m.exec(raw);
      if (match !== null) return match[1].trim().slice(0, 80);
    } catch { /* 读不出标题就用目录名 */ }
  }
  const name = root.split(sep).pop() ?? root;
  return name;
}

async function discoverGames(root, files) {
  const base = join(root, GAME_DIRECTORY);
  if (!existsSync(base)) return [];
  let entries;
  try { entries = await readdir(base, { withFileTypes: true }); } catch { return []; }
  const games = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || isSkippedName(entry.name)) continue;
    const dir = join(base, entry.name);
    const index = join(dir, 'build', 'app', 'index.html');
    const previewReady = existsSync(index);
    let previewVersion = '';
    if (previewReady) {
      try { previewVersion = versionOf(await stat(index)); } catch { /* 预览版本缺失 */ }
    }
    const docs = files.filter((file) => file.path.startsWith(GAME_DIRECTORY + '/' + entry.name + '/') && file.kind === 'text');
    games.push({
      id: entry.name,
      root: GAME_DIRECTORY + '/' + entry.name,
      title: await readTitle(dir, ['简报.md', 'PRODUCT_BRIEF.md', 'README.md', '设计.md']),
      previewReady,
      ...(previewVersion === '' ? {} : { previewVersion }),
      documents: docs.map((file) => file.path),
      docVersions: Object.fromEntries(docs.map((file) => [file.path, file.version]))
    });
  }
  return games;
}

async function discoverVideos(root, files) {
  const base = join(root, VIDEO_DIRECTORY);
  if (!existsSync(base)) return [];
  let entries;
  try { entries = await readdir(base, { withFileTypes: true }); } catch { return []; }
  const videos = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || isSkippedName(entry.name)) continue;
    const dir = join(base, entry.name);
    const prefix = VIDEO_DIRECTORY + '/' + entry.name + '/';
    const projectFiles = files.filter((file) => file.path.startsWith(prefix));
    const outputs = projectFiles.filter((file) => file.kind === 'media' && /(^|\/)outputs\//.test(file.path) && /\.(mp4|webm|mov)$/i.test(file.path));
    const edited = projectFiles.find((file) => file.path.endsWith('/edited_source.mp4'));
    const narration = projectFiles.find((file) => file.path.endsWith('/narration.json'));
    const sources = projectFiles.filter((file) => file.path.includes('/sources/') && file.kind === 'media');
    videos.push({
      id: entry.name,
      root: VIDEO_DIRECTORY + '/' + entry.name,
      title: await readTitle(dir, ['解说稿.md', 'narration.md', 'README.md']),
      outputs,
      ...(edited === undefined ? {} : { editedSource: edited.path }),
      narrationPath: narration === undefined ? undefined : narration.path,
      sourceCount: sources.length,
      documents: projectFiles.filter((file) => file.kind === 'text').map((file) => file.path)
    });
  }
  return videos;
}

async function discoverDrama(root, files) {
  const base = join(root, DRAMA_DIRECTORY);
  const episodes = [];
  if (existsSync(base)) {
    let entries = [];
    try { entries = await readdir(base, { withFileTypes: true }); } catch { entries = []; }
    for (const entry of entries) {
      if (!entry.isDirectory() || isSkippedName(entry.name)) continue;
      const directory = DRAMA_DIRECTORY + '/' + entry.name;
      const documents = files
        .filter((file) => file.path.startsWith(directory + '/') && file.kind === 'text' && file.path.split('/').length === 3 && DRAMA_FILES.includes(file.path.split('/')[2]))
        .map((file) => ({ path: file.path, kind: file.path.split('/')[2] }))
        .sort((a, b) => DRAMA_FILES.indexOf(a.kind) - DRAMA_FILES.indexOf(b.kind));
      const media = files.filter((file) => file.path.startsWith(directory + '/') && file.kind === 'media');
      const outputs = files.filter((file) => file.path.startsWith(directory + '/制作成果/') && file.kind === 'media');
      episodes.push({
        id: entry.name,
        directory,
        documents,
        media: media.map((file) => file.path),
        outputs: outputs.map((file) => file.path)
      });
    }
  }
  // 兼容已经在用的 MV/短片工程：根目录有镜头表（03-镜头表.md / 镜头表.md 等）或 shots/ 工作目录。
  if (episodes.length === 0) {
    const storyboard = files.find((file) => file.kind === 'text' && /(^|\/)(\d+-)?(镜头表|分镜表|分镜|storyboard)\.md$/.test(file.path) && !file.path.includes('/'));
    // 只有镜头表或 shots 工作目录才算 MV 工程；单有 成片/ 目录不算，避免把普通目录误判成作品。
    const hasShotWork = files.some((file) => /^shots\/(keyframes|clips)\//.test(file.path));
    if (storyboard !== undefined || hasShotWork) {
      const map = new Map();
      const script = files.find((file) => file.kind === 'text' && /(^|\/)02-|故事大纲|剧本\.md$/.test(file.path) && !file.path.includes('/'));
      if (script !== undefined) map.set(script.path, '剧本.md');
      if (storyboard !== undefined) map.set(storyboard.path, '分镜.md');
      const visual = files.find((file) => file.kind === 'text' && /(^|\/)01-|视觉|设定/.test(file.path) && !file.path.includes('/'));
      if (visual !== undefined) map.set(visual.path, '视觉设定.md');
      const media = files.filter((file) => file.kind === 'media' && (/^shots\//.test(file.path) || /^成片\//.test(file.path) || /^delivery\//.test(file.path) || /^assets\//.test(file.path)));
      const outputs = media.filter((file) => (/^成片\//.test(file.path) || /^delivery\//.test(file.path)) && /\.(mp4|webm|mov)$/i.test(file.path));
      episodes.push({
        id: 'MV',
        directory: '.',
        documents: [...map.entries()].map(([path, kind]) => ({ path, kind })),
        media: media.map((file) => file.path),
        outputs: outputs.map((file) => file.path),
        adapter: 'mv'
      });
    }
  }
  // 已在用的连续剧工程：根目录 第N集.md 剧本 + 第N集分镜脚本.md + 成片/配音/设定图。
  if (episodes.length === 0) {
    const episodeScripts = files.filter((file) => file.kind === 'text' && !file.path.includes('/') && /^第\s*[0-9一二三四五六七八九十百]+\s*集/.test(file.path));
    const storyboards = files.filter((file) => file.kind === 'text' && !file.path.includes('/') && /分镜(脚本)?\.md$/.test(file.path));
    if (episodeScripts.length > 0 || storyboards.length > 0) {
      const toNumber = (key) => {
        if (/^\d+$/.test(key)) return Number(key);
        const digit = (char) => ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 })[char] ?? 0;
        // 十二 = 12，二十 = 20，二十二 = 22；不能简单相加。
        const tens = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(key);
        if (tens !== null) return (tens[1] === undefined ? 1 : digit(tens[1])) * 10 + (tens[2] === undefined ? 0 : digit(tens[2]));
        if (key.length === 1) return digit(key);
        return Number.NaN;
      };
      const keyOf = (name) => {
        const match = /第\s*([0-9一二三四五六七八九十百]+)\s*集/.exec(name);
        return match === null ? undefined : toNumber(match[1]);
      };
      const visual = files.find((file) => !file.path.includes('/') && /设定图方案|视觉设定|风格报告/.test(file.path));
      const groups = new Map();
      for (const script of episodeScripts) {
        const key = keyOf(script.path);
        if (key === undefined) continue;
        groups.set(String(key), { script });
      }
      for (const storyboard of storyboards) {
        const key = keyOf(storyboard.path);
        if (key === undefined) continue;
        const group = groups.get(String(key)) ?? {};
        group.storyboard = storyboard;
        groups.set(String(key), group);
      }
      for (const [key, group] of [...groups.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
        const documents = [];
        if (group.script !== undefined) documents.push({ path: group.script.path, kind: '剧本.md' });
        if (group.storyboard !== undefined) documents.push({ path: group.storyboard.path, kind: '分镜.md' });
        if (visual !== undefined) documents.push({ path: visual.path, kind: '视觉设定.md' });
        const number = Number(key);
        const media = files.filter((file) => {
          if (file.kind !== 'media') return false;
          if (/^media\//.test(file.path) || /^剧照\//.test(file.path) || /^设定图\//.test(file.path)) return true;
          if (/^成片\/ep0?[0-9]*(_|\/)/.test(file.path)) return file.path.includes('ep0' + String(number).padStart(2, '0')) || number === 1;
          if (/^配音\/ep0?[0-9]*/.test(file.path)) return file.path.includes('ep0' + String(number).padStart(2, '0')) || number === 1;
          return false;
        });
        const outputs = media.filter((file) => /^成片\//.test(file.path) && /\.(mp4|mov|webm)$/i.test(file.path) && (/\/out\//.test(file.path) || /成片|样片|final/.test(file.path)));
        episodes.push({
          id: number === 1 ? '第1集' : '第' + String(number) + '集',
          directory: '.',
          documents,
          media: media.map((file) => file.path),
          outputs: outputs.map((file) => file.path),
          adapter: 'episode'
        });
      }
    }
  }
  const rootDocuments = files
    .filter((file) => DRAMA_FILES.includes(file.path) && file.kind === 'text')
    .map((file) => ({ path: file.path, kind: file.path }));
  if (rootDocuments.length > 0 && episodes.length === 0) {
    episodes.unshift({ id: '本集', directory: '.', documents: rootDocuments, media: [], outputs: [] });
  }
  return episodes;
}

/** 读整个工作区并识别四类工程；文件按上限截断，不做静默补全。 */
export async function scanWorkspace(cwd, options = {}) {
  const resolved = resolve(cwd);
  const settings = {
    maxFiles: options.maxFiles ?? 1500,
    maxFileBytes: options.maxFileBytes ?? 2 * 1024 * 1024,
    maxMediaBytes: options.maxMediaBytes ?? 256 * 1024 * 1024
  };
  const files = [];
  await walk(resolved, resolved, files, settings, 0);
  const [games, videos, dramaEpisodes] = await Promise.all([
    discoverGames(resolved, files),
    discoverVideos(resolved, files),
    discoverDrama(resolved, files)
  ]);
  const novel = files.some((file) => {
    const head = file.path.split('/')[0];
    return NOVEL_ROOT_FILES.includes(file.path) || NOVEL_DIRECTORIES.includes(head);
  });
  const creative = novel || dramaEpisodes.length > 0 || games.length > 0 || videos.length > 0;
  return {
    cwd: resolved,
    files,
    games,
    videos,
    drama: { episodes: dramaEpisodes },
    creative,
    kinds: {
      story: novel,
      drama: dramaEpisodes.length > 0 || files.some((file) => file.path === 'short-drama.json'),
      game: games.length > 0,
      video: videos.length > 0
    },
    stateDir: STATE_DIRECTORY
  };
}

/** 把客户端给的相对路径解析成工作区内绝对路径，并挡住路径穿越。 */
export function resolveWithin(root, relPath) {
  const resolvedRoot = resolve(root);
  const absolute = resolve(resolvedRoot, relPath);
  if (!contains(resolvedRoot, absolute) && absolute !== resolvedRoot) return undefined;
  return absolute;
}