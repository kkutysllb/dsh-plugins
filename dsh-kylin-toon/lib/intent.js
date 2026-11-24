/**
 * 创作意图识别（小说工作台入口）。
 *
 * 目标：在用户只说一句话时，判断他是在「要创作小说」还是短剧/游戏/解说/参考片，
 * 并判断动作（新建、续写、修改、拆解、发布、改编）。纯规则、零网络、可测试。
 *
 * 三个原则：
 * 1. 媒介词优先于泛故事词：「写剧本」是短剧，不是小说；
 * 2. 改编句式按目标媒介归类：「把小说改成短剧」是短剧，但记住 sourceMedium=novel；
 * 3. 工作区上下文只做加权，不覆盖明确媒介词；用户说「继续写」时才由工作区决定。
 */

export const INTENT_MEDIA = ['novel', 'drama', 'game', 'video', 'reference', 'unknown'];
export const INTENT_ACTIONS = ['create', 'continue', 'revise', 'analyze', 'publish', 'adapt', 'unknown'];

const MEDIUM_LABEL = { novel: '小说', drama: '短剧漫剧', game: '互动游戏', video: '视频解说', reference: '参考片', unknown: '未识别' };
const ACTION_LABEL = { create: '新建', continue: '续写', revise: '修改', analyze: '拆解/分析', publish: '发布准备', adapt: '改编', unknown: '未识别' };
const WORKSPACE_OF = { novel: 'story', drama: 'drama', game: 'game', video: 'video' };

// 识别出媒介后直接给出工作台与入口工具：让 Agent 下一步不用再猜。
const ENTRY = {
  novel: { tab: 'story', tool: 'toon_novel_status', prompt: '先跑 toon_novel_status 看已有结构与缺口，再决定建书、续写还是改稿。' },
  drama: { tab: 'drama', tool: 'toon_project', prompt: '先跑 toon_project 看已有剧集，再决定新建 EP 还是续写本集。' },
  game: { tab: 'game', tool: 'toon_game_intake', prompt: '先跑 toon_game_intake 识别原创还是改编，拿到工程骨架与第一阶段。' },
  video: { tab: 'video', tool: 'toon_project', prompt: '先跑 toon_project 看原片与成片，再定解说结构。' },
  reference: { tab: 'drama', tool: 'toon_reference_status', prompt: '先跑 toon_reference_status 看参考片档案与可复用结构。' }
};

const STRONG = {
  novel: ['写小说', '小说', '网文', '长篇', '短篇', '开书', '开新书', '新书', '写书', '正文', '章节', '章纲', '细纲', '卷纲', '大纲', '人物小传', '世界观', '金手指', '爽点', '追读', '签约', '上架', '日更', '断更', '卡文', '文风', '去ai味', '书评', '封面', '简介', '番茄', '起点', '晋江', '七猫', '盐言', '故事会', '连载'],
  drama: ['短剧', '漫剧', '剧本', '分镜', '剧集', '成片', '首帧', '尾帧', '镜头', '剪辑', '配音', '演员', '拍摄', '样片', '剧照', '设定图', '视频提示词', '图片提示词', '视觉设定', '第1集', '第2集', '第3集', '第4集', '第5集', '每一集'],
  game: ['互动游戏', '游戏', '玩法', '关卡', '数值', '战斗系统', '角色技能', 'unity', 'godot', '可玩', '试玩', '游戏设计', '互动叙事', '互动剧', '文字冒险', '视觉小说', 'galgame', '解谜', '模拟经营', 'roguelike', '游戏化', '灰盒', '盲玩', '核心循环', '可玩版本', '游戏原型'],
  video: ['视频解说', '解说', '旁白', 'recap', '混剪', '影视解说', '解说词', '拉片'],
  reference: ['参考片', '拍同款', '拆片', '参考视频', '同款', '对标片', '参考这条']
};

const WEAK = {
  novel: ['主角', '剧情', '故事', '人物', '情节', '冲突', '伏笔', '设定', '成长线', '感情线', '结局', '开篇', '黄金三章'],
  drama: ['场景', '对白', '台词', '角色', '表演', '转场', '画幅', '竖屏', '横屏'],
  game: ['选择', '分支', '结局', '互动', '玩家', '任务', '地图', '存档', '关卡设计', '原型'],
  video: ['剪辑', '素材', '成片', '字幕'],
  reference: ['结构', '节奏', '钩子']
};

