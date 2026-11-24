/**
 * 短剧/漫剧节奏配方：把 OpenMotion 的 Library Skill 思路落成可检索、可套用的镜头结构。
 *
 * 配方只给结构与检查项，不写死剧情；apply 只生成建议文件，不改 分镜.md。
 * 这样创作者可以先选节奏，再让 Agent 按本集人物/场景填内容。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const RECIPES = [
  {
    id: 'cold-open-hook',
    name: '冷开场钩子',
    kind: 'structure',
    tags: ['开场', '悬念', '竖屏'],
    summary: '第一镜先给异常结果，第二镜才交代人物与处境；3–5 镜内完成钩子。',
    durationHint: '4–8 秒 / 3–5 镜',
    keep: ['第一镜 2 秒内出现异常物件或动作', '不先解释背景', '第 3 镜前给一次信息缺口'],
    beats: [
      { role: '异常', seconds: 2, camera: '特写/固定', sound: '环境声突然断开', prompt: '无关人物，只拍异常结果' },
      { role: '反应', seconds: 2, camera: '近景/手持轻晃', sound: '呼吸或心跳', prompt: '主角看到异常的第一反应' },
      { role: '缺口', seconds: 3, camera: '中景/推', sound: '一句没说完的话', prompt: '留下“为什么”不回答' }
    ],
    transitions: ['cut', 'flash'],
    checks: ['第一镜是否在 2 秒内给出异常', '是否忍住没先讲背景', '结尾是否留下具体问题']
  },
  {
    id: 'three-beat-reversal',
    name: '三拍反转',
    kind: 'structure',
    tags: ['反转', '爽点', '对话'],
    summary: '建立预期 → 加压 → 反转兑现；反转前必须让观众看见错误判断的依据。',
    durationHint: '12–20 秒 / 6–10 镜',
    keep: ['反转前给两个可复用的视觉证据', '反转镜不切新场景', '反转后给一个反应镜'],
    beats: [
      { role: '建立', seconds: 4, camera: '中景', sound: '平稳对白', prompt: '让观众以为 A 占上风' },
      { role: '加压', seconds: 4, camera: '正反打', sound: '语速加快', prompt: 'A 逼问，B 退让' },
      { role: '反转', seconds: 4, camera: '特写/突然静音', sound: '一句关键台词', prompt: 'B 亮出证据，A 表情变化' },
      { role: '兑现', seconds: 3, camera: '近景', sound: '环境声回来', prompt: '局面不可逆' }
    ],
    transitions: ['cut', 'dissolve'],
    checks: ['反转依据是否提前出现', '反转镜是否同一空间', '是否有反应镜']
  },
  {
    id: 'vertical-over-shoulder',
    name: '竖屏正反打',
    kind: 'shot',
    tags: ['对话', '竖屏', '过肩'],
    summary: '竖屏对话用不对称过肩与留白，把关键信息放在人物视线方向。',
    durationHint: '每镜 2–3 秒',
    keep: ['轴线不跳', '两人视线方向相反', '关键物件在两人之间'],
    beats: [
      { role: '过肩 A', seconds: 2.5, camera: '过肩/近景', sound: '对白', prompt: 'A 说话，B 在前景虚化' },
      { role: '过肩 B', seconds: 2.5, camera: '过肩/近景', sound: '对白', prompt: 'B 回应，A 在前景虚化' },
      { role: '插入', seconds: 1.5, camera: '特写', sound: '停顿', prompt: '关键物件或手部动作' }
    ],
    transitions: ['cut'],
    checks: ['轴线是否稳定', '视线是否相反', '插入镜是否推进信息']
  },
  {
    id: 'montage-acceleration',
    name: '蒙太奇加速',
    kind: 'structure',
    tags: ['蒙太奇', '训练', '时间流逝'],
    summary: '用同一动作的重复与递进压缩时间，镜长递减，声音做节拍。',
    durationHint: '6–10 秒 / 6–12 镜',
    keep: ['同一构图或同一动作重复', '镜长逐次缩短', '最后一镜打破重复'],
    beats: [
      { role: '建立', seconds: 1.5, camera: '固定中景', sound: '节拍起', prompt: '第一次动作' },
      { role: '重复', seconds: 1.2, camera: '同机位', sound: '节拍', prompt: '同一动作第二次' },
      { role: '加速', seconds: 0.8, camera: '同机位/更快', sound: '节拍加密', prompt: '第三次、第四次' },
      { role: '打破', seconds: 2, camera: '换机位', sound: '音乐落点', prompt: '结果出现' }
    ],
    transitions: ['cut', 'flash'],
    checks: ['重复是否可识别', '镜长是否递减', '结尾是否打破重复']
  },
  {
    id: 'memory-flashback',
    name: '回忆闪回',
    kind: 'structure',
    tags: ['回忆', '闪回', '情绪'],
    summary: '用画质/画幅/声音差异标记回忆，回到现在时给一个锚点物件。',
    durationHint: '8–14 秒 / 4–6 镜',
    keep: ['回忆段有可识别的画质或画幅差异', '同一锚点物件跨时空', '回到现在时声音先回来'],
    beats: [
      { role: '触发', seconds: 2, camera: '特写', sound: '现实声', prompt: '看到锚点物件' },
      { role: '回忆', seconds: 4, camera: '柔焦/慢推', sound: '声音变远', prompt: '同一物件在过去' },
      { role: '回到现在', seconds: 2, camera: '同机位', sound: '现实声回来', prompt: '人物回神' }
    ],
    transitions: ['dissolve', 'fade'],
    checks: ['回忆标记是否清楚', '锚点物件是否一致', '回到现在的声画是否干净']
  },
  {
    id: 'suspense-gap',
    name: '信息差悬念',
    kind: 'structure',
    tags: ['悬念', '信息差', '反派'],
    summary: '让观众知道角色不知道的事，用画外空间或重复细节维持压力。',
    durationHint: '10–16 秒 / 5–8 镜',
    keep: ['观众先于角色获得信息', '重复一个细节三次', '角色做出基于错误信息的行动'],
    beats: [
      { role: '给观众', seconds: 3, camera: '画外/窥视', sound: '轻微异常', prompt: '观众看到危险' },
      { role: '角色不知', seconds: 3, camera: '中景', sound: '日常对白', prompt: '角色轻松行动' },
      { role: '细节重复', seconds: 3, camera: '特写', sound: '同一音效', prompt: '危险靠近' },
      { role: '临界', seconds: 3, camera: '近景', sound: '静音', prompt: '角色即将发现' }
    ],
    transitions: ['cut', 'dissolve'],
    checks: ['观众是否先知道', '细节是否重复', '压力是否递增']
  },
  {
    id: 'fight-rhythm',
    name: '打斗节奏',
    kind: 'structure',
    tags: ['打斗', '动作', '节奏'],
    summary: '用“准备—交锋—后果”三段，不靠碎剪堆动作；每段给一个清晰空间关系。',
    durationHint: '6–12 秒 / 8–14 镜',
    keep: ['每次交锋前后有空间关系镜', '动作方向一致', '受击后有可见后果'],
    beats: [
      { role: '准备', seconds: 2, camera: '全景/固定', sound: '环境声压低', prompt: '两人位置与武器' },
      { role: '交锋', seconds: 4, camera: '中景/跟拍', sound: '冲击音', prompt: '一次完整攻防' },
      { role: '后果', seconds: 2, camera: '特写', sound: '喘息', prompt: '伤势或道具损坏' }
    ],
    transitions: ['cut', 'flash'],
    checks: ['空间关系是否清楚', '动作方向是否一致', '后果是否可见']
  },
  {
    id: 'cliffhanger-end',
    name: '集尾钩子',
    kind: 'structure',
    tags: ['集尾', '钩子', '连载'],
    summary: '在答案出现前切断，最后 1–2 秒给新信息而不是重复悬念。',
    durationHint: '4–8 秒 / 3–5 镜',
    keep: ['答案不落地', '最后给一个此前没出现的信息', '下一集可接的具体行动'],
    beats: [
      { role: '逼答案', seconds: 2, camera: '近景', sound: '对白', prompt: '角色要求答案' },
      { role: '打断', seconds: 1, camera: '特写/切黑', sound: '硬切静音', prompt: '外部事件打断' },
      { role: '新信息', seconds: 3, camera: '新视角', sound: '一句新台词', prompt: '观众看到角色不知道的东西' }
    ],
    transitions: ['cut', 'fade'],
    checks: ['答案是否没给', '最后信息是否新', '下一集是否有可接行动']
  },
  {
    id: 'emotion-closeup',
    name: '情绪特写',
    kind: 'shot',
    tags: ['情绪', '特写', '表演'],
    summary: '用一个不剪辑的特写让表演完成信息，声音只留呼吸或一句台词。',
    durationHint: '3–6 秒 / 1–2 镜',
    keep: ['不切走', '眼神有明确落点', '声音做减法'],
    beats: [
      { role: '进入', seconds: 1, camera: '特写/固定', sound: '环境声', prompt: '人物听到消息' },
      { role: '变化', seconds: 3, camera: '同机位', sound: '呼吸', prompt: '表情从 A 到 B' }
    ],
    transitions: ['cut'],
    checks: ['是否忍住没切', '眼神是否有落点', '声音是否做减法']
  },
  {
    id: 'object-clue',
    name: '物品线索',
    kind: 'shot',
    tags: ['线索', '道具', '推理'],
    summary: '用同一物件的三个状态推进推理：正常 → 异常 → 意义改变。',
    durationHint: '6–10 秒 / 3–5 镜',
    keep: ['同一物件同一特征', '每次出现多一个信息', '最后让人物做出行动'],
    beats: [
      { role: '正常', seconds: 2, camera: '特写', sound: '环境声', prompt: '物件在应在的位置' },
      { role: '异常', seconds: 2, camera: '同机位', sound: '一声异响', prompt: '位置或状态变了' },
      { role: '意义', seconds: 2, camera: '特写/推', sound: '静音', prompt: '人物意识到意味着什么' }
    ],
    transitions: ['cut', 'dissolve'],
    checks: ['特征是否一致', '信息是否递进', '是否落到行动']
  }
];

export function listRecipes() {
  return RECIPES.map(({ id, name, kind, tags, summary, durationHint }) => ({ id, name, kind, tags, summary, durationHint }));
}

export function getRecipe(id) {
  return RECIPES.find((recipe) => recipe.id === String(id ?? ''));
}

function recipeMarkdown(recipe, episode) {
  const lines = [
    '# 节奏配方 · ' + recipe.name,
    '',
    '- 集：' + episode,
    '- 类型：' + recipe.kind + ' · ' + recipe.durationHint,
    '- 用途：' + recipe.summary,
    '',
    '## 镜头骨架',
    '',
    '| # | 作用 | 时长(s) | 机位 | 声音 | 画面提示 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...recipe.beats.map((beat, index) => '| ' + String(index + 1) + ' | ' + beat.role + ' | ' + String(beat.seconds) + ' | ' + beat.camera + ' | ' + beat.sound + ' | ' + beat.prompt + ' |'),
    '',
    '## 保持',
    '',
    ...recipe.keep.map((item) => '- ' + item),
    '',
    '## 转场',
    '',
    '- ' + recipe.transitions.join(' / '),
    '',
    '## 检查',
    '',
    ...recipe.checks.map((item) => '- ' + item),
    '',
    '> 这是建议，不是成片；合并进 分镜.md 前要按本集人物、场景与时长改写。',
    ''
  ];
  return lines.join('\n');
}

export function applyRecipe(cwd, episode, id) {
  const recipe = getRecipe(id);
  if (recipe === undefined) throw new Error('配方不存在：' + String(id ?? ''));
  const projectDir = episode.projectDir ?? (episode.directory === '.' ? cwd : join(cwd, episode.directory));
  const directory = join(projectDir, 'recipes');
  mkdirSync(directory, { recursive: true });
  const file = join(directory, recipe.id + '.md');
  const text = recipeMarkdown(recipe, episode.id);
  writeFileSync(file, text, 'utf8');
  return { recipe: recipe.id, name: recipe.name, path: (episode.directory === '.' ? '' : episode.directory + '/') + 'recipes/' + recipe.id + '.md', text };
}

export function describeRecipes() {
  return ['# 短剧节奏配方', '', ...listRecipes().map((recipe) => '- ' + recipe.id + ' · ' + recipe.name + ' · ' + recipe.kind + ' · ' + recipe.durationHint + ' — ' + recipe.summary)].join('\n');
}
