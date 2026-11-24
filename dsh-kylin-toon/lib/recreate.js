/**
 * 参考复刻计划：把「拍同款」从一句感觉变成可核对的保持/替换/表示/证据。
 *
 * 只写计划，不改分镜；默认只做一次聚焦比对（最多 4 个同刻点），不做逐帧无限返工。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function fmt(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '?';
}

function projectDirOf(cwd, episode) {
  return episode.projectDir ?? (episode.directory === '.' ? cwd : join(cwd, episode.directory));
}

function seconds(value) {
  return Number.isFinite(value) ? value : 0;
}

/** 从参考记录与本集分镜生成复刻计划；缺分析/方案时保留警告，不假装可复刻。 */
export function buildRecreatePlan(cwd, episode, projection, record) {
  const warnings = [];
  const analysis = record?.analysis;
  const sourceShots = Array.isArray(analysis?.shots) ? analysis.shots : [];
  if (record === undefined) warnings.push('还没有参考片分析：先 toon_reference_intake/fetch → toon_reference_analyze');
  else if (sourceShots.length === 0) warnings.push('参考分析里没有镜头窗：先完成 toon_reference_analyze');
  if (record?.chosenPlanId === undefined || record.chosenPlanId === '') warnings.push('还没有选定同款方案：先用 toon_reference_plans → toon_reference_choose');
  if (record?.rights?.status !== 'confirmed') warnings.push('版权口径未确认：先 toon_reference_rights；未确认不进 G0');
  const plan = Array.isArray(record?.plans) ? record.plans.find((item) => item.id === record.chosenPlanId) : undefined;
  const targetShots = projection?.shots ?? [];
  if (sourceShots.length > 0 && targetShots.length > 0 && sourceShots.length !== targetShots.length) {
    warnings.push('源片 ' + String(sourceShots.length) + ' 镜 / 本集 ' + String(targetShots.length) + ' 镜：按目标结构重排，不逐镜硬套');
  }
  const total = sourceShots.reduce((max, shot) => Math.max(max, seconds(shot.endSec)), 0);
  const comparison = total > 0 ? [0, 0.25, 0.5, 0.75].map((ratio) => ({ atSec: Math.round(total * ratio * 10) / 10, note: ratio === 0 ? '开场钩子' : ratio === 0.5 ? '反转/中段' : '节奏接点' })) : [];
  const rows = targetShots.map((shot, index) => {
    const source = sourceShots[index];
    return '| ' + (source === undefined ? '—' : fmt(source.startSec) + '–' + fmt(source.endSec) + 's') + ' | ' + (shot.id ?? '?') + ' | ' + fmt(shot.duration) + 's | 待定：原生文字/UI / 静图+动效 / 生成媒体 / 用户素材 | ' + (source === undefined ? '源片无对应镜，按目标结构新建' : '参考第 ' + String(index + 1) + ' 镜') + ' |';
  });
  const lines = [
    '# 复刻计划 · ' + episode.id,
    '',
    '- 参考片：' + (record?.source?.path ?? '未登记'),
    '- 来源：' + (record?.source?.url ?? record?.source?.kind ?? '本地'),
    '- 已选方案：' + (record?.chosenPlanId ?? '未选'),
    '- 版权口径：' + (record?.rights?.basis ?? '未确认'),
    '- 参考节奏：' + (analysis?.pacing === undefined ? '未分析' : String(analysis.pacing.shotCount) + ' 镜 / 平均 ' + fmt(analysis.pacing.avgShotSec) + 's / 每分钟 ' + fmt(analysis.pacing.cutsPerMinute) + ' 切'),
    '',
    '## 1. 保持',
    '',
    '> 学结构，不复用画面。保留镜头作用、切点关系、开场钩子与结尾停留；换内容时保持原片的视觉密度、镜头运动、字形气质与对比度，不能更暗、更空、更碎。',
    '',
    ...(plan === undefined ? ['- <待填：从已选方案抄 keep 项>'] : plan.keep.map((item) => '- ' + item)),
    '',
    '## 2. 替换',
    '',
    ...(plan === undefined ? ['- <待填：人物/场景/文案/品牌/素材>'] : plan.replace.map((item) => '- ' + item)),
    '',
    '## 3. 可编辑表示',
    '',
    '| 源片镜头 | 目标镜头 | 目标时长 | 表示 | 依据 |',
    '| --- | --- | --- | --- | --- |',
    ...(rows.length === 0 ? ['| — | — | — | 待定 | 先写分镜 |'] : rows),
    '',
    '表示选择规则：文字/UI/图表/Logo/字幕/镜头运动优先原生重建；人物、产品、实拍、旁白、音乐用生成媒体或用户素材；文字/Logo/UI 保持在生成底板之上的原生层。',
    '',
    '## 4. 声音',
    '',
    '- 参考片有声就做成片有声：默认保留/重排参考音轨。',
    '- 替换旁白必须得到明确同意；未答的同意问题保持 pending，不能靠删除旁白绕过。',
    '- 字幕/配音锚点随剪切重建映射，不只靠抽帧。',
    '',
    '## 5. 检查与证据',
    '',
    '- 默认只做一次聚焦比对，最多 4 个同刻点：',
    ...(comparison.length === 0 ? ['  - <待填：分析出参考时长后生成>'] : comparison.map((point) => '  - ' + fmt(point.atSec) + 's · ' + point.note)),
    '- Bounded repair：只修一批明确缺陷；修不掉的写进「剩余差距」，不无限返工。',
    '- 技术验证（ffprobe/解码/seek）、视觉审阅、用户采用分开记录。',
    '',
    '## 6. 交付口径',
    '',
    '- 说清：保留了什么、改了什么、实际渲染出了什么、还差什么。',
    '- 不宣称未达到的「忠实」；不用相似度分数替代人工视觉验收。',
    '',
    '## 诊断',
    '',
    ...(warnings.length === 0 ? ['- 参考分析、方案与版权都已就绪'] : warnings.map((item) => '- 提示 ' + item)),
    ''
  ];
  return { text: lines.join('\n'), warnings, comparison, sourceShots: sourceShots.length, targetShots: targetShots.length };
}

export function writeRecreatePlan(cwd, episode, projection, record) {
  const plan = buildRecreatePlan(cwd, episode, projection, record);
  const directory = projectDirOf(cwd, episode);
  const file = join(directory, '复刻计划.md');
  mkdirSync(directory, { recursive: true });
  writeFileSync(file, plan.text, 'utf8');
  return { ...plan, path: (episode.directory === '.' ? '' : episode.directory + '/') + '复刻计划.md' };
}

export function readRecreatePlan(cwd, episode) {
  const file = join(projectDirOf(cwd, episode), '复刻计划.md');
  if (!existsSync(file)) return undefined;
  return { path: (episode.directory === '.' ? '' : episode.directory + '/') + '复刻计划.md', text: readFileSync(file, 'utf8') };
}
