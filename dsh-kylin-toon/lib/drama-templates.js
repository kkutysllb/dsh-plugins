/**
 * 短剧模板包：把一个已验证的镜头结构固化成可复用的 kt-template.json + TEMPLATE.md。
 *
 * 对齐 OpenMotion 的 Motion Package 最小契约，但只保留短剧需要的东西：
 * - 结构层：分镜/MOTION；内容层：preset.json 的替换槽位；
 * - manifest 带每个文件的 sha256，读取时拒绝篡改；
 * - apply 只生成本集「模板改编计划」，不覆盖分镜，由 Agent/创作者确认后再合并。
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STATE_DIRECTORY = '.kylin-toon';
const TEMPLATE_DIRECTORY = 'drama-templates';
const STRUCTURE_FILES = ['分镜.md', '镜头表.md', '03-镜头表.md', '04-镜头表.md', 'storyboard.md', 'story-board.md'];
const COPY_FILES = [
  ['MOTION.md', 'motion'],
  ['视觉设定.md', 'design'],
  ['剧本.md', 'script'],
  ['剪辑单.md', 'edit'],
  ['图片提示词.md', 'image-prompts'],
  ['视频提示词.md', 'video-prompts']
];

function rootOf(cwd) {
  return join(cwd, STATE_DIRECTORY, TEMPLATE_DIRECTORY);
}

function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function slugOf(name) {
  return String(name ?? '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 48) || 'template';
}

function projectDirOf(cwd, episode) {
  return episode.projectDir ?? (episode.directory === '.' ? cwd : join(cwd, episode.directory));
}

function detectStructure(projectDir) {
  for (const candidate of STRUCTURE_FILES) {
    if (existsSync(join(projectDir, candidate))) return candidate;
  }
  const entries = readdirSync(projectDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .filter((name) => /(镜头表|分镜|story[-_ ]?board|shot[-_ ]?list)/i.test(name));
  return entries;
}

function readJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return undefined; }
}

function templateMarkdown(manifest) {
  return [
    '# TEMPLATE · ' + manifest.name,
    '',
    '## 1. 身份与来源',
    '',
    '- 模板 id：' + manifest.id,
    '- 版本：' + manifest.version,
    '- 来源：' + manifest.source.episode + '（' + manifest.source.directory + '）',
    '- 许可：' + manifest.license,
    '- 说明：' + manifest.description,
    '',
    '## 2. 保持',
    '',
    '- 结构文件：' + manifest.source.structure,
    '- 镜头顺序与镜头 ID 的对应关系',
    '- 转场与节奏关系；改时长时同步调整转场与声画锚点',
    '- 每个镜头作用（钩子/加压/反转/兑现）不要替换成无意义过场',
    '',
    '## 3. 替换槽位',
    '',
    ...manifest.slots.map((slot) => '- `' + slot.id + '` · ' + slot.kind + (slot.required ? ' · 必填' : '') + (slot.maxChars === undefined ? '' : ' · 最多 ' + String(slot.maxChars) + ' 字') + ' — ' + slot.note),
    '',
    '## 4. 时间',
    '',
    '- 全部秒数带单位；如使用帧计时，必须声明帧率。',
    '- 剪辑单保留源片→输出的逐段映射；改字幕/配音时随剪切重建锚点。',
    '',
    '## 5. 素材与声音',
    '',
    '- 必须提供：人物/场景/品牌素材、旁白与音乐；缺失时先问，不静默替换。',
    '- 可以生成：空镜、氛围、补拍；生成前先说清数量与花费。',
    '',
    '## 6. 检查与证据',
    '',
    '- 镜头 ID/时长/转场与 MOTION 对账；',
    '- 替换槽位全部有值；',
    '- 至少三个同刻对比点与真实渲染版本；技术验证、视觉审阅、用户采用分开记录。',
    '',
    '## 7. 使用方式',
    '',
    '1. `toon_template action=apply` 生成本集「模板改编计划」；',
    '2. 按槽位填内容，不覆盖原模板；',
    '3. 改完后跑 `toon_shot_qc`、`toon_motion action=validate`，再交给制作流水线。',
    ''
  ].join('\n');
}

function presetOf(manifest) {
  return {
    schemaVersion: 1,
    templateId: manifest.id,
    title: '<待填：标题>',
    characters: manifest.slots.filter((slot) => slot.kind === 'character').map((slot) => ({ slot: slot.id, value: '<待填：人物>' })),
    scenes: manifest.slots.filter((slot) => slot.kind === 'scene').map((slot) => ({ slot: slot.id, value: '<待填：场景>' })),
    lines: manifest.slots.filter((slot) => slot.kind === 'line').map((slot) => ({ slot: slot.id, value: '<待填：台词>', maxChars: slot.maxChars ?? null })),
    notDoing: ['不替换镜头顺序', '不改已接受的转场与停顿']
  };
}

export function createTemplate(cwd, episode, { name, description } = {}) {
  const projectDir = projectDirOf(cwd, episode);
  const title = String(name ?? '').trim() || episode.id;
  const base = slugOf(title);
  const root = rootOf(cwd);
  mkdirSync(root, { recursive: true });
  let id = base;
  for (let index = 2; existsSync(join(root, id)); index += 1) id = base + '-' + String(index);
  const directory = join(root, id);
  mkdirSync(directory, { recursive: true });
  const files = [];
  const structures = detectStructure(projectDir);
  const structure = Array.isArray(structures) ? structures : structures === undefined ? [] : [structures];
  if (structure.length === 0) throw new Error('本集没有分镜/镜头表（分镜.md、镜头表.md、03-镜头表.md 等），不能固化成模板');
  for (const file of structure) {
    cpSync(join(projectDir, file), join(directory, file));
    files.push({ path: file, role: 'structure', sha256: sha256File(join(directory, file)), bytes: statSync(join(directory, file)).size });
  }
  for (const [file, role] of COPY_FILES) {
    const source = join(projectDir, file);
    if (!existsSync(source)) continue;
    cpSync(source, join(directory, file));
    files.push({ path: file, role, sha256: sha256File(join(directory, file)), bytes: statSync(join(directory, file)).size });
  }
  const manifest = {
    schemaVersion: 1,
    id,
    name: title,
    version: '0.1.0',
    description: String(description ?? '').trim() || ('从 ' + episode.id + ' 固化的短剧结构'),
    createdAt: new Date().toISOString(),
    source: { episode: episode.id, directory: episode.directory, structure: structure.join(', ') },
    license: '作者自定（未声明）',
    files,
    slots: [
      { id: 'title', kind: 'title', required: true, maxChars: 24, note: '片名/集名' },
      { id: 'character.lead', kind: 'character', required: true, note: '主角姓名与外貌，沿用视觉设定' },
      { id: 'character.opponent', kind: 'character', required: false, note: '对手/阻力' },
      { id: 'scene.main', kind: 'scene', required: true, note: '主场景；保留空间关系' },
      { id: 'line.hook', kind: 'line', required: true, maxChars: 18, note: '开场钩子台词' },
      { id: 'line.turn', kind: 'line', required: false, maxChars: 24, note: '反转台词' }
    ],
    checks: ['镜头 ID/时长/转场与 MOTION 对账', '槽位全部有值', '至少三个同刻对比点 + 真实渲染版本']
  };
  writeFileSync(join(directory, 'kt-template.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  writeFileSync(join(directory, 'TEMPLATE.md'), templateMarkdown(manifest), 'utf8');
  writeFileSync(join(directory, 'preset.json'), JSON.stringify(presetOf(manifest), null, 2) + '\n', 'utf8');
  return { manifest, path: STATE_DIRECTORY + '/' + TEMPLATE_DIRECTORY + '/' + id };
}

export function listTemplates(cwd) {
  const root = rootOf(cwd);
  const templates = [];
  if (existsSync(root)) {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = readJson(join(root, entry.name, 'kt-template.json'));
      if (manifest !== undefined) templates.push({ id: manifest.id, name: manifest.name, version: manifest.version, description: manifest.description, files: manifest.files.length, slots: manifest.slots.length, createdAt: manifest.createdAt });
    }
  }
  templates.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { templates };
}

export function getTemplate(cwd, id) {
  const directory = join(rootOf(cwd), String(id ?? ''));
  const manifest = readJson(join(directory, 'kt-template.json'));
  if (manifest === undefined) throw new Error('模板不存在：' + String(id ?? ''));
  const bad = [];
  for (const file of manifest.files) {
    const target = join(directory, file.path);
    if (!existsSync(target)) bad.push({ path: file.path, reason: '缺失' });
    else if (sha256File(target) !== file.sha256) bad.push({ path: file.path, reason: 'sha256 不符' });
  }
  return {
    manifest,
    path: STATE_DIRECTORY + '/' + TEMPLATE_DIRECTORY + '/' + manifest.id,
    template: readFileSync(join(directory, 'TEMPLATE.md'), 'utf8'),
    preset: readJson(join(directory, 'preset.json')),
    ok: bad.length === 0,
    ...(bad.length === 0 ? {} : { invalid: bad })
  };
}

export function applyTemplate(cwd, episode, templateId) {
  const template = getTemplate(cwd, templateId);
  if (!template.ok) throw new Error('模板文件校验失败：' + template.invalid.map((item) => item.path + '（' + item.reason + '）').join('、'));
  const projectDir = projectDirOf(cwd, episode);
  const file = join(projectDir, '模板改编计划.md');
  const lines = [
    '# 模板改编计划 · ' + template.manifest.name,
    '',
    '- 模板：' + template.manifest.id + ' v' + template.manifest.version,
    '- 来源：' + template.manifest.source.episode,
    '- 说明：' + template.manifest.description,
    '',
    '## 保持',
    '',
    '- 镜头顺序与作用、转场关系、已接受的停顿与切点。',
    '- 改时长时同步调整转场与声画锚点。',
    '',
    '## 替换槽位',
    '',
    ...template.manifest.slots.map((slot) => '- `' + slot.id + '` · ' + slot.kind + (slot.required ? ' · 必填' : '') + ' — ' + slot.note),
    '',
    '## 结构参考',
    '',
    '```md',
    template.template.split('\n').slice(0, 60).join('\n'),
    '```',
    '',
    '## 检查',
    '',
    ...template.manifest.checks.map((item) => '- ' + item),
    '',
    '> 本文件只是改编计划；确认后再改 分镜.md 与 MOTION.md，不覆盖模板包。',
    ''
  ].join('\n');
  writeFileSync(file, lines, 'utf8');
  return { template: template.manifest.id, name: template.manifest.name, path: (episode.directory === '.' ? '' : episode.directory + '/') + '模板改编计划.md', text: lines };
}

export function describeTemplates(list) {
  if (list.templates.length === 0) return ['# 短剧模板包', '', '还没有模板。把一集已验证的结构用 toon_template action=create 固化。'].join('\n');
  return ['# 短剧模板包', '', ...list.templates.map((template) => '- ' + template.id + ' · ' + template.name + ' · v' + template.version + ' · ' + String(template.files) + ' 文件 / ' + String(template.slots) + ' 槽位 — ' + template.description)].join('\n');
}
