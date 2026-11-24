/**
 * 技能注册：随包技能 + 四套上游创作技能（小说/短剧/游戏/视频解说）。
 *
 * 不重写上游创作方法，只在加载时前置一段「宿主桥」：作品在本地文件、会话用宿主原生工具、
 * 媒体生成走已安装的多媒体网关插件（media_*）、付费前必须由创作者确认。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const HOST_BRIDGE = [
  '## 宿主桥（KToon 创作台）',
  '',
  '- 宿主是麒麟（QiLin）/ DSH：会话、模型、权限审批都用宿主原生界面；作品就是工作区里的普通文件，界面不另建数据库。',
  '- 创作台 **dsh-kylin-toon** 会按工作区里的创作文件自动展开：小说、短剧漫剧、互动游戏、视频解说四个页签。文件写出来，界面就跟上。',
  '- 媒体生成不在本插件里实现：出图、出视频、配音、配乐一律调用已安装的多媒体网关插件工具（`media_health` / `media_models` / `media_generate` / `media_job` / `media_upload`）。本插件不保存供应商密钥，也不要改走供应商 HTTP 接口。',
  '- 网关未就绪时，如实说明缺哪个能力或模型，让创作者在「设置 → 多媒体网关」补齐；不要用假产物占位。',
  '- 付费生成必须先预览再确认：先用 `media_models` 核对参数与候选模型，在对话里列出预检结果，得到创作者明确确认后才调用 `media_generate`；提交后用 `toon_production`（action=track_job）登记任务。画布点击不算确认。',
  '- 视频制作沿用 KToon 设计：镜头写清 **入场 / 出场 / 转场 / 时长**；交付前依次跑 `toon_shot_qc`、`toon_audio_qc`、`toon_gate`；装配用 `toon_assemble`（本机 ffmpeg，逐切点转场）。',
  '- 互动游戏需求先跑 `toon_game_intake`（只读识别原创/改编与工程）；用户确认后才 `toon_game_project action=init`。阶段完成度以 `toon_game_project action=status` 的文件证据为准，占位词不算完成。',
  ''
].join('\n');

export function parseFrontmatter(raw) {
  const fence = '---';
  if (!raw.startsWith(fence)) return { meta: {}, body: raw };
  const end = raw.indexOf(String.fromCharCode(10) + fence, fence.length);
  if (end < 0) return { meta: {}, body: raw };
  const head = raw.slice(fence.length, end);
  const body = raw.slice(end + fence.length + 1).replace(/^\n+/, '');
  const meta = {};
  for (const line of head.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (match === null) continue;
    meta[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return { meta, body };
}

function collectFrom(root, out) {
  if (!existsSync(root)) return;
  let entries;
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    const file = join(dir, 'SKILL.md');
    if (!existsSync(file)) continue;
    out.push({ dir, file });
  }
}

export function listBundledSkills(packageRoot) {
  const found = [];
  collectFrom(join(packageRoot, 'skills'), found);
  const knowledge = join(packageRoot, 'knowledge');
  if (existsSync(knowledge)) {
    for (const pack of readdirSync(knowledge, { withFileTypes: true })) {
      if (!pack.isDirectory()) continue;
      collectFrom(join(knowledge, pack.name, 'skills'), found);
    }
  }
  return found;
}

/** 注册所有随包技能；同名只保留第一个并告警。 */
/** 与宿主自带技能同名的条目必须跳过：注册同名技能会静默遮掉宿主版本。 */
const SHADOWED_SKILLS = new Set(['browser-cdp']);

export function installSkills(ctx, packageRoot, logger = console) {
  let skills;
  try {
    skills = ctx.get?.('skills') ?? ctx.skills;
  } catch { skills = undefined; }
  if (skills === undefined || typeof skills.register !== 'function') {
    logger.warn?.('[dsh-kylin-toon] 宿主没有可注册的 skills 服务，随包技能未注册');
    return [];
  }
  const disposers = [];
  const seen = new Map();
  for (const entry of listBundledSkills(packageRoot)) {
    const parsed = parseFrontmatter(readFileSync(entry.file, 'utf8'));
    const name = parsed.meta.name;
    if (name === undefined || name === '') {
      logger.warn?.('[dsh-kylin-toon] 技能缺少 name frontmatter：' + entry.file);
      continue;
    }
    if (SHADOWED_SKILLS.has(name)) {
      logger.log?.('[dsh-kylin-toon] 跳过会遮住宿主版本的技能：' + name);
      continue;
    }
    if (seen.has(name)) {
      logger.warn?.('[dsh-kylin-toon] 技能名重复，保留 ' + seen.get(name) + '，跳过 ' + entry.file);
      continue;
    }
    try {
      const dispose = skills.register({
        name,
        description: parsed.meta.description ?? '',
        source: 'runtime',
        content: HOST_BRIDGE + '\n' + parsed.body,
        resourceBase: { kind: 'directory', path: entry.dir }
      });
      if (typeof dispose === 'function') disposers.push(dispose);
      seen.set(name, entry.dir);
      logger.log?.('[dsh-kylin-toon] 已注册技能：' + name);
    } catch (error) {
      logger.warn?.('[dsh-kylin-toon] 技能注册失败（' + entry.file + '）：' + String(error));
    }
  }
  return disposers;
}
