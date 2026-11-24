/**
 * Motion.md：把「保留什么、换什么、按什么时间与运动做、拿什么证据验收」写成可核对的创作契约。
 *
 * 移植自 OpenMotion 的 MOTION_DESIGN.md 思路，但只保留短剧/漫剧需要的字段：
 * 来源与版权、保持项、替换项、镜头时间轴、视觉与运动、素材与声音、检查与证据。
 * 纯解析/校验，不生成媒体；无法对上的镜头时间必须报出来，不能靠“看起来差不多”。
 */

const SECTION_KEYS = [
  ['source', /来源|身份|版权/],
  ['keep', /保持|保留/],
  ['replace', /替换|可替换/],
  ['timeline', /时间轴|时间与运动|镜头时间/],
  ['visual', /视觉|构图|运动语言/],
  ['material', /素材|声音|音乐|配音/],
  ['evidence', /检查|证据|验收/]
];

function sectionKey(title) {
  for (const [key, pattern] of SECTION_KEYS) {
    if (pattern.test(title)) return key;
  }
  return undefined;
}

function stripMarker(line) {
  return line.replace(/^\s*(?:[-*+]\s+|>\s*)/, '').trim();
}

function numeric(value) {
  const match = /-?\d+(?:\.\d+)?/.exec(String(value ?? ''));
  return match === null ? undefined : Number.parseFloat(match[0]);
}

function tableCells(line) {
  return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((cell) => cell.trim());
}

