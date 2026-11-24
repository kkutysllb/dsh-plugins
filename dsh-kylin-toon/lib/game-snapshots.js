/**
 * 互动游戏构建快照：把 build/app 复制到 .kylin-toon，支持列表与回滚。
 *
 * 边界：只动构建产物与本地状态目录，不碰设计文档；回滚前先把当前构建备份一份，
 * 失败时可以从备份恢复。快照默认保留最近 10 个。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_DIRECTORY, GAME_FILES, gameProjectRoot, gameProjection } from './game.js';

const STATE_DIRECTORY = '.kylin-toon';
const SNAPSHOT_DIRECTORY = 'game-snapshots';
const BACKUP_DIRECTORY = 'game-build-backup';
const MAX_SNAPSHOTS = 10;

function snapshotBase(cwd, id) {
  return join(cwd, STATE_DIRECTORY, SNAPSHOT_DIRECTORY, id);
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._-]+$/.test(value) && !value.includes('..');
}

function nextId(base) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  let id = stamp;
  for (let index = 2; existsSync(join(base, id)); index += 1) id = stamp + '-' + String(index);
  return id;
}

function countFiles(directory) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = countFiles(absolute);
      files += nested.files;
      bytes += nested.bytes;
    } else if (entry.isFile()) {
      files += 1;
      try { bytes += statSync(absolute).size; } catch { /* 统计失败不影响快照 */ }
    }
  }
  return { files, bytes };
}

function readMeta(directory) {
  const file = join(directory, 'meta.json');
  if (!existsSync(file)) return undefined;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return undefined; }
}

export function listSnapshots(cwd, project) {
  const { id } = gameProjectRoot(cwd, project);
  const base = snapshotBase(cwd, id);
  const snapshots = [];
  if (existsSync(base)) {
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory() || !validId(entry.name)) continue;
      const directory = join(base, entry.name);
      const meta = readMeta(directory);
      if (meta === undefined) continue;
      snapshots.push({ ...meta, path: STATE_DIRECTORY + '/' + SNAPSHOT_DIRECTORY + '/' + id + '/' + entry.name });
    }
  }
  snapshots.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { project: id, snapshots, previewReady: existsSync(join(cwd, GAME_DIRECTORY, id, GAME_FILES.preview)) };
}

function prune(base) {
  const entries = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && validId(entry.name))
    .map((entry) => ({ name: entry.name, meta: readMeta(join(base, entry.name)) }))
    .filter((entry) => entry.meta !== undefined)
    .sort((a, b) => String(b.meta.createdAt).localeCompare(String(a.meta.createdAt)));
  for (const entry of entries.slice(MAX_SNAPSHOTS)) {
    try { rmSync(join(base, entry.name), { recursive: true, force: true }); } catch { /* 清理失败不阻断 */ }
  }
}

export function createSnapshot(cwd, { project, label } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  const app = join(root, 'build', 'app');
  if (!existsSync(app)) throw new Error('还没有可快照的构建：先生成 build/app/index.html');
  const base = snapshotBase(cwd, id);
  mkdirSync(base, { recursive: true });
  const snapshotId = nextId(base);
  const directory = join(base, snapshotId);
  cpSync(app, join(directory, 'app'), { recursive: true });
  const counts = countFiles(app);
  const meta = {
    schemaVersion: 1,
    project: id,
    id: snapshotId,
    label: String(label ?? '').trim().slice(0, 80) || '构建快照',
    createdAt: new Date().toISOString(),
    files: counts.files,
    bytes: counts.bytes
  };
  writeFileSync(join(directory, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
  prune(base);
  return { snapshot: meta, path: STATE_DIRECTORY + '/' + SNAPSHOT_DIRECTORY + '/' + id + '/' + snapshotId, list: listSnapshots(cwd, id) };
}

export function restoreSnapshot(cwd, { project, id: snapshotId } = {}) {
  const { id, root } = gameProjectRoot(cwd, project);
  if (!validId(snapshotId)) throw new Error('快照 id 不合法');
  const source = join(snapshotBase(cwd, id), snapshotId, 'app');
  if (!existsSync(source)) throw new Error('快照不存在：' + snapshotId);
  const app = join(root, 'build', 'app');
  let backup;
  if (existsSync(app)) {
    backup = join(cwd, STATE_DIRECTORY, BACKUP_DIRECTORY, id, new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14));
    mkdirSync(join(backup, '..'), { recursive: true });
    cpSync(app, join(backup, 'app'), { recursive: true });
  }
  rmSync(app, { recursive: true, force: true });
  mkdirSync(app, { recursive: true });
  cpSync(source, app, { recursive: true });
  const meta = {
    schemaVersion: 1,
    project: id,
    restored: snapshotId,
    restoredAt: new Date().toISOString(),
    ...(backup === undefined ? {} : { backup: backup.slice(cwd.length + 1) })
  };
  writeFileSync(join(snapshotBase(cwd, id), snapshotId, 'restore.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
  return {
    project: id,
    restored: snapshotId,
    ...(backup === undefined ? {} : { backup: backup.slice(cwd.length + 1) }),
    projection: gameProjection(cwd, id),
    list: listSnapshots(cwd, id)
  };
}

export function deleteSnapshot(cwd, { project, id: snapshotId } = {}) {
  const { id } = gameProjectRoot(cwd, project);
  if (!validId(snapshotId)) throw new Error('快照 id 不合法');
  const directory = join(snapshotBase(cwd, id), snapshotId);
  if (!existsSync(directory)) throw new Error('快照不存在：' + snapshotId);
  rmSync(directory, { recursive: true, force: true });
  return { project: id, deleted: snapshotId, list: listSnapshots(cwd, id) };
}

export function describeSnapshots(list) {
  if (list.snapshots.length === 0) {
    return ['# 构建快照 · ' + list.project, '', '还没有快照。可玩构建生成后，在游戏页「试玩」或画布上点「存快照」。'].join('\n');
  }
  return [
    '# 构建快照 · ' + list.project,
    '',
    '共 ' + String(list.snapshots.length) + ' 个 · 当前构建：' + (list.previewReady ? '有' : '无'),
    '',
    ...list.snapshots.map((snapshot) => '- ' + snapshot.id + ' · ' + snapshot.label + ' · ' + snapshot.createdAt + ' · ' + String(snapshot.files) + ' 文件 / ' + String(Math.round(snapshot.bytes / 1024)) + 'KB')
  ].join('\n');
}