const ACTIONS = {
  create: ['开一本', '开一篇', '写一本', '写个', '写一篇', '帮我写', '创作', '开书', '开新书', '新开', '从零', '起稿', '开始写', '来一本', '做个', '做', '写'],
  continue: ['继续写', '接着写', '续写', '下一章', '下一节', '日更', '更新', '接着', '继续', '往下写', '接上'],
  revise: ['修改', '改一下', '改稿', '润色', '重写', '精修', '去ai味', '去味', '调整', '打磨', '优化'],
  analyze: ['拆解', '拆书', '拆片', '拆文', '分析', '诊断', '评估', '审查', '看下', '看看', '复盘', '拍同款', '参考这条'],
  publish: ['发布', '上架', '签约', '投稿', '书名', '简介', '封面', '文案', '标签'],
  adapt: ['改编', '改成', '转成', '影视化', '短剧化', '游戏化', '翻拍']
};

const ADAPT_TO_DRAMA = /(?:把|将)?[^。！？]{0,16}(小说|原著|故事|漫画)[^。！？]{0,10}(改|改编|转|翻拍|影视化)[^。！？]{0,10}(短剧|剧本|漫剧|剧集|影视|动画)/;
const ADAPT_TO_GAME = /(?:把|将)?[^。！？]{0,20}(小说|原著|故事|漫画|作品|《[^》]+》|这本书)[^。！？]{0,10}(改|改编|转|做成|做|开发)[^。！？]{0,10}(游戏|互动|galgame)/i;
const ADAPT_TO_VIDEO = /(?:把|将)?[^。！？]{0,16}(小说|原著|故事|剧|片子)[^。！？]{0,10}(改|做成|剪成|转成)[^。！？]{0,10}(解说|recap|混剪|视频)/i;
const ADAPT_TO_NOVEL = /(?:把|将)?[^。！？]{0,16}(短剧|剧本|剧集|游戏|电影)[^。！？]{0,10}(改|改编|转|写成)[^。！？]{0,10}(小说|网文|长篇|故事)/;

const NEXT = {
  'novel:create': ['确认题材、篇幅（长篇/短篇）、投放平台与更新节奏', '建立 正文.md / 设定.md / 大纲.md（或 正文/ 大纲/ 设定/ 目录）', '先定主角欲望、核心冲突与前三章钩子，再开正文'],
  'novel:continue': ['先读上一章结尾、当前卷纲与追踪记录', '沿用现有视角与文风续写，不提前揭底', '写完更新大纲与人物状态'],
  'novel:revise': ['先定位要改的层级：表达、叙事还是因果', '保留作者原意，只改问题句段', '改完对照本章目标与伏笔'],
  'novel:analyze': ['确认拆全书还是指定章节范围', '按章节索引 → 情节单元 → 人物/设定演进输出', '结论落到原文位置'],
  'novel:publish': ['整理书名、笔名、分类、标签、简介', '按平台字数与格式要求检查', '缺的字段留空，不编造'],
  'novel:adapt': ['确认改编目标媒介与交付形态', '先做原著拆解与改编取舍', '再进入目标媒介的工作流'],
  'drama:create': ['确认单集还是多集、横屏/竖屏、每集时长', '建立 剧集/EP001/ 与剧本、视觉设定、分镜', '先定开场钩子与集尾悬念'],
  'drama:continue': ['读上一集剧本、分镜与连戏状态', '续写下一集，保持人物与道具连续'],
  'drama:revise': ['定位改剧本、分镜还是提示词', '改动同步到连戏与镜头状态'],
  'drama:analyze': ['确认拆剧还是拆参考片', '输出结构、节奏、镜长与可借鉴手法'],
  'drama:publish': ['整理成片规格、字幕、封面与投递信息'],
  'drama:adapt': ['先拿原著拆解与改编方案', '再写剧本、分镜与提示词'],
  'game:create': ['先跑 toon_game_intake：识别原创还是改编，确认平台、玩法与可玩范围', '用 toon_game_project action=init 建 game-adaptations/<项目>/，只先写 PRODUCT_BRIEF.md', '按 novel-to-game 流程走：概念 → 设计 → 灰盒；核心循环没跑通前不做美术量产'],
  'game:continue': ['跑 toon_game_project action=status 看阶段与缺口', '从最早未完成阶段继续；灰盒没过不进入美术', '每完成一个阶段回看投影，再决定下一步'],
  'game:revise': ['先跑 toon_game_project action=status 定位阶段', '玩法/关卡改 design/GAME_DESIGN.md，美术改 design/ART_DIRECTION.md', '实现缺陷改代码并复跑同一条 verify 命令'],
  'game:analyze': ['先跑 toon_game_intake 判断拆原著还是拆现有构建', '拆玩法循环、关卡节奏与失败反馈', '结论落到文件位置；不把跑通说成好玩'],
  'game:adapt': ['先跑 toon_game_intake 确认原著来源与目标平台', '用 toon_game_project action=init 建工程，PRODUCT_BRIEF 写清「原著：」', '再调 novel-game-analyze 产出 analysis/SOURCE_BIBLE.md，结论带原文位置'],
  'video:create': ['确认素材、时长与投放平台', '先定解说立意与选镜', '再做配音与混音'],
  'video:continue': ['读已有解说稿与剪辑单', '接着做下一段'],
  'video:revise': ['定位改写稿、选镜还是混音'],
  'video:analyze': ['拆镜头节奏、信息密度与音轨分工'],
  'video:adapt': ['先拆原著/原片，再定解说结构'],
  'reference:analyze': ['先登记参考片（本地/链接）', '拆切点、节奏、开场钩子与画幅', '出 2–3 张同款方案再选定'],
  'reference:create': ['先登记参考片，再做结构拆解', '学结构，不复用画面']
};