function isSeparator(cells) {
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

/** 解析 Motion.md：章节正文、时间轴镜头、保持/替换条目与证据条目。 */
export function parseMotion(markdown) {
  const lines = String(markdown ?? '').split(/\r?\n/);
  const sections = { source: '', keep: '', replace: '', timeline: '', visual: '', material: '', evidence: '' };
  const timeline = [];
  let current;
  let headingLine = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? '';
    const heading = /^##\s+(.+?)\s*$/.exec(raw);
    if (heading !== null) {
      current = sectionKey(heading[1]);
      headingLine = index + 1;
      if (current !== undefined) sections[current] += (sections[current] === '' ? '' : '\n') + raw;
      continue;
    }
    if (current === undefined) continue;
    sections[current] += (sections[current] === '' ? '' : '\n') + raw;
    if (current !== 'timeline') continue;
    const cells = tableCells(raw);
    if (cells.length < 4 || isSeparator(cells) || /^(镜头|shot|id)/i.test(cells[0])) continue;
    const id = cells[0].replace(/[`*]/g, '').trim();
    if (!/^[A-Za-z]{0,4}[-_]?\d{1,3}(?:[._-]\d{1,3}){0,2}$/.test(id)) continue;
    timeline.push({
      id,
      line: index + 1,
      start: numeric(cells[1]),
      end: numeric(cells[2]),
      duration: numeric(cells[3]),
      transition: (cells[4] ?? '').trim() || 'cut',
      note: (cells[5] ?? '').trim()
    });
  }
  const bullets = (key) => sections[key].split(/\r?\n/).map(stripMarker).filter((line) => line !== '' && !line.startsWith('#') && !line.startsWith('|'));
  return {
    present: String(markdown ?? '').trim() !== '',
    sections,
    timeline,
    keep: bullets('keep'),
    replace: bullets('replace'),
    evidence: bullets('evidence'),
    headingLine
  };
}

function seconds(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '?';
}

/** 从分镜镜头生成 Motion.md 骨架；时间轴按镜头时长顺排，转场归前镜。 */
export function motionTemplate({ title, shots = [], referencePath, episode } = {}) {
  const rows = [];
  let cursor = 0;
  for (const shot of shots) {
    const duration = Number.isFinite(shot.duration) && shot.duration > 0 ? shot.duration : 0;
    const end = cursor + duration;
    rows.push('| ' + (shot.id ?? 'S??') + ' | ' + seconds(cursor) + ' | ' + seconds(end) + ' | ' + seconds(duration) + ' | ' + (shot.transitionOut || 'cut') + ' | ' + (shot.fields?.台词 ?? shot.fields?.dialogue ?? '') + ' |');
    cursor = end;
  }
  const order = shots.map((shot) => shot.id).filter((id) => id !== undefined).join(' → ');
  return [
    '# MOTION · ' + (episode ?? 'EP') + ' · ' + (title ?? '未命名'),
    '',
    '> 本文件记录「保留什么、换什么、按什么时间与运动做、拿什么证据验收」。先写契约，再生成媒体。',
    '',
    '## 1. 来源与版本',
    '',
    '- 类型：' + (referencePath === undefined ? '原创' : '参考复刻'),
    '- 参考片：' + (referencePath ?? '无（原创）'),
    '- 参考拆解：参考视频/参考拆解.md',
    '- 版权口径：<待填：原创 / 已授权 / 只学结构不复用画面>',
    '',
    '## 2. 保持',
    '',
    '- 镜头顺序：' + (order === '' ? '<待填：从分镜抄镜头 ID 顺序>' : order),
    '- 节奏：<待填：开场钩子、反转点、结尾停留>',
    '- 声音锚点：<待填：哪一句/哪一拍必须对上>',
    '',
    '## 3. 替换',
    '',
    '- 人物：<待填：原片人物 → 本片人物>',
    '- 场景：<待填>',
    '- 文案/台词：<待填>',
    '- 品牌/素材：<待填>',
    '',
    '## 4. 时间轴',
    '',
    '| 镜头 | 入点(s) | 出点(s) | 时长(s) | 转场 | 台词/声音 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...(rows.length === 0 ? ['| S?? | 0 | 0 | 0 | cut | <待填> |'] : rows),
    '',
    '## 5. 视觉与运动',
    '',
    '- 构图与景别：<待填>',
    '- 运镜：<待填：固定/推/拉/摇/跟，速度与停点>',
    '- 字级与字幕：<待填>',
    '- 缓动与转场：<待填>',
    '',
    '## 6. 素材与声音',
    '',
    '- 必须提供的素材：<待填>',
    '- 可以生成的素材：<待填>',
    '- 配音/音乐/音效：<待填：来源、时长、同步点>',
    '',
    '## 7. 检查与证据',
    '',
    '- 对比时间点：<待填：至少三个同刻对比点>',
    '- 渲染版本：<待填：样片/成片路径与 hash>',
    '- 剩余差距：<待填：具体差在哪，不说“差不多”>',
    ''
  ].join('\n');
}

/**
 * 校验 Motion.md 与分镜是否对得上：镜头集合/顺序/时长/转场/证据。
 * 阻断项会进入本集诊断；提示项不阻断，但要写清。
 */
export function validateMotion(markdown, { shots = [], reference = false } = {}) {
  const motion = parseMotion(markdown);
  const diagnostics = [];
  const add = (severity, code, message, line) => diagnostics.push({ severity, code, message, ...(line === undefined ? {} : { line }) });

  if (!motion.present) {
    add('warning', 'motion-missing', '缺 MOTION.md：先写镜头时间轴、保持/替换与证据，再生成媒体');
    return { ok: true, motion, diagnostics };
  }
  if (motion.timeline.length === 0) {
    add('blocker', 'motion-timeline-missing', 'MOTION.md 的「时间轴」没有识别到镜头行');
  } else {
    const shotIds = shots.map((shot) => shot.id).filter((id) => id !== undefined);
    const timelineIds = motion.timeline.map((row) => row.id);
    const seen = new Set();
    for (const row of motion.timeline) {
      if (seen.has(row.id)) add('blocker', 'motion-duplicate-shot', '时间轴镜头「' + row.id + '」重复', row.line);
      seen.add(row.id);
      const shot = shots.find((item) => item.id === row.id);
      if (shot === undefined) {
        add('blocker', 'motion-shot-unknown', '时间轴镜头「' + row.id + '」在分镜里不存在', row.line);
        continue;
      }
      if (shot.duration > 0 && Number.isFinite(row.duration) && Math.abs(shot.duration - row.duration) > 0.2) {
        add('blocker', 'motion-duration-mismatch', '镜头「' + row.id + '」时长 ' + seconds(row.duration) + 's 与分镜 ' + seconds(shot.duration) + 's 不一致', row.line);
      }
      if ((shot.transitionOut || 'cut') !== (row.transition || 'cut')) {
        add('warning', 'motion-transition-mismatch', '镜头「' + row.id + '」转场「' + row.transition + '」与分镜「' + (shot.transitionOut || 'cut') + '」不一致', row.line);
      }
      if (Number.isFinite(row.start) && Number.isFinite(row.end) && row.end <= row.start) {
        add('blocker', 'motion-time-invalid', '镜头「' + row.id + '」出点不大于入点', row.line);
      }
    }
    if (shotIds.length > 0) {
      const missing = shotIds.filter((id) => !seen.has(id));
      if (missing.length > 0) add('blocker', 'motion-shot-missing', '分镜里有、Motion 时间轴里缺的镜头：' + missing.join('、'));
      const known = timelineIds.filter((id) => shotIds.includes(id));
      const expectedOrder = shotIds.filter((id) => known.includes(id));
      if (known.join('|') !== expectedOrder.join('|')) add('blocker', 'motion-shot-order', 'Motion 时间轴的镜头顺序与分镜不一致');
    }
  }
  const filled = (items) => items.filter((item) => !item.includes('待填'));
  if (filled(motion.keep).length === 0) add('warning', 'motion-keep-missing', '「保持」还没有写：至少要写镜头顺序、节奏与声音锚点');
  if (filled(motion.replace).length === 0) add('warning', 'motion-replace-missing', '「替换」还没有写：写清人物/场景/文案/品牌哪些换、哪些不换');
  if (reference && filled(motion.evidence).length === 0) add('warning', 'motion-evidence-missing', '参考复刻还没有「检查与证据」：至少三个同刻对比点与渲染版本');
  const blockers = diagnostics.filter((item) => item.severity === 'blocker');
  return { ok: blockers.length === 0, motion, diagnostics };
}

export function describeMotion(result) {
  const lines = ['# Motion 契约', '', result.ok ? '结论：通过（无阻断）' : '结论：有阻断', result.motion.present ? '时间轴镜头：' + String(result.motion.timeline.length) + ' 个' : '还没有 MOTION.md', ''];
  for (const item of result.diagnostics) lines.push('- ' + (item.severity === 'blocker' ? '阻断 ' : '提示 ') + (item.line === undefined ? '' : '第 ' + String(item.line) + ' 行 ') + item.message);
  if (result.diagnostics.length === 0) lines.push('- 没有发现契约问题');
  return lines.join('\n');
}
