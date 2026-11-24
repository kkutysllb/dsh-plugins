/**
 * 短剧漫剧源文件版本：把本集创作文档冻结成可恢复的快照。
 *
 * 语义对齐 OpenMotion 的「恢复旧版本 = 生成新的 vN，不删除后续历史」：
 * - 只读本集 DRAMA_FILES（含 MOTION.md），不复制媒体和制作成果；
 * - 恢复前先自动存一份「恢复前快照」，再写回目标版本，最后再建一个新版本；
 * - 任何文件缺失/哈希不符都拒绝恢复，不半写。
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAMA_FILES } from './paths.js';

const STATE_DIRECTORY = '.kylin-toon';
const VERSIONS_DIRECTORY = 'drama-versions';
const COMPOSITION_DIRECTORY = 'composition';
const COMPOSITION_SKIP = new Set(['assets', 'node_modules', '.git']);

function keyOf(episode) {
  const base = episode.directory === '.' ? 'root' : String(episode.directory).replace(/[\\/]/g, '__');
  return base.replace(/[^\p{L}\p{N}_.-]/gu, '_');
}

function projectDirOf(cwd, episode) {
  if (typeof episode.projectDir === 'string') return episode.projectDir;
  return episode.directory === '.' ? cwd : join(cwd, episode.directory);
}

function versionsRoot(cwd, episode) {
  return join(cwd, STATE_DIRECTORY, VERSIONS_DIRECTORY, keyOf(episode));
}

function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function readMeta(directory) {
  try { return JSON.parse(readFileSync(join(directory, 'meta.json'), 'utf8')); } catch { return undefined; }
}

function nextNumber(root) {
  if (!existsSync(root)) return 1;
  let max = 0;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const meta = readMeta(join(root, entry.name));
    if (meta !== undefined && Number.isFinite(meta.versionNumber)) max = Math.max(max, meta.versionNumber);
  }
  return max + 1;
}

function collectCompositionFiles(projectDir) {
  const root = join(projectDir, COMPOSITION_DIRECTORY);
  if (!existsSync(root)) return [];
  const files = [];
  const walk = (directory, prefix) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (COMPOSITION_SKIP.has(entry.name)) continue;
      const absolute = join(directory, entry.name);
      const relative = prefix === '' ? entry.name : prefix + '/' + entry.name;
      if (entry.isDirectory()) { walk(absolute, relative); continue; }
      if (!/\.(html|json|md|css|js|mjs)$/i.test(entry.name)) continue;
      files.push({ absolute, relative: COMPOSITION_DIRECTORY + '/' + relative });
    }
  };
  walk(root, '');
  return files;
}

export function createDramaVersion(cwd, episode, { summary } = {}) {
  const projectDir = projectDirOf(cwd, episode);
  if (!existsSync(projectDir)) throw new Error('本集目录不存在：' + episode.directory);
  const root = versionsRoot(cwd, episode);
  const versionNumber = nextNumber(root);
  const id = 'v' + String(versionNumber);
  const directory = join(root, id);
  mkdirSync(directory, { recursive: true });
  const files = [];
  for (const kind of DRAMA_FILES) {
    const source = join(projectDir, kind);
    if (!existsSync(source)) continue;
    const target = join(directory, kind);
    mkdirSync(join(target, '..'), { recursive: true });
    cpSync(source, target);
    files.push({ path: kind, sha256: sha256File(target), bytes: statSync(target).size });
  }
  for (const file of collectCompositionFiles(projectDir)) {
    const target = join(directory, file.relative);
    mkdirSync(join(target, '..'), { recursive: true });
    cpSync(file.absolute, target);
    files.push({ path: file.relative, sha256: sha256File(target), bytes: statSync(target).size });
  }
  if (files.length === 0) throw new Error('本集还没有可快照的创作文档');
  const meta = {
    schemaVersion: 1,
    episode: episode.id,
    directory: episode.directory,
    id,
    versionNumber,
    createdAt: new Date().toISOString(),
    ...(typeof summary === 'string' && summary.trim() !== '' ? { summary: summary.trim() } : {}),
    files
  };
  writeFileSync(join(directory, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
  return { version: meta, path: STATE_DIRECTORY + '/' + VERSIONS_DIRECTORY + '/' + keyOf(episode) + '/' + id };
}

export function listDramaVersions(cwd, episode) {
  const root = versionsRoot(cwd, episode);
  const versions = [];
  if (existsSync(root)) {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const meta = readMeta(join(root, entry.name));
      if (meta !== undefined) versions.push(meta);
    }
  }
  versions.sort((a, b) => b.versionNumber - a.versionNumber);
  return { episode: episode.id, directory: episode.directory, versions };
}

export function restoreDramaVersion(cwd, episode, versionId) {
  const root = versionsRoot(cwd, episode);
  const source = join(root, String(versionId ?? ''));
  const meta = readMeta(source);
  if (meta === undefined) throw new Error('版本不存在：' + String(versionId ?? ''));
  for (const file of meta.files) {
    const snapshot = join(source, file.path);
    if (!existsSync(snapshot)) throw new Error('版本文件缺失，拒绝恢复：' + file.path);
    if (sha256File(snapshot) !== file.sha256) throw new Error('版本文件哈希不符，拒绝恢复：' + file.path);
  }
  const projectDir = projectDirOf(cwd, episode);
  let before;
  try { before = createDramaVersion(cwd, episode, { summary: '恢复 ' + meta.id + ' 前自动快照' }); } catch { before = undefined; }
  for (const file of meta.files) {
    const target = join(projectDir, file.path);
    mkdirSync(join(target, '..'), { recursive: true });
    cpSync(join(source, file.path), target);
  }
  const after = createDramaVersion(cwd, episode, { summary: '恢复自 ' + meta.id });
  return {
    restored: meta.id,
    restoredFrom: meta.versionNumber,
    ...(before === undefined ? {} : { backupVersion: before.version.id }),
    version: after.version,
    files: meta.files.map((file) => file.path)
  };
}

export function describeDramaVersions(list) {
  if (list.versions.length === 0) return ['# 本集版本 · ' + list.episode, '', '还没有版本快照。先在工作台「版本」里存一版，或运行 toon_drama_version action=create。'].join('\n');
  return [
    '# 本集版本 · ' + list.episode,
    '',
    '共 ' + String(list.versions.length) + ' 个版本 · 恢复旧版本会生成新的 vN，不删除后续历史',
    '',
    ...list.versions.map((version) => '- v' + String(version.versionNumber) + ' · ' + version.createdAt + ' · ' + String(version.files.length) + ' 文件' + (version.summary === undefined ? '' : ' · ' + version.summary))
  ].join('\n');
}