export function mediumLabel(medium) { return MEDIUM_LABEL[medium] ?? medium; }
export function actionLabel(action) { return ACTION_LABEL[action] ?? action; }

function countSignals(text, phrases, weight) {
  const hits = [];
  let score = 0;
  for (const phrase of phrases) {
    if (phrase === '') continue;
    let from = 0;
    let count = 0;
    while (true) {
      const at = text.indexOf(phrase, from);
      if (at < 0) break;
      count += 1;
      from = at + phrase.length;
      if (count >= 3) break;
    }
    if (count > 0) {
      score += weight * Math.min(count, 2);
      hits.push({ phrase, weight, count });
    }
  }
  return { score, hits };
}

function detectAction(text) {
  // 动作词按「具体程度」计分：继续（2）应压过「做什么」里的单字「做」（1），
  // 否则一句「继续长夜行，下一步做什么」会被判成新建。
  let best = { action: 'unknown', score: 0, hits: [] };
  for (const [action, phrases] of Object.entries(ACTIONS)) {
    let score = 0;
    const hits = [];
    for (const phrase of phrases) {
      if (phrase === '') continue;
      let from = 0;
      let count = 0;
      while (true) {
        const at = text.indexOf(phrase, from);
        if (at < 0) break;
        count += 1;
        from = at + phrase.length;
        if (count >= 3) break;
      }
      if (count === 0) continue;
      const weight = Math.min(phrase.length, 4);
      score += weight * Math.min(count, 2);
      hits.push({ phrase, weight, count });
    }
    if (score > best.score) best = { action, score, hits };
  }
  return best;
}

/**
 * @param {string} text 用户原话
 * @param {{workspaceKind?: 'story'|'drama'|'game'|'video'}} options 工作区上下文
 */
export function classifyCreativeIntent(text, options = {}) {
  const input = typeof text === 'string' ? text.trim() : '';
  if (input === '') {
    return { medium: 'unknown', action: 'unknown', confidence: 0, workspace: undefined, signals: [], candidates: [], nextSteps: ['先让用户说清楚要做什么（小说/短剧/游戏/解说）'] };
  }
  const lower = input.toLowerCase();
  const scores = { novel: 0, drama: 0, game: 0, video: 0, reference: 0 };
  const signals = [];
  for (const medium of Object.keys(scores)) {
    const strong = countSignals(lower, STRONG[medium], 4);
    const weak = countSignals(lower, WEAK[medium], 1);
    scores[medium] += strong.score + weak.score;
    signals.push(...strong.hits.map((hit) => ({ medium, ...hit })), ...weak.hits.map((hit) => ({ medium, ...hit })));
  }

  let action = detectAction(lower);
  let sourceMedium;
  let forcedMedium;
  const adaptation = [
    { medium: 'drama', regex: ADAPT_TO_DRAMA },
    { medium: 'game', regex: ADAPT_TO_GAME },
    { medium: 'video', regex: ADAPT_TO_VIDEO },
    { medium: 'novel', regex: ADAPT_TO_NOVEL }
  ].find((item) => item.regex.test(input));
  if (adaptation !== undefined) {
    forcedMedium = adaptation.medium;
    sourceMedium = adaptation.medium === 'novel' ? 'drama' : 'novel';
    scores[forcedMedium] += 6;
    action = { action: 'adapt', score: Math.max(3, action.score), hits: [{ phrase: '改编句式', weight: 3, count: 1 }] };
    signals.push({ medium: forcedMedium, phrase: '改编句式', weight: 3, count: 1 });
  }

  // 明确媒介词（强信号）优先：避免「故事」「设定」这种泛词把意图带偏。
  const strongOnly = {};
  for (const medium of Object.keys(scores)) strongOnly[medium] = countSignals(lower, STRONG[medium], 1).score;

  const workspaceKind = options.workspaceKind;
  if (workspaceKind !== undefined) {
    const mapped = workspaceKind === 'story' ? 'novel' : workspaceKind;
    if (mapped in scores) {
      const generic = action.action === 'continue' || action.action === 'revise' || action.action === 'unknown';
      const hasStrongElsewhere = Object.entries(strongOnly).some(([medium, score]) => medium !== mapped && score > 0);
      if (generic && !hasStrongElsewhere) scores[mapped] += 4;
      else scores[mapped] += 1;
      signals.push({ medium: mapped, phrase: '工作区上下文', weight: generic ? 4 : 1, count: 1 });
    }
  }

  const ranked = Object.entries(scores).filter(([, score]) => score > 0).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const total = ranked.reduce((sum, [, score]) => sum + score, 0);
  let medium = top === undefined ? 'unknown' : top[0];
  let confidence = top === undefined || total === 0 ? 0 : Math.min(0.99, Math.round((top[1] / total) * 100) / 100);

  // 两个媒介分接近且都有明确词：不硬猜，降置信度并标记待澄清。
  const second = ranked[1];
  if (second !== undefined && top !== undefined && top[1] > 0 && second[1] / top[1] > 0.85) {
    confidence = Math.min(confidence, 0.5);
  }
  if (medium !== 'unknown' && strongOnly[medium] === 0 && confidence < 0.35) {
    medium = 'unknown';
    confidence = 0;
  }

  const nextSteps = NEXT[medium + ':' + action.action] ?? NEXT[medium + ':create'] ?? ['先确认用户要产出的媒介与交付物'];
  return {
    medium,
    action: action.action,
    confidence,
    workspace: WORKSPACE_OF[medium],
    ...(medium === 'unknown' ? {} : { route: ENTRY[medium] }),
    ...(sourceMedium === undefined ? {} : { sourceMedium }),
    signals: signals.slice(0, 12),
    candidates: ranked.map(([key, score]) => ({ medium: key, score })),
    nextSteps
  };
}

export function describeIntent(result) {
  if (result.medium === 'unknown') {
    return ['意图：未识别（置信度 0）', '', '下一步：只问一个澄清问题——要做小说、短剧、游戏还是视频解说？'].join('\n');
  }
  const lines = [
    '意图：' + mediumLabel(result.medium) + ' · ' + actionLabel(result.action) + '（置信度 ' + result.confidence + '）',
    result.sourceMedium === undefined ? '' : '来源媒介：' + mediumLabel(result.sourceMedium) + '（按改编目标归到 ' + mediumLabel(result.medium) + '）',
    '',
    result.route === undefined ? '' : '工作台：' + result.route.tab + ' · 入口：' + result.route.tool + '（' + result.route.prompt + '）',
    '命中信号：' + result.signals.map((signal) => signal.phrase + '×' + String(signal.count)).join('、'),
    '候选：' + result.candidates.map((item) => mediumLabel(item.medium) + ' ' + String(item.score)).join(' / '),
    '',
    '下一步：',
    ...result.nextSteps.map((step) => '- ' + step)
  ];
  return lines.filter((line) => line !== undefined).join('\n');
}
